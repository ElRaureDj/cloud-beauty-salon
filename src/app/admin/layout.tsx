import type { Metadata, Viewport } from "next";
import "../globals.css";
import Script from "next/script";
import { FONDO_POR_TEMA, SCRIPT_TEMA } from "@/lib/tema";

// Layout raíz del panel interno (fuera de [locale]): aporta su propio <html> y
// no se indexa. Español, sin las tipografías de la marca (herramienta interna).
export const metadata: Metadata = {
  title: "Admin · Cloud Beauty Salon",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: FONDO_POR_TEMA.oscuro },
    { media: "(prefers-color-scheme: light)", color: FONDO_POR_TEMA.claro },
  ],
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: el script del tema escribe data-tema en
    // <html> ANTES de hidratar, así que el atributo del DOM no coincide
    // con el del HTML del servidor. Es exactamente para esto.
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Mismo script que la tienda: el panel obedece la preferencia que
            eligió Disleny, no solo el ajuste del sistema. */}
        <Script
          id="tema-inicial"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }}
        />
      </head>
      <body className="min-h-full bg-fondo-0 font-sans text-tinta">
        {children}
      </body>
    </html>
  );
}
