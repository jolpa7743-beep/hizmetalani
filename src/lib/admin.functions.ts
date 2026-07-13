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
    { email: "demo@demo.com", password: "demo", full_name: "Demo Kullanıcı", role: "user" as const },
    { email: "admin@admin.com", password: "admin", full_name: "Site Yöneticisi", role: "admin" as const },
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

/** List all users (admin only) */
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authList, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (error) throw error;

    const ids = authList.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);

    return authList.users.map((u) => {
      const p = profiles?.find((x) => x.id === u.id);
      const userRoles = roles?.filter((r) => r.user_id === u.id).map((r) => r.role) ?? [];
      return {
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        full_name: p?.full_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        city: p?.city ?? null,
        district: p?.district ?? null,
        phone: p?.phone ?? null,
        is_verified: p?.is_verified ?? false,
        roles: userRoles,
      };
    });
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
