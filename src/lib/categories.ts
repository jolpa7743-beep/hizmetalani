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
  emoji: string;
  types: ListingType[];
}[] = [
  { key: "bakici", label: "Bakıcı (Çocuk / Yaşlı / Hasta)", short: "Bakıcı", emoji: "🧑‍⚕️", types: ["offering", "seeking"] },
  { key: "ev_temizlik", label: "Ev Temizliği", short: "Ev Temizliği", emoji: "🧹", types: ["offering", "seeking"] },
  { key: "ofis_temizlik", label: "Ofis Temizliği", short: "Ofis Temizliği", emoji: "🏢", types: ["offering", "seeking"] },
  { key: "merdiven_temizlik", label: "Merdiven / Apartman Temizliği", short: "Merdiven", emoji: "🪜", types: ["offering", "seeking"] },
  { key: "evcil_yuva_arayan", label: "Evcil Hayvan – Geçici Yuva Arayan", short: "Yuva Arayan", emoji: "🐾", types: ["seeking"] },
  { key: "evcil_yuva_veren", label: "Evcil Hayvan – Geçici Yuva Veren", short: "Yuva Veren", emoji: "🏠", types: ["offering"] },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  CategoryKey,
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

export function formatPrice(price: number | null | undefined, priceType: string): string {
  if (!price || priceType === "negotiable") return "Pazarlık";
  const n = new Intl.NumberFormat("tr-TR").format(Number(price));
  return `${n} ₺ / ${PRICE_TYPE_LABEL[priceType] ?? ""}`.trim();
}

export const TR_CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep",
  "Kayseri", "Mersin", "Eskişehir", "Diyarbakır", "Samsun", "Denizli", "Trabzon",
  "Kocaeli", "Sakarya", "Muğla", "Aydın", "Balıkesir", "Manisa", "Hatay", "Şanlıurfa",
  "Malatya", "Erzurum", "Van", "Elazığ", "Sivas", "Tekirdağ", "Ordu", "Afyonkarahisar",
  "Kütahya", "Çanakkale", "Rize", "Isparta", "Zonguldak", "Kırıkkale", "Uşak",
  "Aksaray", "Karaman", "Nevşehir", "Niğde", "Osmaniye", "Düzce", "Yalova", "Bolu",
  "Amasya", "Tokat", "Çorum", "Kastamonu", "Sinop", "Giresun", "Artvin", "Ardahan",
  "Iğdır", "Kars", "Ağrı", "Bitlis", "Muş", "Bingöl", "Tunceli", "Erzincan",
  "Bayburt", "Gümüşhane", "Kahramanmaraş", "Kilis", "Mardin", "Batman", "Siirt",
  "Şırnak", "Hakkari", "Adıyaman", "Bilecik", "Bartın", "Karabük", "Çankırı",
  "Kırşehir", "Kırklareli", "Edirne", "Burdur",
].sort((a, b) => a.localeCompare(b, "tr"));
