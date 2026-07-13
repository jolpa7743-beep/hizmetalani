import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/duyurular")({
  component: AdminAnn,
  head: () => ({ meta: [{ title: "Duyurular — Yönetici" }] }),
});

type Ann = {
  id: string; title: string; body: string; target_audience: string;
  is_active: boolean; variant: string; starts_at: string; ends_at: string | null; created_at: string;
};

function AdminAnn() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", body: "", variant: "info", target_audience: "all", ends_at: "" });

  const { data } = useQuery<Ann[]>({
    queryKey: ["admin_ann"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error; return (data ?? []) as Ann[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("announcements").insert({
        title: form.title, body: form.body, variant: form.variant, target_audience: form.target_audience,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        created_by: u.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Duyuru oluşturuldu"); setForm({ title: "", body: "", variant: "info", target_audience: "all", ends_at: "" }); qc.invalidateQueries({ queryKey: ["admin_ann"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("announcements").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_ann"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Silindi"); qc.invalidateQueries({ queryKey: ["admin_ann"] }); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="size-5" /> Duyurular</h1>

      <Card>
        <CardHeader><CardTitle>Yeni Duyuru</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Başlık</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Metin</Label><Textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><Label>Tür</Label>
              <Select value={form.variant} onValueChange={(v) => setForm({ ...form, variant: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Bilgi</SelectItem>
                  <SelectItem value="success">Başarı</SelectItem>
                  <SelectItem value="warning">Uyarı</SelectItem>
                  <SelectItem value="danger">Kritik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Hedef</Label>
              <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Herkes</SelectItem>
                  <SelectItem value="employer">İş Verenler</SelectItem>
                  <SelectItem value="seeker">İş Arayanlar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Bitiş (opsiyonel)</Label>
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </div>
          <Button onClick={() => create.mutate()} disabled={!form.title.trim() || !form.body.trim() || create.isPending} className="bg-brand hover:bg-brand/90">
            <Plus className="size-4 mr-1.5" /> {create.isPending ? "Oluşturuluyor…" : "Duyuru Oluştur"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {(data ?? []).map((a) => (
          <div key={a.id} className="bg-card border rounded-lg p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {a.variant} • {a.target_audience} • {new Date(a.created_at).toLocaleString("tr-TR")}
                {a.ends_at && ` • Bitiş: ${new Date(a.ends_at).toLocaleString("tr-TR")}`}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch checked={a.is_active} onCheckedChange={(v) => toggle.mutate({ id: a.id, active: v })} />
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(a.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="text-sm text-muted-foreground text-center py-8">Henüz duyuru yok.</div>}
      </div>
    </div>
  );
}
