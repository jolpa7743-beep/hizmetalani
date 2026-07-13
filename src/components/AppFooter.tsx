import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";
import { Facebook, Instagram, Mail, Twitter } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-7xl px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <BrandLogo />
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Türkiye'nin ev ve bakım hizmetleri ilan platformu. Bakıcı, temizlikçi ve evcil hayvan
            geçici yuva ilanlarını güvenle bulun ya da yayınlayın.
          </p>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <a href="#" aria-label="Twitter" className="hover:text-brand"><Twitter className="size-5" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-brand"><Instagram className="size-5" /></a>
            <a href="#" aria-label="Facebook" className="hover:text-brand"><Facebook className="size-5" /></a>
            <a href="mailto:iletisim@hizmetalani.com" aria-label="E-posta" className="hover:text-brand"><Mail className="size-5" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Kategoriler</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" search={{ kategori: "bakici" }} className="hover:text-brand">Bakıcı</Link></li>
            <li><Link to="/" search={{ kategori: "ev_temizlik" }} className="hover:text-brand">Ev Temizliği</Link></li>
            <li><Link to="/" search={{ kategori: "ofis_temizlik" }} className="hover:text-brand">Ofis Temizliği</Link></li>
            <li><Link to="/" search={{ kategori: "merdiven_temizlik" }} className="hover:text-brand">Merdiven Temizliği</Link></li>
            <li><Link to="/" search={{ kategori: "evcil_yuva_veren" }} className="hover:text-brand">Evcil Yuva</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Kurumsal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/hakkimizda" className="hover:text-brand">Hakkımızda</Link></li>
            <li><Link to="/nasil-calisir" className="hover:text-brand">Nasıl Çalışır?</Link></li>
            <li><Link to="/guvenlik" className="hover:text-brand">Güvenlik</Link></li>
            <li><Link to="/iletisim" className="hover:text-brand">İletişim</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Yardım</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/kullanim-kosullari" className="hover:text-brand">Kullanım Koşulları</Link></li>
            <li><Link to="/gizlilik" className="hover:text-brand">Gizlilik Politikası</Link></li>
            <li><Link to="/kvkk" className="hover:text-brand">KVKK</Link></li>
            <li><Link to="/cerez-politikasi" className="hover:text-brand">Çerez Politikası</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} hizmetalanı.com — Tüm hakları saklıdır.</div>
          <div>hizmetalanı.com yalnızca bir ilan platformudur; ilan içeriklerinden ilan sahipleri sorumludur.</div>
        </div>
      </div>
    </footer>
  );
}
