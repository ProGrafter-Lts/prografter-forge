import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save, Home, Layers,
  Wrench, Compass, Target, Building2, TreePine, ChefHat, Hammer, HelpCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types & constants — Project Clarity v2.0
// ---------------------------------------------------------------------------

type ProjectTypeId =
  | "rear_extension" | "side_extension" | "wrap_around_extension"
  | "double_storey_extension" | "loft_conversion" | "garage_conversion"
  | "kitchen_renovation" | "full_renovation" | "landscaping" | "commercial" | "other";

type StageId =
  | "exploring" | "know_what_want" | "spoken_to_someone" | "drawings"
  | "planning_submitted" | "planning_approved" | "ready_for_quotes" | "already_have_quotes";

type ExistingId =
  | "drawings" | "planning_approval" | "structural_calcs"
  | "existing_quotations" | "budget_in_mind" | "none";

type ConcernId =
  | "where_to_start" | "likely_costs" | "planning_permission"
  | "quotations" | "choosing_builder" | "managing_project";

type ClarityData = {
  project_type: ProjectTypeId | null;
  stage: StageId | null;
  existing: ExistingId[];
  concern: ConcernId | null;
};

type ClarityRecord = {
  id: string;
  edit_token: string;
  status: "draft" | "analysing" | "complete";
  current_step: number;
  project_type: string | null;
  current_stage: string | null;
  builder_data: any | null;
};

const PROJECT_TYPES: { id: ProjectTypeId; label: string; icon: any }[] = [
  { id: "rear_extension", label: "Rear Extension", icon: Home },
  { id: "side_extension", label: "Side Extension", icon: Home },
  { id: "wrap_around_extension", label: "Wrap Around Extension", icon: Layers },
  { id: "double_storey_extension", label: "Double Storey Extension", icon: Building2 },
  { id: "loft_conversion", label: "Loft Conversion", icon: Layers },
  { id: "garage_conversion", label: "Garage Conversion", icon: Home },
  { id: "kitchen_renovation", label: "Kitchen Renovation", icon: ChefHat },
  { id: "full_renovation", label: "Full Renovation", icon: Wrench },
  { id: "landscaping", label: "Landscaping", icon: TreePine },
  { id: "commercial", label: "Commercial", icon: Building2 },
  { id: "other", label: "Other", icon: HelpCircle },
];

const STAGES: { id: StageId; label: string; hint: string }[] = [
  { id: "exploring", label: "I'm just exploring ideas.", hint: "Nothing decided yet — that's fine." },
  { id: "know_what_want", label: "I know what I want.", hint: "The vision is clear in your head." },
  { id: "spoken_to_someone", label: "I've spoken to somebody.", hint: "Architect, designer or builder." },
  { id: "drawings", label: "I have drawings.", hint: "Plans or sketches ready to share." },
  { id: "planning_submitted", label: "Planning has been submitted.", hint: "Awaiting a council decision." },
  { id: "planning_approved", label: "Planning has been approved.", hint: "Ready to move to costs and quotes." },
  { id: "ready_for_quotes", label: "I'm ready to request quotations.", hint: "You want prices from trades." },
  { id: "already_have_quotes", label: "I already have quotations.", hint: "You want to review and compare." },
];

const EXISTING: { id: ExistingId; label: string }[] = [
  { id: "drawings", label: "Drawings" },
  { id: "planning_approval", label: "Planning Approval" },
  { id: "structural_calcs", label: "Structural Calculations" },
  { id: "existing_quotations", label: "Existing Quotations" },
  { id: "budget_in_mind", label: "A Budget In Mind" },
  { id: "none", label: "None Of These" },
];

const CONCERNS: { id: ConcernId; label: string }[] = [
  { id: "where_to_start", label: "Understanding where to start." },
  { id: "likely_costs", label: "Understanding likely costs." },
  { id: "planning_permission", label: "Understanding planning permission." },
  { id: "quotations", label: "Understanding quotations." },
  { id: "choosing_builder", label: "Choosing a builder." },
  { id: "managing_project", label: "Managing my project." },
];

// Journey timeline — 8 stops
type JourneyId =
  | "idea" | "planning" | "costs" | "request_quotes"
  | "review_quotes" | "compare_quotes" | "appoint_builder" | "dashboard";

