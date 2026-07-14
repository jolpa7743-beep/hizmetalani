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
import { MapPin, Clock, ShieldCheck, MessageSquare, ArrowLeft, Eye, Tag, Building2, User as UserIcon, ShieldAlert, Search } from "lucide-react";
import { toast } from "sonner";
import { AdSlot } from "@/components/AdSlot";

// Loader ile ilan verisini önden çekip head() içinde title/description/OG üretiyoruz.
const listingQueryOptions = (id: string) => ({
  queryKey: ["listing", id],
  queryFn: async () => {
    const { data: listing, error } = await supabase
      .from("listings")
      .select("id,user_id,title,description,type,category,city,district,price,price_type,created_at,view_count,work_type,available_days,off_days,available_hours,salary_min,salary_max,salary_period,experience_years,education_level,requirements,benefits,is_remote,is_urgent")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!listing) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,avatar_url,is_verified,city,district")
      .eq("id", listing.user_id)
      .maybeSingle();
    return { listing: listing as unknown as Listing, profile: (profile ?? null) as Profile | null };
  },
});

function truncate(s: string, n: number) {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + "…" : clean;
}

export const Route = createFileRoute("/ilan/$id")({
  component: ListingDetail,
  loader: ({ params, context }) => context.queryClient.ensureQueryData(listingQueryOptions(params.id)),
  head: ({ params, loaderData }) => {
    const l = loaderData?.listing;
    const p = loaderData?.profile;
    if (!l) {
      return {
        meta: [
          { title: "İlan bulunamadı — hizmetalanı.com" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const loc = `${l.city}${l.district ? " / " + l.district : ""}`;
    const catLabel = CATEGORY_MAP[l.category]?.label ?? "";
    const typeLabel = TYPE_LABEL[l.type];
    const priceStr = formatPrice(l.price, l.price_type);
    const title = truncate(`${l.title} — ${loc} | ${catLabel} | hizmetalanı.com`, 65);
    const description = truncate(
      `${typeLabel} · ${catLabel} · ${loc}${priceStr ? " · " + priceStr : ""} — ${l.description}`,
      160,
    );
    const ogTitle = truncate(`${l.title} — ${loc}`, 65);
    const path = `/ilan/${params.id}`;
    // JSON-LD (JobPosting) — Google Jobs uyumu
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: l.title,
      description: l.description,
      datePosted: l.created_at,
      employmentType: l.work_type ?? undefined,
      jobLocationType: l.is_remote ? "TELECOMMUTE" : undefined,
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: l.district ?? undefined,
          addressRegion: l.city,
          addressCountry: "TR",
        },
      },
      hiringOrganization: {
        "@type": "Organization",
        name: p?.full_name ?? "hizmetalanı.com kullanıcısı",
      },
      baseSalary:
        l.salary_min || l.salary_max
          ? {
              "@type": "MonetaryAmount",
              currency: "TRY",
              value: {
                "@type": "QuantitativeValue",
                minValue: l.salary_min ?? undefined,
                maxValue: l.salary_max ?? undefined,
                unitText: (l.salary_period ?? "MONTH").toUpperCase(),
              },
            }
          : undefined,
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: ogTitle },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: path },
        { property: "og:site_name", content: "hizmetalanı.com" },
        { property: "og:locale", content: "tr_TR" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: ogTitle },
        { name: "twitter:description", content: description },
        { name: "keywords", content: `${l.title}, ${catLabel}, ${l.city}, ${l.district ?? ""}, ${typeLabel}, ilan, iş`.replace(/, ,/g, ",") },
      ],
      links: [{ rel: "canonical", href: path }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
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
  work_type: string | null;
  available_days: string[] | null;
  off_days: string[] | null;
  available_hours: { start: string | null; end: string | null } | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
  experience_years: number | null;
  education_level: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
  is_remote: boolean | null;
  is_urgent: boolean | null;
};

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  city: string | null;
  district: string | null;
};

const WORK_TYPE_LABEL: Record<string, string> = {
  full_time: "Tam Zamanlı",
  part_time: "Yarı Zamanlı",
  contract: "Sözleşmeli",
  freelance: "Serbest / Freelance",
  internship: "Staj",
  seasonal: "Sezonluk",
  one_time: "Tek Seferlik",
};
const EDU_LABEL: Record<string, string> = {
  primary: "İlköğretim",
  high_school: "Lise",
  associate: "Ön Lisans",
  bachelor: "Lisans",
  master: "Yüksek Lisans",
  phd: "Doktora",
};
const SALARY_PERIOD_LABEL: Record<string, string> = {
  hourly: "saatlik",
  daily: "günlük",
  monthly: "aylık",
  job: "iş başı",
};
const DAYS_ORDER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
// Alan bazlı "belirtilmemiş" mesajları — kullanıcı ne eksik olduğunu net görsün
const EMPTY = {
  work_type: "Çalışma tipi belirtilmemiş — görüşmeye açık",
  salary: "Maaş belirtilmemiş — pazarlığa açık",
  hours: "Çalışma saatleri belirtilmemiş — esnek",
  experience: "Deneyim şartı belirtilmemiş — fark etmez",
  education: "Eğitim şartı belirtilmemiş — fark etmez",
  remote: "Uzaktan/acil bilgisi belirtilmemiş",
  days: "Çalışma / izin günleri belirtilmemiş — esnek",
  requirements: "Özel bir şart belirtilmemiş — görüşmeye açık",
  benefits: "Yan hak belirtilmemiş — görüşmeye açık",
} as const;

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authDialog, setAuthDialog] = useState(false);

  const { data, isLoading, error } = useQuery(listingQueryOptions(id));

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

              {/* Çalışma Koşulları */}
              <div className="mt-6">
                <h2 className="font-semibold mb-3">Çalışma Koşulları</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <InfoBox label="Çalışma Tipi" value={listing.work_type ? WORK_TYPE_LABEL[listing.work_type] ?? listing.work_type : EMPTY.work_type} isEmpty={!listing.work_type} />
                  <InfoBox
                    label="Maaş / Ücret"
                    value={
                      listing.salary_min || listing.salary_max
                        ? `${listing.salary_min ? "₺" + listing.salary_min.toLocaleString("tr-TR") : ""}${listing.salary_min && listing.salary_max ? " - " : ""}${listing.salary_max ? "₺" + listing.salary_max.toLocaleString("tr-TR") : ""} ${SALARY_PERIOD_LABEL[listing.salary_period ?? "monthly"] ?? ""}`.trim()
                        : EMPTY.salary
                    }
                    isEmpty={!(listing.salary_min || listing.salary_max)}
                  />
                  <InfoBox
                    label="Çalışma Saatleri"
                    value={
                      listing.available_hours?.start || listing.available_hours?.end
                        ? `${listing.available_hours?.start ?? "?"} - ${listing.available_hours?.end ?? "?"}`
                        : EMPTY.hours
                    }
                    isEmpty={!(listing.available_hours?.start || listing.available_hours?.end)}
                  />
                  <InfoBox
                    label="Deneyim"
                    value={listing.experience_years != null ? `${listing.experience_years} yıl` : EMPTY.experience}
                    isEmpty={listing.experience_years == null}
                  />
                  <InfoBox label="Eğitim" value={listing.education_level ? EDU_LABEL[listing.education_level] ?? listing.education_level : EMPTY.education} isEmpty={!listing.education_level} />
                  <InfoBox
                    label="Uzaktan / Acil"
                    value={
                      [listing.is_remote ? "Uzaktan çalışılabilir" : null, listing.is_urgent ? "Acil" : null]
                        .filter(Boolean)
                        .join(" • ") || EMPTY.remote
                    }
                    isEmpty={!listing.is_remote && !listing.is_urgent}
                  />
                </div>
              </div>

              {/* Günler */}
              {(listing.available_days?.length || listing.off_days?.length) ? (
                <div className="mt-6">
                  <h2 className="font-semibold mb-2">Çalışma / İzin Günleri</h2>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_ORDER.map((d) => {
                      const isWork = listing.available_days?.includes(d);
                      const isOff = listing.off_days?.includes(d);
                      const cls = isWork
                        ? "bg-brand text-brand-foreground border-brand"
                        : isOff
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "border-border text-muted-foreground";
                      return (
                        <span key={d} className={`px-3 py-1.5 rounded-full text-sm border ${cls}`}>
                          {d}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand" /> Çalışma günü</span>
                    <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-emerald-500" /> İzinli gün</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <h2 className="font-semibold mb-2">Çalışma / İzin Günleri</h2>
                  <p className="text-sm text-muted-foreground italic">{EMPTY.days}</p>
                </div>
              )}

              {/* Şartlar */}
              <div className="mt-6">
                <h2 className="font-semibold mb-2">Aranan Nitelikler / Şartlar</h2>
                {listing.requirements?.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-foreground/90">
                    {listing.requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{EMPTY.requirements}</p>
                )}
              </div>

              {/* Yan Haklar */}
              <div className="mt-6">
                <h2 className="font-semibold mb-2">Yan Haklar</h2>
                {listing.benefits?.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-foreground/90">
                    {listing.benefits.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{EMPTY.benefits}</p>
                )}
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
            <p className="font-medium text-foreground mb-2 flex items-center gap-1.5"><ShieldAlert className="size-4 text-amber-600" aria-hidden /> Güvenlik Uyarısı</p>
            <p>Görüşmeden önce ödeme yapmayın, kimlik bilgilerinizi paylaşmayın. Anlaşmalarınızı yazılı yapın.</p>
          </div>
        </div>
      </div>

      <AdSlot slot="in_article" layout="in-article" format="fluid" className="mt-8" />




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

function InfoBox({ label, value, isEmpty }: { label: string; value: string; isEmpty?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-medium mt-1 ${isEmpty ? "text-muted-foreground italic text-sm font-normal" : ""}`}>
        {value}
      </div>
    </div>
  );
}

