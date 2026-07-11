import type { HighScore, InsertHighScore } from "@shared/schema";

export async function fetchHighScores(limit: number = 10): Promise<HighScore[]> {
  try {
    const response = await fetch(`/api/high-scores?limit=${limit}`);
    if (!response.ok) {
      throw new Error("Failed to fetch high scores");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching high scores:", error);
    return [];
  }
}

export async function submitHighScore(highScore: InsertHighScore): Promise<HighScore | null> {
  try {
    const response = await fetch("/api/high-scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(highScore),
    });
    if (!response.ok) {
      throw new Error("Failed to submit high score");
    }
    return await response.json();
  } catch (error) {
    console.error("Error submitting high score:", error);
    return null;
  }
}
