import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // we register manually with iframe/preview guard
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "offline.html", "robots.txt"],
      manifest: false, // we ship our own public/manifest.json
      devOptions: {
        enabled: false,
      },
      workbox: {
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/, /^\/auth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              ["/", "/login", "/register/trade", "/post-a-job", "/dashboard/trade", "/dashboard/homeowner"].includes(
                url.pathname,
              ),
            handler: "NetworkFirst",
            options: {
              cacheName: "pg-pages",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "pg-images",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
