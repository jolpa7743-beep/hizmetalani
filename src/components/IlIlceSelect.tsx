import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ILLER, getIlceler } from "@/lib/turkiye";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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

// Türkçe karakterleri normalize et — "İstanbul" araması "istanbul" ile eşleşsin
const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");

const ALL_TOKEN = "__all__";

function Combo({
  value,
  onChange,
  options,
  placeholder,
  emptyText,
  disabled,
  allText,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  emptyText: string;
  disabled?: boolean;
  allText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return options;
    return options.filter((o) => norm(o).includes(q));
  }, [options, query]);

  // Açılışta seçili öğeyi görünür kıl
  useEffect(() => {
    if (!open || !value) return;
    const t = window.setTimeout(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }, 30);
    return () => window.clearTimeout(t);
  }, [open, value]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-11 mt-1.5 w-full justify-between font-normal"
        >
          <span className="inline-flex items-center gap-2 truncate min-w-0">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 z-[60] bg-popover pointer-events-auto"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          // input auto-focus tamam, ancak scroll'a müdahale etme
          void e;
        }}
      >
        {/* Command'a value verirsek açılışta doğru öğe aktif olur */}
        <Command shouldFilter={false} value={value || ALL_TOKEN}>
          <CommandInput
            placeholder="Ara..."
            className="h-10"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList ref={listRef} className="max-h-72 overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allText && !query && (
                <CommandItem
                  value={ALL_TOKEN}
                  data-value={ALL_TOKEN}
                  onSelect={() => { onChange(""); setOpen(false); setQuery(""); }}
                >
                  <Check className={cn("mr-2 size-4", !value ? "opacity-100" : "opacity-0")} />
                  {allText}
                </CommandItem>
              )}
              {filtered.map((o) => (
                <CommandItem
                  key={o}
                  value={o}
                  data-value={o}
                  onSelect={() => { onChange(o); setOpen(false); setQuery(""); }}
                  className={cn(value === o && "bg-accent/60 font-medium")}
                >
                  <Check className={cn("mr-2 size-4", value === o ? "opacity-100" : "opacity-0")} />
                  {o}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <div>
        <Label>{ilLabel}{required && " *"}</Label>
        <Combo
          value={il}
          onChange={(v) => { onIlChange(v); onIlceChange(""); }}
          options={ILLER}
          placeholder={ilPlaceholder}
          emptyText="İl bulunamadı"
          allText={allowAll ? "Tüm İller" : undefined}
        />
      </div>
      <div>
        <Label>{ilceLabel}</Label>
        <Combo
          value={ilce}
          onChange={onIlceChange}
          options={ilceler}
          placeholder={il ? ilcePlaceholder : "Önce il seçin"}
          emptyText="İlçe bulunamadı"
          disabled={!il}
          allText={allowAll ? "Tüm İlçeler" : undefined}
        />
      </div>
    </div>
  );
}
