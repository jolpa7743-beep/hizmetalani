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

/** Admin: list all conversations across the site (bypasses RLS) */
export const adminListConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; limit?: number } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const limit = Math.min(data.limit ?? 100, 300);

    const { data: convs, error } = await supabaseAdmin
      .from("conversations")
      .select("id, listing_id, user1_id, user2_id, last_message_at, created_at")
      .order("last_message_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    const rows = (convs ?? []) as Array<{ id: string; listing_id: string | null; user1_id: string; user2_id: string; last_message_at: string; created_at: string }>;
    if (rows.length === 0) return [];

    const userIds = Array.from(new Set(rows.flatMap((c) => [c.user1_id, c.user2_id])));
    const listingIds = Array.from(new Set(rows.map((c) => c.listing_id).filter(Boolean) as string[]));
    const convIds = rows.map((c) => c.id);

    const [{ data: profs }, { data: listings }, { data: lastMsgs }, { data: counts }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds),
      listingIds.length
        ? supabaseAdmin.from("listings").select("id, title").in("id", listingIds)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
      supabaseAdmin.from("messages").select("conversation_id, content, created_at, sender_id").in("conversation_id", convIds).order("created_at", { ascending: false }),
      supabaseAdmin.from("messages").select("conversation_id", { count: "exact", head: false }).in("conversation_id", convIds),
    ]);

    const nameMap = new Map((profs ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));
    const listingMap = new Map((listings ?? []).map((l: { id: string; title: string }) => [l.id, l.title]));
    const lastMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
    for (const m of (lastMsgs ?? []) as Array<{ conversation_id: string; content: string; created_at: string; sender_id: string }>) {
      if (!lastMap.has(m.conversation_id)) lastMap.set(m.conversation_id, m);
    }
    const countMap = new Map<string, number>();
    for (const m of (counts ?? []) as Array<{ conversation_id: string }>) {
      countMap.set(m.conversation_id, (countMap.get(m.conversation_id) ?? 0) + 1);
    }

    let result = rows.map((c) => ({
      id: c.id,
      last_message_at: c.last_message_at,
      user1: { id: c.user1_id, name: nameMap.get(c.user1_id) ?? "Kullanıcı" },
      user2: { id: c.user2_id, name: nameMap.get(c.user2_id) ?? "Kullanıcı" },
      listing: c.listing_id ? { id: c.listing_id, title: listingMap.get(c.listing_id) ?? "İlan" } : null,
      last_message: lastMap.get(c.id) ?? null,
      message_count: countMap.get(c.id) ?? 0,
    }));

    const q = (data.search ?? "").trim().toLowerCase();
    if (q) {
      result = result.filter((c) =>
        c.user1.name?.toLowerCase().includes(q) ||
        c.user2.name?.toLowerCase().includes(q) ||
        c.listing?.title?.toLowerCase().includes(q) ||
        c.last_message?.content?.toLowerCase().includes(q)
      );
    }
    return result;
  });

/** Admin: full message thread of one conversation */
export const adminGetConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: conv, error: cErr } = await supabaseAdmin
      .from("conversations")
      .select("id, listing_id, user1_id, user2_id, created_at")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!conv) throw new Error("Konuşma bulunamadı");

    const { data: msgs, error: mErr } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, content, created_at, read_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    const userIds = [conv.user1_id, conv.user2_id];
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds);
    const nameMap = new Map((profs ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));

    let listing: { id: string; title: string } | null = null;
    if (conv.listing_id) {
      const { data: l } = await supabaseAdmin.from("listings").select("id, title").eq("id", conv.listing_id).maybeSingle();
      if (l) listing = { id: l.id, title: l.title };
    }

    return {
      id: conv.id,
      created_at: conv.created_at,
      user1: { id: conv.user1_id, name: nameMap.get(conv.user1_id) ?? "Kullanıcı" },
      user2: { id: conv.user2_id, name: nameMap.get(conv.user2_id) ?? "Kullanıcı" },
      listing,
      messages: (msgs ?? []) as Array<{ id: string; sender_id: string; content: string; created_at: string; read_at: string | null }>,
    };
  });

