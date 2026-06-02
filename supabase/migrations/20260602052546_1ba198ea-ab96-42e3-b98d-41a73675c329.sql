
-- 1. Fix mutable search_path on set_updated_at
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 2. Restrict family_invites SELECT to owners/admins (was: any family member)
DROP POLICY IF EXISTS "Family members view invites" ON public.family_invites;
CREATE POLICY "Owners/admins view invites"
  ON public.family_invites FOR SELECT
  TO authenticated
  USING (family_role_of(auth.uid(), family_id) = ANY (ARRAY['owner'::family_role, 'admin'::family_role]));

-- Also allow the invitee themselves to view their own invite (by email match) so they can accept it
CREATE POLICY "Invitee can view their own invite"
  ON public.family_invites FOR SELECT
  TO authenticated
  USING (
    accepted_at IS NULL
    AND expires_at > now()
    AND lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  );

-- 3. Prevent privilege escalation on user_families INSERT.
-- Previously any user could insert themselves into any family with any role.
-- Now: either (a) creating their own owner row for a family they just created,
-- or (b) accepting a valid unexpired invite that matches their email, with the role from the invite.
DROP POLICY IF EXISTS "Users can add themselves to a family" ON public.user_families;

CREATE POLICY "Owner self-insert on family creation"
  ON public.user_families FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'::family_role
    AND EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Join family via valid invite"
  ON public.user_families FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.family_invites i
      WHERE i.family_id = user_families.family_id
        AND i.accepted_at IS NULL
        AND i.expires_at > now()
        AND lower(i.email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
        AND i.role = user_families.role
    )
  );
