"use client";

import { useState } from "react";
import { t } from "@/lib/i18n/es";
import { useExperiencia, type Overlay } from "@/stores/experiencia";
import ModalBase from "./ModalBase";

// §5.4 — Un solo formulario reutilizado por peluquería, manicura y pedicura:
// nombre + WhatsApp o email + interés (checkboxes) → POST /api/waitlist.
// El icono de origen preselecciona su interés (cap. 6: "también me interesa
// pedicura" es exactamente este checkbox).
const ORIGENES: Partial<Record<Overlay, Interes>> = {
  "espera-peluqueria": "peluqueria",
  "espera-manicura": "manicura",
  "espera-pedicura": "pedicura",
};

type Interes = "peluqueria" | "manicura" | "pedicura";

const INTERESES: Array<{ valor: Interes; clave: Parameters<typeof t>[0] }> = [
  { valor: "peluqueria", clave: "cap2.peluqueria" },
  { valor: "manicura", clave: "cap4.manicura" },
  { valor: "pedicura", clave: "cap6.pedicura" },
];

type Estado = "editando" | "enviando" | "exito" | "error" | "invalido";

export default function ModalListaEspera() {
  const overlay = useExperiencia((s) => s.overlay);
  const cerrar = useExperiencia((s) => s.cerrarOverlay);
  const origen = ORIGENES[overlay];
  const abierto = origen !== undefined;

  const titulo = origen
    ? origen === "peluqueria"
      ? t("cap2.peluqueria")
      : origen === "manicura"
        ? t("cap4.manicura")
        : t("cap6.pedicura")
    : t("espera.titulo");

  return (
    <ModalBase abierto={abierto} titulo={titulo} onCerrar={cerrar}>
      {/* key por origen: cada icono abre el formulario con su interés
          preseleccionado (§4 caps. 2/4/6) sin sincronizar estado en efectos. */}
      {origen && <FormularioEspera key={origen} origen={origen} onCerrar={cerrar} />}
    </ModalBase>
  );
}

function FormularioEspera({
  origen,
  onCerrar,
}: {
  origen: Interes;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [intereses, setIntereses] = useState<Interes[]>([origen]);
  const [estado, setEstado] = useState<Estado>("editando");
  const [miel, setMiel] = useState(""); // honeypot anti-bots

  const alternarInteres = (interes: Interes) => {
    setIntereses((previos) =>
      previos.includes(interes)
        ? previos.filter((i) => i !== interes)
        : [...previos, interes],
    );
  };

  // Mismas reglas que el servidor (route.ts): email con '@' y '.', o
  // teléfono con ≥7 dígitos; nombre de 2+ caracteres.
  const contactoValido = (valor: string) =>
    (valor.includes("@") && valor.includes(".")) ||
    valor.replace(/\D/g, "").length >= 7;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      nombre.trim().length < 2 ||
      !contactoValido(contacto) ||
      intereses.length === 0
    ) {
      setEstado("invalido");
      return;
    }
    setEstado("enviando");
    try {
      const respuesta = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: contacto.trim(),
          intereses,
          web: miel, // honeypot: los humanos lo dejan vacío
        }),
      });
      if (respuesta.status === 400) {
        // Si cliente y servidor divergen, el error debe decir qué falta,
        // no culpar a la conexión (§7).
        setEstado("invalido");
        return;
      }
      if (!respuesta.ok) throw new Error(String(respuesta.status));
      setEstado("exito");
      setNombre("");
      setContacto("");
    } catch {
      setEstado("error");
    }
  };

  return (
    <>
      {estado === "exito" ? (
        <div>
          {/* El foco viaja al mensaje: el lector de pantalla anuncia el éxito
              aunque el botón de envío se haya desmontado. */}
          <p
            role="status"
            tabIndex={-1}
            ref={(el) => el?.focus()}
            className="font-display text-2xl text-acento outline-none"
          >
            {t("espera.exito")}
          </p>
          <button type="button" onClick={onCerrar} className="boton-secundario mt-6 w-full">
            {t("comun.cerrar")}
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate>
          <p className="text-sm text-tinta-suave">{t("espera.intro")}</p>

          {/* Honeypot: invisible para humanos; los bots que lo rellenen
              reciben un éxito falso sin escribir nada (route.ts). */}
          <input
            type="text"
            name="web"
            value={miel}
            onChange={(e) => setMiel(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-px w-px opacity-0"
          />

          <label className="mt-4 block text-sm" htmlFor="espera-nombre">
            {t("espera.nombre")}
          </label>
          <input
            id="espera-nombre"
            name="nombre"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-3 outline-none focus:border-acento"
          />

          <label className="mt-4 block text-sm" htmlFor="espera-contacto">
            {t("espera.contacto")}
          </label>
          <input
            id="espera-contacto"
            name="contacto"
            inputMode="email"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-3 outline-none focus:border-acento"
          />

          <fieldset className="mt-4">
            <legend className="text-sm">{t("espera.intereses")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESES.map((interes) => {
                const activo = intereses.includes(interes.valor);
                return (
                  <label
                    key={interes.valor}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-acento has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-fondo-0 ${
                      activo
                        ? "border-acento bg-acento text-acento-tinta"
                        : "border-tinta-suave/30 hover:border-tinta-suave"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={activo}
                      onChange={() => alternarInteres(interes.valor)}
                    />
                    {t(interes.clave)}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {estado === "invalido" && (
            <p role="alert" className="mt-3 text-sm text-acento">
              {t("espera.validacion")}
            </p>
          )}
          {estado === "error" && (
            <p role="alert" className="mt-3 text-sm text-acento">
              {t("espera.error")}
            </p>
          )}

          <button
            type="submit"
            disabled={estado === "enviando"}
            className="boton-primario mt-5 w-full disabled:opacity-40"
          >
            {estado === "enviando" ? t("espera.enviando") : t("espera.enviar")}
          </button>
        </form>
      )}
    </>
  );
}
