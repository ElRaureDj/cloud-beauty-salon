import { iniciarSesion, passwordCorrecta } from "@/lib/admin-auth";

// Login del panel /admin. Compara la contraseña con ADMIN_PASSWORD (en tiempo
// constante) y, si acierta, deja una cookie de sesión firmada. Goteo por IP
// para frenar fuerza bruta. Sin ADMIN_SECRET/ADMIN_PASSWORD → nunca autentica.

const INTENTOS_POR_HORA = 10;
const porIp = new Map<string, number[]>();

function superaGoteo(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (porIp.get(ip) ?? []).filter(
    (marca) => ahora - marca < 60 * 60 * 1000,
  );
  if (recientes.length >= INTENTOS_POR_HORA) {
    porIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  porIp.set(ip, recientes);
  return false;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (superaGoteo(ip)) {
    return Response.json({ ok: false }, { status: 429 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const password = (cuerpo as Record<string, unknown> | null)?.password;
  if (!(await passwordCorrecta(password))) {
    return Response.json({ ok: false }, { status: 401 });
  }

  // Contraseña correcta pero sin ADMIN_SECRET no se puede firmar la sesión.
  if (!(await iniciarSesion())) {
    return Response.json({ ok: false, configurado: false }, { status: 503 });
  }

  return Response.json({ ok: true });
}
