import { useState, useEffect } from "react";

interface LogEntry {
  message: string;
  timestamp: Date;
}

export function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Intercept console.log, console.warn, console.error
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (message: string) => {
      setLogs(prev => [...prev.slice(-49), { message, timestamp: new Date() }]);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          zIndex: 9999,
          background: "rgba(0, 0, 0, 0.8)",
          color: "#0f0",
          border: "2px solid #0f0",
          borderRadius: "5px",
          padding: "10px 15px",
          fontFamily: "monospace",
          fontSize: "14px",
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        {isVisible ? "HIDE CONSOLE" : "SHOW CONSOLE"}
      </button>

      {/* Console Window */}
      {isVisible && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            right: "10px",
            width: "90vw",
            maxWidth: "600px",
            height: "60vh",
            maxHeight: "400px",
            background: "rgba(0, 0, 0, 0.95)",
            border: "2px solid #0f0",
            borderRadius: "5px",
            zIndex: 9998,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px",
              background: "#0f0",
              color: "#000",
              fontFamily: "monospace",
              fontSize: "14px",
              fontWeight: "bold",
              borderBottom: "2px solid #0f0",
            }}
          >
            DEBUG CONSOLE
          </div>

          {/* Log Area */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "10px",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#0f0",
            }}
          >
            {logs.length === 0 ? (
              <div style={{ opacity: 0.5 }}>Waiting for logs...</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "5px",
                    wordBreak: "break-word",
                    color: log.message.startsWith('ERROR:') ? '#f00' :
                           log.message.startsWith('WARN:') ? '#ff0' : '#0f0'
                  }}
                >
                  <span style={{ opacity: 0.5 }}>
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>{' '}
                  {log.message}
                </div>
              ))
            )}
          </div>

          {/* Clear Button */}
          <button
            onClick={() => setLogs([])}
            style={{
              margin: "10px",
              padding: "8px",
              background: "transparent",
              color: "#0f0",
              border: "1px solid #0f0",
              borderRadius: "3px",
              fontFamily: "monospace",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            CLEAR LOGS
          </button>
        </div>
      )}
    </>
  );
}
