import Stripe from "stripe";
import { productoPorId } from "@/lib/catalogo";
import { DESCUENTO_BUNDLE } from "@/lib/formato";
import { t } from "@/lib/i18n/es";

// §9.2 RESUELTO (2026-07-19): Stripe Checkout. Los precios Y el descuento se
// calculan SIEMPRE contra el catálogo en servidor — el cliente solo manda ids
// y cantidades, y el cupón del bundle queda acotado al valor real de sus
// líneas. Se activa con STRIPE_SECRET_KEY en .env.local; sin clave responde
// 503 y la UI lo explica sin romper nada.
//
// §9.3 RESUELTO (2026-07-19): envíos a todo EE. UU. — $8 tarifa plana, gratis
// desde $75 (subtotal tras descuento). Impuestos con Stripe Tax; requiere
// activarlo en el dashboard y poner STRIPE_TAX_AUTOMATICO=1 (si no, la
// creación de sesión fallaría en cuentas sin Tax activado).

const CUERPO_MAXIMO_BYTES = 20_000;

const ENVIO_CENTAVOS = 800;
const ENVIO_GRATIS_DESDE_CENTAVOS = 7500;

// Goteo por IP (mismo criterio que /api/waitlist): cada intento crea objetos
// en la cuenta Stripe y no debe ser martilleable.
const INTENTOS_POR_HORA = 10;
const intentosPorIp = new Map<string, number[]>();

function superaGoteo(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (intentosPorIp.get(ip) ?? []).filter(
    (marca) => ahora - marca < 60 * 60 * 1000,
  );
  if (recientes.length >= INTENTOS_POR_HORA) {
    intentosPorIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  intentosPorIp.set(ip, recientes);
  return false;
}

// Un cupón por importe, reutilizado entre sesiones: sin churn de objetos.
const cuponesPorImporte = new Map<number, string>();

type Linea = { id: string; cantidad: number };

function validar(cuerpo: unknown): { lineas: Linea[]; bundleIds: string[] } | null {
  if (typeof cuerpo !== "object" || cuerpo === null) return null;
  const { lineas, bundleIds } = cuerpo as Record<string, unknown>;
  if (!Array.isArray(lineas) || lineas.length === 0 || lineas.length > 50) return null;
  const limpias: Linea[] = [];
  const idsVistos = new Set<string>();
  for (const l of lineas) {
    if (typeof l !== "object" || l === null) return null;
    const { id, cantidad } = l as Record<string, unknown>;
    if (typeof id !== "string" || !productoPorId(id) || idsVistos.has(id)) return null;
    if (typeof cantidad !== "number" || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20)
      return null;
    idsVistos.add(id);
    limpias.push({ id, cantidad });
  }
  // bundleIds saneado: únicos, existentes en catálogo Y presentes en el
  // carrito — el descuento jamás puede referirse a nada más.
  const bundle = Array.isArray(bundleIds)
    ? [...new Set(bundleIds)].filter(
        (b): b is string =>
          typeof b === "string" && Boolean(productoPorId(b)) && idsVistos.has(b),
      )
    : [];
  if (bundle.length > limpias.length) return null;
  return { lineas: limpias, bundleIds: bundle };
}

export async function POST(request: Request) {
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave) {
    console.warn("checkout 503: falta STRIPE_SECRET_KEY en .env.local");
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }

  const tamano = Number(request.headers.get("content-length") ?? 0);
  if (!tamano || tamano > CUERPO_MAXIMO_BYTES) {
    return Response.json({ ok: false }, { status: 413 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (superaGoteo(ip)) {
    return Response.json({ ok: false }, { status: 429 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const datos = validar(cuerpo);
  if (!datos) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const stripe = new Stripe(clave);
  // Base canónica desde entorno — nunca desde headers del cliente.
  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const impuestosActivos = process.env.STRIPE_TAX_AUTOMATICO === "1";

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
    datos.lineas.map((l) => {
      const p = productoPorId(l.id)!;
      return {
        quantity: l.cantidad,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(p.precio * 100),
          // Con Stripe Tax el impuesto se suma al precio (uso en EE. UU.).
          ...(impuestosActivos ? { tax_behavior: "exclusive" as const } : {}),
          product_data: {
            name: p.nombre + (p.tamano ? ` · ${p.tamano.split("/")[0].trim()}` : ""),
            images: [`${origen}${p.imagen}`],
          },
        },
      };
    });

  // §5.3: descuento del bundle — 1 unidad por producto del bundle (ya
  // garantizado subconjunto único del carrito), acotado por construcción.
  let descuentoCentavos = 0;
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (datos.bundleIds.length > 0) {
    const baseBundle = datos.bundleIds.reduce(
      (total, id) => total + (productoPorId(id)?.precio ?? 0),
      0,
    );
    const centavos = Math.round(baseBundle * DESCUENTO_BUNDLE * 100);
    if (centavos > 0) {
      let cuponId = cuponesPorImporte.get(centavos);
      if (!cuponId) {
        const cupon = await stripe.coupons.create({
          amount_off: centavos,
          currency: "usd",
          duration: "once",
          name: "Rutina del diagnóstico",
        });
        cuponId = cupon.id;
        cuponesPorImporte.set(centavos, cuponId);
      }
      discounts = [{ coupon: cuponId }];
      descuentoCentavos = centavos;
    }
  }

  // §9.3: el umbral de envío gratis se evalúa sobre lo que la clienta paga en
  // productos (subtotal del catálogo menos el descuento del bundle).
  const subtotalCentavos = datos.lineas.reduce(
    (total, l) =>
      total + Math.round(productoPorId(l.id)!.precio * 100) * l.cantidad,
    0,
  );
  const envioGratis =
    subtotalCentavos - descuentoCentavos >= ENVIO_GRATIS_DESDE_CENTAVOS;
  const shipping_options: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
    {
      shipping_rate_data: {
        display_name: envioGratis ? t("envio.gratis") : t("envio.estandar"),
        type: "fixed_amount",
        fixed_amount: {
          amount: envioGratis ? 0 : ENVIO_CENTAVOS,
          currency: "usd",
        },
        // txcd_92010001: código fiscal de Stripe para gastos de envío.
        ...(impuestosActivos
          ? { tax_behavior: "exclusive" as const, tax_code: "txcd_92010001" }
          : {}),
        delivery_estimate: {
          minimum: { unit: "business_day", value: 3 },
          maximum: { unit: "business_day", value: 7 },
        },
      },
    },
  ];

  const sesion = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "es",
    line_items,
    // Stripe no admite `discounts` y `allow_promotion_codes` a la vez: si el
    // carrito ya trae el descuento de la rutina del diagnóstico, no ofrecemos
    // el campo de código; en cualquier otro caso, la clienta puede introducir
    // un código promocional creado en el panel de Stripe.
    ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options,
    ...(impuestosActivos ? { automatic_tax: { enabled: true } } : {}),
    success_url: `${origen}/compra/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origen}/tienda`,
  });

  return Response.json({ ok: true, url: sesion.url }, { status: 200 });
}
