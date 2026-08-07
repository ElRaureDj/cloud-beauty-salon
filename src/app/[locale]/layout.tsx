import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import Analitica from "@/components/marketing/Analitica";
import "../globals.css";
import Header from "@/components/header/Header";
import PieGlobal from "@/components/PieGlobal";
import { getT, isLocale, LOCALES } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/client";
import Script from "next/script";
import { FONDO_POR_TEMA, SCRIPT_TEMA } from "@/lib/tema";

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

// Bilingüe (§9): "/" = español (por defecto, sin prefijo), "/en" = inglés. El
// proxy reescribe internamente a /es y /en; aquí prerenderizamos ambos.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: LayoutProps<"/[locale]">,
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const { t } = getT(locale);
  const marca = t("marca.nombre");
  // Título limpio: marca + tagline sin el punto final.
  const tagline = t("hero.tagline").replace(/\.$/, "");
  const titulo = `${marca} · ${tagline}`;
  const descripcion = t("meta.descripcion");
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com",
    ),
    title: { default: titulo, template: `%s · ${marca}` },
    description: descripcion,
    // Tarjetas al compartir (§ bloque 4). La imagen la aporta opengraph-image.tsx
    // por marca; las fichas de producto la sobrescriben con su packshot.
    openGraph: {
      type: "website",
      siteName: marca,
      title: titulo,
      description: descripcion,
      locale: locale === "en" ? "en_US" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
    },
  };
}

export const viewport: Viewport = {
  // Un color por tema: la barra del navegador en móvil acompaña al fondo. Esto
  // cubre el modo "auto"; si la clienta elige un tema CONTRA el ajuste de su
  // sistema, el store reescribe estos <meta> al vuelo (ver stores/tema.ts).
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: FONDO_POR_TEMA.oscuro },
    { media: "(prefers-color-scheme: light)", color: FONDO_POR_TEMA.claro },
  ],
};

export default async function RootLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${display.variable} ${sans.variable} h-full antialiased`}
      // El script del tema escribe data-tema en <html> antes de hidratar:
      // sin esto React avisa de que el atributo no coincide con el HTML
      // del servidor (que no puede conocer la elección de la clienta).
      suppressHydrationWarning
    >
      <head>
        {/* Antes del primer pintado: aplica el tema guardado. Sin esto, quien
            eligió "claro" vería un fogonazo oscuro en cada carga (el HTML es
            estático y el servidor no puede conocer su elección). */}
        <Script
          id="tema-inicial"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }}
        />
      </head>
      <body className="min-h-full bg-fondo-0 font-sans text-tinta">
        <LocaleProvider locale={locale}>
          <Header />
          {props.children}
          <PieGlobal />
        </LocaleProvider>
        {/* Analítica de 1er nivel de Vercel (§ bloque 4): visitas y velocidad
            reales SIN cookies de rastreo (no requiere banner de consentimiento).
            Con beforeSend que redacta los tokens del boletín (ver Analitica). */}
        <Analitica />
      </body>
    </html>
  );
}
