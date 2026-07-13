import { Link } from "@tanstack/react-router";
import { MapPin, Eye } from "lucide-react";
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
  view_count?: number;
};

function shortDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
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
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-elevated)] focus-visible:-translate-y-0.5"
    >
      {/* Görsel alan */}
      <div
        className="relative h-32 grid place-items-center bg-gradient-to-br from-brand/10 via-brand-soft to-brand-accent/15 text-5xl"
        aria-hidden
      >
        <span>{cat?.emoji ?? "🔧"}</span>
        <span
          className={
            "absolute left-2 top-2 inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
            (isOffering ? "bg-brand text-brand-foreground" : "bg-success/90 text-success-foreground")
          }
        >
          {TYPE_LABEL[item.type]}
        </span>
        {typeof item.view_count === "number" && item.view_count > 0 && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-sm bg-foreground/60 px-1.5 py-0.5 text-[10px] font-medium text-background">
            <Eye className="size-3" /> {item.view_count}
          </span>
        )}
      </div>

      {/* İçerik */}
      <div className="flex flex-1 flex-col p-3">
        <div className="text-[11px] text-muted-foreground">{cat?.short}</div>
        <h3 className="mt-0.5 font-semibold text-[15px] text-foreground leading-snug line-clamp-2 group-hover:text-brand">
          {item.title}
        </h3>

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground min-w-0">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{item.city}{item.district ? ` / ${item.district}` : ""}</span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2 pt-2 border-t border-border">
          <div className="text-brand font-bold text-[15px] tabular-nums">
            {formatPrice(item.price, item.price_type)}
          </div>
          <time dateTime={item.created_at} className="text-[11px] text-muted-foreground tabular-nums">
            {shortDate(item.created_at)}
          </time>
        </div>
      </div>
    </Link>
  );
}
