import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListReviews, adminSetReviewStatus } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRow } from "@/components/UserReviews";
import { Check, X, RotateCcw, Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/yorumlar")({
  component: AdminReviews,
});

const TABS = [
  { key: "pending", label: "Onay Bekleyen" },
  { key: "approved", label: "Onaylı" },
  { key: "rejected", label: "Reddedilen" },
  { key: "", label: "Tümü" },
] as const;

function AdminReviews() {
  const [status, setStatus] = useState<string>("pending");
  const fetch = useServerFn(adminListReviews);
  const setStatusFn = useServerFn(adminSetReviewStatus);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: () => fetch({ data: { status: status || null } }),
  });

  async function act(id: string, newStatus: "approved" | "rejected" | "pending") {
    try {
      await setStatusFn({ data: { reviewId: id, status: newStatus } });
      toast.success("Güncellendi");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Yorumlar</h1>
        <p className="text-sm text-muted-foreground">Kullanıcı yorumlarını onaylayın veya reddedin</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${status === t.key ? "bg-brand text-white border-brand" : "bg-card"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground italic">Bu kategoride yorum yok.</p>
        )}
        {(data ?? []).map((r) => (
          <div key={r.id} className="bg-card border rounded-xl p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <StarRow value={r.rating} />
                  <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                    {r.status === "approved" ? "Onaylı" : r.status === "rejected" ? "Reddedildi" : "Beklemede"}
                  </Badge>
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
              <div className="flex gap-1">
                {r.status !== "approved" && (
                  <Button size="sm" onClick={() => act(r.id, "approved")} className="gap-1">
                    <Check className="size-4" /> Onayla
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button size="sm" variant="outline" onClick={() => act(r.id, "rejected")} className="gap-1 text-destructive">
                    <X className="size-4" /> Reddet
                  </Button>
                )}
                {r.status !== "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => act(r.id, "pending")} className="gap-1">
                    <RotateCcw className="size-4" /> Beklemeye al
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap border-t pt-3">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
