import { AlertTriangle, Lock, Plus, X } from "lucide-react";
import PhotoField from "./PhotoField";
import { TREE_HEIGHT_BANDS, type FieldDef } from "./atlas-survey-schema";

const inputCls =
  "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-teal-400/50";

export default function FieldRenderer({
  surveyId,
  field,
  value,
  onChange,
}: {
  surveyId: string;
  field: FieldDef;
  value: any;
  onChange: (next: any) => void;
}) {
  const v = value ?? {};
  const set = (patch: Record<string, any>) => onChange({ ...v, ...patch });

  const rows: any[] = Array.isArray(v.value) ? v.value : [];
  const setRows = (next: any[]) => set({ value: next });

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <label className="block text-sm font-medium text-white">{field.label}</label>
      {field.description && <p className="mt-1 text-xs text-white/50">{field.description}</p>}

      <div className="mt-3 space-y-3">
        {field.type === "text" && (
          <input className={inputCls} value={v.value ?? ""} onChange={(e) => set({ value: e.target.value })} />
        )}

        {field.type === "textarea" && (
          <textarea
            rows={3}
            className={inputCls}
            value={v.value ?? ""}
            onChange={(e) => set({ value: e.target.value })}
          />
        )}

        {field.type === "select" && (
          <select className={inputCls} value={v.value ?? ""} onChange={(e) => set({ value: e.target.value })}>
            <option value="">Select…</option>
            {(field.options || []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}

        {(field.type === "yes_no" || field.type === "yes_no_unsure") && (
          <div className="flex gap-2">
            {(field.type === "yes_no" ? ["yes", "no"] : ["yes", "no", "unsure"]).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => set({ value: o })}
                className={`px-3 py-1.5 rounded-lg text-sm border capitalize ${
                  v.value === o
                    ? "bg-teal-400/15 border-teal-400/50 text-teal-200"
                    : "bg-white/[0.03] border-white/10 text-white/70"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {field.type === "composite" &&
          (field.subFields || []).map((s) => (
            <div key={s.key}>
              <span className="text-xs text-white/60">{s.label}</span>
              <input
                className={`${inputCls} mt-1`}
                placeholder={s.placeholder}
                value={v.value?.[s.key] ?? ""}
                onChange={(e) => set({ value: { ...(v.value || {}), [s.key]: e.target.value } })}
              />
            </div>
          ))}

        {field.type === "tree_repeater" && (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="rounded-lg border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Tree {i + 1}</span>
                  <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>
                <input
                  className={inputCls}
                  placeholder="Species (or leave as Unknown)"
                  value={r.species ?? ""}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, species: e.target.value } : x)))}
                />
                <input
                  className={inputCls}
                  placeholder="Estimated distance from proposed structure (m)"
                  value={r.distance_m ?? ""}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, distance_m: e.target.value } : x)))}
                />
                <select
                  className={inputCls}
                  value={r.height_band ?? "Unknown"}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, height_band: e.target.value } : x)))}
                >
                  {TREE_HEIGHT_BANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows([...rows, { species: "Unknown", distance_m: "", height_band: "Unknown" }])}
              className="inline-flex items-center gap-1.5 text-sm text-teal-200"
            >
              <Plus className="w-4 h-4" /> Add tree
            </button>
          </div>
        )}

        {field.type === "manhole_repeater" && (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="rounded-lg border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Manhole {i + 1}</span>
                  <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>
                <input
                  className={inputCls}
                  placeholder="Rough location (e.g. 2m off rear elevation, left of patio)"
                  value={r.location ?? ""}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, location: e.target.value } : x)))}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows([...rows, { location: "" }])}
              className="inline-flex items-center gap-1.5 text-sm text-teal-200"
            >
              <Plus className="w-4 h-4" /> Add manhole
            </button>
          </div>
        )}

        {field.type === "locked_flag" && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-100">{field.locked?.note}</p>
                <p className="mt-1 text-xs text-amber-200/70">
                  This cannot be changed to "confirmed suitable" during capture — that requires an actual test result.
                </p>
              </div>
            </div>
            <textarea
              rows={3}
              className={`${inputCls} mt-3`}
              placeholder="Observation notes (optional)"
              value={v.notes ?? ""}
              onChange={(e) => set({ notes: e.target.value, value: "unverified" })}
            />
          </div>
        )}

        {field.proximityFlag && (
          <div className="rounded-lg border border-white/10 p-3">
            <span className="text-xs text-white/70">{field.proximityFlag.label}</span>
            <div className="flex gap-2 mt-2">
              {["yes", "no", "unsure"].map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => set({ [field.proximityFlag!.key]: o })}
                  className={`px-3 py-1.5 rounded-lg text-sm border capitalize ${
                    v[field.proximityFlag!.key] === o
                      ? "bg-teal-400/15 border-teal-400/50 text-teal-200"
                      : "bg-white/[0.03] border-white/10 text-white/70"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            {field.proximityFlag.warnOn.includes(v[field.proximityFlag.key]) && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 p-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-100">{field.proximityFlag.warning}</p>
              </div>
            )}
          </div>
        )}

        {field.photo && field.photo !== "none" && (
          <PhotoField surveyId={surveyId} fieldKey={field.key} requirement={field.photo} />
        )}
      </div>
    </div>
  );
}
