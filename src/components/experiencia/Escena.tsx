"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  ALTURA_MODELO,
  camaraEn,
  intensidadLuzClave,
  intensidadLuzRelleno,
  orbitaRespiracion,
} from "@/lib/escena/coreografia";
import { useExperiencia } from "@/stores/experiencia";
import VitrinaFlotante from "./VitrinaFlotante";

// Asset definitivo (§8): "Business Lady 02" de ida-faber (CGTrader, licencia
// Royalty Free — ver CREDITS.md), compuesta en Blender: pose estática, melena
// con material propio (MAT_HAIR con baseColorFactor → tinte en vivo v1.5),
// 69.4k tris, texturas WebP 2K/1K, Draco. Escala normalizada en runtime.
const RUTA_MODELO = "/modelos/businesslady.glb";
const TAMANO_MODELO_BYTES = 1_249_336; // respaldo si falta content-length

const RETRASO_INVITACION_MS = 6000; // §4 Cap. 0: invitación a moverse tras 6 s

let draco: DRACOLoader | null = null;

function conDraco(cargador: unknown) {
  if (!draco) {
    draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    // Descarga el decoder wasm EN PARALELO con el GLB (sin esto, se pide en
    // serie al encontrar la primera malla comprimida).
    draco.preload();
  }
  (cargador as GLTFLoader).setDRACOLoader(draco);
}

type PropsModelo = { alPrimerFrame: () => void };

function ModeloGlb({ alPrimerFrame }: PropsModelo) {
  const gltf = useLoader(GLTFLoader, RUTA_MODELO, conDraco, (evento) => {
    // [DOM] La barra del preloader sigue la carga real del asset (§4 Cap. 0).
    const total = evento.total || TAMANO_MODELO_BYTES;
    useExperiencia.getState().setCargaProgreso(Math.min(1, evento.loaded / total));
  });

  const modelo = useMemo(() => {
    const raiz = gltf.scene;
    // Normaliza cualquier asset a la altura del guion con los pies en y = 0,
    // centrado en x/z — la coreografía (claves de cámara) no depende del GLB.
    const caja = new THREE.Box3().setFromObject(raiz);
    const alto = caja.max.y - caja.min.y || 1;
    raiz.scale.setScalar(ALTURA_MODELO / alto);
    caja.setFromObject(raiz);
    const centro = caja.getCenter(new THREE.Vector3());
    raiz.position.set(
      raiz.position.x - centro.x,
      raiz.position.y - caja.min.y,
      raiz.position.z - centro.z,
    );
    return raiz;
  }, [gltf]);

  // El primer frame se avisa desde aquí (y no desde el Rig) para que el
  // preloader no se retire hasta que el modelo esté cargado y pintado (§2).
  const avisado = useRef(false);
  useFrame(() => {
    if (avisado.current) return;
    avisado.current = true;
    alPrimerFrame();
  });

  return <primitive object={modelo} />;
}

