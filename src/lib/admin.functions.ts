import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Seeds two demo users:
 *  - demo@demo.com  / demo    (role: user)
 *  - admin@admin.com / admin  (role: admin)
 * Idempotent — safe to call multiple times.
 * Public endpoint (no auth) but only creates fixed demo accounts.
 */
export const seedDemoUsers = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const accounts = [
    { email: "demo@demo.com", password: "demo1234", full_name: "Demo Kullanıcı", role: "user" as const },
    { email: "admin@admin.com", password: "admin123", full_name: "Site Yöneticisi", role: "admin" as const },
  ];

  const results: Array<{ email: string; created: boolean; role: string }> = [];

  for (const acc of accounts) {
    // Check if exists
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((u) => u.email === acc.email);
    let created = false;

    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.full_name },
      });
      if (error) throw new Error(`${acc.email}: ${error.message}`);
      user = data.user;
      created = true;
    } else {
      // Reset password + confirm email to guarantee login works
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: acc.password,
        email_confirm: true,
      });
      if (error) throw new Error(`${acc.email} reset: ${error.message}`);
    }

    if (!user) continue;

    // Ensure profile exists (trigger normally creates it)
    await supabaseAdmin.from("profiles").upsert(
      { id: user.id, full_name: acc.full_name },
      { onConflict: "id" }
    );

    // Ensure role
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: user.id, role: acc.role },
      { onConflict: "user_id,role" }
    );

    results.push({ email: acc.email, created, role: acc.role });
  }

  return { ok: true, results };
});

/** List all users (admin only). Uses SQL RPC to avoid the auth SDK
 *  listUsers bug (`Scan error on column "confirmation_token"`). */
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc(
      "admin_list_users" as never,
    );
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      email: string;
      created_at: string | null;
      last_sign_in_at: string | null;
      email_confirmed_at: string | null;
      full_name: string | null;
      avatar_url: string | null;
      city: string | null;
      district: string | null;
      phone: string | null;
      is_verified: boolean;
      trust_level: number;
      roles: string[];
    }>;
  });

/** Toggle admin role on a user */
export const adminToggleRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; makeAdmin: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.makeAdmin) {
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: data.userId, role: "admin" },
        { onConflict: "user_id,role" }
      );
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    }
    return { ok: true };
  });

/** Delete a user */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("Kendinizi silemezsiniz");
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

/** Admin stats for dashboard */
export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [users, listings, activeL, messages] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("listings").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("messages").select("*", { count: "exact", head: true }),
    ]);
    return {
      users: users.count ?? 0,
      listings: listings.count ?? 0,
      activeListings: activeL.count ?? 0,
      messages: messages.count ?? 0,
    };
  });

/** Admin: update profile fields on any user */
export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    userId: string;
    full_name?: string | null;
    phone?: string | null;
    city?: string | null;
    district?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const patch: Record<string, string | null> = {};
    for (const k of ["full_name", "phone", "city", "district"] as const) {
      if (k in data) patch[k] = (data[k] ?? null) as string | null;
    }
    if (!Object.keys(patch).length) return { ok: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as unknown as { from: (t: string) => { update: (v: unknown) => { eq: (c: string, id: string) => Promise<{ error: { message: string } | null }> } } }).from("profiles").update(patch).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: counts for nav badges (pending reviews + open reports) */
export const adminModerationCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [pending, reports, tickets] = await Promise.all([
      supabaseAdmin.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("review_reports").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    ]);
    return {
      pendingReviews: pending.count ?? 0,
      openReports: reports.count ?? 0,
      openTickets: tickets.count ?? 0,
    };
  });
