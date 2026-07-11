import { useRef, useEffect } from "react";
import * as THREE from "three";
import type { UFO as UFOType } from "@/lib/stores/useAsteroidsGame";

interface UFOProps {
  ufo: UFOType;
}

export function UFO({ ufo }: UFOProps) {
  const groupRef = useRef<THREE.Group>(null);
  const topLineRef = useRef<THREE.Line>(null);
  const bottomLineRef = useRef<THREE.Line>(null);
  const sideLineRef = useRef<THREE.Line>(null);
  
  useEffect(() => {
    const radius = ufo.radius;
    const height = radius * 0.6;
    
    // Top dome
    if (topLineRef.current) {
      const topVertices = new Float32Array([
        -radius * 0.5, height, 0,
        0, height * 1.5, 0,
        radius * 0.5, height, 0
      ]);
      const topGeometry = new THREE.BufferGeometry();
      topGeometry.setAttribute('position', new THREE.BufferAttribute(topVertices, 3));
      topLineRef.current.geometry = topGeometry;
    }
    
    // Bottom saucer
    if (bottomLineRef.current) {
      const bottomVertices = new Float32Array([
        -radius, 0, 0,
        -radius * 0.5, height, 0,
        radius * 0.5, height, 0,
        radius, 0, 0,
        radius * 0.5, -height, 0,
        -radius * 0.5, -height, 0,
        -radius, 0, 0
      ]);
      const bottomGeometry = new THREE.BufferGeometry();
      bottomGeometry.setAttribute('position', new THREE.BufferAttribute(bottomVertices, 3));
      bottomLineRef.current.geometry = bottomGeometry;
    }
    
    // Side details
    if (sideLineRef.current) {
      const sideVertices = new Float32Array([
        -radius * 0.5, -height, 0,
        radius * 0.5, -height, 0
      ]);
      const sideGeometry = new THREE.BufferGeometry();
      sideGeometry.setAttribute('position', new THREE.BufferAttribute(sideVertices, 3));
      sideLineRef.current.geometry = sideGeometry;
    }
  }, [ufo.radius]);
  
  return (
    <group ref={groupRef} position={[ufo.position.x, ufo.position.y, 0]}>
      <line ref={topLineRef}>
        <lineBasicMaterial color="#ffffff" />
      </line>
      <line ref={bottomLineRef}>
        <lineBasicMaterial color="#ffffff" />
      </line>
      <line ref={sideLineRef}>
        <lineBasicMaterial color="#ffffff" />
      </line>
    </group>
  );
}
