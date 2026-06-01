
-- =========================================================================
-- ENUMS
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.family_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.chore_status AS ENUM ('pending', 'in_progress', 'done');
CREATE TYPE public.meal_slot AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE public.goal_kind AS ENUM ('family', 'individual');
CREATE TYPE public.notification_kind AS ENUM ('event', 'chore', 'shopping', 'goal', 'family', 'system');

-- =========================================================================
-- GENERIC UPDATED_AT TRIGGER
-- =========================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================================
-- FAMILIES
-- =========================================================================
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER families_updated BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT ALL ON public.families TO service_role;

-- =========================================================================
-- USER <-> FAMILY MEMBERSHIP (role per family)
-- =========================================================================
CREATE TABLE public.user_families (
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  role public.family_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, family_id)
);
CREATE INDEX user_families_family_idx ON public.user_families(family_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_families TO authenticated;
GRANT ALL ON public.user_families TO service_role;

-- =========================================================================
-- SECURITY-DEFINER HELPERS (avoid recursive RLS)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.has_family_access(_user_id UUID, _family_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_families
    WHERE user_id = _user_id AND family_id = _family_id
  );
$$;

CREATE OR REPLACE FUNCTION public.family_role_of(_user_id UUID, _family_id UUID)
RETURNS public.family_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_families
  WHERE user_id = _user_id AND family_id = _family_id;
$$;

CREATE OR REPLACE FUNCTION public.current_family_id(_user_id UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT family_id FROM public.user_families
  WHERE user_id = _user_id
  ORDER BY (role = 'owner') DESC, created_at ASC
  LIMIT 1;
$$;

-- =========================================================================
-- FAMILIES RLS
-- =========================================================================
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their families" ON public.families
  FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), id));

CREATE POLICY "Authenticated users can create a family" ON public.families
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their family" ON public.families
  FOR UPDATE TO authenticated
  USING (public.family_role_of(auth.uid(), id) = 'owner')
  WITH CHECK (public.family_role_of(auth.uid(), id) = 'owner');

CREATE POLICY "Owners can delete their family" ON public.families
  FOR DELETE TO authenticated
  USING (public.family_role_of(auth.uid(), id) = 'owner');

-- =========================================================================
-- USER_FAMILIES RLS
-- =========================================================================
ALTER TABLE public.user_families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see their own family memberships" ON public.user_families
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_family_access(auth.uid(), family_id));

CREATE POLICY "Users can add themselves to a family" ON public.user_families
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can update memberships" ON public.user_families
  FOR UPDATE TO authenticated
  USING (public.family_role_of(auth.uid(), family_id) = 'owner');

CREATE POLICY "Users can remove themselves; owners can remove anyone" ON public.user_families
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.family_role_of(auth.uid(), family_id) = 'owner');

-- =========================================================================
-- USER ROLES (global)
-- =========================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users see their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================================
-- FAMILY MEMBERS (profiles inside a family; user_id optional)
-- =========================================================================
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID,  -- null = child/profile with no login
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  role TEXT NOT NULL DEFAULT 'Member' CHECK (char_length(role) BETWEEN 1 AND 40),
  color TEXT NOT NULL DEFAULT '#7c5cff',
  initial TEXT NOT NULL DEFAULT 'M' CHECK (char_length(initial) BETWEEN 1 AND 3),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX family_members_family_idx ON public.family_members(family_id);
CREATE TRIGGER family_members_updated BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;

CREATE POLICY "View family members" ON public.family_members FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), family_id));
CREATE POLICY "Manage family members" ON public.family_members FOR ALL TO authenticated
  USING (public.has_family_access(auth.uid(), family_id))
  WITH CHECK (public.has_family_access(auth.uid(), family_id));

-- =========================================================================
-- FAMILY INVITES
-- =========================================================================
CREATE TABLE public.family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID NOT NULL,
  role public.family_role NOT NULL DEFAULT 'member',
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX family_invites_family_idx ON public.family_invites(family_id);
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_invites TO authenticated;
GRANT ALL ON public.family_invites TO service_role;

CREATE POLICY "Family members view invites" ON public.family_invites FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), family_id));
CREATE POLICY "Owners/admins create invites" ON public.family_invites FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND public.family_role_of(auth.uid(), family_id) IN ('owner', 'admin')
  );
CREATE POLICY "Owners/admins update invites" ON public.family_invites FOR UPDATE TO authenticated
  USING (public.family_role_of(auth.uid(), family_id) IN ('owner', 'admin'));
CREATE POLICY "Owners/admins delete invites" ON public.family_invites FOR DELETE TO authenticated
  USING (public.family_role_of(auth.uid(), family_id) IN ('owner', 'admin'));

