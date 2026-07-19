"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT, useRuta } from "@/lib/i18n/client";
import { DESCUENTO_BUNDLE, textoPrecio } from "@/lib/formato";
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
  const subtotal = useTienda(subtotalCarrito);
  const baseBundle = useTienda(valorBundle);
  const articulos = useTienda(contarArticulos);

  const preciosPendientes = carrito.some((l) => l.precio === 0);
  // El descuento aplica solo a la línea de bundle (1 unidad por producto §5.3),
  // nunca a productos ajenos ni a unidades extra.
  const descuento = conBundle ? baseBundle * DESCUENTO_BUNDLE : 0;

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

          <div className="mt-4 border-t border-tinta-suave/20 pt-4">
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
