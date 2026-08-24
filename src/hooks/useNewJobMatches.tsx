import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTradeAccess } from "@/hooks/useTradeAccess";
import { isTestRecord } from "@/lib/testData";

const SEEN_KEY = "pg_seen_job_matches";

const readSeen = (): string[] => {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSeen = (ids: string[]) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-200)));
  } catch {
    /* ignore */
  }
};

/** Marks a job match as viewed and notifies any mounted badge listeners. */
export const markJobMatchSeen = (matchId: string) => {
  if (!matchId) return;
  const seen = readSeen();
  if (seen.includes(matchId)) return;
  writeSeen([...seen, matchId]);
  window.dispatchEvent(new CustomEvent("pg:job-matches-seen"));
};

/**
 * Live count of new (notified, not-yet-viewed) job matches for the signed-in trade.
 * Updates in real time as matches arrive and reduces as the trade views them.
 */
export const useNewJobMatchCount = () => {
  const [count, setCount] = useState(0);
  // Use the same trade resolution as the dashboard so the badge can never
  // count matches belonging to a different (e.g. duplicate personal) account.
  const { isReady, trade } = useTradeAccess({ redirectToSetup: false });
  const tradeId = trade?.id ?? null;

  const refresh = useCallback(async () => {
    if (!tradeId) {
      setCount(0);
      return null;
    }

    const { data } = await supabase
      .from("job_matches")
      .select("id, jobs(is_test)")
      .eq("trade_id", tradeId)
      .eq("status", "notified");

    const seen = readSeen();
    const rows = (data || []) as { id: string; jobs?: { is_test?: boolean | null } | null }[];
    setCount(rows.filter((m) => !isTestRecord(m) && !seen.includes(m.id)).length);
    return tradeId;
  }, [tradeId]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    if (!isReady) return;

    void (async () => {
      const resolvedId = await refresh();
      if (cancelled || !resolvedId) return;

      channel = supabase
        .channel(`job-matches-badge-${resolvedId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "job_matches", filter: `trade_id=eq.${resolvedId}` },
          () => void refresh(),
        )
        .subscribe();
    })();

    const onSeen = () => void refresh();
    window.addEventListener("pg:job-matches-seen", onSeen);

    return () => {
      cancelled = true;
      window.removeEventListener("pg:job-matches-seen", onSeen);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh, isReady]);

  return count;
};
