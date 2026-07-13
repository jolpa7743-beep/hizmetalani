import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Users, MessageSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/nasil-calisir")({
  component: Page,
  head: () => ({ meta: [{ title: "Nasıl Çalışır — hizmetalanı.com" }] }),
});

function Page() {
  const steps = [
    { icon: Users, title: "Ücretsiz Üye Ol", desc: "E-posta veya Google ile 30 saniyede hesap oluştur." },
    { icon: Sparkles, title: "İlan Ver veya Ara", desc: "Bakıcı, temizlik veya evcil hayvan geçici yuva ilanı yayınla ya da arayanları bul." },
    { icon: MessageSquare, title: "Güvenli Mesajlaş", desc: "Platform içi mesajlaşma ile ilan sahibiyle iletişime geç." },
    { icon: ShieldCheck, title: "Anlaş & Başla", desc: "Detayları netleştir, buluş ve hizmete başla." },
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-center">Nasıl Çalışır?</h1>
      <p className="text-center text-muted-foreground mt-2">hizmetalanı.com'da 4 adımda güvenle ilan verin ya da hizmet bulun.</p>
      <div className="mt-10 grid md:grid-cols-2 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="border rounded-xl p-6 bg-surface">
            <div className="size-11 rounded-lg bg-brand/10 text-brand grid place-items-center mb-3">
              <s.icon className="size-5" />
            </div>
            <div className="font-semibold">{i + 1}. {s.title}</div>
            <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
