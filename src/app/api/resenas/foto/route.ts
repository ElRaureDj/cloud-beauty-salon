import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Subida de la foto de una reseña a Vercel Blob (mejora I2), con "client upload"
// (la imagen no pasa por la función). Sin BLOB_READ_WRITE_TOKEN el feature está
// apagado (503) y la UI no ofrece subir foto. Goteo por IP para que nadie pueda
// acuñar tokens y llenar el Blob sin límite. La reseña se guarda aparte con la
// URL; nada se publica sin aprobación en /admin.
const POR_HORA = 12;
const porIp = new Map<string, number[]>();

function superaGoteo(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (porIp.get(ip) ?? []).filter((m) => ahora - m < 3_600_000);
  if (recientes.length >= POR_HORA) {
    porIp.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  porIp.set(ip, recientes);
  return false;
}

function ipCliente(request: Request): string {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "no configurado" }, { status: 503 });
  }
  if (superaGoteo(ipCliente(request))) {
    return Response.json({ error: "demasiadas subidas" }, { status: 429 });
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 4 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // La reseña (con esta URL) se guarda en /api/resenas y se modera aparte.
      },
    });
    return Response.json(json);
  } catch (error) {
    console.warn("resenas/foto: subida falló", error);
    return Response.json({ error: "upload" }, { status: 400 });
  }
}
