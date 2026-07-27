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
// Results step — Project Clarity readiness dashboard
// ---------------------------------------------------------------------------

const STAGE_LABEL: Record<string, string> = {
  ideas: "Ideas",
  budgeting: "Budgeting",
  drawings: "Drawings in progress",
  planning_submitted: "Planning submitted",
  planning_approved: "Planning approved",
  ready_for_quotes: "Ready for quotes",
  already_have_quotes: "Has existing quotes",
};

const bandFor = (score: number) => {
  if (score >= 80) return { label: "READY FOR QUOTATIONS", tone: "green" as const };
  if (score >= 60) return { label: "NEARLY READY", tone: "green" as const };
  if (score >= 40) return { label: "TAKING SHAPE", tone: "amber" as const };
  return { label: "EARLY STAGE", tone: "blue" as const };
};

const ClarityRing = ({ value }: { value: number }) => {
  const size = 220, stroke = 14, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const color = pct >= 60 ? "#0EA5A4" : pct >= 40 ? "#D97706" : "#1E3A8A";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(15,23,42,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke}
          strokeLinecap="round" fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: "stroke-dasharray 900ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-6xl text-navy tracking-tight leading-none">{pct}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mt-2">out of 100</span>
      </div>
    </div>
  );
};

type ReadinessItem = { key: string; label: string; ready: boolean; why: string };

const buildReadiness = (r: Record): ReadinessItem[] => {
  const b = r.builder_data ?? {};
  const hasDim = !!(b.dimensions?.width && b.dimensions?.projection);
  const hasDrawings = r.documents.some((d) => d.kind === "drawings");
  const hasStructural = r.documents.some((d) => d.kind === "structural");
  const planning = r.current_stage === "planning_approved" || r.current_stage === "ready_for_quotes"
    || r.current_stage === "already_have_quotes" || b.existing?.planningApproved === "yes";
  return [
    { key: "type", label: "Project type", ready: !!r.project_type, why: "Sets the scope trades quote against." },
    { key: "property", label: "Property details", ready: !!r.property_type, why: "Detached/terraced changes access, sequencing and cost." },
    { key: "dimensions", label: "Project dimensions", ready: hasDim, why: "Width and projection let trades size structure, glazing and roof." },
    { key: "drawings", label: "Architectural drawings", ready: hasDrawings, why: "Trades quote much more accurately with a plan in front of them." },
    { key: "structural", label: "Structural information", ready: hasStructural, why: "Confirms steels, padstones and foundations for a real price." },
    { key: "planning", label: "Planning status", ready: planning, why: "Trades need to know they can build what you're asking for." },
    { key: "roof", label: "Roof specification", ready: !!b.spec?.roofType, why: "Roof type drives labour, materials and warranty." },
    { key: "wall", label: "External wall type", ready: !!b.spec?.externalWall, why: "Brick, block or timber frame changes trade mix and cost." },
    { key: "glazing", label: "Glazing selected", ready: !!(b.glazing?.bifoldDoors || b.glazing?.slidingDoors || b.glazing?.frenchDoors || b.glazing?.roofLantern || b.glazing?.windowQuality), why: "Doors and rooflights are one of the largest package costs." },
    { key: "finish", label: "Internal finish level", ready: !!b.finishLevel, why: "Shell vs turnkey can double a project cost — trades must know." },
    { key: "services", label: "Service alterations", ready: (b.services?.length ?? 0) > 0, why: "Electrics, plumbing and heating changes are often missed on quotes." },
    { key: "drainage", label: "Drainage & manholes", ready: b.existing?.drainsAffected === "yes" || b.existing?.drainsAffected === "no", why: "Builders need this to allow for underground work." },
    { key: "external", label: "External works", ready: (b.externalWorks?.length ?? 0) > 0, why: "Patios, drainage runs and landscaping are commonly excluded." },
  ];
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-navy/10 bg-white p-5">
    <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">{label}</p>
    <p className="font-heading text-lg text-navy mt-2 tracking-wide leading-snug">{value || "—"}</p>
  </div>
);

