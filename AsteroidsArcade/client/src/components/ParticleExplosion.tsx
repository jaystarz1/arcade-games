import { useMemo } from "react";
import * as THREE from "three";

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
}

interface ParticleExplosionProps {
  position: THREE.Vector2;
  type: string;
  timer: number;
}

export function ParticleExplosion({ position, type, timer }: ParticleExplosionProps) {
  const maxTimer = 30;
  const progress = 1 - (timer / maxTimer);
  
  const particles = useMemo(() => {
    const numParticles = type.includes("ship") ? 20 : type.includes("large") ? 15 : 10;
    const particleList: Particle[] = [];
    
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 3;
      
      particleList.push({
        position: new THREE.Vector3(position.x, position.y, 0),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0
        ),
        life: 0.8 + Math.random() * 0.2,
      });
    }
    
    return particleList;
  }, [position.x, position.y, type]);
  
  const particlePositions = useMemo(() => {
    const positions: number[] = [];
    
    particles.forEach((particle) => {
      const particleProgress = progress / particle.life;
      if (particleProgress <= 1) {
        const x = particle.position.x + particle.velocity.x * progress * 10;
        const y = particle.position.y + particle.velocity.y * progress * 10;
        positions.push(x, y, 0);
      }
    });
    
    return new Float32Array(positions);
  }, [particles, progress]);
  
  const opacity = Math.max(0, 1 - progress);
  
  if (particlePositions.length === 0) return null;
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlePositions.length / 3}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#ffffff" 
        size={2} 
        opacity={opacity} 
        transparent 
        sizeAttenuation={false}
      />
    </points>
  );
}
