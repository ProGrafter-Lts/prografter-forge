import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";

import { loadInjection, type SiteScoutInjection } from "@/lib/drawingDelta";

const STEPS = ["Ground & Geo", "Access & Logistics", "Existing Services", "Handover"];

const SOILS = ["Clay", "Sand & Gravel", "Chalk", "Rock", "Made Ground"];
const SPECIES = ["Oak", "Willow", "Poplar", "Elm", "Eucalyptus", "Sycamore", "Ash", "Other / Unknown"];
const UNITS = ["Plastic pre-2016", "Metal AMD3", "Rewirable Fuses"];
const BOILERS = ["Combi", "System", "Regular"];

interface SurveyState {
  soil: string;
  treesNearby: boolean;
  treeDistance: string;
  treeSpecies: string;
  invertDepth: string;
  accessWidth: string;
  distanceToHighway: string;
  overheadCables: boolean;
  consumerUnit: string;
  spareWays: string;
  boilerType: string;
  boilerKw: string;
}

const INITIAL: SurveyState = {
  soil: "",
  treesNearby: false,
  treeDistance: "",
  treeSpecies: "",
  invertDepth: "",
  accessWidth: "",
  distanceToHighway: "",
  overheadCables: false,
  consumerUnit: "",
  spareWays: "",
  boilerType: "",
  boilerKw: "",
};

const fieldCls =
  "w-full rounded-xl bg-white/[0.05] border border-white/15 px-4 py-4 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-teal-400/60";
