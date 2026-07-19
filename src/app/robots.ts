import type { MetadataRoute } from "next";

// §9.5: dominio real; en previews puede sobrescribirse con NEXT_PUBLIC_SITE_URL.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
