import type { Metadata } from "next";
import Link from "next/link";
import {
  ENVIO_CENTAVOS,
  ENVIO_GRATIS_DESDE_CENTAVOS,
} from "@/lib/formato";
import { getT, resolverLocale, LOCALES, type Locale } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/faq">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  return {
    title: t("faq.titulo"),
    description: t("faq.intro"),
    alternates: alternatesDeRuta(loc, "/faq"),
  };
}

const ENVIO = (ENVIO_CENTAVOS / 100).toFixed(0);
const GRATIS = (ENVIO_GRATIS_DESDE_CENTAVOS / 100).toFixed(0);

// Preguntas frecuentes bilingües. La misma fuente alimenta la lista visible y el
// JSON-LD (FAQPage). Desde 2023 Google reserva el rich result de FAQ a webs de
// gobierno/salud, así que un comercio no verá el fragmento; aun así el markup es
// válido y lo aprovechan otros buscadores y asistentes. Respuestas en texto
// plano (sin enlaces) para que el schema sea válido.
const PREGUNTAS: { q: Record<Locale, string>; a: Record<Locale, string> }[] = [
  {
    q: { es: "¿Cuánto cuesta el envío?", en: "How much is shipping?" },
    a: {
      es: `El envío a todo Estados Unidos cuesta $${ENVIO} y es gratis en pedidos de $${GRATIS} o más (calculado tras el descuento de rutina).`,
      en: `Shipping across the United States is $${ENVIO}, and free on orders of $${GRATIS} or more (calculated after the routine discount).`,
    },
  },
  {
    q: { es: "¿Los productos son TRUSS originales?", en: "Are the products genuine TRUSS?" },
    a: {
      es: "Sí. Somos distribuidor autorizado de TRUSS y todos los productos son originales, de línea profesional.",
      en: "Yes. We are an authorized TRUSS distributor and every product is genuine, professional-line.",
    },
  },
  {
    q: { es: "¿Cómo elijo los productos para mi cabello?", en: "How do I choose products for my hair?" },
    a: {
      es: "Haz nuestro diagnóstico capilar: en pocas preguntas te recomendamos una rutina a tu medida. También puedes filtrar la tienda por línea, etapa y categoría.",
      en: "Take our hair diagnosis: in a few questions we recommend a routine tailored to you. You can also filter the shop by line, stage and category.",
    },
  },
  {
    q: { es: "¿Cómo pago? ¿Es seguro?", en: "How do I pay? Is it secure?" },
    a: {
      es: "El pago se procesa con Stripe, con tarjeta. Nosotros no vemos ni guardamos los datos de tu tarjeta.",
      en: "Payment is processed by Stripe, by card. We never see or store your card details.",
    },
  },
  {
    q: { es: "¿Puedo devolver un producto?", en: "Can I return a product?" },
    a: {
      es: "Sí, dentro de los 30 días. Escríbenos a admin@cloudbeautysalon.com y te indicamos cómo. Consulta los detalles en nuestra política de envíos y devoluciones.",
      en: "Yes, within 30 days. Write to admin@cloudbeautysalon.com and we'll tell you how. See the details in our shipping and returns policy.",
    },
  },
  {
    q: { es: "¿Hacen envíos fuera de Estados Unidos?", en: "Do you ship outside the United States?" },
    a: {
      es: "Por ahora solo enviamos dentro de Estados Unidos.",
      en: "For now we ship within the United States only.",
    },
  },
  {
    q: { es: "¿Tienen un salón físico?", en: "Do you have a physical salon?" },
    a: {
      es: "Somos una tienda en línea de productos capilares profesionales TRUSS, con sede en Miami. El salón de belleza abre pronto.",
      en: "We're an online store for professional TRUSS hair-care products, based in Miami. The beauty salon opens soon.",
    },
  },
];

export default async function PaginaFaq(props: PageProps<"/[locale]/faq">) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PREGUNTAS.map((p) => ({
      "@type": "Question",
      name: p.q[loc],
      acceptedAnswer: { "@type": "Answer", text: p.a[loc] },
    })),
  };

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <h1 className="font-display text-3xl sm:text-4xl">{t("faq.titulo")}</h1>
      <p className="mt-3 text-tinta-suave">{t("faq.intro")}</p>

      <dl className="mt-10 divide-y divide-tinta-suave/15">
        {PREGUNTAS.map((p) => (
          <div key={p.q.es} className="py-5">
            <dt className="font-display text-lg">{p.q[loc]}</dt>
            <dd className="mt-2 leading-relaxed text-tinta-suave">{p.a[loc]}</dd>
          </div>
        ))}
      </dl>

      <Link
        href={rutaLocalizada(loc, "/contacto")}
        className="mt-10 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("faq.masPreguntas")}
      </Link>
    </main>
  );
}
