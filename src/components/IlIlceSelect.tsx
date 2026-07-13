import { useState } from "react";
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
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-11 mt-1.5 w-full justify-between font-normal"
        >
          <span className="inline-flex items-center gap-2 truncate">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
        <Command
          filter={(v, s) => v.toLocaleLowerCase("tr").includes(s.toLocaleLowerCase("tr")) ? 1 : 0}
        >
          <CommandInput placeholder="Ara..." className="h-10" />
          <CommandList className="max-h-72">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allText && (
                <CommandItem
                  value=""
                  onSelect={() => { onChange(""); setOpen(false); }}
                >
                  <Check className={cn("mr-2 size-4", !value ? "opacity-100" : "opacity-0")} />
                  {allText}
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem
                  key={o}
                  value={o}
                  onSelect={() => { onChange(o); setOpen(false); }}
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
