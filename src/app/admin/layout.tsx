import type { Metadata } from "next";
import "../globals.css";

// Layout raíz del panel interno (fuera de [locale]): aporta su propio <html> y
// no se indexa. Español, sin las tipografías de la marca (herramienta interna).
export const metadata: Metadata = {
  title: "Admin · Cloud Beauty Salon",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-fondo-0 font-sans text-tinta">
        {children}
      </body>
    </html>
  );
}
