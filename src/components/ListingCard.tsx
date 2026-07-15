import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { CATEGORY_MAP, TYPE_LABEL, formatPrice, type CategoryKey, type ListingType } from "@/lib/categories";

export type ListingRow = {
  id: string;
  user_id?: string;
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

export function ListingCard({
  item,
  ownerRating,
}: {
  item: ListingRow & { is_urgent?: boolean; is_featured?: boolean };
  ownerRating?: { avg: number; count: number };
}) {
  const cat = CATEGORY_MAP[item.category];
  const isOffering = item.type === "offering";
  return (
    <Link
      to="/ilan/$id"
      params={{ id: item.id }}
      aria-label={`${item.title} — ${item.city}${item.district ? ` / ${item.district}` : ""}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-elevated)] focus-visible:-translate-y-0.5"
    >
      {/* İçerik */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={
              "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
              (isOffering ? "bg-brand text-brand-foreground" : "bg-success/90 text-success-foreground")
            }
          >
            {TYPE_LABEL[item.type]}
          </span>
          {item.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Öne Çıkan
            </span>
          )}
          {item.is_urgent && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Acil
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground">{cat?.short}</span>
        </div>

        <h3 className="mt-2 font-semibold text-[15px] text-foreground leading-snug line-clamp-2 group-hover:text-brand">
          {item.title}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
          <span className="truncate">{item.city}{item.district ? ` / ${item.district}` : ""}</span>
          {typeof item.view_count === "number" && item.view_count > 0 && (
            <span className="tabular-nums">{item.view_count} görüntülenme</span>
          )}
        </div>

        {ownerRating && ownerRating.count > 0 ? (
          <div className="mt-1.5 inline-flex items-center gap-1 text-xs" aria-label={`İlan sahibi puanı ${ownerRating.avg.toFixed(1)} / 5, ${ownerRating.count} değerlendirme`}>
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`size-3 ${n <= Math.round(ownerRating.avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
              ))}
            </span>
            <span className="font-semibold tabular-nums">{ownerRating.avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({ownerRating.count})</span>
          </div>
        ) : (
          <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground/70" aria-label="Henüz değerlendirme yok">
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className="size-3 text-muted-foreground/30" />
              ))}
            </span>
            <span>Yeni</span>
          </div>
        )}

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
