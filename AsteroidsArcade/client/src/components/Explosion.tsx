import { useRef, useMemo } from "react";
import * as THREE from "three";

interface ExplosionProps {
  position: THREE.Vector2;
  type: string;
  timer: number;
}

export function Explosion({ position, type, timer }: ExplosionProps) {
  const linesRef = useRef<THREE.Group>(null);
  
  // Generate explosion lines (debris flying outward)
  const lines = useMemo(() => {
    const numLines = type.includes("ship") ? 12 : type.includes("large") ? 8 : 6;
    const lineData: Array<{ angle: number; length: number }> = [];
    
    for (let i = 0; i < numLines; i++) {
      lineData.push({
        angle: (i / numLines) * Math.PI * 2,
        length: 10 + Math.random() * 15
      });
    }
    
    return lineData;
  }, [type]);
  
  const scale = timer / 30; // Fade out as timer decreases
  const opacity = Math.max(0, timer / 30);
  
  return (
    <group ref={linesRef} position={[position.x, position.y, 0]}>
      {lines.map((line, index) => {
        const startX = Math.cos(line.angle) * 5 * (1 - scale);
        const startY = Math.sin(line.angle) * 5 * (1 - scale);
        const endX = Math.cos(line.angle) * line.length * scale;
        const endY = Math.sin(line.angle) * line.length * scale;
        
        return (
          <line key={index}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([startX, startY, 0, endX, endY, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ffffff" opacity={opacity} transparent />
          </line>
        );
      })}
    </group>
  );
}
