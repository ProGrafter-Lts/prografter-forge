import { useState } from "react";
import TradeSidebar from "@/components/trade/TradeSidebar";
import {
  DEFAULT_DIMENSIONS,
  DEFAULT_RATES,
  runSubstructureTakeoff,
  type AccessType,
  type BoqLine,
  type GroundworksDimensions,
  type GroundworksInputs,
  type GroundworksRates,
  type MuckAwayBasis,
  type SoilType,
  type TakeoffResult,
} from "@/lib/groundworksEngine";
import {
  DEFAULT_SUPER_DIMENSIONS,
  DEFAULT_SUPER_INPUTS,
  DEFAULT_SUPER_RATES,
  runSuperstructureTakeoff,
  type BrickFormat,
  type RoofCovering,
  type RoofType,
  type SuperstructureDimensions,
  type SuperstructureInputs,
  type SuperstructureRates,
  type SuperstructureResult,
} from "@/lib/superstructureEngine";

const SOIL_TYPES: SoilType[] = ["Clay", "Sand & Gravel", "Rock", "Made Ground"];
const ACCESS_TYPES: AccessType[] = [
  "8-Wheel Grab Direct Access",
  "Narrow Access Skip Only",
  "Conveyor Required",
];
const BRICK_FORMATS: BrickFormat[] = ["65mm Metric (60/m²)", "73mm Imperial (52/m²)"];
const ROOF_TYPES: RoofType[] = [
  "Duo-Pitch Gable (30°)",
  "Mono-Pitch Lean-To (15°)",
  "Flat Roof GRP/Warm Roof",
];
const ROOF_COVERINGS: RoofCovering[] = [
  "Interlocking Concrete Pantiles",
  "Natural Slate",
  "Plain Clay Tiles",
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

  const [superInputs, setSuperInputs] = useState<SuperstructureInputs>({
    ...DEFAULT_SUPER_INPUTS,
  });
  const [superRates, setSuperRates] = useState<SuperstructureRates>({ ...DEFAULT_SUPER_RATES });
  const [superDims, setSuperDims] = useState<SuperstructureDimensions>({
    ...DEFAULT_SUPER_DIMENSIONS,
  });

  const [status, setStatus] = useState<"idle" | "analyzing" | "verified">("idle");
  const [result, setResult] = useState<TakeoffResult | null>(null);
  const [superResult, setSuperResult] = useState<SuperstructureResult | null>(null);

  const set = <K extends keyof GroundworksInputs>(key: K, value: GroundworksInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));
  const setSuper = <K extends keyof SuperstructureInputs>(key: K, value: SuperstructureInputs[K]) =>
    setSuperInputs((prev) => ({ ...prev, [key]: value }));

  const runTakeoff = () => {
    setStatus("analyzing");
    const next = runSubstructureTakeoff(inputs, rates, dims, basis);
    // Caleb inherits the foundation perimeter baseline directly from Ian.
    const nextSuper = runSuperstructureTakeoff(
      inputs.trenchLength,
      superInputs,
      superRates,
      superDims,
    );
    window.setTimeout(() => {
      setResult(next);
      setSuperResult(nextSuper);
      setStatus("verified");
    }, 350);
  };

  const combinedBoq: BoqLine[] = [...(result?.boq ?? []), ...(superResult?.boq ?? [])];
  const combinedNet = (result?.netCost ?? 0) + (superResult?.netCost ?? 0);

  const statusPill = (
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
  );

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
              SiteScout Agent Engine — Phase 1 (Ian: Groundworks) + Phase 2 (Caleb: Superstructure &amp;
              Roof)
            </h1>
            <p className="font-mono text-sm text-white/55 mt-2 max-w-3xl">
              Isolated workbench for stress-testing the specialist trade agents and calibrating
              groundworks, masonry and roof maths against real job data. Caleb inherits the
              foundation perimeter baseline directly from Ian. Nothing here writes to live quoting
              tools.
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

              {/* Caleb's inputs */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-white/55 mb-4">
                  Caleb — superstructure, masonry &amp; roof inputs
                </h3>
                <div className="space-y-4">
                  <Field label="Existing Brick Format">
                    <select
                      className={inputClass}
                      value={superInputs.brickFormat}
                      onChange={(e) => setSuper("brickFormat", e.target.value as BrickFormat)}
                    >
                      {BRICK_FORMATS.map((b) => (
                        <option key={b} value={b} className="bg-[#0B1B30]">
                          {b}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Wall Height to Plate (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superInputs.wallHeight}
                      onChange={(e) => setSuper("wallHeight", Number(e.target.value))}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Rear Bi-Fold Opening Width (m)">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={superInputs.bifoldWidth}
                        onChange={(e) => setSuper("bifoldWidth", Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Bi-Fold Opening Height (m)">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={superInputs.bifoldHeight}
                        onChange={(e) => setSuper("bifoldHeight", Number(e.target.value))}
                      />
                    </Field>
                  </div>

                  <Field label="Window Openings Area (m²)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superInputs.windowOpeningsArea}
                      onChange={(e) => setSuper("windowOpeningsArea", Number(e.target.value))}
                    />
                  </Field>

                  <Field label="Roof Type">
                    <select
                      className={inputClass}
                      value={superInputs.roofType}
                      onChange={(e) => setSuper("roofType", e.target.value as RoofType)}
                    >
                      {ROOF_TYPES.map((r) => (
                        <option key={r} value={r} className="bg-[#0B1B30]">
                          {r}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Roof Covering Material">
                    <select
                      className={inputClass}
                      value={superInputs.roofCovering}
                      onChange={(e) => setSuper("roofCovering", e.target.value as RoofCovering)}
                    >
                      {ROOF_COVERINGS.map((r) => (
                        <option key={r} value={r} className="bg-[#0B1B30]">
                          {r}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Editable rates & dimensions — Ian */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-white/55 mb-4">
                  Calibration — Ian's rates &amp; dimensional constants
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

              {/* Editable rates & dimensions — Caleb */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-white/55 mb-4">
                  Calibration — Caleb's rates &amp; dimensional constants
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Facing Brickwork (£/brick)">
                    <input
                      type="number"
                      step="0.05"
                      className={inputClass}
                      value={superRates.facingBrickRate}
                      onChange={(e) =>
                        setSuperRates({ ...superRates, facingBrickRate: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="7N Dense Block Inner Leaf (£/block)">
                    <input
                      type="number"
                      step="0.05"
                      className={inputClass}
                      value={superRates.denseBlockRate}
                      onChange={(e) =>
                        setSuperRates({ ...superRates, denseBlockRate: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="100mm Full-Fill PIR (£/sheet)">
                    <input
                      type="number"
                      step="0.5"
                      className={inputClass}
                      value={superRates.pirSheetRate}
                      onChange={(e) =>
                        setSuperRates({ ...superRates, pirSheetRate: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Bi-Fold Lintel & Padstones (£/item)">
                    <input
                      type="number"
                      step="5"
                      className={inputClass}
                      value={superRates.bifoldLintelRate}
                      onChange={(e) =>
                        setSuperRates({ ...superRates, bifoldLintelRate: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Cut Timber Roof Carcass (£/m²)">
                    <input
                      type="number"
                      step="1"
                      className={inputClass}
                      value={superRates.roofCarcassPerM2}
                      onChange={(e) =>
                        setSuperRates({ ...superRates, roofCarcassPerM2: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Tiles, Membrane & Battens (£/m²)">
                    <input
                      type="number"
                      step="1"
                      className={inputClass}
                      value={superRates.roofCoveringPerM2}
                      onChange={(e) =>
                        setSuperRates({ ...superRates, roofCoveringPerM2: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Blocks per m²">
                    <input
                      type="number"
                      step="0.5"
                      className={inputClass}
                      value={superDims.blocksPerM2}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, blocksPerM2: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Wall Ties per m²">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superDims.tiesPerM2}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, tiesPerM2: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="PIR Sheet Coverage (m²)">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={superDims.pirSheetCoverage}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, pirSheetCoverage: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Masonry Waste Factor (×)">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={superDims.masonryWaste}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, masonryWaste: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Roof Cut Waste Factor (×)">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={superDims.roofWaste}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, roofWaste: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Roof Projection / Span (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superDims.roofProjection}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, roofProjection: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Tiles per m²">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superDims.tilesPerM2}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, tilesPerM2: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Rafter Centres (m)">
                    <input
                      type="number"
                      step="0.05"
                      className={inputClass}
                      value={superDims.rafterCentres}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, rafterCentres: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Rafter Length per Run (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superDims.rafterLength}
                      onChange={(e) =>
                        setSuperDims({ ...superDims, rafterLength: Number(e.target.value) })
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
                🚀 Run Multi-Agent Takeoff (Ian + Caleb)
              </button>
            </section>

            {/* RIGHT — agent war room */}
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
                    {statusPill}
                  </div>
                  <p className="font-mono text-xs text-white/55 mt-1">
                    Groundworks &amp; Heavy Civils Lead · Substructure Phase 1
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: "rgba(26,194,186,0.15)" }}
                >
                  🧱
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-bold text-white">Caleb</h2>
                    {statusPill}
                  </div>
                  <p className="font-mono text-xs text-white/55 mt-1">
                    Masonry, Envelope &amp; Roof Lead · Superstructure Phase 2
                  </p>
                  <p className="font-mono text-[11px] text-white/40 mt-1">
                    Perimeter baseline received from Ian: {inputs.trenchLength} lm
                  </p>
                </div>
              </div>

              {!result || !superResult ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center font-mono text-sm text-white/45">
                  Run a takeoff to see Ian's and Caleb's regulation audits and the combined bill of
                  quantities.
                </div>
              ) : (
                <>
                  {/* Ian's regulation audit */}
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
                      Ian — Regulation &amp; Safety Audit
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

                  {/* Caleb's regulation audit */}
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: "rgba(26,194,186,0.35)",
                      backgroundColor: "rgba(26,194,186,0.08)",
                    }}
                  >
                    <h3 className="font-heading text-base font-bold text-white mb-1">
                      Caleb — Regulation &amp; Technical Audit
                    </h3>
                    <p className="font-mono text-xs text-white/60 mb-3">
                      Part L (thermal) · Part A (structural openings) · Part C (cavity trays &amp;
                      moisture) — net wall {superResult.netWallArea} m², true roof surface{" "}
                      {superResult.trueRoofSurfaceArea} m² (pitch multiplier{" "}
                      {superResult.pitchMultiplier}).
                    </p>
                    <ul className="space-y-2">
                      {superResult.auditNotes.map((note, i) => (
                        <li key={i} className="font-mono text-xs text-white/80 leading-relaxed">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Combined BOQ */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
                    <h3 className="font-heading text-base font-bold text-white mb-4">
                      Live Bill of Quantities — {inputs.projectRef || "Untitled"} (Substructure +
                      Superstructure)
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
                          {combinedBoq.map((line, i) => (
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

                  {/* Quantity summary */}
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
                        label: "Net Wall Area (above DPC)",
                        value: `${superResult.netWallArea} m²`,
                        sub: `${superResult.grossWallArea} m² gross − ${superResult.totalOpeningsArea} m² openings`,
                      },
                      {
                        label: "Masonry Quantities",
                        value: `${superResult.facingBricksQty} bricks`,
                        sub: `${superResult.denseBlocksQty} dense blocks · ${superResult.wallTiesQty} ties · ${superResult.cavityInsulationSheets} PIR sheets`,
                      },
                      {
                        label: "True Roof Surface Area",
                        value: `${superResult.trueRoofSurfaceArea} m²`,
                        sub: `${superResult.roofPlanArea} m² plan × ${superResult.pitchMultiplier} pitch × ${superDims.roofWaste} waste · ${superResult.roofTilesQty} tiles · ${superResult.c24RafterLinearM} lm C24`,
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                      >
                        <p className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-2">
                          {card.label}
                        </p>
                        <p className="font-heading text-2xl font-bold text-white">{card.value}</p>
                        <p className="font-mono text-[11px] text-white/50 mt-1.5">{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Combined phase summary */}
                  <div
                    className="rounded-2xl border p-5 md:p-6"
                    style={{
                      borderColor: "rgba(26,194,186,0.45)",
                      backgroundColor: "rgba(26,194,186,0.10)",
                    }}
                  >
                    <h3 className="font-heading text-base font-bold text-white mb-4">
                      Combined Phase Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3">
                        <span className="font-mono text-xs text-white/70">
                          Substructure Total (Ian)
                        </span>
                        <span className="font-heading text-lg font-bold text-white whitespace-nowrap">
                          {money(result.netCost)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3">
                        <span className="font-mono text-xs text-white/70">
                          Superstructure &amp; Roof Total (Caleb)
                        </span>
                        <span className="font-heading text-lg font-bold text-white whitespace-nowrap">
                          {money(superResult.netCost)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-mono text-xs uppercase tracking-wider text-[#1AC2BA]">
                          Combined Net Total (Ian + Caleb)
                        </span>
                        <span className="font-heading text-2xl font-bold text-white whitespace-nowrap">
                          {money(combinedNet)}
                        </span>
                      </div>
                    </div>
                    <p className="font-mono text-[11px] text-white/50 mt-3">
                      Net of VAT, prelims, overhead &amp; profit.
                    </p>
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
