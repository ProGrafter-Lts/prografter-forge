// Lightweight GA4 (gtag.js) helper.
// gtag is loaded in index.html with measurement ID G-G8KF4CMYVT.
// Calls no-op safely if gtag is unavailable. Analytics storage is gated by
// Google Consent Mode v2: denied by default, granted only when the user opts
// in via the cookie banner (src/components/CookieConsent.tsx).

export const GA_MEASUREMENT_ID = "G-G8KF4CMYVT";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  return typeof window.gtag === "function" ? window.gtag : null;
}

/** Record a single-page-app page view on route change. */
export function trackPageView(path: string, title?: string): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
    send_to: GA_MEASUREMENT_ID,
  });
}

/** Record an arbitrary GA4 event (used for conversions/key events). */
export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", name, { ...params, send_to: GA_MEASUREMENT_ID });
}
