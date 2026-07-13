import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORY_MAP, TYPE_LABEL, formatPrice, type CategoryKey, type ListingType } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, Clock, ShieldCheck, MessageSquare, ArrowLeft, Eye, Tag, Building2, User as UserIcon } from "lucide-react";
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
};

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  city: string | null;
  district: string | null;
};

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authDialog, setAuthDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data: listing, error } = await supabase
        .from("listings")
        .select("id,user_id,title,description,type,category,city,district,price,price_type,created_at,view_count")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!listing) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,avatar_url,is_verified,city,district")
        .eq("id", listing.user_id)
        .maybeSingle();
      return { listing: listing as Listing, profile: (profile ?? null) as Profile | null };
    },
  });

  useEffect(() => {
    supabase.rpc("increment_listing_view", { _id: id }).then(() => {});
  }, [id]);

  const contactSeller = async () => {
    if (!user) {
      setAuthDialog(true);
      return;
    }
    if (!data?.listing) return;
    const listing = data.listing;
    if (listing.user_id === user.id) {
      toast.error("Kendi ilanınıza mesaj gönderemezsiniz");
      return;
    }
    const [u1, u2] = [user.id, listing.user_id].sort();
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("user1_id", u1)
      .eq("user2_id", u2)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: created, error: cErr } = await supabase
        .from("conversations")
        .insert({ listing_id: listing.id, user1_id: u1, user2_id: u2 })
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
  if (error || !data || !data.listing)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <p className="text-lg font-medium">İlan bulunamadı</p>
        <Link to="/" className="text-brand hover:underline mt-2 inline-block">← İlanlara dön</Link>
      </div>
    );

  const listing = data.listing;
  const profile = data.profile;
  const cat = CATEGORY_MAP[listing.category];
  const isOwner = user?.id === listing.user_id;
  const isOffering = listing.type === "offering";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
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
                <Badge className={isOffering ? "bg-brand text-brand-foreground" : "bg-brand-accent text-brand-foreground"}>
                  {isOffering ? <Building2 className="size-3 mr-1" /> : <UserIcon className="size-3 mr-1" />}
                  {TYPE_LABEL[listing.type]}
                </Badge>
                <Badge variant="secondary">
                  <Tag className="size-3 mr-1" /> {cat?.label}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{listing.title}</h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> {listing.city}
                  {listing.district ? ` / ${listing.district}` : ""}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" /> {new Date(listing.created_at).toLocaleDateString("tr-TR")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-4" /> {listing.view_count} görüntülenme
                </span>
              </div>
              <div className="mt-4 text-3xl font-bold text-brand">
                {formatPrice(listing.price, listing.price_type)}
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">İlan Tipi</div>
                  <div className="font-medium mt-1">{TYPE_LABEL[listing.type]}</div>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">Kategori</div>
                  <div className="font-medium mt-1">{cat?.label}</div>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">Şehir</div>
                  <div className="font-medium mt-1">{listing.city}</div>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">İlçe</div>
                  <div className="font-medium mt-1">{listing.district ?? "—"}</div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="font-semibold mb-2">Açıklama</h2>
                <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{listing.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="bg-brand text-brand-foreground">
                  {(profile?.full_name ?? "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate flex items-center gap-1">
                  {profile?.full_name ?? "İlan Sahibi"}
                  {profile?.is_verified && (
                    <ShieldCheck className="size-4 text-brand" aria-label="Doğrulanmış" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {profile?.city ?? listing.city}
                  {profile?.district ? ` / ${profile.district}` : ""}
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

      <AlertDialog open={authDialog} onOpenChange={setAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Üyelik Gerekli</AlertDialogTitle>
            <AlertDialogDescription>
              Mesaj gönderebilmek için üye girişi yapmanız gerekiyor. Hesabınız yoksa hızlıca oluşturabilirsiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate({ to: "/auth", search: { redirect: `/ilan/${id}` } })}
            >
              Giriş Yap / Üye Ol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
