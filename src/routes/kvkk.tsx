import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/kvkk")({
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">KVKK Aydınlatma Metni</h1>
      <p className="leading-relaxed">
        6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; ad, soyad, e-posta, telefon ve
        konum bilgileriniz hizmetin sağlanması ve iletişimin kurulması amacıyla işlenir.
      </p>
    </div>
  ),
  head: () => ({ meta: [{ title: "KVKK — hizmetalanı.com" }] }),
});
