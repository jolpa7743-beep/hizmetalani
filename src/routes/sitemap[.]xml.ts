import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "@/lib/categories";
import { ILLER } from "@/lib/turkiye";

const BASE_URL = "";

const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/hakkimizda", changefreq: "monthly", priority: "0.7" },
  { path: "/iletisim", changefreq: "monthly", priority: "0.6" },
  { path: "/nasil-calisir", changefreq: "monthly", priority: "0.6" },
  { path: "/guvenlik", changefreq: "monthly", priority: "0.6" },
  { path: "/gizlilik", changefreq: "monthly", priority: "0.4" },
  { path: "/kullanim-kosullari", changefreq: "monthly", priority: "0.4" },
  { path: "/kvkk", changefreq: "monthly", priority: "0.4" },
  { path: "/cerez-politikasi", changefreq: "monthly", priority: "0.4" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        let listings: Array<{ id: string; updated_at: string | null }> = [];
        try {
          const { data } = await supabase
            .from("listings")
            .select("id, updated_at")
            .eq("status", "active")
            .order("updated_at", { ascending: false })
            .limit(5000);
          listings = (data ?? []) as typeof listings;
        } catch {}

        const entries: Array<{ path: string; lastmod?: string; changefreq?: string; priority?: string }> = [
          ...STATIC_ROUTES,
        ];
        // Kategori sayfaları
        for (const c of CATEGORIES) {
          entries.push({ path: `/kategori/${c.slug}`, changefreq: "daily", priority: "0.8" });
          // İl + kategori uzun kuyruk
          for (const il of ILLER) {
            entries.push({
              path: `/kategori/${c.slug}/${encodeURIComponent(il.toLocaleLowerCase("tr").replace(/\s+/g, "-"))}`,
              changefreq: "weekly",
              priority: "0.6",
            });
          }
        }
        // İlanlar
        for (const l of listings) {
          entries.push({
            path: `/ilan/${l.id}`,
            lastmod: l.updated_at ?? undefined,
            changefreq: "weekly",
            priority: "0.7",
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
