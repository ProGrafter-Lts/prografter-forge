import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BuilderData,
  CONSTRAINT_OPTIONS,
  EXTERNAL_WORKS_OPTIONS,
  FINISH_LEVELS,
  PROJECT_TYPES,
  PROPERTY_TYPES,
  SERVICE_OPTIONS,
  TriState,
  calculateConstructionConfidence,
  computeFloorArea,
} from "@/lib/projectBuilder";

/* ---------- Reusable primitives (exported for other modules) ---------- */

export function BuilderShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  confidence,
}: {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  confidence: number;
}) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div className="min-h-screen bg-cream">
      {/* Sticky top progress bar */}
      <div className="sticky top-0 z-20 bg-cream/90 backdrop-blur border-b border-navy/10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-navy/60 mb-1.5">
              <span>Step {step} of {totalSteps}</span>
              <span>Confidence {confidence}%</span>
            </div>
            <div className="h-1.5 bg-navy/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-10 pb-32">
        <div className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl text-navy tracking-tight">{title}</h1>
          {subtitle && <p className="mt-3 text-secondary-text text-base md:text-lg">{subtitle}</p>}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </div>

      {/* Sticky footer nav */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-cream/95 backdrop-blur border-t border-navy/10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={!onBack}
            className="text-navy hover:bg-navy/5"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={onNext}
            disabled={nextDisabled || !onNext}
            className="bg-teal hover:bg-teal-deep text-white px-6 h-11"
          >
            {nextLabel} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ChoiceGrid<T extends string>({
  options,
  value,
  onSelect,
  columns = 2,
}: {
  options: readonly T[];
  value?: string;
  onSelect: (v: T) => void;
  columns?: 1 | 2 | 3;
}) {
  const gridCls = columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
  return (
    <div className={`grid ${gridCls} gap-3`}>
      {options.map((o) => {
        const selected = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onSelect(o)}
            className={`group relative text-left p-5 rounded-xl border-2 transition-all duration-200
              ${selected
                ? "border-teal bg-white shadow-[0_4px_20px_-8px_rgba(20,168,161,0.4)]"
                : "border-navy/10 bg-white/60 hover:border-navy/30 hover:bg-white"}`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium ${selected ? "text-navy" : "text-body-text"}`}>{o}</span>
              {selected && (
                <div className="h-6 w-6 rounded-full bg-teal grid place-items-center">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ChipMultiSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) => {
    if (value.includes(o)) onChange(value.filter((v) => v !== o));
    else onChange([...value, o]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all
              ${on
                ? "bg-navy text-white border-navy"
                : "bg-white text-navy border-navy/20 hover:border-navy/50"}`}
          >
            {on && <Check className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" strokeWidth={3} />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function TriToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: TriState;
  onChange: (v: TriState) => void;
}) {
  const opts: { v: TriState; label: string }[] = [
    { v: "yes", label: "Yes" },
    { v: "no", label: "No" },
    { v: "unknown", label: "Unknown" },
  ];
  return (
    <div className="p-5 rounded-xl bg-white border border-navy/10">
      <div className="text-navy font-medium mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => {
          const selected = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all
                ${selected
                  ? "border-teal bg-teal/5 text-navy"
                  : "border-navy/10 bg-white text-secondary-text hover:border-navy/30"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */

const TOTAL_STEPS = 11; // 10 sections + summary

export default function ProjectBuilder() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const ANON_DRAFT_KEY = "progrfater:project-builder:anon-draft";
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BuilderData>({});
  const [recordId, setRecordId] = useState<string | null>(routeId ?? null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const confidence = useMemo(() => calculateConstructionConfidence(data), [data]);

  // Boot: get user, load record if provided
  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      setUserId(sess.session?.user?.id ?? null);

      if (routeId) {
        const { data: row } = await supabase
          .from("project_intelligence_records")
          .select("*")
          .eq("id", routeId)
          .maybeSingle();
        if (row) {
          const bd = (row as any).builder_data ?? {};
          setData(bd);
          setStep((row as any).current_step && (row as any).current_step > 0 ? (row as any).current_step : 1);
        }
      } else {
        // Look for the newest in-progress builder for this user
        if (sess.session?.user?.id) {
          const { data: row } = await supabase
            .from("project_intelligence_records")
            .select("*")
            .eq("user_id", sess.session.user.id)
            .eq("status", "builder_draft")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (row) {
            setRecordId((row as any).id);
            setData((row as any).builder_data ?? {});
            setStep((row as any).current_step ?? 1);
          }
        }
      }
      setLoading(false);
    })();
  }, [routeId]);

  // Debounced autosave
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (loading) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persist();
    }, 700);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, step]);

  async function persist(opts: { silent?: boolean } = {}) {
    if (!userId) {
      // Anonymous visitors: keep the draft locally so nothing is lost on refresh.
      try {
        localStorage.setItem(ANON_DRAFT_KEY, JSON.stringify({ data, step }));
      } catch (e) {
        console.error("[project-builder] local draft save failed", e);
      }
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        status: "builder_draft" as const,
        current_step: step,
        project_type: data.projectType ?? null,
        address: data.address ?? {},
        property_type: data.propertyType ?? null,
        property_age: data.propertyAge ?? null,
        builder_data: data,
        construction_confidence: confidence,
      };
      if (recordId) {
        await supabase.from("project_intelligence_records").update(payload).eq("id", recordId);
      } else {
        const { data: created } = await supabase
          .from("project_intelligence_records")
          .insert(payload as any)
          .select("id")
          .maybeSingle();
        if (created?.id) setRecordId(created.id);
      }
      if (!opts.silent) {
        // subtle feedback only
      }
    } catch (e) {
      console.error("[project-builder] save failed", e);
    } finally {
      setSaving(false);
    }
  }

  function patch(p: Partial<BuilderData>) {
    setData((d) => ({ ...d, ...p }));
  }

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = step > 1 ? () => setStep((s) => s - 1) : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy" />
      </div>
    );
  }

  /* ---------- Step renderer ---------- */

  if (step === 1) {
    const value = data.projectType;
    return (
      <BuilderShell
        step={1} totalSteps={TOTAL_STEPS}
        title="What are you building?"
        subtitle="Pick the closest match. You can refine later."
        onNext={next} nextDisabled={!value}
        confidence={confidence}
      >
        <ChoiceGrid
          options={PROJECT_TYPES}
          value={value}
          onSelect={(v) => patch({ projectType: v })}
        />
        {value === "Other" && (
          <div className="mt-4">
            <Input
              placeholder="Describe your project"
              value={data.projectTypeOther ?? ""}
              onChange={(e) => patch({ projectTypeOther: e.target.value })}
              className="bg-white"
            />
          </div>
        )}
      </BuilderShell>
    );
  }

  if (step === 2) {
    const addr = data.address ?? {};
    const ok = !!addr.postcode && !!data.propertyType;
    return (
      <BuilderShell
        step={2} totalSteps={TOTAL_STEPS}
        title="Tell us about the property."
        subtitle="Address helps regional benchmarks. Type helps structural expectations."
        onBack={back} onNext={next} nextDisabled={!ok}
        confidence={confidence}
      >
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-navy/10 space-y-3">
            <div>
              <Label className="text-navy">Address line</Label>
              <Input
                value={addr.line1 ?? ""}
                onChange={(e) => patch({ address: { ...addr, line1: e.target.value } })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-navy">Town / city</Label>
                <Input
                  value={addr.city ?? ""}
                  onChange={(e) => patch({ address: { ...addr, city: e.target.value } })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-navy">Postcode *</Label>
                <Input
                  value={addr.postcode ?? ""}
                  onChange={(e) => patch({ address: { ...addr, postcode: e.target.value.toUpperCase() } })}
                  className="mt-1 uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="text-navy font-medium mb-3">Property type</div>
            <ChoiceGrid
              options={PROPERTY_TYPES}
              value={data.propertyType}
              onSelect={(v) => patch({ propertyType: v })}
              columns={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-5 rounded-xl bg-white border border-navy/10">
              <Label className="text-navy">Approx. construction age</Label>
              <Input
                placeholder="e.g. 1930s, Victorian, 2005"
                value={data.propertyAge ?? ""}
                onChange={(e) => patch({ propertyAge: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="p-5 rounded-xl bg-white border border-navy/10">
              <Label className="text-navy">Number of storeys</Label>
              <Input
                type="number"
                min={1}
                value={data.storeys ?? ""}
                onChange={(e) => patch({ storeys: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </BuilderShell>
    );
  }

  if (step === 3) {
    const dim = data.dimensions ?? {};
    const area = computeFloorArea(dim.width, dim.projection);
    // keep floor area in sync
    if (area !== (dim.floorArea ?? "")) {
      setTimeout(() => patch({ dimensions: { ...dim, floorArea: area } }), 0);
    }
    return (
      <BuilderShell
        step={3} totalSteps={TOTAL_STEPS}
        title="Project dimensions."
        subtitle="Rough figures are fine — you can refine them later."
        onBack={back} onNext={next}
        confidence={confidence}
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            { k: "width", label: "Width (m)" },
            { k: "projection", label: "Projection (m)" },
            { k: "height", label: "Height (m)" },
            { k: "storeys", label: "Storeys" },
          ].map((f) => (
            <div key={f.k} className="p-5 rounded-xl bg-white border border-navy/10">
              <Label className="text-navy">{f.label}</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={(dim as any)[f.k] ?? ""}
                onChange={(e) => patch({ dimensions: { ...dim, [f.k]: e.target.value } })}
                className="mt-2"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 p-5 rounded-xl bg-teal/10 border border-teal/30">
          <div className="text-xs uppercase tracking-wider text-teal-deep font-semibold">Approx. floor area</div>
          <div className="mt-1 font-heading text-3xl text-navy">
            {area ? `${area} m²` : "—"}
          </div>
          <div className="text-xs text-secondary-text mt-1">Calculated automatically from width × projection.</div>
        </div>
      </BuilderShell>
    );
  }

  if (step === 4) {
    const ex = data.existing ?? {};
    return (
      <BuilderShell
        step={4} totalSteps={TOTAL_STEPS}
        title="Existing structure."
        subtitle="Honest answers give the best assessment. 'Unknown' is a valid answer."
        onBack={back} onNext={next}
        confidence={confidence}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TriToggle label="Existing wall removed?" value={ex.wallRemoved} onChange={(v) => patch({ existing: { ...ex, wallRemoved: v } })} />
          <TriToggle label="Steel beam required?" value={ex.steelRequired} onChange={(v) => patch({ existing: { ...ex, steelRequired: v } })} />
          <TriToggle label="Padstones required?" value={ex.padstonesRequired} onChange={(v) => patch({ existing: { ...ex, padstonesRequired: v } })} />
          <TriToggle label="Existing chimney affected?" value={ex.chimneyAffected} onChange={(v) => patch({ existing: { ...ex, chimneyAffected: v } })} />
          <TriToggle label="Existing drains affected?" value={ex.drainsAffected} onChange={(v) => patch({ existing: { ...ex, drainsAffected: v } })} />
          <TriToggle label="Structural calcs already available?" value={ex.structuralCalcsAvailable} onChange={(v) => patch({ existing: { ...ex, structuralCalcsAvailable: v } })} />
          <TriToggle label="Planning approval already granted?" value={ex.planningApproved} onChange={(v) => patch({ existing: { ...ex, planningApproved: v } })} />
          <TriToggle label="Building Regulations started?" value={ex.buildingRegsStarted} onChange={(v) => patch({ existing: { ...ex, buildingRegsStarted: v } })} />
        </div>
      </BuilderShell>
    );
  }

  if (step === 5) {
    const sp = data.spec ?? {};
    return (
      <BuilderShell
        step={5} totalSteps={TOTAL_STEPS}
        title="Construction specification."
        subtitle="How you're planning to build it."
        onBack={back} onNext={next}
        confidence={confidence}
      >
        <div className="space-y-6">
          <SpecBlock label="External wall" options={["Brick","Render","Stone","Timber","Mixed"]}
            value={sp.externalWall} onSelect={(v) => patch({ spec: { ...sp, externalWall: v } })} />
          <SpecBlock label="Internal wall" options={["Block","Timber","Other"]}
            value={sp.internalWall} onSelect={(v) => patch({ spec: { ...sp, internalWall: v } })} />
          <SpecBlock label="Roof type" options={["Flat","Warm Roof","Cold Roof","Pitched","Hybrid"]}
            value={sp.roofType} onSelect={(v) => patch({ spec: { ...sp, roofType: v } })} />
          <SpecBlock label="Roof finish" options={["EPDM","Fibreglass","Tiles","Slates","Other"]}
            value={sp.roofFinish} onSelect={(v) => patch({ spec: { ...sp, roofFinish: v } })} />
        </div>
      </BuilderShell>
    );
  }

  if (step === 6) {
    const g = data.glazing ?? {};
    const setG = (p: Partial<typeof g>) => patch({ glazing: { ...g, ...p } });
    return (
      <BuilderShell
        step={6} totalSteps={TOTAL_STEPS}
        title="Glazing."
        subtitle="Big cost driver — worth being accurate."
        onBack={back} onNext={next}
        confidence={confidence}
      >
        <div className="space-y-4">
          <GlazingRow label="Bi-fold doors" on={!!g.bifoldDoors} onToggle={(b) => setG({ bifoldDoors: b })}
            extra={g.bifoldDoors && (
              <Input placeholder="Width (mm)" value={g.bifoldWidth ?? ""} onChange={(e) => setG({ bifoldWidth: e.target.value })} />
            )}
          />
          <GlazingRow label="Sliding doors" on={!!g.slidingDoors} onToggle={(b) => setG({ slidingDoors: b })}
            extra={g.slidingDoors && (
              <Input placeholder="Width (mm)" value={g.slidingWidth ?? ""} onChange={(e) => setG({ slidingWidth: e.target.value })} />
            )}
          />
          <GlazingRow label="French doors" on={!!g.frenchDoors} onToggle={(b) => setG({ frenchDoors: b })} />
          <GlazingRow label="Roof lantern" on={!!g.roofLantern} onToggle={(b) => setG({ roofLantern: b })}
            extra={g.roofLantern && (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Width (mm)" value={g.lanternWidth ?? ""} onChange={(e) => setG({ lanternWidth: e.target.value })} />
                <Input placeholder="Length (mm)" value={g.lanternLength ?? ""} onChange={(e) => setG({ lanternLength: e.target.value })} />
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-5 rounded-xl bg-white border border-navy/10">
              <Label className="text-navy">Number of rooflights</Label>
              <Input type="number" min={0} value={g.rooflights ?? ""} onChange={(e) => setG({ rooflights: e.target.value })} className="mt-2" />
            </div>
            <div className="p-5 rounded-xl bg-white border border-navy/10">
              <Label className="text-navy">Window quantity</Label>
              <Input type="number" min={0} value={g.windowQuantity ?? ""} onChange={(e) => setG({ windowQuantity: e.target.value })} className="mt-2" />
            </div>
          </div>

          <div>
            <div className="text-navy font-medium mb-3">Window quality</div>
            <ChoiceGrid
              options={["Standard","Premium","Unknown"] as const}
              value={g.windowQuality ? g.windowQuality[0].toUpperCase() + g.windowQuality.slice(1) : undefined}
              onSelect={(v) => setG({ windowQuality: v.toLowerCase() as any })}
              columns={3}
            />
          </div>
        </div>
      </BuilderShell>
    );
  }

  if (step === 7) {
    return (
      <BuilderShell
        step={7} totalSteps={TOTAL_STEPS}
        title="Internal finish."
        subtitle="Where do you want the trade to leave it?"
        onBack={back} onNext={next} nextDisabled={!data.finishLevel}
        confidence={confidence}
      >
        <ChoiceGrid
          options={FINISH_LEVELS}
          value={data.finishLevel}
          onSelect={(v) => patch({ finishLevel: v })}
        />
      </BuilderShell>
    );
  }

  if (step === 8) {
    const svc = data.services ?? [];
    return (
      <BuilderShell
        step={8} totalSteps={TOTAL_STEPS}
        title="Services included."
        subtitle="Tick everything relevant to this project."
        onBack={back} onNext={next}
        confidence={confidence}
      >
        <ChipMultiSelect options={SERVICE_OPTIONS} value={svc} onChange={(v) => patch({ services: v })} />
        {svc.includes("Other") && (
          <div className="mt-4">
            <Input placeholder="Specify other services" value={data.servicesOther ?? ""} onChange={(e) => patch({ servicesOther: e.target.value })} className="bg-white" />
          </div>
        )}
      </BuilderShell>
    );
  }

  if (step === 9) {
    const ext = data.externalWorks ?? [];
    return (
      <BuilderShell
        step={9} totalSteps={TOTAL_STEPS}
        title="External works."
        subtitle="Anything happening outside the main structure."
        onBack={back} onNext={next}
        confidence={confidence}
      >
        <ChipMultiSelect options={EXTERNAL_WORKS_OPTIONS} value={ext} onChange={(v) => patch({ externalWorks: v })} />
        {ext.includes("Other") && (
          <div className="mt-4">
            <Input placeholder="Specify other works" value={data.externalWorksOther ?? ""} onChange={(e) => patch({ externalWorksOther: e.target.value })} className="bg-white" />
          </div>
        )}
      </BuilderShell>
    );
  }

  if (step === 10) {
    const cons = data.constraints ?? [];
    return (
      <BuilderShell
        step={10} totalSteps={TOTAL_STEPS}
        title="Project constraints."
        subtitle="Flag anything that could complicate the build."
        onBack={back} onNext={next}
        confidence={confidence}
      >
        <ChipMultiSelect options={CONSTRAINT_OPTIONS} value={cons} onChange={(v) => patch({ constraints: v })} />
      </BuilderShell>
    );
  }

  /* ---------- Summary ---------- */
  return (
    <SummaryScreen
      data={data}
      confidence={confidence}
      onEdit={(s) => setStep(s)}
      saving={saving}
      onSave={async () => {
        await persist();
        toast.success("Project saved.");
      }}
      onContinue={async (dest) => {
        await persist();
        if (dest === "cost") {
          toast.info("Construction Cost Builder — coming soon.");
        } else {
          navigate(recordId ? `/project-clarity/${recordId}` : "/project-clarity");
        }
      }}
      step={11}
      totalSteps={TOTAL_STEPS}
      back={() => setStep(10)}
    />
  );
}

/* ---------- Sub components ---------- */

function SpecBlock({
  label, options, value, onSelect,
}: { label: string; options: readonly string[]; value?: string; onSelect: (v: string) => void }) {
  return (
    <div>
      <div className="text-navy font-medium mb-3">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <button key={o} type="button" onClick={() => onSelect(o)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all
                ${on ? "border-teal bg-white text-navy" : "border-navy/10 bg-white/60 text-secondary-text hover:border-navy/30"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GlazingRow({
  label, on, onToggle, extra,
}: { label: string; on: boolean; onToggle: (b: boolean) => void; extra?: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl bg-white border border-navy/10">
      <div className="flex items-center justify-between">
        <span className="text-navy font-medium">{label}</span>
        <button
          type="button"
          onClick={() => onToggle(!on)}
          className={`relative w-12 h-7 rounded-full transition-colors ${on ? "bg-teal" : "bg-navy/15"}`}
          aria-pressed={on}
        >
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
        </button>
      </div>
      {extra && <div className="mt-3">{extra}</div>}
    </div>
  );
}

function SummaryScreen({
  data, confidence, onEdit, onSave, onContinue, saving, step, totalSteps, back,
}: {
  data: BuilderData;
  confidence: number;
  onEdit: (step: number) => void;
  onSave: () => void;
  onContinue: (dest: "cost" | "clarity") => void;
  saving: boolean;
  step: number;
  totalSteps: number;
  back: () => void;
}) {
  const rows: { step: number; label: string; value: string }[] = [
    { step: 1, label: "Project type", value: data.projectType ?? "—" },
    { step: 2, label: "Property", value: [data.address?.postcode, data.propertyType, data.propertyAge].filter(Boolean).join(" · ") || "—" },
    { step: 3, label: "Dimensions", value: [
        data.dimensions?.width && `${data.dimensions.width}m W`,
        data.dimensions?.projection && `${data.dimensions.projection}m P`,
        data.dimensions?.floorArea && `${data.dimensions.floorArea} m²`,
      ].filter(Boolean).join(" · ") || "—" },
    { step: 4, label: "Existing structure", value: summariseExisting(data) },
    { step: 5, label: "Specification", value: [data.spec?.externalWall, data.spec?.roofType, data.spec?.roofFinish].filter(Boolean).join(" · ") || "—" },
    { step: 6, label: "Glazing", value: summariseGlazing(data) },
    { step: 7, label: "Internal finish", value: data.finishLevel ?? "—" },
    { step: 8, label: "Services", value: (data.services ?? []).join(", ") || "—" },
    { step: 9, label: "External works", value: (data.externalWorks ?? []).join(", ") || "—" },
    { step: 10, label: "Constraints", value: (data.constraints ?? []).join(", ") || "—" },
  ];

  const conf = Math.max(0, Math.min(100, confidence));
  const dash = 2 * Math.PI * 44;
  const offset = dash * (1 - conf / 100);

  return (
    <div className="min-h-screen bg-cream">
      <div className="sticky top-0 z-20 bg-cream/90 backdrop-blur border-b border-navy/10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between text-[11px] uppercase tracking-wider text-navy/60">
          <span>Summary</span>
          <span>Step {step} of {totalSteps}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-10 pb-40">
        <h1 className="font-heading text-4xl md:text-5xl text-navy tracking-tight">Construction summary.</h1>
        <p className="mt-3 text-secondary-text">Every ProGrafter module will pull from this record. You only enter it once.</p>

        <div className="mt-8 p-6 rounded-2xl bg-white border border-navy/10 flex items-center gap-6">
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="44" stroke="hsl(var(--navy) / 0.1)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="44" stroke="#14A8A1" strokeWidth="8" fill="none"
                strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-700" />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-heading text-3xl text-navy leading-none">{conf}%</div>
                <div className="text-[10px] uppercase tracking-wider text-secondary-text mt-1">Confidence</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-navy font-medium">Construction Confidence</div>
            <p className="text-sm text-secondary-text mt-1 leading-relaxed">
              The more information provided, the more accurate every ProGrafter assessment becomes.
            </p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-navy/10 rounded-2xl border border-navy/10 bg-white overflow-hidden">
          {rows.map((r) => (
            <button
              key={r.step}
              onClick={() => onEdit(r.step)}
              className="w-full text-left px-5 py-4 hover:bg-navy/[0.02] transition-colors flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-navy/60">{r.label}</div>
                <div className="text-navy mt-1 truncate">{r.value}</div>
              </div>
              <span className="text-xs text-teal-deep font-medium shrink-0 pt-1">Edit</span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-3">
          <Button onClick={() => onContinue("cost")}
            className="w-full h-12 bg-navy hover:bg-navy-deep text-white text-base">
            Continue to Construction Cost Builder <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => onContinue("clarity")}
            className="w-full h-12 bg-teal hover:bg-teal-deep text-white text-base">
            Continue to Project Clarity <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={onSave} variant="outline"
            className="w-full h-12 border-navy/20 text-navy hover:bg-navy/5 text-base">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save project
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-cream/95 backdrop-blur border-t border-navy/10">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <Button variant="ghost" onClick={back} className="text-navy hover:bg-navy/5">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>
      </div>
    </div>
  );
}

function summariseExisting(d: BuilderData): string {
  const e = d.existing ?? {};
  const bits: string[] = [];
  if (e.wallRemoved) bits.push(`Wall removed: ${e.wallRemoved}`);
  if (e.steelRequired) bits.push(`Steel: ${e.steelRequired}`);
  if (e.planningApproved) bits.push(`Planning: ${e.planningApproved}`);
  return bits.slice(0, 3).join(" · ") || "—";
}

function summariseGlazing(d: BuilderData): string {
  const g = d.glazing ?? {};
  const bits: string[] = [];
  if (g.bifoldDoors) bits.push("Bi-fold");
  if (g.slidingDoors) bits.push("Sliding");
  if (g.frenchDoors) bits.push("French");
  if (g.roofLantern) bits.push("Lantern");
  if (g.rooflights) bits.push(`${g.rooflights} rooflights`);
  if (g.windowQuantity) bits.push(`${g.windowQuantity} windows`);
  return bits.join(" · ") || "—";
}
