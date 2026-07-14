import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/ads.txt")({
  server: {
    handlers: {
      GET: async () => {
        let pub = "";
        try {
          const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const supabase = createClient(process.env.SUPABASE_URL!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const h = new Headers(init?.headers);
                if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
                h.set("apikey", key);
                return fetch(input, { ...init, headers: h });
              },
            },
          });
          const { data } = await supabase.from("site_settings").select("adsense_publisher_id").eq("id", 1).maybeSingle();
          pub = (data?.adsense_publisher_id ?? "").replace(/^ca-/, "");
        } catch {}
        const body = pub
          ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
          : `# ads.txt — Publisher ID henüz ayarlanmadı. Admin > SEO panelinden ekleyin.\n`;
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
