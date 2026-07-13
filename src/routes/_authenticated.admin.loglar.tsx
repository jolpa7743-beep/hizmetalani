import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Trash2, RefreshCw, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type LogRow = {
  id: string;
  level: string;
  source: string;
  message: string;
  context: Record<string, unknown> | null;
  url: string | null;
  user_id: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/loglar")({
  component: LogsPage,
  head: () => ({ meta: [{ title: "Sistem Logları — Yönetici" }] }),
});

function LogsPage() {
  const qc = useQueryClient();
  const [level, setLevel] = useState<string>("all");
  const [q, setQ] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-logs", level],
    queryFn: async () => {
      let query = supabase
        .from("app_logs" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (level !== "all") query = query.eq("level", level);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as LogRow[];
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_logs" as never)
        .delete()
        .not("id", "is", null);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tüm loglar silindi");
      qc.invalidateQueries({ queryKey: ["admin-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data ?? []).filter((r) =>
    q.trim() ? (r.message + " " + (r.url ?? "") + " " + r.source).toLowerCase().includes(q.toLowerCase()) : true,
  );

  const levelIcon = (l: string) =>
    l === "error" ? <AlertCircle className="size-4 text-destructive" /> :
    l === "warn" ? <AlertTriangle className="size-4 text-amber-500" /> :
    <Info className="size-4 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Sistem Logları</h1>
          <p className="text-sm text-muted-foreground">Client + sunucu tarafındaki tüm hatalar ve olaylar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Tüm loglar silinsin mi?")) clearAll.mutate();
            }}
          >
            <Trash2 className="size-4" /> Temizle
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "error", "warn", "info"].map((l) => (
          <Button
            key={l}
            size="sm"
            variant={level === l ? "default" : "outline"}
            onClick={() => setLevel(l)}
          >
            {l === "all" ? "Hepsi" : l.toUpperCase()}
          </Button>
        ))}
        <Input
          placeholder="Ara: mesaj, url, kaynak…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Log kaydı yok.
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {rows.map((r) => (
            <details key={r.id} className="group">
              <summary className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 list-none">
                {levelIcon(r.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("tr-TR")}
                    </span>
                    {r.user_id && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        user: {r.user_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1 break-words">{r.message}</div>
                  {r.url && <div className="text-[11px] text-muted-foreground truncate">{r.url}</div>}
                </div>
              </summary>
              {r.context && (
                <pre className="text-[11px] bg-muted/50 p-3 overflow-auto max-h-64 border-t">
                  {JSON.stringify(r.context, null, 2)}
                </pre>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
