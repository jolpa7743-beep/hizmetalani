import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, MapPin, ArrowLeft } from "lucide-react";
import { UserReviews } from "@/components/UserReviews";
import { getSiteSettings } from "@/lib/settings.functions";
import { shouldShowBadge, trustBadgeMeta, type BadgeVisibility } from "@/lib/trust";
import { ListingCard, type ListingRow } from "@/components/ListingCard";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  is_verified: boolean;
  trust_level: number | null;
  created_at: string;
};

const profileQueryOptions = (id: string) => ({
  queryKey: ["public-profile", id],
  queryFn: async () => {
    const [{ data: profile }, { data: listings }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, city, district, bio, is_verified, trust_level, created_at")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("listings")
        .select("id, user_id, title, type, category, city, district, price, price_type, created_at, description, view_count, is_urgent, is_featured")
        .eq("user_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(24),
    ]);
    return { profile: (profile ?? null) as Profile | null, listings: (listings ?? []) as ListingRow[] };
  },
});

export const Route = createFileRoute("/uye/$id")({
  component: MemberProfile,
  loader: ({ params, context }) => context.queryClient.ensureQueryData(profileQueryOptions(params.id)),
  head: ({ loaderData }) => {
    const name = loaderData?.profile?.full_name ?? "Üye";
    return {
      meta: [
        { title: `${name} — Üye Profili | hizmetalanı.com` },
        { name: "description", content: `${name} adlı üyenin ilanları, değerlendirmeleri ve puanları.` },
        { property: "og:title", content: `${name} — Üye Profili` },
        { property: "og:type", content: "profile" },
      ],
    };
  },
});

function MemberProfile() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(profileQueryOptions(id));
  const fetchSettings = useServerFn(getSiteSettings);
  const { data: settings } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60_000,
  });
  const badgeVisibility: BadgeVisibility =
    (settings?.trust_badge_visibility as BadgeVisibility | undefined) ?? "all";

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10">Yükleniyor...</div>;
  if (!data?.profile)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <p className="text-lg font-medium">Üye bulunamadı</p>
        <Link to="/" className="text-brand hover:underline mt-2 inline-block">← Anasayfa</Link>
      </div>
    );

  const p = data.profile;
  const lvl = p.trust_level ?? (p.is_verified ? 1 : 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand mb-4">
        <ArrowLeft className="size-4" /> Anasayfa
      </Link>

      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar className="size-16">
            <AvatarFallback className="bg-brand text-brand-foreground text-lg">
              {(p.full_name ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{p.full_name ?? "Üye"}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {(p.city || p.district) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {p.city ?? ""}{p.district ? ` / ${p.district}` : ""}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Üyelik: {new Date(p.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long" })}
              </span>
            </div>
            {shouldShowBadge(lvl, badgeVisibility) && (() => {
              const meta = trustBadgeMeta(lvl);
              return (
                <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${meta.className}`}>
                  <meta.icon className="size-3.5" /> {meta.label}
                </div>
              );
            })()}
            {p.bio && <p className="mt-3 text-sm whitespace-pre-wrap text-foreground/90">{p.bio}</p>}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <UserReviews userId={p.id} ownerName={p.full_name ?? "Üye"} />
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-lg mb-3">Aktif İlanları ({data.listings.length})</h2>
        {data.listings.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aktif ilanı yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.listings.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
