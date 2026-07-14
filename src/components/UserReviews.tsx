import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createReview, getUserReviews, reportReview } from "@/lib/reviews.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Star, Flag } from "lucide-react";
import { toast } from "sonner";

export function StarRow({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value} yıldız`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

export function UserReviews({
  userId,
  ownerName,
  listingId,
}: {
  userId: string;
  ownerName: string;
  listingId?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchReviews = useServerFn(getUserReviews);
  const submitReview = useServerFn(createReview);
  const submitReport = useServerFn(reportReview);

  const { data, isLoading } = useQuery({
    queryKey: ["user-reviews", userId],
    queryFn: () => fetchReviews({ data: { userId } }),
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reportOpen, setReportOpen] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canWrite = user && user.id !== userId;
  const alreadyReviewed = data?.reviews.some((r: { reviewer_id: string }) => r.reviewer_id === user?.id);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return toast.error("Lütfen puan verin");
    if (comment.trim().length < 5) return toast.error("Yorum en az 5 karakter olmalı");
    setSubmitting(true);
    try {
      await submitReview({ data: { revieweeId: userId, listingId, rating, comment } });
      toast.success("Yorumunuz alındı — admin onayından sonra yayınlanacak");
      setRating(0); setComment("");
      qc.invalidateQueries({ queryKey: ["user-reviews", userId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    } finally {
      setSubmitting(false);
    }
  }

  async function onReport() {
    if (!reportOpen || !reportReason.trim()) return;
    try {
      await submitReport({ data: { reviewId: reportOpen, reason: reportReason } });
      toast.success("Şikayet gönderildi, admin inceleyecek");
      setReportOpen(null); setReportReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-lg">Üye Değerlendirmeleri</h2>
        {data && data.count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <StarRow value={data.avg} />
            <span className="font-semibold">{data.avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({data.count} yorum)</span>
          </div>
        )}
      </div>

      {canWrite && !alreadyReviewed && (
        <form onSubmit={onSubmit} className="mt-4 border-t pt-4 space-y-3">
          <div className="text-sm font-medium">{ownerName} için yorum yaz</div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`${n} yıldız ver`}
              >
                <Star className={`size-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="İş deneyiminizi paylaşın (en az 5 karakter)"
            rows={3}
            maxLength={1000}
          />
          <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand/90">
            {submitting ? "Gönderiliyor..." : "Yorum Gönder"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Yorumlar admin onayından sonra yayınlanır.
          </p>
        </form>
      )}
      {canWrite && alreadyReviewed && (
        <p className="mt-3 text-xs text-muted-foreground italic">Bu üye için zaten bir yorumunuz var.</p>
      )}
      {!user && (
        <p className="mt-3 text-xs text-muted-foreground italic">Yorum yazmak için giriş yapın.</p>
      )}

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
        {!isLoading && data?.reviews.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Henüz onaylanmış yorum yok.</p>
        )}
        {data?.reviews.map((r: { id: string; reviewer_id: string; rating: number; comment: string; created_at: string; reviewer_name: string }) => (
          <div key={r.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <StarRow value={r.rating} />
                <span className="text-sm font-medium">{r.reviewer_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
              {user && user.id !== r.reviewer_id && (
                <button
                  type="button"
                  onClick={() => setReportOpen(r.id)}
                  className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                >
                  <Flag className="size-3" /> Şikayet et
                </button>
              )}
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{r.comment}</p>
          </div>
        ))}
      </div>

      <Dialog open={!!reportOpen} onOpenChange={(o) => !o && setReportOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yorumu Şikayet Et</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Neden bu yorumu şikayet ediyorsunuz?"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(null)}>Vazgeç</Button>
            <Button onClick={onReport} disabled={!reportReason.trim()}>Gönder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
