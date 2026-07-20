import { combinaCon, productoPorId } from "@/lib/catalogo";

// Sugerencias de cross-sell para el carrito (mejora I3): a partir de los ids del
// carrito, devuelve hasta 2 productos complementarios (misma línea/etapa) que no
// estén ya en el carrito y tengan precio. Sin estado ni BD; solo el catálogo.
const MAXIMO = 2;

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ sugerencias: [] }, { status: 400 });
  }
  const idsRaw = (cuerpo as { ids?: unknown } | null)?.ids;
  const ids = Array.isArray(idsRaw)
    ? idsRaw.filter((x): x is string => typeof x === "string").slice(0, 50)
    : [];

  const excluir = new Set(ids);
  const sugerencias: {
    id: string;
    nombre: string;
    precio: number;
    imagen: string;
  }[] = [];

  for (const id of ids) {
    const p = productoPorId(id);
    if (!p) continue;
    for (const c of combinaCon(p, 6)) {
      if (excluir.has(c.id) || c.precio <= 0) continue;
      excluir.add(c.id);
      sugerencias.push({
        id: c.id,
        nombre: c.nombre,
        precio: c.precio,
        imagen: c.imagen,
      });
      if (sugerencias.length >= MAXIMO) break;
    }
    if (sugerencias.length >= MAXIMO) break;
  }

  return Response.json({ sugerencias });
}