const JOURNEY: { id: JourneyId; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "planning", label: "Project Planning" },
  { id: "costs", label: "Understanding Costs" },
  { id: "request_quotes", label: "Request Quotations" },
  { id: "review_quotes", label: "Review Quotations" },
  { id: "compare_quotes", label: "Compare Quotations" },
  { id: "appoint_builder", label: "Appoint Builder" },
  { id: "dashboard", label: "Project Dashboard" },
];

const LS_KEY = "prografter.project-clarity.v2";

// ---------------------------------------------------------------------------
// Journey + recommendation engine (deterministic, client-side)
// ---------------------------------------------------------------------------

function positionForStage(stage: StageId | null): JourneyId {
  switch (stage) {
    case "exploring": return "idea";
    case "know_what_want": return "planning";
    case "spoken_to_someone": return "planning";
    case "drawings": return "costs";
    case "planning_submitted": return "costs";
    case "planning_approved": return "request_quotes";
    case "ready_for_quotes": return "request_quotes";
    case "already_have_quotes": return "review_quotes";
    default: return "idea";
  }
}

function meaningFor(stage: StageId | null): string {
  switch (stage) {
    case "exploring":
      return "You're at the very start of your journey. This is the perfect time to shape your ideas before spending on drawings or quotations.";
    case "know_what_want":
      return "You have a clear vision. The next natural step is to firm up costs and consider how you'll communicate the project to trades.";
    case "spoken_to_someone":
      return "You've started important conversations. Capturing what you've learned will help you make more confident decisions from here.";
    case "drawings":
      return "Having drawings puts you well ahead. You're ready to think seriously about likely costs before inviting quotations.";
    case "planning_submitted":
      return "With planning in progress, it's a great time to prepare for costs and quotations so you're ready the moment approval lands.";
    case "planning_approved":
      return "Planning is approved — a major milestone. You're now ready to move confidently toward quotations.";
    case "ready_for_quotes":
      return "You're at the stage where most homeowners begin requesting quotations. Preparing thoroughly now will help you compare quotations more confidently later.";
    case "already_have_quotes":
      return "You have quotations in hand. Reviewing them carefully will help you understand what's included, what's missing, and how they compare.";
    default:
      return "Taking time now to understand your project will help you make more informed decisions later.";
  }
}

function considerationsFor(data: ClarityData): string[] {
  const has = (id: ExistingId) => data.existing.includes(id);
  const items: string[] = [];
  if (!has("budget_in_mind")) items.push("Do you have a realistic budget in mind?");
  if (!has("drawings") && data.stage !== "exploring") items.push("Would drawings help communicate your ideas to trades?");
  if (!has("planning_approval") && (data.stage === "know_what_want" || data.stage === "drawings")) {
    items.push("Are you confident whether planning permission is required?");
  }
  if (data.stage === "exploring" || data.stage === "know_what_want") {
    items.push("Have you thought about your ideal finish and specification?");
  }
  if (has("existing_quotations") || data.stage === "already_have_quotes") {
    items.push("Are you clear on what each quotation includes — and excludes?");
  }
  if (!items.length) items.push("Have you thought about how you'd like to manage the project week to week?");
  return items.slice(0, 4);
}

type NextStep = { title: string; why: string; to: string; cta: string };

