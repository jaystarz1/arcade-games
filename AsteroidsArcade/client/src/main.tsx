import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// TEMPORARILY DISABLED SERVICE WORKER - unregister all existing ones
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('[SW] DISABLING service worker completely');

      // Unregister ALL service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('[SW] Unregistering:', registration);
        await registration.unregister();
      }

      // Clear ALL caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        console.log('[SW] Deleting cache:', cacheName);
        await caches.delete(cacheName);
      }

      console.log('[SW] Service worker DISABLED - no caching, always fresh code');
    } catch (error) {
      console.error('[SW] Failed to disable:', error);
    }
  });
}

// NO SERVICE WORKER = NO CACHE = ALWAYS FRESH CODE

createRoot(document.getElementById("root")!).render(<App />);
