import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";

import { loadInjection, type SiteScoutCategoryKey, type SiteScoutInjection } from "@/lib/drawingDelta";

/* ------------------------------------------------------------------ *
 * The detailed 12-category SiteScout structure.
 * Delta clashes are NOT a category — they overlay the category they
 * belong to (see injectedFor()).
 * ------------------------------------------------------------------ */

type FieldType = "text" | "textarea" | "number" | "select" | "yes_no";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  hint?: string;
  unit?: string;
}

interface CategoryDef {
  key: SiteScoutCategoryKey;
  title: string;
  blurb: string;
  fields: FieldDef[];
}

export const SITESCOUT_CATEGORIES: CategoryDef[] = [
  {
    key: "ground_conditions",
    title: "Ground conditions",
    blurb: "Soil, made ground and anything that drives foundation depth.",
    fields: [
      {
        key: "soil",
        label: "Soil classification",
        type: "select",
        options: ["Clay", "Sand & Gravel", "Chalk", "Rock", "Made Ground", "Unknown"],
      },
      { key: "foundation_depth", label: "Observed / assumed foundation depth", type: "number", unit: "m" },
      { key: "trial_hole", label: "Trial hole or site investigation available?", type: "yes_no" },
      { key: "ground_notes", label: "Ground observations", type: "textarea", placeholder: "Spoil, water table, fill…" },
    ],
  },
  {
    key: "trees",
    title: "Trees & NHBC 4.2",
    blurb: "Species and proximity drive NHBC Chapter 4.2 foundation depth.",
    fields: [
      { key: "trees_present", label: "Mature trees on or near the site?", type: "yes_no" },
      {
        key: "tree_species",
        label: "Nearest tree species",
        type: "select",
        options: ["Oak", "Willow", "Poplar", "Elm", "Eucalyptus", "Sycamore", "Ash", "Other / Unknown"],
      },
      { key: "tree_distance", label: "Distance to works", type: "number", unit: "m" },
      { key: "tree_height", label: "Approx. mature height", type: "select", options: ["Under 5m", "5–10m", "10–15m", "Over 15m", "Unknown"] },
    ],
  },
  {
    key: "drainage",
    title: "Drainage",
    blurb: "Manholes, foul/surface split and invert depths.",
    fields: [
      { key: "manholes", label: "Manhole positions & condition", type: "textarea" },
      { key: "foul_surface", label: "Foul / surface water arrangement", type: "select", options: ["Separate", "Combined", "Unknown"] },
      { key: "invert_depth", label: "Existing invert depth", type: "number", unit: "m" },
      { key: "build_over", label: "Build-over or diversion required?", type: "yes_no" },
    ],
  },
  {
    key: "alteration_area",
    title: "Alteration area",
    blurb: "The structural opening / wall removal zone.",
    fields: [
      { key: "alteration_desc", label: "Alteration area description", type: "textarea" },
      { key: "wall_status", label: "Wall to be removed — load-bearing?", type: "select", options: ["Load-bearing", "Non load-bearing", "Unconfirmed"] },
      { key: "clear_opening", label: "Measured clear opening width", type: "number", unit: "m" },
      { key: "temp_works", label: "Temporary propping / needling required?", type: "yes_no" },
    ],
  },
  {
    key: "ext_services",
    title: "Incoming services",
    blurb: "Meter positions and proximity to the dig.",
    fields: [
      { key: "electric_meter", label: "Electric meter position", type: "text" },
      { key: "gas_meter", label: "Gas meter position", type: "text" },
      { key: "stop_tap", label: "Stop tap location", type: "text" },
      { key: "within_3m", label: "Any service within 3m of the dig area?", type: "yes_no" },
    ],
  },
  {
    key: "existing_services",
    title: "Existing services",
    blurb: "Boiler and heating provision serving the works.",
    fields: [
      { key: "boiler_type", label: "Existing boiler type", type: "select", options: ["Combi", "System", "Regular", "None"] },
      { key: "boiler_kw", label: "Boiler output", type: "number", unit: "kW" },
      { key: "boiler_notes", label: "Boiler position / age notes", type: "textarea" },
    ],
  },
  {
    key: "electrical",
    title: "Electrical",
    blurb: "Consumer unit, spare ways and proposed new loads.",
    fields: [
      { key: "consumer_unit", label: "Consumer unit type", type: "select", options: ["Plastic pre-2016", "Metal AMD3", "Rewirable Fuses", "Unknown"] },
      { key: "spare_ways", label: "Spare breaker ways", type: "number" },
      { key: "earthing", label: "Earthing arrangement observations", type: "text" },
      { key: "new_loads", label: "Proposed new loads", type: "textarea", placeholder: "Kitchen, EV, heating…" },
    ],
  },
  {
    key: "roof",
    title: "Roof",
    blurb: "Covering, pitch and junction detailing.",
    fields: [
      { key: "roof_type", label: "Roof type", type: "select", options: ["Pitched", "Flat"] },
      { key: "covering", label: "Tile / membrane type, colour & profile", type: "text" },
      { key: "junctions", label: "Ridge, hip, valley or upstand notes", type: "textarea" },
    ],
  },
  {
    key: "roofline",
    title: "Soffit, fascia & guttering",
    blurb: "Material matching for the roofline run.",
    fields: [
      { key: "roofline_type", label: "Covering type", type: "text", placeholder: "e.g. uPVC fascia, ventilated soffit" },
      { key: "roofline_colour", label: "Colour", type: "text" },
      { key: "downpipe", label: "Downpipe type", type: "text", placeholder: "e.g. 68mm round uPVC, black" },
    ],
  },
  {
    key: "access",
    title: "Access & logistics",
    blurb: "Plant accessibility, muck-away and storage.",
    fields: [
      { key: "access_width", label: "Clear access width", type: "number", unit: "m" },
      { key: "highway_distance", label: "Distance from highway to dig", type: "number", unit: "m" },
      { key: "overhead", label: "Overhead cables or obstructions?", type: "yes_no" },
      { key: "skip_storage", label: "Skip & material storage location", type: "textarea" },
    ],
  },
  {
    key: "sequencing",
    title: "Sequencing",
    blurb: "What must happen first, and why.",
    fields: [
      { key: "sequence_notes", label: "Critical sequence", type: "textarea" },
      { key: "occupied", label: "Property occupied during works?", type: "yes_no" },
      { key: "restrictions", label: "Working hour or noise restrictions", type: "text" },
    ],
  },
  {
    key: "handover",
    title: "Handover & review",
    blurb: "Confirm everything captured, then transmit.",
    fields: [],
  },
];

