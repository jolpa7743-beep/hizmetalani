import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2, Search, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_MAP, TYPE_LABEL, formatPrice } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/admin/ilanlar")({
  component: AdminListings,
});

function AdminListings() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filtered = (data ?? []).filter((l) => {
    if (status !== "all" && l.status !== status) return false;
    const s = q.toLowerCase();
    return !s || l.title.toLowerCase().includes(s) || l.city.toLowerCase().includes(s);
  });

  const setStatusFor = async (id: string, next: "active" | "paused" | "closed") => {
    const { error } = await supabase.from("listings").update({ status: next }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Durum güncellendi");
    qc.invalidateQueries({ queryKey: ["admin-listings"] });
  };

  const remove = async (id: string) => {
    if (!confirm("İlanı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("İlan silindi");
    qc.invalidateQueries({ queryKey: ["admin-listings"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">İlan Yönetimi</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} / {data?.length ?? 0} ilan
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="paused">Duraklatıldı</SelectItem>
              <SelectItem value="closed">Kapalı</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 sm:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara..." className="pl-9" />
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-[var(--shadow-soft)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">İlan</th>
                <th className="px-4 py-3">Konum</th>
                <th className="px-4 py-3">Fiyat</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Yükleniyor...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">İlan yok</td></tr>
              )}
              {filtered.map((l) => (
                <tr key={l.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded bg-gradient-to-br from-brand/10 to-brand-accent/10 grid place-items-center text-lg shrink-0">
                        {CATEGORY_MAP[l.category]?.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[280px]">{l.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {TYPE_LABEL[l.type]} • {CATEGORY_MAP[l.category]?.short}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.city}{l.district ? ` / ${l.district}` : ""}
                  </td>
                  <td className="px-4 py-3">{formatPrice(l.price, l.price_type)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        l.status === "active"
                          ? "bg-emerald-600"
                          : l.status === "paused"
                          ? "bg-amber-500"
                          : "bg-muted text-foreground"
                      }
                    >
                      {l.status === "active" ? "Aktif" : l.status === "paused" ? "Duraklatıldı" : "Kapalı"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to="/ilan/$id" params={{ id: l.id }}>
                        <Button size="sm" variant="outline"><Eye className="size-4" /></Button>
                      </Link>
                      {l.status === "active" ? (
                        <Button size="sm" variant="outline" onClick={() => setStatusFor(l.id, "paused")} title="Duraklat">
                          <Pause className="size-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setStatusFor(l.id, "active")} title="Aktif et">
                          <Play className="size-4" />
                        </Button>
                      )}
                      {l.status !== "closed" && (
                        <Button size="sm" variant="outline" onClick={() => setStatusFor(l.id, "closed")} title="Kapat">
                          <X className="size-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove(l.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
