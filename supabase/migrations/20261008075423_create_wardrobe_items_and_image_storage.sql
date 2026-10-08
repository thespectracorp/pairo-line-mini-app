/*
# Create wardrobe items and image storage for PAIRO

1. New Tables
- `wardrobe_items`
- `id` (uuid, primary key)
- `category` (text, one of shirts, jackets, pants, shoes)
- `image_url` (text, stored image URL)
- `created_at` (timestamp, creation time)

2. Storage
- Create the `wardrobe-images` bucket for uploaded clothing photos.
- The bucket is public so the no-login app can render uploaded images.

3. Security
- Enable RLS on `wardrobe_items`.
- Allow anonymous and authenticated visitors to read, insert, update, and delete shared wardrobe items.
- Allow anonymous and authenticated visitors to manage objects in the `wardrobe-images` bucket.

4. Important Notes
- This app does not currently have sign-in, so wardrobe items are intentionally shared through the public app.
- Category values are constrained to the four categories used by the upload dialog.
*/

CREATE TABLE IF NOT EXISTS public.wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('shirts', 'jackets', 'pants', 'shoes')),
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wardrobe_items_select" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_select" ON public.wardrobe_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "wardrobe_items_insert" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_insert" ON public.wardrobe_items FOR INSERT TO anon, authenticated WITH CHECK (category IN ('shirts', 'jackets', 'pants', 'shoes'));

DROP POLICY IF EXISTS "wardrobe_items_update" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_update" ON public.wardrobe_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (category IN ('shirts', 'jackets', 'pants', 'shoes'));

DROP POLICY IF EXISTS "wardrobe_items_delete" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_delete" ON public.wardrobe_items FOR DELETE TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe-images', 'wardrobe-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "wardrobe_images_select" ON storage.objects;
CREATE POLICY "wardrobe_images_select" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'wardrobe-images');

DROP POLICY IF EXISTS "wardrobe_images_insert" ON storage.objects;
CREATE POLICY "wardrobe_images_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'wardrobe-images');

DROP POLICY IF EXISTS "wardrobe_images_update" ON storage.objects;
CREATE POLICY "wardrobe_images_update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'wardrobe-images') WITH CHECK (bucket_id = 'wardrobe-images');

DROP POLICY IF EXISTS "wardrobe_images_delete" ON storage.objects;
CREATE POLICY "wardrobe_images_delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'wardrobe-images');