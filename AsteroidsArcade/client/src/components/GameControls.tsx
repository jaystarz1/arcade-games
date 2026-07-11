import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";
import { useSettingsStore } from "@/lib/stores/useSettingsStore";
import { resumeAudioContext } from "@/lib/audioContext";

export function GameControls() {
  const phase = useAsteroidsGame((state) => state.phase);
  const pauseGame = useAsteroidsGame((state) => state.pauseGame);
  const resumeGame = useAsteroidsGame((state) => state.resumeGame);
  const restartGame = useAsteroidsGame((state) => state.restartGame);
  const startGame = useAsteroidsGame((state) => state.startGame);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);

  // Check if running as PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;

  console.log('[GameControls] PWA Detection:', {
    displayMode: window.matchMedia('(display-mode: standalone)').matches,
    navigatorStandalone: (window.navigator as any).standalone,
    isPWA
  });

  const handleQuit = () => {
    resumeAudioContext();
    window.location.href = '/arcade.html';
  };

  const handlePause = () => {
    resumeAudioContext();
    if (phase === "playing") {
      pauseGame();
    } else if (phase === "paused") {
      resumeGame();
    }
  };

  const handleMute = () => {
    resumeAudioContext();
    const newState = !soundEnabled;
    console.log('Mute button clicked. Current:', soundEnabled, 'Setting to:', newState);
    setSoundEnabled(newState);
  };

  const handlePlayAgain = () => {
    resumeAudioContext();
    startGame(); // Use same function as menu START button
  };

  const handleMainMenu = () => {
    resumeAudioContext();
    // Reset to menu by using the store's setState
    useAsteroidsGame.setState({ phase: "menu" });
  };

  const controlBtnStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.2)",
    border: "2px solid rgba(255, 255, 255, 0.5)",
    color: "white",
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: "bold",
    padding: "10px 16px",
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    touchAction: "manipulation",
    transition: "all 0.2s",
    borderRadius: "5px",
    minWidth: "90px",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  } as React.CSSProperties;

  return (
    <div
      style={{
        position: "fixed",
        top: "8px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        zIndex: 3000,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
        {!isPWA && (
          <button
            onClick={handleQuit}
            onContextMenu={(e) => e.preventDefault()}
            style={controlBtnStyle}
          >
            ⬅ QUIT
          </button>
        )}
        <button
          onClick={handlePause}
          onContextMenu={(e) => e.preventDefault()}
          style={controlBtnStyle}
        >
          {phase === "paused" ? "▶ RESUME" : "⏸ PAUSE"}
        </button>
        <button
          onClick={handleMute}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            ...controlBtnStyle,
            background: soundEnabled ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 0, 0, 0.2)",
            borderColor: soundEnabled ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 0, 0, 0.5)",
          }}
        >
          {soundEnabled ? "🔊 SOUND" : "🔇 MUTED"}
        </button>
      </div>
      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
        <button
          onClick={handlePlayAgain}
          onContextMenu={(e) => e.preventDefault()}
          style={controlBtnStyle}
        >
          ▶ PLAY AGAIN
        </button>
        <button
          onClick={handleMainMenu}
          onContextMenu={(e) => e.preventDefault()}
          style={controlBtnStyle}
        >
          ⬅ MAIN MENU
        </button>
      </div>
    </div>
  );
}
