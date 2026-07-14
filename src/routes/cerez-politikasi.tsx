import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cerez-politikasi")({
  component: CerezPage,
  head: () => ({
    meta: [
      { title: "Çerez Politikası — hizmetalanı.com" },
      { name: "description", content: "hizmetalanı.com üzerinde kullanılan çerez türleri, Google AdSense ve Analytics çerezleri, saklama süreleri ve tercih yönetimi." },
      { property: "og:title", content: "Çerez Politikası — hizmetalanı.com" },
      { property: "og:description", content: "Sitemizde kullanılan çerezler ve tercih yönetimi hakkında bilgi." },
      { property: "og:url", content: "/cerez-politikasi" },
    ],
    links: [{ rel: "canonical", href: "/cerez-politikasi" }],
  }),
});

function CerezPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold mb-2">Çerez Politikası</h1>
      <p className="text-sm text-muted-foreground mb-6">Son güncelleme: 14 Temmuz 2026</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Çerez nedir?</h2>
      <p>Çerezler, ziyaret ettiğiniz web sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır.
      hizmetalanı.com olarak siteyi güvenli ve verimli bir şekilde çalıştırmak, ziyaretçi davranışlarını
      analiz etmek ve reklamları göstermek için çerez kullanıyoruz.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Kullandığımız çerez türleri</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Zorunlu çerezler:</strong> Oturum yönetimi, güvenlik ve temel işlevsellik için gereklidir; kapatılamazlar.</li>
        <li><strong>Analitik çerezler (Google Analytics):</strong> Ziyaretçi sayısını ve sayfa kullanımını ölçmek için kullanılır. Sadece onay verdiğinizde çalışır.</li>
        <li><strong>Reklam çerezleri (Google AdSense):</strong> Size ve ilgi alanlarınıza uygun reklamlar göstermek için üçüncü taraf sağlayıcılar (Google ve iş ortakları) tarafından kullanılır. Sadece onay verdiğinizde çalışır.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">Google AdSense hakkında</h2>
      <p>Sitemizde Google AdSense reklamları yayınlanır. Google, üçüncü taraf satıcı olarak reklam sunmak
      için çerezleri kullanır. DART çerezi, kullanıcının sitemize ve internet üzerindeki diğer sitelere
      yaptığı ziyaretlere göre reklam sunulmasını sağlar. Kullanıcılar,{" "}
      <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-brand underline">
        Google Reklam ve İçerik Ağı gizlilik politikasını
      </a>{" "}ziyaret ederek DART çerezinin kullanımını devre dışı bırakabilirler.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Onay ve tercih yönetimi</h2>
      <p>Siteye ilk girişinizde bir çerez onay bandı gösteriyoruz. "Tümünü kabul et" derseniz analitik ve
      reklam çerezleri etkinleşir; "Sadece zorunlu" derseniz sadece teknik çerezler kullanılır. Tarayıcı
      ayarlarınızdan da tüm çerezleri istediğiniz zaman silebilir veya engelleyebilirsiniz.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Kişiselleştirilmiş reklamları devre dışı bırakma</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Google reklam ayarları: <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-brand underline">adssettings.google.com</a></li>
        <li>Youronlinechoices (AB): <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-brand underline">youronlinechoices.eu</a></li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">İletişim</h2>
      <p>Çerez politikamız hakkında sorularınız için: <a href="mailto:iletisim@hizmetalani.com" className="text-brand underline">iletisim@hizmetalani.com</a></p>
    </article>
  );
}
