import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORY_MAP, TYPE_LABEL, formatPrice, type CategoryKey, type ListingType } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, ShieldCheck, MessageSquare, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ilan/$id")({
  component: ListingDetail,
  head: ({ params }) => ({
    meta: [{ title: `İlan #${params.id.slice(0, 8)} — hizmetalanı.com` }],
  }),
});

type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: ListingType;
  category: CategoryKey;
  city: string;
  district: string | null;
  price: number | null;
  price_type: string;
  created_at: string;
  view_count: number;
  profiles: { full_name: string | null; avatar_url: string | null; is_verified: boolean; city: string | null } | null;
};

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,user_id,title,description,type,category,city,district,price,price_type,created_at,view_count, profiles(full_name,avatar_url,is_verified,city)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Listing | null;
    },
  });

  // Görüntülenme sayısını artır (popülerliğe göre sıralama için)
  useEffect(() => {
    supabase.rpc("increment_listing_view", { _id: id }).then(() => {});
  }, [id]);

  const contactSeller = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/ilan/${id}` } });
      return;
    }
    if (!data) return;
    if (data.user_id === user.id) {
      toast.error("Kendi ilanınıza mesaj gönderemezsiniz");
      return;
    }
    const [u1, u2] = [user.id, data.user_id].sort();
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", data.id)
      .eq("user1_id", u1)
      .eq("user2_id", u2)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: created, error: cErr } = await supabase
        .from("conversations")
        .insert({ listing_id: data.id, user1_id: u1, user2_id: u2 })
        .select("id")
        .single();
      if (cErr) {
        toast.error("Konuşma başlatılamadı: " + cErr.message);
        return;
      }
      convId = created.id;
    }
    navigate({ to: "/mesajlar/$id", params: { id: convId! } });
  };

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10">Yükleniyor...</div>;
  if (error || !data)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <p className="text-lg font-medium">İlan bulunamadı</p>
        <Link to="/" className="text-brand hover:underline mt-2 inline-block">← İlanlara dön</Link>
      </div>
    );

  const cat = CATEGORY_MAP[data.category];
  const isOwner = user?.id === data.user_id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand mb-4">
        <ArrowLeft className="size-4" /> İlanlara dön
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="h-56 md:h-72 bg-gradient-to-br from-brand/10 to-brand-accent/10 grid place-items-center text-8xl">
              {cat?.emoji}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-brand text-brand-foreground">{TYPE_LABEL[data.type]}</Badge>
                <Badge variant="secondary">{cat?.label}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{data.title}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> {data.city}{data.district ? ` / ${data.district}` : ""}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" /> {new Date(data.created_at).toLocaleDateString("tr-TR")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-4" /> {data.view_count} görüntülenme
                </span>
              </div>
              <div className="mt-4 text-3xl font-bold text-brand">
                {formatPrice(data.price, data.price_type)}
              </div>
              <div className="mt-6">
                <h2 className="font-semibold mb-2">Açıklama</h2>
                <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{data.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="bg-brand text-brand-foreground">
                  {(data.profiles?.full_name ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate flex items-center gap-1">
                  {data.profiles?.full_name ?? "İlan Sahibi"}
                  {data.profiles?.is_verified && (
                    <ShieldCheck className="size-4 text-brand" aria-label="Doğrulanmış" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {data.profiles?.city ?? data.city}
                </div>
              </div>
            </div>
            {!isOwner ? (
              <Button
                onClick={contactSeller}
                className="w-full mt-4 h-11 bg-brand hover:bg-brand/90"
              >
                <MessageSquare className="size-4 mr-2" /> Mesaj Gönder
              </Button>
            ) : (
              <div className="mt-4 p-3 rounded-md bg-muted text-sm text-center">
                Bu sizin ilanınız
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">⚠️ Güvenlik Uyarısı</p>
            <p>Görüşmeden önce ödeme yapmayın, kimlik bilgilerinizi paylaşmayın. Anlaşmalarınızı yazılı yapın.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