-- =========================================================================
-- EVENTS
-- =========================================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT CHECK (location IS NULL OR char_length(location) <= 200),
  member_ids UUID[] NOT NULL DEFAULT '{}',
  color TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_family_start_idx ON public.events(family_id, start_at);
CREATE TRIGGER events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

CREATE POLICY "View events" ON public.events FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), family_id));
CREATE POLICY "Manage events" ON public.events FOR ALL TO authenticated
  USING (public.has_family_access(auth.uid(), family_id))
  WITH CHECK (public.has_family_access(auth.uid(), family_id));

-- =========================================================================
-- CHORES
-- =========================================================================
CREATE TABLE public.chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  assigned_to UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  points INTEGER NOT NULL DEFAULT 10 CHECK (points BETWEEN 0 AND 1000),
  due_date DATE,
  recurrence TEXT,  -- 'none' | 'daily' | 'weekly' | 'monthly'
  status public.chore_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chores_family_idx ON public.chores(family_id, status);
CREATE UNIQUE INDEX chores_unique_title_due ON public.chores(family_id, lower(title), COALESCE(due_date, DATE '1970-01-01'));
CREATE TRIGGER chores_updated BEFORE UPDATE ON public.chores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chores TO authenticated;
GRANT ALL ON public.chores TO service_role;

CREATE POLICY "View chores" ON public.chores FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), family_id));
CREATE POLICY "Manage chores" ON public.chores FOR ALL TO authenticated
  USING (public.has_family_access(auth.uid(), family_id))
  WITH CHECK (public.has_family_access(auth.uid(), family_id));

-- =========================================================================
-- SHOPPING ITEMS
-- =========================================================================
CREATE TABLE public.shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  category TEXT NOT NULL DEFAULT 'Pantry' CHECK (char_length(category) BETWEEN 1 AND 40),
  quantity TEXT CHECK (quantity IS NULL OR char_length(quantity) <= 40),
  done BOOLEAN NOT NULL DEFAULT false,
  ai_suggested BOOLEAN NOT NULL DEFAULT false,
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shopping_items_family_idx ON public.shopping_items(family_id, done);
CREATE TRIGGER shopping_items_updated BEFORE UPDATE ON public.shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_items TO authenticated;
GRANT ALL ON public.shopping_items TO service_role;

CREATE POLICY "View shopping" ON public.shopping_items FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), family_id));
CREATE POLICY "Manage shopping" ON public.shopping_items FOR ALL TO authenticated
  USING (public.has_family_access(auth.uid(), family_id))
  WITH CHECK (public.has_family_access(auth.uid(), family_id));

-- =========================================================================
-- MEALS
-- =========================================================================
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot public.meal_slot NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  recipe TEXT CHECK (recipe IS NULL OR char_length(recipe) <= 4000),
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, date, slot)
);
CREATE INDEX meals_family_date_idx ON public.meals(family_id, date);
CREATE TRIGGER meals_updated BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;

CREATE POLICY "View meals" ON public.meals FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), family_id));
CREATE POLICY "Manage meals" ON public.meals FOR ALL TO authenticated
  USING (public.has_family_access(auth.uid(), family_id))
  WITH CHECK (public.has_family_access(auth.uid(), family_id));

-- =========================================================================
-- GOALS
-- =========================================================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  emoji TEXT NOT NULL DEFAULT '🎯' CHECK (char_length(emoji) BETWEEN 1 AND 8),
  kind public.goal_kind NOT NULL DEFAULT 'family',
  owner_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  target NUMERIC NOT NULL CHECK (target > 0),
  current NUMERIC NOT NULL DEFAULT 0 CHECK (current >= 0),
  unit TEXT NOT NULL DEFAULT '' CHECK (char_length(unit) <= 24),
  streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
  last_logged_on DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX goals_family_idx ON public.goals(family_id);
CREATE TRIGGER goals_updated BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;

CREATE POLICY "View goals" ON public.goals FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), family_id));
CREATE POLICY "Manage goals" ON public.goals FOR ALL TO authenticated
  USING (public.has_family_access(auth.uid(), family_id))
  WITH CHECK (public.has_family_access(auth.uid(), family_id));

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID,  -- null = whole-family notification
  kind public.notification_kind NOT NULL DEFAULT 'system',
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  body TEXT CHECK (body IS NULL OR char_length(body) <= 1000),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_family_idx ON public.notifications(family_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

CREATE POLICY "View notifications" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_family_access(auth.uid(), family_id) AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_family_access(auth.uid(), family_id));
CREATE POLICY "Update notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (public.has_family_access(auth.uid(), family_id) AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Delete notifications" ON public.notifications FOR DELETE TO authenticated
  USING (public.has_family_access(auth.uid(), family_id) AND (user_id IS NULL OR user_id = auth.uid()));

