import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminStats } from "@/lib/admin.functions";
import { Users, ListChecks, MessageSquare, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchStats = useServerFn(adminStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
  });

  const cards = [
    { label: "Toplam Kullanıcı", value: data?.users ?? 0, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Toplam İlan", value: data?.listings ?? 0, icon: ListChecks, color: "from-emerald-500 to-emerald-600" },
    { label: "Aktif İlan", value: data?.activeListings ?? 0, icon: Activity, color: "from-amber-500 to-amber-600" },
    { label: "Mesajlar", value: data?.messages ?? 0, icon: MessageSquare, color: "from-purple-500 to-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yönetici Paneli</h1>
        <p className="text-sm text-muted-foreground">Sitenin genel durumu ve hızlı erişim</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border rounded-xl p-4 shadow-[var(--shadow-soft)]">
            <div className={`size-10 rounded-lg bg-gradient-to-br ${c.color} grid place-items-center text-white mb-3`}>
              <c.icon className="size-5" />
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {isLoading ? "…" : c.value.toLocaleString("tr-TR")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-semibold mb-3">Hoş geldiniz 👋</h2>
        <p className="text-sm text-muted-foreground">
          Buradan tüm siteyi yönetebilirsiniz. Sol menüden kullanıcıları veya ilanları inceleyin.
          Yakında: destek talepleri (ticket), duyurular ve DM merkezi.
        </p>
      </div>
    </div>
  );
}
