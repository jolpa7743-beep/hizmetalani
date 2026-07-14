import { Baby, Sparkles, Building2, Building, PawPrint, Home, type LucideIcon } from "lucide-react";
import { ILLER } from "@/lib/turkiye";

export type CategoryKey =
  | "bakici"
  | "ev_temizlik"
  | "ofis_temizlik"
  | "merdiven_temizlik"
  | "evcil_yuva_arayan"
  | "evcil_yuva_veren";

export type ListingType = "offering" | "seeking";

export const CATEGORIES: {
  key: CategoryKey;
  label: string;
  short: string;
  icon: LucideIcon;
  slug: string;
  seoDescription: string;
  types: ListingType[];
}[] = [
  { key: "bakici", slug: "bakici", label: "Bakıcı (Çocuk / Yaşlı / Hasta)", short: "Bakıcı", icon: Baby,
    seoDescription: "Türkiye genelinde çocuk bakıcısı, yaşlı bakıcısı ve hasta bakıcısı ilanları. Güvenilir bakıcılar ve iş verenler buluşuyor.",
    types: ["offering", "seeking"] },
  { key: "ev_temizlik", slug: "ev-temizligi", label: "Ev Temizliği", short: "Ev Temizliği", icon: Sparkles,
    seoDescription: "Ev temizliği için gündelik temizlikçi ilanları. İş arayan ve iş veren ev temizliği hizmetleri.",
    types: ["offering", "seeking"] },
  { key: "ofis_temizlik", slug: "ofis-temizligi", label: "Ofis Temizliği", short: "Ofis Temizliği", icon: Building2,
    seoDescription: "Kurumsal ve bireysel ofis temizliği ilanları. Ofis temizlik personeli arayan işverenler ve iş arayanlar.",
    types: ["offering", "seeking"] },
  { key: "merdiven_temizlik", slug: "bina-temizligi", label: "Bina Temizliği", short: "Bina Temizliği", icon: Building,
    seoDescription: "Apartman ve bina temizliği için düzenli veya haftalık personel ilanları.",
    types: ["offering", "seeking"] },
  { key: "evcil_yuva_arayan", slug: "gecici-konaklama-arayan", label: "Evcil Hayvan – Geçici Konaklama Arayan", short: "Konaklama Arayan", icon: PawPrint,
    seoDescription: "Tatil veya kısa süreli seyahat için evcil hayvanına güvenli geçici konaklama arayanlar.",
    types: ["seeking"] },
  { key: "evcil_yuva_veren", slug: "gecici-konaklama-sunan", label: "Evcil Hayvan – Geçici Konaklama Sunan", short: "Konaklama Sunan", icon: Home,
    seoDescription: "Evcil hayvanlara güvenli, profesyonel ve geçici konaklama hizmeti sunan bakıcılar.",
    types: ["offering"] },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  CategoryKey,
  (typeof CATEGORIES)[number]
>;

export const CATEGORY_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Record<
  string,
  (typeof CATEGORIES)[number]
>;

export const TYPE_LABEL: Record<ListingType, string> = {
  offering: "İş Veren",
  seeking: "İş Arayan",
};

export const PRICE_TYPE_LABEL: Record<string, string> = {
  hourly: "saatlik",
  daily: "günlük",
  monthly: "aylık",
  job: "iş başı",
  negotiable: "pazarlık",
};

export const WORK_TYPE_LABEL: Record<string, string> = {
  full_time: "Tam zamanlı",
  part_time: "Yarı zamanlı",
  freelance: "Serbest / Proje",
  gecici: "Geçici",
};

export const EDUCATION_LABEL: Record<string, string> = {
  ilkokul: "İlkokul",
  ortaokul: "Ortaokul",
  lise: "Lise",
  onlisans: "Ön Lisans",
  lisans: "Lisans",
  yuksek_lisans: "Yüksek Lisans",
  farketmez: "Fark etmez",
};

export const DAYS = [
  { key: "pzt", label: "Pzt" },
  { key: "sal", label: "Sal" },
  { key: "car", label: "Çar" },
  { key: "per", label: "Per" },
  { key: "cum", label: "Cum" },
  { key: "cmt", label: "Cmt" },
  { key: "paz", label: "Paz" },
] as const;

export function formatPrice(price: number | null | undefined, priceType: string): string {
  if (!price || priceType === "negotiable") return "Pazarlık";
  const n = new Intl.NumberFormat("tr-TR").format(Number(price));
  return `${n} TL / ${PRICE_TYPE_LABEL[priceType] ?? ""}`.trim();
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  period: string | null | undefined,
): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
  const p = period ? PRICE_TYPE_LABEL[period] ?? period : "";
  if (min && max) return `${fmt(min)} - ${fmt(max)} TL${p ? ` / ${p}` : ""}`;
  return `${fmt((min ?? max)!)} TL${p ? ` / ${p}` : ""}`;
}

// Geriye uyumluluk için: eski TR_CITIES kullanan yerler için 81 il
export const TR_CITIES = ILLER;
