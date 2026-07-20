import { after } from "next/server";
import { estaAutenticado } from "@/lib/admin-auth";
import { productoPorId } from "@/lib/catalogo";
import { fijarStock } from "@/lib/stock";
import { notificarReposicion } from "@/lib/avisos";

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
  const repuestos: string[] = [];
  for (const c of cambios) {
    if (typeof c !== "object" || c === null) continue;
    const { id, unidades } = c as Record<string, unknown>;
    if (
      typeof id === "string" &&
      productoPorId(id) &&
      typeof unidades === "number" &&
      Number.isFinite(unidades)
    ) {
      const { repuesto } = await fijarStock(id, unidades);
      if (repuesto) repuestos.push(id);
      guardados += 1;
    }
  }

  // Reposiciones (0 → positivo): avisar a quien esperaba, fuera del camino de
  // respuesta (mejora F2). Best-effort; no bloquea ni tumba el guardado.
  if (repuestos.length > 0) {
    after(async () => {
      for (const id of repuestos) {
        try {
          await notificarReposicion(id);
        } catch (error) {
          console.warn(`avisos: notificar reposición de ${id} falló`, error);
        }
      }
    });
  }

  return Response.json({ ok: true, guardados });
}
