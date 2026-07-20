import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Subida de la foto de una reseña a Vercel Blob (mejora I2), con "client upload"
// (la imagen no pasa por la función). Sin BLOB_READ_WRITE_TOKEN el feature está
// apagado (503) y la UI no ofrece subir foto. La reseña se guarda aparte con la
// URL devuelta; nada se publica sin aprobación en /admin.
export async function POST(request: Request): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "no configurado" }, { status: 503 });
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
