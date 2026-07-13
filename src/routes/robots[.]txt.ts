import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const DEFAULT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /_authenticated
Disallow: /api
Sitemap: /sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        let body = DEFAULT;
        try {
          const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data } = await supabase.from("site_settings").select("robots_txt").eq("id", 1).maybeSingle();
          if (data?.robots_txt) body = data.robots_txt;
        } catch {}
        if (!/Sitemap:/i.test(body)) body += "\nSitemap: /sitemap.xml\n";
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
        });
      },
    },
  },
});
