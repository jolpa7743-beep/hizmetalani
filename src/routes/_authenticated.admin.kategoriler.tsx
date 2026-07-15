import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layers, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getCategoryConfig,
  adminUpsertGroup,
  adminDeleteGroup,
  adminUpsertOverride,
  type CategoryConfig,
} from "@/lib/categories.functions";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/admin/kategoriler")({
  component: AdminCategories,
  head: () => ({ meta: [{ title: "Kategoriler — Yönetici" }] }),
});

function AdminCategories() {
  const qc = useQueryClient();
  const fetchCfg = useServerFn(getCategoryConfig);
  const upsertGroupFn = useServerFn(adminUpsertGroup);
  const deleteGroupFn = useServerFn(adminDeleteGroup);
  const upsertOverrideFn = useServerFn(adminUpsertOverride);

  const { data, isLoading } = useQuery<CategoryConfig>({
    queryKey: ["category-config"],
    queryFn: () => fetchCfg(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["category-config"] });
  };

  const saveGroup = useMutation({
    mutationFn: (v: Parameters<typeof upsertGroupFn>[0]["data"]) => upsertGroupFn({ data: v }),
    onSuccess: () => { toast.success("Ana kategori kaydedildi"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeGroup = useMutation({
    mutationFn: (id: number) => deleteGroupFn({ data: { id } }),
    onSuccess: () => { toast.success("Silindi"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveOverride = useMutation({
    mutationFn: (v: Parameters<typeof upsertOverrideFn>[0]["data"]) => upsertOverrideFn({ data: v }),
    onSuccess: () => { toast.success("Alt kategori kaydedildi"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Yükleniyor…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="size-5" /> Kategoriler</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ana kategorileri (gruplar) oluştur ve alt kategorileri bu gruplara ata, sırasını ve görünürlüğünü ayarla.
        </p>
      </header>

      {/* Ana kategoriler */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Ana Kategoriler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.groups.map((g) => (
            <GroupRow
              key={g.id}
              initial={g}
              onSave={(v) => saveGroup.mutate({ ...v, id: g.id })}
              onDelete={() => {
                if (confirm(`"${g.label}" ana kategorisini silmek istediğinize emin misiniz? Alt kategoriler bağımsız kalır.`)) {
                  removeGroup.mutate(g.id);
                }
              }}
              saving={saveGroup.isPending}
            />
          ))}
          <GroupRow
            initial={{ key: "", label: "", sort_order: (data.groups.at(-1)?.sort_order ?? 0) + 10, visible: true }}
            onSave={(v) => saveGroup.mutate(v)}
            isNew
            saving={saveGroup.isPending}
          />
        </CardContent>
      </Card>

      {/* Alt kategoriler */}
      <Card>
        <CardHeader><CardTitle>Alt Kategoriler</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {CATEGORIES.map((c) => {
            const ov = data.overrides.find((o) => o.key === c.key);
            return (
              <OverrideRow
                key={c.key}
                catKey={c.key}
                defaultLabel={c.label}
                defaultShort={c.short}
                initial={{
                  key: c.key,
                  label: ov?.label ?? "",
                  short_label: ov?.short_label ?? "",
                  group_key: ov?.group_key ?? null,
                  sort_order: ov?.sort_order ?? 0,
                  visible: ov?.visible ?? true,
                }}
                groups={data.groups}
                onSave={(v) => saveOverride.mutate(v)}
                saving={saveOverride.isPending}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function GroupRow({
  initial, onSave, onDelete, isNew, saving,
}: {
  initial: { id?: number; key: string; label: string; sort_order: number; visible: boolean };
  onSave: (v: { key: string; label: string; sort_order: number; visible: boolean }) => void;
  onDelete?: () => void;
  isNew?: boolean;
  saving?: boolean;
}) {
  const [key, setKey] = useState(initial.key);
  const [label, setLabel] = useState(initial.label);
  const [order, setOrder] = useState(initial.sort_order);
  const [visible, setVisible] = useState(initial.visible);

  useEffect(() => { setKey(initial.key); setLabel(initial.label); setOrder(initial.sort_order); setVisible(initial.visible); }, [initial.key, initial.label, initial.sort_order, initial.visible]);

  return (
    <div className="grid gap-3 md:grid-cols-[160px_1fr_100px_120px_auto] items-end border rounded-lg p-3">
      <div>
        <Label className="text-xs">Anahtar (key)</Label>
        <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="ör: bakim" />
      </div>
      <div>
        <Label className="text-xs">Görünen ad</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ör: Bakım Hizmetleri" />
      </div>
      <div>
        <Label className="text-xs">Sıra</Label>
        <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={visible} onCheckedChange={setVisible} />
        <span className="text-xs">Görünür</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ key: key.trim(), label: label.trim(), sort_order: order, visible })} disabled={saving || !key.trim() || !label.trim()}>
          {isNew ? <Plus className="size-4 mr-1" /> : <Save className="size-4 mr-1" />}
          {isNew ? "Ekle" : "Kaydet"}
        </Button>
        {onDelete && (
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function OverrideRow({
  catKey, defaultLabel, defaultShort, initial, groups, onSave, saving,
}: {
  catKey: string;
  defaultLabel: string;
  defaultShort: string;
  initial: { key: string; label: string; short_label: string; group_key: string | null; sort_order: number; visible: boolean };
  groups: { key: string; label: string }[];
  onSave: (v: { key: string; label: string | null; short_label: string | null; group_key: string | null; sort_order: number; visible: boolean }) => void;
  saving?: boolean;
}) {
  const [label, setLabel] = useState(initial.label);
  const [short, setShort] = useState(initial.short_label);
  const [groupKey, setGroupKey] = useState<string>(initial.group_key ?? "__none__");
  const [order, setOrder] = useState(initial.sort_order);
  const [visible, setVisible] = useState(initial.visible);

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_90px_110px_auto] items-end border rounded-lg p-3 bg-muted/20">
      <div>
        <Label className="text-xs">Uzun ad <span className="text-muted-foreground">(varsayılan: {defaultLabel})</span></Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={defaultLabel} />
      </div>
      <div>
        <Label className="text-xs">Kısa ad <span className="text-muted-foreground">(varsayılan: {defaultShort})</span></Label>
        <Input value={short} onChange={(e) => setShort(e.target.value)} placeholder={defaultShort} />
      </div>
      <div>
        <Label className="text-xs">Ana kategori</Label>
        <Select value={groupKey} onValueChange={setGroupKey}>
          <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Yok —</SelectItem>
            {groups.map((g) => <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Sıra</Label>
        <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={visible} onCheckedChange={setVisible} />
        <span className="text-xs">Görünür</span>
      </div>
      <div>
        <Button
          size="sm"
          disabled={saving}
          onClick={() => onSave({
            key: catKey,
            label: label.trim() ? label.trim() : null,
            short_label: short.trim() ? short.trim() : null,
            group_key: groupKey === "__none__" ? null : groupKey,
            sort_order: order,
            visible,
          })}
        >
          <Save className="size-4 mr-1" /> Kaydet
        </Button>
      </div>
    </div>
  );
}
