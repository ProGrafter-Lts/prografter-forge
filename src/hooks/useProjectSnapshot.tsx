import { useCallback, useEffect, useState } from "react";
import { loadProjectSnapshot, type ProjectSnapshot } from "@/lib/projectSpine";

/**
 * Shared read of one project. Both the homeowner and trade dashboards use this,
 * so neither side can drift from the other.
 */
export function useProjectSnapshot(jobId: string | null | undefined) {
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(jobId));

  const reload = useCallback(async () => {
    if (!jobId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSnapshot(await loadProjectSnapshot(jobId));
    } catch (err) {
      console.error("Project snapshot failed", err);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await reload();
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return { snapshot, loading, reload };
}
