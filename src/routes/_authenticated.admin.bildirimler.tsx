import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminModerationInbox,
  adminRecentModActions,
  adminSetReviewStatus,
  adminSetReportStatus,
} from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRow } from "@/components/UserReviews";
import { Check, X, RotateCcw, Trash2, Flag, Star, History, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/bildirimler")({
  component: AdminInbox,
});

function AdminInbox() {
  const fetchInbox = useServerFn(adminModerationInbox);
  const fetchHistory = useServerFn(adminRecentModActions);
  const setRev = useServerFn(adminSetReviewStatus);
  const setRep = useServerFn(adminSetReportStatus);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: inbox, isLoading } = useQuery({
    queryKey: ["admin-inbox"],
    queryFn: () => fetchInbox(),
    refetchInterval: 30_000,
  });
  const { data: history } = useQuery({
    queryKey: ["admin-mod-history"],
    queryFn: () => fetchHistory({ data: { limit: 30 } }),
    refetchInterval: 30_000,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-inbox"] });
    qc.invalidateQueries({ queryKey: ["admin-mod-history"] });
    qc.invalidateQueries({ queryKey: ["admin-mod-counts"] });
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["admin-review-reports"] });
  };

  async function reviewAction(id: string, status: "approved" | "rejected" | "pending") {
    setBusy(id);
    try {
      await setRev({ data: { reviewId: id, status } });
      toast.success("Yorum güncellendi");
      invalidateAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  async function reportAction(id: string, status: "resolved" | "dismissed" | "open") {
    setBusy(id);
    try {
      await setRep({ data: { reportId: id, status } });
      toast.success("Şikayet güncellendi");
      invalidateAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  async function removeReviewFromReport(reviewId: string, reportId: string) {
    setBusy(reportId);
    try {
      await setRev({ data: { reviewId, status: "rejected", note: "Şikayet üzerine kaldırıldı" } });
      await setRep({ data: { reportId, status: "resolved" } });
      toast.success("Yorum reddedildi ve şikayet kapatıldı");
      invalidateAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(null);
    }
  }

  const reviews = inbox?.reviews ?? [];
  const reports = inbox?.reports ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bildirim Merkezi</h1>
        <p className="text-sm text-muted-foreground">
          Onay bekleyen yorumları ve açık şikayetleri tek ekrandan yönetin. Tüm işlemler geçmişe kaydedilir.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Pending reviews */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              <h2 className="font-semibold">Onay Bekleyen Yorumlar</h2>
              <Badge variant="secondary">{reviews.length}</Badge>
            </div>
            {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}
            {!isLoading && reviews.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Bekleyen yorum yok. 🎉</p>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="bg-card border rounded-xl p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRow value={r.rating} />
                      <Badge variant="secondary">Beklemede</Badge>
                      {r.open_reports > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <Flag className="size-3" /> {r.open_reports} şikayet
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{r.reviewer_name ?? "Üye"}</span>
                      {" → "}
                      <span className="font-medium text-foreground">{r.reviewee_name ?? "Üye"}</span>
                      {" · "}
                      {new Date(r.created_at).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" onClick={() => reviewAction(r.id, "approved")} disabled={busy === r.id} className="gap-1">
                      <Check className="size-4" /> Onayla
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reviewAction(r.id, "rejected")} disabled={busy === r.id} className="gap-1 text-destructive">
                      <X className="size-4" /> Reddet
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm whitespace-pre-wrap border-t pt-3">{r.comment}</p>
              </div>
            ))}
          </section>

          {/* Open reports */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Flag className="size-4 text-red-500" />
              <h2 className="font-semibold">Açık Şikayetler</h2>
              <Badge variant="secondary">{reports.length}</Badge>
            </div>
            {!isLoading && reports.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Açık şikayet yok.</p>
            )}
            {reports.map((r) => (
              <div key={r.id} className="bg-card border rounded-xl p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="destructive">Açık</Badge>
                      {r.rating != null && <StarRow value={r.rating} />}
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Şikayet eden: <span className="font-medium text-foreground">{r.reporter_name ?? "Üye"}</span>
                      {" · "}
                      Hedef: <span className="font-medium text-foreground">{r.reviewee_name ?? "Üye"}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="destructive" onClick={() => removeReviewFromReport(r.review_id, r.id)} disabled={busy === r.id} className="gap-1">
                      <Trash2 className="size-4" /> Yorumu Kaldır
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reportAction(r.id, "dismissed")} disabled={busy === r.id} className="gap-1">
                      <X className="size-4" /> Reddet
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => reportAction(r.id, "resolved")} disabled={busy === r.id} className="gap-1">
                      <Check className="size-4" /> Çözüldü
                    </Button>
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
          </section>

          <div className="flex gap-2 text-xs">
            <Link to="/admin/yorumlar" className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted">
              Tüm yorumlar <ExternalLink className="size-3 opacity-60" />
            </Link>
            <Link to="/admin/raporlar" className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted">
              Tüm şikayetler <ExternalLink className="size-3 opacity-60" />
            </Link>
          </div>
        </div>

        {/* History sidebar */}
        <aside className="bg-card border rounded-xl p-4 shadow-[var(--shadow-soft)] lg:sticky lg:top-20 lg:self-start max-h-[80vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <History className="size-4" />
            <h2 className="font-semibold">İşlem Geçmişi</h2>
          </div>
          {(history ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground italic">Henüz işlem yok.</p>
          )}
          <ul className="space-y-2">
            {(history ?? []).map((a) => (
              <li key={a.id} className="text-xs border-l-2 border-muted pl-2 py-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] py-0 px-1">
                    {a.target_type === "review" ? "Yorum" : "Şikayet"}
                  </Badge>
                  <span className="font-medium">{labelForAction(a.action)}</span>
                </div>
                <div className="text-muted-foreground mt-0.5">
                  {a.actor_name ?? "Yönetici"}
                  {a.prev_status && a.new_status && (
                    <> · <span className="opacity-70">{a.prev_status}</span> → <span className="font-medium text-foreground">{a.new_status}</span></>
                  )}
                </div>
                <div className="text-muted-foreground/70 text-[10px]">
                  {new Date(a.created_at).toLocaleString("tr-TR")}
                </div>
                {a.note && <div className="mt-0.5 italic opacity-80">"{a.note}"</div>}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function labelForAction(action: string): string {
  const map: Record<string, string> = {
    "set_status:approved": "Onaylandı",
    "set_status:rejected": "Reddedildi",
    "set_status:pending": "Beklemeye alındı",
    "set_status:resolved": "Çözüldü",
    "set_status:dismissed": "Şikayet reddedildi",
    "set_status:open": "Yeniden açıldı",
  };
  return map[action] ?? action;
}
