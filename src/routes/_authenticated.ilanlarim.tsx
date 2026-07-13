import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_MAP, formatPrice, type CategoryKey, type ListingType } from "@/lib/categories";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ilanlarim")({
  component: MyListings,
  head: () => ({ meta: [{ title: "İlanlarım — hizmetalanı.com" }] }),
});

type MyListing = {
  id: string; title: string; category: CategoryKey; type: ListingType;
  city: string; district: string | null; price: number | null; price_type: string;
  status: "active" | "paused" | "closed"; view_count: number; created_at: string;
};

function MyListings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,category,type,city,district,price,price_type,status,view_count,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MyListing[];
    },
  });

  const toggleStatus = async (id: string, status: string) => {
    const next = status === "active" ? "paused" : "active";
    const { error } = await supabase.from("listings").update({ status: next }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-listings"] });
    toast.success(next === "active" ? "İlan aktif edildi" : "İlan duraklatıldı");
  };

  const remove = async (id: string) => {
    if (!confirm("İlanı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-listings"] });
    toast.success("İlan silindi");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">İlanlarım</h1>
        <Link to="/ilan-ver">
          <Button className="bg-brand hover:bg-brand/90"><Plus className="size-4 mr-1" /> Yeni İlan</Button>
        </Link>
      </div>

      {isLoading && <p>Yükleniyor...</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="text-center py-16 border border-dashed rounded-xl bg-surface">
          <p className="font-medium">Henüz ilan vermediniz</p>
          <Link to="/ilan-ver"><Button className="mt-4 bg-brand hover:bg-brand/90">İlk İlanınızı Verin</Button></Link>
        </div>
      )}

      <div className="space-y-3">
        {data?.map((l) => (
          <div key={l.id} className="bg-surface border rounded-lg p-4 flex flex-col md:flex-row gap-4">
            <div className="size-16 rounded bg-gradient-to-br from-brand/10 to-brand-accent/10 grid place-items-center shrink-0">
              {(() => { const I = CATEGORY_MAP[l.category]?.icon; return I ? <I className="size-7 text-brand/70" aria-hidden /> : null; })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant={l.status === "active" ? "default" : "secondary"} className={l.status === "active" ? "bg-emerald-600" : ""}>
                  {l.status === "active" ? "Aktif" : l.status === "paused" ? "Duraklatıldı" : "Kapalı"}
                </Badge>
                <span className="text-xs text-muted-foreground">{CATEGORY_MAP[l.category]?.short}</span>
              </div>
              <h3 className="font-semibold truncate">{l.title}</h3>
              <div className="text-sm text-muted-foreground">
                {l.city}{l.district ? ` / ${l.district}` : ""} • {formatPrice(l.price, l.price_type)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Eye className="size-3" /> {l.view_count} görüntüleme • {new Date(l.created_at).toLocaleDateString("tr-TR")}
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/ilan/$id" params={{ id: l.id }}>
                <Button variant="outline" size="sm"><Eye className="size-4" /></Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => toggleStatus(l.id, l.status)}>
                <Pencil className="size-4 mr-1" />{l.status === "active" ? "Durdur" : "Aktif Et"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => remove(l.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
