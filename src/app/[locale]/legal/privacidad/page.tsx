import type { Metadata } from "next";
import Link from "next/link";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";

type Ruta = (path: string) => string;

export async function generateMetadata(
  props: PageProps<"/[locale]/legal/privacidad">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const { t } = getT(resolverLocale(locale));
  return { title: t("legal.privacidad.titulo") };
}

// §6 — /legal/*. Refleja EXACTAMENTE lo que la web hace hoy: lista de espera
// (API propia), carrito en localStorage y pago vía Stripe. Si cambia el
// tratamiento (analítica, newsletter…), esta página cambia con él.
export default async function PaginaPrivacidad(
  props: PageProps<"/[locale]/legal/privacidad">,
) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const r: Ruta = (path) => rutaLocalizada(loc, path);
  return loc === "en" ? <PrivacidadEN r={r} /> : <PrivacidadES r={r} />;
}

function PrivacidadES({ r }: { r: Ruta }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">Política de privacidad</h1>
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
              avisemos de la apertura de un servicio, recogemos tu nombre, el
              contacto que nos dejes (WhatsApp o email) y los servicios que te
              interesan. Estos datos se nos envían por correo electrónico a
              través de nuestro proveedor de email (Resend) y los usamos
              únicamente para avisarte de la apertura y de tu beneficio de
              apertura.
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
            (pagos e impuestos), Resend (envío del correo de la lista de
            espera) y el transportista que entregue tu pedido. No vendemos ni
            cedemos tus datos a terceros con fines publicitarios.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Tus derechos</h2>
          <p className="mt-3">
            Puedes pedirnos en cualquier momento acceder, corregir o eliminar
            tus datos, o salir de la lista de espera, escribiéndonos por el
            canal de contacto de la página de{" "}
            <Link
              href={r("/contacto")}
              className="text-acento underline-offset-4 hover:underline"
            >
              contacto
            </Link>
            . Esta web no está dirigida a menores de 16 años.
          </p>
        </section>

        <p className="nota-todo">
          Borrador operativo — TODO(guion): revisar con un asesor legal antes
          del lanzamiento.
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

function PrivacidadEN({ r }: { r: Ruta }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-tinta-suave">Last updated: July 19, 2026</p>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <section>
          <h2 className="font-display text-xl">Who we are</h2>
          <p className="mt-3">
            Cloud Beauty Salon is a beauty salon and online store of
            professional hair-care products based in Miami, Florida (USA). This
            policy explains what data we process when you use this website and
            why.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">What data we collect</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Waitlist.</strong> If you sign up so we can let you know
              when a service opens, we collect your name, the contact you leave
              us (WhatsApp or email) and the services you&apos;re interested in.
              This data is sent to us by email through our email provider
              (Resend), and we use it only to notify you of the opening and of
              your opening perk.
            </li>
            <li>
              <strong>Purchases.</strong> Payment is processed by Stripe. We do
              not see or store your card details. Stripe receives your shipping
              address, your email and your payment details to process the order,
              calculate any applicable taxes and issue the receipt, in
              accordance with its own privacy policy (stripe.com/privacy). From
              Stripe we receive the order data we need to prepare and ship it.
            </li>
            <li>
              <strong>Cart and diagnosis.</strong> The contents of your cart and
              your hair-diagnosis answers are stored only in your browser (local
              storage), until you clear your browsing data. They never travel to
              our servers: at checkout we only send the products and quantities
              in the order.
            </li>
            <li>
              <strong>Cookies and analytics.</strong> Today this website uses no
              tracking cookies or third-party analytics. If that changes, this
              policy will be updated beforehand.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">How long we keep it</h2>
          <p className="mt-3">
            Waitlist data is kept until the corresponding service opens or until
            you ask to leave the list, whichever comes first. Order data is kept
            for as long as tax and warranty obligations require.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Who we share it with</h2>
          <p className="mt-3">
            Only with the providers that are essential to operate: Stripe
            (payments and taxes), Resend (sending the waitlist email) and the
            carrier that delivers your order. We do not sell or hand over your
            data to third parties for advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Your rights</h2>
          <p className="mt-3">
            You can ask us at any time to access, correct or delete your data,
            or to leave the waitlist, by writing to us through the contact
            channel on the{" "}
            <Link
              href={r("/contacto")}
              className="text-acento underline-offset-4 hover:underline"
            >
              contact
            </Link>{" "}
            page. This website is not directed to anyone under 16.
          </p>
        </section>

        <p className="nota-todo">
          Operational draft — TODO(guion): review with a legal advisor before
          launch.
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
