import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { z } from "zod";
import { Search, X, SlidersHorizontal, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, type ListingRow } from "@/components/ListingCard";
import { AdSlot } from "@/components/AdSlot";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { ILLER, getIlceler } from "@/lib/turkiye";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SORT_OPTIONS = [
  { value: "newest", label: "En yeni" },
  { value: "oldest", label: "En eski" },
  { value: "price_asc", label: "Fiyat: Artan" },
  { value: "price_desc", label: "Fiyat: Azalan" },
  { value: "popular", label: "En popüler" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const searchSchema = z.object({
  kategori: z.string().optional(),
  tip: z.enum(["offering", "seeking"]).optional(),
  sehir: z.string().optional(),
  ilce: z.string().optional(),
  q: z.string().optional(),
  siralama: z.enum(["newest", "oldest", "price_asc", "price_desc", "popular"]).optional(),
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
  const [ilceInput, setIlceInput] = useState(search.ilce ?? "");
  const sort: SortValue = search.siralama ?? "newest";

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", search],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("id, title, type, category, city, district, price, price_type, created_at, description, view_count")
        .eq("status", "active")
        .limit(90);

      if (search.kategori) query = query.eq("category", search.kategori as CategoryKey);
      if (search.tip) query = query.eq("type", search.tip);
      if (search.sehir) query = query.eq("city", search.sehir);
      if (search.ilce) query = query.ilike("district", `%${search.ilce}%`);
      if (search.q) query = query.or(`title.ilike.%${search.q}%,description.ilike.%${search.q}%`);

      switch (sort) {
        case "oldest": query = query.order("created_at", { ascending: true }); break;
        case "price_asc": query = query.order("price", { ascending: true, nullsFirst: false }); break;
        case "price_desc": query = query.order("price", { ascending: false, nullsFirst: false }); break;
        case "popular": query = query.order("view_count", { ascending: false }).order("created_at", { ascending: false }); break;
        default: query = query.order("created_at", { ascending: false });
      }

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
    setIlceInput("");
    navigate({ search: {} });
  };

  const activeFilterCount =
    (search.kategori ? 1 : 0) +
    (search.tip ? 1 : 0) +
    (search.sehir ? 1 : 0) +
    (search.ilce ? 1 : 0) +
    (search.q ? 1 : 0);

  const submitTopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", q);
  };

  return (
    <div className="bg-hero-grid">
      {/* Sahibinden tarzı üst arama çubuğu */}
      <div className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <form
            role="search"
            onSubmit={submitTopSearch}
            className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
              <label htmlFor="top-q" className="sr-only">Anahtar kelime</label>
              <Input
                id="top-q"
                placeholder="Kelime, hizmet veya ilan başlığı ara..."
                className="pl-9 h-11 bg-surface"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select
              value={search.kategori ?? "all"}
              onValueChange={(v) => setParam("kategori", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="h-11 bg-surface" aria-label="Kategori"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.short}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={search.sehir ?? "all"}
              onValueChange={(v) => setParam("sehir", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="h-11 bg-surface" aria-label="Şehir"><SelectValue placeholder="Şehir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şehirler</SelectItem>
                {ILLER.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit" className="h-11 bg-brand hover:bg-brand/90 shadow-sm">
              <Search className="size-4 mr-1.5" aria-hidden /> Ara
            </Button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sol filtre paneli — desktop */}
          <aside className="hidden lg:block">
            <FilterPanel
              search={search}
              ilceInput={ilceInput}
              setIlceInput={setIlceInput}
              setParam={setParam}
              clearAll={clearAll}
              activeFilterCount={activeFilterCount}
            />
          </aside>

          <div>
            {/* Sonuç başlığı + sıralama */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                {/* Mobile filtre butonu */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden h-10">
                      <SlidersHorizontal className="size-4 mr-1.5" aria-hidden />
                      Filtreler
                      {activeFilterCount > 0 && (
                        <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filtreler</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FilterPanel
                        search={search}
                        ilceInput={ilceInput}
                        setIlceInput={setIlceInput}
                        setParam={setParam}
                        clearAll={clearAll}
                        activeFilterCount={activeFilterCount}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {isLoading ? "Yükleniyor..." : `${listings?.length ?? 0} ilan`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-muted-foreground hidden sm:block">Sırala:</label>
                <Select value={sort} onValueChange={(v) => setParam("siralama", v === "newest" ? undefined : v)}>
                  <SelectTrigger id="sort" className="h-10 w-[160px] bg-surface" aria-label="Sıralama">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* İlan ızgarası — yatay kartlar */}
            <section aria-label="İlanlar" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse" />
              ))}
              {!isLoading && (listings?.length ?? 0) === 0 && (
                <div className="col-span-full text-center py-16 border border-dashed border-border rounded-2xl bg-card">
                  <Search className="size-10 mx-auto text-muted-foreground" aria-hidden />
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
              {listings?.map((item, i) => (
                <Fragment key={item.id}>
                  <ListingCard item={item} />
                  {i === 5 && (
                    <div className="col-span-full">
                      <AdSlot slot="sidebar" />
                    </div>
                  )}
                </Fragment>
              ))}
            </section>

            <AdSlot slot="footer" className="mt-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  search,
  ilceInput,
  setIlceInput,
  setParam,
  clearAll,
  activeFilterCount,
}: {
  search: z.infer<typeof searchSchema>;
  ilceInput: string;
  setIlceInput: (v: string) => void;
  setParam: (k: string, v: string | undefined) => void;
  clearAll: () => void;
  activeFilterCount: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] lg:sticky lg:top-20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm inline-flex items-center gap-2">
          <Filter className="size-4 text-brand" aria-hidden /> Filtrele
        </h2>
        {activeFilterCount > 0 && (
          <button onClick={clearAll} className="text-xs text-brand hover:underline inline-flex items-center gap-1">
            <X className="size-3.5" /> Temizle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* İl */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">İl</Label>
          <Select
            value={search.sehir ?? "all"}
            onValueChange={(v) => {
              const next = v === "all" ? undefined : v;
              setIlceInput("");
              setParam("ilce", undefined);
              setParam("sehir", next);
            }}
          >
            <SelectTrigger className="h-10 mt-1.5 bg-surface"><SelectValue placeholder="Tüm İller" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Tüm İller</SelectItem>
              {ILLER.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* İlçe — il seçildiğinde dinamik yüklenir */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">İlçe</Label>
          <Select
            value={search.ilce ?? "all"}
            onValueChange={(v) => setParam("ilce", v === "all" ? undefined : v)}
            disabled={!search.sehir}
          >
            <SelectTrigger className="h-10 mt-1.5 bg-surface">
              <SelectValue placeholder={search.sehir ? "Tüm İlçeler" : "Önce il seçin"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Tüm İlçeler</SelectItem>
              {getIlceler(search.sehir).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>


        {/* İlan Tipi */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">İlan Tipi</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-md border border-border p-1 bg-surface-muted">
            {(["all", "offering", "seeking"] as const).map((t) => {
              const active = (search.tip ?? "all") === t;
              const label = t === "all" ? "Tümü" : t === "offering" ? "Veriyor" : "Arıyor";
              return (
                <button
                  key={t}
                  onClick={() => setParam("tip", t === "all" ? undefined : t)}
                  className={
                    "rounded px-2 py-1.5 text-xs font-medium transition-colors " +
                    (active ? "bg-brand text-brand-foreground shadow-sm" : "text-foreground/70 hover:bg-muted")
                  }
                >{label}</button>
              );
            })}
          </div>
        </div>

        {/* Kategoriler */}
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Kategori</Label>
          <div className="mt-1.5 space-y-1">
            <CategoryRadio label="Tüm Kategoriler" active={!search.kategori} onClick={() => setParam("kategori", undefined)} />
            {CATEGORIES.map((c) => (
              <CategoryRadio
                key={c.key}
                label={<><c.icon className="mr-1.5 inline size-4" aria-hidden />{c.short}</>}
                active={search.kategori === c.key}
                onClick={() => setParam("kategori", c.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryRadio({
  label,
  active,
  onClick,
}: { label: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "w-full text-left rounded-md px-2.5 py-2 text-sm transition-colors " +
        (active
          ? "bg-brand-soft text-brand font-semibold"
          : "hover:bg-muted text-foreground/85")
      }
    >
      {label}
    </button>
  );
}
