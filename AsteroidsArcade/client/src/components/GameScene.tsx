import { Fragment } from "react";
import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";
import { Ship } from "./Ship";
import { Asteroid } from "./Asteroid";
import { Bullet } from "./Bullet";
import { UFO } from "./UFO";
import { Explosion } from "./Explosion";
import { ParticleExplosion } from "./ParticleExplosion";

export function GameScene() {
  const ship = useAsteroidsGame((state) => state.ship);
  const asteroids = useAsteroidsGame((state) => state.asteroids);
  const bullets = useAsteroidsGame((state) => state.bullets);
  const ufo = useAsteroidsGame((state) => state.ufo);
  const explosions = useAsteroidsGame((state) => state.explosions);
  
  return (
    <>
      {/* Render ship */}
      {ship && <Ship />}
      
      {/* Render asteroids */}
      {asteroids.map((asteroid) => (
        <Asteroid key={asteroid.id} asteroid={asteroid} />
      ))}
      
      {/* Render bullets */}
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} bullet={bullet} />
      ))}
      
      {/* Render UFO */}
      {ufo && <UFO ufo={ufo} />}
      
      {/* Render explosions */}
      {explosions.map((explosion, index) => (
        <Fragment key={`explosion-${index}`}>
          <Explosion 
            position={explosion.position} 
            type={explosion.type}
            timer={explosion.timer}
          />
          <ParticleExplosion 
            position={explosion.position} 
            type={explosion.type}
            timer={explosion.timer}
          />
        </Fragment>
      ))}
    </>
  );
}
