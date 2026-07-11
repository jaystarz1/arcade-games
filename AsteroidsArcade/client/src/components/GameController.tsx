import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import {
  useAsteroidsGame,
  GAME_WIDTH,
  GAME_HEIGHT,
  SHIP_ROTATION_SPEED,
  THRUST_ACCELERATION,
  MAX_SHIP_SPEED,
  VELOCITY_DECAY,
  BULLET_SPEED,
  BULLET_LIFESPAN,
  UFO_FIRE_INTERVAL,
  SHIP_RADIUS
} from "@/lib/stores/useAsteroidsGame";
import { useSettingsStore, getDifficultyMultipliers } from "@/lib/stores/useSettingsStore";

export enum Controls {
  left = "left",
  right = "right",
  thrust = "thrust",
  fire = "fire"
}

export function GameController() {
  const phase = useAsteroidsGame((state) => state.phase);
  const ship = useAsteroidsGame((state) => state.ship);
  const asteroids = useAsteroidsGame((state) => state.asteroids);
  const bullets = useAsteroidsGame((state) => state.bullets);
  const ufo = useAsteroidsGame((state) => state.ufo);
  const ufoSpawnTimer = useAsteroidsGame((state) => state.ufoSpawnTimer);
  const score = useAsteroidsGame((state) => state.score);
  const explosions = useAsteroidsGame((state) => state.explosions);
  
  const updateShip = useAsteroidsGame((state) => state.updateShip);
  const destroyShip = useAsteroidsGame((state) => state.destroyShip);
  const addBullet = useAsteroidsGame((state) => state.addBullet);
  const removeBullet = useAsteroidsGame((state) => state.removeBullet);
  const updateAsteroids = useAsteroidsGame((state) => state.updateAsteroids);
  const updateBullets = useAsteroidsGame((state) => state.updateBullets);
  const updateUFO = useAsteroidsGame((state) => state.updateUFO);
  const splitAsteroid = useAsteroidsGame((state) => state.splitAsteroid);
  const removeUFO = useAsteroidsGame((state) => state.removeUFO);
  const spawnUFO = useAsteroidsGame((state) => state.spawnUFO);
  const nextWave = useAsteroidsGame((state) => state.nextWave);
  const updateExplosions = useAsteroidsGame((state) => state.updateExplosions);
  
  const [, getKeys] = useKeyboardControls<Controls>();
  const lastFireTime = useRef(0);
  
  // Wrap position around screen boundaries (centered coordinates)
  const wrapPosition = (pos: THREE.Vector2): THREE.Vector2 => {
    const wrapped = pos.clone();
    const halfWidth = GAME_WIDTH / 2;
    const halfHeight = GAME_HEIGHT / 2;

    if (wrapped.x < -halfWidth) wrapped.x = halfWidth;
    if (wrapped.x > halfWidth) wrapped.x = -halfWidth;
    if (wrapped.y < -halfHeight) wrapped.y = halfHeight;
    if (wrapped.y > halfHeight) wrapped.y = -halfHeight;
    return wrapped;
  };
  
  // Circle collision detection
  const checkCollision = (pos1: THREE.Vector2, radius1: number, pos2: THREE.Vector2, radius2: number): boolean => {
    const distance = pos1.distanceTo(pos2);
    return distance < (radius1 + radius2);
  };
  
  // Fire bullet
  const fireBullet = (fromPlayer: boolean = true) => {
    if (!ship && fromPlayer) return;
    
    const now = Date.now();
    if (fromPlayer && now - lastFireTime.current < 100) return; // Rate limit
    
    if (fromPlayer) {
      lastFireTime.current = now;
      
      // Ship geometry points along +Y, so derive the actual nose direction from its rotation
      const noseDirection = new THREE.Vector2(
        -Math.sin(ship!.rotation),
        Math.cos(ship!.rotation)
      ).normalize();

      const bulletVel = noseDirection.clone().multiplyScalar(BULLET_SPEED).add(ship!.velocity);

      // Start bullets slightly ahead of the tip so they visibly leave the nose
      const muzzleOffset = SHIP_RADIUS * 1.5 + 2;
      const bulletPos = ship!.position.clone().add(noseDirection.clone().multiplyScalar(muzzleOffset));
      
      addBullet({
        id: `bullet-${Date.now()}-${Math.random()}`,
        position: bulletPos,
        velocity: bulletVel,
        lifetime: BULLET_LIFESPAN,
        fromPlayer: true
      });
    }
  };
  
  // UFO fires bullet at player
  const ufoFireBullet = () => {
    if (!ufo || !ship) return;
    
    const difficulty = useSettingsStore.getState().difficulty;
    const { ufoAccuracyMultiplier } = getDifficultyMultipliers(difficulty);
    
    // Calculate angle to player with accuracy based on score
    let targetAngle = Math.atan2(
      ship.position.y - ufo.position.y,
      ship.position.x - ufo.position.x
    );
    
    // Add inaccuracy based on UFO type and score
    if (ufo.size === "large") {
      // Large UFO fires randomly
      targetAngle = Math.random() * Math.PI * 2;
    } else {
      // Small UFO has improving accuracy
      const baseDeviation = Math.max(0.1, 0.5 - (score / 100000)); // More accurate at higher scores
      const maxDeviation = baseDeviation / ufoAccuracyMultiplier; // Difficulty affects accuracy
      targetAngle += (Math.random() - 0.5) * maxDeviation;
    }
    
    const bulletVel = new THREE.Vector2(
      Math.cos(targetAngle) * BULLET_SPEED,
      Math.sin(targetAngle) * BULLET_SPEED
    );
    
    addBullet({
      id: `ufo-bullet-${Date.now()}`,
      position: ufo.position.clone(),
      velocity: bulletVel,
      lifetime: BULLET_LIFESPAN,
      fromPlayer: false
    });
  };
  
  
  useFrame((_, delta) => {
    if (phase !== "playing") return;
    
    const controls = getKeys();
    
    // Update ship
    if (ship) {
      let newRotation = ship.rotation;
      let newVelocity = ship.velocity.clone();
      let isThrusting = false;
      
      // Rotation
      if (controls.left) {
        newRotation += SHIP_ROTATION_SPEED;
      }
      if (controls.right) {
        newRotation -= SHIP_ROTATION_SPEED;
      }
      
      // Thrust
      if (controls.thrust) {
        isThrusting = true;
        // Ship geometry points along +Y, so thrust direction matches nose direction
        const thrustX = -Math.sin(newRotation) * THRUST_ACCELERATION;
        const thrustY = Math.cos(newRotation) * THRUST_ACCELERATION;
        newVelocity.x += thrustX;
        newVelocity.y += thrustY;
        
        // Cap speed
        const speed = newVelocity.length();
        if (speed > MAX_SHIP_SPEED) {
          newVelocity.normalize().multiplyScalar(MAX_SHIP_SPEED);
        }
      }
      
      // Fire
      if (controls.fire) {
        fireBullet(true);
      }

      // Apply velocity decay
      newVelocity.multiplyScalar(VELOCITY_DECAY);
      
      // Update position
      const newPosition = ship.position.clone().add(newVelocity);
      const wrappedPosition = wrapPosition(newPosition);
      
      // Update invincibility
      const newInvincibilityTimer = Math.max(0, ship.invincibilityTimer - 1);
      const isInvincible = newInvincibilityTimer > 0;
      
      updateShip({
        position: wrappedPosition,
        velocity: newVelocity.clone(), // Clone to avoid reference issues
        rotation: newRotation,
        isThrusting,
        invincibilityTimer: newInvincibilityTimer,
        isInvincible
      });
    }
    
    // Update asteroids
    updateAsteroids((asteroid) => ({
      ...asteroid,
      position: wrapPosition(asteroid.position.clone().add(asteroid.velocity)),
      rotation: asteroid.rotation + asteroid.rotationSpeed
    }));

    // Update bullets - filter out expired bullets
    const bulletsToRemove: string[] = [];
    updateBullets((bullet) => {
      const newLifetime = bullet.lifetime - 1;
      if (newLifetime <= 0) {
        bulletsToRemove.push(bullet.id);
      }
      return {
        ...bullet,
        position: wrapPosition(bullet.position.clone().add(bullet.velocity)),
        lifetime: newLifetime
      };
    });
    // Remove expired bullets after update
    bulletsToRemove.forEach(id => removeBullet(id));

    // Update UFO
    if (ufo) {
      // Check if UFO should be removed before updating (centered coordinates)
      const shouldRemoveUFO = ufo.position.x < -GAME_WIDTH / 2 - 50 || ufo.position.x > GAME_WIDTH / 2 + 50;

      if (shouldRemoveUFO) {
        removeUFO();
      } else {
        // Occasional vertical drift
        const applyDrift = Math.random() < 0.02;
        const newVelocityY = applyDrift ? (Math.random() - 0.5) * 1 : ufo.velocity.y;

        // Fire at player
        const difficulty = useSettingsStore.getState().difficulty;
        const { ufoFireRateMultiplier } = getDifficultyMultipliers(difficulty);
        const newFireTimer = ufo.fireTimer - 1;

        if (newFireTimer <= 0) {
          ufoFireBullet();
        }

        updateUFO((currentUfo) => ({
          ...currentUfo,
          position: currentUfo.position.clone().add(currentUfo.velocity),
          velocity: new THREE.Vector2(currentUfo.velocity.x, newVelocityY),
          fireTimer: newFireTimer <= 0 ? UFO_FIRE_INTERVAL * ufoFireRateMultiplier : newFireTimer
        }));
      }
    } else {
      // Spawn UFO timer
      const newTimer = ufoSpawnTimer - 1;
      useAsteroidsGame.setState({ ufoSpawnTimer: newTimer });
      
      if (newTimer <= 0 && asteroids.length > 0) {
        spawnUFO();
      }
    }
    
    // Collision detection
    if (ship && !ship.isInvincible) {
      // Ship vs Asteroids
      asteroids.forEach((asteroid) => {
        if (checkCollision(ship.position, 10, asteroid.position, asteroid.radius)) {
          destroyShip();
        }
      });
      
      // Ship vs UFO
      if (ufo && checkCollision(ship.position, 10, ufo.position, ufo.radius)) {
        destroyShip();
        removeUFO();
      }
      
      // Ship vs UFO bullets
      bullets.forEach((bullet) => {
        if (!bullet.fromPlayer && checkCollision(ship.position, 10, bullet.position, 2)) {
          destroyShip();
          removeBullet(bullet.id);
        }
      });
    }
    
    // Bullets vs Asteroids
    bullets.forEach((bullet) => {
      if (!bullet.fromPlayer) return; // Only player bullets hit asteroids
      
      asteroids.forEach((asteroid) => {
        if (checkCollision(bullet.position, 2, asteroid.position, asteroid.radius)) {
          splitAsteroid(asteroid);
          removeBullet(bullet.id);
        }
      });
      
      // Bullets vs UFO
      if (ufo && checkCollision(bullet.position, 2, ufo.position, ufo.radius)) {
        removeUFO();
        removeBullet(bullet.id);
      }
    });
    
    // UFO vs Asteroids
    if (ufo) {
      asteroids.forEach((asteroid) => {
        if (checkCollision(ufo.position, ufo.radius, asteroid.position, asteroid.radius)) {
          removeUFO();
        }
      });
    }
    
    // Check if wave is complete
    if (asteroids.length === 0 && !ufo && ship) {
      setTimeout(() => {
        // Increment wave counter before spawning next wave
        useAsteroidsGame.setState((state) => ({ wave: state.wave + 1 }));
        nextWave();
      }, 2000);
    }
    
    // Update explosions
    updateExplosions();
  });
  
  return null;
}