const JourneyTimeline = () => {
  const nodes = [
    { label: "Project Clarity", active: true, done: true },
    { label: "Construction Cost Builder", active: false, done: false },
    { label: "AI Quote Checker", active: false, done: false },
    { label: "Find Trusted Trades", active: false, done: false },
    { label: "Project Dashboard", active: false, done: false },
  ];
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-6 md:p-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Your ProGrafter journey</p>
      <ol className="mt-6 space-y-4">
        {nodes.map((n, i) => (
          <li key={n.label} className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs ${
                n.done ? "bg-teal text-cream" : "bg-navy/5 text-navy/50"
              }`}>{String(i + 1).padStart(2, "0")}</span>
              {i < nodes.length - 1 && <span className={`w-px h-6 mt-1 ${n.done ? "bg-teal/40" : "bg-navy/10"}`} />}
            </div>
            <span className={`font-heading text-lg tracking-wide ${n.done ? "text-navy" : "text-navy/50"}`}>{n.label}</span>
            {n.done && <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-teal">You are here</span>}
          </li>
        ))}
      </ol>
    </div>
  );
};

const ResultsStep = ({ record, onEdit, onNavigate }: {
  record: Record; onEdit: () => void; onNavigate: (path: string) => void;
}) => {
  const score = record.analysis?.readiness?.score ?? 0;
  const band = bandFor(score);
  const bandTone =
    band.tone === "green" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : band.tone === "amber" ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-navy bg-navy/5 border-navy/15";

  const readiness = buildReadiness(record);
  const ready = readiness.filter((i) => i.ready);
  const missing = readiness.filter((i) => !i.ready);

  // Construction confidence stars — from ready-item count (max 13)
  const stars = Math.max(1, Math.min(5, Math.round((ready.length / readiness.length) * 5)));
  const confidenceLabel = stars >= 4 ? "High Confidence" : stars === 3 ? "Solid Confidence" : "Building Confidence";

  // Snapshot values
  const b = record.builder_data ?? {};
  const projectLabel = PROJECT_TYPES.find((p) => p.id === record.project_type)?.label ?? "—";
  const propertyLabel = record.property_type ?? "—";
  const size = b.dimensions?.floorArea ? `${b.dimensions.floorArea} m²` : "—";
  const planningLabel = record.current_stage === "planning_approved" ? "Approved"
    : record.current_stage === "planning_submitted" ? "Submitted"
    : b.existing?.planningApproved === "yes" ? "Approved"
    : b.existing?.planningApproved === "no" ? "Not yet applied"
    : STAGE_LABEL[record.current_stage ?? ""] ?? "—";
  const docLabel = record.documents.length === 0 ? "None uploaded yet"
    : record.documents.map((d) => d.name).slice(0, 2).join(", ") + (record.documents.length > 2 ? ` +${record.documents.length - 2} more` : "");
  const budgetLabel = BUDGET_BANDS.find((x) => x.id === record.budget_band)?.label ?? "Not set";

  // Single next step
  const nextTitle: string = record.analysis?.next_action?.title
    ?? (missing.length === 0 ? "Project Ready" : `Add ${missing[0].label.toLowerCase()}`);
  const nextDetail: string = record.analysis?.next_action?.detail
    ?? (missing.length === 0 ? "Continue to the Construction Cost Builder to price your project." : missing[0].why);
  const nextHref = missing.length === 0 ? "/project-builder" : "/project-builder";

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-teal">Project Clarity</p>
        <h1 className="font-heading text-4xl md:text-5xl text-navy tracking-wide mt-2">Project Clarity</h1>
        <p className="mt-3 font-sans text-secondary-text max-w-2xl leading-relaxed">
          Know exactly where your project stands before speaking to builders.
        </p>
      </div>

      {/* Primary card — Construction Readiness Score */}
      <section className="rounded-3xl border border-navy/10 bg-white p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <ClarityRing value={score} />
          <div className="flex-1 text-center md:text-left">
            <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Construction Readiness Score</p>
            <p className={`inline-block mt-3 rounded-full border px-4 py-1.5 font-mono text-xs tracking-widest ${bandTone}`}>
              {band.label}
            </p>
            <p className="mt-5 font-sans text-navy/70 max-w-md leading-relaxed">
              A live measure of how ready your project is to receive accurate quotations from trades.
            </p>
          </div>
        </div>

        {/* Legend — no red */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            { dot: "bg-emerald-500", title: "Green", sub: "Information Complete" },
            { dot: "bg-amber-500", title: "Amber", sub: "Needs Attention" },
            { dot: "bg-sky-500", title: "Blue", sub: "Helpful Extras" },
            { dot: "bg-navy/40", title: "Grey", sub: "Future Improvements" },
          ].map((l) => (
            <div key={l.title} className="flex items-center gap-3 rounded-xl border border-navy/10 bg-cream/60 px-4 py-3">
              <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} />
              <div>
                <p className="font-heading text-sm text-navy tracking-wide">{l.title}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">{l.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2 — Project Snapshot */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Section 02</p>
        <h2 className="font-heading text-2xl md:text-3xl text-navy tracking-wide mt-1">Project Snapshot</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <StatCard label="Project" value={projectLabel} />
          <StatCard label="Property" value={propertyLabel} />
          <StatCard label="Project size" value={size} />
          <StatCard label="Planning" value={planningLabel} />
          <StatCard label="Documents" value={docLabel} />
          <StatCard label="Budget" value={budgetLabel} />
        </div>
      </section>

      {/* Section 3 — Construction Confidence */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Section 03</p>
        <h2 className="font-heading text-2xl md:text-3xl text-navy tracking-wide mt-1">Construction Confidence</h2>
        <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex gap-1" aria-label={`${stars} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-2xl leading-none ${i < stars ? "text-teal" : "text-navy/15"}`}>★</span>
              ))}
            </div>
            <p className="font-heading text-xl text-navy tracking-wide">{confidenceLabel}</p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mb-3">Based on</p>
              <ul className="space-y-2">
                {ready.slice(0, 8).map((i) => (
                  <li key={i.key} className="flex items-start gap-2 font-sans text-sm text-navy/80">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    {i.label}
                  </li>
                ))}
                {ready.length === 0 && <li className="font-sans text-sm text-navy/50">Nothing captured yet.</li>}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mb-3">Missing</p>
              <ul className="space-y-2">
                {missing.slice(0, 8).map((i) => (
                  <li key={i.key} className="flex items-start gap-2 font-sans text-sm text-navy/70">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-navy/30 shrink-0" />
                    {i.label}
                  </li>
                ))}
                {missing.length === 0 && <li className="font-sans text-sm text-navy/50">Nothing missing.</li>}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Quote Readiness (centrepiece) */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Section 04</p>
        <h2 className="font-heading text-2xl md:text-3xl text-navy tracking-wide mt-1">Quote Readiness</h2>
        <p className="mt-2 font-sans text-navy/60">Everything trades need in order to price your project accurately.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-700">Ready</p>
            <ul className="mt-4 space-y-2.5">
              {ready.map((i) => (
                <li key={i.key} className="flex items-start gap-2.5 font-sans text-sm text-navy">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  {i.label}
                </li>
              ))}
              {ready.length === 0 && <li className="font-sans text-sm text-navy/50">Nothing yet — start with a project type.</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-700">Needs adding</p>
            <ul className="mt-4 space-y-4">
              {missing.map((i) => (
                <li key={i.key}>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-2 w-2 rounded-full border border-amber-500 shrink-0" />
                    <div>
                      <p className="font-heading text-base text-navy tracking-wide">{i.label}</p>
                      <p className="font-sans text-xs text-navy/60 mt-0.5 leading-relaxed">{i.why}</p>
                    </div>
                  </div>
                </li>
              ))}
              {missing.length === 0 && (
                <li className="font-sans text-sm text-navy/60">All essentials captured. You're ready to compare quotes.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 5 — Recommended Next Step (only one) */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Section 05</p>
        <h2 className="font-heading text-2xl md:text-3xl text-navy tracking-wide mt-1">Recommended Next Step</h2>
        <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="font-heading text-2xl text-navy tracking-wide">{nextTitle}</p>
            <p className="mt-2 font-sans text-navy/70 leading-relaxed max-w-xl">{nextDetail}</p>
          </div>
          <Button
            size="lg"
            onClick={() => onNavigate(nextHref)}
            className="bg-teal text-cream hover:bg-teal-deep font-mono rounded-xl h-14 px-8 shrink-0"
          >
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 hover:bg-navy/10 text-navy px-4 py-2 font-mono text-xs transition"
          >
            <Pencil className="h-3 w-3" /> Edit answers
          </button>
          <button
            onClick={() => onNavigate("/signup/homeowner")}
            className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 hover:bg-navy/10 text-navy px-4 py-2 font-mono text-xs transition"
          >
            <Save className="h-3 w-3" /> Save project
          </button>
        </div>
      </section>

      {/* Journey timeline */}
      <JourneyTimeline />
    </div>
  );
};

export default ProjectClarity;
