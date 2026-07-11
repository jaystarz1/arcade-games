import { useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { resumeAudioContext } from "@/lib/audioContext";

interface TouchControlsProps {
  onControlChange: (control: string, pressed: boolean) => void;
}

export function TouchControls({ onControlChange }: TouchControlsProps) {
  const isMobile = useIsMobile();
  const activeControls = useRef<Set<string>>(new Set());
  const audioInitialized = useRef(false);

  // Prevent double-tap zoom on iOS
  useEffect(() => {
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);

  if (!isMobile) return null;

  // Initialize audio context on first touch
  const initAudio = () => {
    if (!audioInitialized.current) {
      resumeAudioContext();
      audioInitialized.current = true;
    }
  };

  const handleTouchStart = (control: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    initAudio();
    if (!activeControls.current.has(control)) {
      activeControls.current.add(control);
      onControlChange(control, true);
    }
  };

  const handleTouchEnd = (control: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeControls.current.has(control)) {
      activeControls.current.delete(control);
      onControlChange(control, false);
    }
  };

  // Prevent context menu on long press
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const buttonStyle: React.CSSProperties = {
    position: "absolute",
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    border: "2px solid rgba(255, 255, 255, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "24px",
    fontWeight: "bold",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    MozUserSelect: "none",
    msUserSelect: "none",
    touchAction: "manipulation",
    zIndex: 1001,
    pointerEvents: "all"
  } as React.CSSProperties;
  
  return (
    <>
      {/* Left controls - Rotation */}
      <div
        style={{
          ...buttonStyle,
          left: "20px",
          bottom: "45px",
        }}
        onTouchStart={handleTouchStart("left")}
        onTouchEnd={handleTouchEnd("left")}
        onMouseDown={handleTouchStart("left")}
        onMouseUp={handleTouchEnd("left")}
        onContextMenu={handleContextMenu}
      >
        ←
      </div>

      <div
        style={{
          ...buttonStyle,
          left: "100px",
          bottom: "45px",
        }}
        onTouchStart={handleTouchStart("right")}
        onTouchEnd={handleTouchEnd("right")}
        onMouseDown={handleTouchStart("right")}
        onMouseUp={handleTouchEnd("right")}
        onContextMenu={handleContextMenu}
      >
        →
      </div>

      {/* Thrust button - centered above L/R arrows */}
      <div
        style={{
          ...buttonStyle,
          left: "60px",
          bottom: "125px",
        }}
        onTouchStart={handleTouchStart("thrust")}
        onTouchEnd={handleTouchEnd("thrust")}
        onMouseDown={handleTouchStart("thrust")}
        onMouseUp={handleTouchEnd("thrust")}
        onContextMenu={handleContextMenu}
      >
        ↑
      </div>

      {/* Fire button - bottom right */}
      <div
        style={{
          ...buttonStyle,
          right: "20px",
          bottom: "45px",
          backgroundColor: "rgba(255, 100, 100, 0.15)",
          border: "2px solid rgba(255, 100, 100, 0.5)",
        }}
        onTouchStart={handleTouchStart("fire")}
        onTouchEnd={handleTouchEnd("fire")}
        onMouseDown={handleTouchStart("fire")}
        onMouseUp={handleTouchEnd("fire")}
        onContextMenu={handleContextMenu}
      >
        •
      </div>
    </>
  );
}
