import { useCallback, useEffect, useState } from "react";
import { loadAttention, emptySnapshot, AttentionSnapshot } from "@/lib/attention";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/**
 * Single source of truth for every admin attention count and list.
 * The nav badge, the dashboard panel and the Attention Centre all use this.
 */
export const useAttention = (pollMs = 60000) => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [snapshot, setSnapshot] = useState<AttentionSnapshot>(emptySnapshot());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setSnapshot(emptySnapshot());
      setLoading(false);
      return;
    }
    try {
      setSnapshot(await loadAttention());
    } catch (e) {
      console.error("Attention load failed", e);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (adminLoading) return;
    refresh();
    if (!isAdmin || !pollMs) return;
    const id = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(id);
  }, [adminLoading, isAdmin, pollMs, refresh]);

  return { ...snapshot, loading: loading || adminLoading, isAdmin, refresh };
};
