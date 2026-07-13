import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, type ListingRow } from "@/components/ListingCard";
import { CATEGORIES, TR_CITIES, type CategoryKey, type ListingType } from "@/lib/categories";
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Search bar */}
      <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
        <form
          className="flex flex-col md:flex-row gap-2"
          onSubmit={(e) => { e.preventDefault(); setParam("q", q); }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="İlan başlığı ara... (ör. bakıcı, ev temizliği)"
              className="pl-9 h-11"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={search.sehir ?? "all"} onValueChange={(v) => setParam("sehir", v === "all" ? undefined : v)}>
            <SelectTrigger className="md:w-44 h-11"><SelectValue placeholder="Şehir" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Şehirler</SelectItem>
              {TR_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.tip ?? "all"} onValueChange={(v) => setParam("tip", v === "all" ? undefined : v)}>
            <SelectTrigger className="md:w-44 h-11"><SelectValue placeholder="İlan Tipi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="offering">Hizmet Veriyor</SelectItem>
              <SelectItem value="seeking">Hizmet Arıyor</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="h-11 bg-brand hover:bg-brand/90">
            <Filter className="size-4 mr-1" /> Ara
          </Button>
        </form>

        {/* Category chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setParam("kategori", undefined)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !search.kategori ? "bg-brand text-brand-foreground border-brand" : "bg-surface hover:bg-muted border-border"
            }`}
          >
            Tüm Kategoriler
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setParam("kategori", c.key)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                search.kategori === c.key ? "bg-brand text-brand-foreground border-brand" : "bg-surface hover:bg-muted border-border"
              }`}
            >
              <span className="mr-1">{c.emoji}</span>{c.short}
            </button>
          ))}
        </div>
      </div>

      {/* Listings feed */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Yükleniyor..." : `${listings?.length ?? 0} ilan bulundu`}
        </div>
        <Link to="/ilan-ver">
          <Button size="sm" variant="outline">+ İlan Ver</Button>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border border-border bg-surface animate-pulse" />
        ))}
        {!isLoading && (listings?.length ?? 0) === 0 && (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-surface">
            <p className="text-lg font-medium">Henüz ilan bulunamadı</p>
            <p className="mt-1 text-sm text-muted-foreground">Filtreleri değiştirin ya da ilk ilanı siz verin.</p>
            <Link to="/ilan-ver" className="inline-block mt-4">
              <Button className="bg-brand hover:bg-brand/90">Ücretsiz İlan Ver</Button>
            </Link>
          </div>
        )}
        {listings?.map((item) => <ListingCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}
