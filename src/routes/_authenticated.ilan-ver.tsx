import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, TR_CITIES, type CategoryKey, type ListingType } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

const schema = z.object({
  type: z.enum(["offering", "seeking"]),
  category: z.string().min(1, "Kategori seçin"),
  title: z.string().trim().min(3, "Başlık en az 3 karakter").max(120),
  description: z.string().trim().min(10, "Açıklama en az 10 karakter").max(5000),
  city: z.string().trim().min(1, "Şehir seçin"),
  district: z.string().trim().max(60).optional(),
  price: z.string().optional(),
  price_type: z.enum(["hourly", "daily", "monthly", "job", "negotiable"]),
});

export const Route = createFileRoute("/_authenticated/ilan-ver")({
  component: NewListing,
  head: () => ({ meta: [{ title: "Ücretsiz İlan Ver — hizmetalanı.com" }] }),
});

function NewListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "offering" as ListingType,
    category: "",
    title: "",
    description: "",
    city: "",
    district: "",
    price: "",
    price_type: "negotiable" as const,
  });

  const availableCategories = CATEGORIES.filter((c) => c.types.includes(form.type));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!user) return;

    setSaving(true);
    const priceNum = parsed.data.price ? Number(parsed.data.price.replace(/[^\d.]/g, "")) : null;
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

            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="ör. Kadıköy'de deneyimli çocuk bakıcısı"
                maxLength={120}
              />
              <div className="mt-1 text-xs text-muted-foreground text-right">{form.title.length}/120</div>
            </div>

            <div>
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deneyiminiz, çalışma günleriniz, beklentileriniz vb."
                rows={6}
                maxLength={5000}
              />
              <div className="mt-1 text-xs text-muted-foreground text-right">{form.description.length}/5000</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Şehir *</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Şehir seçin" /></SelectTrigger>
                  <SelectContent>
                    {TR_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="district">İlçe / Semt</Label>
                <Input
                  id="district"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="ör. Kadıköy"
                  maxLength={60}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Ücret (₺)</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Pazarlık için boş bırakın"
                  min={0}
                />
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
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/" })}>
                İptal
              </Button>
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
