import { useState } from "react";
import { useSettingsStore, type DifficultyLevel, type KeyBindings } from "../lib/stores/useSettingsStore";
import { KeyRemapper } from "./KeyRemapper";
import { resumeAudioContext } from "@/lib/audioContext";

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { difficulty, soundEnabled, musicEnabled, keyBindings, setDifficulty, setSoundEnabled, setMusicEnabled, setKeyBindings } = useSettingsStore();
  const [showRemapper, setShowRemapper] = useState(false);

  const handleClose = () => {
    resumeAudioContext();
    onClose();
  };

  if (showRemapper) {
    return (
      <KeyRemapper
        keyBindings={keyBindings}
        onSave={(bindings: KeyBindings) => {
          setKeyBindings(bindings);
          setShowRemapper(false);
        }}
        onCancel={() => setShowRemapper(false)}
      />
    );
  }

  const difficultyOptions: { value: DifficultyLevel; label: string; description: string }[] = [
    { value: "easy", label: "EASY", description: "Slower asteroids, less accurate UFOs" },
    { value: "normal", label: "NORMAL", description: "Classic arcade difficulty" },
    { value: "hard", label: "HARD", description: "Faster asteroids, deadly UFOs" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        fontFamily: "monospace",
        color: "white",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "600px", width: "100%" }}>
        <h1
          style={{
            fontSize: "48px",
            textAlign: "center",
            marginBottom: "40px",
            letterSpacing: "4px",
          }}
        >
          SETTINGS
        </h1>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px", borderBottom: "2px solid white", paddingBottom: "10px" }}>
            DIFFICULTY
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDifficulty(option.value)}
                style={{
                  padding: "15px 20px",
                  backgroundColor: difficulty === option.value ? "white" : "transparent",
                  color: difficulty === option.value ? "black" : "white",
                  border: "2px solid white",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontFamily: "monospace",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{option.label}</div>
                <div style={{ fontSize: "14px", opacity: 0.8 }}>{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px", borderBottom: "2px solid white", paddingBottom: "10px" }}>
            CONTROLS
          </h2>
          <button
            onClick={() => setShowRemapper(true)}
            style={{
              width: "100%",
              padding: "15px 20px",
              fontSize: "18px",
              fontFamily: "monospace",
              backgroundColor: "transparent",
              color: "white",
              border: "2px solid white",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            CUSTOMIZE KEYBOARD CONTROLS
          </button>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px", borderBottom: "2px solid white", paddingBottom: "10px" }}>
            AUDIO
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "15px 20px",
                border: "2px solid white",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "18px" }}>Sound Effects</span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                }}
              />
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "15px 20px",
                border: "2px solid white",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "18px" }}>Music</span>
              <input
                type="checkbox"
                checked={musicEnabled}
                onChange={(e) => setMusicEnabled(e.target.checked)}
                style={{
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                }}
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleClose}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: "100%",
            padding: "15px 20px",
            backgroundColor: "white",
            color: "black",
            border: "2px solid white",
            cursor: "pointer",
            fontSize: "20px",
            fontFamily: "monospace",
            fontWeight: "bold",
            letterSpacing: "2px",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none"
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
