import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT, resolverLocale } from "@/lib/i18n";
import { rutaLocalizada } from "@/lib/i18n/rutas";
import { confirmarNewsletter, existeToken } from "@/lib/newsletter";

// Destino del enlace del correo de doble opt-in (bloque 4). El GET es de SOLO
// LECTURA: muestra un botón y la mutación ocurre en el POST (server action).
// Los escáneres de correo corporativos (SafeLinks, Proofpoint…) detonan con
// GET todos los enlaces de un email: si el GET confirmara, una máquina — no la
// persona — estamparía el consentimiento del doble opt-in. Tras el POST se
// redirige sin token en la URL. Página de token → no se indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PaginaConfirmar(
  props: PageProps<"/[locale]/newsletter/confirmar">,
) {
  const { locale } = await props.params;
  const busqueda = await props.searchParams;
  const token = typeof busqueda.token === "string" ? busqueda.token : "";
  const resultado = typeof busqueda.e === "string" ? busqueda.e : "";

  const loc = resolverLocale(locale);
  const { t } = getT(loc);
  const rutaPagina = rutaLocalizada(loc, "/newsletter/confirmar");

  async function accionConfirmar(formData: FormData) {
    "use server";
    const tk = String(formData.get("token") ?? "");
    let e: "ok" | "ko" | "err";
    try {
      e = (await confirmarNewsletter(tk)) ? "ok" : "ko";
    } catch (error) {
      console.error("newsletter: confirmar falló", error);
      e = "err";
    }
    // redirect lanza NEXT_REDIRECT: siempre fuera del try/catch.
    redirect(`${rutaPagina}?e=${e}`);
  }

  // Resultado tras el POST (la URL ya no lleva token).
  if (resultado === "ok" || resultado === "ko" || resultado === "err") {
    const ok = resultado === "ok";
    return (
      <Pantalla
        icono={ok ? "✦" : "…"}
        titulo={ok ? t("news.confirmar.titulo") : t("news.confirmar.ko.titulo")}
        mensaje={
          ok
            ? t("news.confirmar.ok")
            : resultado === "err"
              ? t("news.noDisponible")
              : t("news.confirmar.ko")
        }
        volver={{ href: rutaLocalizada(loc, "/"), texto: t("tienda.volver").replace("← ", "") }}
      />
    );
  }

  // GET inicial: comprobar (solo lectura) que el token existe.
  let existe = false;
  let fallo = false;
  try {
    existe = token ? await existeToken(token) : false;
  } catch (error) {
    console.error("newsletter: lectura de token falló", error);
    fallo = true;
  }

  if (fallo || !existe) {
    return (
      <Pantalla
        icono="…"
        titulo={t("news.confirmar.ko.titulo")}
        mensaje={fallo ? t("news.noDisponible") : t("news.confirmar.ko")}
        volver={{ href: rutaLocalizada(loc, "/"), texto: t("tienda.volver").replace("← ", "") }}
      />
    );
  }

  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-4xl text-acento" aria-hidden>
          ✦
        </p>
        <h1 className="mt-3 font-display text-3xl">{t("news.titulo")}</h1>
        <p className="mx-auto mt-3 max-w-sm text-tinta-suave">
          {t("news.confirmar.intro")}
        </p>
        <form action={accionConfirmar} className="mt-8">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="boton-primario">
            {t("news.email.boton")}
          </button>
        </form>
      </div>
    </main>
  );
}

function Pantalla({
  icono,
  titulo,
  mensaje,
  volver,
}: {
  icono: string;
  titulo: string;
  mensaje: string;
  volver: { href: string; texto: string };
}) {
  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-4xl text-acento" aria-hidden>
          {icono}
        </p>
        <h1 className="mt-3 font-display text-3xl">{titulo}</h1>
        <p className="mx-auto mt-3 max-w-sm text-tinta-suave">{mensaje}</p>
        <Link href={volver.href} className="boton-primario mt-8 inline-block">
          {volver.texto}
        </Link>
      </div>
    </main>
  );
}
