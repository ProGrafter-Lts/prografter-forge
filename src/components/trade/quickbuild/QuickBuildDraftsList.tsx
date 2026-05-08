import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { AIQuoteOutput } from "./QuickBuildReview";

interface DraftRow {
  id: string;
  created_at: string;
  final_output: AIQuoteOutput;
  structured_input: { trade_type?: string; postcode?: string } | null;
}

interface JobMatch {
  id: string;
  job_id: string;
  jobs: { id: string; title: string | null; job_type: string; postcode: string } | null;
}

const draftTotal = (out: AIQuoteOutput) =>
  out.line_items.reduce(
    (s, li) => s + (Number(li.quantity) || 0) * (Number(li.estimated_unit_price) || 0),
    0,
  );

const QuickBuildDraftsList = ({ tradeId }: { tradeId: string }) => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerDraftId, setPickerDraftId] = useState<string | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("quickbuild_generations")
      .select("id, created_at, final_output, structured_input")
      .eq("trade_user_id", userRes.user.id)
      .is("quote_id", null)
      .eq("was_sent", false)
      .not("final_output", "is", null)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setDrafts((data ?? []) as unknown as DraftRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const openPicker = async (draftId: string) => {
    setPickerDraftId(draftId);
    setPickerLoading(true);
    const { data, error } = await supabase
      .from("job_matches")
      .select("id, job_id, jobs(id, title, job_type, postcode)")
      .eq("trade_id", tradeId)
      .order("notified_at", { ascending: false })
      .limit(20);
    if (error) console.error(error);
    setMatches(((data ?? []) as unknown) as JobMatch[]);
    setPickerLoading(false);
  };

  const pickJob = (jobId: string) => {
    if (!pickerDraftId) return;
    navigate(`/project/${jobId}?qbDraft=${pickerDraftId}`);
    setPickerDraftId(null);
  };

  const discard = async (id: string) => {
    if (!confirm("Discard this QuickBuild draft? This can't be undone.")) return;
    const { error } = await supabase
      .from("quickbuild_generations")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Couldn't discard draft");
      return;
    }
    setDrafts((d) => d.filter((x) => x.id !== id));
  };

  if (loading) return null;
  if (drafts.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            QuickBuild drafts
          </h2>
          <Button size="sm" variant="outline" onClick={() => navigate("/quote-builder/quickbuild")}>
            Start a draft
          </Button>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-amber-200 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            No saved drafts. Generate one with QuickBuild and it'll appear here, ready to attach to a job.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          QuickBuild drafts
          <span className="bg-amber-100 text-amber-800 font-mono text-[10px] px-2 py-0.5 rounded-full">
            {drafts.length}
          </span>
        </h2>
        <Button size="sm" variant="outline" onClick={() => navigate("/quote-builder/quickbuild")}>
          New draft
        </Button>
      </div>

      <div className="space-y-3">
        {drafts.map((d) => {
          const total = draftTotal(d.final_output);
          const lines = d.final_output.line_items.length;
          const days = d.final_output.timeline_days;
          return (
            <div
              key={d.id}
              className="bg-card rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-primary text-lg truncate">
                  {d.structured_input?.trade_type || "Draft quote"}
                  {d.structured_input?.postcode ? ` · ${d.structured_input.postcode}` : ""}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {lines} line items · {days} working days · drafted {new Date(d.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading text-secondary text-xl">
                  £{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" onClick={() => openPicker(d.id)}>
                  Convert to quote <ChevronRight className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => discard(d.id)}>
                  <Trash2 className="w-3 h-3" /> Discard
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!pickerDraftId} onOpenChange={(o) => !o && setPickerDraftId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pick a job to attach this draft to</DialogTitle>
            <DialogDescription>
              The draft will pre-fill the quote form on the job page. You can still edit everything before submitting.
            </DialogDescription>
          </DialogHeader>
          {pickerLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : matches.length === 0 ? (
            <p className="font-mono text-sm text-muted-foreground py-4">
              You don't have any job matches yet. The draft stays saved here for when one comes in.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => m.jobs && pickJob(m.jobs.id)}
                  disabled={!m.jobs}
                  className="w-full text-left bg-muted/40 hover:bg-muted rounded-lg p-3 transition-colors disabled:opacity-50"
                >
                  <div className="font-heading text-sm text-primary">
                    {m.jobs?.title || m.jobs?.job_type || "Job"}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {m.jobs?.postcode}
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default QuickBuildDraftsList;
