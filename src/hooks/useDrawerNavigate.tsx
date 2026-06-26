import { useCallback } from "react";
import { useNavigate, useLocation, type Location } from "react-router-dom";

/**
 * Navigate to a route that should render as a slide-over drawer OVER the current
 * list/dashboard, using React Router's background-location pattern.
 *
 * The current location is stashed as `backgroundLocation` in history state so the
 * underlying page (and its scroll position) stays mounted while the drawer is open.
 * If we're already inside a drawer (a backgroundLocation already exists), that
 * original background is preserved so drawer→drawer navigation keeps the same base.
 *
 * Direct deep-links carry no backgroundLocation, so those routes still render
 * full-screen via the main route tree.
 */
export function useDrawerNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (to: string) => {
      const state = location.state as { backgroundLocation?: Location } | null;
      const backgroundLocation = state?.backgroundLocation ?? location;
      navigate(to, { state: { backgroundLocation } });
    },
    [navigate, location],
  );
}
