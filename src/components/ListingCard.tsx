import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { CATEGORY_MAP, TYPE_LABEL, formatPrice, type CategoryKey, type ListingType } from "@/lib/categories";

export type ListingRow = {
  id: string;
  title: string;
  type: ListingType;
  category: CategoryKey;
  city: string;
  district: string | null;
  price: number | null;
  price_type: string;
  created_at: string;
  description: string;
};

function shortDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export function ListingCard({ item }: { item: ListingRow }) {
  const cat = CATEGORY_MAP[item.category];
  const isOffering = item.type === "offering";
  return (
    <Link
      to="/ilan/$id"
      params={{ id: item.id }}
      aria-label={`${item.title} — ${item.city}${item.district ? ` / ${item.district}` : ""}`}
      className="group grid grid-cols-[64px_1fr_auto] sm:grid-cols-[84px_1fr_140px_110px] items-center gap-3 sm:gap-4 border-b border-border bg-surface px-3 py-3 sm:px-4 transition-colors hover:bg-brand-soft/60 focus-visible:bg-brand-soft/60 first:rounded-t-xl last:rounded-b-xl last:border-b-0"
    >
      {/* Thumbnail */}
      <div
        className="grid place-items-center size-16 sm:size-[72px] rounded-md bg-gradient-to-br from-brand/10 via-brand-soft to-brand-accent/15 text-3xl sm:text-[32px] ring-1 ring-inset ring-border/60"
        aria-hidden
      >
        <span>{cat?.emoji ?? "🔧"}</span>
      </div>

      {/* Title + meta */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span
            className={
              "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
              (isOffering
                ? "bg-brand text-brand-foreground"
                : "bg-success/15 text-success")
            }
          >
            {TYPE_LABEL[item.type]}
          </span>
          <span className="text-[11px] text-muted-foreground">{cat?.short}</span>
        </div>
        <h3 className="font-semibold text-[15px] text-foreground leading-snug line-clamp-2 group-hover:text-brand">
          {item.title}
        </h3>
        {/* Mobile-only location/date under title */}
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground sm:hidden">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{item.city}{item.district ? ` / ${item.district}` : ""}</span>
          </span>
          <span className="tabular-nums whitespace-nowrap">{shortDate(item.created_at)}</span>
        </div>
      </div>

      {/* Location column (desktop) */}
      <div className="hidden sm:block text-sm text-foreground/80 min-w-0">
        <div className="font-medium truncate">{item.city}</div>
        {item.district && <div className="text-xs text-muted-foreground truncate">{item.district}</div>}
      </div>

      {/* Price + date column */}
      <div className="text-right whitespace-nowrap">
        <div className="text-brand font-bold text-[15px] sm:text-base tabular-nums">
          {formatPrice(item.price, item.price_type)}
        </div>
        <div className="hidden sm:block text-[11px] text-muted-foreground mt-0.5 tabular-nums">
          {shortDate(item.created_at)}
        </div>
      </div>
    </Link>
  );
}
