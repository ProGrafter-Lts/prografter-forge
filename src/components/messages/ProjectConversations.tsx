import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface ConversationJob {
  id: string;
  title?: string | null;
  job_type?: string | null;
  status?: string | null;
}

interface Props {
  jobs: ConversationJob[];
  /** Who is viewing — controls the "last message from" label. */
  viewerRole: "homeowner" | "trade";
  emptyMessage?: string;
}

interface LastMessage {
  message_text: string;
  created_at: string;
  sender_type: string;
}

const timeAgo = (dateStr: string) => {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/**
 * Lists the viewer's projects with the latest message on each, linking into the
 * real per-project conversation on /project/:id (Messages tab).
 * Read-only index — sending still happens in MessagingPanel on the project page.
 */
const ProjectConversations = ({ jobs, viewerRole, emptyMessage }: Props) => {
  const navigate = useNavigate();
  const [latest, setLatest] = useState<Record<string, LastMessage>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const jobIdsKey = jobs.map((j) => j.id).sort().join(",");

  useEffect(() => {
    let cancelled = false;
    const ids = jobIdsKey ? jobIdsKey.split(",") : [];
    if (ids.length === 0) {
      setLatest({});
      setCounts({});
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("project_messages")
      .select("job_id, message_text, created_at, sender_type")
      .in("job_id", ids)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        const byJob: Record<string, LastMessage> = {};
        const total: Record<string, number> = {};
        for (const m of data || []) {
          total[m.job_id] = (total[m.job_id] || 0) + 1;
          if (!byJob[m.job_id]) {
            byJob[m.job_id] = {
              message_text: m.message_text,
              created_at: m.created_at,
              sender_type: m.sender_type,
            };
          }
        }
        setLatest(byJob);
        setCounts(total);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobIdsKey]);

  if (loading) {
    return <p className="font-mono text-sm text-muted-foreground">Loading conversations…</p>;
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <MessageSquare className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
        <p className="font-mono text-sm text-muted-foreground">
          {emptyMessage ||
            (viewerRole === "trade"
              ? "No matched projects yet — conversations start once you're matched to a job."
              : "No projects yet — conversations start once a project is under way.")}
        </p>
      </div>
    );
  }

  const sorted = [...jobs].sort((a, b) => {
    const ta = latest[a.id]?.created_at ? new Date(latest[a.id].created_at).getTime() : 0;
    const tb = latest[b.id]?.created_at ? new Date(latest[b.id].created_at).getTime() : 0;
    return tb - ta;
  });

  return (
    <div className="space-y-3">
      {sorted.map((job) => {
        const last = latest[job.id];
        return (
          <button
            key={job.id}
            onClick={() => navigate(`/project/${job.id}?tab=messages`)}
            className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-secondary/50 transition-colors flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-primary text-base truncate">
                  {job.title || job.job_type || "Project"}
                </span>
                {counts[job.id] ? (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">
                    {counts[job.id]} message{counts[job.id] === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-1 truncate">
                {last
                  ? `${last.sender_type === "trade" ? "Trade" : "Homeowner"}: ${last.message_text}`
                  : "No messages yet — open the project to start the conversation."}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {last && (
                <span className="font-mono text-[10px] text-muted-foreground">{timeAgo(last.created_at)}</span>
              )}
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ProjectConversations;
