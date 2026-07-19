import { estaAutenticado } from "@/lib/admin-auth";
import { productoPorId } from "@/lib/catalogo";
import { fijarStock } from "@/lib/stock";

// Guarda cambios de stock desde el panel (bloque 3). Protegido por la cookie de
// sesión del admin. Cada cambio se valida contra el catálogo real.
export async function POST(request: Request) {
  if (!(await estaAutenticado())) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const cambios = (cuerpo as Record<string, unknown> | null)?.cambios;
  if (!Array.isArray(cambios) || cambios.length > 100) {
    return Response.json({ ok: false }, { status: 400 });
  }

  let guardados = 0;
  for (const c of cambios) {
    if (typeof c !== "object" || c === null) continue;
    const { id, unidades } = c as Record<string, unknown>;
    if (
      typeof id === "string" &&
      productoPorId(id) &&
      typeof unidades === "number" &&
      Number.isFinite(unidades)
    ) {
      await fijarStock(id, unidades);
      guardados += 1;
    }
  }

  return Response.json({ ok: true, guardados });
}
