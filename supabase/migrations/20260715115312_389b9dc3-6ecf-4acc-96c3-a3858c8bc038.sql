
CREATE TABLE public.smtp_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  host text NOT NULL DEFAULT '',
  port integer NOT NULL DEFAULT 587,
  username text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '',
  from_email text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT '',
  secure boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smtp_settings_singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE ON public.smtp_settings TO authenticated;
GRANT ALL ON public.smtp_settings TO service_role;

ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smtp_admin_select" ON public.smtp_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "smtp_admin_update" ON public.smtp_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "smtp_admin_insert" ON public.smtp_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.smtp_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
