import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { adminBroadcastDM } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/yayin")({
  component: BroadcastPage,
  head: () => ({ meta: [{ title: "Toplu Mesaj — Yönetici" }] }),
});

function BroadcastPage() {
  const [body, setBody] = useState("");
  const [confirm, setConfirm] = useState(false);
  const fn = useServerFn(adminBroadcastDM);
  const send = useMutation({
    mutationFn: () => fn({ data: { body } }),
    onSuccess: (r) => { toast.success(`${r.count} kullanıcıya mesaj gönderildi`); setBody(""); setConfirm(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Tüm Kullanıcılara DM Gönder</h1>
      <p className="text-sm text-muted-foreground">
        Bu mesaj, sitedeki tüm kullanıcılara özel mesaj (DM) olarak gönderilir. Her kullanıcı kendi mesaj kutusunda görür ve size cevap verebilir.
      </p>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Send className="size-4" /> Mesaj</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mesajınızı yazın…" />
          {!confirm ? (
            <Button onClick={() => setConfirm(true)} disabled={!body.trim()} className="bg-brand hover:bg-brand/90">
              Devam Et
            </Button>
          ) : (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="size-4 mt-0.5 text-amber-600 shrink-0" />
                <span>Bu işlem geri alınamaz. Kaç yüz kullanıcı varsa hepsine mesaj iletilir. Emin misiniz?</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => send.mutate()} disabled={send.isPending} className="bg-red-600 hover:bg-red-700">
                  {send.isPending ? "Gönderiliyor…" : "Evet, Gönder"}
                </Button>
                <Button variant="outline" onClick={() => setConfirm(false)}>Vazgeç</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
