import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TR_CITIES } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Ad soyad en az 2 karakter").max(80),
  phone: z.string().trim().max(20).optional(),
  city: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(500).optional(),
});

export const Route = createFileRoute("/_authenticated/profil")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profilim — hizmetalanı.com" }] }),
});

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", city: "", district: "", bio: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data, error }) => {
      if (error) toast.error(error.message);
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          district: data.district ?? "",
          bio: data.bio ?? "",
        });
        setVerified(!!data.is_verified);
      }
      setLoading(false);
    });
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
      district: parsed.data.district || null,
      bio: parsed.data.bio || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profil güncellendi");
  };

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-10">Yükleniyor...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Profilim
            {verified && (
              <span className="inline-flex items-center gap-1 text-brand text-sm font-normal">
                <ShieldCheck className="size-4" /> Doğrulanmış
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>E-posta</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div>
              <Label>Ad Soyad *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={80} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90..." maxLength={20} />
              <p className="text-xs text-muted-foreground mt-1">SMS doğrulama admin onayı ile aktif olur (opsiyonel).</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Şehir</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Şehir" /></SelectTrigger>
                  <SelectContent>
                    {TR_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>İlçe</Label>
                <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} maxLength={60} />
              </div>
            </div>
            <div>
              <Label>Hakkımda</Label>
              <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} />
              <div className="text-xs text-muted-foreground text-right">{form.bio.length}/500</div>
            </div>
            <Button type="submit" disabled={saving} className="bg-brand hover:bg-brand/90">
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
