import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Header from "@/components/header/Header";
import { getT, isLocale, LOCALES } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/client";

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
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com",
    ),
    title: { default: `${marca} · ${tagline}`, template: `%s · ${marca}` },
    description: t("meta.descripcion"),
  };
}

export const viewport: Viewport = {
  themeColor: "#171012",
};

export default async function RootLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-fondo-0 font-sans text-tinta">
        <LocaleProvider locale={locale}>
          <Header />
          {props.children}
        </LocaleProvider>
      </body>
    </html>
  );
}
