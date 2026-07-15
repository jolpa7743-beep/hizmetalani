import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Send, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSmtpSettings,
  updateSmtpSettings,
  sendTestSmtpEmail,
  type SmtpFormValues,
} from "@/lib/smtp.functions";

export const Route = createFileRoute("/_authenticated/admin/smtp")({
  component: AdminSmtp,
  head: () => ({ meta: [{ title: "SMTP Ayarları — Yönetici" }] }),
});

function AdminSmtp() {
  const router = useRouter();
  const fetchFn = useServerFn(getSmtpSettings);
  const saveFn = useServerFn(updateSmtpSettings);
  const testFn = useServerFn(sendTestSmtpEmail);

  const { data, isLoading } = useQuery({
    queryKey: ["smtp_settings"],
    queryFn: () => fetchFn(),
  });

  const [form, setForm] = useState<SmtpFormValues>({
    host: "", port: 587, username: "", password: "",
    from_email: "", from_name: "", secure: false, enabled: false,
  });
  const [testTo, setTestTo] = useState("");

  useEffect(() => {
    if (data) {
      setForm({
        host: data.host, port: data.port, username: data.username,
        password: "", // never show existing
        from_email: data.from_email, from_name: data.from_name,
        secure: data.secure, enabled: data.enabled,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: Partial<SmtpFormValues>) => saveFn({ data: payload }),
    onSuccess: () => { toast.success("SMTP ayarları kaydedildi"); router.invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendTest = useMutation({
    mutationFn: () => testFn({ data: { to: testTo } }),
    onSuccess: () => toast.success(`Test e-postası ${testTo} adresine gönderildi`),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Yükleniyor…</div>;

  const set = <K extends keyof SmtpFormValues>(k: K, v: SmtpFormValues[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="size-5" /> SMTP Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kendi hosting sağlayıcınızın SMTP sunucusu üzerinden uygulama içi e-posta göndermek için kullanılır.
          Kayıt onayı ve şifre sıfırlama gibi kimlik doğrulama e-postaları buradan geçmez; onlar Lovable altyapısı üzerinden gönderilir.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> Sunucu Bilgileri</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="smtp-enabled" className="text-sm">SMTP aktif</Label>
              <p className="text-xs text-muted-foreground mt-1">Kapalıyken uygulama içi e-postalar bu SMTP üzerinden gönderilmez.</p>
            </div>
            <Switch id="smtp-enabled" checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>SMTP Host</Label>
              <Input value={form.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.hostinger.com" />
            </div>
            <div>
              <Label>Port</Label>
              <Input type="number" value={form.port} onChange={(e) => set("port", Number(e.target.value) || 0)} placeholder="587" />
              <p className="text-xs text-muted-foreground mt-1">Genelde 587 (STARTTLS) veya 465 (SSL)</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2">
            <div>
              <Label htmlFor="smtp-secure" className="text-sm">SSL/TLS (secure)</Label>
              <p className="text-xs text-muted-foreground mt-1">Port 465 kullanıyorsanız açın. 587 için genelde kapalı bırakın (STARTTLS otomatik).</p>
            </div>
            <Switch id="smtp-secure" checked={form.secure} onCheckedChange={(v) => set("secure", v)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Kullanıcı Adı</Label>
              <Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="noreply@siteadi.com" autoComplete="off" />
            </div>
            <div>
              <Label>Şifre</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={data?.password ? "•••••••• (kayıtlı — değiştirmek için yeni girin)" : "SMTP şifreniz"}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground mt-1">Boş bırakırsanız mevcut şifre korunur.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Gönderen E-posta (from)</Label>
              <Input type="email" value={form.from_email} onChange={(e) => set("from_email", e.target.value)} placeholder="noreply@siteadi.com" />
            </div>
            <div>
              <Label>Gönderen Adı</Label>
              <Input value={form.from_name} onChange={(e) => set("from_name", e.target.value)} placeholder="Site Adı" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="bg-brand hover:bg-brand/90">
              <Save className="size-4 mr-2" /> {save.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Send className="size-4" /> Test E-postası Gönder</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Kaydettiğiniz SMTP ayarlarıyla belirttiğiniz adrese anında test e-postası gönderilir. Önce ayarları kaydedin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <Label>Alıcı e-postası</Label>
              <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="ornek@mail.com" />
            </div>
            <Button
              onClick={() => sendTest.mutate()}
              disabled={sendTest.isPending || !testTo}
              variant="secondary"
            >
              <Send className="size-4 mr-2" /> {sendTest.isPending ? "Gönderiliyor…" : "Testi Gönder"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
