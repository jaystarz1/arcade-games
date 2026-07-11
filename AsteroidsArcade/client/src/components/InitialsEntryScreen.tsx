import { useEffect } from "react";
import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";

export function InitialsEntryScreen() {
  const phase = useAsteroidsGame((state) => state.phase);
  const score = useAsteroidsGame((state) => state.score);
  const addHighScore = useAsteroidsGame((state) => state.addHighScore);

  // Auto-submit with default initials when entering this phase (hidden UI)
  useEffect(() => {
    if (phase === "enter_initials") {
      const autoSubmit = async () => {
        // Use "AAA" as default initials since UI is hidden
        await addHighScore("AAA", score);
      };
      autoSubmit();
    }
  }, [phase, score, addHighScore]);

  if (phase !== "enter_initials") return null;

  // Return null to hide the UI completely - score is saved in background
  return null;
}
