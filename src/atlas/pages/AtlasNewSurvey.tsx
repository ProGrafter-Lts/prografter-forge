import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AtlasShell from "../AtlasShell";
import { PROJECT_TYPES, TRADE_CATEGORIES } from "../sections";
import { ensureAtlasSections, logAtlasAudit } from "../lib";
import { ArrowLeft, ArrowRight, Sun, CloudRain, Cloud, Compass, Home, Users, CheckCircle2 } from "lucide-react";

const STEPS = [
  { n: 1, label: "Project" },
  { n: 2, label: "Scope" },
  { n: 3, label: "Review" },
];

export default function AtlasNewSurvey() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    project_title: "",
    project_type: "Single-storey extension",
    property_address: "",
    postcode: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_intent: "",
    survey_type: "full_site",
    relevant_trades: [] as string[],
    start_route: "outside",
    customer_present: false,
    property_occupied: false,
    weather_conditions: "",
    access_limitations: "",
  });

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleTrade = (t: string) =>
    setForm((f) => ({
      ...f,
      relevant_trades: f.relevant_trades.includes(t)
        ? f.relevant_trades.filter((x) => x !== t)
        : [...f.relevant_trades, t],
    }));

  async function handleCreate() {
    if (!form.project_title.trim()) {
      toast.error("Add a project title first");
      setStep(1);
      return;
    }
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) {
      toast.error("Please sign in");
      setSaving(false);
      return;
    }

    const { data, error } = await (supabase as any)
      .from("atlas_surveys")
      .insert({ ...form, created_by: uid, status: "in_progress", started_at: new Date().toISOString() })
      .select("id")
      .single();

    if (error || !data) {
      toast.error(error?.message || "Could not create survey");
      setSaving(false);
      return;
    }
    try {
      await ensureAtlasSections(data.id);
      await logAtlasAudit(data.id, "survey", data.id, "created");
    } catch (e) {
      console.error(e);
    }
    toast.success("Survey created");
    navigate(`/atlas/${data.id}/capture`);
  }

  return (
    <AtlasShell>
      <button
        onClick={() => navigate("/atlas")}
        className="font-mono text-xs text-white/60 hover:text-white flex items-center gap-1.5 mb-8 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All surveys
      </button>

      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-300">New survey</span>
        <h1 className="font-heading text-white text-4xl md:text-5xl mt-2">Set the scene.</h1>
        <p className="font-body text-[15px] text-white/60 mt-2 max-w-lg">
          Three short steps. Once complete, Atlas will guide the walk-through in the order that matches
          how the property flows.
        </p>
      </div>

      {/* Segmented progress */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {STEPS.map((s) => {
          const active = step === s.n;
          const done = step > s.n;
          return (
            <div key={s.n} className="space-y-2">
              <div
                className={`h-1 rounded-full transition-all ${
                  done ? "bg-teal-400" : active ? "bg-teal-400" : "bg-white/10"
                }`}
              />
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center ${
                    done ? "bg-teal-400 text-[#0F2238]" : active ? "bg-white text-[#0F2238]" : "bg-white/10 text-white/50"
                  }`}
                >
                  {done ? <CheckCircle2 className="w-3 h-3" /> : s.n}
                </span>
                <span className={`font-mono text-xs uppercase tracking-widest ${active || done ? "text-white" : "text-white/40"}`}>
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <Panel eyebrow="Step 1" title="Project & property" hint="Who is this survey for and where?">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Project title" required>
              <Input value={form.project_title} onChange={(e) => setField("project_title", e.target.value)} placeholder="Smith — rear extension" className="h-11" />
            </Field>
            <Field label="Project type">
              <select
                className="w-full h-11 rounded-md bg-white/[0.04] border border-white/10 px-3 text-sm text-white"
                value={form.project_type}
                onChange={(e) => setField("project_type", e.target.value)}
              >
                {PROJECT_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Property address"><Input className="h-11" value={form.property_address} onChange={(e) => setField("property_address", e.target.value)} /></Field>
            <Field label="Postcode"><Input className="h-11" value={form.postcode} onChange={(e) => setField("postcode", e.target.value)} /></Field>
            <Field label="Customer name"><Input className="h-11" value={form.customer_name} onChange={(e) => setField("customer_name", e.target.value)} /></Field>
            <Field label="Customer phone"><Input className="h-11" value={form.customer_phone} onChange={(e) => setField("customer_phone", e.target.value)} /></Field>
            <div className="md:col-span-2">
              <Field label="Customer email"><Input className="h-11" type="email" value={form.customer_email} onChange={(e) => setField("customer_email", e.target.value)} /></Field>
            </div>
          </div>
          <Field label="Customer intent" hint="What they say they want, in their own words">
            <Textarea rows={3} value={form.customer_intent} onChange={(e) => setField("customer_intent", e.target.value)} placeholder="Open-plan kitchen-diner, keep utility, ready before school year…" />
          </Field>
        </Panel>
      )}

      {step === 2 && (
        <Panel eyebrow="Step 2" title="Survey scope" hint="Which trades and how you'll walk the site">
          <Field label="Relevant trades" hint="Pick everything that may bear on this project">
            <div className="flex flex-wrap gap-2">
              {TRADE_CATEGORIES.map((t) => {
                const on = form.relevant_trades.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTrade(t)}
                    className={`font-mono text-xs px-3.5 py-1.5 rounded-full border transition ${
                      on
                        ? "bg-teal-500/20 border-teal-400/50 text-teal-100"
                        : "bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Start route">
              <div className="grid grid-cols-2 gap-2">
                {(["outside", "inside"] as const).map((r) => (
                  <ChoiceCard
                    key={r}
                    active={form.start_route === r}
                    onClick={() => setField("start_route", r)}
                    icon={<Compass className="w-4 h-4" />}
                    label={r === "outside" ? "Start outside" : "Start inside"}
                  />
                ))}
              </div>
            </Field>
            <Field label="Weather">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "Dry", i: <Sun className="w-4 h-4" /> },
                  { v: "Wet", i: <CloudRain className="w-4 h-4" /> },
                  { v: "Overcast", i: <Cloud className="w-4 h-4" /> },
                ].map((w) => (
                  <ChoiceCard
                    key={w.v}
                    active={form.weather_conditions === w.v}
                    onClick={() => setField("weather_conditions", w.v)}
                    icon={w.i}
                    label={w.v}
                  />
                ))}
              </div>
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <ToggleCard
              icon={<Users className="w-4 h-4" />}
              label="Customer present"
              hint="Available to answer questions in person"
              value={form.customer_present}
              onChange={(v) => setField("customer_present", v)}
            />
            <ToggleCard
              icon={<Home className="w-4 h-4" />}
              label="Property occupied"
              hint="Tenanted or lived-in during survey"
              value={form.property_occupied}
              onChange={(v) => setField("property_occupied", v)}
            />
          </div>

          <Field label="Anticipated access limitations">
            <Textarea rows={2} value={form.access_limitations} onChange={(e) => setField("access_limitations", e.target.value)} placeholder="Locked outbuilding, tenanted upper floor…" />
          </Field>
        </Panel>
      )}

      {step === 3 && (
        <Panel eyebrow="Step 3" title="Ready to begin" hint="Atlas will seed sections based on this project">
          <div className="grid gap-3">
            <Summary label="Project" value={`${form.project_title || "—"} · ${form.project_type}`} />
            <Summary label="Property" value={`${form.property_address || "—"} ${form.postcode}`} />
            <Summary label="Customer" value={form.customer_name || "—"} />
            <Summary label="Trades" value={form.relevant_trades.join(", ") || "None selected"} />
            <Summary label="Start route" value={form.start_route === "outside" ? "Outside first" : "Inside first"} />
            <Summary label="Weather" value={form.weather_conditions || "—"} />
          </div>
          <p className="font-body text-sm text-white/60 mt-4 leading-relaxed">
            You can pause and resume at any point. Every observation is auto-saved with a timestamp and,
            once completed, the survey is locked and versioned for audit.
          </p>
        </Panel>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="gap-2 text-white/70 hover:text-white hover:bg-white/[0.06] rounded-full h-11 px-5"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            className="gap-2 rounded-full h-11 px-6 shadow-lg shadow-teal-500/20"
            style={{ background: "linear-gradient(180deg,#14B8A6,#0D9488)", color: "white" }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            disabled={saving}
            onClick={handleCreate}
            className="gap-2 rounded-full h-11 px-6 shadow-lg shadow-teal-500/20"
            style={{ background: "linear-gradient(180deg,#14B8A6,#0D9488)", color: "white" }}
          >
            {saving ? "Creating…" : "Begin walk-through"} <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </AtlasShell>
  );
}

function Panel({ eyebrow, title, hint, children }: { eyebrow: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 md:p-8 space-y-6 shadow-2xl shadow-black/20">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-300">{eyebrow}</span>
        <h2 className="font-heading text-white text-2xl md:text-3xl mt-1">{title}</h2>
        <p className="font-body text-sm text-white/50 mt-1">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="font-mono text-[11px] uppercase tracking-wider text-white/60 mb-2 block">
        {label}{required && <span className="text-teal-300 ml-1">*</span>}
        {hint && <span className="normal-case tracking-normal text-white/40 ml-2 font-body">— {hint}</span>}
      </Label>
      {children}
    </div>
  );
}

function ChoiceCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-14 rounded-xl border font-mono text-xs flex items-center justify-center gap-2 transition ${
        active
          ? "border-teal-400/60 bg-teal-500/15 text-teal-100 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.25)]"
          : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ToggleCard({ icon, label, hint, value, onChange }: { icon: React.ReactNode; label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`text-left rounded-xl border p-4 flex items-start gap-3 transition ${
        value
          ? "border-teal-400/50 bg-teal-500/10"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${value ? "bg-teal-500/20 text-teal-200" : "bg-white/[0.04] text-white/50"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-body text-sm text-white">{label}</div>
        <div className="font-mono text-[10px] text-white/50 mt-0.5">{hint}</div>
      </div>
      <span className={`w-9 h-5 rounded-full relative transition shrink-0 mt-1 ${value ? "bg-teal-400" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2 border-b border-white/[0.06] last:border-0">
      <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">{label}</span>
      <span className="font-body text-sm text-white/90">{value}</span>
    </div>
  );
}
