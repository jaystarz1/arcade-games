import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import { KeyboardControls } from "@react-three/drei";
import "@fontsource/inter";
import { GameScene } from "./components/GameScene";
import { GameController, Controls } from "./components/GameController";
import { HUD } from "./components/HUD";
import { MenuScreen } from "./components/MenuScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { InitialsEntryScreen } from "./components/InitialsEntryScreen";
import { PauseScreen } from "./components/PauseScreen";
import { KeyboardHandler } from "./components/KeyboardHandler";
import { TouchControlsManager } from "./components/TouchControlsManager";
import { SoundManager } from "./components/SoundManager";
import { InstallPrompt } from "./components/InstallPrompt";
import { GameControls } from "./components/GameControls";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAsteroidsGame, GAME_WIDTH, GAME_HEIGHT } from "./lib/stores/useAsteroidsGame";
import { useSettingsStore } from "./lib/stores/useSettingsStore";

function App() {
  const phase = useAsteroidsGame((state) => state.phase);
  const loadHighScores = useAsteroidsGame((state) => state.loadHighScores);
  const keyBindings = useSettingsStore((state) => state.keyBindings);
  
  const keyMap = useMemo(() => [
    { name: Controls.left, keys: keyBindings.left },
    { name: Controls.right, keys: keyBindings.right },
    { name: Controls.thrust, keys: keyBindings.thrust },
    { name: Controls.fire, keys: keyBindings.fire },
  ], [keyBindings]);
  
  useEffect(() => {
    loadHighScores();
  }, [loadHighScores]);
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <InstallPrompt />
      <GameControls />
      <KeyboardControls map={keyMap}>
        {/* Menu screen */}
        {phase === "menu" && <MenuScreen />}

        {/* Game screens */}
        <GameOverScreen />
        <InitialsEntryScreen />
        <PauseScreen />

        {/* HUD - show during playing and paused */}
        {(phase === "playing" || phase === "paused") && <HUD />}

        {/* Touch controls for mobile */}
        {(phase === "playing" || phase === "paused") && <TouchControlsManager />}

        {/* Keyboard handler */}
        <KeyboardHandler />

        {/* Sound manager */}
        <SoundManager />
        
        {/* Game canvas */}
        <ErrorBoundary>
          <Canvas
            camera={{
              position: [0, 0, 500],
              zoom: 1,
              near: 0.1,
              far: 2000,
              left: -GAME_WIDTH / 2,
              right: GAME_WIDTH / 2,
              top: GAME_HEIGHT / 2,
              bottom: -GAME_HEIGHT / 2
            }}
            orthographic
            gl={{
              antialias: true,
              alpha: false
            }}
            style={{
              display: phase === "menu" ? "none" : "block",
              maxWidth: '100vw',
              maxHeight: '100vh',
              aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
              position: 'absolute',
              zIndex: 0,
              pointerEvents: 'none'
            }}
          >
            {/* Black background */}
            <color attach="background" args={["#000000"]} />

            <Suspense fallback={null}>
              {/* Game entities */}
              <GameScene />

              {/* Game controller - handles physics and collision */}
              <GameController />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      </KeyboardControls>
    </div>
  );
}

export default App;
