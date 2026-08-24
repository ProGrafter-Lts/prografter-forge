import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * SiteScout is in closed testing. Only these accounts get live access —
 * every other account sees SiteScout as "Coming Soon".
 */
export const SITESCOUT_TEST_ACCOUNTS = ["leepalfreeman@gmail.com"];

export function isSiteScoutTester(email?: string | null): boolean {
  if (!email) return false;
  return SITESCOUT_TEST_ACCOUNTS.includes(email.trim().toLowerCase());
}

export function useSiteScoutAccess(): { loading: boolean; allowed: boolean } {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setAllowed(isSiteScoutTester(data.user?.email));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { loading, allowed };
}
