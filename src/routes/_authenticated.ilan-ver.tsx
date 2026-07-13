import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, type CategoryKey, type ListingType } from "@/lib/categories";
import { IlIlceSelect } from "@/components/IlIlceSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, X, Plus } from "lucide-react";

const schema = z
  .object({
    type: z.enum(["offering", "seeking"], { errorMap: () => ({ message: "İlan tipini seçin" }) }),
    category: z.string().min(1, "Kategori seçin"),
    title: z
      .string()
      .trim()
      .min(3, "Başlık en az 3 karakter olmalı")
      .max(120, "Başlık en fazla 120 karakter olabilir"),
    description: z
      .string()
      .trim()
      .min(10, "Açıklama en az 10 karakter olmalı")
      .max(5000, "Açıklama en fazla 5000 karakter olabilir"),
    city: z.string().trim().min(1, "İl seçin"),
    district: z.string().trim().max(60).optional().or(z.literal("")),
    price: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), "Ücret sadece rakam olmalı"),
    price_type: z.enum(["hourly", "daily", "monthly", "job", "negotiable"]),
    salary_min: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+$/.test(v), "Maaş sadece rakam olmalı"),
    salary_max: z
      .string()
      .optional()
      .refine((v) => !v || /^\d+$/.test(v), "Maaş sadece rakam olmalı"),
    experience_years: z
      .string()
      .optional()
      .refine((v) => !v || (/^\d+$/.test(v) && +v <= 60), "0-60 yıl arası olmalı"),
    hours_start: z.string().optional(),
    hours_end: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.salary_min && v.salary_max && Number(v.salary_max) < Number(v.salary_min)) {
      ctx.addIssue({
        code: "custom",
        path: ["salary_max"],
        message: "Maks. maaş, min. maaştan küçük olamaz",
      });
    }
    if (v.hours_start && v.hours_end && v.hours_end <= v.hours_start) {
      ctx.addIssue({
        code: "custom",
        path: ["hours_end"],
        message: "Bitiş saati başlangıçtan sonra olmalı",
      });
    }
  });

type FieldErrors = Partial<Record<string, string>>;

export const Route = createFileRoute("/_authenticated/ilan-ver")({
  component: NewListing,
  head: () => ({ meta: [{ title: "Ücretsiz İlan Ver — hizmetalanı.com" }] }),
});

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const WORK_TYPES = [
  { v: "full_time", l: "Tam Zamanlı" },
  { v: "part_time", l: "Yarı Zamanlı" },
  { v: "contract", l: "Sözleşmeli" },
  { v: "freelance", l: "Serbest / Freelance" },
  { v: "internship", l: "Staj" },
  { v: "seasonal", l: "Sezonluk" },
  { v: "one_time", l: "Tek Seferlik" },
];
const EDUCATION = [
  { v: "none", l: "Fark etmez" },
  { v: "primary", l: "İlköğretim" },
  { v: "high_school", l: "Lise" },
  { v: "associate", l: "Ön Lisans" },
  { v: "bachelor", l: "Lisans" },
  { v: "master", l: "Yüksek Lisans" },
  { v: "phd", l: "Doktora" },
];

function NewListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const setField = <K extends string>(k: K, v: unknown) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const [form, setForm] = useState({
    type: "offering" as ListingType,
    category: "",
    title: "",
    description: "",
    city: "",
    district: "",
    price: "",
    price_type: "negotiable" as const,
    // Yeni dinamik alanlar
    work_type: "" as string,
    available_days: [] as string[],
    off_days: [] as string[],
    hours_start: "",
    hours_end: "",
    salary_min: "",
    salary_max: "",
    salary_period: "monthly" as "hourly" | "daily" | "monthly" | "job",
    experience_years: "",
    education_level: "none",
    requirements: [] as string[],
    benefits: [] as string[],
    is_remote: false,
    is_urgent: false,
    req_input: "",
    ben_input: "",
  });

  const availableCategories = CATEGORIES.filter((c) => c.types.includes(form.type));

  // Gün durum döngüsü: boş → çalışma (mavi) → izinli (yeşil) → boş
  const dayState = (d: string): "work" | "off" | "none" => {
    if (form.available_days.includes(d)) return "work";
    if (form.off_days.includes(d)) return "off";
    return "none";
  };
  const cycleDay = (d: string) => {
    setForm((f) => {
      const isWork = f.available_days.includes(d);
      const isOff = f.off_days.includes(d);
      if (!isWork && !isOff) {
        return { ...f, available_days: [...f.available_days, d] };
      }
      if (isWork) {
        return {
          ...f,
          available_days: f.available_days.filter((x) => x !== d),
          off_days: [...f.off_days, d],
        };
      }
      return { ...f, off_days: f.off_days.filter((x) => x !== d) };
    });
  };

  const addTag = (key: "requirements" | "benefits", value: string, inputKey: "req_input" | "ben_input") => {
    const v = value.trim();
    if (!v) return;
    setForm((f) => ({ ...f, [key]: [...(f[key] as string[]), v], [inputKey]: "" }));
  };
  const removeTag = (key: "requirements" | "benefits", i: number) => {
    setForm((f) => ({ ...f, [key]: (f[key] as string[]).filter((_, idx) => idx !== i) }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const iss of parsed.error.issues) {
        const key = String(iss.path[0] ?? "form");
        if (!fe[key]) fe[key] = iss.message;
      }
      setErrors(fe);
      toast.error("Lütfen zorunlu alanları doldurun");
      // ilk hatalı alana kaydır
      const firstKey = Object.keys(fe)[0];
      const el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    if (!user) return;

    setSaving(true);
    const priceNum = parsed.data.price ? Number(parsed.data.price.replace(/[^\d.]/g, "")) : null;
    const salaryMin = form.salary_min ? Number(form.salary_min) : null;
    const salaryMax = form.salary_max ? Number(form.salary_max) : null;
    const expY = form.experience_years ? Number(form.experience_years) : null;
    const hours =
      form.hours_start || form.hours_end
        ? { start: form.hours_start || null, end: form.hours_end || null }
        : null;

    const { data, error } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        type: parsed.data.type,
        category: parsed.data.category as CategoryKey,
        title: parsed.data.title,
        description: parsed.data.description,
        city: parsed.data.city,
        district: parsed.data.district || null,
        price: priceNum,
        price_type: parsed.data.price_type,
        work_type: form.work_type || null,
        available_days: form.available_days.length ? form.available_days : null,
        off_days: form.off_days.length ? form.off_days : null,
        available_hours: hours,
        salary_min: salaryMin,
        salary_max: salaryMax,
        salary_period: form.salary_period,
        experience_years: expY,
        education_level: form.education_level === "none" ? null : form.education_level,
        requirements: form.requirements.length ? form.requirements : null,
        benefits: form.benefits.length ? form.benefits : null,
        is_remote: form.is_remote,
        is_urgent: form.is_urgent,
      })
      .select("id")
      .single();
    setSaving(false);

    if (error) return toast.error("İlan oluşturulamadı: " + error.message);
    toast.success("İlanınız yayınlandı!");
    navigate({ to: "/ilan/$id", params: { id: data.id } });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ücretsiz İlan Ver</CardTitle>
          <p className="text-sm text-muted-foreground">Doğru ve net bilgiler ilanınızın daha çok görüntülenmesini sağlar.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label>İlan Tipi</Label>
              <RadioGroup
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as ListingType, category: "" })}
                className="grid grid-cols-2 gap-3 mt-2"
              >
                <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${form.type === "offering" ? "border-brand bg-brand/5" : "border-border"}`}>
                  <RadioGroupItem value="offering" className="sr-only" />
                  <div className="font-medium">Hizmet Veriyorum</div>
                  <div className="text-xs text-muted-foreground">İş arayan / hizmet sunan</div>
                </label>
                <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${form.type === "seeking" ? "border-brand bg-brand/5" : "border-border"}`}>
                  <RadioGroupItem value="seeking" className="sr-only" />
                  <div className="font-medium">Hizmet Arıyorum</div>
                  <div className="text-xs text-muted-foreground">İş veren / hizmet talep eden</div>
                </label>
              </RadioGroup>
            </div>

            <div data-field="category">
              <Label htmlFor="category">Kategori *</Label>
              <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError msg={errors.category} />
            </div>

            <div data-field="title">
              <Label htmlFor="title">Başlık *</Label>
              <Input id="title" value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="ör. Kadıköy'de deneyimli çocuk bakıcısı" maxLength={120}
                className={errors.title ? "border-destructive" : ""}
                aria-invalid={!!errors.title} />
              <div className="mt-1 flex justify-between text-xs">
                <FieldError msg={errors.title} />
                <span className="text-muted-foreground ml-auto">{form.title.length}/120</span>
              </div>
            </div>

            <div data-field="description">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea id="description" value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Deneyiminiz, çalışma günleriniz, beklentileriniz vb." rows={6} maxLength={5000}
                className={errors.description ? "border-destructive" : ""}
                aria-invalid={!!errors.description} />
              <div className="mt-1 flex justify-between text-xs">
                <FieldError msg={errors.description} />
                <span className="text-muted-foreground ml-auto">{form.description.length}/5000</span>
              </div>
            </div>

            <div data-field="city">
              <IlIlceSelect
                il={form.city}
                ilce={form.district}
                onIlChange={(v) => setField("city", v)}
                onIlceChange={(v) => setField("district", v)}
                ilLabel="İl *"
                required
              />
              <FieldError msg={errors.city} />
            </div>

            {/* Çalışma Tipi + Uzaktan / Acil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Çalışma Tipi</Label>
                <Select value={form.work_type} onValueChange={(v) => setForm({ ...form, work_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((w) => <SelectItem key={w.v} value={w.v}>{w.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-6 pb-1">
                <div className="flex items-center gap-2">
                  <Switch id="rem" checked={form.is_remote} onCheckedChange={(v) => setForm({ ...form, is_remote: v })} />
                  <Label htmlFor="rem">Uzaktan çalışılabilir</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="urg" checked={form.is_urgent} onCheckedChange={(v) => setForm({ ...form, is_urgent: v })} />
                  <Label htmlFor="urg">Acil</Label>
                </div>
              </div>
            </div>

            {/* Çalışma / İzin Günleri */}
            <div>
              <Label>Çalışma ve İzin Günleri</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Bir güne tıklayın: 1. tık <span className="text-brand font-medium">mavi = çalışma günü</span>, 2. tık <span className="text-emerald-600 font-medium">yeşil = izinli gün</span>, 3. tık boşaltır.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((d) => {
                  const s = dayState(d);
                  const cls =
                    s === "work"
                      ? "bg-brand text-brand-foreground border-brand"
                      : s === "off"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "border-border hover:bg-muted";
                  return (
                    <button type="button" key={d} onClick={() => cycleDay(d)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${cls}`}
                      aria-label={`${d} - ${s === "work" ? "çalışma günü" : s === "off" ? "izinli" : "seçili değil"}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand" /> Çalışma günü</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-emerald-500" /> İzinli gün</span>
              </div>
            </div>

            {/* Saatler */}
            <div className="grid grid-cols-2 gap-4">
              <div data-field="hours_start">
                <Label htmlFor="hs">Saat (Başlangıç)</Label>
                <Input id="hs" type="time" value={form.hours_start}
                  onChange={(e) => setField("hours_start", e.target.value)}
                  className={errors.hours_start ? "border-destructive" : ""} />
                <FieldError msg={errors.hours_start} />
              </div>
              <div data-field="hours_end">
                <Label htmlFor="he">Saat (Bitiş)</Label>
                <Input id="he" type="time" value={form.hours_end}
                  onChange={(e) => setField("hours_end", e.target.value)}
                  className={errors.hours_end ? "border-destructive" : ""} />
                <FieldError msg={errors.hours_end} />
              </div>
            </div>

            {/* Maaş aralığı */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div data-field="salary_min">
                <Label>Maaş Min (₺)</Label>
                <Input type="number" min={0} value={form.salary_min}
                  onChange={(e) => setField("salary_min", e.target.value)} placeholder="ör. 15000"
                  className={errors.salary_min ? "border-destructive" : ""} />
                <FieldError msg={errors.salary_min} />
              </div>
              <div data-field="salary_max">
                <Label>Maaş Max (₺)</Label>
                <Input type="number" min={0} value={form.salary_max}
                  onChange={(e) => setField("salary_max", e.target.value)} placeholder="ör. 25000"
                  className={errors.salary_max ? "border-destructive" : ""} />
                <FieldError msg={errors.salary_max} />
              </div>
              <div>
                <Label>Maaş Periyodu</Label>
                <Select value={form.salary_period} onValueChange={(v) => setForm({ ...form, salary_period: v as typeof form.salary_period })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Saatlik</SelectItem>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="monthly">Aylık</SelectItem>
                    <SelectItem value="job">İş Başı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Deneyim + Eğitim */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div data-field="experience_years">
                <Label>Deneyim (Yıl)</Label>
                <Input type="number" min={0} max={60} value={form.experience_years}
                  onChange={(e) => setField("experience_years", e.target.value)} placeholder="ör. 3"
                  className={errors.experience_years ? "border-destructive" : ""} />
                <FieldError msg={errors.experience_years} />
              </div>
              <div>
                <Label>Eğitim Seviyesi</Label>
                <Select value={form.education_level} onValueChange={(v) => setForm({ ...form, education_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EDUCATION.map((e) => <SelectItem key={e.v} value={e.v}>{e.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Şartlar */}
            <div>
              <Label>Şartlar / Aranan Nitelikler</Label>
              <div className="mt-1.5 flex gap-2">
                <Input value={form.req_input}
                  onChange={(e) => setForm({ ...form, req_input: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("requirements", form.req_input, "req_input"); } }}
                  placeholder="ör. Referans mektubu / Ehliyet / Sigara içmeyen" />
                <Button type="button" variant="outline" onClick={() => addTag("requirements", form.req_input, "req_input")}>
                  <Plus className="size-4" />
                </Button>
              </div>
              {form.requirements.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.requirements.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm">
                      {r}
                      <button type="button" onClick={() => removeTag("requirements", i)} aria-label="Kaldır"><X className="size-3.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Yan Haklar */}
            <div>
              <Label>Yan Haklar</Label>
              <div className="mt-1.5 flex gap-2">
                <Input value={form.ben_input}
                  onChange={(e) => setForm({ ...form, ben_input: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("benefits", form.ben_input, "ben_input"); } }}
                  placeholder="ör. Yemek / Servis / Konaklama / Prim" />
                <Button type="button" variant="outline" onClick={() => addTag("benefits", form.ben_input, "ben_input")}>
                  <Plus className="size-4" />
                </Button>
              </div>
              {form.benefits.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.benefits.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm">
                      {r}
                      <button type="button" onClick={() => removeTag("benefits", i)} aria-label="Kaldır"><X className="size-3.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Klasik ücret */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Sabit Ücret (₺)</Label>
                <Input id="price" type="number" inputMode="decimal" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Pazarlık için boş bırakın" min={0} />
              </div>
              <div>
                <Label>Ücret Türü</Label>
                <Select value={form.price_type} onValueChange={(v) => setForm({ ...form, price_type: v as typeof form.price_type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Saatlik</SelectItem>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="monthly">Aylık</SelectItem>
                    <SelectItem value="job">İş Başı</SelectItem>
                    <SelectItem value="negotiable">Pazarlık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/" })}>İptal</Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-brand hover:bg-brand/90 h-11">
                {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                İlanı Yayınla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-destructive font-medium">{msg}</p>;
}
