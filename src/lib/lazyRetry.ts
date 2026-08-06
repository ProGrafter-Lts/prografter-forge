import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "pg-chunk-reload-at";
const RELOAD_COOLDOWN_MS = 15000;

/**
 * React.lazy with resilience against stale chunk hashes after a deploy.
 * Retries the dynamic import once, then does a single throttled hard reload
 * so the browser fetches a fresh index.html with current chunk names.
 */
export function lazyRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      // Second attempt — transient network blips recover here.
      try {
        await new Promise((r) => setTimeout(r, 400));
        return await factory();
      } catch (err2) {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
        if (Date.now() - last > RELOAD_COOLDOWN_MS) {
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
          // Keep the boundary suspended while the page reloads.
          await new Promise(() => {});
        }
        throw err2;
      }
    }
  });
}
