
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS adsense_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adsense_slot_header text,
  ADD COLUMN IF NOT EXISTS adsense_slot_in_article text,
  ADD COLUMN IF NOT EXISTS adsense_slot_sidebar text,
  ADD COLUMN IF NOT EXISTS adsense_slot_footer text;
