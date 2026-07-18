import type { MetadataRoute } from "next";
import { CATALOGO } from "@/lib/catalogo";

// TODO(guion §9.5): sustituir por el dominio real de {{MARCA}}.
const BASE = "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/tienda`, priority: 0.9 },
    ...CATALOGO.map((p) => ({
      url: `${BASE}/producto/${p.id}`,
      priority: 0.7,
    })),
  ];
}
