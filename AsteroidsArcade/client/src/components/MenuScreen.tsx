import { useState } from "react";
import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";
import { resumeAudioContext } from "@/lib/audioContext";
import { Leaderboard } from "./Leaderboard";
import { SettingsScreen } from "./SettingsScreen";

export function MenuScreen() {
  const startGame = useAsteroidsGame((state) => state.startGame);
  const [showSettings, setShowSettings] = useState(false);
  
  const handleStartGame = () => {
    // Resume audio context with user gesture
    resumeAudioContext();
    // Start the game
    startGame();
  };

  const handleSettings = () => {
    resumeAudioContext();
    setShowSettings(true);
  };
  
  if (showSettings) {
    return <SettingsScreen onClose={() => setShowSettings(false)} />;
  }
  
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "monospace",
        zIndex: 2000,
        backgroundColor: "rgba(0, 0, 0, 0.8)"
      }}
    >
      <div style={{ textAlign: "center" }}>
        {/* Title */}
        <h1 
          style={{ 
            fontSize: "64px", 
            marginBottom: "20px",
            letterSpacing: "8px",
            textShadow: "0 0 20px rgba(255, 255, 255, 0.5)"
          }}
        >
          ASTEROIDS
        </h1>
        
        {/* Subtitle */}
        <p style={{ fontSize: "16px", marginBottom: "40px", opacity: 0.7 }}>
          A faithful recreation of the 1979 arcade classic
        </p>
        
        {/* Buttons */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "40px", justifyContent: "center" }}>
          <button
            onClick={handleStartGame}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              padding: "15px 40px",
              fontSize: "24px",
              fontFamily: "monospace",
              color: "white",
              backgroundColor: "transparent",
              border: "3px solid white",
              cursor: "pointer",
              transition: "all 0.2s",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none"
            }}
          >
            START GAME
          </button>

          <button
            onClick={handleSettings}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              padding: "15px 40px",
              fontSize: "24px",
              fontFamily: "monospace",
              color: "white",
              backgroundColor: "transparent",
              border: "3px solid white",
              cursor: "pointer",
              transition: "all 0.2s",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none"
            }}
          >
            SETTINGS
          </button>
        </div>
        
        {/* Controls */}
        <div style={{ fontSize: "14px", marginBottom: "30px", opacity: 0.8 }}>
          <div style={{ marginBottom: "10px" }}>
            <strong>CONTROLS:</strong>
          </div>
          <div>← → : Rotate | ↑ : Thrust | SPACE : Fire</div>
          <div>H : Hyperspace | P : Pause</div>
        </div>

        {/* High Scores - Hidden but functionality remains */}
        {/* <Leaderboard /> */}
      </div>
    </div>
  );
}
