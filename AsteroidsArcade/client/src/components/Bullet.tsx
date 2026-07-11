import * as THREE from "three";
import type { Bullet as BulletType } from "@/lib/stores/useAsteroidsGame";

interface BulletProps {
  bullet: BulletType;
}

export function Bullet({ bullet }: BulletProps) {
  return (
    <mesh position={[bullet.position.x, bullet.position.y, 0]}>
      <circleGeometry args={[2, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}
