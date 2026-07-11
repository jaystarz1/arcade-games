import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";

export function HUD() {
  const score = useAsteroidsGame((state) => state.score);
  const lives = useAsteroidsGame((state) => state.lives);
  const wave = useAsteroidsGame((state) => state.wave);
  const highScores = useAsteroidsGame((state) => state.highScores);
  
  const highScore = highScores.length > 0 ? highScores[0].score : 0;
  
  return (
    <div
      style={{
        position: "absolute",
        top: "100px",
        left: 0,
        right: 0,
        padding: "10px 20px",
        color: "white",
        fontFamily: "monospace",
        fontSize: "16px",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 1000
      }}
    >
      {/* Top bar - compact */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div>SCORE: {score.toString().padStart(6, "0")}</div>
          {/* Lives display - inline (lives remaining, not counting current ship) */}
          <div style={{ display: "flex", gap: "8px" }}>
            {Array.from({ length: Math.max(0, lives - 1) }).map((_, i) => (
              <svg key={i} width="16" height="16" viewBox="-10 -10 20 20">
                <polygon
                  points="0,-10 -7,7 7,7"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div style={{ fontSize: "14px", opacity: 0.7 }}>WAVE {wave}</div>
          <div>HIGH: {highScore.toString().padStart(6, "0")}</div>
        </div>
      </div>
    </div>
  );
}
