/*
# Add private user profiles and ownership

1. New Tables
- `public.profiles`
- `user_id` (uuid, one profile per authenticated app user)
- `display_name` (text, editable profile name)
- `email` (text, editable profile email)
- `created_at` and `updated_at` (timestamps)

2. Modified Tables
- `public.wardrobe_items` now has nullable `user_id` for ownership. Existing legacy rows remain untouched but are not shown to newly authenticated users.

3. Security
- Replace shared wardrobe row access with authenticated owner-only CRUD policies.
- Enable row-level security on profiles and allow each authenticated user to access only their own profile.
- Anonymous sign-in creates a separate private app identity without showing a login screen.

4. Important Notes
- New users start with an empty wardrobe and zero saved outfits.
- Existing shared legacy rows are preserved and are not deleted.
- The existing upload function will use the signed-in user's session when creating new rows.
*/

ALTER TABLE public.wardrobe_items
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS wardrobe_items_user_id_idx ON public.wardrobe_items(user_id);

ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wardrobe_items_select" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_select" ON public.wardrobe_items
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wardrobe_items_insert" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_insert" ON public.wardrobe_items
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wardrobe_items_update" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_update" ON public.wardrobe_items
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wardrobe_items_delete" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_delete" ON public.wardrobe_items
FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.wardrobe_items FROM anon;
REVOKE ALL ON public.wardrobe_items FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wardrobe_items TO authenticated;

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Fashion Lover',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
