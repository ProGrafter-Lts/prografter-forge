import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ChevronRight, Trash2, Loader2, Eye, AlertTriangle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { AIQuoteOutput } from "./QuickBuildReview";
import { QUICKBUILD_SCENARIOS, seedScenarioPhotos } from "./quickBuildScenarios";

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

const DraftPreviewContent = ({ draft, onConvert, onClose }: { draft: DraftRow; onConvert: () => void; onClose: () => void }) => {
  const out = draft.final_output;
  const total = draftTotal(out);
  const buffer = out.variation_buffer_recommended_pence ?? 0;
  const grandTotal = total + buffer / 100;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Quote draft preview
        </DialogTitle>
        <DialogDescription>
          {draft.structured_input?.trade_type || "Draft quote"}
          {draft.structured_input?.postcode ? ` · ${draft.structured_input.postcode}` : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 mt-2">
        <Card className="p-4">
          <h3 className="font-heading text-primary text-sm mb-3">Schedule of Works</h3>
          <div className="space-y-2">
            {out.line_items.map((li, i) => (
              <div key={i} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex-1">
                  <span className="font-medium text-primary">{li.category}</span>
                  <span className="text-muted-foreground"> — {li.description}</span>
                </div>
                <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {li.quantity} {li.unit} × £{(li.estimated_unit_price / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t text-right text-sm">
            <div className="text-muted-foreground">Subtotal £{total.toFixed(2)}</div>
            {buffer > 0 && (
              <div className="text-muted-foreground">+ Variation buffer £{(buffer / 100).toFixed(2)}</div>
            )}
            <div className="font-heading text-secondary text-lg mt-1">
              Total £{grandTotal.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-heading text-primary text-sm mb-2">Methodology</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{out.methodology}</p>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-heading text-primary text-sm mb-1">Timeline</h3>
            <p className="text-sm text-muted-foreground">{out.timeline_days} working days</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-heading text-primary text-sm mb-1">Confidence</h3>
            <p className="text-sm text-muted-foreground">{out.confidence_score}/100</p>
          </Card>
        </div>

        {out.risk_flags.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-heading text-primary text-sm">Risk & compliance flags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {out.risk_flags.map((f) => (
                <Badge key={f} variant="outline" className="text-xs">
                  {f.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {out.notes_to_trade && (
          <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>AI note to trade:</strong> {out.notes_to_trade}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onConvert}>Convert to quote</Button>
        </div>
      </div>
    </>
  );
};

const QuickBuildDraftsList = ({ tradeId }: { tradeId: string }) => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerDraftId, setPickerDraftId] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<DraftRow | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);

  const generateTestDraft = async (scenarioId: string) => {
    const sc = QUICKBUILD_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      toast.error("Please sign in first.");
      return;
    }
    setGeneratingTest(true);
    const t = toast.loading(`Generating test draft: ${sc.label}…`);
    try {
      let photo_paths: string[] = [];
      let photo_captions: string[] = [];
      try {
        const seeded = await seedScenarioPhotos(userRes.user.id, sc);
        photo_paths = seeded.map((p) => p.path);
        photo_captions = seeded.map((p) => p.caption);
      } catch (e) {
        console.warn("photo seed failed, continuing without photos", e);
      }
      const { error } = await supabase.functions.invoke("quickbuild-generate", {
        body: {
          transcript: sc.transcript,
          photo_paths,
          photo_captions,
          structured_input: sc.structured,
        },
      });
      if (error) {
        console.error(error);
        toast.error("Couldn't generate test draft.", { id: t });
        return;
      }
      toast.success("Test draft created.", { id: t });
      await load();
    } finally {
      setGeneratingTest(false);
    }
  };

  const TestDraftMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={generatingTest}>
          {generatingTest ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <FlaskConical className="w-3 h-3 mr-1" />
          )}
          Generate test draft
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {QUICKBUILD_SCENARIOS.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => generateTestDraft(s.id)}>
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
    if (!confirm("Discard this quote draft? This can't be undone.")) return;
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
        <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
          <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            ProGrafter Quote Builder
            <span className="bg-amber-400 text-amber-950 font-mono font-semibold text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
              Founding Access preview
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <TestDraftMenu />
            <Button size="sm" variant="outline" onClick={() => navigate("/quote-builder/quickbuild")}>
              Start a Quote
            </Button>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground mb-3">
          Create, save and improve quote drafts before sending them to homeowners.
        </p>
        <div className="bg-card rounded-2xl p-8 border border-amber-200 text-center">
          <p className="font-heading text-primary text-lg mb-1">No quote drafts yet</p>
          <p className="font-mono text-xs text-muted-foreground mb-4 max-w-md mx-auto">
            Start a quote draft or generate one from a matched job when you're ready to price work
            through ProGrafter.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button size="sm" onClick={() => navigate("/quote-builder/quickbuild")}>
              Start a Quote
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/trade?view=jobs")}>
              Browse Available Jobs
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          ProGrafter Quote Builder
          <span className="bg-amber-100 text-amber-800 font-mono text-[10px] px-2 py-0.5 rounded-full">
            {drafts.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <TestDraftMenu />
          <Button size="sm" variant="outline" onClick={() => navigate("/quote-builder/quickbuild")}>
            New quote
          </Button>
        </div>
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
                <Button size="sm" variant="outline" onClick={() => setPreviewDraft(d)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
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

      {/* Preview Draft Dialog */}
      <Dialog open={!!previewDraft} onOpenChange={(o) => !o && setPreviewDraft(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {previewDraft && <DraftPreviewContent draft={previewDraft} onConvert={() => {
            setPreviewDraft(null);
            openPicker(previewDraft.id);
          }} onClose={() => setPreviewDraft(null)} />}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default QuickBuildDraftsList;
