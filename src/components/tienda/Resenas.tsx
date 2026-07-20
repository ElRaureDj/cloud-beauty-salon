"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useT } from "@/lib/i18n/client";

// Fotos de reseña: solo si Vercel Blob está configurado (variable pública que
// Raul enciende al activar Blob). Sin ella, no se ofrece subir foto.
const FOTOS_ACTIVAS = process.env.NEXT_PUBLIC_RESENAS_FOTO === "1";

type ResenaPublica = {
  id: number;
  autor: string;
  rating: number;
  texto: string;
  fecha: string;
  verificada: boolean;
  foto: string | null;
};
type Resumen = { items: ResenaPublica[]; total: number; media: number };
type Estado = { activo: boolean; resenas: Resumen };

function Estrellas({ valor, clase = "text-base" }: { valor: number; clase?: string }) {
  const llenas = Math.round(valor);
  return (
    <span aria-hidden className={`${clase} leading-none tracking-tight`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < llenas ? "text-acento" : "text-tinta-suave/30"}>
          ★
        </span>
      ))}
    </span>
  );
}

// Sección de reseñas de una ficha (bloque 3). La ficha es estática; esto pide
// las reseñas aprobadas al montar y ofrece un formulario moderado. Sin BD
// (activo=false) la sección no se muestra: no invita a opinar donde no se puede.
export default function Resenas({ productoId }: { productoId: string }) {
  const { t } = useT();
  const [estado, setEstado] = useState<Estado | null>(null);

  const cargar = () => {
    fetch(`/api/producto/estado?id=${encodeURIComponent(productoId)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { activo?: boolean; resenas?: Resumen } | null) =>
        setEstado({
          activo: d?.activo ?? false,
          resenas: d?.resenas ?? { items: [], total: 0, media: 0 },
        }),
      )
      .catch(() => setEstado({ activo: false, resenas: { items: [], total: 0, media: 0 } }));
  };
  useEffect(cargar, [productoId]);

  // Aún cargando, o BD no disponible → no renderizar la sección.
  if (!estado || !estado.activo) return null;

  const { resenas } = estado;
  return (
    <section className="mt-14 border-t border-tinta-suave/15 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">{t("resenas.titulo")}</h2>
        {resenas.total > 0 && (
          <p className="flex items-center gap-2 text-sm text-tinta-suave">
            <Estrellas valor={resenas.media} clase="text-sm" />
            {resenas.media.toFixed(1)} {t("resenas.de5")} · {resenas.total}
          </p>
        )}
      </div>

      {resenas.total === 0 ? (
        <p className="mt-3 text-tinta-suave">{t("resenas.vacio")}</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {resenas.items.map((r) => (
            <li key={r.id} className="rounded-2xl border border-tinta-suave/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {r.autor}
                  {r.verificada && (
                    <span className="rounded-full border border-acento/50 px-2 py-0.5 text-[10px] font-normal text-acento">
                      ✓ {t("resenas.verificada")}
                    </span>
                  )}
                </span>
                <Estrellas valor={r.rating} clase="text-sm" />
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-tinta-suave">
                {r.texto}
              </p>
              {r.foto && (
                <a href={r.foto} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={r.foto}
                    alt=""
                    width={400}
                    height={400}
                    className="mt-3 h-28 w-28 rounded-xl object-cover"
                  />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <FormularioResena productoId={productoId} onEnviada={cargar} />
    </section>
  );
}

function FormularioResena({
  productoId,
  onEnviada,
}: {
  productoId: string;
  onEnviada: () => void;
}) {
  const { t, tf } = useT();
  const [abierto, setAbierto] = useState(false);
  const [autor, setAutor] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [miel, setMiel] = useState("");
  const [estado, setEstado] = useState<
    "editando" | "enviando" | "exito" | "error" | "invalido"
  >("editando");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (autor.trim().length < 2 || rating < 1 || texto.trim().length < 3) {
      setEstado("invalido");
      return;
    }
    setEstado("enviando");
    try {
      // Si hay foto y el feature está activo, se sube primero a Blob; si la
      // subida falla, la reseña se envía igual sin foto.
      let fotoUrl: string | null = null;
      if (FOTOS_ACTIVAS && foto) {
        try {
          const blob = await upload(
            `resenas/${productoId}-${Date.now()}-${foto.name}`,
            foto,
            { access: "public", handleUploadUrl: "/api/resenas/foto" },
          );
          fotoUrl = blob.url;
        } catch {
          fotoUrl = null;
        }
      }
      const r = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: productoId,
          autor: autor.trim(),
          email: email.trim(),
          rating,
          texto: texto.trim(),
          foto: fotoUrl,
          web: miel,
        }),
      });
      if (r.status === 400) {
        setEstado("invalido");
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      setEstado("exito");
      setAutor("");
      setEmail("");
      setRating(0);
      setTexto("");
      setFoto(null);
      onEnviada();
    } catch {
      setEstado("error");
    }
  };

  if (estado === "exito") {
    return (
      <p role="status" className="mt-6 text-sm text-acento">
        {t("resenas.gracias")}
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-6 text-sm text-acento underline-offset-4 hover:underline"
      >
        {t("resenas.escribir")}
      </button>
    );
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="mt-6 rounded-2xl border border-tinta-suave/20 p-4"
    >
      {/* Honeypot: invisible para humanos; los bots que lo rellenen reciben un
          éxito falso sin guardar nada (route.ts). */}
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

      <label className="block text-sm" htmlFor="resena-autor">
        {t("resenas.nombre")}
      </label>
      <input
        id="resena-autor"
        value={autor}
        onChange={(e) => setAutor(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-2 outline-none focus:border-acento"
      />

      <label className="mt-3 block text-sm" htmlFor="resena-email">
        {t("resenas.email")}
      </label>
      <input
        id="resena-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-2 text-base outline-none focus:border-acento sm:text-sm"
      />
      <p className="mt-1 text-xs text-tinta-suave">{t("resenas.email.ayuda")}</p>

      <p id="resena-valoracion" className="mt-3 text-sm">
        {t("resenas.valoracion")}
      </p>
      <div
        role="radiogroup"
        aria-labelledby="resena-valoracion"
        className="mt-1 flex gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={tf("resenas.estrellas", { n })}
            onClick={() => setRating(n)}
            className={`text-2xl leading-none transition-colors ${
              n <= rating ? "text-acento" : "text-tinta-suave/40 hover:text-acento"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <label className="mt-3 block text-sm" htmlFor="resena-texto">
        {t("resenas.texto")}
      </label>
      <textarea
        id="resena-texto"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-2xl border border-tinta-suave/30 bg-transparent px-4 py-2 outline-none focus:border-acento"
      />

      {FOTOS_ACTIVAS && (
        <div className="mt-3">
          <label className="block text-sm" htmlFor="resena-foto">
            {t("resenas.foto")}
          </label>
          <input
            id="resena-foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-tinta-suave file:mr-3 file:rounded-full file:border file:border-tinta-suave/30 file:bg-transparent file:px-3 file:py-1 file:text-sm file:text-tinta"
          />
        </div>
      )}

      {estado === "invalido" && (
        <p role="alert" className="mt-2 text-sm text-acento">
          {t("resenas.validacion")}
        </p>
      )}
      {estado === "error" && (
        <p role="alert" className="mt-2 text-sm text-acento">
          {t("resenas.error")}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="boton-primario mt-4 disabled:opacity-40"
      >
        {estado === "enviando" ? t("resenas.enviando") : t("resenas.enviar")}
      </button>
    </form>
  );
}
