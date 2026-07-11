import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";
import { resumeAudioContext } from "@/lib/audioContext";

export function PauseScreen() {
  const phase = useAsteroidsGame((state) => state.phase);
  const resumeGame = useAsteroidsGame((state) => state.resumeGame);

  const handleResume = () => {
    resumeAudioContext();
    resumeGame();
  };

  if (phase !== "paused") return null;
  
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
        backgroundColor: "rgba(0, 0, 0, 0.7)"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 
          style={{ 
            fontSize: "48px", 
            marginBottom: "20px"
          }}
        >
          PAUSED
        </h1>
        
        <p style={{ fontSize: "18px", opacity: 0.8 }}>
          Press P to resume
        </p>
        
        <button
          onClick={handleResume}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            marginTop: "30px",
            padding: "15px 40px",
            fontSize: "20px",
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
          RESUME
        </button>
      </div>
    </div>
  );
}
