import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, type ComponentType } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, ListChecks, ArrowLeft, ScrollText, Search, MessageCircle,
  Megaphone, Send, Star, Flag, ShieldCheck, Inbox, Layers, ChevronDown,
  ShieldAlert, Settings, Database, UsersRound, Mail,
} from "lucide-react";
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

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
  count?: number;
};

type NavGroup = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavItem[];
};

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchCounts = useServerFn(adminModerationCounts);
  const { data: counts } = useQuery({
    queryKey: ["admin-mod-counts"],
    queryFn: () => fetchCounts(),
    refetchInterval: 30_000,
  });

  const pendingReviews = counts?.pendingReviews ?? 0;
  const openReports = counts?.openReports ?? 0;
  const openTickets = counts?.openTickets ?? 0;

  const dashboard: NavItem = { to: "/admin", label: "Panel", icon: LayoutDashboard, exact: true };
  const inbox: NavItem = { to: "/admin/bildirimler", label: "Bildirim Merkezi", icon: Inbox, count: pendingReviews + openReports };

  const groups: NavGroup[] = [
    {
      key: "moderation", label: "Moderasyon", icon: ShieldAlert,
      items: [
        { to: "/admin/yorumlar", label: "Yorumlar", icon: Star, count: pendingReviews },
        { to: "/admin/raporlar", label: "Şikayetler", icon: Flag, count: openReports },
        { to: "/admin/ticketlar", label: "Destek Talepleri", icon: MessageCircle, count: openTickets },
        { to: "/admin/loglar", label: "Loglar", icon: ScrollText },
      ],
    },
    {
      key: "content", label: "İçerik", icon: Database,
      items: [
        { to: "/admin/ilanlar", label: "İlanlar", icon: ListChecks },
        { to: "/admin/kategoriler", label: "Kategoriler", icon: Layers },
      ],
    },
    {
      key: "users", label: "Üyeler", icon: UsersRound,
      items: [
        { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
        { to: "/admin/rozetler", label: "Rozet Ayarları", icon: ShieldCheck },
      ],
    },
    {
      key: "comms", label: "İletişim", icon: Megaphone,
      items: [
        { to: "/admin/duyurular", label: "Duyurular", icon: Megaphone },
        { to: "/admin/yayin", label: "Toplu DM", icon: Send },
      ],
    },
    {
      key: "settings", label: "Ayarlar", icon: Settings,
      items: [
        { to: "/admin/seo", label: "SEO & Reklam", icon: Search },
        { to: "/admin/smtp", label: "SMTP / E-posta", icon: Mail },
      ],
    },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start bg-card border rounded-xl p-3 shadow-[var(--shadow-soft)]">
          <Link to="/" className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Siteye dön
          </Link>

          <div className="px-2 pt-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Yönetim
          </div>

          <nav className="flex flex-col gap-0.5">
            <NavLeaf item={dashboard} active={isActive(dashboard.to, true)} />
            <NavLeaf item={inbox} active={isActive(inbox.to)} highlight />

            <div className="my-2 h-px bg-border" />

            {groups.map((g) => {
              const groupCount = g.items.reduce((s, it) => s + (it.count ?? 0), 0);
              const groupActive = g.items.some((it) => isActive(it.to, it.exact));
              return (
                <NavGroupBlock
                  key={g.key}
                  group={g}
                  active={groupActive}
                  count={groupCount}
                  isActive={isActive}
                />
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

function CountBadge({ n, active }: { n: number; active?: boolean }) {
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "min-w-[20px] h-5 inline-flex items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
        active ? "bg-white text-brand" : "bg-red-500 text-white",
      )}
      aria-label={`${n} bekleyen`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

function NavLeaf({ item, active, highlight }: { item: NavItem; active: boolean; highlight?: boolean }) {
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
        active
          ? "bg-brand text-white font-medium"
          : highlight
            ? "text-foreground hover:bg-muted font-medium"
            : "text-foreground hover:bg-muted",
      )}
    >
      <item.icon className="size-4" />
      <span className="flex-1 truncate">{item.label}</span>
      <CountBadge n={item.count ?? 0} active={active} />
    </Link>
  );
}

function NavGroupBlock({
  group, active, count, isActive,
}: {
  group: NavGroup;
  active: boolean;
  count: number;
  isActive: (to: string, exact?: boolean) => boolean;
}) {
  const [open, setOpen] = useState(active || count > 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
          active ? "text-brand" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        )}
        aria-expanded={open}
      >
        <group.icon className="size-3.5" />
        <span className="flex-1 text-left">{group.label}</span>
        <CountBadge n={count} />
        <ChevronDown
          className={cn("size-3.5 transition-transform", open ? "rotate-0" : "-rotate-90")}
        />
      </button>

      {open && (
        <div className="mt-0.5 mb-1 ml-3 pl-3 border-l border-border/70 flex flex-col gap-0.5">
          {group.items.map((it) => (
            <NavLeaf key={it.to} item={it} active={isActive(it.to, it.exact)} />
          ))}
        </div>
      )}
    </div>
  );
}

