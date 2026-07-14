import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ListChecks, Star, LifeBuoy, Shield, User as UserIcon } from "lucide-react";
import { StarRow } from "@/components/UserReviews";
import { getMyReviews } from "@/lib/reviews.functions";
import { trustBadgeMeta } from "@/lib/trust";

const schema = z.object({
  full_name: z.string().trim().min(2, "Ad soyad en az 2 karakter").max(80),
  phone: z.string().trim().max(20).optional(),
  city: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(500).optional(),
});

const tabSearch = z.object({
  tab: z.enum(["kisisel", "ilanlar", "yorumlar", "destek", "guvenlik"]).optional(),
});

export const Route = createFileRoute("/_authenticated/profil")({
  validateSearch: tabSearch,
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profilim — hizmetalanı.com" }] }),
});

function ProfilePage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeTab = search.tab ?? "kisisel";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserIcon className="size-6" /> Profilim
        </h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => navigate({ search: { tab: v as typeof activeTab } })}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto">
          <TabsTrigger value="kisisel" className="gap-1"><UserIcon className="size-4" /> Kişisel</TabsTrigger>
          <TabsTrigger value="ilanlar" className="gap-1"><ListChecks className="size-4" /> İlanlarım</TabsTrigger>
          <TabsTrigger value="yorumlar" className="gap-1"><Star className="size-4" /> Yorumlarım</TabsTrigger>
          <TabsTrigger value="destek" className="gap-1"><LifeBuoy className="size-4" /> Destek</TabsTrigger>
          <TabsTrigger value="guvenlik" className="gap-1"><Shield className="size-4" /> Güvenlik</TabsTrigger>
        </TabsList>

        <TabsContent value="kisisel" className="mt-4">
          <PersonalInfoCard />
        </TabsContent>
        <TabsContent value="ilanlar" className="mt-4">
          <MyListingsCard />
        </TabsContent>
        <TabsContent value="yorumlar" className="mt-4">
          <MyReviewsCard />
        </TabsContent>
        <TabsContent value="destek" className="mt-4">
          <SupportCard />
        </TabsContent>
        <TabsContent value="guvenlik" className="mt-4">
          <SecurityCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PersonalInfoCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trustLevel, setTrustLevel] = useState(0);
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
        setTrustLevel((data as unknown as { trust_level?: number }).trust_level ?? 0);
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

  if (loading) return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;

  const meta = trustBadgeMeta(trustLevel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Kişisel Bilgiler
          {trustLevel > 0 && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${meta.className}`}>
              <meta.icon className="size-3.5" /> {meta.label}
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
  );
}

function MyListingsCard() {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="size-5" /> İlanlarım</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Verdiğiniz ilanları görüntüleyin, düzenleyin veya durumunu değiştirin.</p>
        <div className="flex gap-2">
          <Link to="/ilanlarim"><Button>İlanlarımı Aç</Button></Link>
          <Link to="/ilan-ver"><Button variant="outline">Yeni İlan Ver</Button></Link>
        </div>
      </CardContent>
    </Card>
  );
}

function MyReviewsCard() {
  const fetchMy = useServerFn(getMyReviews);
  const { data, isLoading } = useQuery({ queryKey: ["my-reviews"], queryFn: () => fetchMy() });
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Star className="size-5" /> Yazdığım Yorumlar</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground italic">Henüz yorum yazmadınız.</p>
        )}
        {(data ?? []).map((r) => (
          <div key={r.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <StarRow value={r.rating} />
                <span className="text-sm font-medium">→ {r.reviewee_name}</span>
              </div>
              <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                {r.status === "approved" ? "Onaylı" : r.status === "rejected" ? "Reddedildi" : "Onay Bekliyor"}
              </Badge>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{r.comment}</p>
            {r.admin_note && (
              <p className="mt-2 text-xs text-muted-foreground italic">Admin notu: {r.admin_note}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SupportCard() {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="size-5" /> Destek Talepleri</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Sorularınız için destek ekibimize ulaşın veya mevcut taleplerinizi takip edin.</p>
        <div className="flex gap-2">
          <Link to="/destek"><Button>Destek Merkezi</Button></Link>
          <Link to="/mesajlar"><Button variant="outline">Mesajlarım</Button></Link>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityCard() {
  const { user } = useAuth();
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) return toast.error("Şifre en az 8 karakter olmalı");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPwd("");
    toast.success("Şifreniz güncellendi");
  }
  async function signOutAll() {
    await supabase.auth.signOut({ scope: "others" });
    toast.success("Diğer oturumlar kapatıldı");
  }
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" /> Güvenlik</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="text-xs text-muted-foreground">Oturum e-posta: <strong>{user?.email}</strong></div>
        <form onSubmit={changePassword} className="space-y-3">
          <Label>Yeni Şifre</Label>
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="En az 8 karakter" />
          <Button type="submit" disabled={busy || pwd.length < 8}>Şifreyi Değiştir</Button>
        </form>
        <div className="border-t pt-4">
          <div className="font-medium mb-1">Diğer Cihazlardan Çıkış</div>
          <p className="text-sm text-muted-foreground mb-2">Başka cihazlarda açık oturumları kapatın.</p>
          <Button variant="outline" onClick={signOutAll}>Diğer oturumları kapat</Button>
        </div>
        <div className="border-t pt-4">
          <Link to="/guvenlik" className="text-sm text-brand hover:underline">
            Güvenlik ipuçlarını okuyun →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