const fieldCls =
  "w-full rounded-xl bg-white/[0.05] border border-white/15 px-4 py-4 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-teal-400/60";
const labelCls = "block text-sm font-medium text-white/90 mb-2";

type Values = Record<string, string>;

function Toggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {["Yes", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-xl border px-4 py-4 text-base font-medium transition ${
            value === opt
              ? "bg-teal-400/15 border-teal-400/60 text-teal-200"
              : "bg-white/[0.04] border-white/15 text-white/70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Field({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>
        {def.label}
        {def.unit ? ` (${def.unit})` : ""}
      </label>
      {def.hint && <p className="mb-2 text-[11px] text-white/45">{def.hint}</p>}
      {def.type === "yes_no" ? (
        <Toggle value={value} onChange={onChange} />
      ) : def.type === "select" ? (
        <select className={fieldCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(def.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : def.type === "textarea" ? (
        <textarea
          rows={3}
          className={fieldCls}
          placeholder={def.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={def.type === "number" ? "number" : "text"}
          inputMode={def.type === "number" ? "decimal" : "text"}
          className={fieldCls}
          placeholder={def.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-3 last:border-0">
      <span className="text-sm text-white/55">{label}</span>
      <span className="text-sm text-white text-right font-medium">{value || "—"}</span>
    </div>
  );
}

export default function SiteScoutV2() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({});
  const set = (key: string, v: string) => setValues((p) => ({ ...p, [key]: v }));

  const [injection, setInjection] = useState<SiteScoutInjection | null>(null);
  const [deltaAnswers, setDeltaAnswers] = useState<Record<string, string>>({});
  useEffect(() => setInjection(loadInjection()), []);

  const checks = injection?.checks ?? [];
  const injectedFor = useMemo(
    () => (key: SiteScoutCategoryKey) => checks.filter((c) => c.category === key),
    [checks],
  );
  const outstanding = checks.filter((c) => !(deltaAnswers[c.id] ?? "").trim());

  const category = SITESCOUT_CATEGORIES[step];
  const isLast = step === SITESCOUT_CATEGORIES.length - 1;

  const narrowAccess = values.access_width !== undefined && values.access_width !== "" && Number(values.access_width) < 1.2;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur border-b border-white/10 px-4 pt-5 pb-4">
        <h1 className="text-lg font-semibold tracking-tight">Live SiteScout Guided Survey</h1>
        <p className="text-xs text-white/50 mt-0.5">
          Category {step + 1} of {SITESCOUT_CATEGORIES.length} · {category.title}
        </p>
        <div className="mt-3 flex gap-1">
          {SITESCOUT_CATEGORIES.map((c, i) => {
            const flagged = injectedFor(c.key).length > 0;
            return (
              <button
                key={c.key}
                type="button"
                aria-label={c.title}
                onClick={() => setStep(i)}
                className={`h-1.5 flex-1 rounded-full transition ${
                  flagged ? "bg-orange-400/80" : i < step ? "bg-teal-400" : i === step ? "bg-teal-300" : "bg-white/12"
                } ${i === step ? "ring-1 ring-white/50" : ""}`}
              />
            );
          })}
        </div>
        {outstanding.length > 0 && (
          <p className="mt-2 text-[11px] text-orange-200/80">
            {outstanding.length} Delta Engine check{outstanding.length === 1 ? "" : "s"} outstanding — see the
            highlighted categories.
          </p>
        )}
      </header>

      <main className="flex-1 px-4 py-6 space-y-5 max-w-xl w-full mx-auto">
        <div>
          <h2 className="text-base font-semibold">{category.title}</h2>
          <p className="mt-0.5 text-xs text-white/45">{category.blurb}</p>
        </div>

        {/* Delta clashes pinned to the top of their own category */}
        {injectedFor(category.key).map((c) => (
          <div key={c.id} className="rounded-xl border border-orange-400/45 bg-orange-400/[0.08] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-300 shrink-0" />
              <h3 className="text-sm font-semibold text-orange-100">Delta clash · {c.label}</h3>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-orange-100/80">{c.question}</p>
            <input
              className={`${fieldCls} mt-3`}
              placeholder="Record what you measured on site…"
              value={deltaAnswers[c.id] ?? ""}
              onChange={(e) => setDeltaAnswers((p) => ({ ...p, [c.id]: e.target.value }))}
            />
            <p className="mt-1 font-mono text-[10px] text-white/40">
              {injection?.projectName} · {c.context}
            </p>
          </div>
        ))}

        {!isLast &&
          category.fields.map((f) => (
            <Field key={f.key} def={f} value={values[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
          ))}

        {category.key === "access" && narrowAccess && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-100">
              Access below 1.2m — micro-plant and skip-only muck-away will be required. Allow barrow runs and
              extended durations.
            </p>
          </div>
        )}
        {category.key === "access" && values.overhead === "Yes" && (
          <p className="text-xs text-amber-200/80">
            GS6 exclusion zone applies — machine height restricted and DNO consultation required.
          </p>
        )}
        {category.key === "trees" && values.trees_present === "Yes" && (
          <p className="text-xs text-amber-200/80">
            NHBC Chapter 4.2 applies — soil type and precaution category must be assessed before foundation design
            is finalised.
          </p>
        )}

        {isLast && (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-300" />
              <h2 className="text-base font-semibold">SiteScout Summary</h2>
            </div>

            {SITESCOUT_CATEGORIES.filter((c) => c.fields.length > 0).map((c) => (
              <div key={c.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">{c.title}</p>
                {c.fields.map((f) => (
                  <Row
                    key={f.key}
                    label={f.label}
                    value={values[f.key] ? `${values[f.key]}${f.unit ? ` ${f.unit}` : ""}` : ""}
                  />
                ))}
                {injectedFor(c.key).map((chk) => (
                  <Row key={chk.id} label={`Δ ${chk.label}`} value={deltaAnswers[chk.id] ?? ""} />
                ))}
              </div>
            ))}

            <button
              type="button"
              disabled={outstanding.length > 0}
              onClick={() => toast.success("SiteScout data captured and ready for Engine processing.")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-4 text-base font-semibold text-[#0f172a] hover:bg-teal-300 transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" /> Transmit to ProGrafter Engine
            </button>
            {outstanding.length > 0 && (
              <p className="text-center text-[11px] text-orange-200/80">
                Outstanding Delta checks in:{" "}
                {Array.from(
                  new Set(
                    outstanding.map(
                      (c) => SITESCOUT_CATEGORIES.find((cat) => cat.key === c.category)?.title ?? c.category,
                    ),
                  ),
                ).join(", ")}
                .
              </p>
            )}
          </>
        )}
      </main>

      <footer className="sticky bottom-0 bg-[#0f172a]/95 backdrop-blur border-t border-white/10 px-4 py-4">
        <div className="max-w-xl mx-auto flex gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((v) => Math.max(0, v - 1))}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-4 text-base text-white/80 disabled:opacity-35"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => setStep((v) => Math.min(SITESCOUT_CATEGORIES.length - 1, v + 1))}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-4 text-base font-medium text-white disabled:opacity-35"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
