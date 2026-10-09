/*
# Add required profile details and consent records

1. Modified Table
- `public.app_profile` gains `age` (integer), `gender` (text), `height_cm` (numeric), and `weight_kg` (numeric).
- `age` and `gender` are collected as required form fields.
- `height_cm` and `weight_kg` are optional measurements.

2. Consent Records
- `terms_accepted` records acceptance of the Terms of Service and Privacy Policy.
- `personalization_consent` records permission to use profile and style data for personalized recommendations and LINE communications.
- `consent_recorded_at` records when both consent choices were saved.

3. Security
- The existing no-login app_profile RLS policies remain unchanged and continue to support anon and authenticated app access.
- Consent values are stored with the same customer profile row identified by `app_profile.id`.

4. Data Safety
- All new columns are nullable or have safe defaults so existing customer profiles remain readable and are not deleted or invalidated.
- No existing columns or rows are removed.
*/

ALTER TABLE public.app_profile
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS personalization_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_recorded_at timestamptz;
