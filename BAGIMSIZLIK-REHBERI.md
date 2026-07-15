# Lovable'dan Tam Bağımsızlık Rehberi — hizmetalani.com

Bu rehber, projeyi **Lovable'dan tamamen koparıp** kendi VDS + kendi Supabase üzerinde çalıştırır. Lovable aboneliği bitse bile site çalışmaya devam eder.

> **Önce oku:** Bu ciddi bir DevOps işi. Bittiğinde:
> - Lovable'da düzenleme yapamazsın (istersen ayrıca Lovable kopyasını çalıştırabilirsin)
> - Tüm bakım/güncelleme sana ait
> - **Google girişi** kendi OAuth ayarlarınla çalışır (Lovable broker yok)
> - Admin işlemleri kendi service_role key'inle çalışır

---

## Genel akış (özet)

1. Kendi Supabase projeni aç
2. Şemayı + verileri Lovable Cloud'dan yeni Supabase'e taşı
3. Google OAuth'u kendi Google Cloud hesabında kur
4. Kodda Lovable-özgü kısımları değiştir
5. VDS'ye deploy et (KURULUM-UBUNTU.md'deki adımlar + burada güncellenen `.env`)

---

## 1. Kendi Supabase projesini aç

1. https://supabase.com → "Sign up" (GitHub ile giriş kolay)
2. **New Project** → Organization seç
   - **Project name:** `hizmetalani`
   - **Database Password:** güçlü bir şifre (SAKLA! bir daha gösterilmez)
   - **Region:** `Central EU (Frankfurt)` — Türkiye'ye en yakın
   - **Plan:** Free (500 MB DB, 1 GB storage, 50k aylık aktif kullanıcı — başlangıç için yeterli)
3. Proje 2-3 dakikada kurulur.
4. Sol menü → **Project Settings → API**:
   - `Project URL` → **not al** (örn: `https://abcdefg.supabase.co`)
   - `anon public` key → **not al**
   - `service_role` key → **not al** (gizli, kimseyle paylaşma)
