-- Demo seed user + example listings
DO $$
DECLARE
  demo_id uuid := '00000000-0000-0000-0000-0000000000d1';
BEGIN
  -- Create demo auth user if missing
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_id) THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user
    ) VALUES (
      demo_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'demo@hizmetalani.com', crypt('demo-not-usable', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"seed","providers":["seed"]}'::jsonb,
      '{"full_name":"Demo Kullanıcı"}'::jsonb,
      false, false
    );
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, full_name, city)
  VALUES (demo_id, 'Demo Kullanıcı', 'İstanbul')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Insert example listings (idempotent via title check)
INSERT INTO public.listings (user_id, type, category, title, description, city, district, price, price_type, status)
SELECT * FROM (VALUES
  ('00000000-0000-0000-0000-0000000000d1'::uuid, 'offering'::public.listing_type, 'bakici'::public.listing_category,
   'Deneyimli çocuk bakıcısı – Kadıköy',
   '10 yıl deneyimli, referanslı çocuk bakıcısıyım. 0-6 yaş grubu ile ilgilenirim. Haftada 5 gün, tam zamanlı çalışabilirim. Kadıköy ve çevre ilçeler tercihimdir.',
   'İstanbul', 'Kadıköy', 15000, 'monthly'::public.price_type, 'active'::public.listing_status),

  ('00000000-0000-0000-0000-0000000000d1'::uuid, 'seeking', 'bakici',
   'Yaşlı hasta bakıcısı aranıyor – Çankaya',
   'Annem için hafta içi gündüz saatlerinde ilgilenecek, sabırlı ve deneyimli bir bakıcı arıyoruz. Yatalak değil, sadece refakat ve ev işlerinde destek gerekiyor.',
   'Ankara', 'Çankaya', 250, 'hourly', 'active'),

  ('00000000-0000-0000-0000-0000000000d1', 'offering', 'ev_temizlik',
   'Detaylı ev temizliği yapıyorum – Beşiktaş',
   'Cam, mutfak, banyo, oda dahil komple ev temizliği yapıyorum. Kendi malzemem mevcut, referanslarım vardır. Haftalık veya günlük çalışırım.',
   'İstanbul', 'Beşiktaş', 1800, 'daily', 'active'),

  ('00000000-0000-0000-0000-0000000000d1', 'seeking', 'ev_temizlik',
   'Haftada 1 gün ev temizliği için yardımcı',
   '3+1 daire, 2 kişilik aile. Perşembe günleri 5-6 saatlik temizlik için düzenli çalışacak, güvenilir bir kişi arıyoruz.',
   'İzmir', 'Karşıyaka', 1500, 'daily', 'active'),

  ('00000000-0000-0000-0000-0000000000d1', 'offering', 'ofis_temizlik',
   'Kurumsal ofis temizliği – Anadolu Yakası',
   'Küçük ve orta ölçekli ofisler için mesai sonrası temizlik hizmeti veriyorum. Aylık sabit sözleşme mümkündür. Fatura kesilebilir.',
   'İstanbul', 'Ataşehir', NULL, 'negotiable', 'active'),

  ('00000000-0000-0000-0000-0000000000d1', 'offering', 'merdiven_temizlik',
   'Apartman merdiveni haftalık temizlik',
   '5 katlı binalara kadar haftalık düzenli merdiven ve giriş temizliği. Cam silme dahil. Yıllık anlaşmalarda %10 indirim.',
   'Bursa', 'Nilüfer', 2500, 'monthly', 'active'),

  ('00000000-0000-0000-0000-0000000000d1', 'seeking', 'evcil_yuva_arayan',
   'Kedim için 2 haftalık geçici yuva – tatil',
   '3 yaşındaki uysal, aşıları tam kedim Pamuk için 15-30 Ağustos arası geçici yuva arıyorum. Mama ve kumu tarafımdan karşılanır.',
   'Antalya', 'Muratpaşa', NULL, 'negotiable', 'active'),

  ('00000000-0000-0000-0000-0000000000d1', 'offering', 'evcil_yuva_veren',
   'Köpeğinize evimde geçici yuva – bahçeli ev',
   'Bahçeli müstakil evimde, köpek deneyimli bir aileyiz. Kısa süreli (1-4 hafta) köpek konaklaması sağlıyoruz. Günlük yürüyüş ve oyun garantili.',
   'Muğla', 'Bodrum', 400, 'daily', 'active')
) AS v(user_id, type, category, title, description, city, district, price, price_type, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.listings l WHERE l.title = v.title
);