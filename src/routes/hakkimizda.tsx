import { createFileRoute } from "@tanstack/react-router";

const PAGES: Record<string, { title: string; body: string }> = {
  hakkimizda: {
    title: "Hakkımızda",
    body:
      "hizmetalanı.com; bakıcı, ev/ofis/merdiven temizliği ve evcil hayvan geçici yuva ihtiyaçlarını " +
      "bir araya getiren Türkiye merkezli bir ilan platformudur. Hem hizmet arayanların hem de " +
      "hizmet verenlerin güvenle buluşmasını amaçlıyoruz.",
  },
  iletisim: {
    title: "İletişim",
    body: "Bize ulaşmak için: iletisim@hizmetalani.com adresine e-posta gönderebilirsiniz.",
  },
  "kullanim-kosullari": {
    title: "Kullanım Koşulları",
    body:
      "Bu sitedeki hizmetleri kullanarak; ilanların doğruluğundan ilan sahibinin sorumlu olduğunu, " +
      "hizmetalanı.com'un yalnızca aracılık ettiğini, yasa dışı ilan yayınlanmayacağını ve tüm " +
      "iletişimin platform aracılığıyla yapılacağını kabul etmiş sayılırsınız.",
  },
  gizlilik: {
    title: "Gizlilik Politikası",
    body:
      "Kişisel verileriniz KVKK kapsamında işlenir; yalnızca hizmetin sağlanması için gerekli " +
      "bilgiler toplanır ve üçüncü taraflarla paylaşılmaz. Hesabınızı istediğiniz zaman silebilirsiniz.",
  },
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    body:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; ad, soyad, e-posta, telefon ve " +
      "konum bilgileriniz hizmetin sağlanması ve iletişimin kurulması amacıyla işlenir.",
  },
  "cerez-politikasi": {
    title: "Çerez Politikası",
    body:
      "Sitemiz oturum yönetimi ve deneyimi iyileştirmek amacıyla zorunlu çerezler kullanır. " +
      "Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.",
  },
};

function makePage(slug: keyof typeof PAGES) {
  return function StaticPage() {
    const { title, body } = PAGES[slug];
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{body}</p>
      </div>
    );
  };
}

export const Route = createFileRoute("/hakkimizda")({ component: makePage("hakkimizda"), head: () => ({ meta: [{ title: "Hakkımızda — hizmetalanı.com" }] }) });
