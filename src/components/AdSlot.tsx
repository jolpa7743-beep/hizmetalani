import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SiteSettings } from "@/lib/settings.functions";

type SlotKey = "header" | "in_article" | "sidebar" | "footer";

interface Props {
  slot: SlotKey;
  /** CSS class for the outer container */
  className?: string;
  /** Format override (default: auto) */
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  /** Fluid layout key (for in-article ads) */
  layout?: "in-article";
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Cihaz genişliğine göre slot için önerilen min-height (px).
 * AdSense responsive reklamlarında container yüksekliği, hangi format doldurulacağını belirler.
 */
function slotMinHeight(slot: SlotKey, isMobile: boolean): number {
  if (isMobile) {
    switch (slot) {
      case "header":
      case "footer":
        return 100; // large mobile banner (320x100)
      case "sidebar":
        return 250; // medium rectangle on mobile
      case "in_article":
      default:
        return 250;
    }
  }
  switch (slot) {
    case "header":
    case "footer":
      return 90; // leaderboard (728x90)
    case "sidebar":
      return 600; // wide skyscraper alanı
    case "in_article":
    default:
      return 280;
  }
}

/**
 * Google AdSense reklam bloğu.
 * - Admin panelinden AdSense kapalıysa hiç render edilmez.
 * - Publisher ID veya slot ID eksikse render edilmez.
 * - Test modu açıksa AdSense yalnızca test reklamları döndürür (data-adtest="on").
 * - Mobil cihazda slot boyutları otomatik olarak küçük banner/rectangle'a düşer.
 */
export function AdSlot({ slot, className = "", format = "auto", layout }: Props) {
  const ref = useRef<HTMLModElement | null>(null);
  const isMobile = useIsMobile();

  // __root loader'ı site_settings'ı context'e koyuyor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = (useRouter().state.matches[0]?.loaderData ?? {}) as { settings?: SiteSettings | null };
  const s = ctx.settings ?? null;

  const publisher = s?.adsense_publisher_id?.trim();
  const enabled = !!s?.adsense_enabled;
  const testMode = !!s?.adsense_test_mode;
  const slotId = s?.[`adsense_slot_${slot}` as const]?.trim();

  useEffect(() => {
    if (!enabled || !publisher || !slotId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore repeated push errors during dev */
    }
  }, [enabled, publisher, slotId, isMobile]);

  if (!enabled || !publisher || !slotId) return null;

  const minH = slotMinHeight(slot, isMobile);

  return (
    <aside
      aria-label={testMode ? "Test Reklam" : "Reklam"}
      className={`ad-slot my-6 flex justify-center overflow-hidden ${className}`}
      data-slot={slot}
      data-testmode={testMode ? "on" : undefined}
    >
      <ins
        ref={ref}
        className="adsbygoogle block w-full"
        style={{ display: "block", textAlign: "center", minHeight: minH }}
        data-ad-client={publisher}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive="true"
        {...(testMode ? { "data-adtest": "on" } : {})}
      />
    </aside>
  );
}
