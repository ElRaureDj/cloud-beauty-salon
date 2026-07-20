"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CATALOGO, type Producto } from "@/lib/catalogo";
import { nombreCategoria } from "@/lib/formato";
import { useT } from "@/lib/i18n/client";
import type { Traductor } from "@/lib/i18n";
import { VITRINA } from "@/lib/escena/coreografia";
import { useExperiencia } from "@/stores/experiencia";

// [3D] Cap. 3 — vitrina flotante (§4): un puñado de productos acompaña el
// descenso; cada uno clicable → /producto/[slug]. Las tarjetas se colocan DENTRO
// del frustum de la cámara (consciente del aspecto: §2 mobile-first) para que el
// escaparate exista igual en 390×844 que en escritorio. Pequeñas y translúcidas
// (con desvanecido por profundidad) para no tapar a la modelo.
// TODO(guion §8): sustituir por packshots reales cuando existan.
const IDS_VITRINA = [
  "ultra-hydration-shampoo",
  "nutri-infusion-mask-180g-6-35-fl-oz",
  "color-shield-shampoo-300ml-10-1-fl-oz",
  "shock-repair-1-box-with-4-units",
  "hair-protector",
  "deluxe-prime-reconstructive-oil-30ml-1-0-fl-oz",
  "miracle-mask",
  "frizz-zero",
];

// Huecos en pantalla (fracciones del semiancho/semialto del frustum) con
// profundidad propia: cada tarjeta vive a SU distancia de la cámara — la cercana
// se ve mayor, más nítida y más opaca; la lejana, pequeña y difusa (parallax +
// profundidad legibles al scrollear). Repartidos por el borde para no tapar a la
// modelo (centro de la pantalla).
const HUECOS = [
  { x: -0.6, y: 0.42, distancia: 1.05 },
  { x: 0.6, y: 0.3, distancia: 1.3 },
  { x: -0.66, y: 0.0, distancia: 1.55 },
  { x: 0.64, y: -0.1, distancia: 1.45 },
  { x: -0.5, y: -0.4, distancia: 1.2 },
  { x: 0.52, y: -0.44, distancia: 1.35 },
  { x: -0.14, y: 0.54, distancia: 1.8 },
  { x: 0.18, y: -0.56, distancia: 1.9 },
];

// Lienzo de la tarjeta (ratio = plano 0.24×0.32 = 0.75). Alta resolución para
// texto e imagen nítidos; margen para pintar una sombra suave (da profundidad).
const LIENZO_W = 300;
const LIENZO_H = 400;

function texturaTarjeta(producto: Producto, tr: Traductor): THREE.CanvasTexture {
  const lienzo = document.createElement("canvas");
  lienzo.width = LIENZO_W;
  lienzo.height = LIENZO_H;
  const ctx = lienzo.getContext("2d")!;

  // Geometría de la tarjeta dentro del lienzo (deja aire alrededor para la sombra).
  const cx = 18;
  const cy = 16;
  const cw = LIENZO_W - 36;
  const ch = LIENZO_H - 40;
  const radio = 30;

  const pintarBase = () => {
    ctx.clearRect(0, 0, LIENZO_W, LIENZO_H);

    // Sombra suave detrás de la tarjeta.
    ctx.save();
    ctx.shadowColor = "rgba(18,12,15,0.30)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 12;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, radio);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    // Fondo en degradado crema (más premium y agradable en translúcido).
    const grad = ctx.createLinearGradient(0, cy, 0, cy + ch);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#f3ebe4");
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, radio);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(201,186,179,0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Filete de acento bajo la imagen.
    const medioX = LIENZO_W / 2;
    ctx.beginPath();
    ctx.moveTo(medioX - 22, 266);
    ctx.lineTo(medioX + 22, 266);
    ctx.strokeStyle = "rgba(217,154,99,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nombre (hasta 2 líneas, centrado) y categoría.
    ctx.textAlign = "center";
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.fillStyle = "#2b1d24";
    const palabras = producto.nombre.split(" ");
    const lineas: string[] = [];
    let linea = "";
    for (const palabra of palabras) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width > cw - 40 && linea) {
        lineas.push(linea);
        linea = palabra;
      } else {
        linea = prueba;
      }
    }
    if (linea) lineas.push(linea);
    const visibles = lineas.slice(0, 2);
    if (lineas.length > 2) {
      visibles[1] = `${visibles[1].replace(/…$/, "")}…`;
    }
    let y = visibles.length === 1 ? 302 : 296;
    for (const l of visibles) {
      ctx.fillText(l, medioX, y);
      y += 22;
    }
    ctx.font = "500 13px system-ui, sans-serif";
    ctx.fillStyle = "rgba(160,110,70,0.95)";
    ctx.fillText(
      nombreCategoria(producto.categoria, tr).toUpperCase(),
      medioX,
      y + 6,
    );
  };

  pintarBase();
  const textura = new THREE.CanvasTexture(lienzo);
  textura.anisotropy = 8;
  textura.colorSpace = THREE.SRGBColorSpace;

  // Packshot real (§8, fuente autorizada): se pinta al cargar, centrado.
  const foto = new Image();
  foto.onload = () => {
    pintarBase();
    const lado = 196;
    const ix = (LIENZO_W - lado) / 2;
    const iy = 44;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, radio);
    ctx.clip();
    ctx.drawImage(foto, ix, iy, lado, lado);
    ctx.restore();
    textura.needsUpdate = true;
  };
  foto.src = producto.imagen;

  return textura;
}

const ADELANTE = new THREE.Vector3();
const DERECHA = new THREE.Vector3();
const ARRIBA = new THREE.Vector3();

