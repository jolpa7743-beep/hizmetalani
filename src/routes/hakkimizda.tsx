import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, HeartHandshake, Users, Sparkles, Building2, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/hakkimizda")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Hakkımızda — hizmetalanı.com | Türkiye'nin Ev ve Bakım Hizmetleri Platformu" },
      {
        name: "description",
        content:
          "hizmetalanı.com; bakıcı, ev/ofis/bina temizliği ve evcil hayvan geçici konaklama alanında hizmet arayan ile hizmet vereni güvenle buluşturan Türkiye merkezli ilan platformudur. Misyonumuz, vizyonumuz ve değerlerimiz.",
      },
      { name: "keywords", content: "hizmetalanı hakkında, hizmet ilan platformu, bakıcı ilanı, temizlik ilanı, evcil hayvan bakımı, güvenilir hizmet, Türkiye hizmet pazarı" },
      { property: "og:title", content: "Hakkımızda — hizmetalanı.com" },
      { property: "og:description", content: "Türkiye'nin ev ve bakım hizmetleri için güvenilir ilan platformu. Doğrulama, şeffaf iletişim ve kullanıcı odaklı deneyim." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/hakkimizda" },
    ],
    links: [{ rel: "canonical", href: "/hakkimizda" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Hakkımızda — hizmetalanı.com",
          url: "/hakkimizda",
          about: {
            "@type": "Organization",
            name: "hizmetalanı.com",
            description:
              "Bakıcı, ev/ofis/bina temizliği ve evcil hayvan geçici konaklama alanında hizmet arayan ile hizmet vereni buluşturan Türkiye merkezli ilan platformu.",
            areaServed: "TR",
            sameAs: [],
          },
        }),
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-brand-soft/60 to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Hakkımızda</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black leading-tight tracking-tight">
            Türkiye'nin ev ve bakım hizmetlerini <span className="text-brand">güvenle</span> buluşturuyoruz
          </h1>
          <p className="mt-5 max-w-3xl text-base md:text-lg text-foreground/80 leading-relaxed">
            hizmetalanı.com; bakıcı, ev temizliği, ofis ve bina temizliği ile evcil hayvan geçici konaklama
            ihtiyaçlarını tek bir çatı altında toplayan, kullanıcı odaklı ve şeffaf bir ilan platformudur.
            Amacımız; hizmet arayan bireyler ile bu alanda uzmanlaşmış hizmet verenleri hızlı, güvenli ve
            doğrulanabilir bir deneyimle bir araya getirmektir.
          </p>
        </div>
      </section>

      {/* Rakamlar / güven şeridi */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { k: "81", v: "İl genelinde ilan yayını" },
            { k: "6+", v: "Ana hizmet kategorisi" },
            { k: "%100", v: "Ücretsiz ilan yayınlama" },
            { k: "7/24", v: "Destek ve moderasyon" },
          ].map((s) => (
            <div key={s.v}>
              <div className="text-2xl md:text-3xl font-black text-brand">{s.k}</div>
              <div className="mt-1 text-xs md:text-sm text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Misyon / Vizyon */}
      <section className="mx-auto max-w-5xl px-4 py-14 grid md:grid-cols-2 gap-6">
        <article className="rounded-2xl border bg-card p-6 md:p-8 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="size-5" />
            <h2 className="text-lg font-bold">Misyonumuz</h2>
          </div>
          <p className="mt-3 text-foreground/85 leading-relaxed">
            Ev, aile ve iş yaşamının merkezindeki bakım ve temizlik hizmetlerinde; güvenilir profesyonellere
            ulaşmayı kolaylaştırmak, hizmet verenlerin ise yeni müşterilere düşük komisyonsuz ve şeffaf bir
            biçimde erişmesini sağlamak. Her ilanı doğrulanabilir bilgi ve kullanıcı puanlaması ile
            desteklemek.
          </p>
        </article>
        <article className="rounded-2xl border bg-card p-6 md:p-8 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2 text-brand">
            <Building2 className="size-5" />
            <h2 className="text-lg font-bold">Vizyonumuz</h2>
          </div>
          <p className="mt-3 text-foreground/85 leading-relaxed">
            Türkiye'nin ev ve bakım hizmetlerinde ilk akla gelen dijital platformu olmak; hizmet kalitesini
            kullanıcı deneyimi, güven rozetleri ve topluluk denetimiyle standardize ederek sektörün dijital
            dönüşümüne öncülük etmek.
          </p>
        </article>
      </section>

      {/* Değerlerimiz */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Değerlerimiz</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Platformumuzun her kararı; kullanıcı güvenliği, şeffaflık ve erişilebilir hizmet ilkeleri
            üzerine kuruludur.
          </p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, title: "Güven ve Doğrulama", body: "Kullanıcı doğrulama, güven rozetleri ve moderasyon süreçleri ile ilanların gerçekliğini önceliklendiririz." },
              { icon: HeartHandshake, title: "Şeffaf İletişim", body: "İlan bilgileri, fiyat aralıkları ve iletişim koşulları eksiksiz görünür; gizli ücret veya komisyon uygulanmaz." },
              { icon: Users, title: "Topluluk Odaklı", body: "Puan ve yorum sistemi ile hizmet kalitesini topluluğun birlikte belirlediği açık bir yapı kurarız." },
              { icon: Sparkles, title: "Sadelik", body: "İlan yayınlamak ve hizmet aramak; dakikalar içinde, teknik bilgi gerektirmeden tamamlanır." },
              { icon: Building2, title: "Yerel Odak", body: "81 il ve tüm ilçelerde çalışan güçlü filtreleme yapısıyla bulunduğunuz semte özel sonuçlar sunarız." },
              { icon: MessageSquare, title: "Sorumlu Moderasyon", body: "Şikayet, rapor ve destek talepleri yönetici ekibi tarafından anlaşılabilir bir süreçle değerlendirilir." },
            ].map((v) => (
              <div key={v.title} className="rounded-xl border bg-card p-5">
                <v.icon className="size-5 text-brand" />
                <h3 className="mt-3 font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-foreground/75 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ne yapıyoruz */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Neler sunuyoruz?</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {[
            { t: "Bakıcı ilanları", d: "Çocuk, yaşlı ve hasta bakımı için deneyimli ilan verenler." },
            { t: "Ev temizliği", d: "Gündelik veya düzenli ev temizliği hizmetleri." },
            { t: "Ofis ve bina temizliği", d: "Kurumsal ve apartman ölçekli düzenli temizlik hizmetleri." },
            { t: "Evcil hayvan geçici konaklama", d: "Tatil ve seyahat dönemleri için güvenli, sertifikalı bakıcılar." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border p-4 bg-card">
              <div className="font-semibold">{c.t}</div>
              <p className="text-sm text-muted-foreground mt-1">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-brand text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Hizmetinizi bugün yayınlayın</h2>
            <p className="mt-2 text-white/85 max-w-xl">
              Ücretsiz üye olun, ilanınızı dakikalar içinde yayınlayın; binlerce potansiyel müşteriye ulaşın.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/ilan-ver"
              className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-white/90"
            >
              İlan Ver
            </Link>
            <Link
              to="/iletisim"
              className="inline-flex items-center rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              İletişime Geç
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