5. **Project Settings → Database → Connection string → URI** → not al (migration'lar için)

---

## 2. Şemayı yeni Supabase'e taşı

Bu projede **21 migration** dosyası var (`supabase/migrations/`). Bunlar veritabanı yapısını sıfırdan kurar.

### 2a. Supabase CLI kur (kendi bilgisayarında)

```bash
# macOS
brew install supabase/tap/supabase

# Windows (Scoop)
scoop install supabase

# Linux
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

Kontrol: `supabase --version`

### 2b. Projeyi bağla ve migration'ları çalıştır

Proje klasöründe (kendi bilgisayarında, KURULUM-UBUNTU.md'deki gibi indirilmiş):

```bash
cd hizmetalani
supabase login                              # tarayıcı açar, giriş yap
supabase link --project-ref YENI_PROJECT_REF   # abcdefg kısmı
# şifre isteyecek → 1. adımdaki DB şifresini yapıştır
supabase db push
```

`db push` tüm migration'ları sırayla yeni Supabase'ine uygular. 1-2 dakika sürer.

Kontrol: Supabase dashboard → **Table Editor** → tabloları görmelisin (profiles, listings, reviews, ...)

### 2c. Verileri taşı (opsiyonel — yeni başlıyorsan atla)

**Eğer Lovable'daki mevcut kullanıcı/ilan verilerini taşımak istiyorsan:**

Lovable'da: **Cloud → Advanced Settings → Export data** → ZIP indir.

İçinden gelen CSV'leri Supabase dashboard'da **Table Editor → Import data from CSV** ile tek tek yükle. Sıra önemli:
1. `profiles` (önce auth.users'ı manuel eklemeyi göze al — bu zor kısım, atlayıp yeni baştan başlamak daha kolay)
2. `category_groups`
3. `listings`
4. `reviews`, `conversations`, `messages`
5. `user_roles`, `site_settings`, `announcements`, ...

> **Dürüst tavsiye:** Site henüz canlı ve gerçek kullanıcı yoksa, veri taşımayı atla. Sıfırdan başla, `admin@admin.com / admin123` demo hesabı `seedDemoUsers` fonksiyonuyla yeni kurulumda da oluşur.

---

## 3. Google OAuth'u kendi hesabında kur

Şu an Google girişi **Lovable broker** ile çalışıyor. Kendine taşıman gerek.

### 3a. Google Cloud Console

1. https://console.cloud.google.com → yeni proje: `hizmetalani`
2. Sol menü → **APIs & Services → OAuth consent screen**
   - User Type: **External** → Create
   - App name: `hizmetalani`
   - Support email: kendi email'in
   - Authorized domain: `hizmetalani.com`, `supabase.co`
   - Kaydet
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Type: **Web application**
   - Name: `hizmetalani-web`
   - **Authorized JavaScript origins:**
     - `https://hizmetalani.com`
     - `https://www.hizmetalani.com`
     - `http://localhost:3000` (test için)
   - **Authorized redirect URIs:**
     - `https://YENI_PROJECT_REF.supabase.co/auth/v1/callback`
   - Create → **Client ID** ve **Client Secret** göster → not al

### 3b. Supabase'e ekle

Supabase dashboard → **Authentication → Providers → Google:**
- Enable: ON
- Client ID: (yukarıdan)
- Client Secret: (yukarıdan)
- Save

Redirect URL Supabase gösterecek — bir üstteki Google ayarında olduğundan emin ol.

---

## 4. Koddaki Lovable-özgü kısımları değiştir

### 4a. Google girişini standart Supabase'e çevir

Dosya: `src/routes/auth.tsx` — Lovable broker yerine standart Supabase OAuth kullan.

Şu satırları:

```ts
import { lovable } from "@/integrations/lovable";
// ...
const result = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin,
});
```

Şununla değiştir:

```ts
import { supabase } from "@/integrations/supabase/client";
// ...
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
if (error) toast.error(error.message);
```

Sonra bir callback route ekle: `src/routes/auth.callback.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: Callback,
});

function Callback() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      nav({ to: data.session ? "/" : "/auth" });
    });
  }, [nav]);
  return <div className="p-8 text-center">Giriş yapılıyor...</div>;
}
```

### 4b. Lovable entegrasyonunu kaldır

```bash
rm -rf src/integrations/lovable
bun remove @lovable.dev/cloud-auth-js
```

### 4c. .env dosyasını yeni değerlerle güncelle

`.env` (hem yerel hem VDS'de aynı olacak):

```env
# Yeni Supabase (Frontend)
VITE_SUPABASE_URL=https://YENI_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YENI_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YENI_PROJECT_REF

# Yeni Supabase (Backend / server functions)
SUPABASE_URL=https://YENI_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YENI_ANON_KEY
SUPABASE_PROJECT_ID=YENI_PROJECT_REF
SUPABASE_SERVICE_ROLE_KEY=YENI_SERVICE_ROLE_KEY   # Supabase → Settings → API → service_role
```

**Not:** Yeni Supabase klasik JWT anahtar formatı kullanır (uzun `eyJ...` string'ler). Kodda Lovable'a özgü `sb_publishable_` başlıklı yeni format kontrolü var — bunlar JWT ile de sorunsuz çalışır, dokunma.

### 4d. Kod tarafında admin fonksiyonlarının çalıştığını doğrula

`src/lib/admin.functions.ts` içindeki `seedDemoUsers` ilk deploy sonrası `/admin`'e girmene gerek olmadan demo hesap kurar. Manuel çağırmak için browser console'da:

```js
fetch('/_serverFn/seedDemoUsers', { method: 'POST' }).then(r => r.json()).then(console.log)
```

---

## 5. VDS'ye deploy et

`KURULUM-UBUNTU.md` dosyasındaki 15 adımı uygula — sadece **7. adımdaki `.env`** yerine bu rehberdeki **4c'deki `.env`**'yi kullan.

Adım sırası özetle:
1. Ubuntu 24.04 + Node 20 + PM2 + Nginx + Certbot kur (KURULUM-UBUNTU.md adım 2-5)
2. Kodu clone et
3. **Yeni `.env`** (bu rehberden)
4. `npm install && npm run build`
5. PM2 ile başlat
6. Nginx conf + SSL

---

## 6. DNS ve son kontrol

- `hizmetalani.com` DNS'te A → VDS IP (KURULUM-UBUNTU.md adım 11)
- SSL kur (adım 12)
- Google Cloud Console → OAuth Credentials → Authorized JavaScript origins listesinde `https://hizmetalani.com` olduğundan emin ol

Test:
- https://hizmetalani.com açılıyor ✅
- Kayıt ol / giriş yap çalışıyor ✅
- Google ile giriş çalışıyor ✅
- İlan ver, mesaj at → veritabanına yazıyor ✅ (Supabase dashboard'da gör)

---

## 7. Yedekleme (önemli!)

### Otomatik veritabanı yedeği

Free plan Supabase 7 günlük otomatik yedek verir. Ek olarak haftalık kendi yedeğini almak istersen VDS'de:

```bash
# yedek scripti
cat > /root/db-backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump "postgresql://postgres:DB_SIFRESI@db.YENI_PROJECT_REF.supabase.co:5432/postgres" > /root/backups/db-$DATE.sql
find /root/backups -name "db-*.sql" -mtime +30 -delete
EOF

mkdir -p /root/backups
chmod +x /root/db-backup.sh
apt install -y postgresql-client

# Haftalık cron
(crontab -l 2>/dev/null; echo "0 3 * * 0 /root/db-backup.sh") | crontab -
```

---

## 8. Vazgeçmek istersen — Lovable'a geri dönüş

Lovable projesi durduğun yerde kalıyor. İstersen tekrar Lovable'da düzenler, yeni `.env`'i (kendi Supabase) VDS'de tutup Lovable'ı sadece kod editörü olarak kullanabilirsin. GitHub'a bağladıysan Lovable'daki her push otomatik VDS'ye deploy etmek için:

```bash
# VDS'de webhook / cron ile
*/5 * * * * cd /var/www/hizmetalani && git pull && npm install && npm run build && pm2 restart hizmetalani
```

---

## Karar noktaları

| Konu | Kolay yol | Bağımsız yol |
|------|-----------|--------------|
| Veritabanı | Lovable Cloud (bu proje) | Kendi Supabase (bu rehber) |
| Google giriş | Lovable broker | Kendi Google Cloud + Supabase OAuth |
| Admin işlemler | Lovable API key | Kendi service_role key |
| Kod editörü | Lovable | VS Code / Cursor + git |
| Deploy | Lovable Publish | VDS + PM2 + Nginx |
| Aylık maliyet | Lovable Cloud ücreti | VDS + Supabase Free |

---

## Nereden başlayacaksın?

Sıralı önerim:
1. **Önce sadece Lovable Cloud + VDS** (KURULUM-UBUNTU.md) — kolay, 1 saat
2. Çalıştığını gör, kullan
3. **Sonra bu rehber** — Supabase taşıma + Google OAuth + kod değişiklikleri, 3-5 saat

Böylece parça parça ilerlersin, bir yerde tıkanırsan geri dönüşün olur.

Takıldığın adımda **hangi adım + hata mesajı** yaz, birlikte çözelim.
