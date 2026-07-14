import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mesajlar/")({
  component: Conversations,
  head: () => ({ meta: [{ title: "Mesajlarım — hizmetalanı.com" }] }),
});

type Conv = {
  id: string;
  listing_id: string | null;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  listings: { title: string } | null;
};

function Conversations() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, listing_id, user1_id, user2_id, last_message_at, listings(title)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Conv[];
    },
  });

  const otherIds = Array.from(new Set((data ?? []).map((c) => (c.user1_id === user?.id ? c.user2_id : c.user1_id))));

  const { data: others } = useQuery({
    queryKey: ["conv-others", otherIds.sort().join(",")],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", otherIds);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name])) as Record<string, string | null>;
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Mesajlarım</h1>
      {isLoading && <p>Yükleniyor...</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="text-center py-16 border border-dashed rounded-xl bg-surface">
          <MessageSquare className="size-10 mx-auto text-muted-foreground mb-2" />
          <p className="font-medium">Henüz mesajınız yok</p>
          <p className="text-sm text-muted-foreground mt-1">İlgi çeken bir ilana mesaj göndererek başlayın.</p>
          <Link to="/" className="inline-block mt-4 text-brand hover:underline">İlanlara Göz At</Link>
        </div>
      )}
      <div className="space-y-2">
        {data?.map((c) => {
          const otherId = c.user1_id === user?.id ? c.user2_id : c.user1_id;
          const otherName = others?.[otherId] ?? "Kullanıcı";
          return (
            <Link
              key={c.id}
              to="/mesajlar/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface hover:border-brand/40 hover:bg-muted transition-colors"
            >
              <Avatar>
                <AvatarFallback className="bg-brand text-brand-foreground">
                  {(otherName ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{otherName}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {c.listings?.title ?? "Doğrudan mesaj"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {new Date(c.last_message_at).toLocaleDateString("tr-TR")}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