// [3D] Sombra de contacto + halo cálido bajo los pies: ancla la figura al
// "suelo" sin coste de shadow maps. Una sola textura de canvas compone el
// charco de luz (acento muy tenue) y el núcleo oscuro bajo los pies.
function SombraContacto() {
  const textura = useMemo(() => {
    const lienzo = document.createElement("canvas");
    lienzo.width = 512;
    lienzo.height = 512;
    const ctx = lienzo.getContext("2d")!;
    // Halo cálido amplio (da contraste local sobre el fondo casi negro).
    const halo = ctx.createRadialGradient(256, 256, 0, 256, 256, 250);
    halo.addColorStop(0, "rgba(217, 154, 99, 0.14)");
    halo.addColorStop(0.55, "rgba(217, 154, 99, 0.05)");
    halo.addColorStop(1, "rgba(217, 154, 99, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 512, 512);
    // Núcleo de sombra bajo los pies.
    const nucleo = ctx.createRadialGradient(256, 256, 0, 256, 256, 95);
    nucleo.addColorStop(0, "rgba(8, 4, 6, 0.55)");
    nucleo.addColorStop(1, "rgba(8, 4, 6, 0)");
    ctx.fillStyle = nucleo;
    ctx.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(lienzo);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(() => () => textura.dispose(), [textura]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.002, 0]}
      scale={[1.15, 0.8, 1]} // elíptica, siguiendo la postura
      renderOrder={-1}
    >
      <planeGeometry args={[2.4, 2.4]} />
      {/* toneMapped:false — el degradado pintado se muestra exacto, sin ACES. */}
      <meshBasicMaterial map={textura} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

type PropsRig = {
  luzRef: React.RefObject<THREE.DirectionalLight | null>;
  luzRellenoRef: React.RefObject<THREE.DirectionalLight | null>;
};

function Rig({ luzRef, luzRellenoRef }: PropsRig) {
  const { camera } = useThree();
  const posicion = useRef(new THREE.Vector3());
  const objetivo = useRef(new THREE.Vector3());
  // Mirada amortiguada; nace en la mirada de la clave p=0.
  const miradaSuave = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame((estado, delta) => {
    const { progreso, ultimoScrollEn, overlay } = useExperiencia.getState();
    const { pos, mirada } = camaraEn(progreso);
    posicion.current.set(pos[0], pos[1], pos[2]);
    objetivo.current.set(mirada[0], mirada[1], mirada[2]);

    // Órbita de respiración ±3° durante el pin del Cap. 2 (§4 Cap. 2).
    const angulo = orbitaRespiracion(progreso, estado.clock.elapsedTime);
    if (angulo !== 0) {
      const dx = posicion.current.x - objetivo.current.x;
      const dz = posicion.current.z - objetivo.current.z;
      const cos = Math.cos(angulo);
      const sin = Math.sin(angulo);
      posicion.current.x = objetivo.current.x + dx * cos - dz * sin;
      posicion.current.z = objetivo.current.z + dx * sin + dz * cos;
    }

    // Micro-parallax de invitación si no hay scroll en 6 s (§4 Cap. 0).
    // TODO(guion): giroscopio en móvil — iOS exige permiso con gesto; por
    // ahora solo puntero (escritorio).
    if (
      progreso < 0.005 &&
      overlay === "ninguno" &&
      ultimoScrollEn > 0 &&
      Date.now() - ultimoScrollEn > RETRASO_INVITACION_MS
    ) {
      posicion.current.x += estado.pointer.x * 0.035;
      posicion.current.y += estado.pointer.y * 0.025;
    }

    // Amortiguación exponencial: mismo acabado a 30, 60 o 120 Hz (k ≈ 0.14 a
    // 60 fps, equivalente al lerp fijo anterior). La mirada también se amortigua
    // — sin esto la rotación reaccionaba seca en los cambios de tramo.
    const k = 1 - Math.exp(-9 * Math.min(delta, 0.1));
    camera.position.lerp(posicion.current, k);
    miradaSuave.current.lerp(objetivo.current, k);
    camera.lookAt(miradaSuave.current);

    // [3D] La luz clave gana intensidad sobre el pelo en el Cap. 1 (§4).
    if (luzRef.current) luzRef.current.intensity = intensidadLuzClave(progreso);
    // [3D] El relleno del tramo bajo se enciende al descender (caps. 5-6):
    // arregla la bota a contraluz y el tramo bajo apagado (pulido §4).
    if (luzRellenoRef.current)
      luzRellenoRef.current.intensity = intensidadLuzRelleno(progreso);
  });

  return null;
}

type PropsEscena = {
  alPrimerFrame: () => void;
  alAbrirProducto: (id: string) => void;
};

export default function Escena({ alPrimerFrame, alAbrirProducto }: PropsEscena) {
  const luzRef = useRef<THREE.DirectionalLight | null>(null);
  const luzRellenoRef = useRef<THREE.DirectionalLight | null>(null);

  return (
    <Canvas
      dpr={[1, 2]} // §2: dpr limitado a 2
      camera={{ fov: 35, position: [0, 1.54, 1.5], near: 0.05, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      {/* §2: esquema de 3 puntos ligero (sin shadow maps ni HDRI aún):
          hemisférica de ambiente + clave frontal + rim trasero cálido (separa
          la silueta del fondo oscuro) + relleno bajo que se enciende al
          descender (Rig). TODO(guion): HDRI estudio 1K de Poly Haven (§8). */}
      <hemisphereLight args={[0xfff1e6, 0x2a1c1d, 0.55]} />
      <directionalLight
        ref={luzRef}
        position={[1.2, 2.6, 1.6]}
        intensity={1.2}
        color={0xffe9d6}
      />
      {/* Rim tenue: separa melena y hombros del fondo oscuro todo el viaje. */}
      <directionalLight
        position={[-2.2, 2.3, -1.4]}
        intensity={0.35}
        color={0xd9a883}
      />
      {/* Relleno de los caps. 5-7 (intensidad dinámica en Rig). */}
      <directionalLight
        ref={luzRellenoRef}
        position={[-1.3, 0.7, -1.8]}
        intensity={0.2}
        color={0xf2dcc9}
      />
      <Suspense fallback={null}>
        <ModeloGlb alPrimerFrame={alPrimerFrame} />
      </Suspense>
      <SombraContacto />
      <VitrinaFlotante alAbrirProducto={alAbrirProducto} />
      <Rig luzRef={luzRef} luzRellenoRef={luzRellenoRef} />
    </Canvas>
  );
}
