import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, ListChecks, ArrowLeft, ScrollText, Search, MessageCircle, Megaphone, Send, Star, Flag, ShieldCheck, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminModerationCounts } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context, location }) => {
    const userId = (context as { user?: { id: string } }).user?.id;
    if (!userId) throw redirect({ to: "/auth", search: { redirect: location.href } });
    const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Yönetici Paneli" }] }),
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchCounts = useServerFn(adminModerationCounts);
  const { data: counts } = useQuery({
    queryKey: ["admin-mod-counts"],
    queryFn: () => fetchCounts(),
    refetchInterval: 30_000,
  });
  const nav = [
    { to: "/admin", label: "Panel", icon: LayoutDashboard, exact: true, count: 0 },
    { to: "/admin/bildirimler", label: "Bildirim Merkezi", icon: Inbox, count: (counts?.pendingReviews ?? 0) + (counts?.openReports ?? 0) },
    { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users, count: 0 },
    { to: "/admin/ilanlar", label: "İlanlar", icon: ListChecks, count: 0 },
    { to: "/admin/yorumlar", label: "Yorumlar", icon: Star, count: counts?.pendingReviews ?? 0 },
    { to: "/admin/raporlar", label: "Şikayetler", icon: Flag, count: counts?.openReports ?? 0 },
    { to: "/admin/ticketlar", label: "Destek Talepleri", icon: MessageCircle, count: counts?.openTickets ?? 0 },
    { to: "/admin/duyurular", label: "Duyurular", icon: Megaphone, count: 0 },
    { to: "/admin/yayin", label: "Toplu DM", icon: Send, count: 0 },
    { to: "/admin/rozetler", label: "Rozet Ayarları", icon: ShieldCheck, count: 0 },
    { to: "/admin/seo", label: "SEO Ayarları", icon: Search, count: 0 },
    { to: "/admin/loglar", label: "Loglar", icon: ScrollText, count: 0 },
  ];
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start bg-card border rounded-xl p-3 shadow-[var(--shadow-soft)]">
          <Link to="/" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Siteye dön
          </Link>
          <div className="px-2 pt-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Yönetim
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {nav.map((n) => {
              const active = isActive(n.to, n.exact);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                    active ? "bg-brand text-white font-medium" : "text-foreground hover:bg-muted"
                  )}
                >
                  <n.icon className="size-4" />
                  <span className="flex-1">{n.label}</span>
                  {n.count > 0 && (
                    <span
                      className={cn(
                        "min-w-[20px] h-5 inline-flex items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                        active ? "bg-white text-brand" : "bg-red-500 text-white"
                      )}
                      aria-label={`${n.count} bekleyen`}
                    >
                      {n.count > 99 ? "99+" : n.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
