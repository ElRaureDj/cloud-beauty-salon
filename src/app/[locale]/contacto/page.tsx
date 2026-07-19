import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = { title: t("contacto.titulo") };

// §9.5 RESUELTO (2026-07-19): el correo de contacto es admin@cloudbeautysalon.com
// (clave contacto.email — única fuente). Los legales enlazan aquí.
export default function PaginaContacto() {
  const email = t("contacto.email");

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">{t("contacto.titulo")}</h1>

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
              href={`mailto:${email}`}
              className="text-acento underline-offset-4 hover:underline"
            >
              {email}
            </a>
          </p>
          <p className="mt-3 text-sm text-tinta-suave">
            Úsalo para dudas sobre productos, el estado de un pedido, una
            devolución dentro de los 30 días o para ejercer tus derechos sobre
            tus datos (política de{" "}
            <Link
              href="/legal/privacidad"
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
        href="/"
        className="mt-10 inline-block text-acento underline-offset-4 hover:underline"
      >
        {t("tienda.volver")}
      </Link>
    </main>
  );
}
