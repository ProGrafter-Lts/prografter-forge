import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Unread state for the existing shared project conversations.
 *
 * No new messaging system: this reads `project_messages` (already RLS-scoped to
 * the projects the viewer participates in) and compares each project's latest
 * activity against the viewer's own `project_message_reads.last_read_at`.
 */
export function useUnreadMessages() {
  const [byJob, setByJob] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setByJob({});
      return;
    }

    const [{ data: messages }, { data: reads }] = await Promise.all([
      supabase.from("project_messages").select("job_id, created_at, sender_id"),
      supabase.from("project_message_reads").select("job_id, last_read_at").eq("user_id", uid),
    ]);

    const readAt: Record<string, number> = {};
    for (const r of reads || []) readAt[r.job_id] = new Date(r.last_read_at).getTime();

    const counts: Record<string, number> = {};
    for (const m of messages || []) {
      if (m.sender_id === uid) continue;
      const seenAt = readAt[m.job_id] ?? 0;
      if (new Date(m.created_at).getTime() > seenAt) {
        counts[m.job_id] = (counts[m.job_id] || 0) + 1;
      }
    }
    setByJob(counts);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("unread-project-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const markRead = useCallback(
    async (jobId: string) => {
      if (!userId) return;
      setByJob((prev) => {
        if (!prev[jobId]) return prev;
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      await supabase
        .from("project_message_reads")
        .upsert(
          { user_id: userId, job_id: jobId, last_read_at: new Date().toISOString() },
          { onConflict: "user_id,job_id" },
        );
    },
    [userId],
  );

  const total = Object.values(byJob).reduce((sum, n) => sum + n, 0);

  return { byJob, total, markRead, reload: load };
}

/** Convenience: total unread count only, for sidebar badges. */
export function useUnreadMessageCount() {
  return useUnreadMessages().total;
}
