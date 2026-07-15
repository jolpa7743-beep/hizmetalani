
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS adsense_test_mode boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.category_groups (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.category_groups TO anon, authenticated;
GRANT ALL ON public.category_groups TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.category_groups_id_seq TO authenticated, service_role;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "category_groups readable" ON public.category_groups FOR SELECT USING (true);
CREATE POLICY "category_groups admin write" ON public.category_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.category_overrides (
  key text PRIMARY KEY,
  label text,
  short_label text,
  group_key text REFERENCES public.category_groups(key) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.category_overrides TO anon, authenticated;
GRANT ALL ON public.category_overrides TO service_role;
ALTER TABLE public.category_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "category_overrides readable" ON public.category_overrides FOR SELECT USING (true);
CREATE POLICY "category_overrides admin write" ON public.category_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.category_groups (key, label, sort_order) VALUES
  ('bakim', 'Bakım Hizmetleri', 10),
  ('temizlik', 'Temizlik Hizmetleri', 20),
  ('evcil', 'Evcil Hayvan', 30)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.category_overrides (key, group_key, sort_order) VALUES
  ('bakici', 'bakim', 10),
  ('ev_temizlik', 'temizlik', 10),
  ('ofis_temizlik', 'temizlik', 20),
  ('merdiven_temizlik', 'temizlik', 30),
  ('evcil_yuva_arayan', 'evcil', 10),
  ('evcil_yuva_veren', 'evcil', 20)
ON CONFLICT (key) DO NOTHING;
