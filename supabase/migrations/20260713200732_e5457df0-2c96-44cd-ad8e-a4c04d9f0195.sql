
UPDATE auth.users SET encrypted_password = crypt('demo1234', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email = 'demo@demo.com';
UPDATE auth.users SET encrypted_password = crypt('admin123', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email = 'admin@admin.com';
