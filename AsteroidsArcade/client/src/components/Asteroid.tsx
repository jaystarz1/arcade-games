import { useRef, useEffect } from "react";
import * as THREE from "three";
import type { Asteroid as AsteroidType } from "@/lib/stores/useAsteroidsGame";

interface AsteroidProps {
  asteroid: AsteroidType;
}

export function Asteroid({ asteroid }: AsteroidProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  useEffect(() => {
    if (!lineRef.current) return;
    
    // Create irregular polygon shape from the asteroid's vertices
    const vertices: number[] = [];
    asteroid.shape.forEach((vertex) => {
      vertices.push(vertex.x, vertex.y, 0);
    });
    // Close the shape
    vertices.push(asteroid.shape[0].x, asteroid.shape[0].y, 0);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    lineRef.current.geometry = geometry;
    
    return () => {
      geometry.dispose();
    };
  }, [asteroid.shape]);
  
  return (
    <group 
      position={[asteroid.position.x, asteroid.position.y, 0]} 
      rotation={[0, 0, asteroid.rotation]}
    >
      <line ref={lineRef}>
        <lineBasicMaterial color="#ffffff" />
      </line>
    </group>
  );
}
