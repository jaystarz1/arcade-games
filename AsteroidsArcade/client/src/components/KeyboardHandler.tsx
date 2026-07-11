import { useEffect } from "react";
import { useAsteroidsGame } from "@/lib/stores/useAsteroidsGame";

export function KeyboardHandler() {
  const phase = useAsteroidsGame((state) => state.phase);
  const pauseGame = useAsteroidsGame((state) => state.pauseGame);
  const resumeGame = useAsteroidsGame((state) => state.resumeGame);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pause/unpause with P key
      if (e.key === "p" || e.key === "P") {
        if (phase === "playing") {
          pauseGame();
        } else if (phase === "paused") {
          resumeGame();
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, pauseGame, resumeGame]);
  
  return null;
}
