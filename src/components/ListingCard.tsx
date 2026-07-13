import { Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import { CATEGORY_MAP, TYPE_LABEL, formatPrice, type CategoryKey, type ListingType } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";

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

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "az önce";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function ListingCard({ item }: { item: ListingRow }) {
  const cat = CATEGORY_MAP[item.category];
  const isOffering = item.type === "offering";
  return (
    <Link
      to="/ilan/$id"
      params={{ id: item.id }}
      aria-label={`${item.title} — ${item.city}${item.district ? ` / ${item.district}` : ""}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-elevated)] focus-visible:-translate-y-0.5 focus-visible:border-brand/40 focus-visible:shadow-[var(--shadow-elevated)]"
    >
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <div
          className="shrink-0 grid place-items-center size-16 sm:size-20 rounded-xl bg-gradient-to-br from-brand/10 via-brand-soft to-brand-accent/15 text-3xl sm:text-4xl ring-1 ring-inset ring-border/60"
          aria-hidden
        >
          <span>{cat?.emoji ?? "🔧"}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <Badge
              variant="outline"
              className={
                isOffering
                  ? "border-transparent bg-brand text-brand-foreground"
                  : "border-transparent bg-success/10 text-success"
              }
            >
              {TYPE_LABEL[item.type]}
            </Badge>
            {cat?.short && (
              <Badge variant="outline" className="border-border bg-muted/60 text-muted-foreground font-normal">
                {cat.short}
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-brand">
            {item.title}
          </h3>

          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2 hidden sm:block">
              {item.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              <span className="truncate">{item.city}{item.district ? ` / ${item.district}` : ""}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              <time dateTime={item.created_at}>{timeAgo(item.created_at)}</time>
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end justify-between">
          <div className="text-brand font-bold text-base sm:text-lg whitespace-nowrap tabular-nums">
            {formatPrice(item.price, item.price_type)}
          </div>
        </div>
      </div>
    </Link>
  );
}
