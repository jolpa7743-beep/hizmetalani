import { BadgeCheck, ShieldCheck, Building2, Award } from "lucide-react";

export const TRUST_LEVELS = [
  { level: 0, label: "Yok", short: "—" },
  { level: 1, label: "Doğrulanmış", short: "Doğrulanmış" },
  { level: 2, label: "Güvenilir Üye", short: "Güvenilir" },
  { level: 3, label: "Kurumsal", short: "Kurumsal" },
] as const;

export type BadgeVisibility = "all" | "verified_only" | "hidden";

/** Should a badge of this level be displayed under the current rule? */
export function shouldShowBadge(level: number, visibility: BadgeVisibility): boolean {
  if (visibility === "hidden") return false;
  if (level < 1) return false;
  if (visibility === "verified_only") return level >= 2;
  return true;
}

export function trustBadgeMeta(level: number) {
  switch (level) {
    case 3: return { label: "Kurumsal", icon: Building2, className: "bg-blue-600 text-white" };
    case 2: return { label: "Güvenilir Üye", icon: Award, className: "bg-emerald-600 text-white" };
    case 1: return { label: "Doğrulanmış", icon: ShieldCheck, className: "bg-brand text-brand-foreground" };
    default: return { label: "", icon: BadgeCheck, className: "" };
  }
}
