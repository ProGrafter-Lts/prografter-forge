import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { CLASSIFICATIONS, RESPONSE_STATUSES, CONFIDENCE_LEVELS } from "../sections";
import EvidenceCapture from "./EvidenceCapture";

export interface Observation {
  id: string;
  survey_id: string;
  section_id: string;
  title: string;
  observation_text: string | null;
  location: string | null;
  classification: string;
  confidence_level: string;
  severity: string | null;
  is_critical: boolean;
  is_required: boolean;
  response_status: string;
  skip_reason: string | null;
  recommendation: string | null;
  customer_visible_note: string | null;
  internal_note: string | null;
  measurement_value: number | null;
  measurement_unit: string | null;
}

interface Props {
  obs: Observation;
  onChange: () => void;
  readOnly?: boolean;
}

export default function ObservationCard({ obs, onChange, readOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(obs);
  const [saving, setSaving] = useState(false);

  const critical = obs.is_critical && obs.response_status !== "answered" && !obs.skip_reason;

  const cls = CLASSIFICATIONS[local.classification] ?? CLASSIFICATIONS.unknown;

  async function save(patch: Partial<Observation>) {
    if (readOnly) return;
    setSaving(true);
    const next = { ...local, ...patch };
    setLocal(next);
    await (supabase as any).from("atlas_observations").update(patch).eq("id", obs.id);
    setSaving(false);
    onChange();
  }

  async function skipWithReason() {
    const reason = window.prompt("Why are you skipping this? (audit trail)");
    if (!reason) return;
    await save({ skip_reason: reason, response_status: "unknown" });
  }

  async function remove() {
    if (!window.confirm("Delete this observation?")) return;
    await (supabase as any).from("atlas_observations").delete().eq("id", obs.id);
    onChange();
  }

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        critical
          ? "border-rose-500/40 bg-rose-500/[0.05]"
          : local.response_status === "answered"
            ? "border-emerald-500/25 bg-emerald-500/[0.03]"
            : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <button className="w-full text-left flex items-start gap-3" onClick={() => setOpen((o) => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${cls.tone}`}>{cls.label}</span>
            {obs.is_critical && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-rose-500/40 text-rose-300 bg-rose-500/10 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Critical
              </span>
            )}
            {obs.is_required && !obs.is_critical && (
              <span className="font-mono text-[10px] text-muted-foreground">Required</span>
            )}
            <span className="font-mono text-[10px] text-muted-foreground ml-auto">
              {RESPONSE_STATUSES[local.response_status]}
            </span>
          </div>
          <h4 className="font-heading text-primary text-base">{obs.title}</h4>
          {local.observation_text && !open && (
            <p className="font-body text-sm text-white/70 mt-1 line-clamp-2">{local.observation_text}</p>
          )}
          {local.skip_reason && !open && (
            <p className="font-mono text-xs text-amber-300 mt-1">Skipped: {local.skip_reason}</p>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          <div>
            <label className="font-mono text-xs text-muted-foreground">Observation</label>
            <Textarea
              rows={3}
              value={local.observation_text ?? ""}
              onChange={(e) => setLocal((l) => ({ ...l, observation_text: e.target.value }))}
              onBlur={() => save({ observation_text: local.observation_text })}
              placeholder="What did you see, hear, measure?"
              disabled={readOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SelectField
              label="Classification"
              value={local.classification}
              onChange={(v) => save({ classification: v })}
              options={Object.entries(CLASSIFICATIONS).map(([k, v]) => [k, v.label] as [string, string])}
              disabled={readOnly}
            />
            <SelectField
              label="Confidence"
              value={local.confidence_level}
              onChange={(v) => save({ confidence_level: v })}
              options={Object.entries(CONFIDENCE_LEVELS)}
              disabled={readOnly}
            />
            <SelectField
              label="Response"
              value={local.response_status}
              onChange={(v) => save({ response_status: v })}
              options={Object.entries(RESPONSE_STATUSES)}
              disabled={readOnly}
            />
            <div className="grid grid-cols-[1fr_60px] gap-1">
              <div>
                <label className="font-mono text-xs text-muted-foreground">Measurement</label>
                <Input
                  type="number"
                  value={local.measurement_value ?? ""}
                  onChange={(e) => setLocal((l) => ({ ...l, measurement_value: e.target.value ? Number(e.target.value) : null }))}
                  onBlur={() => save({ measurement_value: local.measurement_value })}
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground">Unit</label>
                <Input
                  value={local.measurement_unit ?? ""}
                  onChange={(e) => setLocal((l) => ({ ...l, measurement_unit: e.target.value }))}
                  onBlur={() => save({ measurement_unit: local.measurement_unit })}
                  placeholder="m, mm…"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-mono text-xs text-muted-foreground">Evidence</label>
            <EvidenceCapture surveyId={obs.survey_id} observationId={obs.id} />
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            <div>
              <label className="font-mono text-xs text-muted-foreground">Internal note</label>
              <Textarea rows={2} value={local.internal_note ?? ""} onChange={(e) => setLocal((l) => ({ ...l, internal_note: e.target.value }))} onBlur={() => save({ internal_note: local.internal_note })} disabled={readOnly} />
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground">Customer-visible note</label>
              <Textarea rows={2} value={local.customer_visible_note ?? ""} onChange={(e) => setLocal((l) => ({ ...l, customer_visible_note: e.target.value }))} onBlur={() => save({ customer_visible_note: local.customer_visible_note })} disabled={readOnly} />
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => save({ response_status: "answered", skip_reason: null })}>
                Mark answered
              </Button>
              <Button size="sm" variant="outline" onClick={skipWithReason}>
                Skip with reason
              </Button>
              <Button size="sm" variant="ghost" onClick={remove} className="ml-auto text-rose-300 hover:text-rose-200 gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          )}
          {saving && <p className="font-mono text-[10px] text-muted-foreground">Saving…</p>}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="font-mono text-xs text-muted-foreground">{label}</label>
      <select
        className="w-full h-9 rounded-md bg-background border border-input px-2 text-xs"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}
