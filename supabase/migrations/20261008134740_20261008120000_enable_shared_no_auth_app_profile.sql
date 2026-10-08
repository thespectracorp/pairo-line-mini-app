/*
# Enable the no-login wardrobe experience

1. New Tables
- `public.app_profile`
- `id` (text, fixed `default` key for the single shared app profile)
- `display_name` (text, editable name shown in Profile)
- `email` (text, editable email shown in Profile)
- `created_at` and `updated_at` (timestamps)

2. Modified Tables
- `public.wardrobe_items` keeps its existing data and nullable `user_id` column.
- Existing authenticated-only access is extended with intentional anonymous access because this app has no sign-in screen.

3. Security
- Row-level security remains enabled on `wardrobe_items`.
- Four separate CRUD policies allow anon and authenticated users to use the intentionally shared wardrobe.
- Row-level security is enabled on `app_profile` with four separate CRUD policies for the intentionally shared profile.
- Anonymous access is limited to the app's own tables and does not require Supabase Anonymous Sign-in.

4. Important Notes
- This app is configured as a shared, no-login experience until a sign-in flow is added.
- The existing private `profiles` table is preserved and is not deleted.
- Existing wardrobe images and rows are preserved.
*/

CREATE TABLE IF NOT EXISTS public.app_profile (
  id text PRIMARY KEY DEFAULT 'default',
  display_name text NOT NULL DEFAULT 'Fashion Lover',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_profile_select_shared" ON public.app_profile;
CREATE POLICY "app_profile_select_shared" ON public.app_profile
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "app_profile_insert_shared" ON public.app_profile;
CREATE POLICY "app_profile_insert_shared" ON public.app_profile
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "app_profile_update_shared" ON public.app_profile;
CREATE POLICY "app_profile_update_shared" ON public.app_profile
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "app_profile_delete_shared" ON public.app_profile;
CREATE POLICY "app_profile_delete_shared" ON public.app_profile
FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_profile TO anon, authenticated;

DROP POLICY IF EXISTS "wardrobe_items_select" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_select" ON public.wardrobe_items
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "wardrobe_items_insert" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_insert" ON public.wardrobe_items
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "wardrobe_items_update" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_update" ON public.wardrobe_items
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wardrobe_items_delete" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_delete" ON public.wardrobe_items
FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wardrobe_items TO anon, authenticated;
