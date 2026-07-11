import { useCallback, useEffect, useRef } from "react";
import { TouchControls } from "./TouchControls";
import { useSettingsStore } from "@/lib/stores/useSettingsStore";
import { resumeAudioContext } from "@/lib/audioContext";

export function TouchControlsManager() {
  const controlStateRef = useRef<Map<string, boolean>>(new Map());
  const keyBindings = useSettingsStore((state) => state.keyBindings);

  const handleControlChange = useCallback((control: string, pressed: boolean) => {
    // Initialize audio on first touch (required for mobile browsers)
    if (pressed) {
      resumeAudioContext();
    }

    controlStateRef.current.set(control, pressed);

    // Get the primary key binding for this control from settings
    const keys = keyBindings[control as keyof typeof keyBindings];
    const primaryKey = keys?.[0]; // Use the first key in the binding array

    if (primaryKey) {
      const eventType = pressed ? "keydown" : "keyup";
      const event = new KeyboardEvent(eventType, {
        code: primaryKey,
        key: primaryKey === "Space" ? " " : primaryKey,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
    }
  }, [keyBindings]);

  // Ensure we never leave simulated key presses stuck when controls unmount
  useEffect(() => {
    return () => {
      const stillPressed = Array.from(controlStateRef.current.entries())
        .filter(([, pressed]) => pressed)
        .map(([control]) => control);

      stillPressed.forEach((control) => {
        handleControlChange(control, false);
      });

      controlStateRef.current.clear();
    };
  }, [handleControlChange]);

  return <TouchControls onControlChange={handleControlChange} />;
}
