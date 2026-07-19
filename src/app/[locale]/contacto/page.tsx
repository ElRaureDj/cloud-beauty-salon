import type { Metadata } from "next";
import Link from "next/link";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";

type Ruta = (path: string) => string;

export async function generateMetadata(
  props: PageProps<"/[locale]/contacto">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const { t } = getT(resolverLocale(locale));
  return { title: t("contacto.titulo") };
}

// §9.5 RESUELTO (2026-07-19): el correo de contacto es admin@cloudbeautysalon.com.
// Los legales enlazan aquí.
export default async function PaginaContacto(
  props: PageProps<"/[locale]/contacto">,
) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const r: Ruta = (path) => rutaLocalizada(loc, path);
  return loc === "en" ? <ContactoEN r={r} /> : <ContactoES r={r} />;
}

function ContactoES({ r }: { r: Ruta }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">Contacto</h1>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <p>
          ¿Tienes una pregunta sobre tu pedido, una devolución o quieres
          apuntarte a uno de nuestros servicios? Escríbenos y te respondemos lo
          antes posible.
        </p>

        <section>
          <h2 className="font-display text-xl">Correo electrónico</h2>
          <p className="mt-3">
            <a
              href={`mailto:admin@cloudbeautysalon.com`}
              className="text-acento underline-offset-4 hover:underline"
            >
              admin@cloudbeautysalon.com
            </a>
          </p>
          <p className="mt-3 text-sm text-tinta-suave">
            Úsalo para dudas sobre productos, el estado de un pedido, una
            devolución dentro de los 30 días o para ejercer tus derechos sobre
            tus datos (política de{" "}
            <Link
              href={r("/legal/privacidad")}
              className="text-acento underline-offset-4 hover:underline"
            >
              privacidad
            </Link>
            ).
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Dónde estamos</h2>
          <p className="mt-3">
            Miami, Florida (EE. UU.). Somos una tienda en línea de productos
            capilares profesionales TRUSS; el salón de belleza abre pronto.
          </p>
        </section>

        <p className="nota-todo">
          TODO(guion §9.5): añadir WhatsApp, redes y dirección física cuando el
          salón tenga local y canales definitivos.
        </p>
      </div>

      <Link
        href={r("/")}
        className="mt-10 inline-block text-acento underline-offset-4 hover:underline"
      >
        ← Volver a la experiencia
      </Link>
    </main>
  );
}

function ContactoEN({ r }: { r: Ruta }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">Contact</h1>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <p>
          Have a question about your order or a return, or want to sign up for
          one of our services? Write to us and we&apos;ll get back to you as
          soon as possible.
        </p>

        <section>
          <h2 className="font-display text-xl">Email</h2>
          <p className="mt-3">
            <a
              href={`mailto:admin@cloudbeautysalon.com`}
              className="text-acento underline-offset-4 hover:underline"
            >
              admin@cloudbeautysalon.com
            </a>
          </p>
          <p className="mt-3 text-sm text-tinta-suave">
            Use it for questions about products, the status of an order, a
            return within 30 days, or to exercise your rights over your data
            (see our{" "}
            <Link
              href={r("/legal/privacidad")}
              className="text-acento underline-offset-4 hover:underline"
            >
              privacy policy
            </Link>
            ).
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Where we are</h2>
          <p className="mt-3">
            Miami, Florida (USA). We&apos;re an online store for professional
            TRUSS hair-care products; the beauty salon opens soon.
          </p>
        </section>

        <p className="nota-todo">
          TODO(guion §9.5): add WhatsApp, social media and a physical address
          once the salon has a location and final channels.
        </p>
      </div>

      <Link
        href={r("/")}
        className="mt-10 inline-block text-acento underline-offset-4 hover:underline"
      >
        ← Back to the experience
      </Link>
    </main>
  );
}
