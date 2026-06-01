import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Fires a GA4 page_view event on every route change so single-page-app
 * navigation is captured (gtag in index.html only records the first load).
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // Defer so document.title reflects the new route if it was updated.
    const id = window.setTimeout(() => {
      trackPageView(location.pathname + location.search);
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);
}
