import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Send, MessageCircle, Plus, LifeBuoy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/destek")({
  component: SupportPage,
  head: () => ({ meta: [{ title: "Destek Talepleri — hizmetalanı.com" }] }),
});

type Ticket = {
  id: string; user_id: string; subject: string; category: string;
  status: string; priority: string; last_message_at: string; created_at: string;
};
type Msg = { id: string; ticket_id: string; sender_id: string; body: string; is_admin: boolean; created_at: string };

const CATS = [
  { v: "general", l: "Genel" },
  { v: "account", l: "Hesap" },
  { v: "listing", l: "İlan" },
  { v: "payment", l: "Ödeme" },
  { v: "abuse", l: "Şikayet / Kötüye Kullanım" },
  { v: "bug", l: "Teknik Sorun" },
];

function SupportPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [nf, setNf] = useState({ subject: "", category: "general", priority: "normal", body: "" });

  const tickets = useQuery<Ticket[]>({
    queryKey: ["my_tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets")
        .select("*").eq("user_id", user!.id).order("last_message_at", { ascending: false });
      if (error) throw error; return (data ?? []) as Ticket[];
    },
  });

  const messages = useQuery<Msg[]>({
    queryKey: ["my_ticket_msgs", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_messages")
        .select("*").eq("ticket_id", selected!).order("created_at");
      if (error) throw error; return (data ?? []) as Msg[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`user_support_${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["my_tickets", user.id] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages" }, (p) => {
        const row = p.new as Msg;
        if (row.ticket_id === selected) qc.invalidateQueries({ queryKey: ["my_ticket_msgs", selected] });
        qc.invalidateQueries({ queryKey: ["my_tickets", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, selected, user]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages.data]);

  async function send() {
    if (!text.trim() || !selected || !user) return;
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: selected, sender_id: user.id, body: text.trim(), is_admin: false,
    });
    if (error) { toast.error(error.message); return; }
    setText("");
  }

  async function createTicket() {
    if (!user) return;
    if (nf.subject.trim().length < 3) return toast.error("Konu en az 3 karakter olmalı");
    if (nf.body.trim().length < 10) return toast.error("Mesaj en az 10 karakter olmalı");
    const { data, error } = await supabase.from("tickets").insert({
      user_id: user.id, subject: nf.subject.trim(), category: nf.category, priority: nf.priority, status: "open",
    }).select("id").single();
    if (error) return toast.error(error.message);
    const { error: mErr } = await supabase.from("ticket_messages").insert({
      ticket_id: data.id, sender_id: user.id, body: nf.body.trim(), is_admin: false,
    });
    if (mErr) return toast.error(mErr.message);
    toast.success("Talebiniz oluşturuldu");
    setOpenNew(false);
    setNf({ subject: "", category: "general", priority: "normal", body: "" });
    setSelected(data.id);
    qc.invalidateQueries({ queryKey: ["my_tickets", user.id] });
  }

  const list = tickets.data ?? [];
  const active = useMemo(() => list.find((t) => t.id === selected), [list, selected]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><LifeBuoy className="size-6 text-brand" /> Destek</h1>
          <p className="text-sm text-muted-foreground">Sorularınızı gönderin; ekibimiz gerçek zamanlı yanıtlar.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="bg-brand hover:bg-brand/90"><Plus className="size-4 mr-1.5" /> Yeni Talep</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Destek Talebi</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Konu</Label>
                <Input value={nf.subject} onChange={(e) => setNf({ ...nf, subject: e.target.value })} placeholder="Kısa bir başlık" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kategori</Label>
                  <Select value={nf.category} onValueChange={(v) => setNf({ ...nf, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Öncelik</Label>
                  <Select value={nf.priority} onValueChange={(v) => setNf({ ...nf, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                      <SelectItem value="urgent">Acil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Mesaj</Label>
                <Textarea rows={5} value={nf.body} onChange={(e) => setNf({ ...nf, body: e.target.value })} placeholder="Sorununuzu detaylı açıklayın." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNew(false)}>İptal</Button>
              <Button onClick={createTicket} className="bg-brand hover:bg-brand/90">Gönder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-14rem)]">
        <div className="bg-card border rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b flex items-center gap-2 font-semibold">
            <MessageCircle className="size-4" /> Taleplerim ({list.length})
          </div>
          <div className="overflow-y-auto flex-1">
            {tickets.isLoading && <div className="p-6 text-sm text-muted-foreground">Yükleniyor...</div>}
            {!tickets.isLoading && list.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Henüz talebiniz yok. Yeni Talep ile başlayın.
              </div>
            )}
            {list.map((t) => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`w-full text-left p-3 border-b hover:bg-muted/40 ${selected === t.id ? "bg-muted" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{t.subject}</div>
                  <Badge className={t.status === "open" ? "bg-amber-500" : t.status === "answered" ? "bg-emerald-600" : "bg-muted-foreground"}>
                    {t.status === "open" ? "Açık" : t.status === "answered" ? "Yanıtlandı" : "Kapalı"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{new Date(t.last_message_at).toLocaleString("tr-TR")}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden flex flex-col">
          {!selected && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8 text-center">
              Sol taraftan bir talep seçin ya da yeni bir talep oluşturun.
            </div>
          )}
          {selected && (
            <>
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div>
                  <div className="font-semibold">{active?.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    {CATS.find((c) => c.v === active?.category)?.l} · {active?.priority}
                  </div>
                </div>
                <Badge className={active?.status === "open" ? "bg-amber-500" : active?.status === "answered" ? "bg-emerald-600" : "bg-muted-foreground"}>
                  {active?.status === "open" ? "Açık" : active?.status === "answered" ? "Yanıtlandı" : "Kapalı"}
                </Badge>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages.data ?? []).map((m) => (
                  <div key={m.id} className={`flex ${m.is_admin ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.is_admin ? "bg-muted" : "bg-brand text-brand-foreground"}`}>
                      <div className="text-[10px] opacity-70 mb-0.5">{m.is_admin ? "Destek Ekibi" : "Siz"} · {new Date(m.created_at).toLocaleString("tr-TR")}</div>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                    </div>
                  </div>
                ))}
              </div>
              {active?.status !== "closed" ? (
                <div className="p-3 border-t flex items-center gap-2">
                  <Input value={text} onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Mesajınızı yazın..." className="h-11" />
                  <Button onClick={send} className="h-11 bg-brand hover:bg-brand/90"><Send className="size-4" /></Button>
                </div>
              ) : (
                <div className="p-3 border-t text-xs text-muted-foreground text-center">Bu talep kapatıldı.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
