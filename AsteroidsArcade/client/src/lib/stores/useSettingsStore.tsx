import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DifficultyLevel = "easy" | "normal" | "hard";

export interface KeyBindings {
  left: string[];
  right: string[];
  thrust: string[];
  fire: string[];
}

export interface GameSettings {
  difficulty: DifficultyLevel;
  soundEnabled: boolean;
  musicEnabled: boolean;
  keyBindings: KeyBindings;
}

interface SettingsState extends GameSettings {
  setDifficulty: (difficulty: DifficultyLevel) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setKeyBindings: (bindings: KeyBindings) => void;
  resetSettings: () => void;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  left: ["ArrowLeft"],
  right: ["ArrowRight"],
  thrust: ["ArrowUp"],
  fire: ["Space"],
};

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: "normal",
  soundEnabled: true,
  musicEnabled: true,
  keyBindings: DEFAULT_KEY_BINDINGS,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setDifficulty: (difficulty) => set({ difficulty }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
      setKeyBindings: (bindings) => set({ keyBindings: bindings }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "asteroids-settings",
    }
  )
);

export function getDifficultyMultipliers(difficulty: DifficultyLevel) {
  switch (difficulty) {
    case "easy":
      return {
        asteroidSpeedMultiplier: 0.7,
        ufoSpeedMultiplier: 0.7,
        ufoAccuracyMultiplier: 0.5,
        ufoFireRateMultiplier: 1.5,
      };
    case "normal":
      return {
        asteroidSpeedMultiplier: 1.0,
        ufoSpeedMultiplier: 1.0,
        ufoAccuracyMultiplier: 1.0,
        ufoFireRateMultiplier: 1.0,
      };
    case "hard":
      return {
        asteroidSpeedMultiplier: 1.5,
        ufoSpeedMultiplier: 1.3,
        ufoAccuracyMultiplier: 1.5,
        ufoFireRateMultiplier: 0.7,
      };
  }
}
