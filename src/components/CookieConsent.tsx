import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie_consent_v1";

type Consent = "accepted" | "essential" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "accepted" || v === "essential") setConsent(v);
    } catch {
      /* ignore */
    }
  }, []);

  const decide = (v: Exclude<Consent, null>) => {
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* ignore */ }
    setConsent(v);
    // Google consent mode v2 signal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    const state = v === "accepted" ? "granted" : "denied";
    w.dataLayer.push(["consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    }]);
  };

  if (!mounted || consent) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihleri"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg"
    >
      <div className="mx-auto max-w-5xl px-4 py-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Cookie className="size-5 text-brand shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-foreground/90">
            Bu sitede size daha iyi bir deneyim sunmak, trafiği analiz etmek ve reklamları kişiselleştirmek için çerezler
            (Google AdSense ve Analytics dahil) kullanıyoruz. Detaylar için{" "}
            <Link to="/cerez-politikasi" className="text-brand underline">Çerez Politikası</Link> ve{" "}
            <Link to="/gizlilik" className="text-brand underline">Gizlilik Politikası</Link> sayfalarımızı inceleyebilirsiniz.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => decide("essential")}>Sadece zorunlu</Button>
          <Button size="sm" className="bg-brand hover:bg-brand/90" onClick={() => decide("accepted")}>Tümünü kabul et</Button>
        </div>
      </div>
    </div>
  );
}
