import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = { title: t("legal.privacidad.titulo") };

// §6 — /legal/*. Refleja EXACTAMENTE lo que la web hace hoy: lista de espera
// (API propia), carrito en localStorage y pago vía Stripe. Si cambia el
// tratamiento (analítica, newsletter…), esta página cambia con él.
export default function PaginaPrivacidad() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">{t("legal.privacidad.titulo")}</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Última actualización: 19 de julio de 2026
      </p>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <section>
          <h2 className="font-display text-xl">Quiénes somos</h2>
          <p className="mt-3">
            Cloud Beauty Salon es un salón de belleza y tienda en línea de
            productos capilares profesionales con base en Miami, Florida
            (EE. UU.). Esta política explica qué datos tratamos cuando usas
            esta web y para qué.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Qué datos recogemos</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Lista de espera.</strong> Si te apuntas para que te
              avisemos de la apertura de un servicio, guardamos tu nombre, el
              contacto que nos dejes (WhatsApp o email) y los servicios que te
              interesan. Los usamos únicamente para avisarte de la apertura y
              de tu beneficio de apertura.
            </li>
            <li>
              <strong>Compras.</strong> El pago se procesa en Stripe. Nosotros
              no vemos ni almacenamos los datos de tu tarjeta. Stripe recibe tu
              dirección de envío, tu email y tus datos de pago para procesar el
              pedido, calcular los impuestos que apliquen y emitir el recibo,
              conforme a su
              propia política de privacidad (stripe.com/privacy). De Stripe
              recibimos los datos del pedido necesarios para prepararlo y
              enviarlo.
            </li>
            <li>
              <strong>Carrito y diagnóstico.</strong> El contenido de tu
              carrito y tus respuestas del diagnóstico capilar se guardan solo
              en tu navegador (almacenamiento local), hasta que borres los
              datos de navegación. No viajan a nuestros servidores: al pagar
              solo enviamos los productos y las cantidades del pedido.
            </li>
            <li>
              <strong>Cookies y analítica.</strong> Hoy esta web no usa cookies
              de rastreo ni analítica de terceros. Si eso cambia, esta política
              se actualizará antes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">Cuánto tiempo los guardamos</h2>
          <p className="mt-3">
            Los datos de la lista de espera se conservan hasta que abra el
            servicio correspondiente o hasta que nos pidas salir de la lista,
            lo que ocurra primero. Los datos de pedidos se conservan el tiempo
            exigido por las obligaciones fiscales y de garantía.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Con quién los compartimos</h2>
          <p className="mt-3">
            Solo con los proveedores imprescindibles para operar: Stripe
            (pagos e impuestos) y el transportista que entregue tu pedido. No
            vendemos ni cedemos tus datos a terceros con fines publicitarios.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Tus derechos</h2>
          <p className="mt-3">
            Puedes pedirnos en cualquier momento acceder, corregir o eliminar
            tus datos, o salir de la lista de espera, escribiéndonos por el
            canal de contacto de la página de{" "}
            <Link
              href="/contacto"
              className="text-acento underline-offset-4 hover:underline"
            >
              contacto
            </Link>
            . Esta web no está dirigida a menores de 16 años.
          </p>
        </section>

        <p className="nota-todo">
          Borrador operativo — TODO(guion): revisar con un asesor legal antes
          del lanzamiento y fijar el correo de contacto definitivo (§9.5).
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
