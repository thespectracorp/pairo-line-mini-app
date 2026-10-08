/*
# Add saved outfit items

1. Modified Tables
- `public.wardrobe_items.category` now also accepts `outfits` for one saved image made from a shirt, pants, and shoes.
- Existing clothing categories and rows are unchanged.

2. Security
- Refresh the anonymous and authenticated insert/update policies so the new `outfits` category is accepted.
- Existing shared no-login access remains unchanged.

3. Important Notes
- Saved outfits reuse the existing public wardrobe image storage bucket.
- This migration does not delete or alter any existing wardrobe image data.
*/

ALTER TABLE public.wardrobe_items
  DROP CONSTRAINT IF EXISTS wardrobe_items_category_check;

ALTER TABLE public.wardrobe_items
  ADD CONSTRAINT wardrobe_items_category_check
  CHECK (category IN ('shirts', 'jackets', 'pants', 'shoes', 'outfits'));

DROP POLICY IF EXISTS "wardrobe_items_insert" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_insert" ON public.wardrobe_items
FOR INSERT TO anon, authenticated
WITH CHECK (category IN ('shirts', 'jackets', 'pants', 'shoes', 'outfits'));

DROP POLICY IF EXISTS "wardrobe_items_update" ON public.wardrobe_items;
CREATE POLICY "wardrobe_items_update" ON public.wardrobe_items
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (category IN ('shirts', 'jackets', 'pants', 'shoes', 'outfits'));
