import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import type { SiteSettings } from "@/lib/settings.functions";

type SlotKey = "header" | "in_article" | "sidebar" | "footer";

interface Props {
  slot: SlotKey;
  /** CSS class for the outer container */
  className?: string;
  /** Format override (default: auto) */
  format?: "auto" | "fluid" | "rectangle";
  /** Fluid layout key (for in-article ads) */
  layout?: "in-article";
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Google AdSense reklam bloğu.
 * - Admin panelinden AdSense kapalıysa hiç render edilmez.
 * - Publisher ID veya slot ID eksikse render edilmez.
 * - Yerel geliştirme ortamında bile <ins> yerleşimi görünür, canlıda AdSense doldurur.
 */
export function AdSlot({ slot, className = "", format = "auto", layout }: Props) {
  const ref = useRef<HTMLModElement | null>(null);

  // __root loader'ı site_settings'ı context'e koyuyor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = (useRouter().state.matches[0]?.loaderData ?? {}) as { settings?: SiteSettings | null };
  const s = ctx.settings ?? null;

  const publisher = s?.adsense_publisher_id?.trim();
  const enabled = !!s?.adsense_enabled;
  const slotId = s?.[`adsense_slot_${slot}` as const]?.trim();

  useEffect(() => {
    if (!enabled || !publisher || !slotId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore repeated push errors during dev */
    }
  }, [enabled, publisher, slotId]);

  // silently hide when disabled or unconfigured
  if (!enabled || !publisher || !slotId) return null;

  return (
    <aside
      aria-label="Reklam"
      className={`ad-slot my-6 flex justify-center overflow-hidden ${className}`}
      data-slot={slot}
    >
      <ins
        ref={ref}
        className="adsbygoogle block w-full"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={publisher}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
// Silence unused import warning when tree-shaken:
export const __used = useRouteContext;
