import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gizlilik")({
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Gizlilik Politikası</h1>
      <p className="leading-relaxed">
        Kişisel verileriniz KVKK kapsamında işlenir; yalnızca hizmetin sağlanması için gerekli
        bilgiler toplanır ve üçüncü taraflarla paylaşılmaz. Hesabınızı istediğiniz zaman silebilirsiniz.
      </p>
    </div>
  ),
  head: () => ({ meta: [{ title: "Gizlilik Politikası — hizmetalanı.com" }] }),
});
