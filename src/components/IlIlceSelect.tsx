import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ILLER, getIlceler } from "@/lib/turkiye";
import { Label } from "@/components/ui/label";

type Props = {
  il: string;
  ilce: string;
  onIlChange: (v: string) => void;
  onIlceChange: (v: string) => void;
  ilLabel?: string;
  ilceLabel?: string;
  ilPlaceholder?: string;
  ilcePlaceholder?: string;
  allowAll?: boolean;
  required?: boolean;
  className?: string;
};

/**
 * İl seçilince ilçe listesi dinamik güncellenir. İl boşsa ilçe seçici disabled.
 * allowAll = true → filtre modu: "Tümü" seçenekleri gösterir.
 */
export function IlIlceSelect({
  il,
  ilce,
  onIlChange,
  onIlceChange,
  ilLabel = "İl",
  ilceLabel = "İlçe",
  ilPlaceholder = "İl seçin",
  ilcePlaceholder = "İlçe seçin",
  allowAll = false,
  required = false,
  className = "",
}: Props) {
  const ilceler = getIlceler(il);
  const ilValue = allowAll ? (il || "__all__") : il;
  const ilceValue = allowAll ? (ilce || "__all__") : ilce;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <div>
        <Label>{ilLabel}{required && " *"}</Label>
        <Select
          value={ilValue}
          onValueChange={(v) => {
            const next = v === "__all__" ? "" : v;
            onIlChange(next);
            onIlceChange("");
          }}
        >
          <SelectTrigger className="h-11 mt-1.5"><SelectValue placeholder={ilPlaceholder} /></SelectTrigger>
          <SelectContent className="max-h-72">
            {allowAll && <SelectItem value="__all__">Tüm İller</SelectItem>}
            {ILLER.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{ilceLabel}</Label>
        <Select
          value={ilceValue}
          onValueChange={(v) => onIlceChange(v === "__all__" ? "" : v)}
          disabled={!il}
        >
          <SelectTrigger className="h-11 mt-1.5">
            <SelectValue placeholder={il ? ilcePlaceholder : "Önce il seçin"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {allowAll && <SelectItem value="__all__">Tüm İlçeler</SelectItem>}
            {ilceler.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
