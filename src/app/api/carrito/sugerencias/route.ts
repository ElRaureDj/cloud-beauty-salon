import { combinaCon, productoPorId } from "@/lib/catalogo";
import { stockDeProductos } from "@/lib/stock";

// Sugerencias de cross-sell para el carrito (mejora I3): a partir de los ids del
// carrito, devuelve hasta 2 productos complementarios (misma línea/etapa) que no
// estén ya en el carrito, tengan precio y NO estén agotados (según Neon; sin BD,
// no se filtra por stock). Solo el catálogo + una lectura de stock.
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

  // Candidatos: complementarios con precio, no ya en el carrito (recogemos de
  // sobra para tener margen tras filtrar por stock).
  const excluir = new Set(ids);
  const candidatos: { id: string; nombre: string; precio: number; imagen: string }[] =
    [];
  for (const id of ids) {
    const p = productoPorId(id);
    if (!p) continue;
    for (const c of combinaCon(p, 8)) {
      if (excluir.has(c.id) || c.precio <= 0) continue;
      excluir.add(c.id);
      candidatos.push({ id: c.id, nombre: c.nombre, precio: c.precio, imagen: c.imagen });
    }
  }

  // Fuera los agotados (stock 0). Desconocido (sin fila / sin BD) → se muestra.
  const stock = await stockDeProductos(candidatos.map((c) => c.id));
  const sugerencias = candidatos
    .filter((c) => !stock.has(c.id) || stock.get(c.id)! > 0)
    .slice(0, MAXIMO);

  return Response.json({ sugerencias });
}
