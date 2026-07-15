import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { CookieConsent } from "@/components/CookieConsent";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSiteSettings, type SiteSettings } from "@/lib/settings.functions";
import ogDefault from "@/assets/og-default.jpg";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold text-brand">404</h1>
          <h2 className="mt-4 text-xl font-semibold">Sayfa bulunamadı</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Aradığınız sayfa mevcut değil ya da taşınmış olabilir.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Anasayfaya dön
            </Link>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Bir sorun oluştu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90"
          >
            Tekrar dene
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Anasayfa
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async ({ context }) => {
    try {
      const s = await context.queryClient.ensureQueryData({
        queryKey: ["site_settings"],
        queryFn: () => getSiteSettings(),
        staleTime: 60_000,
      });
      return { settings: s as SiteSettings | null };
    } catch {
      return { settings: null as SiteSettings | null };
    }
  },
  head: ({ loaderData }) => {
    const s = loaderData?.settings;
    const title = s?.site_name
      ? `${s.site_name} — Bakıcı, Temizlik ve Ev Hizmetleri İlanları`
      : "hizmetalanı.com — Bakıcı, Temizlik ve Evcil Hayvan Geçici Konaklama İlanları";
    const description = s?.site_description
      ?? "Türkiye'nin ev ve bakım hizmetleri ilan platformu. Bakıcı, ev/ofis/bina temizliği ve evcil hayvan geçici konaklama ilanları — ücretsiz yayınla, güvenle iletişime geç.";
    const keywords = s?.site_keywords ?? "bakıcı ilanı, temizlikçi ilanı, ev temizliği, ofis temizliği, evcil hayvan bakıcısı";
    const ogImage = s?.og_image_url || ogDefault;

    const meta: Array<Record<string, string>> = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { name: "author", content: s?.site_name ?? "hizmetalanı.com" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "tr_TR" },
      { property: "og:site_name", content: s?.site_name ?? "hizmetalanı.com" },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
      { name: "theme-color", content: "#1E40AF" },
      { httpEquiv: "content-language", content: "tr-TR" },
    ];
    if (s?.search_console_verification) {
      meta.push({ name: "google-site-verification", content: s.search_console_verification });
    }

    const links: Array<Record<string, string>> = [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" },
    ];

    const scripts: Array<Record<string, string | boolean>> = [];
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", name: s?.site_name ?? "hizmetalanı.com", description, email: s?.contact_email ?? undefined, telephone: s?.contact_phone ?? undefined },
          { "@type": "WebSite", name: s?.site_name ?? "hizmetalanı.com", potentialAction: { "@type": "SearchAction", target: "/?q={search_term_string}", "query-input": "required name=search_term_string" } },
        ],
      }),
    });
    // Google Consent Mode v2 — default-deny (AdSense/GDPR gerekliliği); banner onayı sonrası "granted"e çevrilir.
    scripts.push({
      children:
        "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
        "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});" +
        "gtag('set','ads_data_redaction',true);",
    });
    if (s?.ga_measurement_id) {
      scripts.push({ src: `https://www.googletagmanager.com/gtag/js?id=${s.ga_measurement_id}`, async: true });
      scripts.push({ children: `gtag('js',new Date());gtag('config','${s.ga_measurement_id}');` });
    }
    if (s?.adsense_enabled && s?.adsense_publisher_id) {
      scripts.push({ src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${s.adsense_publisher_id}`, async: true, crossOrigin: "anonymous" });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { meta: meta as any, links: links as any, scripts: scripts as any };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    import("@/lib/app-logger").then((m) => m.installGlobalErrorLogger());
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-dvh flex-col bg-background">
        <a href="#main-content" className="skip-link">İçeriğe atla</a>
        <AnnouncementBanner />
        <AppHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          <Outlet />
        </main>
        <AppFooter />
      </div>
      <CookieConsent />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
