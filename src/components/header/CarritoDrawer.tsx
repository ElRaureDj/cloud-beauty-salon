"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT, useRuta } from "@/lib/i18n/client";
import {
  DESCUENTO_BUNDLE,
  ENVIO_GRATIS_DESDE_CENTAVOS,
  textoPrecio,
} from "@/lib/formato";
import {
  bundleActivo,
  CANTIDAD_MAXIMA,
  contarArticulos,
  subtotalCarrito,
  useTienda,
  valorBundle,
} from "@/stores/carrito";
import { useExperiencia } from "@/stores/experiencia";
import ModalBase from "@/components/overlays/ModalBase";

// §5.3 — Drawer lateral derecho. Persiste en localStorage. El checkout se
// habilita al decidir la pasarela (§9.2): hasta entonces, botón deshabilitado.
export default function CarritoDrawer() {
  const tr = useT();
  const { t, tf } = tr;
  const ruta = useRuta();
  const abierto = useExperiencia((s) => s.overlay === "carrito");
  const cerrar = useExperiencia((s) => s.cerrarOverlay);
  const carrito = useTienda((s) => s.carrito);
  const quitar = useTienda((s) => s.quitar);
  const setCantidad = useTienda((s) => s.setCantidad);
  const conBundle = useTienda(bundleActivo);
  const bundleIds = useTienda((s) => s.bundleIds);
  const subtotal = useTienda(subtotalCarrito);
  const baseBundle = useTienda(valorBundle);
  const articulos = useTienda(contarArticulos);

  const preciosPendientes = carrito.some((l) => l.precio === 0);
  // El descuento aplica solo a la línea de bundle (1 unidad por producto §5.3),
  // nunca a productos ajenos ni a unidades extra.
  const descuento = conBundle ? baseBundle * DESCUENTO_BUNDLE : 0;
  const pctBundle = Math.round(DESCUENTO_BUNDLE * 100);
  // Un producto lleva el descuento de rutina si está marcado como bundle (los
  // ids del bundle que están en el carrito; ver store cart-aware).
  const enRutina = (id: string) => bundleIds.includes(id);

  // Barra "envío gratis": progreso hacia el umbral con el total tras descuento
  // (mismo cálculo que el checkout). Solo con precios reales en el carrito.
  const totalTrasDescuento = subtotal - descuento;
  const umbralEnvio = ENVIO_GRATIS_DESDE_CENTAVOS / 100;
  const envioGratis = totalTrasDescuento >= umbralEnvio;
  const faltaEnvio = Math.max(0, umbralEnvio - totalTrasDescuento);
  const progresoEnvio = Math.min(1, totalTrasDescuento / umbralEnvio);

  const [pago, setPago] = useState<
    "quieto" | "cargando" | "sin-config" | "revisa" | "agotado" | "error"
  >("quieto");
  const [agotados, setAgotados] = useState<string[]>([]);

  // Si la clienta cambia el carrito, cualquier aviso previo (agotado/revisa/
  // error) queda obsoleto: se limpia para no contradecir la instrucción dada.
  useEffect(() => {
    setPago((p) => (p === "cargando" ? "cargando" : "quieto"));
    setAgotados([]);
  }, [carrito]);

  const irAlPago = async () => {
    setPago("cargando");
    try {
      const respuesta = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineas: carrito.map((l) => ({ id: l.id, cantidad: l.cantidad })),
          bundleIds: conBundle ? useTienda.getState().bundleIds : [],
          locale: tr.locale,
        }),
      });
      if (respuesta.status === 503) {
        setPago("sin-config");
        return;
      }
      if (respuesta.status === 400) {
        // El servidor rechazó el carrito: que el error diga qué revisar (§7).
        setPago("revisa");
        return;
      }
      if (respuesta.status === 409) {
        // Stock insuficiente (bloque 3): nombrar los productos agotados.
        const datos = (await respuesta.json().catch(() => ({}))) as {
          agotados?: string[];
        };
        const ids = Array.isArray(datos.agotados) ? datos.agotados : [];
        setAgotados(
          carrito.filter((l) => ids.includes(l.id)).map((l) => l.nombre),
        );
        setPago("agotado");
        return;
      }
      const datos = (await respuesta.json()) as { ok?: boolean; url?: string };
      if (!respuesta.ok || !datos.url) throw new Error("checkout");
      // Marca de checkout propio: /compra/exito solo vacía el carrito si
      // venimos de aquí (no por visitar la URL a mano o volver del historial).
      sessionStorage.setItem("cbs-checkout-en-curso", "1");
      window.location.assign(datos.url);
    } catch {
      setPago("error");
    }
  };

  return (
    <ModalBase
      abierto={abierto}
      titulo={t("carrito.titulo")}
      onCerrar={cerrar}
      lado="derecha"
    >
      {carrito.length === 0 ? (
        <div className="flex h-full flex-col">
          {/* Estado vacío que invita a actuar (§7). */}
          <p className="text-tinta-suave">{t("carrito.vacio")}</p>
          <Link href={ruta("/tienda")} onClick={cerrar} className="boton-primario mt-6 w-full">
            {t("carrito.irTienda")}
          </Link>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          {conBundle && (
            <p className="mb-3 inline-flex items-center gap-2 self-start rounded-full bg-acento/15 px-3 py-1 text-xs text-acento">
              ✦ {t("carrito.bundle")}
            </p>
          )}

          <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {carrito.map((linea) => (
              <li
                key={linea.id}
                className="rounded-2xl border border-tinta-suave/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={ruta(`/producto/${linea.id}`)}
                    onClick={cerrar}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    {linea.nombre}
                  </Link>
                  <span className="whitespace-nowrap text-xs text-tinta-suave">
                    {textoPrecio(linea.precio, tr)}
                  </span>
                </div>
                {enRutina(linea.id) && (
                  <p className="mt-1 text-xs text-acento">
                    ✦ {tf("carrito.linea.enRutina", { pct: pctBundle })}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={tf("carrito.linea.restar", { nombre: linea.nombre })}
                      onClick={() => setCantidad(linea.id, linea.cantidad - 1)}
                      className="grid h-7 w-7 place-items-center rounded-full border border-tinta-suave/30 hover:border-tinta-suave"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm">{linea.cantidad}</span>
                    <button
                      type="button"
                      aria-label={tf("carrito.linea.sumar", { nombre: linea.nombre })}
                      onClick={() => setCantidad(linea.id, linea.cantidad + 1)}
                      disabled={linea.cantidad >= CANTIDAD_MAXIMA}
                      className="grid h-7 w-7 place-items-center rounded-full border border-tinta-suave/30 hover:border-tinta-suave disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitar(linea.id)}
                    className="text-xs text-tinta-suave underline-offset-4 hover:underline"
                  >
                    {t("carrito.quitar")}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <Sugerencias ids={carrito.map((l) => l.id)} />

          <div className="mt-4 border-t border-tinta-suave/20 pt-4">
            {!preciosPendientes && subtotal > 0 && (
              <div className="mb-4">
                <p className="text-xs text-tinta-suave">
                  {envioGratis
                    ? `✓ ${t("carrito.envioGratis.logrado")}`
                    : tf("carrito.envioGratis.falta", {
                        monto: `$${faltaEnvio.toFixed(2)}`,
                      })}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-tinta-suave/15">
                  <div
                    className="h-full rounded-full bg-acento transition-[width] duration-500"
                    style={{ width: `${progresoEnvio * 100}%` }}
                  />
                </div>
              </div>
            )}
            {preciosPendientes ? (
              <p className="nota-todo w-full text-center">
                {t("carrito.preciosPendientes")}
              </p>
            ) : (
              <>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm text-acento">
                    <span>{t("carrito.bundle.descuento")}</span>
                    <span>−${descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between">
                  <span>{t("carrito.subtotal")}</span>
                  <span>${(subtotal - descuento).toFixed(2)}</span>
                </div>
              </>
            )}
            {/* §9.2 RESUELTO: Stripe Checkout — precios validados en servidor. */}
            {pago === "sin-config" && (
              <p className="nota-todo mt-3 w-full text-center" role="alert">
                {t("carrito.checkout.noConfigurado")}
              </p>
            )}
            {pago === "revisa" && (
              <p className="mt-3 text-sm text-acento" role="alert">
                {t("carrito.checkout.revisa")}
              </p>
            )}
            {pago === "agotado" && (
              <p className="mt-3 text-sm text-acento" role="alert">
                {agotados.length > 0
                  ? tf("carrito.checkout.agotado", {
                      productos: agotados.join(", "),
                    })
                  : t("carrito.checkout.agotadoGenerico")}
              </p>
            )}
            {pago === "error" && (
              <p className="mt-3 text-sm text-acento" role="alert">
                {t("carrito.checkout.error")}
              </p>
            )}
            <button
              type="button"
              onClick={irAlPago}
              disabled={preciosPendientes || pago === "cargando"}
              className="boton-primario mt-4 w-full disabled:opacity-40"
            >
              {pago === "cargando"
                ? t("carrito.checkout.cargando")
                : `${t("carrito.checkout")} · ${articulos}`}
            </button>
          </div>
        </div>
      )}
    </ModalBase>
  );
}

type ItemSugerido = { id: string; nombre: string; precio: number; imagen: string };

// Cross-sell del carrito (mejora I3): complementarios a lo que ya hay dentro.
// Pide sugerencias al endpoint cuando cambian los ids del carrito; al añadir uno
// entra al carrito y desaparece de la lista (re-fetch).
function Sugerencias({ ids }: { ids: string[] }) {
  const { t } = useT();
  const agregar = useTienda((s) => s.agregar);
  const [items, setItems] = useState<ItemSugerido[]>([]);
  const clave = ids.join(",");

  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    let vivo = true;
    fetch("/api/carrito/sugerencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => (r.ok ? r.json() : { sugerencias: [] }))
      .then((d: { sugerencias?: ItemSugerido[] }) => {
        if (vivo) setItems(d.sugerencias ?? []);
      })
      .catch(() => {
        if (vivo) setItems([]);
      });
    return () => {
      vivo = false;
    };
    // Se re-pide cuando cambia la composición del carrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  if (items.length === 0) return null;

  return (
    <div className="mt-4 border-t border-tinta-suave/15 pt-4">
      <p className="text-xs uppercase tracking-widest text-tinta-suave">
        {t("carrito.sugerencias")}
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((s) => (
          <li key={s.id} className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
              <Image
                src={s.imagen}
                alt=""
                width={80}
                height={80}
                sizes="40px"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{s.nombre}</span>
            <span className="whitespace-nowrap text-xs text-tinta-suave">
              ${s.precio.toFixed(2)}
            </span>
            <button
              type="button"
              aria-label={`${t("producto.agregar")}: ${s.nombre}`}
              onClick={() =>
                agregar({
                  id: s.id,
                  nombre: s.nombre,
                  precio: s.precio,
                  imagen: s.imagen,
                })
              }
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-tinta-suave/30 transition-colors hover:border-acento hover:text-acento"
            >
              +
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
