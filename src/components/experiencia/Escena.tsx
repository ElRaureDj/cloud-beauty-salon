"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  ALTURA_MODELO,
  camaraEn,
  intensidadLuzClave,
  orbitaRespiracion,
} from "@/lib/escena/coreografia";
import { useExperiencia } from "@/stores/experiencia";

// Placeholder de desarrollo con licencia CC-BY (crédito en CREDITS.md).
// El asset comprado (§8, GLB + Draco) lo sustituye cambiando solo esta ruta:
// la escala y la posición se normalizan en tiempo de ejecución.
const RUTA_MODELO = "/modelos/placeholder-cc-by.glb";
const TAMANO_MODELO_BYTES = 2_168_608; // respaldo si falta content-length

const RETRASO_INVITACION_MS = 6000; // §4 Cap. 0: invitación a moverse tras 6 s

let draco: DRACOLoader | null = null;

function conDraco(cargador: unknown) {
  if (!draco) {
    draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
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

type PropsRig = {
  luzRef: React.RefObject<THREE.DirectionalLight | null>;
};

function Rig({ luzRef }: PropsRig) {
  const { camera } = useThree();
  const posicion = useRef(new THREE.Vector3());
  const objetivo = useRef(new THREE.Vector3());

  useFrame((estado) => {
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

    camera.position.lerp(posicion.current, 0.14);
    camera.lookAt(objetivo.current);

    // [3D] La luz clave gana intensidad sobre el pelo en el Cap. 1 (§4).
    if (luzRef.current) luzRef.current.intensity = intensidadLuzClave(progreso);
  });

  return null;
}

type PropsEscena = { alPrimerFrame: () => void };

export default function Escena({ alPrimerFrame }: PropsEscena) {
  const luzRef = useRef<THREE.DirectionalLight | null>(null);

  return (
    <Canvas
      dpr={[1, 2]} // §2: dpr limitado a 2
      camera={{ fov: 35, position: [0, 1.54, 1.5], near: 0.05, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      {/* §2: una sola luz direccional + entorno HDRI.
          TODO(guion): HDRI estudio 1K neutro cálido de Poly Haven (§8);
          mientras llega, una hemisférica suave hace de entorno. */}
      <hemisphereLight args={[0xfff1e6, 0x2a1c1d, 0.55]} />
      <directionalLight
        ref={luzRef}
        position={[1.2, 2.6, 1.6]}
        intensity={1.2}
        color={0xffe9d6}
      />
      <Suspense fallback={null}>
        <ModeloGlb alPrimerFrame={alPrimerFrame} />
      </Suspense>
      <Rig luzRef={luzRef} />
    </Canvas>
  );
}
