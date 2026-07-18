"use client";

import { useMemo } from "react";
import * as THREE from "three";

// Placeholder de Fase 1 (§10): figura estilizada de primitivas con la pose del
// guion (§2): de pie, peso en una cadera, manos relajadas al frente, pies
// visibles. El asset real (GLB + Draco, ≤ 80k tris) lo sustituye sin tocar la
// coreografía: mismas alturas de anclaje (cabeza en y ≈ 1.58).
// El PELO usa material separado — requisito §2 para el tinte en vivo de v1.5.
export default function ModeloPlaceholder() {
  const piel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b98a72", roughness: 0.62 }),
    [],
  );
  const pelo = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2e1b13",
        roughness: 0.34, // brillo especular sutil (§4 Cap. 1)
        metalness: 0.05,
      }),
    [],
  );

  return (
    <group>
      {/* cabeza y cuello */}
      <mesh material={piel} position={[0, 1.58, 0.01]}>
        <sphereGeometry args={[0.11, 32, 24]} />
      </mesh>
      <mesh material={piel} position={[0, 1.47, 0]}>
        <capsuleGeometry args={[0.035, 0.06, 6, 12]} />
      </mesh>

      {/* pelo: casquete + melena por la espalda (material separado) */}
      <mesh material={pelo} position={[0, 1.585, -0.015]} rotation={[0.14, 0, 0]} scale={[1.08, 1.1, 1.08]}>
        <sphereGeometry args={[0.115, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>
      <mesh material={pelo} position={[0, 1.36, -0.095]} rotation={[0.1, 0, 0]}>
        <capsuleGeometry args={[0.088, 0.36, 8, 16]} />
      </mesh>

      {/* torso y caderas: peso en la cadera derecha */}
      <mesh material={piel} position={[0, 1.24, 0]}>
        <capsuleGeometry args={[0.115, 0.28, 8, 16]} />
      </mesh>
      <mesh material={piel} position={[0.02, 0.98, 0]} rotation={[0, 0, -0.07]} scale={[1, 0.8, 0.88]}>
        <sphereGeometry args={[0.145, 24, 18]} />
      </mesh>

      {/* brazos relajados, antebrazos ligeramente al frente */}
      <mesh material={piel} position={[-0.185, 1.28, 0]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.038, 0.24, 6, 12]} />
      </mesh>
      <mesh material={piel} position={[-0.195, 1.05, 0.07]} rotation={[-0.55, 0, 0.06]}>
        <capsuleGeometry args={[0.033, 0.2, 6, 12]} />
      </mesh>
      <mesh material={piel} position={[0.185, 1.28, 0]} rotation={[0, 0, -0.12]}>
        <capsuleGeometry args={[0.038, 0.24, 6, 12]} />
      </mesh>
      <mesh material={piel} position={[0.195, 1.05, 0.07]} rotation={[-0.55, 0, -0.06]}>
        <capsuleGeometry args={[0.033, 0.2, 6, 12]} />
      </mesh>

      {/* manos al frente — futura estación de conversión (§4 Cap. 4) */}
      <mesh material={piel} position={[-0.19, 0.93, 0.15]} scale={[0.85, 1, 1.2]}>
        <sphereGeometry args={[0.045, 16, 12]} />
      </mesh>
      <mesh material={piel} position={[0.19, 0.93, 0.15]} scale={[0.85, 1, 1.2]}>
        <sphereGeometry args={[0.045, 16, 12]} />
      </mesh>

      {/* piernas y pies visibles (§2) */}
      <mesh material={piel} position={[-0.082, 0.5, 0]} rotation={[0, 0, 0.03]}>
        <capsuleGeometry args={[0.062, 0.74, 8, 14]} />
      </mesh>
      <mesh material={piel} position={[0.092, 0.51, 0]}>
        <capsuleGeometry args={[0.064, 0.76, 8, 14]} />
      </mesh>
      <mesh material={piel} position={[-0.085, 0.045, 0.06]}>
        <boxGeometry args={[0.085, 0.07, 0.2]} />
      </mesh>
      <mesh material={piel} position={[0.095, 0.045, 0.06]}>
        <boxGeometry args={[0.085, 0.07, 0.2]} />
      </mesh>
    </group>
  );
}
