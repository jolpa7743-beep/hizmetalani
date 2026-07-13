import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, type ListingRow } from "@/components/ListingCard";
import { CATEGORIES, TR_CITIES, type CategoryKey } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const searchSchema = z.object({
  kategori: z.string().optional(),
  tip: z.enum(["offering", "seeking"]).optional(),
  sehir: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  component: HomePage,
  head: () => ({
    meta: [
      { title: "hizmetalanı.com — Bakıcı, Temizlik ve Evcil Hayvan Geçici Yuva İlanları" },
    ],
  }),
});

function HomePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", search],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id, title, type, category, city, district, price, price_type, created_at, description")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);

      if (search.kategori) query = query.eq("category", search.kategori as CategoryKey);
      if (search.tip) query = query.eq("type", search.tip);
      if (search.sehir) query = query.eq("city", search.sehir);
      if (search.q) query = query.ilike("title", `%${search.q}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ListingRow[];
    },
  });

  const setParam = (key: string, val: string | undefined) => {
    navigate({ search: (prev: Record<string, string | undefined>) => ({ ...prev, [key]: val || undefined }) });
  };

  const clearAll = () => {
    setQ("");
    navigate({ search: {} });
  };

  const activeFilterCount =
    (search.kategori ? 1 : 0) + (search.tip ? 1 : 0) + (search.sehir ? 1 : 0) + (search.q ? 1 : 0);

  return (
    <div className="bg-hero-grid">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Search + filters */}
        <section
          aria-label="İlan arama"
          className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]"
        >
          <form
            role="search"
            className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
            onSubmit={(e) => { e.preventDefault(); setParam("q", q); }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
              <label htmlFor="search-q" className="sr-only">Anahtar kelime ara</label>
              <Input
                id="search-q"
                placeholder="İlan başlığı ara... (ör. bakıcı, ev temizliği)"
                className="pl-9 h-11 bg-surface"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={search.sehir ?? "all"} onValueChange={(v) => setParam("sehir", v === "all" ? undefined : v)}>
              <SelectTrigger className="h-11 md:w-40 bg-surface" aria-label="Şehir seç">
                <SelectValue placeholder="Şehir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şehirler</SelectItem>
                {TR_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={search.tip ?? "all"} onValueChange={(v) => setParam("tip", v === "all" ? undefined : v)}>
              <SelectTrigger className="h-11 md:w-44 bg-surface" aria-label="İlan tipi seç">
                <SelectValue placeholder="İlan Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="offering">Hizmet Veriyor</SelectItem>
                <SelectItem value="seeking">Hizmet Arıyor</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="h-11 bg-brand hover:bg-brand/90 shadow-sm">
              <SlidersHorizontal className="size-4 mr-1.5" aria-hidden /> Ara
            </Button>
          </form>

          {/* Category chips */}
          <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible" role="tablist" aria-label="Kategoriler">
            <CategoryChip active={!search.kategori} onClick={() => setParam("kategori", undefined)}>
              Tüm Kategoriler
            </CategoryChip>
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.key}
                active={search.kategori === c.key}
                onClick={() => setParam("kategori", c.key)}
              >
                <span aria-hidden className="mr-1">{c.emoji}</span>{c.short}
              </CategoryChip>
            ))}
          </div>
        </section>

        {/* Results header */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isLoading ? "Yükleniyor..." : `${listings?.length ?? 0} ilan bulundu`}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <X className="size-3.5" aria-hidden /> Filtreleri temizle ({activeFilterCount})
              </button>
            )}
          </div>
          <Link to="/ilan-ver">
            <Button size="sm" variant="outline">+ Ücretsiz İlan Ver</Button>
          </Link>
        </div>

        {/* Feed — sahibinden tarzı liste */}
        <section aria-label="İlanlar" className="mt-4 rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)] overflow-hidden">
          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 border-b border-border last:border-b-0 bg-surface animate-pulse" />
          ))}
          {!isLoading && (listings?.length ?? 0) === 0 && (
            <div className="text-center py-16 px-4">
              <div className="text-4xl" aria-hidden>🔍</div>
              <p className="mt-3 text-lg font-semibold">Henüz ilan bulunamadı</p>
              <p className="mt-1 text-sm text-muted-foreground">Filtreleri değiştirin ya da ilk ilanı siz verin.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={clearAll}>Filtreleri temizle</Button>
                )}
                <Link to="/ilan-ver">
                  <Button className="bg-brand hover:bg-brand/90">Ücretsiz İlan Ver</Button>
                </Link>
              </div>
            </div>
          )}
          {listings?.map((item) => <ListingCard key={item.id} item={item} />)}
        </section>
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "bg-brand text-brand-foreground border-brand shadow-sm"
          : "bg-surface hover:bg-brand-soft hover:border-brand/40 border-border text-foreground/80")
      }
    >
      {children}
    </button>
  );
}
