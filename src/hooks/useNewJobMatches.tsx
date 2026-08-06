import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setCount(0);
      return;
    }

    const { data: tradeRow } = await supabase
      .from("trades")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!tradeRow?.id) {
      setCount(0);
      return;
    }

    const { data } = await supabase
      .from("job_matches")
      .select("id")
      .eq("trade_id", tradeRow.id)
      .eq("status", "notified");

    const seen = readSeen();
    setCount((data || []).filter((m: { id: string }) => !seen.includes(m.id)).length);
    return tradeRow.id;
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void (async () => {
      const tradeId = await refresh();
      if (cancelled || !tradeId) return;

      channel = supabase
        .channel(`job-matches-badge-${tradeId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "job_matches", filter: `trade_id=eq.${tradeId}` },
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
  }, [refresh]);

  return count;
};
