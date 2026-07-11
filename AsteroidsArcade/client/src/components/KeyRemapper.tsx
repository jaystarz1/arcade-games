import { useState, useEffect, useRef } from "react";
import type { KeyBindings } from "../lib/stores/useSettingsStore";

interface KeyRemapperProps {
  keyBindings: KeyBindings;
  onSave: (bindings: KeyBindings) => void;
  onCancel: () => void;
}

type ActionKey = keyof KeyBindings;

export function KeyRemapper({ keyBindings, onSave, onCancel }: KeyRemapperProps) {
  const [editingBindings, setEditingBindings] = useState<KeyBindings>({ ...keyBindings });
  const [listening, setListening] = useState<ActionKey | null>(null);
  const listenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const actionLabels: Record<ActionKey, string> = {
    left: "Rotate Left",
    right: "Rotate Right",
    thrust: "Thrust",
    fire: "Fire",
    hyperspace: "Hyperspace",
  };

  useEffect(() => {
    // Cleanup listener on unmount
    return () => {
      if (listenerRef.current) {
        window.removeEventListener("keydown", listenerRef.current);
      }
    };
  }, []);

  const handleListen = (action: ActionKey) => {
    // Remove previous listener if exists
    if (listenerRef.current) {
      window.removeEventListener("keydown", listenerRef.current);
      listenerRef.current = null;
    }

    setListening(action);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.code;
      
      setEditingBindings((prev: KeyBindings) => ({
        ...prev,
        [action]: [key],
      }));
      
      setListening(null);
      window.removeEventListener("keydown", handleKeyDown);
      listenerRef.current = null;
    };

    listenerRef.current = handleKeyDown;
    window.addEventListener("keydown", handleKeyDown);
  };

  const formatKey = (code: string): string => {
    const keyMap: Record<string, string> = {
      ArrowLeft: "←",
      ArrowRight: "→",
      ArrowUp: "↑",
      ArrowDown: "↓",
      Space: "SPACE",
      ShiftLeft: "SHIFT (L)",
      ShiftRight: "SHIFT (R)",
      ControlLeft: "CTRL (L)",
      ControlRight: "CTRL (R)",
    };
    
    if (keyMap[code]) return keyMap[code];
    if (code.startsWith("Key")) return code.replace("Key", "");
    if (code.startsWith("Digit")) return code.replace("Digit", "");
    return code;
  };

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
        zIndex: 3000,
        fontFamily: "monospace",
        color: "white",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "600px", width: "100%" }}>
        <h2
          style={{
            fontSize: "36px",
            textAlign: "center",
            marginBottom: "30px",
            letterSpacing: "3px",
          }}
        >
          CUSTOMIZE CONTROLS
        </h2>

        <div style={{ marginBottom: "30px", fontSize: "14px", textAlign: "center", opacity: 0.8 }}>
          Click a control to remap, then press the desired key
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
          {(["left", "right", "thrust", "fire", "hyperspace"] as ActionKey[]).map((action) => (
            <div
              key={action}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px 20px",
                border: "2px solid white",
                backgroundColor: listening === action ? "rgba(255, 255, 255, 0.2)" : "transparent",
              }}
            >
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>{actionLabels[action]}</span>
              <button
                onClick={() => handleListen(action)}
                style={{
                  padding: "10px 20px",
                  fontSize: "16px",
                  fontFamily: "monospace",
                  backgroundColor: listening === action ? "yellow" : "white",
                  color: "black",
                  border: "none",
                  cursor: "pointer",
                  minWidth: "120px",
                }}
              >
                {listening === action ? "Press key..." : formatKey(editingBindings[action][0])}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={() => onSave(editingBindings)}
            style={{
              flex: 1,
              padding: "15px 20px",
              fontSize: "18px",
              fontFamily: "monospace",
              backgroundColor: "white",
              color: "black",
              border: "2px solid white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            SAVE
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "15px 20px",
              fontSize: "18px",
              fontFamily: "monospace",
              backgroundColor: "transparent",
              color: "white",
              border: "2px solid white",
              cursor: "pointer",
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
