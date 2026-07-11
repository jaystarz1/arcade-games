import { useEffect, useRef, useState } from 'react';

type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface Star {
  x: number;
  y: number;
  brightness: number;
}

interface Lander {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
  thrusting: boolean;
}

interface TerrainPoint {
  x: number;
  y: number;
}

interface LandingPad {
  x: number;
  width: number;
  multiplier: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface TouchButton {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  pressed: boolean;
  touchId: number | null;
}

interface GameResult {
  success: boolean;
  score: number;
  fuelRemaining: number;
  landingSpeed: number;
  reason?: string;
}

export default function LunarLander() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [highScore, setHighScore] = useState<number>(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [isTrainingMode, setIsTrainingMode] = useState<boolean>(true);
  
  const audioRef = useRef({
    thrust: null as HTMLAudioElement | null,
    success: null as HTMLAudioElement | null,
    crash: null as HTMLAudioElement | null
  });

  const gameDataRef = useRef({
    lander: null as Lander | null,
    terrain: [] as TerrainPoint[],
    landingPads: [] as LandingPad[],
    stars: [] as Star[],
    particles: [] as Particle[],
    keys: {
      left: false,
      right: false,
      up: false,
      space: false,
      p: false,
      enter: false
    },
    touchButtons: {} as { [key: string]: TouchButton },
    lastTime: 0,
    gameStartTime: 0,
    score: 0,
    totalScore: 0,
    animationFrameId: 0,
    isTouchDevice: false,
    cameraX: 0,
    worldWidth: 0,
    currentLevel: 0
  });

  useEffect(() => {
    const savedHighScore = localStorage.getItem('lunarLanderHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    const savedDifficulty = localStorage.getItem('lunarLanderDifficulty');
    if (savedDifficulty && ['EASY', 'MEDIUM', 'HARD'].includes(savedDifficulty)) {
      setDifficulty(savedDifficulty as Difficulty);
    }

    gameDataRef.current.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Touch buttons now handled by HTML overlay (see JSX below)

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = Math.min(container.clientWidth, 800);
        canvas.height = Math.min(container.clientHeight, 600);
        generateStars();
        // setupTouchButtons removed - using HTML overlay instead
        if (gameState === 'START') {
          generateTerrain();
        }
      }
    };

    const generateStars = () => {
      const stars: Star[] = [];
      for (let i = 0; i < 100; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          brightness: Math.random() * 0.5 + 0.5
        });
      }
      gameDataRef.current.stars = stars;
    };

    const getDifficultySettings = () => {
      switch (difficulty) {
        case 'EASY':
          return { mountainHeight: 100, segments: 15, fuel: 700 };
        case 'HARD':
          return { mountainHeight: 200, segments: 30, fuel: 400 };
        default:
          return { mountainHeight: 150, segments: 20, fuel: 500 };
      }
    };

    const generateTerrain = () => {
      const terrain: TerrainPoint[] = [];
      const settings = getDifficultySettings();
      const segments = settings.segments * 4;
      const worldWidth = canvas.width * 4;
      const segmentWidth = worldWidth / segments;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const baseHeight = isMobile
        ? canvas.height - 140  // 90px up from original 50
        : canvas.height - 50;
      const mountainHeight = settings.mountainHeight;

      const landingPads: LandingPad[] = [];
      const numPads = 3 + Math.floor(Math.random() * 2);
      const padSizes = [1, 2, 3, 4];
      
      const padPositions: Array<{start: number, end: number, size: number}> = [];
      for (let p = 0; p < numPads; p++) {
        let attempts = 0;
        let validPosition = false;
        let start = 0, end = 0, padSize = 0;
        
        while (!validPosition && attempts < 20) {
          padSize = padSizes[Math.floor(Math.random() * padSizes.length)];
          start = Math.floor(Math.random() * (segments - padSize - 10)) + 5;
          end = start + padSize;
          
          validPosition = true;
          for (const existing of padPositions) {
            if (!(end < existing.start - 5 || start > existing.end + 5)) {
              validPosition = false;
              break;
            }
          }
          attempts++;
        }
        
        if (validPosition) {
          padPositions.push({ start, end, size: padSize });
          const multiplier = padSize === 1 ? 5 : padSize === 2 ? 4 : padSize === 3 ? 3 : 2;
          landingPads.push({
            x: start * segmentWidth,
            width: padSize * segmentWidth,
            multiplier,
            y: baseHeight
          });
        }
      }

      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth;
        let y;
        let isFlat = false;
        
        for (const pos of padPositions) {
          if (i >= pos.start && i <= pos.end) {
            isFlat = true;
            break;
          }
        }
        
        if (isFlat) {
          y = baseHeight;
        } else {
          const variation = (Math.random() - 0.5) * mountainHeight;
          y = baseHeight + variation;
        }

        terrain.push({ x, y });
      }

