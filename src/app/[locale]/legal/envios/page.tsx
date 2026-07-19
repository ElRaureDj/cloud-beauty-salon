import type { Metadata } from "next";
import Link from "next/link";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";

type Ruta = (path: string) => string;

export async function generateMetadata(
  props: PageProps<"/[locale]/legal/envios">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const { t } = getT(resolverLocale(locale));
  return { title: t("legal.envios.titulo") };
}

// §9.3 RESUELTO (2026-07-19): todo EE. UU., $8 tarifa plana, gratis desde $75;
// devoluciones 30 días sin abrir. Estas cifras deben coincidir SIEMPRE con
// las de /api/checkout (ENVIO_CENTAVOS y ENVIO_GRATIS_DESDE_CENTAVOS) y entre
// ambos idiomas.
export default async function PaginaEnvios(
  props: PageProps<"/[locale]/legal/envios">,
) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const r: Ruta = (path) => rutaLocalizada(loc, path);
  return loc === "en" ? <EnviosEN r={r} /> : <EnviosES r={r} />;
}

function EnviosES({ r }: { r: Ruta }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">Envíos y devoluciones</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Última actualización: 19 de julio de 2026
      </p>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <section>
          <h2 className="font-display text-xl">Dónde enviamos</h2>
          <p className="mt-3">
            Enviamos a todo Estados Unidos (los 50 estados y Washington D. C.).
            No realizamos envíos internacionales. Si un pedido tiene como
            destino un territorio de EE. UU. o una dirección militar
            (APO/FPO/DPO) que nuestro transportista no cubra, lo cancelaremos
            y reembolsaremos íntegramente antes del envío.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Cuánto cuesta</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Tarifa plana de <strong>$8</strong> por pedido, a cualquier punto
              del país.
            </li>
            <li>
              <strong>Envío gratis</strong> en pedidos de <strong>$75</strong>{" "}
              o más (subtotal de productos, después de aplicar descuentos).
            </li>
          </ul>
          <p className="mt-3">
            Los impuestos sobre la venta que apliquen se calculan en el momento
            del pago según el estado de destino y se muestran antes de
            confirmar la compra.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Cuándo llega</h2>
          <p className="mt-3">
            Preparamos los pedidos en 1–2 días hábiles y la entrega estimada es
            de <strong>3–7 días hábiles</strong> desde la confirmación del
            pago. Recibirás la confirmación del pedido por correo electrónico y
            te avisaremos cuando salga el envío.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Devoluciones</h2>
          <p className="mt-3">
            Aceptamos devoluciones durante los <strong>30 días</strong>{" "}
            siguientes a la entrega, siempre que el producto esté{" "}
            <strong>sin abrir, sin usar y con su precinto intacto</strong>. Por
            razones de higiene no podemos aceptar productos cosméticos
            abiertos.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              El costo del envío de vuelta corre por cuenta de la clienta,
              salvo que el producto llegue defectuoso o hayamos cometido un
              error con tu pedido: en ese caso lo cubrimos nosotros.
            </li>
            <li>
              Una vez recibido y revisado el producto, reembolsamos al método
              de pago original en un plazo de 5–10 días hábiles.
            </li>
            <li>
              Si tu pedido llega dañado o incorrecto, escríbenos con una foto
              dentro de los 30 días y lo resolvemos con reposición o reembolso
              completo.
            </li>
          </ul>
          <p className="mt-3">
            Las condiciones completas están en los{" "}
            <Link
              href={r("/legal/terminos")}
              className="text-acento underline-offset-4 hover:underline"
            >
              términos y condiciones
            </Link>
            .
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

function EnviosEN({ r }: { r: Ruta }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">Shipping &amp; Returns</h1>
      <p className="mt-2 text-sm text-tinta-suave">Last updated: July 19, 2026</p>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <section>
          <h2 className="font-display text-xl">Where we ship</h2>
          <p className="mt-3">
            We ship anywhere in the United States (all 50 states and
            Washington, D.C.). We do not ship internationally. If an order is
            addressed to a U.S. territory or a military address (APO/FPO/DPO)
            that our carrier does not cover, we will cancel it and refund you in
            full before shipping.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">How much it costs</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Flat rate of <strong>$8</strong> per order, anywhere in the
              country.
            </li>
            <li>
              <strong>Free shipping</strong> on orders of <strong>$75</strong>{" "}
              or more (product subtotal, after any discounts).
            </li>
          </ul>
          <p className="mt-3">
            Any applicable sales tax is calculated at checkout based on the
            destination state and shown before you confirm your purchase.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">When it arrives</h2>
          <p className="mt-3">
            We prepare orders within 1–2 business days, and estimated delivery
            is <strong>3–7 business days</strong> from payment confirmation.
            You&apos;ll receive an order confirmation by email, and we&apos;ll
            let you know when your order ships.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Returns</h2>
          <p className="mt-3">
            We accept returns within <strong>30 days</strong> of delivery, as
            long as the product is{" "}
            <strong>unopened, unused and with its seal intact</strong>. For
            hygiene reasons we cannot accept opened cosmetic products.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Return shipping is the customer&apos;s responsibility, unless the
              product arrives defective or we made a mistake with your order —
              in that case we cover it.
            </li>
            <li>
              Once we receive and inspect the product, we refund the original
              payment method within 5–10 business days.
            </li>
            <li>
              If your order arrives damaged or incorrect, write to us with a
              photo within 30 days and we&apos;ll resolve it with a replacement
              or a full refund.
            </li>
          </ul>
          <p className="mt-3">
            The full conditions are in our{" "}
            <Link
              href={r("/legal/terminos")}
              className="text-acento underline-offset-4 hover:underline"
            >
              terms and conditions
            </Link>
            .
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
