import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Review = {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  listing_id: string | null;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  reviewer_name?: string | null;
};

/** Approved reviews + avg for a user — public */
export const getUserReviews = createServerFn({ method: "GET" })
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(process.env.SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [{ data: rows }, { data: stats }] = await Promise.all([
      (supabase as any)
        .from("reviews")
        .select("id, reviewer_id, rating, comment, created_at")
        .eq("reviewee_id", data.userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50),
      (supabase as any).rpc("user_review_stats", { _user_id: data.userId }),
    ]);
    const rowsArr = (rows ?? []) as Array<{ id: string; reviewer_id: string; rating: number; comment: string; created_at: string }>;
    const reviewerIds = Array.from(new Set(rowsArr.map((r) => r.reviewer_id)));
    let names: Record<string, string> = {};
    if (reviewerIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", reviewerIds);
      names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? "Üye"]));
    }
    const reviews = rowsArr.map((r) => ({
      ...r,
      reviewer_name: names[r.reviewer_id] ?? "Üye",
    }));
    const stat = Array.isArray(stats) ? stats[0] : stats;
    return {
      reviews,
      avg: stat?.avg_rating ? Number(stat.avg_rating) : 0,
      count: stat?.review_count ?? 0,
    };
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { revieweeId: string; listingId?: string | null; rating: number; comment: string }) => d)
  .handler(async ({ data, context }) => {
    if (data.rating < 1 || data.rating > 5) throw new Error("Puan 1-5 arasında olmalı");
    if (!data.comment.trim() || data.comment.trim().length < 5) throw new Error("Yorum en az 5 karakter olmalı");
    if (data.revieweeId === context.userId) throw new Error("Kendinize yorum yazamazsınız");
    const { error } = await (context.supabase as any).from("reviews").insert({
      reviewer_id: context.userId,
      reviewee_id: data.revieweeId,
      listing_id: data.listingId ?? null,
      rating: data.rating,
      comment: data.comment.trim(),
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") throw new Error("Bu üye için zaten bir yorumunuz var");
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const reportReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reviewId: string; reason: string }) => d)
  .handler(async ({ data, context }) => {
    if (!data.reason.trim()) throw new Error("Sebep boş olamaz");
    const { error } = await (context.supabase as any).from("review_reports").insert({
      review_id: data.reviewId,
      reporter_id: context.userId,
      reason: data.reason.trim(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* Admin */
export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string | null } = {}) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase.rpc as any)("admin_list_reviews", {
      _status: data.status ?? null,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      id: string; rating: number; comment: string; status: string; admin_note: string | null;
      created_at: string; reviewer_id: string; reviewer_name: string | null;
      reviewee_id: string; reviewee_name: string | null; listing_id: string | null; open_reports: number;
    }>;
  });

export const adminSetReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reviewId: string; status: "pending" | "approved" | "rejected"; note?: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase.rpc as any)("admin_set_review_status", {
      _review_id: data.reviewId,
      _status: data.status,
      _note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListReviewReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase.rpc as any)("admin_list_review_reports");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string; reason: string; status: string; created_at: string;
      review_id: string; review_comment: string | null; rating: number | null; review_status: string | null;
      reporter_id: string; reporter_name: string | null;
      reviewee_id: string; reviewee_name: string | null;
    }>;
  });

export const adminSetReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reportId: string; status: "open" | "resolved" | "dismissed" }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase.rpc as any)("admin_set_report_status", {
      _report_id: data.reportId,
      _status: data.status,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: toggle verified badge on a user */
export const adminSetVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; verified: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase.rpc as any)("admin_set_verified", {
      _user_id: data.userId,
      _verified: data.verified,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
