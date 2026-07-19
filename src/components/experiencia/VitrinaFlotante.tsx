"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CATALOGO, type Producto } from "@/lib/catalogo";
import { nombreCategoria } from "@/lib/formato";
import { VITRINA } from "@/lib/escena/coreografia";
import { useExperiencia } from "@/stores/experiencia";

// [3D] Cap. 3 — vitrina flotante (§4): 4–6 productos acompañan el descenso;
// cada uno clicable → /producto/[slug]. Las tarjetas se colocan DENTRO del
// frustum de la cámara (consciente del aspecto: §2 mobile-first) para que el
// escaparate exista igual en 390×844 que en escritorio.
// TODO(guion §8): sustituir por packshots reales cuando existan.
const IDS_VITRINA = [
  "trust-hid-champu",
  "trust-nut-mascara",
  "trust-color-champu",
  "trust-rec-ampolla",
  "trust-termico",
];

// Huecos en pantalla (fracciones del semiancho/semialto del frustum).
const HUECOS = [
  { x: -0.62, y: 0.34 },
  { x: 0.62, y: 0.18 },
  { x: -0.58, y: -0.12 },
  { x: 0.58, y: -0.34 },
  { x: -0.05, y: -0.55 },
];

function texturaTarjeta(producto: Producto): THREE.CanvasTexture {
  const lienzo = document.createElement("canvas");
  lienzo.width = 256;
  lienzo.height = 340;
  const ctx = lienzo.getContext("2d")!;
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 332, 28);
  ctx.fillStyle = "#34222b";
  ctx.fill();
  ctx.strokeStyle = "rgba(201,186,179,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(201,186,179,0.6)";
  ctx.font = "600 92px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(producto.nombre.charAt(0), 128, 150);
  ctx.font = "500 20px system-ui, sans-serif";
  ctx.fillStyle = "#f3ece7";
  const palabras = producto.nombre.split(" ");
  let linea = "";
  let y = 210;
  for (const palabra of palabras) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > 216 && linea) {
      ctx.fillText(linea, 128, y);
      linea = palabra;
      y += 26;
    } else {
      linea = prueba;
    }
  }
  ctx.fillText(linea, 128, y);
  ctx.font = "400 16px system-ui, sans-serif";
  ctx.fillStyle = "rgba(217,154,99,0.9)";
  ctx.fillText(nombreCategoria(producto.categoria).toUpperCase(), 128, y + 34);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.anisotropy = 4;
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
            map: texturaTarjeta(p),
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
          }),
      ),
    [productos],
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
    const distancia = 1.15;
    const semialto = distancia * Math.tan((camara.fov * Math.PI) / 360);
    const semiancho = semialto * camara.aspect;

    camara.getWorldDirection(ADELANTE);
    DERECHA.crossVectors(ADELANTE, camara.up).normalize();
    ARRIBA.crossVectors(DERECHA, ADELANTE).normalize();

    grupo.children.forEach((hijo, i) => {
      const hueco = HUECOS[i % HUECOS.length];
      const vaiven = Math.sin(estado.clock.elapsedTime * 0.4 + i * 1.7) * 0.04;
      const deriva = (local - 0.5) * 0.25 * (i % 2 === 0 ? 1 : -1);
      hijo.position
        .copy(camara.position)
        .addScaledVector(ADELANTE, distancia)
        .addScaledVector(DERECHA, (hueco.x + deriva) * semiancho)
        .addScaledVector(ARRIBA, (hueco.y + vaiven) * semialto);
      hijo.quaternion.copy(camara.quaternion); // billboard
      // La tarjeta cabe en el hueco tanto en vertical como en horizontal.
      const escala = Math.min(1, (semiancho * 0.55) / 0.24);
      hijo.scale.setScalar(escala);
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
