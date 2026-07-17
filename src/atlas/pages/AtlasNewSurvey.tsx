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
import { ArrowLeft, ArrowRight, Sun, CloudRain, Compass } from "lucide-react";

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
    navigate(`/atlas/${data.id}`);
  }

  return (
    <AtlasShell>
      <button
        onClick={() => navigate("/atlas")}
        className="font-mono text-xs text-muted-foreground hover:text-white flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> All surveys
      </button>

      <h1 className="font-heading text-primary text-3xl mb-2">New Atlas survey</h1>
      <p className="font-mono text-xs text-muted-foreground mb-6">Step {step} of 3</p>

      <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-teal-400 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      {step === 1 && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-heading text-primary text-xl">Project & property</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Project title *">
              <Input value={form.project_title} onChange={(e) => setField("project_title", e.target.value)} placeholder="Smith — rear extension" />
            </Field>
            <Field label="Project type">
              <select
                className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
                value={form.project_type}
                onChange={(e) => setField("project_type", e.target.value)}
              >
                {PROJECT_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Property address"><Input value={form.property_address} onChange={(e) => setField("property_address", e.target.value)} /></Field>
            <Field label="Postcode"><Input value={form.postcode} onChange={(e) => setField("postcode", e.target.value)} /></Field>
            <Field label="Customer name"><Input value={form.customer_name} onChange={(e) => setField("customer_name", e.target.value)} /></Field>
            <Field label="Customer phone"><Input value={form.customer_phone} onChange={(e) => setField("customer_phone", e.target.value)} /></Field>
            <Field label="Customer email"><Input type="email" value={form.customer_email} onChange={(e) => setField("customer_email", e.target.value)} /></Field>
          </div>
          <Field label="Customer intent (what they say they want)">
            <Textarea rows={3} value={form.customer_intent} onChange={(e) => setField("customer_intent", e.target.value)} placeholder="Open-plan kitchen-diner, keep utility, ready before school year…" />
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-heading text-primary text-xl">Survey scope</h2>
          <Field label="Relevant trades">
            <div className="flex flex-wrap gap-2">
              {TRADE_CATEGORIES.map((t) => {
                const on = form.relevant_trades.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTrade(t)}
                    className={`font-mono text-xs px-3 py-1.5 rounded-full border transition ${
                      on ? "bg-teal-500/20 border-teal-400/50 text-teal-100" : "bg-transparent border-white/15 text-muted-foreground hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Start route">
              <div className="grid grid-cols-2 gap-2">
                {(["outside", "inside"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setField("start_route", r)}
                    className={`h-10 rounded-md border font-mono text-xs flex items-center justify-center gap-2 ${
                      form.start_route === r ? "border-teal-400 bg-teal-500/15 text-teal-100" : "border-white/15 text-muted-foreground"
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    {r === "outside" ? "Start outside" : "Start inside"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Weather">
              <div className="flex gap-2">
                {[{ v: "Dry", i: <Sun className="w-3.5 h-3.5" /> }, { v: "Wet", i: <CloudRain className="w-3.5 h-3.5" /> }, { v: "Overcast", i: null }].map((w) => (
                  <button
                    key={w.v}
                    type="button"
                    onClick={() => setField("weather_conditions", w.v)}
                    className={`flex-1 h-10 rounded-md border font-mono text-xs flex items-center justify-center gap-2 ${
                      form.weather_conditions === w.v ? "border-teal-400 bg-teal-500/15 text-teal-100" : "border-white/15 text-muted-foreground"
                    }`}
                  >
                    {w.i}
                    {w.v}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Toggle label="Customer present" value={form.customer_present} onChange={(v) => setField("customer_present", v)} />
            <Toggle label="Property occupied" value={form.property_occupied} onChange={(v) => setField("property_occupied", v)} />
          </div>

          <Field label="Anticipated access limitations">
            <Textarea rows={2} value={form.access_limitations} onChange={(e) => setField("access_limitations", e.target.value)} placeholder="Locked outbuilding, tenanted upper floor…" />
          </Field>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-heading text-primary text-xl">Ready to begin</h2>
          <p className="font-body text-sm text-muted-foreground">
            Atlas will seed guided sections based on your project type and trades. You can pause and resume, and every
            observation is auto-saved as you go.
          </p>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 font-mono text-xs text-muted-foreground space-y-1">
            <div><span className="text-white">Project:</span> {form.project_title || "—"} ({form.project_type})</div>
            <div><span className="text-white">Property:</span> {form.property_address || "—"} {form.postcode}</div>
            <div><span className="text-white">Customer:</span> {form.customer_name || "—"}</div>
            <div><span className="text-white">Trades:</span> {form.relevant_trades.join(", ") || "None selected"}</div>
            <div><span className="text-white">Start:</span> {form.start_route}</div>
          </div>
        </section>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="gap-2" style={{ background: "#0D9488", color: "white" }}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button disabled={saving} onClick={handleCreate} className="gap-2" style={{ background: "#0D9488", color: "white" }}>
            {saving ? "Creating…" : "Start survey"} <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </AtlasShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="font-mono text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`h-10 rounded-md border px-3 flex items-center justify-between font-mono text-xs ${
        value ? "border-teal-400 bg-teal-500/15 text-teal-100" : "border-white/15 text-muted-foreground"
      }`}
    >
      {label}
      <span className={`w-8 h-4 rounded-full relative transition ${value ? "bg-teal-400" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}
