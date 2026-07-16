import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { MessageSquare, Search, ArrowLeft, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { adminListConversations, adminGetConversation } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/mesajlar")({
  component: AdminMessages,
  head: () => ({ meta: [{ title: "Kullanıcı Mesajları — Yönetici" }] }),
});

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return (name || "?").trim().slice(0, 1).toUpperCase();
}

function AdminMessages() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const listFn = useServerFn(adminListConversations);
  const { data: convs, isLoading } = useQuery({
    queryKey: ["admin-conversations"],
    queryFn: () => listFn({ data: { limit: 200 } }),
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return convs ?? [];
    return (convs ?? []).filter((c) =>
      c.user1.name?.toLowerCase().includes(q) ||
      c.user2.name?.toLowerCase().includes(q) ||
      c.listing?.title?.toLowerCase().includes(q) ||
      c.last_message?.content?.toLowerCase().includes(q)
    );
  }, [convs, search]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="size-6 text-brand" /> Kullanıcı Mesajları
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Site kullanıcılarının kendi aralarındaki tüm sohbetlerini görüntüleyebilirsiniz. Salt okunur — mesajları düzenleyemez veya silemezsiniz.
        </p>
      </header>

      {selected ? (
        <ThreadView conversationId={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kullanıcı, ilan başlığı veya mesaj içeriği ara…"
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
              Henüz sohbet yok.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Toplam {filtered.length} sohbet</p>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className="w-full text-left"
                >
                  <Card className="hover:border-brand/50 hover:bg-muted/30 transition-colors">
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className="flex -space-x-2">
                        <Avatar className="size-9 border-2 border-background">
                          <AvatarFallback className="bg-brand/80 text-white text-xs">{initials(c.user1.name)}</AvatarFallback>
                        </Avatar>
                        <Avatar className="size-9 border-2 border-background">
                          <AvatarFallback className="bg-slate-500 text-white text-xs">{initials(c.user2.name)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {c.user1.name} <span className="text-muted-foreground">↔</span> {c.user2.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{fmtDate(c.last_message_at)}</span>
                          <span className="text-[11px] text-muted-foreground">• {c.message_count} mesaj</span>
                        </div>
                        {c.listing && (
                          <div className="text-xs text-brand mt-0.5 truncate">İlan: {c.listing.title}</div>
                        )}
                        {c.last_message && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {c.last_message.content}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ThreadView({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const getFn = useServerFn(adminGetConversation);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-conversation", conversationId],
    queryFn: () => getFn({ data: { conversationId } }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor…</div>;
  if (!data) return <div className="text-sm text-muted-foreground py-8 text-center">Bulunamadı.</div>;

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4 mr-1" /> Sohbet listesine dön
      </Button>

      <Card>
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="size-4 text-brand" />
            <span className="font-medium">{data.user1.name}</span>
            <span className="text-muted-foreground">↔</span>
            <span className="font-medium">{data.user2.name}</span>
          </div>
          {data.listing && (
            <div className="text-xs text-brand">İlan: {data.listing.title}</div>
          )}
          <div className="text-xs text-muted-foreground">Başlangıç: {fmtDate(data.created_at)}</div>
        </CardContent>
      </Card>

      <div className="space-y-2 border rounded-lg p-3 bg-muted/20 max-h-[70vh] overflow-y-auto">
        {data.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Bu sohbette henüz mesaj yok.</p>
        ) : (
          data.messages.map((m) => {
            const isUser1 = m.sender_id === data.user1.id;
            const senderName = isUser1 ? data.user1.name : data.user2.name;
            return (
              <div key={m.id} className={cn("flex", isUser1 ? "justify-start" : "justify-end")}>
                <div className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  isUser1 ? "bg-card border" : "bg-brand text-brand-foreground"
                )}>
                  <div className={cn("text-[11px] mb-0.5 font-medium", isUser1 ? "text-muted-foreground" : "text-white/80")}>
                    {senderName} • {fmtDate(m.created_at)}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
