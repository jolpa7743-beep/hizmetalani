import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteSettings = {
  id: number;
  site_name: string;
  site_description: string;
  site_keywords: string;
  og_image_url: string | null;
  ga_measurement_id: string | null;
  search_console_verification: string | null;
  adsense_publisher_id: string | null;
  robots_txt: string;
  contact_email: string;
  contact_phone: string | null;
  announcement_banner: string | null;
  announcement_active: boolean;
  adsense_enabled: boolean;
  adsense_test_mode: boolean;
  adsense_slot_header: string | null;
  adsense_slot_in_article: string | null;
  adsense_slot_sidebar: string | null;
  adsense_slot_footer: string | null;
  trust_badge_visibility: "all" | "verified_only" | "hidden";
  signup_email_otp_enabled: boolean;
  password_reset_otp_enabled: boolean;
  badge_email_otp_enabled: boolean;
  updated_at: string;
};

/** Public — SSR/client can read site settings */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SiteSettings) ?? null;
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<Omit<SiteSettings, "id" | "updated_at">>) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ ...(data as any), updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: broadcast a DM to every user */
export const adminBroadcastDM = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { body: string }) => d)
  .handler(async ({ data, context }) => {
    if (!data.body.trim()) throw new Error("Mesaj boş olamaz");
    const { data: count, error } = await context.supabase.rpc("admin_broadcast_dm", {
      _body: data.body.trim(),
    });
    if (error) throw new Error(error.message);
    return { ok: true, count: count as number };
  });
