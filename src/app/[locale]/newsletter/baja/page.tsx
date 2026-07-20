import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";
import { bajaNewsletter } from "@/lib/newsletter";

// Baja del boletín (enlace presente en los envíos a confirmadas). El GET es de
// SOLO LECTURA: muestra un botón y el borrado ocurre en el POST (server
// action) — RFC 8058: si el GET borrara, los escáneres de correo darían de
// baja a suscriptoras sin querer al detonar los enlaces del email. Repetir el
// POST muestra el mismo éxito ("ya no estás en la lista" es verdad igual).
// Página de token → no se indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PaginaBaja(
  props: PageProps<"/[locale]/newsletter/baja">,
) {
  const { locale } = await props.params;
  const busqueda = await props.searchParams;
  const token = typeof busqueda.token === "string" ? busqueda.token : "";
  const resultado = typeof busqueda.e === "string" ? busqueda.e : "";

  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  const rutaPagina = rutaLocalizada(loc, "/newsletter/baja");

  async function accionBaja(formData: FormData) {
    "use server";
    const tk = String(formData.get("token") ?? "");
    let e: "ok" | "err";
    try {
      await bajaNewsletter(tk);
      e = "ok";
    } catch (error) {
      console.error("newsletter: baja falló", error);
      e = "err";
    }
    // redirect lanza NEXT_REDIRECT: siempre fuera del try/catch.
    redirect(`${rutaPagina}?e=${e}`);
  }

  const volver = {
    href: rutaLocalizada(loc, "/"),
    texto: t("tienda.volver").replace("← ", ""),
  };

  // Resultado tras el POST (la URL ya no lleva token).
  if (resultado === "ok" || resultado === "err") {
    const ok = resultado === "ok";
    return (
      <main className="grid min-h-svh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-4xl text-acento" aria-hidden>
            {ok ? "✦" : "…"}
          </p>
          <h1 className="mt-3 font-display text-3xl">
            {ok ? t("news.baja.titulo") : t("news.confirmar.ko.titulo")}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-tinta-suave">
            {ok ? t("news.baja.ok") : t("news.noDisponible")}
          </p>
          <Link href={volver.href} className="boton-secundario mt-8 inline-block">
            {volver.texto}
          </Link>
        </div>
      </main>
    );
  }

  // GET sin token → enlace no válido (sin tocar la BD).
  if (!token) {
    return (
      <main className="grid min-h-svh place-items-center px-6 text-center">
        <div>
          <p className="font-display text-4xl text-acento" aria-hidden>
            …
          </p>
          <h1 className="mt-3 font-display text-3xl">
            {t("news.confirmar.ko.titulo")}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-tinta-suave">
            {t("news.confirmar.ko")}
          </p>
          <Link href={volver.href} className="boton-secundario mt-8 inline-block">
            {volver.texto}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-4xl text-acento" aria-hidden>
          ✦
        </p>
        <h1 className="mt-3 font-display text-3xl">{t("news.baja.titulo")}</h1>
        <p className="mx-auto mt-3 max-w-sm text-tinta-suave">
          {t("news.baja.intro")}
        </p>
        <form action={accionBaja} className="mt-8">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="boton-secundario">
            {t("news.email.baja")}
          </button>
        </form>
      </div>
    </main>
  );
}
