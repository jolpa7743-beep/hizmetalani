import { createFileRoute } from "@tanstack/react-router";

const TEXT =
  "Bu sitedeki hizmetleri kullanarak; ilanların doğruluğundan ilan sahibinin sorumlu olduğunu, " +
  "hizmetalanı.com'un yalnızca aracılık ettiğini, yasa dışı ilan yayınlanmayacağını ve tüm " +
  "iletişimin platform aracılığıyla yapılacağını kabul etmiş sayılırsınız.";

export const Route = createFileRoute("/kullanim-kosullari")({
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Kullanım Koşulları</h1>
      <p className="leading-relaxed">{TEXT}</p>
    </div>
  ),
  head: () => ({ meta: [{ title: "Kullanım Koşulları — hizmetalanı.com" }] }),
});
