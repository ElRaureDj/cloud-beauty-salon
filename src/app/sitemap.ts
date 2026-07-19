import type { MetadataRoute } from "next";
import { CATALOGO } from "@/lib/catalogo";

// §9.5: dominio real; en previews puede sobrescribirse con NEXT_PUBLIC_SITE_URL.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/tienda`, priority: 0.9 },
    ...CATALOGO.map((p) => ({
      url: `${BASE}/producto/${p.id}`,
      priority: 0.7,
    })),
    { url: `${BASE}/contacto`, priority: 0.3 },
    { url: `${BASE}/legal/envios`, priority: 0.3 },
    { url: `${BASE}/legal/privacidad`, priority: 0.2 },
    { url: `${BASE}/legal/terminos`, priority: 0.2 },
  ];
}
