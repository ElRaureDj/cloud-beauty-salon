import { sql } from "@/lib/db";

// Lectura de reseñas aprobadas (bloque 3). Solo servidor. Sin BD → resumen
// vacío (la sección muestra su estado "sé la primera en opinar", sin inventar).

export type ResenaPublica = {
  id: number;
  autor: string;
  rating: number;
  texto: string;
  fecha: string; // ISO
  verificada: boolean; // compra verificada (mejora I2)
  foto: string | null; // URL de la foto adjunta, si la hay
};

export type ResumenResenas = {
  items: ResenaPublica[];
  total: number;
  media: number; // 0 si no hay
};

const VACIO: ResumenResenas = { items: [], total: 0, media: 0 };

// Media + nº de reseñas aprobadas por producto, en UNA query (prueba social de
// la tienda). Sin BD / sin reseñas → el id no aparece en el mapa.
export async function resumenPorProducto(
  ids: string[],
): Promise<Map<string, { media: number; total: number }>> {
  const mapa = new Map<string, { media: number; total: number }>();
  if (!sql || ids.length === 0) return mapa;
  try {
    const filas = (await sql`
      select producto_id, avg(rating)::float as media, count(*)::int as total
      from resenas
      where aprobada and producto_id = any(${ids}::text[])
      group by producto_id
    `) as { producto_id: string; media: number; total: number }[];
    for (const f of filas) {
      mapa.set(f.producto_id, {
        media: Number(f.media),
        total: Number(f.total),
      });
    }
  } catch (e) {
    console.error("resumenPorProducto falló:", e);
  }
  return mapa;
}

export async function resenasDeProducto(id: string): Promise<ResumenResenas> {
  if (!sql) return VACIO;
  try {
    const filas = (await sql`
      select id, autor, rating, texto, verificada, foto_url, creada_en
      from resenas
      where producto_id = ${id} and aprobada
      order by creada_en desc
      limit 50
    `) as {
      id: number;
      autor: string;
      rating: number;
      texto: string;
      verificada: boolean;
      foto_url: string | null;
      creada_en: string | Date;
    }[];
    const items: ResenaPublica[] = filas.map((f) => ({
      id: Number(f.id),
      autor: f.autor,
      rating: Number(f.rating),
      texto: f.texto,
      verificada: Boolean(f.verificada),
      foto: f.foto_url ?? null,
      fecha: new Date(f.creada_en).toISOString(),
    }));
    const total = items.length;
    const media = total
      ? items.reduce((suma, r) => suma + r.rating, 0) / total
      : 0;
    return { items, total, media };
  } catch (e) {
    console.error("resenasDeProducto falló:", e);
    return VACIO;
  }
}

// Inserta una reseña pendiente de aprobación (aprobada=false). Devuelve el id o
// null si no hay BD. La validación/saneado ocurre en el endpoint.
export async function crearResena(r: {
  producto_id: string;
  autor: string;
  rating: number;
  texto: string;
  verificada?: boolean;
  foto_url?: string | null;
}): Promise<number | null> {
  if (!sql) return null;
  const filas = (await sql`
    insert into resenas (producto_id, autor, rating, texto, aprobada, verificada, foto_url)
    values (${r.producto_id}, ${r.autor}, ${r.rating}, ${r.texto}, false,
            ${r.verificada ?? false}, ${r.foto_url ?? null})
    returning id
  `) as { id: number }[];
  return filas.length ? Number(filas[0].id) : null;
}

// --- Moderación (panel admin) ---

export type ResenaAdmin = ResenaPublica & { producto_id: string };

export async function resenasPendientes(): Promise<ResenaAdmin[]> {
  if (!sql) return [];
  const filas = (await sql`
    select id, producto_id, autor, rating, texto, verificada, foto_url, creada_en
    from resenas
    where not aprobada
    order by creada_en desc
    limit 200
  `) as {
    id: number;
    producto_id: string;
    autor: string;
    rating: number;
    texto: string;
    verificada: boolean;
    foto_url: string | null;
    creada_en: string | Date;
  }[];
  return filas.map((f) => ({
    id: Number(f.id),
    producto_id: f.producto_id,
    autor: f.autor,
    rating: Number(f.rating),
    texto: f.texto,
    verificada: Boolean(f.verificada),
    foto: f.foto_url ?? null,
    fecha: new Date(f.creada_en).toISOString(),
  }));
}

export async function aprobarResena(id: number): Promise<void> {
  if (!sql) return;
  await sql`update resenas set aprobada = true where id = ${id}`;
}

export async function eliminarResena(id: number): Promise<void> {
  if (!sql) return;
  await sql`delete from resenas where id = ${id}`;
}
