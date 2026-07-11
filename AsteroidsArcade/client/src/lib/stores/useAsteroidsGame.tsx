import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import * as THREE from "three";
import { fetchHighScores, submitHighScore } from "../api/highScores";
import { useSettingsStore, getDifficultyMultipliers } from "./useSettingsStore";

// Constants matching the original arcade game
export const GAME_WIDTH = 1000;
export const GAME_HEIGHT = 800;
export const SHIP_RADIUS = 10;
export const SHIP_ROTATION_SPEED = 0.1; // ~6 degrees per frame
export const THRUST_ACCELERATION = 0.5;
export const MAX_SHIP_SPEED = 8;
export const VELOCITY_DECAY = 0.99; // Slight friction
export const BULLET_SPEED = 10;
export const MAX_BULLETS = 4;
export const BULLET_LIFESPAN = 40; // frames (~0.67 seconds at 60fps)
export const HYPERSPACE_DEATH_CHANCE = 0.25;
export const EXTRA_LIFE_THRESHOLD = 10000;

// Asteroid constants
export const LARGE_ASTEROID_RADIUS = 40;
export const MEDIUM_ASTEROID_RADIUS = 20;
export const SMALL_ASTEROID_RADIUS = 10;
export const LARGE_ASTEROID_SPEED = 1;
export const MEDIUM_ASTEROID_SPEED = 2;
export const SMALL_ASTEROID_SPEED = 3;
export const LARGE_ASTEROID_ROTATION = 0.035; // ~2 degrees per frame
export const MEDIUM_ASTEROID_ROTATION = 0.087; // ~5 degrees per frame
export const SMALL_ASTEROID_ROTATION = 0.175; // ~10 degrees per frame

// Scoring
export const SCORE_LARGE_ASTEROID = 20;
export const SCORE_MEDIUM_ASTEROID = 50;
export const SCORE_SMALL_ASTEROID = 100;
export const SCORE_LARGE_SAUCER = 200;
export const SCORE_SMALL_SAUCER = 1000;

// UFO constants
export const UFO_SPAWN_INTERVAL = 1500; // frames (~25 seconds)
export const UFO_SPAWN_SCORE_THRESHOLD = 40000; // Only small saucers after this
export const UFO_ACCURACY_THRESHOLD = 35000; // Maximum accuracy after this score
export const LARGE_UFO_RADIUS = 15;
export const SMALL_UFO_RADIUS = 10;
export const LARGE_UFO_SPEED = 2;
export const SMALL_UFO_SPEED = 3;
export const UFO_FIRE_INTERVAL = 60; // frames (~1 second)

export type GamePhase = "menu" | "playing" | "paused" | "game_over" | "enter_initials";

export interface Ship {
  position: THREE.Vector2;
  velocity: THREE.Vector2;
  rotation: number; // radians
  isThrusting: boolean;
  isInvincible: boolean;
  invincibilityTimer: number;
}

export interface Asteroid {
  id: string;
  position: THREE.Vector2;
  velocity: THREE.Vector2;
  rotation: number;
  rotationSpeed: number;
  size: "large" | "medium" | "small";
  radius: number;
  shape: THREE.Vector2[]; // Irregular polygon vertices
}

export interface Bullet {
  id: string;
  position: THREE.Vector2;
  velocity: THREE.Vector2;
  lifetime: number;
  fromPlayer: boolean;
}

export interface UFO {
  id: string;
  position: THREE.Vector2;
  velocity: THREE.Vector2;
  size: "large" | "small";
  radius: number;
  fireTimer: number;
}

export interface HighScore {
  initials: string;
  score: number;
}

interface AsteroidsGameState {
  // Game state
  phase: GamePhase;
  score: number;
  lives: number;
  wave: number;
  highScores: HighScore[];
  lastExtraLifeScore: number;
  
  // Entities
  ship: Ship | null;
  asteroids: Asteroid[];
  bullets: Bullet[];
  ufo: UFO | null;
  ufoSpawnTimer: number;
  
  // Temporary state
  pendingInitials: string;
  explosions: Array<{ position: THREE.Vector2; type: string; timer: number }>;
  
  // Actions
  startGame: () => void;
  restartGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  nextWave: () => void;
  
  // Entity management
  spawnShip: () => void;
  destroyShip: () => void;
  updateShip: (updates: Partial<Ship>) => void;
  
  addAsteroid: (asteroid: Asteroid) => void;
  removeAsteroid: (id: string) => void;
  splitAsteroid: (asteroid: Asteroid) => void;
  updateAsteroids: (updater: (asteroid: Asteroid) => Asteroid) => void;

  addBullet: (bullet: Bullet) => void;
  removeBullet: (id: string) => void;
  updateBullets: (updater: (bullet: Bullet) => Bullet) => void;

