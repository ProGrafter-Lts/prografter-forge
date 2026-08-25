import { useState } from "react";
import TradeSidebar from "@/components/trade/TradeSidebar";
import {
  DEFAULT_DIMENSIONS,
  DEFAULT_RATES,
  runSubstructureTakeoff,
  type AccessType,
  type GroundworksDimensions,
  type GroundworksInputs,
  type GroundworksRates,
  type MuckAwayBasis,
  type SoilType,
  type TakeoffResult,
} from "@/lib/groundworksEngine";

const SOIL_TYPES: SoilType[] = ["Clay", "Sand & Gravel", "Rock", "Made Ground"];
const ACCESS_TYPES: AccessType[] = [
  "8-Wheel Grab Direct Access",
  "Narrow Access Skip Only",
  "Conveyor Required",
];

const inputClass =
  "w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 font-mono text-sm text-white/90 placeholder:text-white/35 focus:outline-none focus:border-[#1AC2BA]";
const labelClass =
  "block font-mono text-[11px] uppercase tracking-wider text-white/55 mb-1.5";

const money = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 });

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className={labelClass}>{label}</span>
    {children}
  </div>
);

const SiteScoutSandbox = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [inputs, setInputs] = useState<GroundworksInputs>({
    projectRef: "TEST-01-SMEDLEY",
    trenchLength: 24.5,
    soilType: "Clay",
    treeProximity: 6.5,
    treeSpecies: "Oak",
    accessType: "8-Wheel Grab Direct Access",
    drainageInvertBaseline: 1.0,
    notes: "",
  });
  const [rates, setRates] = useState<GroundworksRates>({ ...DEFAULT_RATES });
  const [dims, setDims] = useState<GroundworksDimensions>({ ...DEFAULT_DIMENSIONS });
  const [basis, setBasis] = useState<MuckAwayBasis>("volume");

  const [status, setStatus] = useState<"idle" | "analyzing" | "verified">("idle");
  const [result, setResult] = useState<TakeoffResult | null>(null);

  const set = <K extends keyof GroundworksInputs>(key: K, value: GroundworksInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const runTakeoff = () => {
    setStatus("analyzing");
    const next = runSubstructureTakeoff(inputs, rates, dims, basis);
    window.setTimeout(() => {
      setResult(next);
      setStatus("verified");
    }, 350);
  };

  return (
    <div className="min-h-screen dashboard-dark flex">
      <TradeSidebar
        activeNav="sitescout-sandbox"
        setActiveNav={() => {}}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main
        className="flex-1 overflow-auto"
        style={{
          background:
            "radial-gradient(1100px 560px at 10% -10%, rgba(20,168,161,0.10), transparent 60%), #0B1B30",
        }}
      >
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 pt-14 md:pt-10 pb-24">
          <div className="mb-8">
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-[#1AC2BA] border border-[#1AC2BA]/40 rounded px-2 py-0.5 mb-3">
              Internal Beta · Sandbox
            </span>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              SiteScout Agent Engine — Phase 1 (Ian: Groundworks &amp; Civils)
            </h1>
            <p className="font-mono text-sm text-white/55 mt-2 max-w-3xl">
              Isolated workbench for stress-testing the first specialist trade agent and calibrating
              groundworks maths against real job data. Nothing here writes to live quoting tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT — inputs */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
              <h2 className="font-heading text-lg font-bold text-white mb-5">
                SiteScout Survey Inputs &amp; Drawing Metrics
              </h2>

              <div className="space-y-4">
                <Field label="Project Reference">
                  <input
                    className={inputClass}
                    value={inputs.projectRef}
                    onChange={(e) => set("projectRef", e.target.value)}
                  />
                </Field>

                <Field label="Drawing Perimeter / Trench Run (lm)">
                  <input
                    type="number"
                    step="0.1"
                    className={inputClass}
                    value={inputs.trenchLength}
                    onChange={(e) => set("trenchLength", Number(e.target.value))}
                  />
                </Field>

                <Field label="Soil Type">
                  <select
                    className={inputClass}
                    value={inputs.soilType}
                    onChange={(e) => set("soilType", e.target.value as SoilType)}
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s} className="bg-[#0B1B30]">
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tree Proximity (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={inputs.treeProximity}
                      onChange={(e) => set("treeProximity", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Tree Species">
                    <input
                      className={inputClass}
                      value={inputs.treeSpecies}
                      onChange={(e) => set("treeSpecies", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Site Access Type">
                  <select
                    className={inputClass}
                    value={inputs.accessType}
                    onChange={(e) => set("accessType", e.target.value as AccessType)}
                  >
                    {ACCESS_TYPES.map((a) => (
                      <option key={a} value={a} className="bg-[#0B1B30]">
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Drainage Invert Baseline (m)">
                  <input
                    type="number"
                    step="0.1"
                    className={inputClass}
                    value={inputs.drainageInvertBaseline}
                    onChange={(e) => set("drainageInvertBaseline", Number(e.target.value))}
                  />
                </Field>

                <Field label="Surveyor Notes / Audio Transcript">
                  <textarea
                    rows={5}
                    className={inputClass}
                    placeholder="Paste transcript or type site observations…"
                    value={inputs.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
              </div>

              {/* Editable rates & dimensions */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-white/55 mb-4">
                  Calibration — rates &amp; dimensional constants
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Excavation & Muck-Away (£/m³)">
                    <input
                      type="number"
                      step="0.5"
                      className={inputClass}
                      value={rates.excavationPerM3}
                      onChange={(e) =>
                        setRates({ ...rates, excavationPerM3: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="8-Wheel Grab Load (£/load)">
                    <input
                      type="number"
                      step="1"
                      className={inputClass}
                      value={rates.grabLoadRate}
                      onChange={(e) => setRates({ ...rates, grabLoadRate: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="GEN3/C20 Concrete (£/m³)">
                    <input
                      type="number"
                      step="1"
                      className={inputClass}
                      value={rates.concretePerM3}
                      onChange={(e) => setRates({ ...rates, concretePerM3: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="7N Trench Block (£/unit)">
                    <input
                      type="number"
                      step="0.05"
                      className={inputClass}
                      value={rates.trenchBlockRate}
                      onChange={(e) =>
                        setRates({ ...rates, trenchBlockRate: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Clayboard (£/lm)">
                    <input
                      type="number"
                      step="0.5"
                      className={inputClass}
                      value={rates.clayboardPerLm}
                      onChange={(e) =>
                        setRates({ ...rates, clayboardPerLm: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Muck-Away Cost Basis">
                    <select
                      className={inputClass}
                      value={basis}
                      onChange={(e) => setBasis(e.target.value as MuckAwayBasis)}
                    >
                      <option value="volume" className="bg-[#0B1B30]">
                        Per m³ (bulked)
                      </option>
                      <option value="grab_loads" className="bg-[#0B1B30]">
                        Per grab load
                      </option>
                    </select>
                  </Field>
                  <Field label="Trench Width (m)">
                    <input
                      type="number"
                      step="0.05"
                      className={inputClass}
                      value={dims.trenchWidth}
                      onChange={(e) => setDims({ ...dims, trenchWidth: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Concrete Pour Thickness (m)">
                    <input
                      type="number"
                      step="0.05"
                      className={inputClass}
                      value={dims.concretePourThickness}
                      onChange={(e) =>
                        setDims({ ...dims, concretePourThickness: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Bulking Factor (×)">
                    <input
                      type="number"
                      step="0.05"
                      className={inputClass}
                      value={dims.bulkingFactor}
                      onChange={(e) => setDims({ ...dims, bulkingFactor: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Grab Wagon Capacity (m³)">
                    <input
                      type="number"
                      step="0.5"
                      className={inputClass}
                      value={dims.grabWagonCapacity}
                      onChange={(e) =>
                        setDims({ ...dims, grabWagonCapacity: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>
              </div>

              <button
                type="button"
                onClick={runTakeoff}
                className="mt-6 w-full rounded-xl px-5 py-3.5 font-mono text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1AC2BA", color: "#04202B" }}
              >
                🚜 Run Ian's Substructure Takeoff
              </button>
            </section>

            {/* RIGHT — Ian's audit */}
            <section className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: "rgba(26,194,186,0.15)" }}
                >
                  🚜
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-bold text-white">Ian</h2>
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={
                        status === "verified"
                          ? { backgroundColor: "#bbf7d0", color: "#14532d" }
                          : status === "analyzing"
                            ? { backgroundColor: "#fde68a", color: "#78350f" }
                            : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }
                      }
                    >
                      {status === "verified"
                        ? "Takeoff Verified"
                        : status === "analyzing"
                          ? "Analyzing"
                          : "Standing by"}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-white/55 mt-1">
                    Groundworks &amp; Heavy Civils Lead · Substructure Phase 1
                  </p>
                </div>
              </div>

              {!result ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center font-mono text-sm text-white/45">
                  Run a takeoff to see Ian's regulation audit and bill of quantities.
                </div>
              ) : (
                <>
                  {/* Regulation audit */}
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: result.clayboardRequired
                        ? "rgba(245,158,11,0.45)"
                        : "rgba(26,194,186,0.35)",
                      backgroundColor: result.clayboardRequired
                        ? "rgba(245,158,11,0.10)"
                        : "rgba(26,194,186,0.08)",
                    }}
                  >
                    <h3 className="font-heading text-base font-bold text-white mb-1">
                      Regulation &amp; Safety Audit
                    </h3>
                    <p className="font-mono text-xs text-white/60 mb-3">
                      Building Regs Part A (structure) · Part C (ground &amp; moisture) · NHBC 4.2
                      (building near trees) — design dig depth {result.digDepth.toFixed(2)}m
                      {result.clayboardRequired ? " (deepened)" : " (standard baseline)"}.
                    </p>
                    <ul className="space-y-2">
                      {result.auditNotes.map((note, i) => (
                        <li key={i} className="font-mono text-xs text-white/80 leading-relaxed">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* BOQ */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
                    <h3 className="font-heading text-base font-bold text-white mb-4">
                      Substructure Bill of Quantities — {inputs.projectRef || "Untitled"}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                            <th className="py-2 pr-3">Phase</th>
                            <th className="py-2 pr-3">Item Description</th>
                            <th className="py-2 pr-3">Formula / Metric</th>
                            <th className="py-2 pr-3 text-right">Qty</th>
                            <th className="py-2 pr-3">Unit</th>
                            <th className="py-2 pr-3 text-right">Unit Rate (£)</th>
                            <th className="py-2 text-right">Total (£)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.boq.map((line, i) => (
                            <tr key={i} className="border-t border-white/10 align-top">
                              <td className="py-3 pr-3 font-mono text-xs text-white/60 whitespace-nowrap">
                                {line.phase}
                              </td>
                              <td className="py-3 pr-3 font-mono text-xs text-white/90">
                                {line.description}
                              </td>
                              <td className="py-3 pr-3 font-mono text-[11px] text-white/50">
                                {line.formula}
                              </td>
                              <td className="py-3 pr-3 font-mono text-xs text-white/90 text-right whitespace-nowrap">
                                {line.quantity}
                              </td>
                              <td className="py-3 pr-3 font-mono text-xs text-white/60 whitespace-nowrap">
                                {line.unit}
                              </td>
                              <td className="py-3 pr-3 font-mono text-xs text-white/80 text-right whitespace-nowrap">
                                {line.rate.toFixed(2)}
                              </td>
                              <td className="py-3 font-mono text-xs font-semibold text-white text-right whitespace-nowrap">
                                {line.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: "Raw Dig Volume",
                        value: `${result.rawDigVolume} m³`,
                        sub: `${inputs.trenchLength} lm × ${dims.trenchWidth} m × ${result.digDepth} m`,
                      },
                      {
                        label: "Bulked Spoil / Grab Loads",
                        value: `${result.bulkedMuckVolume} m³`,
                        sub: `${result.grabWagonLoads} × ${dims.grabWagonCapacity} m³ grab loads (${dims.bulkingFactor}× bulking)`,
                      },
                      {
                        label: "Ready-Mix Concrete",
                        value: `${result.concreteVolume} m³`,
                        sub: `GEN3/C20 · ${dims.concretePourThickness} m pour · ${result.trenchBlocksQty} trench blocks`,
                      },
                      {
                        label: "Total Substructure Phase Net Cost",
                        value: money(result.netCost),
                        sub: "Net of VAT, prelims, overhead & profit",
                        highlight: true,
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="rounded-2xl border p-5"
                        style={{
                          borderColor: card.highlight ? "rgba(26,194,186,0.45)" : "rgba(255,255,255,0.1)",
                          backgroundColor: card.highlight
                            ? "rgba(26,194,186,0.10)"
                            : "rgba(255,255,255,0.04)",
                        }}
                      >
                        <p className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-2">
                          {card.label}
                        </p>
                        <p className="font-heading text-2xl font-bold text-white">{card.value}</p>
                        <p className="font-mono text-[11px] text-white/50 mt-1.5">{card.sub}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SiteScoutSandbox;
