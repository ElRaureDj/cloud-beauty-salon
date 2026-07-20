import type { Metadata } from "next";
import Link from "next/link";
import { getT, resolverLocale, LOCALES } from "@/lib/i18n";
import { alternatesDeRuta, rutaLocalizada } from "@/lib/i18n/rutas";

type Ruta = (path: string) => string;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/nosotros">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  return {
    title: loc === "en" ? "About us" : "Nosotros",
    description: t("copy.marca.trust"),
    alternates: alternatesDeRuta(loc, "/nosotros"),
  };
}

export default async function PaginaNosotros(
  props: PageProps<"/[locale]/nosotros">,
) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const r: Ruta = (path) => rutaLocalizada(loc, path);
  // Mismo fallback que sitemap/robots: URL absoluta aunque falte la env.
  const sitio =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";

  // JSON-LD de la tienda (SEO): "OnlineStore" (no "Store"), porque hoy no hay
  // local físico —lo dice la propia copia— y Store implicaría dirección. Solo
  // datos verdaderos y conocidos.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Cloud Beauty Salon",
    url: `${sitio}${r("/")}`,
    image: `${sitio}/es/opengraph-image`,
    areaServed: "Miami, Florida, USA",
    brand: { "@type": "Brand", name: "TRUSS" },
    email: "admin@cloudbeautysalon.com",
  };

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {loc === "en" ? <NosotrosEN r={r} /> : <NosotrosES r={r} />}
    </main>
  );
}

function NosotrosES({ r }: { r: Ruta }) {
  return (
    <>
      <h1 className="font-display text-3xl sm:text-4xl">Nosotros</h1>
      <div className="mt-8 space-y-6 leading-relaxed text-tinta">
        <p>
          Cloud Beauty Salon nace en Miami del gusto por el cabello sano y bien
          cuidado. Traemos la línea profesional <strong>TRUSS</strong> —cosmética
          capilar brasileña— para que cuides tu pelo en casa con la misma calidad
          que en el salón.
        </p>
        <section>
          <h2 className="font-display text-xl">Distribuidor autorizado TRUSS</h2>
          <p className="mt-2 text-tinta-suave">
            TRUSS es una marca brasileña presente en más de 35 países desde 2001.
            Todos nuestros productos son originales, de línea profesional, con
            activos que reparan, hidratan y protegen la fibra. Nada de imitaciones.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Te ayudamos a elegir</h2>
          <p className="mt-2 text-tinta-suave">
            No creemos en vender por vender. Con nuestro diagnóstico capilar te
            recomendamos una rutina a tu medida según tu tipo de cabello y tus
            objetivos.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">El salón, pronto</h2>
          <p className="mt-2 text-tinta-suave">
            Por ahora somos una tienda en línea con sede en Miami. El salón de
            belleza abre pronto; mientras tanto, cuidamos tu cabello a domicilio.
          </p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href={r("/tienda")} className="boton-primario">
          Ir a la tienda
        </Link>
        <Link
          href={r("/contacto")}
          className="inline-flex items-center text-acento underline-offset-4 hover:underline"
        >
          Contacto →
        </Link>
      </div>
    </>
  );
}

function NosotrosEN({ r }: { r: Ruta }) {
  return (
    <>
      <h1 className="font-display text-3xl sm:text-4xl">About us</h1>
      <div className="mt-8 space-y-6 leading-relaxed text-tinta">
        <p>
          Cloud Beauty Salon was born in Miami out of a love for healthy,
          well-cared-for hair. We bring the professional <strong>TRUSS</strong>{" "}
          line —Brazilian hair cosmetics— so you can care for your hair at home
          with the same quality as at the salon.
        </p>
        <section>
          <h2 className="font-display text-xl">Authorized TRUSS distributor</h2>
          <p className="mt-2 text-tinta-suave">
            TRUSS is a Brazilian brand present in more than 35 countries since
            2001. Every product is genuine, professional-line, with actives that
            repair, hydrate and protect the hair fiber. No imitations.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">We help you choose</h2>
          <p className="mt-2 text-tinta-suave">
            We don't believe in selling for the sake of it. Our hair diagnosis
            recommends a routine tailored to your hair type and goals.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">The salon, soon</h2>
          <p className="mt-2 text-tinta-suave">
            For now we're an online store based in Miami. The beauty salon opens
            soon; in the meantime, we care for your hair at home.
          </p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href={r("/tienda")} className="boton-primario">
          Go to the shop
        </Link>
        <Link
          href={r("/contacto")}
          className="inline-flex items-center text-acento underline-offset-4 hover:underline"
        >
          Contact →
        </Link>
      </div>
    </>
  );
}
