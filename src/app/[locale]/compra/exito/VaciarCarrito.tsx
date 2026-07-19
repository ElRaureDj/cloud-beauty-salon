"use client";

import { useEffect } from "react";
import { useTienda } from "@/stores/carrito";

// Tras un pago confirmado, el carrito local se vacía — pero SOLO si venimos
// de un checkout iniciado aquí (marca en sessionStorage): visitar la URL a
// mano o volver por historial no debe destruir un carrito nuevo.
export default function VaciarCarrito() {
  useEffect(() => {
    if (sessionStorage.getItem("cbs-checkout-en-curso") !== "1") return;
    sessionStorage.removeItem("cbs-checkout-en-curso");
    void useTienda.persist.rehydrate();
    useTienda.getState().vaciar();
  }, []);
  return null;
}
