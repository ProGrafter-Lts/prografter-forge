import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DISMISS_KEY = "pg_pwa_dismissed_until";
const PAGEVIEW_KEY = "pg_pwa_pageviews";
const SESSION_START_KEY = "pg_pwa_session_start";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isInIframe = (() => {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app"));

export default function PWAInstallBanner() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  // Track pageviews
  useEffect(() => {
    if (typeof window === "undefined") return;
    const count = Number(sessionStorage.getItem(PAGEVIEW_KEY) || "0") + 1;
    sessionStorage.setItem(PAGEVIEW_KEY, String(count));
    if (!sessionStorage.getItem(SESSION_START_KEY)) {
      sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
  }, [location.pathname]);

  // Capture install prompt
  useEffect(() => {
    if (isInIframe || isPreviewHost) return;

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || "0");
    if (Date.now() < dismissedUntil) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show banner after 30s + 2 pageviews
  useEffect(() => {
    if (!deferredPrompt) return;

    const check = () => {
      const start = Number(sessionStorage.getItem(SESSION_START_KEY) || Date.now());
      const views = Number(sessionStorage.getItem(PAGEVIEW_KEY) || "0");
      const elapsed = Date.now() - start;
      if (elapsed >= 30_000 && views >= 2) {
        setShow(true);
      }
    };

    check();
    const id = window.setInterval(check, 5_000);
    return () => window.clearInterval(id);
  }, [deferredPrompt]);

  const dismiss = () => {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(Date.now() + thirtyDays));
    setShow(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    } else {
      dismiss();
    }
  };

  if (!show || !deferredPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Install ProGrafter"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-primary/40 bg-card/95 p-4 shadow-2xl backdrop-blur md:left-auto md:right-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-lg">
          📱
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Add ProGrafter to your home screen for quick access →
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={install}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Maybe later
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
