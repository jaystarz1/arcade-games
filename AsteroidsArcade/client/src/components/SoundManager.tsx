import { useEffect, useRef } from "react";
import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";
import { useSettingsStore } from "@/lib/stores/useSettingsStore";
import { getAudioContext, resumeAudioContext } from "@/lib/audioContext";

export function SoundManager() {
  const phase = useAsteroidsGame((state) => state.phase);
  const asteroidCount = useAsteroidsGame((state) => state.asteroids.length);
  const isThrusting = useAsteroidsGame((state) => state.ship?.isThrusting || false);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  
  const thrustOscillatorRef = useRef<OscillatorNode | null>(null);
  const thrustGainRef = useRef<GainNode | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAsteroidCountRef = useRef(asteroidCount);
  
  // Subscribe to explosions using Zustand's subscribe
  useEffect(() => {
    let lastExplosionCount = 0;

    const unsubscribe = useAsteroidsGame.subscribe(
      (state) => state.explosions.length,
      (explosionCount) => {
        // Play sound for each new explosion
        const newExplosions = explosionCount - lastExplosionCount;
        for (let i = 0; i < newExplosions; i++) {
          // Get current sound state from store
          if (useSettingsStore.getState().soundEnabled) {
            playExplosion();
          }
        }
        lastExplosionCount = explosionCount;
      }
    );

    return unsubscribe;
  }, []);

  // Subscribe to bullets for firing sound
  useEffect(() => {
    let lastBulletCount = 0;

    const unsubscribe = useAsteroidsGame.subscribe(
      (state) => state.bullets.filter(b => b.fromPlayer).length,
      (bulletCount) => {
        if (bulletCount > lastBulletCount) {
          // Get current sound state from store
          if (useSettingsStore.getState().soundEnabled) {
            playFire();
          }
        }
        lastBulletCount = bulletCount;
      }
    );

    return unsubscribe;
  }, []);
  
  // Retry audio context resume if suspended (e.g., after tab visibility changes)
  useEffect(() => {
    if (phase === "playing") {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        resumeAudioContext();
      }
    }
  }, [phase]);
  
  // Handle thrust sound
  useEffect(() => {
    const ctx = getAudioContext();

    if (isThrusting && phase === "playing" && soundEnabled) {
      if (!thrustOscillatorRef.current) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(40, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();

        thrustOscillatorRef.current = oscillator;
        thrustGainRef.current = gainNode;
      }
    } else {
      if (thrustOscillatorRef.current && thrustGainRef.current) {
        try {
          thrustGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
          thrustOscillatorRef.current.stop();
        } catch (e) {
          // Already stopped
        }
        thrustOscillatorRef.current = null;
        thrustGainRef.current = null;
      }
    }
  }, [isThrusting, phase, soundEnabled]);
  
  // Heartbeat sound
  useEffect(() => {
    if (phase !== "playing" || asteroidCount === 0 || !soundEnabled) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Only update interval if asteroid count changed significantly
    if (Math.abs(asteroidCount - lastAsteroidCountRef.current) > 0) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      const baseInterval = 1000;
      const minInterval = 200;
      const asteroidRatio = Math.max(0, 1 - (asteroidCount / 20));
      const interval = baseInterval - (asteroidRatio * (baseInterval - minInterval));

      heartbeatIntervalRef.current = setInterval(() => {
        playHeartbeat();
      }, interval);

      lastAsteroidCountRef.current = asteroidCount;
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [phase, asteroidCount, soundEnabled]);
  
  // Sound effect functions
  const playHeartbeat = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(80, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  };

  const playFire = () => {
    if (!soundEnabled) {
      console.log('[SoundManager] playFire blocked - sound disabled');
      return;
    }

    const ctx = getAudioContext();
    console.log('[SoundManager] playFire - ctx state:', ctx.state);

    if (ctx.state !== 'running') {
      console.warn('[SoundManager] playFire blocked - ctx not running, state:', ctx.state);
      return;
    }

    // Classic arcade "pew" sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.08);
  };

  const playExplosion = () => {
    const ctx = getAudioContext();

    // Create white noise for explosion
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.7, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.3);
  };
  
  // Subscribe to UFO for warble sound
  useEffect(() => {
    let ufoOscillator: OscillatorNode | null = null;
    let ufoGain: GainNode | null = null;
    let lastHadUFO = false;

    const unsubscribe = useAsteroidsGame.subscribe(
      (state) => state.ufo,
      (ufo) => {
        const ctx = getAudioContext();
        const hasUFO = ufo !== null;
        const soundEnabled = useSettingsStore.getState().soundEnabled;

        if (hasUFO && !lastHadUFO && soundEnabled) {
          // Start UFO warble only if sound is enabled
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();

          // Main oscillator
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);

          // LFO for warble effect
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(ufo?.size === "small" ? 8 : 4, ctx.currentTime);

          lfoGain.gain.setValueAtTime(30, ctx.currentTime);

          lfo.connect(lfoGain);
          lfoGain.connect(oscillator.frequency);

          gainNode.gain.setValueAtTime(0.5, ctx.currentTime);

          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);

          oscillator.start();
          lfo.start();

          ufoOscillator = oscillator;
          ufoGain = gainNode;
        } else if (!hasUFO && lastHadUFO) {
          // Stop UFO warble
          if (ufoOscillator && ufoGain) {
            try {
              ufoGain.gain.setValueAtTime(0, ctx.currentTime);
              ufoOscillator.stop();
            } catch (e) {
              // Already stopped
            }
            ufoOscillator = null;
            ufoGain = null;
          }
        } else if (hasUFO && !soundEnabled && ufoOscillator) {
          // Sound was disabled while UFO is active - stop the sound
          try {
            ufoGain!.gain.setValueAtTime(0, ctx.currentTime);
            ufoOscillator.stop();
          } catch (e) {
            // Already stopped
          }
          ufoOscillator = null;
          ufoGain = null;
        }

        lastHadUFO = hasUFO;
      }
    );
    
    return () => {
      if (ufoOscillator) {
        try {
          ufoOscillator.stop();
        } catch (e) {
          // Already stopped
        }
      }
      unsubscribe();
    };
  }, []);
  
  return null;
}
