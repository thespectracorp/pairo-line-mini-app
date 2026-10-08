/*
# Add LINE customer identity routing

1. New Columns
- `public.wardrobe_items.customer_key` stores the app-level customer identity used to separate each customer's wardrobe when the app has no Supabase sign-in.

2. Modified Tables
- `public.wardrobe_items` gains a nullable `customer_key` so all existing rows remain intact.
- `public.app_profile.id` is already the per-customer profile key and will be used with the LINE customer key.

3. Security
- Existing no-login CRUD policies remain in place because this app intentionally operates without a sign-in screen.
- The customer key is a routing identifier, not a secret or authorization mechanism. LINE identity is resolved by LIFF when configured; a persistent browser identifier is used outside LIFF.

4. Important Notes
- Existing wardrobe data is preserved and remains available as legacy data.
- New uploads are stamped with the current customer's key.
- IP addresses are deliberately not used as identity because they are shared, unstable, and unsuitable for customer ownership.
*/

ALTER TABLE public.wardrobe_items
ADD COLUMN IF NOT EXISTS customer_key text;

CREATE INDEX IF NOT EXISTS wardrobe_items_customer_key_created_at_idx
ON public.wardrobe_items (customer_key, created_at DESC);
