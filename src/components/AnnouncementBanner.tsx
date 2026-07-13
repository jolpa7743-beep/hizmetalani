import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Info, CheckCircle2, AlertTriangle, XOctagon, X } from "lucide-react";
import { useEffect, useState } from "react";

type Ann = { id: string; title: string; body: string; variant: string };

const VARIANT_STYLE: Record<string, string> = {
  info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900",
  success: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-900",
  warning: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900",
  danger: "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-100 dark:border-red-900",
};

const ICONS: Record<string, typeof Info> = {
  info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XOctagon,
};

export function AnnouncementBanner() {
  const { data } = useQuery<Ann[]>({
    queryKey: ["public_announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, body, variant")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return (data ?? []) as Ann[];
    },
    staleTime: 60_000,
  });
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    try { setDismissed(JSON.parse(sessionStorage.getItem("ann_dismissed") ?? "[]")); } catch {}
  }, []);
  const visible = (data ?? []).filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;
  return (
    <div className="w-full">
      {visible.map((a) => {
        const Icon = ICONS[a.variant] ?? Info;
        return (
          <div key={a.id} className={`border-b px-4 py-2 text-sm ${VARIANT_STYLE[a.variant] ?? VARIANT_STYLE.info}`}>
            <div className="mx-auto max-w-7xl flex items-start gap-3">
              <Icon className="size-4 shrink-0 mt-0.5" aria-hidden />
              <div className="flex-1 min-w-0">
                <span className="font-semibold">{a.title}</span>{" "}
                <span>{a.body}</span>
              </div>
              <button
                aria-label="Duyuruyu kapat"
                onClick={() => {
                  const next = [...dismissed, a.id];
                  setDismissed(next);
                  sessionStorage.setItem("ann_dismissed", JSON.stringify(next));
                }}
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
