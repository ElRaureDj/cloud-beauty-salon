import type Stripe from "stripe";
import { sql } from "@/lib/db";

// Registro de pedidos para el panel /admin (mejora M3). El panel de Stripe sigue
// siendo la fuente de verdad; esta tabla es una vista cómoda para Disleny (qué
// pedidos hay, cuánto se ha vendido, marcar lo enviado). Solo servidor.

export type LineaPedido = {
  nombre: string;
  cantidad: number;
  importe: number | null; // centavos, total de la línea
};

export type Pedido = {
  session_id: string;
  total: number | null; // centavos
  moneda: string | null;
  email: string | null;
  nombre: string | null;
  direccion: string | null;
  lineas: LineaPedido[];
  pagado: boolean;
  reembolsado: boolean;
  enviado: boolean;
  creada_en: string | Date;
};

// Texto plano de la dirección de envío (compartido con el email del webhook).
export function direccionTexto(sesion: Stripe.Checkout.Session): string {
  const dir = sesion.collected_information?.shipping_details?.address ?? null;
  if (!dir) return "—";
  return (
    [
      dir.line1,
      dir.line2,
      [dir.city, dir.state, dir.postal_code].filter(Boolean).join(" "),
      dir.country,
    ]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

// Guarda (o actualiza) el pedido. Idempotente por sesión: reintentos y el par
// completed/async no duplican. `pagado` solo SUBE a true (false or true = true);
// `enviado` —que marca Disleny a mano— nunca se pisa. Best-effort desde el
// webhook: si falla, el pedido sigue en el panel de Stripe.
export async function guardarPedido(opts: {
  sesion: Stripe.Checkout.Session;
  lineItems: Stripe.LineItem[];
  pagado: boolean;
}): Promise<void> {
  if (!sql) return;
  const { sesion, lineItems, pagado } = opts;
  const cliente = sesion.customer_details;
  const lineas: LineaPedido[] = lineItems.map((li) => ({
    nombre: li.description ?? "Producto",
    cantidad: li.quantity ?? 1,
    importe: li.amount_total ?? null,
  }));
  // payment_intent (sin expandir es un id string) enlaza el pedido con el evento
  // charge.refunded para poder marcar reembolsos.
  const pi =
    typeof sesion.payment_intent === "string" ? sesion.payment_intent : null;
  const dir = direccionTexto(sesion);
  await sql`
    insert into pedidos (session_id, payment_intent, total, moneda, email, nombre, direccion, lineas, pagado)
    values (
      ${sesion.id}, ${pi}, ${sesion.amount_total}, ${sesion.currency},
      ${cliente?.email ?? null}, ${cliente?.name ?? null},
      ${dir}, ${JSON.stringify(lineas)}::jsonb, ${pagado}
    )
    on conflict (session_id) do update set
      pagado         = pedidos.pagado or excluded.pagado,
      total          = coalesce(excluded.total, pedidos.total),
      moneda         = coalesce(excluded.moneda, pedidos.moneda),
      email          = coalesce(excluded.email, pedidos.email),
      nombre         = coalesce(excluded.nombre, pedidos.nombre),
      payment_intent = coalesce(excluded.payment_intent, pedidos.payment_intent),
      -- Un evento posterior (p. ej. async_payment_succeeded) puede traer las
      -- líneas que un evento anterior no tuvo: refrescarlas solo si vienen.
      lineas    = case when jsonb_array_length(excluded.lineas) > 0
                       then excluded.lineas else pedidos.lineas end,
      direccion = case when excluded.direccion is not null and excluded.direccion <> '—'
                       then excluded.direccion else pedidos.direccion end
  `;
}

// Marca como reembolsado el pedido de un payment_intent (evento charge.refunded,
// solo reembolso total). Idempotente. Excluye el pedido del resumen de ventas.
export async function marcarReembolsado(paymentIntent: string): Promise<void> {
  if (!sql || !paymentIntent) return;
  await sql`update pedidos set reembolsado = true where payment_intent = ${paymentIntent}`;
}

export async function pedidosRecientes(limite = 200): Promise<Pedido[]> {
  if (!sql) return [];
  return (await sql`
    select session_id, total, moneda, email, nombre, direccion, lineas,
           pagado, reembolsado, enviado, creada_en
    from pedidos
    order by creada_en desc
    limit ${limite}
  `) as Pedido[];
}

export type VentasResumen = {
  pedidos: number;
  total: number; // centavos
  moneda: string | null;
};

// Resumen de ventas: solo pedidos PAGADOS. `max(moneda)` asume una sola moneda
// (hoy USD); si algún día se venden en varias, habría que agrupar por moneda.
export async function ventasResumen(): Promise<VentasResumen> {
  if (!sql) return { pedidos: 0, total: 0, moneda: null };
  const filas = (await sql`
    select count(*)::int as pedidos,
           coalesce(sum(total), 0)::int as total,
           max(moneda) as moneda
    from pedidos
    where pagado and not reembolsado
  `) as { pedidos: number; total: number; moneda: string | null }[];
  const f = filas[0] ?? { pedidos: 0, total: 0, moneda: null };
  return { pedidos: Number(f.pedidos), total: Number(f.total), moneda: f.moneda };
}

export async function marcarEnviado(
  sessionId: string,
  enviado: boolean,
): Promise<void> {
  if (!sql) return;
  await sql`update pedidos set enviado = ${enviado} where session_id = ${sessionId}`;
}

// Consulta pública de un pedido (mejora H3): requiere session_id EXACTO Y que el
// email coincida (segundo factor, anti-enumeración). Devuelve solo lo que la
// clienta necesita saber (estado + líneas + total), nunca la dirección de otros.
export type PedidoPublico = {
  fecha: string;
  pagado: boolean;
  reembolsado: boolean;
  enviado: boolean;
  total: number | null;
  moneda: string | null;
  lineas: LineaPedido[];
};

export async function consultarPedido(
  sessionId: string,
  email: string,
): Promise<PedidoPublico | null> {
  if (!sql || !sessionId || !email) return null;
  const filas = (await sql`
    select creada_en, pagado, reembolsado, enviado, total, moneda, lineas
    from pedidos
    where session_id = ${sessionId} and lower(email) = lower(${email})
    limit 1
  `) as {
    creada_en: string | Date;
    pagado: boolean;
    reembolsado: boolean;
    enviado: boolean;
    total: number | null;
    moneda: string | null;
    lineas: LineaPedido[] | null;
  }[];
  if (!filas.length) return null;
  const f = filas[0];
  return {
    fecha: new Date(f.creada_en).toISOString(),
    pagado: f.pagado,
    reembolsado: f.reembolsado,
    enviado: f.enviado,
    total: f.total,
    moneda: f.moneda,
    lineas: f.lineas ?? [],
  };
}

export type VentaDia = { dia: string; total: number; pedidos: number };

// Ventas por día (pagadas, sin reembolsos) de los últimos N días, para el
// gráfico del panel (mejora G3). El rango va de (hoy − (N−1)) a hoy = N fechas
// de calendario (UTC), exactamente las que dibuja el panel; los días sin ventas
// no aparecen y el panel los rellena a cero.
export async function ventasPorDia(dias = 30): Promise<VentaDia[]> {
  if (!sql) return [];
  const filas = (await sql`
    select to_char(date_trunc('day', creada_en), 'YYYY-MM-DD') as dia,
           coalesce(sum(total), 0)::int as total,
           count(*)::int as pedidos
    from pedidos
    where pagado and not reembolsado
      and creada_en >= (current_date - make_interval(days => ${dias - 1}))
    group by 1
    order by 1
  `) as { dia: string; total: number; pedidos: number }[];
  return filas.map((f) => ({
    dia: f.dia,
    total: Number(f.total),
    pedidos: Number(f.pedidos),
  }));
}
