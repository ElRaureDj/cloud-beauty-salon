import { estaAutenticado } from "@/lib/admin-auth";
import { marcarEnviado } from "@/lib/pedidos";

// Marca un pedido como enviado / pendiente desde el panel (mejora M3).
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

  const { session_id, enviado } = (cuerpo as Record<string, unknown> | null) ?? {};
  if (typeof session_id !== "string" || !session_id || typeof enviado !== "boolean") {
    return Response.json({ ok: false }, { status: 400 });
  }

  await marcarEnviado(session_id, enviado);
  return Response.json({ ok: true });
}