const labelCls = "block text-sm font-medium text-white/90 mb-2";

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[true, false].map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-xl border px-4 py-4 text-base font-medium transition ${
            value === opt
              ? "bg-teal-400/15 border-teal-400/60 text-teal-200"
              : "bg-white/[0.04] border-white/15 text-white/70"
          }`}
        >
          {opt ? "Yes" : "No"}
        </button>
      ))}
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
  const [s, setS] = useState<SurveyState>(INITIAL);
  const set = (patch: Partial<SurveyState>) => setS((p) => ({ ...p, ...patch }));

  const narrowAccess = s.accessWidth !== "" && Number(s.accessWidth) < 1.2;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur border-b border-white/10 px-4 pt-5 pb-4">
        <h1 className="text-lg font-semibold tracking-tight">Live SiteScout Guided Survey</h1>
        <p className="text-xs text-white/50 mt-0.5">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition ${
                  i < step ? "bg-teal-400" : i === step ? "bg-teal-300" : "bg-white/12"
                }`}
              />
              <span
                className={`mt-1.5 block text-[10px] leading-tight ${
                  i <= step ? "text-teal-200/80" : "text-white/35"
                }`}
              >
                {i + 1}. {label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-5 max-w-xl w-full mx-auto">
        {step === 0 && (
          <>
            <div>
              <label className={labelCls}>Soil classification</label>
              <select className={fieldCls} value={s.soil} onChange={(e) => set({ soil: e.target.value })}>
                <option value="">Select soil type…</option>
                {SOILS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Mature trees in proximity?</label>
              <Toggle value={s.treesNearby} onChange={(v) => set({ treesNearby: v })} />
            </div>

            {s.treesNearby && (
              <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <label className={labelCls}>Distance to nearest tree (m)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className={fieldCls}
                    placeholder="e.g. 6.5"
                    value={s.treeDistance}
                    onChange={(e) => set({ treeDistance: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Species</label>
                  <select
                    className={fieldCls}
                    value={s.treeSpecies}
                    onChange={(e) => set({ treeSpecies: e.target.value })}
                  >
                    <option value="">Select species…</option>
                    {SPECIES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Existing drainage invert depth (m)</label>
              <input
                type="number"
                inputMode="decimal"
                className={fieldCls}
                placeholder="e.g. 1.0"
                value={s.invertDepth}
                onChange={(e) => set({ invertDepth: e.target.value })}
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className={labelCls}>Clear access width (m)</label>
              <input
                type="number"
                inputMode="decimal"
                className={fieldCls}
                placeholder="e.g. 2.8"
                value={s.accessWidth}
                onChange={(e) => set({ accessWidth: e.target.value })}
              />
              {narrowAccess && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-100">
                    Access below 1.2m — micro-plant and skip-only muck-away will be required. Allow barrow runs and
                    extended durations.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Distance from highway to dig site (m)</label>
              <input
                type="number"
                inputMode="decimal"
                className={fieldCls}
                placeholder="e.g. 12"
                value={s.distanceToHighway}
                onChange={(e) => set({ distanceToHighway: e.target.value })}
              />
            </div>

            <div>
              <label className={labelCls}>Overhead cables or obstructions?</label>
              <Toggle value={s.overheadCables} onChange={(v) => set({ overheadCables: v })} />
              {s.overheadCables && (
                <p className="mt-3 text-xs text-amber-200/80">
                  GS6 exclusion zone applies — machine height restricted and DNO consultation required.
                </p>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className={labelCls}>Existing consumer unit</label>
              <select
                className={fieldCls}
                value={s.consumerUnit}
                onChange={(e) => set({ consumerUnit: e.target.value })}
              >
                <option value="">Select board type…</option>
                {UNITS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Spare breaker ways available</label>
              <input
                type="number"
                inputMode="numeric"
                className={fieldCls}
                placeholder="e.g. 2"
                value={s.spareWays}
                onChange={(e) => set({ spareWays: e.target.value })}
              />
            </div>

            <div>
              <label className={labelCls}>Existing boiler setup</label>
              <select className={fieldCls} value={s.boilerType} onChange={(e) => set({ boilerType: e.target.value })}>
                <option value="">Select boiler type…</option>
                {BOILERS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Boiler output (kW)</label>
              <input
                type="number"
                inputMode="decimal"
                className={fieldCls}
                placeholder="e.g. 24"
                value={s.boilerKw}
                onChange={(e) => set({ boilerKw: e.target.value })}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-300" />
              <h2 className="text-base font-semibold">SiteScout Summary</h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Ground & Geotechnical</p>
              <Row label="Soil classification" value={s.soil} />
              <Row label="Mature trees nearby" value={s.treesNearby ? "Yes" : "No"} />
              {s.treesNearby && <Row label="Tree distance" value={s.treeDistance ? `${s.treeDistance} m` : ""} />}
              {s.treesNearby && <Row label="Species" value={s.treeSpecies} />}
              <Row label="Drainage invert depth" value={s.invertDepth ? `${s.invertDepth} m` : ""} />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Access & Logistics</p>
              <Row label="Clear access width" value={s.accessWidth ? `${s.accessWidth} m` : ""} />
              <Row label="Distance from highway" value={s.distanceToHighway ? `${s.distanceToHighway} m` : ""} />
              <Row label="Overhead cables" value={s.overheadCables ? "Yes" : "No"} />
              {narrowAccess && <Row label="Plant strategy" value="Micro-plant / skip only" />}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Existing MEP Services</p>
              <Row label="Consumer unit" value={s.consumerUnit} />
              <Row label="Spare ways" value={s.spareWays} />
              <Row label="Boiler setup" value={s.boilerType} />
              <Row label="Boiler output" value={s.boilerKw ? `${s.boilerKw} kW` : ""} />
            </div>

            <button
              type="button"
              onClick={() => toast.success("SiteScout data captured and ready for Engine processing.")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-4 text-base font-semibold text-[#0f172a] hover:bg-teal-300 transition"
            >
              <Send className="w-4 h-4" /> Transmit to ProGrafter Engine
            </button>
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
            disabled={step === STEPS.length - 1}
            onClick={() => setStep((v) => Math.min(STEPS.length - 1, v + 1))}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-4 text-base font-medium text-white disabled:opacity-35"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
