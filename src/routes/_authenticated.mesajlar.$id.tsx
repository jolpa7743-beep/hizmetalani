import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mesajlar/$id")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "Sohbet — hizmetalanı.com" }] }),
});

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function ChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conv } = useQuery({
    queryKey: ["conv", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, listing_id, user1_id, user2_id, listings(id, title)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const otherId = conv ? (conv.user1_id === user?.id ? conv.user2_id : conv.user1_id) : null;
  const { data: other } = useQuery({
    queryKey: ["profile", otherId],
    enabled: !!otherId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", otherId!).maybeSingle();
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`msg-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => { qc.invalidateQueries({ queryKey: ["messages", id] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, qc]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !user) return;
    setText("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: user.id,
      content,
    });
    if (error) {
      toast.error(error.message);
      setText(content);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-3 border-b">
        <Link to="/mesajlar" className="p-2 -ml-2 hover:bg-muted rounded">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{other?.full_name ?? "Kullanıcı"}</div>
          {conv?.listings && (
            <Link to="/ilan/$id" params={{ id: conv.listings.id }} className="text-xs text-brand hover:underline truncate block">
              {conv.listings.title}
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages?.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">
            Henüz mesaj yok. İlk mesajı gönderin.
          </div>
        )}
        {messages?.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${mine ? "bg-brand text-brand-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                <div className="whitespace-pre-wrap break-words text-sm">{m.content}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-brand-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="pt-3 border-t flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesajınızı yazın..."
          maxLength={4000}
          className="h-11"
        />
        <Button type="submit" disabled={!text.trim()} className="h-11 bg-brand hover:bg-brand/90">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
