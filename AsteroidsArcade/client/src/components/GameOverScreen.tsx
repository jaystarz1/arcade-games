import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";
import { Leaderboard } from "./Leaderboard";
import { resumeAudioContext } from "@/lib/audioContext";

export function GameOverScreen() {
  const score = useAsteroidsGame((state) => state.score);
  const startGame = useAsteroidsGame((state) => state.startGame);
  const phase = useAsteroidsGame((state) => state.phase);

  const handleRestart = () => {
    resumeAudioContext();
    startGame(); // Use same function as menu START button
  };

  if (phase !== "game_over") return null;
  
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
        backgroundColor: "rgba(0, 0, 0, 0.9)"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 
          style={{ 
            fontSize: "48px", 
            marginBottom: "20px",
            color: "#ff4444"
          }}
        >
          GAME OVER
        </h1>
        
        <p style={{ fontSize: "24px", marginBottom: "40px" }}>
          FINAL SCORE: {score.toString().padStart(6, "0")}
        </p>
        
        <button
          onClick={handleRestart}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            padding: "15px 40px",
            fontSize: "20px",
            fontFamily: "monospace",
            color: "white",
            backgroundColor: "transparent",
            border: "3px solid white",
            cursor: "pointer",
            marginBottom: "40px",
            transition: "all 0.2s",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none"
          }}
        >
          PLAY AGAIN
        </button>

        {/* High Scores - Hidden but functionality remains */}
        {/* <Leaderboard /> */}
      </div>
    </div>
  );
}
