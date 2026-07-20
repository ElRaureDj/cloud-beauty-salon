import { sql } from "@/lib/db";

// Lectura de inventario (bloque 3). Solo servidor. Sin BD → devuelve "no sé":
// mapa vacío / null, y la UI de stock se oculta y NADA bloquea la venta
// (degradación, igual que Stripe/Resend sin config).

export async function stockDeProductos(
  ids: string[],
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (!sql || ids.length === 0) return mapa;
  try {
    const filas = (await sql`
      select producto_id, unidades from stock
      where producto_id = any(${ids}::text[])
    `) as { producto_id: string; unidades: number }[];
    for (const f of filas) mapa.set(f.producto_id, Number(f.unidades));
  } catch (e) {
    // Un fallo de BD no debe tumbar la tienda: se degrada a "sin stock conocido".
    console.error("stockDeProductos falló:", e);
  }
  return mapa;
}

// Unidades de UN producto, o null si no hay BD / no hay fila para ese id.
export async function stockDeProducto(id: string): Promise<number | null> {
  const mapa = await stockDeProductos([id]);
  return mapa.has(id) ? mapa.get(id)! : null;
}

// Fija las unidades de un producto (panel admin). Upsert: sirve también para
// productos aún no sembrados. Nunca negativo. Devuelve `repuesto` = true si el
// stock pasó de 0 (o inexistente) a positivo → el llamador avisa a quien esperaba
// (mejora F2). Dos sentencias (leer antes, escribir): el panel es de un solo
// usuario, la carrera es irrelevante.
export async function fijarStock(
  id: string,
  unidades: number,
): Promise<{ repuesto: boolean }> {
  if (!sql) return { repuesto: false };
  const n = Math.max(0, Math.trunc(unidades));
  const prev = (await sql`
    select unidades from stock where producto_id = ${id}
  `) as { unidades: number }[];
  const antes = prev.length ? Number(prev[0].unidades) : 0;
  await sql`
    insert into stock (producto_id, unidades, actualizado_en)
    values (${id}, ${n}, now())
    on conflict (producto_id)
      do update set unidades = excluded.unidades, actualizado_en = now()
  `;
  return { repuesto: antes <= 0 && n > 0 };
}
