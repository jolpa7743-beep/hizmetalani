import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/guvenlik")({
  component: Page,
  head: () => ({ meta: [{ title: "Güvenlik İpuçları — hizmetalanı.com" }] }),
});

function Page() {
  const tips = [
    "Görüşmeden önce asla ödeme yapmayın veya kapora göndermeyin.",
    "Kimlik, banka veya kart bilgilerinizi kimseyle paylaşmayın.",
    "Şüpheli ilan ve mesajları bildirin.",
    "İlk buluşmayı halka açık bir yerde yapın; mümkünse bir yakınınıza bilgi verin.",
    "Anlaşmaları yazılı olarak belgeleyin.",
    "Evcil hayvanınız için geçici yuva veriyorsanız aşı ve sağlık belgelerini görün.",
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="size-8 text-brand" />
        <h1 className="text-3xl font-bold">Güvenlik İpuçları</h1>
      </div>
      <p className="text-muted-foreground">hizmetalanı.com yalnızca bir ilan platformudur. İşlem güvenliğiniz için aşağıdaki maddelere dikkat edin.</p>
      <ul className="mt-6 space-y-3">
        {tips.map((t, i) => (
          <li key={i} className="border rounded-lg p-4 bg-surface flex gap-3">
            <span className="text-brand font-bold">{i + 1}.</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
