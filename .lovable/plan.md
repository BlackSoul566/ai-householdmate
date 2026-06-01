# FamilyFlow AI — Backend & CRUD Plan

Move the app from mock arrays to a real backend powered by Lovable Cloud (Supabase under the hood), with email+Google auth, multi-user families with invites, and full CRUD on every section.

## 1. Enable Lovable Cloud & Auth

- Enable Lovable Cloud (provisions DB, auth, storage).
- Enable Email/Password + Google sign-in (via `configure_social_auth`).
- New routes: `/login`, `/signup`, `/auth/callback`, `/reset-password`.
- `_authenticated` layout route guards every app page; unauthed → `/login`.
- Root `onAuthStateChange` listener invalidates router + query cache.

## 2. Database Schema (migrations)

All tables in `public`, with `created_at` / `updated_at` (trigger), RLS enabled, and explicit GRANTs to `authenticated` + `service_role`.

```text
families(id, name, owner_id, created_at, updated_at)
family_members(id, family_id, user_id?, name, role, color, initial, points, created_at, updated_at)
   -- user_id nullable: lets parents create "child" profiles without their own login
family_invites(id, family_id, email, token, invited_by, accepted_at, expires_at, created_at)
user_families(user_id, family_id, role)  -- membership + 'owner'|'admin'|'member'
app_role enum + user_roles(user_id, role) -- for global admin checks

events(id, family_id, title, description, start_at, end_at, all_day, location, member_ids[], created_by, created_at, updated_at)
chores(id, family_id, title, assigned_to, points, due_date, recurrence, status, completed_at, completed_by, created_by, created_at, updated_at)
shopping_items(id, family_id, name, category, quantity, done, ai_suggested, added_by, created_at, updated_at)
meals(id, family_id, date, slot, title, recipe, ingredients[], dietary_tags[], created_by, created_at, updated_at)
goals(id, family_id, title, emoji, kind, owner_id?, target, current, unit, streak, created_by, created_at, updated_at)
notifications(id, family_id, user_id, kind, title, body, read_at, created_at)
```

**RLS pattern (no recursion):** `has_family_access(_uid, _family_id)` SECURITY DEFINER function checks `user_families`. Every table policy is `USING (has_family_access(auth.uid(), family_id))`. Writes additionally check role for destructive ops.

**Auto-seed:** `handle_new_user()` trigger on `auth.users` → creates a default family ("The Smiths" or username's family), inserts owner into `user_families`, seeds sample members + chores + meals + goals so the app looks alive immediately.

## 3. Data Layer

- `src/lib/db/*.functions.ts` — one file per entity (events, chores, shopping, meals, goals, members, notifications, family). Each exports `list / get / create / update / delete` server functions protected by `requireSupabaseAuth`, plus Zod input validators.
- `src/lib/db/queries.ts` — TanStack Query `queryOptions` factories per entity.
- `src/lib/types.ts` — DB-derived TS types (regenerate via Supabase types).
- Current family is derived server-side from `user_families` (first/active family); `useCurrentFamily()` hook exposes id to components.

## 4. UI Refactor (per page)

All pages move from `useState(INITIAL_*)` to `useSuspenseQuery` + `useMutation` with optimistic updates where it improves UX, plus loading skeletons and `errorComponent` per route.

- **Calendar** — event dialog (create/edit), delete confirm, member filter persists in URL search.
- **Chores** — add/edit dialog, assign dropdown, toggle complete (awards points), delete.
- **Shopping** — inline add, toggle done, edit name/category, delete; AI suggest stays client-side but writes to DB.
- **Meals** — weekly grid with dialog per slot, "Generate shopping list" calls server fn that bulk-inserts items.
- **Goals** — create/edit dialog, log progress mutation (increments `current`, updates streak), delete.
- **Settings → Family** — add/edit/remove members; invite by email (writes `family_invites`, sends invite link); accept-invite route `/invite/$token`.
- **Notifications** — bell dropdown fetches from DB; mark read/unread/delete; server-side triggers (DB triggers) create notifications on overdue chores & upcoming events.

## 5. Quality & Safety

- Zod validators on every server fn input (length caps, enums, UUID format).
- Optimistic mutations roll back on error; toast on failure (sonner).
- Loading: route-level `pendingComponent` skeletons; mutation buttons disable + spinner.
- Pagination on events (`loaderDeps` window), chores (status filter), notifications (limit 50).
- No duplicate chore titles per family per due_date (unique index).

## Deliverables summary I'll provide at the end

- List of new tables + columns + relationships
- RLS / GRANT summary
- CRUD matrix (✓ for each section × C/R/U/D)
- Seed function behaviour
- Any follow-ups (e.g. real email sending for invites requires Resend setup — out of scope unless you say so)

## Scope notes / cuts

- Email delivery for invites: I'll create the invite row + shareable link in-app; **sending the email** would need Resend (extra secret). Confirm if you want that wired now.
- Realtime sync across devices (Supabase Realtime channels) — not in this pass unless requested.
- AI Assistant page stays on mock responses; wiring it to Lovable AI Gateway is a separate task.
- Existing mock data in `family-data.ts` becomes seed templates only; runtime reads come from DB.

This is a large implementation (~25–30 new/edited files, 1 migration). Approve and I'll build it end-to-end.