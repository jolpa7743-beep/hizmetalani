import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { adminListUsers, adminToggleRole, adminDeleteUser, adminUpdateProfile } from "@/lib/admin.functions";
import { adminSetTrustLevel } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, ShieldOff, Trash2, Search, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { TRUST_LEVELS, trustBadgeMeta } from "@/lib/trust";
import { toast } from "sonner";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/_authenticated/admin/kullanicilar")({
  validateSearch: searchSchema,
  component: AdminUsers,
});

type AdminUser = {
  id: string; email: string; created_at: string; last_sign_in_at: string | null;
  email_confirmed_at: string | null; full_name: string | null; avatar_url: string | null;
  city: string | null; district: string | null; phone: string | null;
  is_verified: boolean; trust_level: number; roles: string[];
};

function AdminUsers() {
  const fetchUsers = useServerFn(adminListUsers);
  const toggleRole = useServerFn(adminToggleRole);
  const deleteUser = useServerFn(adminDeleteUser);
  const setTrust = useServerFn(adminSetTrustLevel);
  const updateProfile = useServerFn(adminUpdateProfile);
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  useEffect(() => { if (search.q) setQ(search.q); }, [search.q]);

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

  const onSetTrust = async (userId: string, level: number) => {
    try {
      await setTrust({ data: { userId, level } });
      toast.success("Güven seviyesi güncellendi");
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
                        {u.trust_level > 0 && (() => {
                          const meta = trustBadgeMeta(u.trust_level);
                          return (
                            <Badge className={`${meta.className} gap-1`}>
                              <meta.icon className="size-3" /> {meta.label}
                            </Badge>
                          );
                        })()}
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
                      <div className="flex justify-end gap-1 items-center">
                        <Select
                          value={String(u.trust_level)}
                          onValueChange={(v) => onSetTrust(u.id, Number(v))}
                        >
                          <SelectTrigger className="h-8 w-[140px]" aria-label="Güven Seviyesi">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRUST_LEVELS.map((t) => (
                              <SelectItem key={t.level} value={String(t.level)}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditUser(u)}
                          title="Düzenle"
                        >
                          <Pencil className="size-4" />
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

      <EditUserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSave={async (patch) => {
          if (!editUser) return;
          try {
            await updateProfile({ data: { userId: editUser.id, ...patch } });
            toast.success("Kullanıcı güncellendi");
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setEditUser(null);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Hata");
          }
        }}
      />
    </div>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSave: (patch: { full_name: string; phone: string; city: string; district: string }) => void;
}) {
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setPhone(user.phone ?? "");
      setCity(user.city ?? "");
      setDistrict(user.district ?? "");
    }
  }, [user]);
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">{user.email}</div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Ad Soyad</Label>
              <Input id="edit-name" value={full_name} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-city">Şehir</Label>
                <Input id="edit-city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-district">İlçe</Label>
                <Input id="edit-district" value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={() => onSave({ full_name, phone, city, district })}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
