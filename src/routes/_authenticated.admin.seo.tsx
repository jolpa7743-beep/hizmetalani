import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Search, Globe, BarChart3, ShieldCheck, Radio, Megaphone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: AdminSEO,
  head: () => ({ meta: [{ title: "SEO Ayarları — Yönetici" }] }),
});

function AdminSEO() {
  const router = useRouter();
  const fetchSettings = useServerFn(getSiteSettings);
  const saveFn = useServerFn(updateSiteSettings);
  const { data, isLoading } = useQuery({
    queryKey: ["site_settings"],
    queryFn: () => fetchSettings(),
  });
  const [form, setForm] = useState<Partial<SiteSettings>>({});

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: (payload: Partial<SiteSettings>) => saveFn({ data: payload }),
    onSuccess: () => { toast.success("Ayarlar kaydedildi"); router.invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Yükleniyor…</div>;

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">SEO ve Site Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bu ayarlar tüm sayfaların meta etiketlerini, sosyal medya önizlemesini, analiz kodlarını ve robots.txt'yi kontrol eder.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="size-4" /> Genel Site Bilgileri</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Site Adı (title)</Label><Input value={form.site_name ?? ""} onChange={(e) => set("site_name", e.target.value)} maxLength={60} />
            <p className="text-xs text-muted-foreground mt-1">Google'da başlık olarak görünür. 50-60 karakter ideal.</p></div>
          <div><Label>Site Açıklaması (description)</Label><Textarea rows={3} value={form.site_description ?? ""} onChange={(e) => set("site_description", e.target.value)} maxLength={160} />
            <p className="text-xs text-muted-foreground mt-1">Google arama sonuçlarında görünür. 140-160 karakter ideal.</p></div>
          <div><Label>Anahtar Kelimeler</Label><Input value={form.site_keywords ?? ""} onChange={(e) => set("site_keywords", e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Virgülle ayırarak yazın. Örn: bakıcı ilanı, temizlikçi, ev temizliği</p></div>
          <div><Label>Sosyal Medya Görseli (og:image URL)</Label><Input value={form.og_image_url ?? ""} onChange={(e) => set("og_image_url", e.target.value)} placeholder="https://..." />
            <p className="text-xs text-muted-foreground mt-1">1200x630 boyutunda bir resmin tam URL'si. Boş bırakırsanız varsayılan kullanılır.</p></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>İletişim E-postası</Label><Input type="email" value={form.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} /></div>
            <div><Label>İletişim Telefonu</Label><Input value={form.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-4" /> Analiz ve Reklam</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Google Analytics ID</Label><Input value={form.ga_measurement_id ?? ""} onChange={(e) => set("ga_measurement_id", e.target.value)} placeholder="G-XXXXXXXXXX" /></div>
          <div><Label>Google Search Console Doğrulama Kodu</Label><Input value={form.search_console_verification ?? ""} onChange={(e) => set("search_console_verification", e.target.value)} placeholder="content değeri" />
            <p className="text-xs text-muted-foreground mt-1">HTML meta tag doğrulama değeri (google-site-verification content=".." kısmı).</p></div>

          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="ads-enabled" className="text-base">Google AdSense Reklamları</Label>
                <p className="text-xs text-muted-foreground mt-1">Tüm sayfalardaki reklam bloklarını açıp kapatır. Kapalıyken hiç <code>&lt;ins&gt;</code> etiketi ve AdSense scripti yüklenmez.</p>
              </div>
              <Switch id="ads-enabled" checked={form.adsense_enabled ?? false} onCheckedChange={(v) => set("adsense_enabled", v)} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/20 px-3 py-2">
              <div>
                <Label htmlFor="ads-test" className="text-sm">Test modu</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Açıksa reklamlar <code>data-adtest="on"</code> ile yüklenir; canlıda gerçek reklam yerine test görselleri gösterilir. AdSense onayı öncesi veya geliştirme sırasında kullanın.
                </p>
              </div>
              <Switch id="ads-test" checked={form.adsense_test_mode ?? false} onCheckedChange={(v) => set("adsense_test_mode", v)} />
            </div>
            <div><Label>Publisher ID</Label><Input value={form.adsense_publisher_id ?? ""} onChange={(e) => set("adsense_publisher_id", e.target.value)} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
              <p className="text-xs text-muted-foreground mt-1"><code>ca-pub-</code> ön ekiyle birlikte yazın. Bu değer aynı zamanda <code>/ads.txt</code> dosyasında da otomatik yayınlanır.</p></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Slot: Header (üst şerit)</Label><Input value={form.adsense_slot_header ?? ""} onChange={(e) => set("adsense_slot_header", e.target.value)} placeholder="1234567890" /></div>
              <div><Label>Slot: In-Article (içerik içi)</Label><Input value={form.adsense_slot_in_article ?? ""} onChange={(e) => set("adsense_slot_in_article", e.target.value)} placeholder="1234567890" /></div>
              <div><Label>Slot: Sidebar (kenar / liste arası)</Label><Input value={form.adsense_slot_sidebar ?? ""} onChange={(e) => set("adsense_slot_sidebar", e.target.value)} placeholder="1234567890" /></div>
              <div><Label>Slot: Footer (alt)</Label><Input value={form.adsense_slot_footer ?? ""} onChange={(e) => set("adsense_slot_footer", e.target.value)} placeholder="1234567890" /></div>
            </div>
            <p className="text-xs text-muted-foreground">Slot ID'leri AdSense &gt; Reklamlar &gt; Reklam birimleri sayfasından alınır. Sadece rakamdan oluşur. Bir slotu boş bırakırsanız o konumdaki reklam gizlenir.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> robots.txt</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={8} className="font-mono text-xs" value={form.robots_txt ?? ""} onChange={(e) => set("robots_txt", e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">/robots.txt adresine gelen tüm ziyaretçilere (arama motorları dahil) döndürülür. Sitemap satırını eklemeyi unutmayın.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="size-4" /> Site Bandı Duyurusu</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={form.announcement_active ?? false} onCheckedChange={(v) => set("announcement_active", v)} id="ann-active" />
            <Label htmlFor="ann-active">Duyuruyu yayında göster</Label>
          </div>
          <div><Label>Duyuru metni</Label><Textarea rows={2} value={form.announcement_banner ?? ""} onChange={(e) => set("announcement_banner", e.target.value)} placeholder="Örn: 15 Ağustos'a kadar tüm ilanlar ücretsiz." /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="size-4" /> E-posta Doğrulama Kodları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Her akışta 6 haneli kod, kullanıcının e-posta adresine sistem tarafından gönderilir. Kayıt ve şifre sıfırlama e-postaları
            Lovable altyapısı üzerinden yollanır. Rozet için markalı e-posta gönderimi kendi domaininiz eklendiğinde aktifleşir.
          </p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="otp-signup" className="text-sm">Kayıt (üye ol) e-posta kodu</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Kayıt olan kullanıcı e-postasındaki kodu / bağlantıyı doğrulamadan hesabı aktif olmaz.
              </p>
            </div>
            <Switch id="otp-signup" checked={form.signup_email_otp_enabled ?? true} onCheckedChange={(v) => set("signup_email_otp_enabled", v)} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="otp-reset" className="text-sm">Şifremi unuttum akışı</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Giriş ekranında "Şifremi unuttum" bağlantısını gösterir; kullanıcıya e-posta ile sıfırlama bağlantısı gönderilir.
              </p>
            </div>
            <Switch id="otp-reset" checked={form.password_reset_otp_enabled ?? true} onCheckedChange={(v) => set("password_reset_otp_enabled", v)} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2">
            <div>
              <Label htmlFor="otp-badge" className="text-sm">Rozet talebinde e-posta kodu</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Doğrulanmış üye rozeti talebinde 6 haneli kod ile e-posta teyidi ister. <strong>Etkinleştirilmesi için önce kendi domaininiz gerekir.</strong>
              </p>
            </div>
            <Switch id="otp-badge" checked={form.badge_email_otp_enabled ?? false} onCheckedChange={(v) => set("badge_email_otp_enabled", v)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="bg-brand hover:bg-brand/90">
          <Save className="size-4 mr-2" /> {save.isPending ? "Kaydediliyor…" : "Ayarları Kaydet"}
        </Button>
        <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent">
          <Search className="size-4" /> Sitemap'i görüntüle
        </a>
        <a href="/robots.txt" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent">
          <Radio className="size-4" /> robots.txt
        </a>
      </div>
    </div>
  );
}
