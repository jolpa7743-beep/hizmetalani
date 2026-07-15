
-- Add verification toggles to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS signup_email_otp_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_reset_otp_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS badge_email_otp_enabled boolean NOT NULL DEFAULT false;

-- Table for badge / verified-member email code challenges
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('badge_verification','profile_email')),
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_codes TO authenticated;
GRANT ALL ON public.verification_codes TO service_role;

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own codes read" ON public.verification_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own codes insert" ON public.verification_codes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own codes update" ON public.verification_codes
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_verification_codes_user_purpose
  ON public.verification_codes (user_id, purpose, created_at DESC);
