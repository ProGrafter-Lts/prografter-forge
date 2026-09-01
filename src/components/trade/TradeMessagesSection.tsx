import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProjectConversations, { type ConversationJob } from "@/components/messages/ProjectConversations";

/**
 * Trade-side index of the same per-project conversations the homeowner sees,
 * scoped to the jobs this trade is matched to (project_messages RLS enforces
 * the same scope server-side).
 */
const TradeMessagesSection = ({ tradeId }: { tradeId: string }) => {
  const [jobs, setJobs] = useState<ConversationJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("job_matches")
        .select("job_id, jobs:job_id (id, title, job_type, status, is_test)")
        .eq("trade_id", tradeId);

      if (cancelled) return;
      const seen = new Set<string>();
      const list: ConversationJob[] = [];
      for (const row of (data || []) as any[]) {
        const job = row.jobs;
        if (!job || job.is_test || seen.has(job.id)) continue;
        seen.add(job.id);
        list.push({ id: job.id, title: job.title, job_type: job.job_type, status: job.status });
      }
      setJobs(list);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  if (loading) {
    return <p className="font-mono text-sm text-muted-foreground">Loading conversations…</p>;
  }

  return <ProjectConversations jobs={jobs} viewerRole="trade" />;
};

export default TradeMessagesSection;
