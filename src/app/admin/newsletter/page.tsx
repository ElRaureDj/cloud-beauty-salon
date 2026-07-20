import Link from "next/link";
import { estaAutenticado } from "@/lib/admin-auth";
import { hayBD } from "@/lib/db";
import { suscriptorasConfirmadas } from "@/lib/newsletter";
import LoginAdmin from "../LoginAdmin";

// Lista del boletín (bloque 4): solo emails CONFIRMADOS (doble opt-in). Vista
// de solo lectura para copiar/exportar; las bajas van por el enlace del correo.
export default async function PaginaAdminNewsletter() {
  if (!(await estaAutenticado())) return <LoginAdmin />;

  const lista = hayBD() ? await suscriptorasConfirmadas() : [];
  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cloudbeautysalon.com";
  const urlBaja = (locale: string, token: string) =>
    `${origen}${locale === "en" ? "/en" : ""}/newsletter/baja?token=${token}`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl">Newsletter · {lista.length}</h1>
        <Link
          href="/admin"
          className="text-sm text-acento underline-offset-4 hover:underline"
        >
          ← Stock
        </Link>
      </header>

      {lista.length === 0 ? (
        <p className="mt-6 text-tinta-suave">
          Aún no hay suscriptoras confirmadas.
        </p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-tinta-suave/15">
            {lista.map((s) => (
              <li
                key={s.email}
                className="flex items-center justify-between gap-4 py-2 text-sm"
              >
                <span className="truncate">{s.email}</span>
                <span className="shrink-0 text-xs uppercase text-tinta-suave">
                  {s.locale}
                </span>
              </li>
            ))}
          </ul>
          {/* Copiable email + URL de baja (TAB). La política promete un enlace
              de baja en cada correo: incluye la columna al montar el boletín. */}
          <p className="mt-6 text-xs text-tinta-suave">
            Para copiar (email · enlace de baja, separados por tabulador):
          </p>
          <pre className="mt-2 max-h-60 overflow-auto rounded-2xl border border-tinta-suave/20 p-4 text-xs">
            {lista
              .map((s) => `${s.email}\t${urlBaja(s.locale, s.token)}`)
              .join("\n")}
          </pre>
          <p className="mt-3 text-xs text-tinta-suave">
            Al enviar el boletín, incluye el enlace de baja de cada persona (o
            usa Broadcasts/Audiences de Resend con baja automática).
          </p>
        </>
      )}
    </main>
  );
}