-- =========================================================================
-- AUTO-SEED ON NEW USER SIGNUP
-- Creates a starter family + sample data so the app looks alive.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_family_id UUID;
  display_name TEXT;
  family_label TEXT;
  m_mom UUID; m_dad UUID; m_kid1 UUID; m_kid2 UUID;
BEGIN
  display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1),
    'Friend'
  );
  family_label := 'The ' || initcap(split_part(display_name, ' ', 1)) || ' Family';

  INSERT INTO public.families (name, owner_id) VALUES (family_label, NEW.id)
    RETURNING id INTO new_family_id;

  INSERT INTO public.user_families (user_id, family_id, role)
    VALUES (NEW.id, new_family_id, 'owner');

  -- Sample family members
  INSERT INTO public.family_members (family_id, user_id, name, role, color, initial, points)
    VALUES (new_family_id, NEW.id, initcap(split_part(display_name, ' ', 1)), 'Parent', '#7c5cff', upper(left(display_name, 1)), 0)
    RETURNING id INTO m_mom;
  INSERT INTO public.family_members (family_id, name, role, color, initial, points)
    VALUES (new_family_id, 'Partner', 'Parent', '#22c55e', 'P', 0) RETURNING id INTO m_dad;
  INSERT INTO public.family_members (family_id, name, role, color, initial, points)
    VALUES (new_family_id, 'Sarah', 'Child', '#f59e0b', 'S', 45) RETURNING id INTO m_kid1;
  INSERT INTO public.family_members (family_id, name, role, color, initial, points)
    VALUES (new_family_id, 'Jake', 'Child', '#06b6d4', 'J', 30) RETURNING id INTO m_kid2;

  -- Sample chores
  INSERT INTO public.chores (family_id, title, assigned_to, points, due_date, status, created_by) VALUES
    (new_family_id, 'Take out the trash', m_kid2, 5, CURRENT_DATE, 'pending', NEW.id),
    (new_family_id, 'Load the dishwasher', m_kid1, 10, CURRENT_DATE, 'pending', NEW.id),
    (new_family_id, 'Walk the dog', m_mom, 15, CURRENT_DATE, 'done', NEW.id),
    (new_family_id, 'Tidy living room', m_dad, 10, CURRENT_DATE + 1, 'pending', NEW.id);

  -- Sample shopping
  INSERT INTO public.shopping_items (family_id, name, category, added_by) VALUES
    (new_family_id, 'Milk', 'Dairy', NEW.id),
    (new_family_id, 'Bananas', 'Produce', NEW.id),
    (new_family_id, 'Bread', 'Bakery', NEW.id),
    (new_family_id, 'Olive oil', 'Pantry', NEW.id),
    (new_family_id, 'Paper towels', 'Household', NEW.id);

  -- Sample meals (today + tomorrow)
  INSERT INTO public.meals (family_id, date, slot, title, ingredients, created_by) VALUES
    (new_family_id, CURRENT_DATE, 'breakfast', 'Oatmeal & berries', ARRAY['oats','milk','berries'], NEW.id),
    (new_family_id, CURRENT_DATE, 'lunch', 'Chicken wraps', ARRAY['tortilla','chicken','lettuce'], NEW.id),
    (new_family_id, CURRENT_DATE, 'dinner', 'Pasta primavera', ARRAY['pasta','tomatoes','basil','parmesan'], NEW.id),
    (new_family_id, CURRENT_DATE + 1, 'dinner', 'Sheet-pan salmon', ARRAY['salmon','broccoli','lemon'], NEW.id);

  -- Sample goals
  INSERT INTO public.goals (family_id, title, emoji, kind, target, current, unit, streak, created_by) VALUES
    (new_family_id, 'Vacation fund', '✈️', 'family', 500, 175, '€', 0, NEW.id),
    (new_family_id, 'Read 10 books', '📚', 'family', 10, 3, 'books', 0, NEW.id);
  INSERT INTO public.goals (family_id, title, emoji, kind, owner_id, target, current, unit, streak, created_by) VALUES
    (new_family_id, 'Exercise 3x/week', '🏃', 'individual', m_mom, 3, 2, 'sessions', 5, NEW.id);

  -- Welcome notification
  INSERT INTO public.notifications (family_id, user_id, kind, title, body)
    VALUES (new_family_id, NEW.id, 'system', 'Welcome to FamilyFlow AI', 'Your family workspace is ready. Invite others from Settings.');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
