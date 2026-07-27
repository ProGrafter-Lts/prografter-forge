import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import {
  ArrowLeft, ArrowRight, Sparkles, Home, MapPin, Layers, FileText,
  Upload, Mic, MicOff, PoundSterling, CheckCircle2, Loader2, X, Pencil,
  Camera, ShieldCheck, Target, Compass, Wrench, Save, Search,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Address = { line1?: string; town?: string; postcode?: string };
type DocKind = "drawings" | "structural" | "quotes" | "images";
type DocItem = { path: string; name: string; size: number; kind: DocKind };

type Record = {
  id: string;
  edit_token: string;
  status: "draft" | "analysing" | "complete";
  current_step: number;
  project_type: string | null;
  address: Address | null;
  property_type: string | null;
  property_age: string | null;
  current_stage: string | null;
  description: string | null;
  budget_band: string | null;
  documents: DocItem[];
  analysis: any | null;
  builder_data?: any | null;
  construction_confidence?: number | null;
};

const PROJECT_TYPES = [
  { id: "rear_extension", label: "Rear Extension", icon: Home },
  { id: "side_extension", label: "Side Extension", icon: Home },
  { id: "double_storey_extension", label: "Double Storey Extension", icon: Layers },
  { id: "loft_conversion", label: "Loft Conversion", icon: Layers },
  { id: "garage_conversion", label: "Garage Conversion", icon: Home },
  { id: "renovation", label: "Renovation", icon: Wrench },
  { id: "new_build", label: "New Build", icon: Home },
  { id: "landscaping", label: "Landscaping", icon: Compass },
  { id: "kitchen", label: "Kitchen", icon: Wrench },
  { id: "bathroom", label: "Bathroom", icon: Wrench },
  { id: "other", label: "Other", icon: Target },
] as const;

const PROPERTY_TYPES = [
  "Detached", "Semi-detached", "Terraced", "End of terrace",
  "Flat / Apartment", "Bungalow", "Other",
];

const PROPERTY_AGES = [
  "Pre-1919", "1920–1944", "1945–1979", "1980–2000", "Post-2000", "New build", "Not sure",
];

const STAGES = [
  { id: "ideas", label: "Ideas" },
  { id: "budgeting", label: "Budgeting" },
  { id: "drawings", label: "Drawings" },
  { id: "planning_submitted", label: "Planning Submitted" },
  { id: "planning_approved", label: "Planning Approved" },
  { id: "ready_for_quotes", label: "Ready for Quotes" },
  { id: "already_have_quotes", label: "Already Have Quotes" },
] as const;

const BUDGET_BANDS = [
  { id: "under_25k", label: "Under £25k" },
  { id: "25_50k", label: "£25k – £50k" },
  { id: "50_100k", label: "£50k – £100k" },
  { id: "over_100k", label: "£100k+" },
  { id: "not_sure", label: "Not sure" },
] as const;

const DOC_KINDS: { id: DocKind; label: string; hint: string }[] = [
  { id: "drawings", label: "Drawings", hint: "Architectural plans, floorplans" },
  { id: "structural", label: "Structural", hint: "Calculations, engineer's reports" },
  { id: "quotes", label: "Existing quotes", hint: "Anything you've been quoted so far" },
  { id: "images", label: "Images", hint: "Photos of the site or inspiration" },
];

const STEPS = [
  "Welcome", "Project", "Property", "Stage", "Documents",
  "Description", "Budget", "Review", "Analysing", "Results",
];

const LS_KEY = "prografter.project-clarity.record";

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function saveLocal(id: string, token: string) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ id, token })); } catch { /* noop */ }
}
function readLocal(): { id: string; token: string } | null {
  try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

const ProgressBar = ({ step, total }: { step: number; total: number }) => (
  <div className="w-full">
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i < step ? "bg-teal" : i === step ? "bg-teal/60" : "bg-navy/10"
          }`}
        />
      ))}
    </div>
    <div className="flex justify-between mt-2 font-mono text-[10px] uppercase tracking-widest text-navy/50">
      <span>Step {Math.min(step + 1, total)} of {total}</span>
      <span>{STEPS[step]}</span>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Step shell
// ---------------------------------------------------------------------------

const StepShell = ({
  eyebrow, title, subtitle, children, onBack, onNext, nextLabel = "Continue",
  nextDisabled, showBack = true, hideNext = false,
}: {
  eyebrow?: string; title: string; subtitle?: string; children: React.ReactNode;
  onBack?: () => void; onNext?: () => void; nextLabel?: string;
  nextDisabled?: boolean; showBack?: boolean; hideNext?: boolean;
}) => (
  <div className="animate-fade-in">
    {eyebrow && (
      <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 mb-4">
        <Sparkles className="h-3.5 w-3.5 text-teal" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-teal">{eyebrow}</span>
      </div>
    )}
    <h1 className="font-heading text-3xl md:text-5xl text-navy tracking-wide leading-tight">{title}</h1>
    {subtitle && <p className="mt-3 font-sans text-base md:text-lg text-secondary-text max-w-2xl leading-relaxed">{subtitle}</p>}
    <div className="mt-10">{children}</div>
    {(onBack || onNext) && !hideNext && (
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
// Voice recorder (uses atlas-transcribe endpoint)
// ---------------------------------------------------------------------------

function useVoiceInput(onText: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: mime });
          const fd = new FormData();
          fd.append("file", blob, mime.includes("mp4") ? "recording.m4a" : "recording.webm");
          const { data, error } = await supabase.functions.invoke("atlas-transcribe", { body: fd });
          if (error) throw error;
          if (data?.text) onText(data.text as string);
        } finally {
          setBusy(false);
          streamRef.current?.getTracks().forEach((t) => t.stop());
        }
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch (err) {
      console.error(err);
    }
  };
  const stop = () => { mediaRef.current?.stop(); setRecording(false); };
  return { recording, busy, start, stop };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ProjectClarity = () => {
  const navigate = useNavigate();
  const { recordId } = useParams();
  const { toast } = useToast();

  const [record, setRecord] = useState<Record | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<number | null>(null);

  // ---- Load or create record ---------------------------------------------
  useEffect(() => {
    (async () => {
      const local = readLocal();
      const targetId = recordId ?? local?.id;
      if (targetId) {
        const { data } = await supabase
          .from("project_intelligence_records")
          .select("*")
          .eq("id", targetId)
          .maybeSingle();
        if (data) {
          setRecord({ ...data, documents: (data.documents as any) ?? [] } as Record);
          setStep(data.status === "complete" ? 9 : Math.max(0, data.current_step ?? 0));
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    })();
  }, [recordId]);

  // ---- Create-on-first-interaction ---------------------------------------
  const ensureRecord = useCallback(async (): Promise<Record | null> => {
    if (record) return record;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("project_intelligence_records")
      .insert({ user_id: user?.id ?? null, current_step: 1 })
      .select()
      .single();
    if (error) { toast({ title: "Couldn't start", description: error.message, variant: "destructive" }); return null; }
    const r = { ...data, documents: [] } as Record;
    setRecord(r);
    saveLocal(r.id, r.edit_token);
    return r;
  }, [record, toast]);

  // ---- Autosave patch -----------------------------------------------------
  const patch = useCallback((updates: Partial<Record>) => {
    setRecord((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates } as Record;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        await supabase
          .from("project_intelligence_records")
          .update({
            project_type: next.project_type,
            address: next.address,
            property_type: next.property_type,
            property_age: next.property_age,
            current_stage: next.current_stage,
            description: next.description,
            budget_band: next.budget_band,
            documents: next.documents as any,
            current_step: step,
          })
          .eq("id", next.id);
      }, 400);
      return next;
    });
  }, [step]);

  const goto = (s: number) => setStep(Math.max(0, Math.min(9, s)));
  const next = async () => {
    if (step === 0) { await ensureRecord(); }
    goto(step + 1);
  };
  const back = () => goto(step - 1);

  // ---- Analyse ------------------------------------------------------------
  const runAnalysis = async () => {
    if (!record) return;
    goto(8);
    try {
      const { data, error } = await supabase.functions.invoke("analyse-project-clarity", {
        body: { record_id: record.id },
      });
      if (error) throw error;
      setRecord({ ...record, analysis: data?.analysis, status: "complete" });
      setTimeout(() => goto(9), 800);
    } catch (err) {
      console.error(err);
      toast({ title: "Analysis failed", description: "Please try again in a moment.", variant: "destructive" });
      goto(7);
    }
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
        title="Project Clarity — Understand Your Project Before You Get Quotes | ProGrafter"
        description="A guided 60-second discovery journey that captures your project details, identifies what's missing and recommends the next step before you invite trades."
        path="/project-clarity"
      />
      <div className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-5 md:px-8 pt-24 pb-20 md:pt-28">
          {step > 0 && step < 9 && (
            <div className="mb-12"><ProgressBar step={step} total={STEPS.length} /></div>
          )}

          {/* 0. Welcome */}
          {step === 0 && (
            <StepShell
              eyebrow="Project Clarity"
              title="Let's understand your project."
              subtitle="We'll guide you through a few simple questions to understand your project, identify anything that may be missing, and recommend the next steps."
              onNext={next}
              nextLabel="Start Project Clarity"
              showBack={false}
            >
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: Compass, text: "Discover exactly where your project stands." },
                  { icon: ShieldCheck, text: "Spot gaps before you talk to trades." },
                  { icon: Target, text: "Get one clear next step to move forward." },
                ].map((f, i) => (
                  <div key={i} className="rounded-2xl border border-navy/10 bg-white/60 p-5">
                    <f.icon className="h-5 w-5 text-teal mb-3" />
                    <p className="font-sans text-sm text-navy/80 leading-relaxed">{f.text}</p>
                  </div>
                ))}
              </div>
            </StepShell>
          )}

          {/* 1. Project Type */}
          {step === 1 && record && (
            <StepShell
              title="What are you building?"
              subtitle="Pick the closest match — you can refine details later."
              onBack={back}
              onNext={next}
              nextDisabled={!record.project_type}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PROJECT_TYPES.map((p) => {
                  const active = record.project_type === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => patch({ project_type: p.id })}
                      className={`group text-left rounded-2xl border p-5 transition-all ${
                        active
                          ? "border-teal bg-teal/5 shadow-lg shadow-teal/10 -translate-y-0.5"
                          : "border-navy/10 bg-white/60 hover:border-teal/40 hover:-translate-y-0.5"
                      }`}
                    >
                      <p.icon className={`h-6 w-6 mb-4 ${active ? "text-teal" : "text-navy/70"}`} />
                      <span className={`font-heading text-lg tracking-wide ${active ? "text-teal" : "text-navy"}`}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* 2. Property */}
          {step === 2 && record && (
            <StepShell
              title="Tell us about the property."
              subtitle="A rough postcode is enough — full address is optional."
              onBack={back}
              onNext={next}
              nextDisabled={!record.address?.postcode && !record.property_type}
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-navy/60">Address line</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
                      <Input
                        value={record.address?.line1 ?? ""}
                        onChange={(e) => patch({ address: { ...(record.address ?? {}), line1: e.target.value } })}
                        placeholder="e.g. 24 Elm Grove"
                        className="pl-10 h-12 font-sans bg-white/70 border-navy/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-navy/60">Town</Label>
                    <Input
                      value={record.address?.town ?? ""}
                      onChange={(e) => patch({ address: { ...(record.address ?? {}), town: e.target.value } })}
                      className="h-12 font-sans bg-white/70 border-navy/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-navy/60">Postcode</Label>
                    <Input
                      value={record.address?.postcode ?? ""}
                      onChange={(e) => patch({ address: { ...(record.address ?? {}), postcode: e.target.value.toUpperCase() } })}
                      placeholder="SW1A 1AA"
                      className="h-12 font-sans bg-white/70 border-navy/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest text-navy/60">Property type</Label>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map((t) => {
                      const active = record.property_type === t;
                      return (
                        <button
                          key={t}
                          onClick={() => patch({ property_type: t })}
                          className={`px-4 py-2 rounded-full font-sans text-sm transition ${
                            active ? "bg-teal text-cream" : "bg-white/70 text-navy border border-navy/10 hover:border-teal/40"
                          }`}
                        >{t}</button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest text-navy/60">Approximate age</Label>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_AGES.map((a) => {
                      const active = record.property_age === a;
                      return (
                        <button
                          key={a}
                          onClick={() => patch({ property_age: a })}
                          className={`px-4 py-2 rounded-full font-sans text-sm transition ${
                            active ? "bg-teal text-cream" : "bg-white/70 text-navy border border-navy/10 hover:border-teal/40"
                          }`}
                        >{a}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </StepShell>
          )}

          {/* 3. Stage */}
          {step === 3 && record && (
            <StepShell
              title="Where are you in the journey?"
              subtitle="This helps us understand what you already have and what's next."
              onBack={back}
              onNext={next}
              nextDisabled={!record.current_stage}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {STAGES.map((s, i) => {
                  const active = record.current_stage === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => patch({ current_stage: s.id })}
                      className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
                        active
                          ? "border-teal bg-teal/5 shadow-lg shadow-teal/10"
                          : "border-navy/10 bg-white/60 hover:border-teal/40"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                        active ? "bg-teal text-cream" : "bg-navy/5 text-navy/60"
                      }`}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={`font-heading text-lg tracking-wide ${active ? "text-teal" : "text-navy"}`}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* 4. Documents */}
          {step === 4 && record && (
            <DocumentsStep
              record={record}
              onPatch={patch}
              onBack={back}
              onNext={next}
            />
          )}

          {/* 5. Description */}
          {step === 5 && record && (
            <DescriptionStep
              record={record}
              onPatch={patch}
              onBack={back}
              onNext={next}
            />
          )}

          {/* 6. Budget */}
          {step === 6 && record && (
            <StepShell
              title="What's your budget expectation?"
              subtitle="A rough range is fine. We'll benchmark it against typical costs."
              onBack={back}
              onNext={next}
              nextDisabled={!record.budget_band}
            >
              <div className="space-y-3">
                {BUDGET_BANDS.map((b) => {
                  const active = record.budget_band === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => patch({ budget_band: b.id })}
                      className={`w-full flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
                        active
                          ? "border-teal bg-teal/5 shadow-lg shadow-teal/10"
                          : "border-navy/10 bg-white/60 hover:border-teal/40"
                      }`}
                    >
                      <PoundSterling className={`h-5 w-5 ${active ? "text-teal" : "text-navy/50"}`} />
                      <span className={`font-heading text-xl tracking-wide ${active ? "text-teal" : "text-navy"}`}>{b.label}</span>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* 7. Review */}
          {step === 7 && record && (
            <ReviewStep record={record} onBack={back} onAnalyse={runAnalysis} onEdit={goto} />
          )}

          {/* 8. Analysing */}
          {step === 8 && <AnalysingStep />}

          {/* 9. Results */}
          {step === 9 && record && (
            <ResultsStep record={record} onEdit={() => goto(7)} onNavigate={navigate} />
          )}
        </div>
      </div>
    </AppShell>
  );
};

// ---------------------------------------------------------------------------
// Documents step (uploads)
// ---------------------------------------------------------------------------

const DocumentsStep = ({ record, onPatch, onBack, onNext }: {
  record: Record; onPatch: (p: Partial<Record>) => void; onBack: () => void; onNext: () => void;
}) => {
  const { toast } = useToast();
  const [uploadingKind, setUploadingKind] = useState<DocKind | null>(null);

  const upload = async (files: FileList, kind: DocKind) => {
    setUploadingKind(kind);
    const added: DocItem[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) {
        toast({ title: `${file.name} is too large`, description: "Max 25MB per file.", variant: "destructive" });
        continue;
      }
      const path = `${record.id}/${kind}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("project-clarity").upload(path, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        continue;
      }
      added.push({ path, name: file.name, size: file.size, kind });
    }
    onPatch({ documents: [...record.documents, ...added] });
    setUploadingKind(null);
  };

  const remove = async (path: string) => {
    await supabase.storage.from("project-clarity").remove([path]);
    onPatch({ documents: record.documents.filter((d) => d.path !== path) });
  };

  return (
    <StepShell
      title="Share what you already have."
      subtitle="Optional — but drawings and quotes make everything sharper. Skip anything you don't have yet."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Continue"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {DOC_KINDS.map((kind) => {
          const items = record.documents.filter((d) => d.kind === kind.id);
          const busy = uploadingKind === kind.id;
          return (
            <div key={kind.id} className="rounded-2xl border border-navy/10 bg-white/60 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-heading text-lg text-navy tracking-wide">{kind.label}</p>
                  <p className="font-sans text-xs text-navy/50 mt-0.5">{kind.hint}</p>
                </div>
                {kind.id === "images" ? <Camera className="h-5 w-5 text-teal/60" /> : <FileText className="h-5 w-5 text-teal/60" />}
              </div>
              <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition ${
                busy ? "border-teal/40 bg-teal/5" : "border-navy/15 hover:border-teal/40 hover:bg-teal/5"
              }`}>
                <input
                  type="file" multiple hidden
                  onChange={(e) => e.target.files && upload(e.target.files, kind.id)}
                />
                {busy ? (
                  <Loader2 className="h-5 w-5 text-teal animate-spin" />
                ) : (
                  <Upload className="h-5 w-5 text-teal" />
                )}
                <span className="font-mono text-xs text-navy/60">{busy ? "Uploading…" : "Click or drop files"}</span>
              </label>
              {items.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {items.map((d) => (
                    <li key={d.path} className="flex items-center justify-between gap-2 rounded-lg bg-navy/5 px-3 py-2">
                      <span className="font-mono text-xs text-navy/80 truncate">{d.name}</span>
                      <button onClick={() => remove(d.path)} className="text-navy/40 hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </StepShell>
  );
};

// ---------------------------------------------------------------------------
// Description step (with voice)
// ---------------------------------------------------------------------------

const DescriptionStep = ({ record, onPatch, onBack, onNext }: {
  record: Record; onPatch: (p: Partial<Record>) => void; onBack: () => void; onNext: () => void;
}) => {
  const voice = useVoiceInput((text) => {
    onPatch({ description: (record.description ? record.description + " " : "") + text });
  });
  return (
    <StepShell
      title="Tell us what you're hoping to achieve."
      subtitle="A few sentences is plenty — think about how you want to use the space, and what matters most."
      onBack={onBack}
      onNext={onNext}
    >
      <div className="rounded-2xl border border-navy/10 bg-white/70 p-2">
        <Textarea
          value={record.description ?? ""}
          onChange={(e) => onPatch({ description: e.target.value })}
          rows={8}
          placeholder="e.g. We want to open up the back of the house into the garden with a kitchen-diner and a lot more natural light…"
          className="border-0 bg-transparent font-sans text-base leading-relaxed focus-visible:ring-0 resize-none"
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
            {(record.description ?? "").length} chars
          </span>
          <button
            onClick={voice.recording ? voice.stop : voice.start}
            disabled={voice.busy}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs transition ${
              voice.recording ? "bg-destructive text-cream animate-pulse"
              : voice.busy ? "bg-navy/10 text-navy/50"
              : "bg-teal/10 text-teal hover:bg-teal/20"
            }`}
          >
            {voice.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : voice.recording ? <MicOff className="h-3.5 w-3.5" />
              : <Mic className="h-3.5 w-3.5" />}
            {voice.busy ? "Transcribing…" : voice.recording ? "Stop" : "Voice input"}
          </button>
        </div>
      </div>
    </StepShell>
  );
};

// ---------------------------------------------------------------------------
// Review step
// ---------------------------------------------------------------------------

const summaryLine = (record: Record, key: string) => {
  switch (key) {
    case "project_type": return PROJECT_TYPES.find((p) => p.id === record.project_type)?.label ?? "—";
    case "address": {
      const a = record.address; if (!a) return "—";
      return [a.line1, a.town, a.postcode].filter(Boolean).join(", ") || "—";
    }
    case "property": return [record.property_type, record.property_age].filter(Boolean).join(" · ") || "—";
    case "stage": return STAGES.find((s) => s.id === record.current_stage)?.label ?? "—";
    case "documents": return record.documents.length ? `${record.documents.length} file(s) shared` : "None uploaded";
    case "description": return record.description ? `"${record.description.slice(0, 120)}${record.description.length > 120 ? "…" : ""}"` : "—";
    case "budget": return BUDGET_BANDS.find((b) => b.id === record.budget_band)?.label ?? "—";
    default: return "";
  }
};

const ReviewStep = ({ record, onBack, onAnalyse, onEdit }: {
  record: Record; onBack: () => void; onAnalyse: () => void; onEdit: (step: number) => void;
}) => {
  const rows = [
    { label: "Project type", key: "project_type", step: 1 },
    { label: "Property", key: "address", step: 2 },
    { label: "Property details", key: "property", step: 2 },
    { label: "Current stage", key: "stage", step: 3 },
    { label: "Documents", key: "documents", step: 4 },
    { label: "Description", key: "description", step: 5 },
    { label: "Budget", key: "budget", step: 6 },
  ];
  return (
    <StepShell
      title="Ready to analyse."
      subtitle="Check everything's right — tap edit on any section to jump back."
      onBack={onBack}
      onNext={onAnalyse}
      nextLabel="Analyse My Project"
    >
      <div className="rounded-2xl border border-navy/10 bg-white/70 divide-y divide-navy/5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">{r.label}</p>
              <p className="font-sans text-navy mt-1 truncate">{summaryLine(record, r.key)}</p>
            </div>
            <button
              onClick={() => onEdit(r.step)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-navy/5 hover:bg-teal/10 text-navy hover:text-teal px-3 py-1.5 font-mono text-xs transition"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
        ))}
      </div>
    </StepShell>
  );
};

// ---------------------------------------------------------------------------
// Analysing step
// ---------------------------------------------------------------------------

const ANALYSING_STATUSES = [
  "Reading your project details…",
  "Cross-checking against typical scope…",
  "Assessing readiness for quotes…",
  "Benchmarking your budget…",
  "Preparing your next best action…",
];

const AnalysingStep = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ANALYSING_STATUSES.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-2 border-teal/20 animate-pulse" />
        <div className="absolute inset-0 h-24 w-24 rounded-full border-t-2 border-teal animate-spin" />
        <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-teal" />
      </div>
      <p className="mt-8 font-heading text-2xl text-navy tracking-wide">Analysing your project</p>
      <p className="mt-3 font-mono text-sm text-navy/60 transition-opacity duration-300">
        {ANALYSING_STATUSES[i]}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Results step
// ---------------------------------------------------------------------------

const ResultsStep = ({ record, onEdit, onNavigate }: {
  record: Record; onEdit: () => void; onNavigate: (path: string) => void;
}) => {
  const a = record.analysis ?? {};
  const score = a.readiness?.score ?? 0;
  const scoreTone = score >= 70 ? "teal" : score >= 40 ? "amber" : "navy";
  const toneClasses =
    scoreTone === "teal" ? "text-teal border-teal/30 bg-teal/5"
    : scoreTone === "amber" ? "text-amber-600 border-amber-400/40 bg-amber-50"
    : "text-navy border-navy/20 bg-navy/5";

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 mb-4">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-teal">Analysis complete</span>
        </div>
        <h1 className="font-heading text-3xl md:text-5xl text-navy tracking-wide">Your project intelligence.</h1>
        <p className="mt-3 font-sans text-secondary-text max-w-2xl">
          A live snapshot of where your project stands. Everything is saved — you can edit any answer and re-analyse.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl border-2 p-6 ${toneClasses}`}>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Readiness Score</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-heading text-6xl tracking-tight">{score}</span>
            <span className="font-mono text-sm opacity-60">/100</span>
          </div>
          <p className="font-heading text-lg mt-1 tracking-wide">{a.readiness?.label ?? "—"}</p>
          {a.readiness?.reasons?.length > 0 && (
            <ul className="mt-4 space-y-1">
              {a.readiness.reasons.slice(0, 4).map((r: string) => (
                <li key={r} className="flex items-start gap-2 font-sans text-xs opacity-80">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" /> {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border-2 border-navy/10 bg-white/70 p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Budget Guidance</p>
          <p className="font-heading text-xl text-navy mt-2 tracking-wide leading-snug">{a.budget?.headline ?? "—"}</p>
          {a.budget?.detail && <p className="font-sans text-sm text-navy/70 mt-3 leading-relaxed">{a.budget.detail}</p>}
        </div>

        <div className="rounded-2xl border-2 border-navy/10 bg-white/70 p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Project Status</p>
          <p className="font-heading text-xl text-navy mt-2 tracking-wide capitalize">{a.status?.stage_label ?? "—"}</p>
          <p className="font-sans text-sm text-navy/70 mt-3 leading-relaxed">{a.status?.summary ?? ""}</p>
        </div>

        <div className="rounded-2xl border-2 border-teal/30 bg-teal/5 p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-teal/80">Recommended Next Action</p>
          <p className="font-heading text-xl text-teal mt-2 tracking-wide leading-snug">{a.next_action?.title ?? "—"}</p>
          <p className="font-sans text-sm text-navy/80 mt-3 leading-relaxed">{a.next_action?.detail ?? ""}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          size="lg"
          onClick={() => onNavigate("/quote-checker")}
          className="bg-teal text-cream hover:bg-teal-deep font-mono rounded-xl h-14"
        >
          <ShieldCheck className="h-4 w-4 mr-2" /> Run AI Quote Checker
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => onNavigate("/post-job-brief")}
          className="border-navy/20 text-navy hover:bg-navy hover:text-cream font-mono rounded-xl h-14"
        >
          <Search className="h-4 w-4 mr-2" /> Find Trades
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onEdit}
          className="border-navy/20 text-navy hover:bg-navy/5 font-mono rounded-xl h-14"
        >
          <Pencil className="h-4 w-4 mr-2" /> Edit Answers
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => onNavigate("/signup/homeowner")}
          className="border-navy/20 text-navy hover:bg-navy/5 font-mono rounded-xl h-14"
        >
          <Save className="h-4 w-4 mr-2" /> Save Project
        </Button>
      </div>
    </div>
  );
};

export default ProjectClarity;
