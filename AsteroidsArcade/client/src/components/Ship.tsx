import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useAsteroidsGame, SHIP_RADIUS } from "@/lib/stores/useAsteroidsGame";
import { ThrustParticles } from "./ThrustParticles";

export function Ship() {
  const ship = useAsteroidsGame((state) => state.ship);
  const lineRef = useRef<THREE.Line>(null);
  const thrustLineRef = useRef<THREE.Line>(null);
  
  useEffect(() => {
    if (!lineRef.current || !ship) return;

    // Create triangular ship shape
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, SHIP_RADIUS * 1.5, 0,      // Nose (front)
      -SHIP_RADIUS, -SHIP_RADIUS, 0, // Left rear
      SHIP_RADIUS, -SHIP_RADIUS, 0,  // Right rear
      0, SHIP_RADIUS * 1.5, 0        // Back to nose (close the triangle)
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    lineRef.current.geometry = geometry;

    return () => {
      geometry.dispose();
    };
  }, [!!ship]); // Only recreate when ship existence changes (null -> object or object -> null)

  useEffect(() => {
    if (!thrustLineRef.current || !ship) return;

    // Create thrust flame shape
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -SHIP_RADIUS * 0.5, -SHIP_RADIUS, 0,
      0, -SHIP_RADIUS * 2, 0,
      SHIP_RADIUS * 0.5, -SHIP_RADIUS, 0
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    thrustLineRef.current.geometry = geometry;

    return () => {
      geometry.dispose();
    };
  }, [!!ship]); // Only recreate when ship existence changes (null -> object or object -> null)
  
  if (!ship) return null;
  
  const opacity = ship.isInvincible && Math.floor(ship.invincibilityTimer / 10) % 2 === 0 ? 0.3 : 1.0;
  
  return (
    <group position={[ship.position.x, ship.position.y, 0]} rotation={[0, 0, ship.rotation]}>
      {/* Ship outline */}
      <line ref={lineRef}>
        <lineBasicMaterial color="#ffffff" opacity={opacity} transparent />
      </line>
      
      {/* Thrust flame */}
      {ship.isThrusting && (
        <line ref={thrustLineRef}>
          <lineBasicMaterial color="#ffaa00" opacity={opacity} transparent />
        </line>
      )}
      
      {/* Thrust particles */}
      {ship.isThrusting && (
        <ThrustParticles 
          shipPosition={ship.position}
          shipRotation={ship.rotation}
          isThrusting={ship.isThrusting}
        />
      )}
    </group>
  );
}