      gameDataRef.current.terrain = terrain;
      gameDataRef.current.landingPads = landingPads;
      gameDataRef.current.worldWidth = worldWidth;
    };

    const initLander = () => {
      const settings = getDifficultySettings();
      const worldWidth = gameDataRef.current.worldWidth;

      // Clear all key states to prevent stuck inputs (especially on mobile)
      gameDataRef.current.keys.left = false;
      gameDataRef.current.keys.right = false;
      gameDataRef.current.keys.up = false;
      gameDataRef.current.keys.space = false;
      gameDataRef.current.keys.p = false;

      gameDataRef.current.lander = {
        x: worldWidth / 2,
        y: 100,
        vx: 30 + Math.random() * 20,
        vy: 10 + Math.random() * 10,
        angle: 0,
        fuel: settings.fuel,
        thrusting: false
      };
      gameDataRef.current.cameraX = (worldWidth / 2) - (canvas.width / 2);
      gameDataRef.current.gameStartTime = Date.now();
      gameDataRef.current.score = 0;
      gameDataRef.current.particles = [];
    };

    const playSound = (soundType: 'thrust' | 'success' | 'crash') => {
      if (isMuted) return;
      
      const audio = audioRef.current[soundType];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') {
        gameDataRef.current.keys.left = true;
        e.preventDefault();
      }
      if (e.code === 'ArrowRight') {
        gameDataRef.current.keys.right = true;
        e.preventDefault();
      }
      if (e.code === 'ArrowUp') {
        gameDataRef.current.keys.up = true;
        e.preventDefault();
      }
      if (e.code === 'Space') {
        gameDataRef.current.keys.space = true;
        e.preventDefault();
      }
      if (e.code === 'KeyP') {
        gameDataRef.current.keys.p = true;
        e.preventDefault();
      }
      if (e.code === 'KeyM') {
        setIsMuted(!isMuted);
        e.preventDefault();
      }
      if (e.code === 'Enter') {
        gameDataRef.current.keys.enter = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') gameDataRef.current.keys.left = false;
      if (e.code === 'ArrowRight') gameDataRef.current.keys.right = false;
      if (e.code === 'ArrowUp') gameDataRef.current.keys.up = false;
      if (e.code === 'Space') gameDataRef.current.keys.space = false;
      if (e.code === 'KeyP') gameDataRef.current.keys.p = false;
      if (e.code === 'Enter') gameDataRef.current.keys.enter = false;
    };

    // Simplified touch handlers - HTML buttons now handle movement controls
    // Canvas touch only handles "tap to start" gestures
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (gameState === 'START' || gameState === 'GAME_OVER') {
        gameDataRef.current.keys.space = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      gameDataRef.current.keys.space = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const createParticles = (x: number, y: number, type: 'thrust' | 'explosion') => {
      const count = type === 'thrust' ? 3 : 20;
      const colors = type === 'thrust' ? ['#ff6600', '#ffaa00', '#ff4400'] : ['#ff0000', '#ff6600', '#ffff00'];

      for (let i = 0; i < count; i++) {
        const angle = type === 'thrust' 
          ? (Math.PI / 2) + (Math.random() - 0.5) * 0.5
          : Math.random() * Math.PI * 2;
        const speed = type === 'thrust' ? 20 + Math.random() * 20 : 50 + Math.random() * 100;

        gameDataRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: type === 'thrust' ? 0.5 : 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    const updateParticles = (dt: number) => {
      gameDataRef.current.particles = gameDataRef.current.particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 20 * dt;
        p.life -= dt;
        return p.life > 0;
      });
    };

    const update = (deltaTime: number) => {
      const lander = gameDataRef.current.lander;
      if (!lander) return;

      const dt = deltaTime / 1000;
      const gravity = 20;
      const rotationSpeed = 3;
      const thrustPower = 40;
      const fuelConsumption = 50;

      if (gameDataRef.current.keys.left) {
        lander.angle -= rotationSpeed * dt;
      }
      if (gameDataRef.current.keys.right) {
        lander.angle += rotationSpeed * dt;
      }

      const wasThrusting = lander.thrusting;
      lander.thrusting = false;

      if (gameDataRef.current.keys.up && lander.fuel > 0) {
        const thrustX = Math.sin(lander.angle) * thrustPower;
        const thrustY = -Math.cos(lander.angle) * thrustPower;
        
        lander.vx += thrustX * dt;
        lander.vy += thrustY * dt;
        // Only consume fuel on non-training levels (level > 0)
        if (gameDataRef.current.currentLevel > 0) {
          lander.fuel -= fuelConsumption * dt;
          lander.fuel = Math.max(0, lander.fuel);
        }
        lander.thrusting = true;

        if (Math.random() < 0.3) {
          const thrustOffsetX = Math.sin(lander.angle) * 10;
          const thrustOffsetY = -Math.cos(lander.angle) * 10;
          createParticles(lander.x - thrustOffsetX, lander.y - thrustOffsetY, 'thrust');
        }

        if (!wasThrusting) {
          playSound('thrust');
        }
      }

      lander.vy += gravity * dt;

      lander.x += lander.vx * dt;
      lander.y += lander.vy * dt;

      gameDataRef.current.cameraX = lander.x - canvas.width / 2;
      gameDataRef.current.cameraX = Math.max(0, Math.min(gameDataRef.current.cameraX, gameDataRef.current.worldWidth - canvas.width));

      const timeElapsed = Date.now() - gameDataRef.current.gameStartTime;
      const speed = Math.sqrt(lander.vx * lander.vx + lander.vy * lander.vy);
      const currentLevelScore = calculateScore(lander.fuel, speed, lander.angle, timeElapsed);
      gameDataRef.current.score = gameDataRef.current.totalScore + currentLevelScore;

      updateParticles(dt);
      checkCollision();
    };

    const checkCollision = () => {
      const lander = gameDataRef.current.lander;
      const terrain = gameDataRef.current.terrain;
      if (!lander || terrain.length === 0) return;

      const landerSize = 10;
      const landerBottom = lander.y + landerSize;

      for (let i = 0; i < terrain.length - 1; i++) {
        const p1 = terrain[i];
        const p2 = terrain[i + 1];

        if (lander.x >= p1.x && lander.x <= p2.x) {
          const segmentY = p1.y + ((p2.y - p1.y) * (lander.x - p1.x)) / (p2.x - p1.x);

          if (landerBottom >= segmentY) {
            let landedPad: LandingPad | null = null;
            for (const pad of gameDataRef.current.landingPads) {
              if (lander.x >= pad.x && lander.x <= pad.x + pad.width) {
                landedPad = pad;
                break;
              }
            }
            
            const speed = Math.sqrt(lander.vx * lander.vx + lander.vy * lander.vy);
            const maxSafeSpeed = 30;
            const maxSafeAngle = 0.3;

            if (landedPad && speed < maxSafeSpeed && Math.abs(lander.angle) < maxSafeAngle) {
              const timeElapsed = Date.now() - gameDataRef.current.gameStartTime;
              let baseScore = calculateScore(lander.fuel, speed, lander.angle, timeElapsed);
              const landingBonus = baseScore * landedPad.multiplier;

              playSound('success');

              // Only advance level and score if not in training mode
              if (gameDataRef.current.currentLevel > 0) {
                gameDataRef.current.totalScore += landingBonus;
                gameDataRef.current.score = gameDataRef.current.totalScore;
                const bonusFuel = 100;

                if (gameDataRef.current.totalScore > highScore) {
                  setHighScore(gameDataRef.current.totalScore);
                  localStorage.setItem('lunarLanderHighScore', gameDataRef.current.totalScore.toString());
                }

                gameDataRef.current.currentLevel++;
                generateTerrain();

                const settings = getDifficultySettings();
                lander.fuel = Math.min(lander.fuel + bonusFuel, settings.fuel);
              }

              // Reset lander position (both training and normal modes)
              lander.x = gameDataRef.current.worldWidth / 2;
              lander.y = 50;
              lander.vx = 30 + Math.random() * 20;
              lander.vy = 10 + Math.random() * 10;
              lander.angle = 0;
              gameDataRef.current.cameraX = (gameDataRef.current.worldWidth / 2) - (canvas.width / 2);
              gameDataRef.current.gameStartTime = Date.now();
            } else {
              handleCrash(speed, landedPad === null);
            }
          }
        }
      }

      if (lander.x < 0 || lander.x > gameDataRef.current.worldWidth) {
        handleCrash(0, true);
      }
    };

    const handleCrash = (speed: number, missedPad: boolean) => {
      createParticles(gameDataRef.current.lander!.x, gameDataRef.current.lander!.y, 'explosion');
      playSound('crash');

      let reason = 'Too much speed!';
      if (missedPad) reason = 'Missed landing pad!';
      else if (Math.abs(gameDataRef.current.lander!.angle) >= 0.3) reason = 'Wrong angle!';

      gameDataRef.current.score = gameDataRef.current.totalScore;

      setLives(prevLives => {
        const remainingLives = prevLives - 1;
        
        if (remainingLives > 0) {
          setTimeout(() => {
            initLander();
            setGameState('PLAYING');
          }, 2000);
        } else {
          setGameResult({
            success: false,
            score: gameDataRef.current.totalScore,
            fuelRemaining: gameDataRef.current.lander!.fuel,
            landingSpeed: speed,
            reason
          });
          setGameState('GAME_OVER');
        }
        
        return remainingLives;
      });
    };

    const calculateScore = (fuel: number, speed: number, angle: number, timeMs: number) => {
      const settings = getDifficultySettings();
      let score = 1000;
      
      const fuelPercent = (fuel / settings.fuel) * 100;
      if (fuelPercent > 75) score += 500;
      else if (fuelPercent > 50) score += 300;
      else if (fuelPercent > 25) score += 100;

      const maxSafeSpeed = 30;
      const speedPercent = (speed / maxSafeSpeed) * 100;
      if (speedPercent < 25) score += 500;
      else if (speedPercent < 50) score += 300;
      else if (speedPercent < 75) score += 100;
      else score += 50;

      const angleDegrees = Math.abs(angle) * (180 / Math.PI);
      if (angleDegrees < 5) score += 400;
      else if (angleDegrees < 10) score += 200;
      else if (angleDegrees < 15) score += 50;

      const timeBonus = Math.max(0, 1000 - Math.floor(timeMs / 1000) * 10);
      score += timeBonus;

      if (difficulty === 'HARD') score = Math.floor(score * 1.5);
      else if (difficulty === 'EASY') score = Math.floor(score * 0.75);

      return score;
    };

    const drawStars = (ctx: CanvasRenderingContext2D) => {
      gameDataRef.current.stars.forEach(star => {
        const twinkle = Math.sin(Date.now() / 1000 + star.x) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
        ctx.fillRect(star.x, star.y, 1, 1);
      });
    };

    const drawParticles = (ctx: CanvasRenderingContext2D) => {
      const cameraX = gameDataRef.current.cameraX;
      gameDataRef.current.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(p.x - cameraX, p.y, 2, 2);
      });
    };

    const drawTerrain = (ctx: CanvasRenderingContext2D) => {
      const terrain = gameDataRef.current.terrain;
      if (terrain.length === 0) return;
      const cameraX = gameDataRef.current.cameraX;

      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(terrain[0].x - cameraX, terrain[0].y);
      for (let i = 1; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x - cameraX, terrain[i].y);
      }
      ctx.stroke();

      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      
      for (const pad of gameDataRef.current.landingPads) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pad.x - cameraX, pad.y);
        ctx.lineTo(pad.x + pad.width - cameraX, pad.y);
        ctx.stroke();

        if (blink) {
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 16px "Courier New"';
          ctx.textAlign = 'center';
          ctx.fillText(`${pad.multiplier}X`, pad.x + pad.width / 2 - cameraX, pad.y + 25);
        }
      }
    };

    const drawLander = (ctx: CanvasRenderingContext2D) => {
      const lander = gameDataRef.current.lander;
      if (!lander) return;
      const cameraX = gameDataRef.current.cameraX;

      ctx.save();
      ctx.translate(lander.x - cameraX, lander.y);
      ctx.rotate(lander.angle);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      // Ascent stage (top cabin)
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.lineTo(-4, -4);
      ctx.lineTo(4, -4);
      ctx.lineTo(4, -8);
      ctx.closePath();
      ctx.stroke();

      // Descent stage (bottom body)
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-6, 4);
      ctx.lineTo(6, 4);
      ctx.lineTo(6, -4);
      ctx.closePath();
      ctx.stroke();

      // Landing legs - left
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.lineTo(-10, 8);
      ctx.lineTo(-12, 8);
      ctx.stroke();

      // Landing legs - right
      ctx.beginPath();
      ctx.moveTo(6, 2);
      ctx.lineTo(10, 8);
      ctx.lineTo(12, 8);
      ctx.stroke();

      // Landing legs - front left
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.lineTo(-7, 10);
      ctx.lineTo(-9, 10);
      ctx.stroke();

      // Landing legs - front right
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(7, 10);
      ctx.lineTo(9, 10);
      ctx.stroke();

      // Window on ascent stage
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -7, 2, 2);

      // Thruster nozzle
      if (lander.thrusting) {
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-2, 4);
        ctx.lineTo(-2, 6);
        ctx.moveTo(2, 4);
        ctx.lineTo(2, 6);
        ctx.stroke();
      }

      ctx.restore();
    };

    // drawTouchButtons removed - touch controls now use HTML overlay

    const drawHUD = (ctx: CanvasRenderingContext2D) => {
      const lander = gameDataRef.current.lander;
      if (!lander) return;

      ctx.fillStyle = '#00ffff';
      ctx.font = '14px "Courier New"';
      ctx.textAlign = 'left';

      const altitude = canvas.height - lander.y;
      const hSpeed = Math.abs(lander.vx);
      const vSpeed = Math.abs(lander.vy);
      const timeElapsed = Math.floor((Date.now() - gameDataRef.current.gameStartTime) / 1000);

      ctx.fillText(`SCORE: ${gameDataRef.current.score}`, 10, 20);
      const levelDisplay = gameDataRef.current.currentLevel === 0
        ? 'TRAINING'
        : gameDataRef.current.currentLevel.toString();
      ctx.fillText(`LEVEL: ${levelDisplay}`, 10, 40);
      ctx.fillText(`LIVES: ${lives}`, 10, 60);
      const fuelDisplay = gameDataRef.current.currentLevel === 0
        ? 'UNLIMITED'
        : Math.floor(lander.fuel).toString();
      ctx.fillText(`FUEL: ${fuelDisplay}`, 10, 80);

      ctx.textAlign = 'right';
      ctx.fillText(`ALTITUDE: ${Math.floor(altitude)}`, canvas.width - 10, 20);
      ctx.fillText(`HORIZONTAL SPEED: ${Math.floor(hSpeed)}`, canvas.width - 10, 40);
      ctx.fillText(`VERTICAL SPEED: ${Math.floor(vSpeed)}`, canvas.width - 10, 60);

      // Show training mode instruction
      if (gameDataRef.current.currentLevel === 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px "Courier New"';
        const trainingText = gameDataRef.current.isTouchDevice
          ? 'TAP "START REAL GAME" WHEN READY'
          : 'PRESS ENTER TO START REAL GAME';
        ctx.fillText(trainingText, canvas.width / 2, 20);
      }
    };

    const drawStartScreen = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = 'rgba(0, 8, 20, 0.95)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      let currentY = 60;

      // Title
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 42px "Courier New"';
      ctx.fillText('LUNAR LANDER', canvas.width / 2, currentY);
      currentY += 35;

      // Subtitle
      ctx.fillStyle = '#888888';
      ctx.font = '14px "Courier New"';
      ctx.fillText('A Classic Arcade Experience', canvas.width / 2, currentY);
      currentY += 45;

      // Instructions Panel (like Space Invaders)
      const panelWidth = Math.min(canvas.width - 80, 600);
      const panelX = (canvas.width - panelWidth) / 2;
      const panelY = currentY;

      // Panel background
      ctx.fillStyle = 'rgba(0, 50, 0, 0.3)';
      ctx.fillRect(panelX, panelY, panelWidth, 280);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX, panelY, panelWidth, 280);

      currentY += 25;

      // Objective
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 15px "Courier New"';
      ctx.fillText('MISSION OBJECTIVE', canvas.width / 2, currentY);
      currentY += 22;

      ctx.fillStyle = '#ffffff';
      ctx.font = '13px "Courier New"';
      ctx.fillText('Land on green pads with multipliers', canvas.width / 2, currentY);
      currentY += 18;
      ctx.fillText('You have 3 lives - Watch your fuel!', canvas.width / 2, currentY);
      currentY += 22;

      // Training mode info
      ctx.fillStyle = '#00ffff';
      ctx.font = '12px "Courier New"';
      ctx.fillText('TRAINING: Unlimited fuel to practice', canvas.width / 2, currentY);
      currentY += 16;
      ctx.fillText('Press ENTER when ready for the real game', canvas.width / 2, currentY);
      currentY += 20;

      // Controls Section
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 15px "Courier New"';
      ctx.fillText('CONTROLS', canvas.width / 2, currentY);
      currentY += 22;

      ctx.fillStyle = '#ffffff';
      ctx.font = '13px "Courier New"';
      const controls = [
        '← → : Rotate Ship',
        '↑ : Thrust Engine',
        'SPACE : Start Game',
        'P : Pause',
        'M : Mute/Unmute Sound'
      ];
      controls.forEach(control => {
        ctx.fillText(control, canvas.width / 2, currentY);
        currentY += 20;
      });

      currentY += 15;

      // Landing Tips
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 15px "Courier New"';
      ctx.fillText('LANDING TIPS', canvas.width / 2, currentY);
      currentY += 22;

      ctx.fillStyle = '#00ff00';
      ctx.font = '13px "Courier New"';
      const tips = [
        'Speed < 30 | Nearly Vertical | Watch Fuel!'
      ];
      tips.forEach(tip => {
        ctx.fillText(tip, canvas.width / 2, currentY);
        currentY += 20;
      });

      // Scoring Info
      currentY += 10;
      ctx.fillStyle = '#888888';
      ctx.font = '12px "Courier New"';
      ctx.fillText('Smaller pads = Higher multipliers (2X - 5X)', canvas.width / 2, currentY);

      // High score - below panel
      if (highScore > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px "Courier New"';
        ctx.fillText(`★ HIGH SCORE: ${highScore} ★`, canvas.width / 2, canvas.height - 70);
      }

      // Blinking start text - at very bottom
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 20px "Courier New"';
        ctx.fillText(gameDataRef.current.isTouchDevice ? 'TAP TO START' : 'PRESS SPACE TO START',
          canvas.width / 2, canvas.height - 30);
      }
    };

    const drawGameOverScreen = (ctx: CanvasRenderingContext2D) => {
      if (!gameResult) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';

      if (gameResult.success) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 50px "Courier New"';
        ctx.fillText('MISSION', canvas.width / 2, canvas.height / 3);
        ctx.fillText('SUCCESS!', canvas.width / 2, canvas.height / 3 + 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px "Courier New"';
        const breakdown = [
          `FINAL SCORE: ${gameResult.score}`,
          `FUEL REMAINING: ${Math.floor(gameResult.fuelRemaining)}`,
          `LANDING SPEED: ${Math.floor(gameResult.landingSpeed)}`
        ];

        let yPos = canvas.height / 2;
        breakdown.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, yPos + (index * 30));
        });

        if (gameResult.score === highScore && gameResult.score > 0) {
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 28px "Courier New"';
          ctx.fillText('★ NEW HIGH SCORE! ★', canvas.width / 2, yPos + 120);
        }
      } else {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 50px "Courier New"';
        ctx.fillText('MISSION', canvas.width / 2, canvas.height / 3);
        ctx.fillText('FAILED', canvas.width / 2, canvas.height / 3 + 60);

        ctx.fillStyle = '#ff6666';
        ctx.font = '24px "Courier New"';
        ctx.fillText(gameResult.reason || 'Crashed!', canvas.width / 2, canvas.height / 2);
      }

      if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 22px "Courier New"';
        ctx.fillText(gameDataRef.current.isTouchDevice ? 'TAP TO RESTART' : 'PRESS SPACE TO RESTART', 
          canvas.width / 2, canvas.height - 40);
      }
    };

    const drawPauseScreen = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

      ctx.font = '22px "Courier New"';
      ctx.fillText('Press P to Resume', canvas.width / 2, canvas.height / 2 + 60);
    };

    const gameLoop = (timestamp: number) => {
      if (!ctx) return;

      const deltaTime = timestamp - gameDataRef.current.lastTime;
      gameDataRef.current.lastTime = timestamp;

      if (gameState === 'START' && gameDataRef.current.keys.space) {
        setLives(3);
        gameDataRef.current.currentLevel = 0;
        gameDataRef.current.totalScore = 0;
        gameDataRef.current.score = 0;
        initLander();
        setGameState('PLAYING');
        gameDataRef.current.keys.space = false;
      }

      if (gameState === 'PLAYING' && gameDataRef.current.keys.p) {
        setGameState('PAUSED');
        gameDataRef.current.keys.p = false;
      } else if (gameState === 'PAUSED' && gameDataRef.current.keys.p) {
        setGameState('PLAYING');
        gameDataRef.current.keys.p = false;
      }

      // Handle Enter key to exit training mode and start real game
      if (gameState === 'PLAYING' && gameDataRef.current.currentLevel === 0 && gameDataRef.current.keys.enter) {
        gameDataRef.current.currentLevel = 1;
        setIsTrainingMode(false);
        generateTerrain();
        const settings = getDifficultySettings();
        const lander = gameDataRef.current.lander;
        if (lander) {
          lander.fuel = settings.fuel;
          lander.x = gameDataRef.current.worldWidth / 2;
          lander.y = 50;
          lander.vx = 30 + Math.random() * 20;
          lander.vy = 10 + Math.random() * 10;
          lander.angle = 0;
        }
        gameDataRef.current.cameraX = (gameDataRef.current.worldWidth / 2) - (canvas.width / 2);
        gameDataRef.current.gameStartTime = Date.now();
        gameDataRef.current.keys.enter = false;
      }

      if (gameState === 'GAME_OVER' && gameDataRef.current.keys.space) {
        generateTerrain();
        setGameState('START');
        setGameResult(null);
        gameDataRef.current.keys.space = false;
      }

      if (gameState === 'PLAYING') {
        update(Math.min(deltaTime, 50));
      }

      ctx.fillStyle = '#000814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawStars(ctx);
      drawParticles(ctx);

      if (gameState !== 'START') {
        drawTerrain(ctx);
        drawLander(ctx);
        drawHUD(ctx);
        // drawTouchButtons removed - using HTML overlay instead
      }

      if (gameState === 'START') {
        drawStartScreen(ctx);
      } else if (gameState === 'PAUSED') {
        drawPauseScreen(ctx);
      } else if (gameState === 'GAME_OVER') {
        drawGameOverScreen(ctx);
      }

      gameDataRef.current.animationFrameId = requestAnimationFrame(gameLoop);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    gameDataRef.current.animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
      if (gameDataRef.current.animationFrameId) {
        cancelAnimationFrame(gameDataRef.current.animationFrameId);
      }
    };
  }, [gameState, highScore, gameResult, difficulty, isMuted]);

  useEffect(() => {
    audioRef.current.thrust = new Audio('./sounds/hit.mp3');
    audioRef.current.success = new Audio('./sounds/success.mp3');
    audioRef.current.crash = new Audio('./sounds/hit.mp3');

    audioRef.current.thrust.volume = 0.3;
    audioRef.current.success.volume = 0.5;
    audioRef.current.crash.volume = 0.4;
  }, []);

  // PWA Install Prompt - Track game completion
  useEffect(() => {
    if (gameState === 'GAME_OVER' && gameResult) {
      // Call the PWA install manager if it exists
      if (typeof window !== 'undefined' && (window as any).installManager) {
        (window as any).installManager.incrementGamesPlayed();
      }
    }
  }, [gameState, gameResult]);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    localStorage.setItem('lunarLanderDifficulty', newDifficulty);
  };

  const handleQuit = () => {
    window.parent.postMessage('mainMenu', '*');
    window.location.href = '/arcade.html';
  };

  const handlePlayAgain = () => {
    generateTerrain();
    setGameState('START');
    setGameResult(null);
    setLives(3);
    setIsTrainingMode(true);
    gameDataRef.current.currentLevel = 0;
    gameDataRef.current.totalScore = 0;
    gameDataRef.current.score = 0;
  };

  const handleMainMenu = () => {
    setGameState('START');
    setGameResult(null);
    setLives(3);
    setIsTrainingMode(true);
    gameDataRef.current.currentLevel = 0;
    gameDataRef.current.totalScore = 0;
    gameDataRef.current.score = 0;
    window.parent.postMessage('mainMenu', '*');
  };

  const handlePauseToggle = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleStartRealGame = () => {
    if (gameDataRef.current.currentLevel === 0 && gameState === 'PLAYING') {
      // Trigger the Enter key logic
      gameDataRef.current.keys.enter = true;
    }
  };

  // Notify parent window of game state changes
  useEffect(() => {
    if (gameState === 'PLAYING') {
      window.parent.postMessage('gameStarted', '*');
    } else if (gameState === 'START' || gameState === 'GAME_OVER') {
      window.parent.postMessage('mainMenu', '*');
    }
  }, [gameState]);

  const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || ('ontouchstart' in window));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
      overflow: 'hidden',
      touchAction: 'manipulation'
    }}>
      {/* Top Control Buttons - Fixed Height Container */}
      <div style={{
        position: 'fixed',
        top: isMobile ? '10px' : '20px',
        right: isMobile ? 'auto' : '20px',
        left: isMobile ? '50%' : 'auto',
        transform: isMobile ? 'translateX(-50%)' : 'none',
        display: 'grid',
        gridTemplateRows: 'repeat(2, auto)',
        gap: isMobile ? '6px' : '10px',
        zIndex: 1000,
        maxWidth: isMobile ? '95%' : 'none',
        justifyItems: isMobile ? 'center' : 'start'
      }}>
        <div style={{ display: 'flex', gap: isMobile ? '6px' : '10px', justifyContent: 'center' }}>
          <button
            onClick={handleQuit}
            style={{
              background: 'rgba(0, 255, 0, 0.2)',
              border: '2px solid rgba(0, 255, 0, 0.5)',
              color: '#0f0',
              fontFamily: '"Courier New", monospace',
              fontSize: isMobile ? '11px' : '14px',
              fontWeight: isMobile ? 'normal' : 'bold',
              padding: isMobile ? '10px 16px' : '8px 16px',
              minWidth: isMobile ? '90px' : 'auto',
              cursor: 'pointer',
              borderRadius: isMobile ? '6px' : '5px',
              textTransform: isMobile ? 'uppercase' : 'none',
              letterSpacing: isMobile ? '0.5px' : '0',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            ⬅ QUIT
          </button>
          <button
            onClick={handlePauseToggle}
            disabled={gameState !== 'PLAYING' && gameState !== 'PAUSED'}
            style={{
              background: 'rgba(0, 255, 0, 0.2)',
              border: '2px solid rgba(0, 255, 0, 0.5)',
              color: '#0f0',
              fontFamily: '"Courier New", monospace',
              fontSize: isMobile ? '11px' : '14px',
              fontWeight: isMobile ? 'normal' : 'bold',
              padding: isMobile ? '10px 16px' : '8px 16px',
              minWidth: isMobile ? '90px' : 'auto',
              cursor: 'pointer',
              borderRadius: isMobile ? '6px' : '5px',
              textTransform: isMobile ? 'uppercase' : 'none',
              letterSpacing: isMobile ? '0.5px' : '0',
              whiteSpace: 'nowrap',
              opacity: (gameState !== 'PLAYING' && gameState !== 'PAUSED') ? 0.5 : 1,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            ⏸ PAUSE
          </button>
          <button
            onClick={handleMuteToggle}
            style={{
              background: isMuted ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)',
              border: isMuted ? '2px solid rgba(255, 0, 0, 0.5)' : '2px solid rgba(0, 255, 0, 0.5)',
              color: isMuted ? '#f00' : '#0f0',
              fontFamily: '"Courier New", monospace',
              fontSize: isMobile ? '11px' : '14px',
              fontWeight: isMobile ? 'normal' : 'bold',
              padding: isMobile ? '10px 16px' : '8px 16px',
              minWidth: isMobile ? '90px' : 'auto',
              cursor: 'pointer',
              borderRadius: isMobile ? '6px' : '5px',
              textTransform: isMobile ? 'uppercase' : 'none',
              letterSpacing: isMobile ? '0.5px' : '0',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            {isMuted ? '🔇 MUTED' : '🔊 SOUND'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? '6px' : '10px', justifyContent: 'center' }}>
          <button
            onClick={handlePlayAgain}
            disabled={gameState === 'PLAYING'}
            style={{
              background: 'rgba(0, 255, 0, 0.2)',
              border: '2px solid rgba(0, 255, 0, 0.5)',
              color: '#0f0',
              fontFamily: '"Courier New", monospace',
              fontSize: isMobile ? '11px' : '14px',
              fontWeight: isMobile ? 'normal' : 'bold',
              padding: isMobile ? '10px 16px' : '8px 16px',
              minWidth: isMobile ? '90px' : 'auto',
              cursor: 'pointer',
              borderRadius: isMobile ? '6px' : '5px',
              textTransform: isMobile ? 'uppercase' : 'none',
              letterSpacing: isMobile ? '0.5px' : '0',
              whiteSpace: 'nowrap',
              opacity: gameState === 'PLAYING' ? 0.5 : 1,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            ▶ PLAY AGAIN
          </button>
          <button
            onClick={handleMainMenu}
            style={{
              background: 'rgba(0, 255, 0, 0.2)',
              border: '2px solid rgba(0, 255, 0, 0.5)',
              color: '#0f0',
              fontFamily: '"Courier New", monospace',
              fontSize: isMobile ? '11px' : '14px',
              fontWeight: isMobile ? 'normal' : 'bold',
              padding: isMobile ? '10px 16px' : '8px 16px',
              minWidth: isMobile ? '90px' : 'auto',
              cursor: 'pointer',
              borderRadius: isMobile ? '6px' : '5px',
              textTransform: isMobile ? 'uppercase' : 'none',
              letterSpacing: isMobile ? '0.5px' : '0',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            ⬅ MAIN MENU
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: isMobile ? '120px' : '50%',
          left: '50%',
          transform: isMobile ? 'translateX(-50%)' : 'translate(-50%, -50%)',
          border: isMobile ? 'none' : '2px solid #333',
          maxWidth: isMobile ? '100vw' : '90vw',
          maxHeight: isMobile ? 'calc(100vh - 240px)' : '90vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          touchAction: 'none'
        }}
      />
      {/* START REAL GAME button for training mode */}
      {isMobile && gameState === 'PLAYING' && isTrainingMode && (
        <button
          onClick={handleStartRealGame}
          style={{
            position: 'fixed',
            bottom: '110px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 255, 0, 0.3)',
            border: '3px solid #00ff00',
            color: '#00ff00',
            fontFamily: '"Courier New", monospace',
            fontSize: '16px',
            fontWeight: 'bold',
            padding: '15px 25px',
            cursor: 'pointer',
            borderRadius: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            zIndex: 1002,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            boxShadow: '0 0 15px rgba(0, 255, 0, 0.5)'
          }}
        >
          🚀 START REAL GAME
        </button>
      )}
      {/* Touch Control Buttons - HTML Overlay (Below Game Area) */}
      {isMobile && gameState === 'PLAYING' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 1001
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onTouchStart={(e) => { e.preventDefault(); if (gameDataRef.current.keys) gameDataRef.current.keys.left = true; }}
              onTouchEnd={(e) => { e.preventDefault(); if (gameDataRef.current.keys) gameDataRef.current.keys.left = false; }}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                width: '70px',
                height: '70px',
                background: 'rgba(100, 100, 100, 0.4)',
                border: '3px solid rgba(200, 200, 200, 0.7)',
                color: '#ffffff',
                fontSize: '32px',
                borderRadius: '10px',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                touchAction: 'none'
              }}
            >
              ◄
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); if (gameDataRef.current.keys) gameDataRef.current.keys.right = true; }}
              onTouchEnd={(e) => { e.preventDefault(); if (gameDataRef.current.keys) gameDataRef.current.keys.right = false; }}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                width: '70px',
                height: '70px',
                background: 'rgba(100, 100, 100, 0.4)',
                border: '3px solid rgba(200, 200, 200, 0.7)',
                color: '#ffffff',
                fontSize: '32px',
                borderRadius: '10px',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                touchAction: 'none'
              }}
            >
              ►
            </button>
          </div>
          <button
            onTouchStart={(e) => { e.preventDefault(); if (gameDataRef.current.keys) gameDataRef.current.keys.up = true; }}
            onTouchEnd={(e) => { e.preventDefault(); if (gameDataRef.current.keys) gameDataRef.current.keys.up = false; }}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              width: '70px',
              height: '70px',
              background: 'rgba(100, 100, 100, 0.4)',
              border: '3px solid rgba(200, 200, 200, 0.7)',
              color: '#ffffff',
              fontSize: '32px',
              borderRadius: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'none'
            }}
          >
            ▲
          </button>
        </div>
      )}
      {gameState === 'START' && (
        <div style={{
          position: 'absolute',
          bottom: '225px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          zIndex: 1002
        }}>
          {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(diff => (
            <button
              key={diff}
              onClick={() => handleDifficultyChange(diff)}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                fontFamily: '"Courier New", monospace',
                backgroundColor: difficulty === diff ? '#00ff00' : '#333',
                color: difficulty === diff ? '#000' : '#fff',
                border: '2px solid ' + (difficulty === diff ? '#00ff00' : '#666'),
                cursor: 'pointer',
                borderRadius: '5px'
              }}
            >
              {diff}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
