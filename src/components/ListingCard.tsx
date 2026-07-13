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
  return (
    <Link
      to="/ilan/$id"
      params={{ id: item.id }}
      className="group flex gap-4 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-md hover:border-brand/30"
    >
      <div className="shrink-0 grid place-items-center size-20 rounded-md bg-gradient-to-br from-brand/10 to-brand-accent/10 text-3xl">
        <span aria-hidden>{cat?.emoji ?? "🔧"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant={item.type === "offering" ? "default" : "secondary"} className={item.type === "offering" ? "bg-brand text-brand-foreground" : ""}>
                {TYPE_LABEL[item.type]}
              </Badge>
              <span className="text-xs text-muted-foreground">{cat?.short}</span>
            </div>
            <h3 className="font-semibold text-foreground truncate group-hover:text-brand">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{item.description}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-brand font-bold text-lg whitespace-nowrap">
              {formatPrice(item.price, item.price_type)}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {item.city}{item.district ? ` / ${item.district}` : ""}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {timeAgo(item.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
