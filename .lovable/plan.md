
# Uygulama Planı

Kapsam büyük olduğu için 4 tura böleceğim. Her tur bittiğinde bir sonrakine geçeceğim; sen istediğinde durabilirsin.

## Tur 1 — Veri altyapısı + emoji temizliği + görseller

**Türkiye il/ilçe verisi**
- `src/data/turkiye.json` — 81 il, tüm ilçeler (statik JSON)
- `src/lib/turkiye.ts` — yardımcı fonksiyonlar (`getIller`, `getIlceler(il)`, arama)
- İlan verme formunda, filtre panelinde, profil düzenlemede il/ilçe seçimi bu kaynağa bağlanır (mevcut serbest metin alanları combobox'a döner)

**Veritabanı migration'ı (tek migration)**
- `site_settings` — SEO ayarları (site adı, açıklama, og:image URL, keywords, GA ID, Search Console doğrulama kodu, adsense pub-id, robots.txt override)
- `tickets` + `ticket_messages` — kullanıcı destek talepleri, admin ile canlı yazışma
- `announcements` — admin'in tüm kullanıcılara toplu duyurusu (banner + bildirim)
- `listing_details` alanları eklenir: `work_type` (full_time/part_time/freelance/gecici), `available_days` (jsonb: pzt-paz), `available_hours` (jsonb: başlangıç-bitiş), `salary_min`, `salary_max`, `salary_period` (saatlik/günlük/aylık), `experience_years`, `education_level`, `requirements` (text[]), `benefits` (text[]), `is_remote`, `is_urgent`
- Realtime: `tickets`, `ticket_messages`, `messages`, `announcements`

**Emoji temizliği**
- Tüm `src/**` altında emoji ve emoji karakterlerini tarayıp lucide-react ikonlarıyla değiştir

**Görseller (imagegen)**
- `src/assets/hero.jpg` — Türkiye temalı iş/işveren buluşma hero görseli
- `src/assets/og-default.jpg` — 1200x630 sosyal paylaşım
- `public/favicon.ico` (yeni logo)

## Tur 2 — Admin paneli tamamlama

- `/admin/ticketlar` — açık/kapalı ticket listesi, canlı sohbet paneli (realtime)
- `/admin/mesajlar` — admin'in herhangi bir kullanıcıya DM atma paneli
- `/admin/duyurular` — toplu duyuru oluşturma, aktif/pasif toggle, hedef (herkes / işveren / iş arayan)
- `/admin/seo` — site meta, og:image yükleme, GA/Search Console/AdSense kodları, robots.txt editörü, sitemap yeniden üretme butonu
- `/admin/ilanlar` — düzenleme modal'ı (statü, öne çıkar, sil, kategori değiştir)
- `/admin/kullanicilar` — rol atama, ban, doğrulama işareti, şifre sıfırlama linki
- Sidebar navigasyon, dashboard istatistik kartları (kullanıcı sayısı, aktif ilan, açık ticket, günlük yeni kayıt)

## Tur 3 — Kullanıcı tarafı: ilan detayları + DM + destek

- İlan ver formu: yeni alanlar (çalışma tipi, izinli günler, çalışma saatleri, maaş aralığı, deneyim, eğitim, şartlar, yan haklar, uzaktan, acil)
- İlan detay sayfası: tüm bu alanlar zengin şekilde gösterilir; iş veren ile iş arayan birbirinin şartlarını net görür
- `/mesajlar` — kullanıcı DM kutusu (realtime, okundu bilgisi, konuşma listesi + panel)
- `/destek` — kullanıcının kendi ticket'larını görme, yeni ticket açma, admin ile canlı yazışma
- Site geneli duyuru bandı (aktif announcement varsa üstte gösterilir)

## Tur 4 — Hard SEO + AdSense hazırlığı

**Sayfa bazlı meta (her route için özel `head()`)**
- `/` — dinamik: site_settings'ten title/description + JSON-LD WebSite + Organization
- `/ilanlar`, `/is-arayanlar`, `/is-verenler` — kategoriye özel meta + BreadcrumbList
- `/ilan/$id` — ilan bazlı title/description, og:image (opsiyonel özel), JobPosting schema.org JSON-LD (Google Jobs uyumu — çok güçlü SEO), BreadcrumbList
- `/kategori/$slug` — kategori adı + il bazlı dinamik title ("İstanbul Temizlik İlanları")

**Teknik SEO**
- `src/routes/sitemap[.]xml.ts` — dinamik: tüm aktif ilanlar + kategori + il kombinasyonları
- `public/robots.txt` — admin'den override edilebilir; varsayılan Google/Bing için optimize
- `src/routes/__root.tsx` — canonical yaklaşımı, hreflang tr-TR, Organization JSON-LD, GA/AdSense/Search Console script'leri site_settings'ten okunur
- Görsel: tüm `<img>` etiketlerine `alt` + `loading="lazy"` + `width/height`
- Semantik HTML: her sayfada tek `<h1>`, düzgün heading hiyerarşisi, `<article>`, `<nav>`, `<main>`, `<aside>`
- Performans: TanStack Query stale time ayarı, gereksiz re-render'lar
- Zengin anchor text (iç link stratejisi): kategori sayfaları il+kategori kombinasyonlarına link verir (uzun kuyruk)
- `/hakkimizda`, `/gizlilik`, `/kullanim-sartlari`, `/iletisim`, `/sss` sayfaları (AdSense onayı için zorunlu içerik)

**AdSense onay şartları için ek**
- Gizlilik politikası + KVKK metni + çerez bildirimi banner'ı
- İletişim sayfası (gerçek e-posta, form)
- Hakkımızda sayfası (300+ kelime, özgün)
- SSS sayfası (FAQPage schema.org JSON-LD)
- 404 sayfası düzgün, `noindex`
- Site hızı: hero görseli optimize (WebP), font preload
- Türkçe içerik kalitesi: her kategori için 200+ kelime açıklama metni

## Teknik Notlar

- Tüm yeni tablolar RLS + GRANT (public grant chart'a göre)
- Realtime publication: `tickets`, `ticket_messages`, `messages`, `announcements`
- Admin route'ları `_authenticated/admin/*` altında, `has_role(uid, 'admin')` kontrolü
- `site_settings` tek satırlı (id=1) singleton tablo; loader'da `ensureQueryData` ile cache'lenir, `__root.tsx` head'inde okunur
- İlan detay `head()` loader'dan gelen veriye göre JobPosting JSON-LD üretir
- Görsel üretimi: standard tier (hero için) ve premium (og default için değil, çünkü metin yok — standard yeter)
- Emoji temizliği için ripgrep ile Unicode emoji aralığı taraması (U+1F300-U+1FAFF, U+2600-U+27BF)

## Onay

"Tur 1'e başla" dersen sırayla başlarım. "Hepsini kesintisiz yap" dersen 4 turu arka arkaya yapıp özet dönerim (uzun sürer, çok dosya değişir).
