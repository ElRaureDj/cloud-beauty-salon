"use client";

import { useEffect } from "react";
import { useVistos } from "@/stores/vistos";

// Registra la visita a una ficha en "vistos recientemente" (mejora H2). No pinta
// nada; se monta en la página de producto.
export default function RegistrarVisto({ id }: { id: string }) {
  useEffect(() => {
    void useVistos.persist.rehydrate();
    useVistos.getState().registrar(id);
  }, [id]);
  return null;
}
