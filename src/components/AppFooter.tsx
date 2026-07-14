import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";
import { Facebook, Instagram, Mail, Twitter } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-2 gap-8 md:grid-cols-5">
        <div className="col-span-2">
          <BrandLogo />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xs">
            Türkiye'nin ev ve bakım hizmetleri ilan platformu. Bakıcı, temizlik personeli ve evcil hayvan
            geçici konaklama ilanlarını güvenle bulun ya da yayınlayın.
          </p>
          <div className="mt-4 flex items-center gap-1">
            <FooterIcon href="#" label="Twitter"><Twitter className="size-5" aria-hidden /></FooterIcon>
            <FooterIcon href="#" label="Instagram"><Instagram className="size-5" aria-hidden /></FooterIcon>
            <FooterIcon href="#" label="Facebook"><Facebook className="size-5" aria-hidden /></FooterIcon>
            <FooterIcon href="mailto:iletisim@hizmetalani.com" label="E-posta"><Mail className="size-5" aria-hidden /></FooterIcon>
          </div>
        </div>

        <FooterCol title="Kategoriler">
          <FooterLink to="/" search={{ kategori: "bakici" }}>Bakıcı</FooterLink>
          <FooterLink to="/" search={{ kategori: "ev_temizlik" }}>Ev Temizliği</FooterLink>
          <FooterLink to="/" search={{ kategori: "ofis_temizlik" }}>Ofis Temizliği</FooterLink>
          <FooterLink to="/" search={{ kategori: "merdiven_temizlik" }}>Merdiven Temizliği</FooterLink>
          <FooterLink to="/" search={{ kategori: "evcil_yuva_veren" }}>Evcil Yuva</FooterLink>
        </FooterCol>

        <FooterCol title="Kurumsal">
          <FooterLink to="/hakkimizda">Hakkımızda</FooterLink>
          <FooterLink to="/nasil-calisir">Nasıl Çalışır?</FooterLink>
          <FooterLink to="/guvenlik">Güvenlik</FooterLink>
          <FooterLink to="/iletisim">İletişim</FooterLink>
        </FooterCol>

        <FooterCol title="Yardım">
          <FooterLink to="/kullanim-kosullari">Kullanım Koşulları</FooterLink>
          <FooterLink to="/gizlilik">Gizlilik Politikası</FooterLink>
          <FooterLink to="/kvkk">KVKK</FooterLink>
          <FooterLink to="/cerez-politikasi">Çerez Politikası</FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground text-center sm:text-left">
          <div>© {new Date().getFullYear()} hizmetalanı.com — Tüm hakları saklıdır.</div>
          <div>Yalnızca bir ilan platformudur; içeriklerden ilan sahipleri sorumludur.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">{children}</ul>
    </div>
  );
}

function FooterLink({ to, search, children }: { to: string; search?: Record<string, string>; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to as any} search={search as any} className="hover:text-brand transition-colors">
        {children}
      </Link>
    </li>
  );
}

function FooterIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted-foreground hover:text-brand hover:bg-muted transition-colors"
    >
      {children}
    </a>
  );
}
