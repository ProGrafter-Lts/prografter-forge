import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { QuickBuildBetaBadge } from "@/components/trade/quickbuild/QuickBuildBetaBadge";
import { QuickBuildVoiceRecorder } from "@/components/trade/quickbuild/QuickBuildVoiceRecorder";
import {
  QuickBuildPhotoUploader,
  type QuickBuildPhoto,
} from "@/components/trade/quickbuild/QuickBuildPhotoUploader";
import {
  QuickBuildStructuredForm,
  emptyStructured,
  type QuickBuildStructured,
} from "@/components/trade/quickbuild/QuickBuildStructuredForm";
import {
  QuickBuildReview,
  type AIQuoteOutput,
} from "@/components/trade/quickbuild/QuickBuildReview";

type Stage = "input" | "generating" | "review";

const QUICKBUILD_HANDOFF_KEY = "prografter:quickbuild:handoff";

const QuickBuildPage = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("input");
  const [userId, setUserId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [photos, setPhotos] = useState<QuickBuildPhoto[]>([]);
  const [structured, setStructured] = useState<QuickBuildStructured>(emptyStructured());
  const [draft, setDraft] = useState<AIQuoteOutput | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isFeatureEnabled("quickBuild")) {
      navigate("/dashboard/trade", { replace: true });
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/login");
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const generate = async () => {
    if (!userId) return;
    if (!transcript.trim() && photos.length === 0) {
      toast.error("Add a voice note or at least one photo first.");
      return;
    }
    setStage("generating");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("quickbuild-generate", {
        body: {
          transcript,
          photo_paths: photos.map((p) => p.path),
          photo_captions: photos.map((p) => p.caption),
          structured_input: structured,
        },
      });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        let msg = "QuickBuild had trouble — try with more detail in the description.";
        if (ctx) {
          try {
            const j = await ctx.json();
            if (j?.message) msg = j.message;
            if (j?.remaining !== undefined) setRemaining(j.remaining);
          } catch { /* noop */ }
        }
        toast.error(msg);
        setStage("input");
        return;
      }
      const out = data as {
        generation_id: string;
        output: AIQuoteOutput;
        remaining: number;
      };
      setDraft(out.output);
      setGenerationId(out.generation_id);
      setRemaining(out.remaining);
      setStage("review");
    } catch (e) {
      console.error(e);
      toast.error("QuickBuild temporarily unavailable. Try again or use the manual builder.");
      setStage("input");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (final: AIQuoteOutput) => {
    if (generationId) {
      await supabase
        .from("quickbuild_generations")
        .update({ final_output: final as unknown as Record<string, unknown> })
        .eq("id", generationId);
    }
    // Stash for the existing quote builder to pick up later when wired
    sessionStorage.setItem(
      QUICKBUILD_HANDOFF_KEY,
      JSON.stringify({ generationId, final, structured }),
    );
    toast.success("Draft saved. Continue in the standard quote builder.");
    navigate("/dashboard/trade");
  };

  if (!isFeatureEnabled("quickBuild") || !userId) return null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-amber-600" />
          <h1 className="text-2xl font-bold">QuickBuild</h1>
          <QuickBuildBetaBadge />
        </div>
        {remaining !== null && (
          <span className="text-xs text-muted-foreground">
            {remaining} generation{remaining === 1 ? "" : "s"} left today
          </span>
        )}
      </header>

      {stage === "input" && (
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="mb-2 font-semibold">1 · Describe the job by voice</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Up to 60 seconds. Include scope, materials, and anything unusual.
            </p>
            <QuickBuildVoiceRecorder transcript={transcript} onChange={setTranscript} />
          </Card>

          <Card className="p-4">
            <h2 className="mb-2 font-semibold">2 · Add site photos</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              1–8 photos. Compressed to ≤2MB on your device.
            </p>
            <QuickBuildPhotoUploader
              userId={userId}
              photos={photos}
              onChange={setPhotos}
            />
          </Card>

          <Card className="p-4">
            <h2 className="mb-2 font-semibold">3 · Job details</h2>
            <QuickBuildStructuredForm value={structured} onChange={setStructured} />
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={submitting} size="lg">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate draft
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard/trade")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {stage === "generating" && (
        <Card className="flex flex-col items-center justify-center gap-3 p-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-sm text-muted-foreground">
            Drafting your Schedule of Works… this can take 20–40 seconds.
          </p>
        </Card>
      )}

      {stage === "review" && draft && (
        <QuickBuildReview
          initial={draft}
          onAccept={handleAccept}
          onBack={() => setStage("input")}
        />
      )}
    </div>
  );
};

export default QuickBuildPage;
