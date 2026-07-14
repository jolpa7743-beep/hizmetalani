import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListUsers, adminToggleRole, adminDeleteUser } from "@/lib/admin.functions";
import { adminSetVerified } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, Trash2, Search, CheckCircle2, XCircle, BadgeCheck, BadgeX } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/kullanicilar")({
  component: AdminUsers,
});

type AdminUser = {
  id: string; email: string; created_at: string; last_sign_in_at: string | null;
  email_confirmed_at: string | null; full_name: string | null; avatar_url: string | null;
  city: string | null; district: string | null; phone: string | null;
  is_verified: boolean; roles: string[];
};

function AdminUsers() {
  const fetchUsers = useServerFn(adminListUsers);
  const toggleRole = useServerFn(adminToggleRole);
  const deleteUser = useServerFn(adminDeleteUser);
  const setVerified = useServerFn(adminSetVerified);
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const filtered = ((data ?? []) as AdminUser[]).filter((u) => {
    const s = q.toLowerCase();
    return !s || u.email.toLowerCase().includes(s) || (u.full_name ?? "").toLowerCase().includes(s);
  });

  const onToggleRole = async (userId: string, isAdmin: boolean) => {
    try {
      await toggleRole({ data: { userId, makeAdmin: !isAdmin } });
      toast.success(isAdmin ? "Admin yetkisi kaldırıldı" : "Admin yetkisi verildi");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  };

  const onDelete = async (userId: string, email: string) => {
    if (!confirm(`"${email}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteUser({ data: { userId } });
      toast.success("Kullanıcı silindi");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  };

  const onToggleVerified = async (userId: string, verified: boolean) => {
    try {
      await setVerified({ data: { userId, verified: !verified } });
      toast.success(verified ? "Güven rozeti kaldırıldı" : "Güven rozeti verildi");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} / {data?.length ?? 0} kullanıcı
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="E-posta veya isim ara..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-[var(--shadow-soft)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">Konum</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Kayıt</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Kullanıcı bulunamadı
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.full_name || "İsimsiz"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.city ? `${u.city}${u.district ? " / " + u.district : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {isAdmin && <Badge className="bg-brand">Admin</Badge>}
                        {u.is_verified && (
                          <Badge className="bg-emerald-600 gap-1">
                            <BadgeCheck className="size-3" /> Güven Rozeti
                          </Badge>
                        )}
                        {u.email_confirmed_at ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="size-3" /> Doğrulandı
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-amber-600">
                            <XCircle className="size-3" /> Onaysız
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleVerified(u.id, u.is_verified)}
                          title={u.is_verified ? "Güven rozetini kaldır" : "Güven rozeti ver"}
                          className={u.is_verified ? "text-emerald-600" : ""}
                        >
                          {u.is_verified ? <BadgeX className="size-4" /> : <BadgeCheck className="size-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleRole(u.id, isAdmin)}
                          title={isAdmin ? "Admin yetkisini kaldır" : "Admin yap"}
                        >
                          {isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(u.id, u.email)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
