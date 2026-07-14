import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/gizlilik")({
  component: GizlilikPage,
  head: () => ({
    meta: [
      { title: "Gizlilik Politikası — hizmetalanı.com" },
      { name: "description", content: "Kişisel verilerin işlenmesi, KVKK hakları, üçüncü taraf hizmetler (Google AdSense, Analytics) ve veri saklama hakkında bilgi." },
      { property: "og:title", content: "Gizlilik Politikası — hizmetalanı.com" },
      { property: "og:description", content: "hizmetalanı.com kişisel verilerinizi nasıl işler, hangi üçüncü tarafları kullanır." },
      { property: "og:url", content: "/gizlilik" },
    ],
    links: [{ rel: "canonical", href: "/gizlilik" }],
  }),
});

function GizlilikPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Gizlilik Politikası</h1>
      <p className="text-sm text-muted-foreground mb-6">Son güncelleme: 14 Temmuz 2026</p>

      <section className="space-y-4 text-foreground/90 leading-relaxed">
        <p>hizmetalanı.com ("Site") olarak gizliliğinize önem veriyoruz. Bu politika, sitemizi ziyaret ettiğinizde
        veya üye olduğunuzda hangi verileri topladığımızı, nasıl kullandığımızı ve haklarınızı açıklar.</p>

        <h2 className="text-xl font-semibold mt-6">1. Topladığımız veriler</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Hesap bilgileri:</strong> Ad-soyad, e-posta, telefon (opsiyonel), şehir/ilçe.</li>
          <li><strong>İlan içerikleri:</strong> Yayınladığınız ilanlarda paylaştığınız bilgiler.</li>
          <li><strong>Kullanım verileri:</strong> IP adresi, tarayıcı türü, ziyaret edilen sayfalar (analitik amaçlı, çerez onayınıza bağlı).</li>
          <li><strong>Mesajlar:</strong> Diğer kullanıcılarla platform üzerinden yaptığınız yazışmalar.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">2. Verilerin kullanım amaçları</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Hizmetin sunulması, hesap yönetimi ve güvenlik.</li>
          <li>İlan yayınlama, arama ve iletişim kurulmasının sağlanması.</li>
          <li>Yasal yükümlülüklere uyum ve dolandırıcılığın önlenmesi.</li>
          <li>Sitenin geliştirilmesi için anonim analiz.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">3. Üçüncü taraf hizmetler</h2>
        <p>Sitemizde aşağıdaki üçüncü taraf hizmetleri kullanılır:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Google AdSense</strong> — reklam gösterimi. Google, bu sitedeki ziyaretlerinize göre reklam sunmak için
            çerezleri kullanabilir. Detaylar:{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-brand underline">Google Reklam Politikası</a>.</li>
          <li><strong>Google Analytics</strong> — ziyaretçi analizi (IP anonimleştirme etkindir).</li>
          <li><strong>Supabase</strong> — kimlik doğrulama ve veritabanı altyapısı.</li>
        </ul>
        <p>Bu hizmetler kendi gizlilik politikaları çerçevesinde veri işler. Çerez tercihlerinizi{" "}
          <Link to="/cerez-politikasi" className="text-brand underline">Çerez Politikası</Link> sayfasından yönetebilirsiniz.</p>

        <h2 className="text-xl font-semibold mt-6">4. Veri saklama ve silme</h2>
        <p>Hesap verileriniz siz silene kadar saklanır. Hesabınızı sildiğinizde profil ve ilanlarınız
        30 gün içinde kalıcı olarak silinir. Yasal saklama süresi olan kayıtlar (fatura vb.) süresi
        boyunca korunur.</p>

        <h2 className="text-xl font-semibold mt-6">5. KVKK kapsamındaki haklarınız</h2>
        <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; verilerinize erişme, düzeltme,
        silme, işleme itiraz etme ve veri taşınabilirliği haklarına sahipsiniz. Talepleriniz için
        aşağıdaki e-posta adresine yazabilirsiniz.</p>

        <h2 className="text-xl font-semibold mt-6">6. Güvenlik</h2>
        <p>Verileriniz HTTPS üzerinden iletilir. Şifreler tek yönlü olarak hashlenerek saklanır.
        Yetkisiz erişimi engellemek için satır düzeyinde güvenlik (RLS) politikaları uygulanır.</p>

        <h2 className="text-xl font-semibold mt-6">7. Çocukların gizliliği</h2>
        <p>Hizmetlerimiz 18 yaş altındaki kullanıcılara yönelik değildir. 18 yaş altı bir kullanıcının bilerek
        veri toplamayız.</p>

        <h2 className="text-xl font-semibold mt-6">8. Değişiklikler</h2>
        <p>Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikleri sitede duyururuz.</p>

        <h2 className="text-xl font-semibold mt-6">9. İletişim</h2>
        <p>Gizlilikle ilgili tüm sorular için: <a href="mailto:iletisim@hizmetalani.com" className="text-brand underline">iletisim@hizmetalani.com</a></p>
      </section>
    </article>
  );
}
