import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, ChevronDown, ChevronUp, Camera, ImageIcon } from "lucide-react";
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
  thumbnail?: string;
}

export default function ObservationCard({ obs, onChange, readOnly, thumbnail }: Props) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(obs);
  const [saving, setSaving] = useState(false);

  const critical = obs.is_critical && obs.response_status !== "answered" && !obs.skip_reason;
  const answered = local.response_status === "answered";
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
      className={`rounded-2xl border overflow-hidden transition-all ${
        critical
          ? "border-amber-400/40 bg-amber-500/[0.04]"
          : answered
            ? "border-white/[0.08] bg-white/[0.03]"
            : "border-white/[0.06] bg-white/[0.02]"
      } hover:border-white/[0.15]`}
    >
      <button
        className="w-full text-left flex items-stretch gap-4 p-4"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Image-first thumbnail */}
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 relative bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-white/20" />
          )}
          {critical && (
            <div className="absolute inset-0 ring-1 ring-inset ring-amber-400/50 rounded-xl" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls.tone}`}>
              {cls.label}
            </span>
            {obs.is_critical && (
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-400/40 text-amber-200 bg-amber-400/10 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Critical
              </span>
            )}
            {obs.is_required && !obs.is_critical && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/45">Required</span>
            )}
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/40 ml-auto">
              {RESPONSE_STATUSES[local.response_status]}
            </span>
          </div>
          <h4 className="font-body text-white text-[15px] leading-snug font-medium">{obs.title}</h4>
          {local.observation_text && !open && (
            <p className="font-body text-sm text-white/60 mt-1 line-clamp-2">{local.observation_text}</p>
          )}
          {local.skip_reason && !open && (
            <p className="font-mono text-[11px] text-amber-200 mt-1">Skipped: {local.skip_reason}</p>
          )}
          {local.measurement_value != null && !open && (
            <p className="font-mono text-[11px] text-teal-300 mt-1">
              {local.measurement_value} {local.measurement_unit || ""}
            </p>
          )}
        </div>

        <div className="self-center shrink-0">
          {open ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] p-5 space-y-5 bg-black/[0.15]">
          <div>
            <FieldLabel>Observation</FieldLabel>
            <Textarea
              rows={3}
              value={local.observation_text ?? ""}
              onChange={(e) => setLocal((l) => ({ ...l, observation_text: e.target.value }))}
              onBlur={() => save({ observation_text: local.observation_text })}
              placeholder="What did you see, hear, measure?"
              disabled={readOnly}
              className="bg-white/[0.03] border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <div className="grid grid-cols-[1fr_60px] gap-1.5">
              <div>
                <FieldLabel>Measurement</FieldLabel>
                <Input
                  type="number"
                  value={local.measurement_value ?? ""}
                  onChange={(e) => setLocal((l) => ({ ...l, measurement_value: e.target.value ? Number(e.target.value) : null }))}
                  onBlur={() => save({ measurement_value: local.measurement_value })}
                  disabled={readOnly}
                  className="h-9 bg-white/[0.03] border-white/10"
                />
              </div>
              <div>
                <FieldLabel>Unit</FieldLabel>
                <Input
                  value={local.measurement_unit ?? ""}
                  onChange={(e) => setLocal((l) => ({ ...l, measurement_unit: e.target.value }))}
                  onBlur={() => save({ measurement_unit: local.measurement_unit })}
                  placeholder="mm"
                  disabled={readOnly}
                  className="h-9 bg-white/[0.03] border-white/10"
                />
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>
              <span className="flex items-center gap-1.5">
                <Camera className="w-3 h-3" /> Evidence
              </span>
            </FieldLabel>
            <EvidenceCapture surveyId={obs.survey_id} observationId={obs.id} />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Internal note</FieldLabel>
              <Textarea rows={2} value={local.internal_note ?? ""} onChange={(e) => setLocal((l) => ({ ...l, internal_note: e.target.value }))} onBlur={() => save({ internal_note: local.internal_note })} disabled={readOnly} className="bg-white/[0.03] border-white/10" />
            </div>
            <div>
              <FieldLabel>Customer-visible note</FieldLabel>
              <Textarea rows={2} value={local.customer_visible_note ?? ""} onChange={(e) => setLocal((l) => ({ ...l, customer_visible_note: e.target.value }))} onBlur={() => save({ customer_visible_note: local.customer_visible_note })} disabled={readOnly} className="bg-white/[0.03] border-white/10" />
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => save({ response_status: "answered", skip_reason: null })}
                className="rounded-full h-8 gap-1"
                style={{ background: "rgba(45,212,191,0.15)", color: "#5EEAD4", border: "1px solid rgba(45,212,191,0.35)" }}
              >
                Mark answered
              </Button>
              <Button size="sm" variant="ghost" onClick={skipWithReason} className="rounded-full h-8 text-white/70 hover:text-white hover:bg-white/[0.06]">
                Skip with reason
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={remove}
                className="ml-auto rounded-full h-8 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          )}
          {saving && <p className="font-mono text-[10px] text-white/40">Saving…</p>}
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-1.5 block">
      {children}
    </label>
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
      <FieldLabel>{label}</FieldLabel>
      <select
        className="w-full h-9 rounded-md bg-white/[0.03] border border-white/10 px-2 text-xs text-white"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}
