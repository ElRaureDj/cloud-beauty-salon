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

// [3D] Cap. 3 — vitrina flotante (§4): 4–6 productos acompañan el descenso;
// cada uno clicable → /producto/[slug]. Las tarjetas se colocan DENTRO del
// frustum de la cámara (consciente del aspecto: §2 mobile-first) para que el
// escaparate exista igual en 390×844 que en escritorio.
// TODO(guion §8): sustituir por packshots reales cuando existan.
const IDS_VITRINA = [
  "ultra-hydration-shampoo",
  "nutri-infusion-mask-180g-6-35-fl-oz",
  "color-shield-shampoo-300ml-10-1-fl-oz",
  "shock-repair-1-box-with-4-units",
  "hair-protector",
];

// Huecos en pantalla (fracciones del semiancho/semialto del frustum) con
// profundidad propia: cada tarjeta vive a SU distancia de la cámara — la
// cercana se ve mayor y claramente delante (parallax legible al scrollear).
const HUECOS = [
  { x: -0.62, y: 0.34, distancia: 1.0 },
  { x: 0.62, y: 0.18, distancia: 1.35 },
  { x: -0.58, y: -0.12, distancia: 1.55 },
  { x: 0.58, y: -0.34, distancia: 1.1 },
  { x: -0.05, y: -0.55, distancia: 1.75 },
];

function texturaTarjeta(producto: Producto, tr: Traductor): THREE.CanvasTexture {
  const lienzo = document.createElement("canvas");
  lienzo.width = 256;
  lienzo.height = 340;
  const ctx = lienzo.getContext("2d")!;

  const pintarBase = () => {
    ctx.clearRect(0, 0, 256, 340);
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 332, 28);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(201,186,179,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Etiqueta inferior con nombre y categoría
    ctx.textAlign = "center";
    ctx.font = "600 17px system-ui, sans-serif";
    ctx.fillStyle = "#2b1d24";
    const palabras = producto.nombre.split(" ");
    let linea = "";
    let y = 288;
    for (const palabra of palabras) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width > 220 && linea) {
        ctx.fillText(linea, 128, y);
        linea = palabra;
        y += 20;
      } else {
        linea = prueba;
      }
    }
    ctx.fillText(linea, 128, y);
    ctx.font = "500 13px system-ui, sans-serif";
    ctx.fillStyle = "rgba(160,110,70,0.95)";
    ctx.fillText(nombreCategoria(producto.categoria, tr).toUpperCase(), 128, y + 22);
  };

  pintarBase();
  const textura = new THREE.CanvasTexture(lienzo);
  textura.anisotropy = 4;
  textura.colorSpace = THREE.SRGBColorSpace;

  // Packshot real (§8, fuente autorizada): se pinta al cargar.
  const foto = new Image();
  foto.onload = () => {
    pintarBase();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 332, 28);
    ctx.clip();
    ctx.drawImage(foto, 18, 12, 220, 220);
    ctx.restore();
    textura.needsUpdate = true;
  };
  foto.src = producto.imagen;

  return textura;
}

const ADELANTE = new THREE.Vector3();
const DERECHA = new THREE.Vector3();
const ARRIBA = new THREE.Vector3();

export default function VitrinaFlotante({
  alAbrirProducto,
}: {
  alAbrirProducto: (id: string) => void;
}) {
  const grupoRef = useRef<THREE.Group | null>(null);
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
    if (!dentro) return;

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
      // La tarjeta cabe en su hueco a cualquier aspecto.
      const escala = Math.min(1, (semiancho * 0.55) / 0.24);
      hijo.scale.setScalar(escala);
      // Orden de pintado estable: de lejos a cerca.
      hijo.renderOrder = Math.round(100 - hueco.distancia * 10);
      materiales[i].opacity = alfa;
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
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <planeGeometry args={[0.24, 0.32]} />
        </mesh>
      ))}
    </group>
  );
}
