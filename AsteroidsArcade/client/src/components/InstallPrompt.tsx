import { useState, useEffect } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "15px 20px",
        borderRadius: "8px",
        border: "2px solid white",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        gap: "15px",
        fontFamily: "monospace",
        maxWidth: "90%",
      }}
    >
      <span>Install Asteroids for offline play?</span>
      <button
        onClick={handleInstall}
        style={{
          padding: "8px 16px",
          backgroundColor: "white",
          color: "black",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontFamily: "monospace",
          fontWeight: "bold",
        }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        style={{
          padding: "8px 16px",
          backgroundColor: "transparent",
          color: "white",
          border: "1px solid white",
          borderRadius: "4px",
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
