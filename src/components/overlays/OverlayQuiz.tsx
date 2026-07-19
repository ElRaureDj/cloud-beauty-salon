"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DESCUENTO_BUNDLE, nombreEtapa, textoPrecio } from "@/lib/formato";
import { useT, useRuta } from "@/lib/i18n/client";
import { GRUPOS_PATRON, PASOS_QUIZ, SWATCHES_COLOR, type PasoQuiz } from "@/lib/quiz";
import { recomendar, totalPaquete } from "@/lib/recomendador";
import { useExperiencia } from "@/stores/experiencia";
import { useTienda, type RespuestasQuiz } from "@/stores/carrito";
import ModalBase from "./ModalBase";

// Ilustración simple del patrón (§5.1: ilustraciones, no texto técnico).
function OndaPatron({ nivel }: { nivel: number }) {
  const trazos = [
    "M12 4v40", // liso
    "M12 4c6 6-6 12 0 18s-6 12 0 18", // ondulado
    "M12 4c8 4-8 9 0 14s-8 9 0 14 -8 9 0 14", // rizado
    "M12 4c9 3-9 6 0 9s-9 6 0 9 -9 6 0 9 -9 6 0 9 -9 6 0 9", // muy rizado
  ];
  return (
    <svg viewBox="0 0 24 48" className="h-12 w-6" fill="none" aria-hidden>
      <path
        d={trazos[nivel]}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Swatches({
  idLeyenda,
  leyenda,
  seleccionado,
  onElegir,
}: {
  idLeyenda: string;
  leyenda: string;
  seleccionado?: string;
  onElegir: (hex: string) => void;
}) {
  const { t } = useT();
  return (
    <div role="group" aria-labelledby={idLeyenda}>
      <p id={idLeyenda} className="mb-2 text-sm text-tinta-suave">
        {leyenda}
      </p>
      <div className="flex flex-wrap gap-2">
        {SWATCHES_COLOR.map((s) => (
          <button
            key={s.valor}
            type="button"
            title={t(s.clave)}
            aria-label={t(s.clave)}
            aria-pressed={seleccionado === s.valor}
            onClick={() => onElegir(s.valor)}
            className={`h-9 w-9 rounded-full border-2 transition-transform active:scale-90 ${
              seleccionado === s.valor
                ? "border-acento scale-110"
                : "border-tinta-suave/60"
            }`}
            style={{ backgroundColor: s.valor }}
          />
        ))}
      </div>
    </div>
  );
}

export default function OverlayQuiz() {
  const tr = useT();
  const { t, tf } = tr;
  const ruta = useRuta();
  const abierto = useExperiencia((s) => s.overlay === "quiz");
  const cerrar = useExperiencia((s) => s.cerrarOverlay);
  const abrirOverlay = useExperiencia((s) => s.abrirOverlay);
  const respuestasGuardadas = useTienda((s) => s.respuestasQuiz);
  const setRespuestasQuiz = useTienda((s) => s.setRespuestasQuiz);
  const agregar = useTienda((s) => s.agregar);
  const marcarBundle = useTienda((s) => s.marcarBundle);

  const [paso, setPaso] = useState(0);
  const [borrador, setBorrador] = useState<RespuestasQuiz>({});
  const [vista, setVista] = useState<"preguntas" | "resultado">("preguntas");

  // El store se rehidrata DESPUÉS del primer render (skipHydration): la vista
  // de resultado guardada se restaura al abrir el overlay, no al montar.
  const borradorRef = useRef(borrador);
  useEffect(() => {
    borradorRef.current = borrador;
  }, [borrador]);
  useEffect(() => {
    return useExperiencia.subscribe((actual, previo) => {
      if (actual.overlay !== "quiz" || previo.overlay === "quiz") return;
      const guardadas = useTienda.getState().respuestasQuiz;
      if (guardadas && Object.keys(borradorRef.current).length === 0) {
        setVista("resultado");
      }
    });
  }, []);

  // Cada cambio de paso mueve el foco al título: sin esto, el foco cae a
  // <body> al desmontarse el botón pulsado y el lector de pantalla enmudece.
  const tituloRef = useRef<HTMLHeadingElement | null>(null);
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    tituloRef.current?.focus();
  }, [paso, vista]);

  const respuestas =
    vista === "resultado" && respuestasGuardadas ? respuestasGuardadas : borrador;
  const recomendacion = useMemo(
    () => (vista === "resultado" ? recomendar(respuestas, tr) : null),
    [vista, respuestas, tr],
  );

  const pasoActual: PasoQuiz | undefined = PASOS_QUIZ[paso];

  const avanzar = (siguienteBorrador: RespuestasQuiz) => {
    if (paso < PASOS_QUIZ.length - 1) {
      setPaso(paso + 1);
    } else {
      setRespuestasQuiz(siguienteBorrador);
      setVista("resultado");
    }
  };

  const elegirSimple = (valor: string) => {
    if (!pasoActual) return;
    const siguiente = { ...borrador, [pasoActual.campo]: valor };
    setBorrador(siguiente);
    avanzar(siguiente);
  };

  const alternarMulti = (valor: string) => {
    if (!pasoActual) return;
    const actuales = (borrador[pasoActual.campo] as string[] | undefined) ?? [];
    let proximos: string[];
    if (valor === "ninguna") {
      proximos = actuales.includes("ninguna") ? [] : ["ninguna"];
    } else if (actuales.includes(valor)) {
      proximos = actuales.filter((v) => v !== valor);
    } else {
      proximos = [...actuales.filter((v) => v !== "ninguna"), valor];
      if (pasoActual.maximo && proximos.length > pasoActual.maximo) {
        proximos = proximos.slice(-pasoActual.maximo);
      }
    }
    setBorrador({ ...borrador, [pasoActual.campo]: proximos });
  };

  const reiniciar = () => {
    setBorrador({});
    setPaso(0);
    setVista("preguntas");
  };

  const agregarTodo = () => {
    if (!recomendacion) return;
    for (const p of recomendacion.paquete) {
      agregar({ id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen });
    }
    marcarBundle(recomendacion.paquete.map((p) => p.id));
    abrirOverlay("carrito");
  };

  const multiSeleccion = pasoActual
    ? ((borrador[pasoActual.campo] as string[] | undefined) ?? [])
    : [];

  const total = recomendacion ? totalPaquete(recomendacion.paquete) : 0;

  return (
    <ModalBase abierto={abierto} titulo={t("quiz.titulo")} onCerrar={cerrar}>
      {vista === "preguntas" && pasoActual && (
        <div>
          {/* Barra de progreso (§5.1) */}
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={PASOS_QUIZ.length}
            aria-valuenow={paso + 1}
            aria-label={tf("quiz.paso", { actual: paso + 1, total: PASOS_QUIZ.length })}
            className="h-1 w-full overflow-hidden rounded-full bg-fondo-1"
          >
            <div
              className="h-full bg-acento transition-[width] duration-300"
              style={{ width: `${((paso + 1) / PASOS_QUIZ.length) * 100}%` }}
            />
          </div>
          <p className="sr-only">
            {tf("quiz.paso", { actual: paso + 1, total: PASOS_QUIZ.length })}
          </p>

          <h3 ref={tituloRef} tabIndex={-1} className="mt-5 font-display text-xl outline-none">
            {t(pasoActual.claveTitulo)}
          </h3>
          {pasoActual.claveAyuda && (
            <p className="mt-2 text-sm text-tinta-suave">{t(pasoActual.claveAyuda)}</p>
          )}

          <div className="mt-5">
            {pasoActual.tipo === "patron" && (
              <div className="grid grid-cols-2 gap-3">
                {GRUPOS_PATRON.map((g) => (
                  <div
                    key={g.grupo}
                    role="group"
                    aria-label={t(g.clave)}
                    className="rounded-2xl border border-tinta-suave/20 p-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-1 text-tinta-suave">
                      <OndaPatron nivel={g.onda} />
                      <OndaPatron nivel={g.onda} />
                      <OndaPatron nivel={g.onda} />
                    </div>
                    <p className="mt-1 text-sm">{t(g.clave)}</p>
                    <div className="mt-2 flex justify-center gap-2">
                      {(["A", "B", "C"] as const).map((sub) => {
                        const valor = `${g.grupo}${sub}`;
                        const activo = borrador.patron === valor;
                        return (
                          <button
                            key={sub}
                            type="button"
                            aria-label={`${t(g.clave)} ${valor}`}
                            aria-pressed={activo}
                            onClick={() => elegirSimple(valor)}
                            className={`h-8 w-8 rounded-full border text-xs transition-colors ${
                              activo
                                ? "border-acento bg-acento text-acento-tinta"
                                : "border-tinta-suave/40 hover:border-acento hover:text-acento"
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pasoActual.tipo === "simple" && (
              <div className="flex flex-col gap-2">
                {pasoActual.opciones?.map((o) => {
                  const activo = borrador[pasoActual.campo] === o.valor;
                  return (
                    <button
                      key={o.valor}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => elegirSimple(o.valor)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                        activo
                          ? "border-acento"
                          : "border-tinta-suave/20 hover:border-acento"
                      }`}
                    >
                      <span className="block">{t(o.clave)}</span>
                      {o.claveDetalle && (
                        <span className="block text-sm text-tinta-suave">
                          {t(o.claveDetalle)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {pasoActual.tipo === "multi" && (
              <>
                <div className="flex flex-wrap gap-2">
                  {pasoActual.opciones?.map((o) => {
                    const activo = multiSeleccion.includes(o.valor);
                    return (
                      <button
                        key={o.valor}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => alternarMulti(o.valor)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          activo
                            ? "border-acento bg-acento text-acento-tinta"
                            : "border-tinta-suave/30 hover:border-tinta-suave"
                        }`}
                      >
                        {t(o.clave)}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={multiSeleccion.length === 0}
                  onClick={() => avanzar(borrador)}
                  className="boton-primario mt-5 w-full disabled:opacity-40"
                >
                  {paso === PASOS_QUIZ.length - 1 ? t("quiz.verRutina") : t("quiz.siguiente")}
                </button>
              </>
            )}

            {pasoActual.tipo === "colores" && (
              <div className="flex flex-col gap-4">
                <Swatches
                  idLeyenda="leyenda-color-original"
                  leyenda={t("quiz.pregunta.colores.original")}
                  seleccionado={borrador.colorOriginal}
                  onElegir={(hex) => setBorrador({ ...borrador, colorOriginal: hex })}
                />
                <Swatches
                  idLeyenda="leyenda-color-actual"
                  leyenda={t("quiz.pregunta.colores.actual")}
                  seleccionado={borrador.colorActual}
                  onElegir={(hex) => setBorrador({ ...borrador, colorActual: hex })}
                />
                <button
                  type="button"
                  disabled={!borrador.colorOriginal || !borrador.colorActual}
                  onClick={() => avanzar(borrador)}
                  className="boton-primario w-full disabled:opacity-40"
                >
                  {t("quiz.siguiente")}
                </button>
              </div>
            )}
          </div>

          {/* Se puede saltar en cualquier momento a /tienda (§5.1) */}
          <div className="mt-6 flex items-center justify-between text-sm text-tinta-suave">
            {paso > 0 ? (
              <button
                type="button"
                onClick={() => setPaso(paso - 1)}
                className="underline-offset-4 hover:underline"
              >
                {t("quiz.atras")}
              </button>
            ) : (
              <span />
            )}
            <Link
              href={ruta("/tienda")}
              onClick={cerrar}
              className="underline-offset-4 hover:underline"
            >
              {t("quiz.saltar")}
            </Link>
          </div>
        </div>
      )}

      {vista === "resultado" && recomendacion && (
        <div>
          <p className="text-sm text-tinta-suave">{t("quiz.resultado.etapa")}</p>
          <p ref={tituloRef} tabIndex={-1} className="font-display text-3xl text-acento outline-none">
            {nombreEtapa(recomendacion.etapaPrincipal, tr)}
          </p>

          <ul className="mt-4 flex flex-col gap-2 text-sm text-tinta-suave">
            {recomendacion.razones.map((razon) => (
              <li key={razon} className="flex gap-2">
                <span aria-hidden className="text-acento">
                  ·
                </span>
                {razon}
              </li>
            ))}
          </ul>

          <ul className="mt-5 flex flex-col gap-2">
            {recomendacion.paquete.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-tinta-suave/20 px-4 py-3"
              >
                <div>
                  <p className="text-sm">{p.nombre}</p>
                  <p className="text-xs text-tinta-suave">{p.linea}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-tinta-suave">
                  {textoPrecio(p.precio, tr)}
                </span>
              </li>
            ))}
          </ul>

          {/* §5.2: precio del bundle y ahorro vs. suelto (con catálogo real). */}
          {total > 0 ? (
            <div className="mt-4 text-sm">
              <div className="flex justify-between">
                <span>{t("quiz.resultado.total")}</span>
                <span>${(total * (1 - DESCUENTO_BUNDLE)).toFixed(2)}</span>
              </div>
              <p className="mt-1 text-acento">
                {tf("quiz.resultado.ahorro", {
                  ahorro: `$${(total * DESCUENTO_BUNDLE).toFixed(2)}`,
                })}
              </p>
            </div>
          ) : (
            <p className="nota-todo mt-4">{t("quiz.resultado.precioPendiente")}</p>
          )}

          <button type="button" onClick={agregarTodo} className="boton-primario mt-5 w-full">
            {t("quiz.resultado.agregarTodo")}
          </button>
          <div className="mt-4 flex items-center justify-between text-sm text-tinta-suave">
            <button
              type="button"
              onClick={reiniciar}
              className="underline-offset-4 hover:underline"
            >
              {t("quiz.resultado.repetir")}
            </button>
            <Link
              href={ruta("/tienda")}
              onClick={cerrar}
              className="underline-offset-4 hover:underline"
            >
              {t("cap2.verTienda")}
            </Link>
          </div>
        </div>
      )}
    </ModalBase>
  );
}
