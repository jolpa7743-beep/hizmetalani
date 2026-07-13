import data from "@/data/turkiye.json";

export type IlIlce = { il: string; ilceler: string[] };

export const TURKIYE: IlIlce[] = data as IlIlce[];

export const ILLER: string[] = TURKIYE.map((x) => x.il).sort((a, b) =>
  a.localeCompare(b, "tr"),
);

export function getIlceler(il: string | null | undefined): string[] {
  if (!il) return [];
  const row = TURKIYE.find((x) => x.il.toLocaleLowerCase("tr") === il.toLocaleLowerCase("tr"));
  return row ? [...row.ilceler].sort((a, b) => a.localeCompare(b, "tr")) : [];
}

export function isValidIl(il: string | null | undefined): boolean {
  if (!il) return false;
  return TURKIYE.some((x) => x.il.toLocaleLowerCase("tr") === il.toLocaleLowerCase("tr"));
}

export function isValidIlce(il: string, ilce: string): boolean {
  return getIlceler(il).some((x) => x.toLocaleLowerCase("tr") === ilce.toLocaleLowerCase("tr"));
}

export function searchIl(q: string, limit = 20): string[] {
  const s = q.trim().toLocaleLowerCase("tr");
  if (!s) return ILLER.slice(0, limit);
  return ILLER.filter((x) => x.toLocaleLowerCase("tr").includes(s)).slice(0, limit);
}
