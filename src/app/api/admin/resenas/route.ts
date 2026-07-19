import { estaAutenticado } from "@/lib/admin-auth";
import { aprobarResena, eliminarResena } from "@/lib/resenas";

// Modera una reseña desde el panel (bloque 3): aprobar (se publica) o eliminar.
// Protegido por la cookie de sesión del admin.
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

  const { id, accion } = (cuerpo as Record<string, unknown> | null) ?? {};
  if (typeof id !== "number" || !Number.isInteger(id)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (accion === "aprobar") {
    await aprobarResena(id);
  } else if (accion === "eliminar") {
    await eliminarResena(id);
  } else {
    return Response.json({ ok: false }, { status: 400 });
  }

  return Response.json({ ok: true });
}
