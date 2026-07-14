import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListReviewReports, adminSetReportStatus, adminSetReviewStatus } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRow } from "@/components/UserReviews";
import { Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/raporlar")({
  component: AdminReports,
});

function AdminReports() {
  const fetch = useServerFn(adminListReviewReports);
  const setRep = useServerFn(adminSetReportStatus);
  const setRev = useServerFn(adminSetReviewStatus);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-review-reports"],
    queryFn: () => fetch(),
  });

  async function resolve(id: string, status: "resolved" | "dismissed") {
    try {
      await setRep({ data: { reportId: id, status } });
      toast.success("Güncellendi");
      qc.invalidateQueries({ queryKey: ["admin-review-reports"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  }

  async function removeReview(reviewId: string, reportId: string) {
    try {
      await setRev({ data: { reviewId, status: "rejected", note: "Şikayet üzerine kaldırıldı" } });
      await setRep({ data: { reportId, status: "resolved" } });
      toast.success("Yorum reddedildi ve şikayet kapatıldı");
      qc.invalidateQueries({ queryKey: ["admin-review-reports"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Yorum Şikayetleri</h1>
        <p className="text-sm text-muted-foreground">Üyelerin şikayet ettiği yorumlar</p>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground italic">Şikayet yok.</p>
        )}
        {(data ?? []).map((r) => (
          <div key={r.id} className="bg-card border rounded-xl p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={r.status === "open" ? "destructive" : "secondary"}>
                    {r.status === "open" ? "Açık" : r.status === "resolved" ? "Çözüldü" : "Reddedildi"}
                  </Badge>
                  {r.rating != null && <StarRow value={r.rating} />}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Şikayet eden: <span className="font-medium text-foreground">{r.reporter_name ?? "Üye"}</span>
                  {" · "}Yorum sahibinin hedefi: <span className="font-medium text-foreground">{r.reviewee_name ?? "Üye"}</span>
                  {" · "}{new Date(r.created_at).toLocaleString("tr-TR")}
                </div>
              </div>
              {r.status === "open" && (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => removeReview(r.review_id, r.id)} className="gap-1" variant="destructive">
                    <Trash2 className="size-4" /> Yorumu Kaldır
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolve(r.id, "dismissed")} className="gap-1">
                    <X className="size-4" /> Şikayeti Reddet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resolve(r.id, "resolved")} className="gap-1">
                    <Check className="size-4" /> Kapat
                  </Button>
                </div>
              )}
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
