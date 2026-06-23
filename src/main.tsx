import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Reliability first: clear any existing service workers and caches so users don't get a stale cached app.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((registration) => registration.unregister());
  });
}
if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
}

// Auto-recover when a dynamically imported chunk fails to load (stale hash after a deploy).
// Throttled by timestamp so it can recover from future deploys without ever looping forever.
const RELOAD_KEY = "pg-chunk-reload-at";
const RELOAD_COOLDOWN_MS = 15000;

async function recoverFromStaleChunk() {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < RELOAD_COOLDOWN_MS) return; // already tried very recently — avoid a loop
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* best effort */
  }
  window.location.reload();
}

window.addEventListener("vite:preloadError", () => {
  void recoverFromStaleChunk();
});
window.addEventListener("error", (e) => {
  const msg = String(e?.message ?? "");
  if (msg.includes("Failed to fetch dynamically imported module")) {
    void recoverFromStaleChunk();
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
