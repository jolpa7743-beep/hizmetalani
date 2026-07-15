import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { adminListReviewReports, adminSetReportStatus, adminSetReviewStatus } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRow } from "@/components/UserReviews";
import { Check, X, Trash2, User as UserIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ durum: z.enum(["all", "open", "resolved", "dismissed"]).optional() });

export const Route = createFileRoute("/_authenticated/admin/raporlar")({
  validateSearch: searchSchema,
  component: AdminReports,
});

const TABS = [
  { key: "open", label: "Açık" },
  { key: "resolved", label: "Çözüldü" },
  { key: "dismissed", label: "Reddedildi" },
  { key: "all", label: "Tümü" },
] as const;

function AdminReports() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const active = search.durum ?? "open";

  const fetch = useServerFn(adminListReviewReports);
  const setRep = useServerFn(adminSetReportStatus);
  const setRev = useServerFn(adminSetReviewStatus);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-review-reports"],
    queryFn: () => fetch(),
  });

  const filtered = (data ?? []).filter((r) => active === "all" || r.status === active);

  async function updateStatus(id: string, status: "open" | "resolved" | "dismissed") {
    setBusy(id);
    try {
      await setRep({ data: { reportId: id, status } });
      toast.success("Güncellendi");
      qc.invalidateQueries({ queryKey: ["admin-review-reports"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  async function removeReview(reviewId: string, reportId: string) {
    setBusy(reportId);
    try {
      await setRev({ data: { reviewId, status: "rejected", note: "Şikayet üzerine kaldırıldı" } });
      await setRep({ data: { reportId, status: "resolved" } });
      toast.success("Yorum reddedildi ve şikayet kapatıldı");
      qc.invalidateQueries({ queryKey: ["admin-review-reports"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Yorum Şikayetleri</h1>
        <p className="text-sm text-muted-foreground">Üyelerin şikayet ettiği yorumları yönetin</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = t.key === "all" ? (data?.length ?? 0) : (data ?? []).filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => navigate({ search: { durum: t.key === "open" ? undefined : t.key } })}
              className={`px-3 py-1.5 rounded-lg text-sm border ${active === t.key ? "bg-brand text-white border-brand" : "bg-card"}`}
            >
              {t.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Bu durumda şikayet yok.</p>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="bg-card border rounded-xl p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={r.status === "open" ? "destructive" : r.status === "resolved" ? "default" : "secondary"}>
                    {r.status === "open" ? "Açık" : r.status === "resolved" ? "Çözüldü" : "Reddedildi"}
                  </Badge>
                  {r.rating != null && <StarRow value={r.rating} />}
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("tr-TR")}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Link
                    to="/admin/kullanicilar"
                    search={{ q: r.reporter_name ?? "" }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted"
                    title="Şikayet edeni kullanıcı listesinde aç"
                  >
                    <UserIcon className="size-3" /> Şikayet eden: <strong>{r.reporter_name ?? "Üye"}</strong>
                    <ExternalLink className="size-3 opacity-60" />
                  </Link>
                  <Link
                    to="/admin/kullanicilar"
                    search={{ q: r.reviewee_name ?? "" }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted"
                    title="Yorumun hedefini kullanıcı listesinde aç"
                  >
                    <UserIcon className="size-3" /> Hedef: <strong>{r.reviewee_name ?? "Üye"}</strong>
                    <ExternalLink className="size-3 opacity-60" />
                  </Link>
                  <Link
                    to="/admin/yorumlar"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted"
                    title="Yorumlar sekmesini aç"
                  >
                    Yoruma git <ExternalLink className="size-3 opacity-60" />
                  </Link>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {r.status !== "resolved" && (
                  <Button size="sm" onClick={() => removeReview(r.review_id, r.id)} disabled={busy === r.id} variant="destructive" className="gap-1">
                    <Trash2 className="size-4" /> Yorumu Kaldır
                  </Button>
                )}
                {r.status !== "dismissed" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "dismissed")} disabled={busy === r.id} className="gap-1">
                    <X className="size-4" /> Şikayeti Reddet
                  </Button>
                )}
                {r.status !== "resolved" && (
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "resolved")} disabled={busy === r.id} className="gap-1">
                    <Check className="size-4" /> Çözüldü Olarak Kapat
                  </Button>
                )}
                {r.status !== "open" && (
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "open")} disabled={busy === r.id} className="gap-1">
                    Yeniden Aç
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm border-t pt-3">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Şikayet sebebi</div>
                <p className="whitespace-pre-wrap">{r.reason}</p>
              </div>
              {r.review_comment && (
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Şikayet edilen yorum</div>
                  <p className="whitespace-pre-wrap italic">"{r.review_comment}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
