import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

export type CategoryGroup = {
  id: number;
  key: string;
  label: string;
  sort_order: number;
  visible: boolean;
};

export type CategoryOverride = {
  key: string;
  label: string | null;
  short_label: string | null;
  group_key: string | null;
  sort_order: number;
  visible: boolean;
};

export type CategoryConfig = {
  groups: CategoryGroup[];
  overrides: CategoryOverride[];
  /** Hardcoded categories combined with overrides, in display order */
  merged: {
    key: CategoryKey;
    label: string;
    short: string;
    slug: string;
    group_key: string | null;
    sort_order: number;
    visible: boolean;
  }[];
};

async function anonClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getCategoryConfig = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await anonClient();
  const [{ data: groups }, { data: overrides }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from as any)("category_groups").select("*").order("sort_order"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from as any)("category_overrides").select("*"),
  ]);
  const g = (groups ?? []) as CategoryGroup[];
  const o = (overrides ?? []) as CategoryOverride[];
  const overrideMap = new Map(o.map((x) => [x.key, x]));

  const merged = CATEGORIES.map((c) => {
    const ov = overrideMap.get(c.key);
    return {
      key: c.key,
      label: ov?.label?.trim() || c.label,
      short: ov?.short_label?.trim() || c.short,
      slug: c.slug,
      group_key: ov?.group_key ?? null,
      sort_order: ov?.sort_order ?? 0,
      visible: ov?.visible ?? true,
    };
  }).sort((a, b) => a.sort_order - b.sort_order);

  return { groups: g, overrides: o, merged } satisfies CategoryConfig;
});

/* ---------------- Admin mutations ---------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
}

const groupSchema = z.object({
  id: z.number().optional(),
  key: z.string().min(1).max(40).regex(/^[a-z0-9_-]+$/),
  label: z.string().min(1).max(120),
  sort_order: z.number().int(),
  visible: z.boolean(),
});

export const adminUpsertGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof groupSchema>) => groupSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (supabaseAdmin.from as any)("category_groups");
    if (data.id) {
      const { error } = await t.update({
        key: data.key, label: data.label, sort_order: data.sort_order, visible: data.visible,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await t.insert({
        key: data.key, label: data.label, sort_order: data.sort_order, visible: data.visible,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: number }) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from as any)("category_groups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const overrideSchema = z.object({
  key: z.string().min(1),
  label: z.string().max(160).nullable(),
  short_label: z.string().max(80).nullable(),
  group_key: z.string().nullable(),
  sort_order: z.number().int(),
  visible: z.boolean(),
});

export const adminUpsertOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof overrideSchema>) => overrideSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from as any)("category_overrides").upsert({
      key: data.key,
      label: data.label,
      short_label: data.short_label,
      group_key: data.group_key,
      sort_order: data.sort_order,
      visible: data.visible,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
