import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header/Header";

// TODO(guion): tipografías placeholder hasta tener el manual de marca (§3, §8):
// 1 display con carácter para titulares + 1 sans legible para todo lo demás.
const display = Bricolage_Grotesque({
  variable: "--font-display-base",
  subsets: ["latin"],
});

const sans = Inter({
  variable: "--font-sans-base",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // TODO(guion): reemplazar {{MARCA}} cuando haya nombre y dominio (§9.5).
  title: {
    default: "{{MARCA}} · Tu pelo, versión profesional",
    template: "%s · {{MARCA}}",
  },
  description:
    "Cosmética capilar profesional Trust, diagnóstico capilar y rutinas a tu medida. Muy pronto: peluquería, manicura y pedicura.",
};

export const viewport: Viewport = {
  themeColor: "#171012",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full bg-fondo-0 font-sans text-tinta">
        <Header />
        {children}
      </body>
    </html>
  );
}
