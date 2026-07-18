"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  camaraEn,
  intensidadLuzClave,
  orbitaRespiracion,
} from "@/lib/escena/coreografia";
import { useExperiencia } from "@/stores/experiencia";
import ModeloPlaceholder from "./ModeloPlaceholder";

const RETRASO_INVITACION_MS = 6000; // §4 Cap. 0: invitación a moverse tras 6 s

type PropsRig = {
  alPrimerFrame: () => void;
  luzRef: React.RefObject<THREE.DirectionalLight | null>;
};

function Rig({ alPrimerFrame, luzRef }: PropsRig) {
  const { camera } = useThree();
  const avisado = useRef(false);
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

    if (!avisado.current) {
      avisado.current = true;
      alPrimerFrame();
    }
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
      <ModeloPlaceholder />
      <Rig alPrimerFrame={alPrimerFrame} luzRef={luzRef} />
    </Canvas>
  );
}