  spawnUFO: () => void;
  removeUFO: () => void;
  updateUFO: (updater: (ufo: UFO) => UFO) => void;
  
  addExplosion: (position: THREE.Vector2, type: string) => void;
  updateExplosions: () => void;
  
  // High scores
  loadHighScores: () => Promise<void>;
  addHighScore: (initials: string, score: number) => Promise<void>;
  setInitials: (initials: string) => void;
  
  // Utility
  resetEntities: () => void;
}

// Generate random irregular asteroid shape
function generateAsteroidShape(size: "large" | "medium" | "small"): THREE.Vector2[] {
  const vertices: THREE.Vector2[] = [];
  const numVertices = 8 + Math.floor(Math.random() * 4); // 8-11 vertices
  const baseRadius = size === "large" ? LARGE_ASTEROID_RADIUS : 
                     size === "medium" ? MEDIUM_ASTEROID_RADIUS : 
                     SMALL_ASTEROID_RADIUS;
  
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const radiusVariation = 0.7 + Math.random() * 0.6; // 70%-130% of base radius
    const radius = baseRadius * radiusVariation;
    vertices.push(new THREE.Vector2(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    ));
  }
  
  return vertices;
}

export const useAsteroidsGame = create<AsteroidsGameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    phase: "menu",
    score: 0,
    lives: 3,
    wave: 1,
    highScores: [],
    lastExtraLifeScore: 0,
    
    ship: null,
    asteroids: [],
    bullets: [],
    ufo: null,
    ufoSpawnTimer: UFO_SPAWN_INTERVAL,
    
    pendingInitials: "",
    explosions: [],
    
    // Actions
    startGame: () => {
      console.log('[startGame] BEGIN - Resetting all game state');
      set({
        phase: "playing",
        score: 0,
        lives: 3,
        wave: 1,
        lastExtraLifeScore: 0,
        ship: null, // Explicitly clear ship before spawning new one
        asteroids: [],
        bullets: [],
        ufo: null,
        ufoSpawnTimer: UFO_SPAWN_INTERVAL,
        explosions: []
      });
      console.log('[startGame] State reset complete, spawning ship');
      get().spawnShip();
      console.log('[startGame] Ship spawned, ship state:', get().ship);
      get().nextWave();
      console.log('[startGame] END - Game started');
    },
    
    restartGame: () => {
      get().startGame();
    },
    
    pauseGame: () => {
      const { phase } = get();
      if (phase === "playing") {
        set({ phase: "paused" });
      }
    },
    
    resumeGame: () => {
      const { phase } = get();
      if (phase === "paused") {
        set({ phase: "playing" });
      }
    },
    
    gameOver: () => {
      const { score, highScores } = get();
      // Check if score qualifies for high score list
      const lowestHighScore = highScores.length < 10 ? 0 : highScores[highScores.length - 1].score;
      
      if (highScores.length < 10 || score > lowestHighScore) {
        set({ phase: "enter_initials", pendingInitials: "" });
      } else {
        set({ phase: "game_over" });
      }
    },
    
    addScore: (points: number) => {
      set((state) => {
        const newScore = state.score + points;
        const lastThreshold = Math.floor(state.lastExtraLifeScore / EXTRA_LIFE_THRESHOLD);
        const newThreshold = Math.floor(newScore / EXTRA_LIFE_THRESHOLD);
        
        // Award extra life if crossed threshold
        if (newThreshold > lastThreshold) {
          return {
            score: newScore,
            lives: state.lives + 1,
            lastExtraLifeScore: newScore
          };
        }
        
        return { score: newScore };
      });
    },
    
    loseLife: () => {
      set((state) => {
        const newLives = state.lives - 1;
        if (newLives <= 0) {
          get().gameOver();
          return { lives: 0 };
        } else {
          // Respawn ship after a brief delay
          setTimeout(() => {
            get().spawnShip();
          }, 2000);
          return { lives: newLives };
        }
      });
    },
    
    nextWave: () => {
      set((state) => {
        const currentWave = state.wave;
        // Start with 4 large asteroids, add 2 per wave up to max of 11
        const numAsteroids = Math.min(4 + (currentWave - 1) * 2, 11);

        const asteroids: Asteroid[] = [];
        for (let i = 0; i < numAsteroids; i++) {
          // Spawn from edges (using centered coordinates)
          const edge = Math.floor(Math.random() * 4);
          let x = 0, y = 0;

          switch (edge) {
            case 0: // Top
              x = (Math.random() - 0.5) * GAME_WIDTH;
              y = GAME_HEIGHT / 2;
              break;
            case 1: // Right
              x = GAME_WIDTH / 2;
              y = (Math.random() - 0.5) * GAME_HEIGHT;
              break;
            case 2: // Bottom
              x = (Math.random() - 0.5) * GAME_WIDTH;
              y = -GAME_HEIGHT / 2;
              break;
            case 3: // Left
              x = -GAME_WIDTH / 2;
              y = (Math.random() - 0.5) * GAME_HEIGHT;
              break;
          }

          const angle = Math.random() * Math.PI * 2;
          const difficulty = useSettingsStore.getState().difficulty;
          const { asteroidSpeedMultiplier } = getDifficultyMultipliers(difficulty);
          const speed = LARGE_ASTEROID_SPEED * asteroidSpeedMultiplier;

          asteroids.push({
            id: `asteroid-${Date.now()}-${i}`,
            position: new THREE.Vector2(x, y),
            velocity: new THREE.Vector2(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed
            ),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: LARGE_ASTEROID_ROTATION,
            size: "large",
            radius: LARGE_ASTEROID_RADIUS,
            shape: generateAsteroidShape("large")
          });
        }

        // Don't increment wave here - it will be incremented after wave is cleared
        return { asteroids };
      });
    },
    
    // Ship management
    spawnShip: () => {
      const newShip = {
        position: new THREE.Vector2(0, 0), // Center of screen
        velocity: new THREE.Vector2(0, 0),
        rotation: -Math.PI / 2, // Point upward
        isThrusting: false,
        isInvincible: true,
        invincibilityTimer: 300 // 5 seconds at 60fps (increased for safety)
      };
      console.log('[spawnShip] Creating FRESH ship:', {
        position: `(${newShip.position.x}, ${newShip.position.y})`,
        velocity: `(${newShip.velocity.x}, ${newShip.velocity.y})`,
        rotation: newShip.rotation,
        isThrusting: newShip.isThrusting
      });
      set({ ship: newShip });

      // Verify ship was set correctly
      const verifyShip = get().ship;
      console.log('[spawnShip] VERIFIED ship in state:', {
        position: verifyShip ? `(${verifyShip.position.x}, ${verifyShip.position.y})` : 'null',
        velocity: verifyShip ? `(${verifyShip.velocity.x}, ${verifyShip.velocity.y})` : 'null',
        rotation: verifyShip?.rotation,
        isThrusting: verifyShip?.isThrusting
      });
    },
    
    destroyShip: () => {
      const { ship } = get();
      if (ship) {
        get().addExplosion(ship.position.clone(), "ship");
        set({ ship: null });
        get().loseLife();
      }
    },
    
    updateShip: (updates: Partial<Ship>) => {
      set((state) => {
        if (!state.ship) return { ship: null };

        // Deep clone Vector2 objects to prevent mutation
        const updatedShip = { ...state.ship, ...updates };
        if (updates.position) {
          updatedShip.position = updates.position.clone();
        }
        if (updates.velocity) {
          updatedShip.velocity = updates.velocity.clone();
        }

        return { ship: updatedShip };
      });
    },
    
    // Asteroid management
    addAsteroid: (asteroid: Asteroid) => {
      set((state) => ({
        asteroids: [...state.asteroids, asteroid]
      }));
    },
    
    removeAsteroid: (id: string) => {
      set((state) => ({
        asteroids: state.asteroids.filter(a => a.id !== id)
      }));
    },
    
    splitAsteroid: (asteroid: Asteroid) => {
      const { size, position } = asteroid;
      
      if (size === "small") {
        // Small asteroids don't split
        get().removeAsteroid(asteroid.id);
        get().addScore(SCORE_SMALL_ASTEROID);
        get().addExplosion(position.clone(), "asteroid_small");
        return;
      }
      
      // Remove parent asteroid
      get().removeAsteroid(asteroid.id);
      
      // Award points
      if (size === "large") {
        get().addScore(SCORE_LARGE_ASTEROID);
      } else {
        get().addScore(SCORE_MEDIUM_ASTEROID);
      }
      
      get().addExplosion(position.clone(), size === "large" ? "asteroid_large" : "asteroid_medium");
      
      // Create two smaller asteroids
      const newSize = size === "large" ? "medium" : "small";
      const newRadius = newSize === "medium" ? MEDIUM_ASTEROID_RADIUS : SMALL_ASTEROID_RADIUS;
      const baseSpeed = newSize === "medium" ? MEDIUM_ASTEROID_SPEED : SMALL_ASTEROID_SPEED;
      const difficulty = useSettingsStore.getState().difficulty;
      const { asteroidSpeedMultiplier } = getDifficultyMultipliers(difficulty);
      const newSpeed = baseSpeed * asteroidSpeedMultiplier;
      const newRotationSpeed = newSize === "medium" ? MEDIUM_ASTEROID_ROTATION : SMALL_ASTEROID_ROTATION;
      
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const offsetAngle = i === 0 ? Math.PI / 4 : -Math.PI / 4; // Split apart
        
        get().addAsteroid({
          id: `asteroid-${Date.now()}-${Math.random()}`,
          position: position.clone(),
          velocity: new THREE.Vector2(
            asteroid.velocity.x + Math.cos(angle + offsetAngle) * newSpeed,
            asteroid.velocity.y + Math.sin(angle + offsetAngle) * newSpeed
          ),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: newRotationSpeed,
          size: newSize,
          radius: newRadius,
          shape: generateAsteroidShape(newSize)
        });
      }
    },

    updateAsteroids: (updater: (asteroid: Asteroid) => Asteroid) => {
      set((state) => ({
        asteroids: state.asteroids.map(updater)
      }));
    },

    // Bullet management
    addBullet: (bullet: Bullet) => {
      set((state) => {
        // Only limit player bullets, not UFO bullets
        const playerBulletCount = state.bullets.filter(b => b.fromPlayer).length;
        if (playerBulletCount >= MAX_BULLETS && bullet.fromPlayer) {
          return {}; // Can't fire more than MAX_BULLETS player shots
        }
        return {
          bullets: [...state.bullets, bullet]
        };
      });
    },
    
    removeBullet: (id: string) => {
      set((state) => ({
        bullets: state.bullets.filter(b => b.id !== id)
      }));
    },

    updateBullets: (updater: (bullet: Bullet) => Bullet) => {
      set((state) => ({
        bullets: state.bullets.map(updater)
      }));
    },

    // UFO management
    spawnUFO: () => {
      const { score, wave } = get();
      
      // Determine UFO type based on score
      const isSmall = score > 10000 && (score > UFO_SPAWN_SCORE_THRESHOLD || Math.random() > 0.5);
      const size = isSmall ? "small" : "large";
      const radius = isSmall ? SMALL_UFO_RADIUS : LARGE_UFO_RADIUS;
      const baseSpeed = isSmall ? SMALL_UFO_SPEED : LARGE_UFO_SPEED;
      const difficulty = useSettingsStore.getState().difficulty;
      const { ufoSpeedMultiplier } = getDifficultyMultipliers(difficulty);
      const speed = baseSpeed * ufoSpeedMultiplier;
      
      // Spawn from left or right edge (centered coordinates)
      const fromLeft = Math.random() > 0.5;
      const x = fromLeft ? -GAME_WIDTH / 2 : GAME_WIDTH / 2;
      const y = (Math.random() - 0.5) * (GAME_HEIGHT * 0.6); // Keep UFO in middle 60% of screen height
      
      set({
        ufo: {
          id: `ufo-${Date.now()}`,
          position: new THREE.Vector2(x, y),
          velocity: new THREE.Vector2(fromLeft ? speed : -speed, 0),
          size,
          radius,
          fireTimer: UFO_FIRE_INTERVAL
        },
        ufoSpawnTimer: UFO_SPAWN_INTERVAL
      });
    },
    
    removeUFO: () => {
      const { ufo } = get();
      if (ufo) {
        get().addExplosion(ufo.position.clone(), ufo.size === "large" ? "ufo_large" : "ufo_small");
        get().addScore(ufo.size === "large" ? SCORE_LARGE_SAUCER : SCORE_SMALL_SAUCER);
        set({ ufo: null, ufoSpawnTimer: UFO_SPAWN_INTERVAL });
      }
    },

    updateUFO: (updater: (ufo: UFO) => UFO) => {
      set((state) => ({
        ufo: state.ufo ? updater(state.ufo) : null
      }));
    },

    // Explosion management
    addExplosion: (position: THREE.Vector2, type: string) => {
      set((state) => ({
        explosions: [...state.explosions, { position, type, timer: 30 }]
      }));
    },
    
    updateExplosions: () => {
      set((state) => ({
        explosions: state.explosions
          .map(e => ({ ...e, timer: e.timer - 1 }))
          .filter(e => e.timer > 0)
      }));
    },
    
    // High scores
    loadHighScores: async () => {
      try {
        const scores = await fetchHighScores(10);
        set({ highScores: scores });
      } catch (error) {
        console.error("Failed to load high scores:", error);
        set({ highScores: [] });
      }
    },
    
    addHighScore: async (initials: string, score: number) => {
      try {
        const result = await submitHighScore({ initials, score });
        if (result) {
          await get().loadHighScores();
        } else {
          console.error("Failed to submit high score");
        }
      } catch (error) {
        console.error("Error submitting high score:", error);
      } finally {
        set({ phase: "game_over" });
      }
    },
    
    setInitials: (initials: string) => {
      set({ pendingInitials: initials });
    },
    
    // Utility
    resetEntities: () => {
      set({
        asteroids: [],
        bullets: [],
        ufo: null,
        explosions: []
      });
    }
  }))
);
