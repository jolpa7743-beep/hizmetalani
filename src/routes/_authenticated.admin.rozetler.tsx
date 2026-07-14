import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getSiteSettings, updateSiteSettings } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TRUST_LEVELS, trustBadgeMeta } from "@/lib/trust";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/rozetler")({
  component: BadgeSettings,
});

const OPTIONS = [
  { value: "all", label: "Tüm rozetler görünsün", desc: "Doğrulanmış, Güvenilir ve Kurumsal seviyeleri herkese görünür." },
  { value: "verified_only", label: "Sadece üst seviye rozetler", desc: "Yalnızca Güvenilir ve Kurumsal rozetler gösterilir; Doğrulanmış rozeti gizlenir." },
  { value: "hidden", label: "Hiçbir rozet gösterilmesin", desc: "Tüm güven rozetleri site genelinde gizlenir." },
] as const;

function BadgeSettings() {
  const fetchSettings = useServerFn(getSiteSettings);
  const saveSettings = useServerFn(updateSiteSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => fetchSettings() });
  const [visibility, setVisibility] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.trust_badge_visibility) setVisibility(data.trust_badge_visibility);
  }, [data]);

  async function save() {
    setSaving(true);
    try {
      await saveSettings({ data: { trust_badge_visibility: visibility as "all" | "verified_only" | "hidden" } });
      toast.success("Kaydedildi");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings-public"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Rozet Ayarları</h1>
        <p className="text-sm text-muted-foreground">
          Güven rozeti seviyelerini ve site genelinde görünme kuralını yönetin.
        </p>
      </div>

      <div className="bg-card border rounded-xl p-5 shadow-[var(--shadow-soft)]">
        <h2 className="font-semibold mb-3">Rozet Seviyeleri</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Kullanıcı bazlı seviyeyi <strong>Kullanıcılar</strong> sekmesinden ayarlayabilirsiniz.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TRUST_LEVELS.filter((t) => t.level > 0).map((t) => {
            const meta = trustBadgeMeta(t.level);
            return (
              <div key={t.level} className="flex items-center gap-3 border rounded-lg p-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${meta.className}`}>
                  <meta.icon className="size-3.5" /> {meta.label}
                </span>
                <span className="text-xs text-muted-foreground">Seviye {t.level}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5 shadow-[var(--shadow-soft)] space-y-4">
        <div>
          <h2 className="font-semibold">Rozet Görünme Kuralı</h2>
          <p className="text-sm text-muted-foreground">Rozetlerin site genelinde nasıl görüneceğini belirleyin.</p>
        </div>
        <RadioGroup value={visibility} onValueChange={setVisibility} className="space-y-2">
          {OPTIONS.map((o) => (
            <Label key={o.value} className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/40">
              <RadioGroupItem value={o.value} className="mt-1" />
              <div>
                <div className="font-medium text-sm">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.desc}</div>
              </div>
            </Label>
          ))}
        </RadioGroup>
        <Button onClick={save} disabled={saving} className="bg-brand hover:bg-brand/90">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