function nextStepFor(data: ClarityData): NextStep {
  // Primary concern takes precedence
  switch (data.concern) {
    case "likely_costs":
      return {
        title: "Construction Cost Builder",
        why: "Understanding likely construction costs before requesting quotations will help you budget realistically and compare quotations more confidently later.",
        to: "/project-builder",
        cta: "Continue to Cost Builder",
      };
    case "quotations":
      return {
        title: "AI Quote Checker",
        why: "Running your quotation through the AI Quote Checker will show you what's covered, what's missing and how it compares to typical work of this kind.",
        to: "/quote-checker",
        cta: "Continue to Quote Checker",
      };
    case "planning_permission":
      return {
        title: "Construction Cost Builder",
        why: "Capturing your project details in the Cost Builder helps you understand whether planning permission is likely to be required, before you commit to design work.",
        to: "/project-builder",
        cta: "Continue to Cost Builder",
      };
    case "choosing_builder":
      return {
        title: "AI Quote Checker",
        why: "The best way to choose a builder is to compare like-for-like quotations. The Quote Checker helps you see which quotation is genuinely strongest.",
        to: "/quote-checker",
        cta: "Continue to Quote Checker",
      };
    case "managing_project":
    case "where_to_start":
    default:
      // Fall through to stage-based
      break;
  }

  // Stage-based fallback
  switch (data.stage) {
    case "already_have_quotes":
      return {
        title: "AI Quote Checker",
        why: "You already have quotations. The AI Quote Checker will help you understand what's included, spot what's missing and compare them side by side.",
        to: "/quote-checker",
        cta: "Continue to Quote Checker",
      };
    case "ready_for_quotes":
    case "planning_approved":
    case "planning_submitted":
    case "drawings":
    case "spoken_to_someone":
    case "know_what_want":
    case "exploring":
    default:
      return {
        title: "Construction Cost Builder",
        why: "Understanding likely construction costs before requesting quotations will help you budget realistically and compare quotations more confidently later.",
        to: "/project-builder",
        cta: "Continue to Cost Builder",
      };
  }
}

// ---------------------------------------------------------------------------
// Local storage helpers
// ---------------------------------------------------------------------------

function saveLocal(id: string, token: string) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ id, token })); } catch { /* noop */ }
}
function readLocal(): { id: string; token: string } | null {
  try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}

// ---------------------------------------------------------------------------
// UI primitives
// ---------------------------------------------------------------------------

