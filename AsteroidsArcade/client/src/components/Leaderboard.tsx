import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";

export function Leaderboard() {
  const highScores = useAsteroidsGame((state) => state.highScores);
  
  return (
    <div
      style={{
        fontFamily: "monospace",
        color: "white",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          marginBottom: "20px",
          color: "#44ff44",
          letterSpacing: "2px",
        }}
      >
        HIGH SCORES
      </h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {highScores.length === 0 ? (
          <p style={{ fontSize: "16px", color: "#888" }}>No scores yet</p>
        ) : (
          highScores.map((score, index) => (
            <div
              key={score.id || index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                padding: "5px 20px",
                color: index < 3 ? "#ffff44" : "white",
              }}
            >
              <span style={{ width: "40px", textAlign: "left" }}>
                {(index + 1).toString().padStart(2, "0")}.
              </span>
              <span style={{ width: "80px", textAlign: "center", fontWeight: "bold" }}>
                {score.initials}
              </span>
              <span style={{ width: "100px", textAlign: "right" }}>
                {score.score.toString().padStart(6, "0")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
