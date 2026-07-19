import type { Metadata } from "next";
import Link from "next/link";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";

type Ruta = (path: string) => string;

export async function generateMetadata(
  props: PageProps<"/[locale]/legal/terminos">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const { t } = getT(resolverLocale(locale));
  return { title: t("legal.terminos.titulo") };
}

// §6 — /legal/*. Devoluciones según §9.3 (30 días sin abrir); debe coincidir
// con /legal/envios y con la operación real de la tienda.
export default async function PaginaTerminos(
  props: PageProps<"/[locale]/legal/terminos">,
) {
  const { locale } = await props.params;
  const loc = resolverLocale(locale);
  const r: Ruta = (path) => rutaLocalizada(loc, path);
  return loc === "en" ? <TerminosEN r={r} /> : <TerminosES r={r} />;
}

function TerminosES({ r }: { r: Ruta }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Última actualización: 19 de julio de 2026
      </p>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <section>
          <h2 className="font-display text-xl">1. Quiénes somos y qué vendemos</h2>
          <p className="mt-3">
            Cloud Beauty Salon (Miami, Florida, EE. UU.) opera esta tienda en
            línea de productos capilares profesionales de la marca TRUSS, de la
            que somos distribuidor autorizado. Al comprar en esta web aceptas
            estos términos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">2. Precios y pago</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Los precios se muestran en dólares estadounidenses (USD) e
              incluyen lo indicado en cada ficha; los impuestos sobre la venta
              que apliquen se calculan y muestran en el pago según el estado
              de destino.
            </li>
            <li>
              El pago se procesa de forma segura a través de Stripe. No
              almacenamos datos de tarjetas.
            </li>
            <li>
              Los descuentos por rutina del diagnóstico se aplican una vez por
              pedido sobre los productos de la rutina recomendada.
            </li>
            <li>
              Si un precio publicado contiene un error manifiesto, podremos
              cancelar el pedido y reembolsarlo íntegramente antes del envío.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">3. Envíos</h2>
          <p className="mt-3">
            Enviamos a todo EE. UU. con tarifa plana de $8, gratis en pedidos
            de $75 o más. Los plazos y el detalle completo están en la{" "}
            <Link
              href={r("/legal/envios")}
              className="text-acento underline-offset-4 hover:underline"
            >
              política de envíos y devoluciones
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">4. Devoluciones y reembolsos</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Dispones de <strong>30 días naturales desde la entrega</strong>{" "}
              para devolver un producto <strong>sin abrir, sin usar y con el
              precinto intacto</strong>. Por higiene, los productos cosméticos
              abiertos no admiten devolución.
            </li>
            <li>
              El envío de vuelta corre por tu cuenta, salvo producto defectuoso
              o error nuestro en el pedido, en cuyo caso lo cubrimos nosotros.
            </li>
            <li>
              Tras recibir y revisar la devolución, reembolsamos al método de
              pago original en 5–10 días hábiles. Los gastos de envío
              originales solo se reembolsan si la devolución se debe a un
              defecto o a un error nuestro.
            </li>
            <li>
              Si el producto llega dañado o no es el que pediste, contáctanos
              con una foto dentro del plazo de 30 días y lo resolvemos con
              reposición o reembolso completo.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">5. Uso de los productos</h2>
          <p className="mt-3">
            Sigue siempre el modo de uso indicado en cada producto. Los
            resultados varían según el tipo de cabello y su historial químico;
            las recomendaciones del diagnóstico capilar de esta web son
            orientativas y no sustituyen la valoración de un profesional. Ante
            cualquier irritación, suspende el uso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">6. Responsabilidad y ley aplicable</h2>
          <p className="mt-3">
            Nuestra responsabilidad frente a un pedido se limita al importe
            pagado por él, sin perjuicio de los derechos que la ley te
            reconozca y que no puedan limitarse. Estos términos se rigen por
            las leyes del estado de Florida, EE. UU. Podemos actualizar estos
            términos; la versión publicada en esta página es la vigente para
            cada compra.
          </p>
        </section>

        <p className="nota-todo">
          Borrador operativo — TODO(guion): revisar con un asesor legal antes
          del lanzamiento y añadir la razón social definitiva (§9.5).
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

function TerminosEN({ r }: { r: Ruta }) {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-28">
      <h1 className="font-display text-3xl">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-tinta-suave">Last updated: July 19, 2026</p>

      <div className="mt-8 space-y-8 leading-relaxed text-tinta">
        <section>
          <h2 className="font-display text-xl">1. Who we are and what we sell</h2>
          <p className="mt-3">
            Cloud Beauty Salon (Miami, Florida, USA) runs this online store of
            professional TRUSS hair-care products, for which we are an
            authorized distributor. By purchasing on this site you accept these
            terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">2. Prices and payment</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Prices are shown in U.S. dollars (USD) and include what is stated
              on each product page; any applicable sales tax is calculated and
              shown at checkout based on the destination state.
            </li>
            <li>
              Payment is processed securely through Stripe. We do not store card
              data.
            </li>
            <li>
              Diagnosis-routine discounts apply once per order to the products
              in the recommended routine.
            </li>
            <li>
              If a published price contains an obvious error, we may cancel the
              order and refund it in full before shipping.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">3. Shipping</h2>
          <p className="mt-3">
            We ship anywhere in the U.S. with a flat rate of $8, free on orders
            of $75 or more. Delivery times and full details are in our{" "}
            <Link
              href={r("/legal/envios")}
              className="text-acento underline-offset-4 hover:underline"
            >
              shipping and returns policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">4. Returns and refunds</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              You have <strong>30 calendar days from delivery</strong> to return
              a product <strong>unopened, unused and with its seal intact</strong>.
              For hygiene reasons, opened cosmetic products cannot be returned.
            </li>
            <li>
              Return shipping is your responsibility, unless the product is
              defective or we made a mistake with your order, in which case we
              cover it.
            </li>
            <li>
              After we receive and inspect the return, we refund the original
              payment method within 5–10 business days. Original shipping costs
              are only refunded if the return is due to a defect or a mistake on
              our part.
            </li>
            <li>
              If the product arrives damaged or isn&apos;t the one you ordered,
              contact us with a photo within 30 days and we&apos;ll resolve it
              with a replacement or a full refund.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">5. Product use</h2>
          <p className="mt-3">
            Always follow the usage instructions on each product. Results vary
            depending on your hair type and its chemical history; the
            recommendations from this site&apos;s hair diagnosis are for
            guidance only and do not replace a professional&apos;s assessment.
            If any irritation occurs, stop use.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">6. Liability and governing law</h2>
          <p className="mt-3">
            Our liability for an order is limited to the amount paid for it,
            without prejudice to any rights granted to you by law that cannot be
            limited. These terms are governed by the laws of the state of
            Florida, USA. We may update these terms; the version published on
            this page is the one in effect for each purchase.
          </p>
        </section>

        <p className="nota-todo">
          Operational draft — TODO(guion): review with a legal advisor before
          launch and add the final registered company name (§9.5).
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
