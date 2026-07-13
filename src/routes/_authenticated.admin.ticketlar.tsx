import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ticketlar")({
  component: AdminTicketsPage,
  head: () => ({ meta: [{ title: "Destek Talepleri — Yönetici" }] }),
});

type Ticket = {
  id: string; user_id: string; subject: string; category: string;
  status: string; priority: string; last_message_at: string; created_at: string;
};
type Msg = { id: string; ticket_id: string; sender_id: string; body: string; is_admin: boolean; created_at: string };

function AdminTicketsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");

  const tickets = useQuery<Ticket[]>({
    queryKey: ["admin_tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tickets").select("*").order("last_message_at", { ascending: false });
      if (error) throw error; return (data ?? []) as Ticket[];
    },
  });

  const messages = useQuery<Msg[]>({
    queryKey: ["admin_ticket_msgs", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_messages").select("*").eq("ticket_id", selected!).order("created_at");
      if (error) throw error; return (data ?? []) as Msg[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("admin_tickets_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => qc.invalidateQueries({ queryKey: ["admin_tickets"] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages" }, (p) => {
        const row = p.new as Msg;
        if (row.ticket_id === selected) qc.invalidateQueries({ queryKey: ["admin_ticket_msgs", selected] });
        qc.invalidateQueries({ queryKey: ["admin_tickets"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, selected]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages.data]);

  async function send() {
    if (!text.trim() || !selected) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: selected, sender_id: u.user.id, body: text.trim(), is_admin: true,
    });
    if (error) { toast.error(error.message); return; }
    setText("");
  }

  async function close(id: string) {
    const { error } = await supabase.from("tickets").update({ status: "closed" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Talep kapatıldı"); qc.invalidateQueries({ queryKey: ["admin_tickets"] }); }
  }

  const list = tickets.data ?? [];
  const active = useMemo(() => list.find((t) => t.id === selected), [list, selected]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-8rem)]">
      <div className="bg-card border rounded-xl overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b flex items-center gap-2 font-semibold">
          <MessageCircle className="size-4" /> Talepler ({list.length})
        </div>
        <div className="overflow-y-auto flex-1">
          {list.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Henüz talep yok.</div>}
          {list.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.id)} className={`w-full text-left p-3 border-b hover:bg-muted/40 ${selected === t.id ? "bg-muted" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium truncate">{t.subject}</div>
                <Badge variant={t.status === "open" ? "default" : "secondary"} className={t.status === "open" ? "bg-amber-500" : t.status === "answered" ? "bg-emerald-600" : ""}>
                  {t.status === "open" ? "Açık" : t.status === "answered" ? "Yanıtlandı" : "Kapalı"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{new Date(t.last_message_at).toLocaleString("tr-TR")}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden flex flex-col">
        {!active ? (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Bir talep seçin</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">{active.subject}</div>
                <div className="text-xs text-muted-foreground">{active.category} • {active.priority}</div>
              </div>
              {active.status !== "closed" && (
                <Button size="sm" variant="outline" onClick={() => close(active.id)}>
                  <CheckCircle2 className="size-4 mr-1.5" /> Kapat
                </Button>
              )}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {(messages.data ?? []).map((m) => (
                <div key={m.id} className={`flex ${m.is_admin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.is_admin ? "bg-brand text-brand-foreground" : "bg-muted"}`}>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                    <div className={`text-[10px] mt-1 ${m.is_admin ? "text-brand-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleString("tr-TR")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3 flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} placeholder="Yanıt yazın…" />
              <Button onClick={send} disabled={!text.trim()}><Send className="size-4" /></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
