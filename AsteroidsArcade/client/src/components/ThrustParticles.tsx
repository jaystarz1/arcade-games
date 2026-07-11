import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ThrustParticlesProps {
  shipPosition: THREE.Vector2;
  shipRotation: number;
  isThrusting: boolean;
}

export function ThrustParticles({ shipPosition, shipRotation, isThrusting }: ThrustParticlesProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const flickerRef = useRef(0);

  useFrame(() => {
    if (!meshRef.current) return;

    if (!isThrusting) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;

    // Subtle opacity flicker only - no scaling to keep ship shape stable
    flickerRef.current += 0.15;
    const flicker = 0.85 + Math.sin(flickerRef.current * 8) * 0.15;
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = flicker;
  });

  // SHIP_RADIUS = 10
  // Ship rear is at Y = -10 (local coordinates)
  // Create a triangular flame shape pointing backwards from the ship's rear
  const flameGeometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    // Triangle with base at ship rear (Y=-10) and point extending backwards
    -4, -10, 0,     // Left base (at ship back)
    4, -10, 0,      // Right base (at ship back)
    0, -18, 0,      // Tip pointing backwards
  ]);
  flameGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  // Set indices to form the triangle
  const indices = new Uint16Array([0, 1, 2]);
  flameGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

  return (
    <mesh ref={meshRef} geometry={flameGeometry}>
      <meshBasicMaterial
        color="#ff6600"
        opacity={0.9}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