// Tamaño y opacidad de las tarjetas (ajustables). Más pequeñas y translúcidas
// que la primera versión, para acompañar sin robar protagonismo a la modelo.
const PLANO_ANCHO = 0.24; // ancho del planeGeometry
const FRAC_ANCHO = 0.34; // fracción del semiancho de pantalla por tarjeta
const ESCALA_MAX = 0.6; // techo en pantallas anchas (no crecen sin límite)
const OPACIDAD_MAX = 0.72; // translúcidas
const HOVER_ESCALA = 1.2; // agrandado al pasar el cursor

export default function VitrinaFlotante({
  alAbrirProducto,
}: {
  alAbrirProducto: (id: string) => void;
}) {
  const grupoRef = useRef<THREE.Group | null>(null);
  // Hover: índice de la tarjeta bajo el cursor y escala actual de cada una
  // (para animar suavemente el agrandado con lerp). −1 = ninguna.
  const hoverRef = useRef<number>(-1);
  const escalaActual = useRef<number[]>([]);
  const tr = useT();

  const productos = useMemo(
    () =>
      IDS_VITRINA.map((id) => CATALOGO.find((p) => p.id === id)).filter(
        (p): p is Producto => Boolean(p),
      ),
    [],
  );

  const materiales = useMemo(
    () =>
      productos.map(
        (p) =>
          new THREE.MeshBasicMaterial({
            map: texturaTarjeta(p, tr),
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            // Sin escritura de profundidad: las esquinas transparentes de una
            // tarjeta no deben perforar a las de atrás; el orden lo fija
            // renderOrder por distancia en cada frame.
            depthWrite: false,
          }),
      ),
    [productos, tr],
  );

  // El cursor y los recursos GPU no deben sobrevivir al canvas.
  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      for (const m of materiales) {
        m.map?.dispose();
        m.dispose();
      }
    };
  }, [materiales]);

  // Las mallas invisibles siguen siendo raycasteables (three no filtra por
  // visible): todos los handlers deben cortarse fuera del rango del cap. 3.
  const vitrinaActiva = () => grupoRef.current?.visible === true;

  useFrame((estado) => {
    const grupo = grupoRef.current;
    if (!grupo) return;
    const { progreso } = useExperiencia.getState();
    const dentro = progreso > VITRINA.inicio - 0.005 && progreso < VITRINA.fin + 0.005;
    grupo.visible = dentro;
    if (!dentro) {
      hoverRef.current = -1; // no arrastrar un hover viejo al reentrar
      return;
    }

    const local = (progreso - VITRINA.inicio) / (VITRINA.fin - VITRINA.inicio);
    const alfa = Math.min(1, Math.min(local, 1 - local) * 8);

    const camara = estado.camera as THREE.PerspectiveCamera;
    camara.getWorldDirection(ADELANTE);
    DERECHA.crossVectors(ADELANTE, camara.up).normalize();
    ARRIBA.crossVectors(DERECHA, ADELANTE).normalize();

    grupo.children.forEach((hijo, i) => {
      const hueco = HUECOS[i % HUECOS.length];
      const semialto = hueco.distancia * Math.tan((camara.fov * Math.PI) / 360);
      const semiancho = semialto * camara.aspect;
      // Deriva y vaivén cortos: las tarjetas respiran sin cruzarse de hueco.
      const vaiven = Math.sin(estado.clock.elapsedTime * 0.4 + i * 1.7) * 0.02;
      const deriva = (local - 0.5) * 0.1 * (i % 2 === 0 ? 1 : -1);
      hijo.position
        .copy(camara.position)
        .addScaledVector(ADELANTE, hueco.distancia)
        .addScaledVector(DERECHA, (hueco.x + deriva) * semiancho)
        .addScaledVector(ARRIBA, (hueco.y + vaiven) * semialto);
      hijo.quaternion.copy(camara.quaternion); // billboard
      // Tamaño relativo al hueco, con techo en pantallas anchas. Al pasar el
      // cursor, la tarjeta se agranda (lerp) y pasa al frente.
      const hover = hoverRef.current === i;
      const base = Math.min(ESCALA_MAX, (semiancho * FRAC_ANCHO) / PLANO_ANCHO);
      const objetivo = base * (hover ? HOVER_ESCALA : 1);
      const previa = escalaActual.current[i] ?? objetivo;
      const escala = previa + (objetivo - previa) * 0.18;
      escalaActual.current[i] = escala;
      hijo.scale.setScalar(escala);
      // Orden de pintado: de lejos a cerca; la que tiene hover, por encima de todo.
      hijo.renderOrder = hover ? 300 : Math.round(100 - hueco.distancia * 10);
      // Translúcidas, y las más lejanas más difusas (profundidad); la de hover se
      // opaca del todo para destacar.
      const difuminado = THREE.MathUtils.clamp(1.2 - hueco.distancia * 0.2, 0.55, 1);
      materiales[i].opacity = hover
        ? alfa * Math.min(1, OPACIDAD_MAX + 0.22)
        : alfa * OPACIDAD_MAX * difuminado;
    });
  });

  return (
    <group ref={grupoRef} visible={false}>
      {productos.map((p, i) => (
        <mesh
          key={p.id}
          material={materiales[i]}
          onClick={(e) => {
            if (!vitrinaActiva()) return;
            e.stopPropagation();
            document.body.style.cursor = "";
            alAbrirProducto(p.id);
          }}
          onPointerOver={() => {
            if (!vitrinaActiva()) return;
            hoverRef.current = i;
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            if (hoverRef.current === i) hoverRef.current = -1;
            document.body.style.cursor = "";
          }}
        >
          <planeGeometry args={[0.24, 0.32]} />
        </mesh>
      ))}
    </group>
  );
}
