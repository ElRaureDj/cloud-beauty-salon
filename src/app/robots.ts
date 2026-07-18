import type { MetadataRoute } from "next";

// TODO(guion §9.5): sustituir por el dominio real de {{MARCA}}.
const BASE = "https://example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
