import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cerez-politikasi")({
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Çerez Politikası</h1>
      <p className="leading-relaxed">
        Sitemiz oturum yönetimi ve deneyimi iyileştirmek amacıyla zorunlu çerezler kullanır.
        Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.
      </p>
    </div>
  ),
  head: () => ({ meta: [{ title: "Çerez Politikası — hizmetalanı.com" }] }),
});