const ProgressDots = ({ step, total }: { step: number; total: number }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all ${
          i === step ? "w-8 bg-teal" : i < step ? "w-4 bg-teal/50" : "w-4 bg-navy/10"
        }`}
      />
    ))}
  </div>
);

const StepShell = ({
  title, subtitle, children, onBack, onNext, nextLabel = "Continue",
  nextDisabled, showBack = true, hideNext = false,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
  onBack?: () => void; onNext?: () => void; nextLabel?: string;
  nextDisabled?: boolean; showBack?: boolean; hideNext?: boolean;
}) => (
  <div className="animate-fade-in">
    <h1 className="font-heading text-3xl md:text-5xl text-navy tracking-wide leading-tight">{title}</h1>
    {subtitle && (
      <p className="mt-4 font-sans text-base md:text-lg text-secondary-text max-w-2xl leading-relaxed">
        {subtitle}
      </p>
    )}
    <div className="mt-10">{children}</div>
    {!hideNext && (onBack || onNext) && (
      <div className="flex items-center justify-between gap-3 mt-12">
        {showBack ? (
          <Button variant="ghost" onClick={onBack} className="font-mono text-sm text-navy/70 hover:text-navy">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
        ) : <span />}
        {onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            size="lg"
            className="bg-teal text-cream hover:bg-teal-deep font-mono px-8 rounded-xl"
          >
            {nextLabel} <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        )}
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5; // 0 welcome, 1 project, 2 stage, 3 existing, 4 concern

const ProjectClarity = () => {
  const navigate = useNavigate();
  const { recordId } = useParams();
  const { toast } = useToast();

  const [record, setRecord] = useState<ClarityRecord | null>(null);
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const [data, setData] = useState<ClarityData>({
    project_type: null,
    stage: null,
    existing: [],
    concern: null,
  });

  // ---- Load or start fresh ----
  useEffect(() => {
    (async () => {
      const local = readLocal();
      const targetId = recordId ?? local?.id;
      if (targetId) {
        const { data: row } = await supabase
          .from("project_intelligence_records")
          .select("*")
          .eq("id", targetId)
          .maybeSingle();
        if (row) {
          const bd = (row.builder_data as any) ?? {};
          const clarity = bd.clarity ?? {};
          setRecord(row as any);
          setData({
            project_type: (row.project_type as ProjectTypeId | null) ?? null,
            stage: (row.current_stage as StageId | null) ?? null,
            existing: Array.isArray(clarity.existing) ? clarity.existing : [],
            concern: clarity.concern ?? null,
          });
          if (row.status === "complete") setShowResults(true);
          else {
            // Records can arrive from other modules (e.g. Project Builder) with a
            // step number from that flow, so clamp into Clarity's own range and
            // resume at the first unanswered question.
            const clarityExisting = Array.isArray(clarity.existing) ? clarity.existing : [];
            let resume = Math.min(Math.max(0, row.current_step ?? 0), TOTAL_STEPS - 1);
            if ((row.current_step ?? 0) > TOTAL_STEPS - 1) {
              if (!row.project_type) resume = 1;
              else if (!row.current_stage) resume = 2;
              else if (clarityExisting.length === 0) resume = 3;
              else resume = 4;
            }
            setStep(resume);
          }
        }
      }
      setLoading(false);
    })();
  }, [recordId]);

  // ---- Ensure a record exists on first interaction ----
  const ensureRecord = useCallback(async (): Promise<ClarityRecord | null> => {
    if (record) return record;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: row, error } = await supabase
      .from("project_intelligence_records")
      .insert({ user_id: user?.id ?? null, current_step: 1 })
      .select()
      .single();
    if (error) {
      toast({ title: "Couldn't start", description: error.message, variant: "destructive" });
      return null;
    }
    const r = row as any as ClarityRecord;
    setRecord(r);
    saveLocal(r.id, r.edit_token);
    return r;
  }, [record, toast]);

  // ---- Autosave whenever data changes ----
  useEffect(() => {
    if (!record) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const journey = positionForStage(data.stage);
      const nxt = nextStepFor(data);
      const builder_data = {
        ...(record.builder_data ?? {}),
        clarity: {
          existing: data.existing,
          concern: data.concern,
          journey_position: journey,
          next_recommended_step: nxt.title,
        },
      };
      await supabase
        .from("project_intelligence_records")
        .update({
          project_type: data.project_type,
          current_stage: data.stage,
          builder_data,
          current_step: step,
        })
        .eq("id", record.id);
    }, 400);
  }, [data, step, record]);

  const patch = (updates: Partial<ClarityData>) => setData((d) => ({ ...d, ...updates }));

  const toggleExisting = (id: ExistingId) => {
    setData((d) => {
      let list = d.existing.slice();
      if (id === "none") {
        list = list.includes("none") ? [] : ["none"];
      } else {
        list = list.filter((x) => x !== "none");
        list = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      }
      return { ...d, existing: list };
    });
  };

  const next = async () => {
    if (step === 0) await ensureRecord();
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      // Finish → mark complete and show results
      if (record) {
        await supabase
          .from("project_intelligence_records")
          .update({ status: "complete" })
          .eq("id", record.id);
      }
      setShowResults(true);
    }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const journeyId = useMemo(() => positionForStage(data.stage), [data.stage]);
  const nxt = useMemo(() => nextStepFor(data), [data]);
  const meaning = useMemo(() => meaningFor(data.stage), [data.stage]);
  const considerations = useMemo(() => considerationsFor(data), [data]);

  const saveMyProject = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate("/dashboard");
      return;
    }
    setSavingAccount(true);
    // Route to signup, they can return via saved local record id
    navigate("/signup/homeowner");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-teal" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO
        title="Project Clarity — Understand Where Your Project Stands | ProGrafter"
        description="A simple, reassuring 2-minute journey that shows you where your construction project stands today and the single best next step to take."
        path="/project-clarity"
      />
      <div className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-5 md:px-8 pt-24 pb-20 md:pt-28">

          {/* Progress dots — only during the questions */}
          {!showResults && step > 0 && (
            <div className="mb-10 flex items-center justify-between">
              <ProgressDots step={step} total={TOTAL_STEPS} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-navy/50">
                {step} of {TOTAL_STEPS - 1}
              </span>
            </div>
          )}

          {!showResults && step === 0 && (
            <StepShell
              title="Project Clarity"
              subtitle="Let's understand where your project stands. Whether you're just starting to think about your project or already have quotations, we'll help you understand your next step."
              onNext={next}
              nextLabel="Start"
              showBack={false}
            >
              <div className="rounded-2xl bg-white border border-navy/10 p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-teal/10 p-3">
                    <Compass className="h-6 w-6 text-teal" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Estimated time</p>
                    <p className="font-heading text-xl text-navy tracking-wide mt-1">Approximately 2 minutes</p>
                  </div>
                </div>
              </div>
            </StepShell>
          )}

          {/* 1. Project type */}
          {!showResults && step === 1 && (
            <StepShell
              title="What are you planning?"
              onBack={back}
              onNext={next}
              nextDisabled={!data.project_type}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PROJECT_TYPES.map((p) => {
                  const active = data.project_type === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => patch({ project_type: p.id })}
                      className={`text-left rounded-2xl border p-5 transition-all ${
                        active
                          ? "border-teal bg-teal/5 shadow-sm"
                          : "border-navy/10 bg-white hover:border-teal/40"
                      }`}
                    >
                      <Icon className={`h-6 w-6 mb-4 ${active ? "text-teal" : "text-navy/70"}`} />
                      <span className={`block font-heading text-base tracking-wide ${active ? "text-teal" : "text-navy"}`}>
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* 2. Current stage */}
          {!showResults && step === 2 && (
            <StepShell
              title="Which best describes your project today?"
              onBack={back}
              onNext={next}
              nextDisabled={!data.stage}
            >
              <div className="grid gap-3">
                {STAGES.map((s) => {
                  const active = data.stage === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => patch({ stage: s.id })}
                      className={`text-left rounded-2xl border p-5 transition-all flex items-start justify-between gap-4 ${
                        active
                          ? "border-teal bg-teal/5 shadow-sm"
                          : "border-navy/10 bg-white hover:border-teal/40"
                      }`}
                    >
                      <div>
                        <p className={`font-heading text-lg tracking-wide ${active ? "text-teal" : "text-navy"}`}>
                          {s.label}
                        </p>
                        <p className="mt-1 font-sans text-sm text-secondary-text">{s.hint}</p>
                      </div>
                      {active && <CheckCircle2 className="h-5 w-5 text-teal shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* 3. Existing information */}
          {!showResults && step === 3 && (
            <StepShell
              title="Which of these do you already have?"
              subtitle="Tick anything that applies — or select 'None of these'."
              onBack={back}
              onNext={next}
              nextDisabled={data.existing.length === 0}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {EXISTING.map((e) => {
                  const active = data.existing.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleExisting(e.id)}
                      className={`text-left rounded-2xl border p-5 transition-all flex items-center justify-between gap-4 ${
                        active
                          ? "border-teal bg-teal/5 shadow-sm"
                          : "border-navy/10 bg-white hover:border-teal/40"
                      }`}
                    >
                      <span className={`font-heading text-base tracking-wide ${active ? "text-teal" : "text-navy"}`}>
                        {e.label}
                      </span>
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${
                        active ? "bg-teal border-teal" : "border-navy/20"
                      }`}>
                        {active && <CheckCircle2 className="h-4 w-4 text-cream" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* 4. Primary concern */}
          {!showResults && step === 4 && (
            <StepShell
              title="What would you most like help with?"
              subtitle="Choose the one thing that matters most right now."
              onBack={back}
              onNext={next}
              nextLabel="See my report"
              nextDisabled={!data.concern}
            >
              <div className="grid gap-3">
                {CONCERNS.map((c) => {
                  const active = data.concern === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => patch({ concern: c.id })}
                      className={`text-left rounded-2xl border p-5 transition-all flex items-center justify-between gap-4 ${
                        active
                          ? "border-teal bg-teal/5 shadow-sm"
                          : "border-navy/10 bg-white hover:border-teal/40"
                      }`}
                    >
                      <span className={`font-heading text-lg tracking-wide ${active ? "text-teal" : "text-navy"}`}>
                        {c.label}
                      </span>
                      {active && <CheckCircle2 className="h-5 w-5 text-teal shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* -------- RESULTS -------- */}
          {showResults && (
            <div className="animate-fade-in space-y-10">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-teal">Your Project Clarity Report</p>
                <h1 className="mt-3 font-heading text-3xl md:text-5xl text-navy tracking-wide leading-tight">
                  You're currently {currentPositionSentence(journeyId)}.
                </h1>
              </div>

              {/* Section 1 — Current Position */}
              <section className="rounded-2xl bg-white border border-navy/10 p-6 md:p-8">
                <h2 className="font-heading text-xl text-navy tracking-wide">Current position</h2>
                <p className="mt-1 font-sans text-sm text-secondary-text">Your place in the homeowner journey.</p>
                <ol className="mt-6 space-y-2">
                  {JOURNEY.map((j, i) => {
                    const activeIdx = JOURNEY.findIndex((x) => x.id === journeyId);
                    const isCurrent = j.id === journeyId;
                    const isPast = i < activeIdx;
                    return (
                      <li key={j.id} className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-mono text-xs shrink-0 ${
                          isCurrent
                            ? "bg-teal text-cream"
                            : isPast
                              ? "bg-teal/20 text-teal"
                              : "bg-navy/5 text-navy/40"
                        }`}>
                          {i + 1}
                        </div>
                        <span className={`font-heading tracking-wide ${
                          isCurrent ? "text-navy text-lg" : isPast ? "text-navy/70" : "text-navy/40"
                        }`}>
                          {j.label}
                        </span>
                        {isCurrent && (
                          <span className="ml-2 rounded-full bg-teal/10 text-teal font-mono text-[10px] uppercase tracking-widest px-2 py-0.5">
                            You are here
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>

              {/* Section 2 — What this means */}
              <section className="rounded-2xl bg-white border border-navy/10 p-6 md:p-8">
                <h2 className="font-heading text-xl text-navy tracking-wide">What this means</h2>
                <p className="mt-4 font-sans text-base text-navy/80 leading-relaxed">{meaning}</p>
              </section>

              {/* Section 3 — Things to consider */}
              <section className="rounded-2xl bg-white border border-navy/10 p-6 md:p-8">
                <h2 className="font-heading text-xl text-navy tracking-wide">Things to consider</h2>
                <p className="mt-1 font-sans text-sm text-secondary-text">
                  Gentle prompts — none of these are urgent.
                </p>
                <ul className="mt-6 space-y-3">
                  {considerations.map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-teal shrink-0" />
                      <span className="font-sans text-base text-navy/85 leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 4 — Your next step */}
              <section className="rounded-2xl bg-navy text-cream p-6 md:p-8">
                <p className="font-mono text-[10px] uppercase tracking-widest text-teal">Your next step</p>
                <h2 className="mt-3 font-heading text-3xl text-cream tracking-wide">{nxt.title}</h2>
                <p className="mt-4 font-sans text-base text-cream/85 leading-relaxed max-w-2xl">{nxt.why}</p>
                <div className="mt-6">
                  <Button
                    size="lg"
                    onClick={() => navigate(nxt.to)}
                    className="bg-teal text-cream hover:bg-teal-deep font-mono px-8 rounded-xl"
                  >
                    {nxt.cta} <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </section>

              {/* Section 5 — Save your project */}
              <section className="rounded-2xl bg-white border border-navy/10 p-6 md:p-8">
                <h2 className="font-heading text-xl text-navy tracking-wide">Save your project</h2>
                <p className="mt-3 font-sans text-base text-navy/80 leading-relaxed max-w-2xl">
                  Construction projects often take weeks or months. Create your free ProGrafter account
                  to save your progress and continue your journey whenever you're ready.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={saveMyProject}
                    disabled={savingAccount}
                    className="bg-teal text-cream hover:bg-teal-deep font-mono px-8 rounded-xl"
                  >
                    <Save className="h-4 w-4 mr-1.5" /> Save My Project
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => { setShowResults(false); setStep(0); }}
                    className="font-mono text-navy/70 hover:text-navy"
                  >
                    Start again
                  </Button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

function currentPositionSentence(id: JourneyId): string {
  switch (id) {
    case "idea": return "exploring your project idea";
    case "planning": return "planning your project";
    case "costs": return "understanding likely costs";
    case "request_quotes": return "preparing to request quotations";
    case "review_quotes": return "reviewing your quotations";
    case "compare_quotes": return "comparing quotations";
    case "appoint_builder": return "ready to appoint a builder";
    case "dashboard": return "running your project";
  }
}

export default ProjectClarity;
