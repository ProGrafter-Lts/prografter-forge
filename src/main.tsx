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

// One-time auto-reload if a dynamically imported module fails (usually a stale SW chunk reference).
window.addEventListener("vite:preloadError", () => {
  if (!sessionStorage.getItem("pg-reloaded-once")) {
    sessionStorage.setItem("pg-reloaded-once", "1");
    window.location.reload();
  }
});
window.addEventListener("error", (e) => {
  const msg = String(e?.message ?? "");
  if (msg.includes("Failed to fetch dynamically imported module")) {
    if (!sessionStorage.getItem("pg-reloaded-once")) {
      sessionStorage.setItem("pg-reloaded-once", "1");
      window.location.reload();
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
