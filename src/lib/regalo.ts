import { sql } from "@/lib/db";

// Tarjetas regalo (mejora I1). Al pagar una tarjeta, el webhook reclama la
// sesión de forma idempotente (una sola emisión aunque Stripe reintente),
// genera un código canjeable (promotion code de Stripe) y lo guarda aquí.

// Reclama la sesión: devuelve true SOLO si esta llamada la insertó (primera
// vez). Así el webhook emite el código una única vez.
export async function reclamarRegalo(opts: {
  session_id: string;
  importe_centavos: number;
  destinatario: string;
  comprador: string;
  mensaje: string;
}): Promise<boolean> {
  if (!sql) return false;
  const filas = (await sql`
    insert into tarjetas_regalo (session_id, importe_centavos, destinatario, comprador, mensaje)
    values (${opts.session_id}, ${opts.importe_centavos}, ${opts.destinatario}, ${opts.comprador}, ${opts.mensaje})
    on conflict (session_id) do nothing
    returning id
  `) as { id: number }[];
  return filas.length > 0;
}

export async function fijarCodigoRegalo(
  session_id: string,
  code: string,
): Promise<void> {
  if (!sql) return;
  await sql`update tarjetas_regalo set code = ${code} where session_id = ${session_id}`;
}

// Estado actual de la tarjeta (para recuperación idempotente): el código ya
// emitido (o null) y si el email al destinatario ya se envió.
export async function estadoRegalo(
  session_id: string,
): Promise<{ code: string | null; enviado: boolean } | null> {
  if (!sql) return null;
  const filas = (await sql`
    select code, enviado from tarjetas_regalo where session_id = ${session_id}
  `) as { code: string | null; enviado: boolean }[];
  return filas.length
    ? { code: filas[0].code ?? null, enviado: Boolean(filas[0].enviado) }
    : null;
}

// Libera una reclamación AÚN sin código (la emisión falló): así un reintento del
// webhook puede volver a reclamar y emitir limpio. Nunca borra una tarjeta ya
// emitida (code no nulo).
export async function liberarRegalo(session_id: string): Promise<void> {
  if (!sql) return;
  await sql`delete from tarjetas_regalo where session_id = ${session_id} and code is null`;
}

export async function marcarRegaloEnviado(session_id: string): Promise<void> {
  if (!sql) return;
  await sql`update tarjetas_regalo set enviado = true where session_id = ${session_id}`;
}

// Código legible sin caracteres ambiguos (sin O/0, I/1). Ej: CBS-7K9P-3XQ2.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generarCodigoRegalo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = [...bytes].map((b) => ALFABETO[b % ALFABETO.length]);
  return `CBS-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}`;
}
