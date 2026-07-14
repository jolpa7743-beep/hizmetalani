import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, ListChecks, ArrowLeft, ScrollText, Search, MessageCircle, Megaphone, Send, Star, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const nav = [
    { to: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
    { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
    { to: "/admin/ilanlar", label: "İlanlar", icon: ListChecks },
    { to: "/admin/yorumlar", label: "Yorumlar", icon: Star },
    { to: "/admin/raporlar", label: "Şikayetler", icon: Flag },
    { to: "/admin/ticketlar", label: "Destek Talepleri", icon: MessageCircle },
    { to: "/admin/duyurular", label: "Duyurular", icon: Megaphone },
    { to: "/admin/yayin", label: "Toplu DM", icon: Send },
    { to: "/admin/seo", label: "SEO Ayarları", icon: Search },
    { to: "/admin/loglar", label: "Loglar", icon: ScrollText },
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
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                  isActive(n.to, n.exact)
                    ? "bg-brand text-white font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
