import { useMemo, useState } from "react";
import TradeSidebar from "@/components/trade/TradeSidebar";
import AgentAvatar from "@/components/sitescout/AgentAvatar";
import { AGENTS, type Agent, type AgentId } from "@/lib/agentRegistry";
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
  type SuperstructureInputs,
  type SuperstructureResult,
} from "@/lib/superstructureEngine";
import {
  DEFAULT_MEP_INPUTS,
  DEFAULT_MEP_RATES,
  runMepTakeoff,
  type MepInputs,
  type MepResult,
} from "@/lib/mepEngine";
import {
  DEFAULT_FINISHES_INPUTS,
  DEFAULT_FINISHES_RATES,
  runFinishesTakeoff,
  type FinishesInputs,
  type FinishesResult,
} from "@/lib/finishesEngine";
import {
  DEFAULT_COMMERCIAL_SETTINGS,
  runCommercialAnalysis,
  type CommercialSettings,
} from "@/lib/commercialEngine";
import {
  buildComplianceChecklist,
  buildLogisticsPlan,
  type ComplianceItem,
} from "@/lib/complianceEngine";

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
  "w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 font-mono text-sm text-white/90 placeholder:text-white/35 focus:outline-none focus:border-[#1AC2BA]";
const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-white/55 mb-1.5";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5";

const money = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 });

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className={labelClass}>{label}</span>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-heading text-base font-bold text-white mb-3">{children}</h3>
);

type RunStatus = "idle" | "analyzing" | "verified";
type TabId = "Substructure" | "Superstructure" | "MEP" | "Finishes" | "Commercial" | "Compliance";
const TABS: TabId[] = [
  "Substructure",
  "Superstructure",
  "MEP",
  "Finishes",
  "Commercial",
  "Compliance",
];

const PHASE_BY_AGENT: Partial<Record<AgentId, string>> = {
  ian: "Substructure",
  caleb: "Superstructure",
  megan: "MEP",
  ruby: "Finishes",
};

const stateStyle = (state: ComplianceItem["state"]) =>
  state === "attention"
    ? { backgroundColor: "#fde68a", color: "#78350f" }
    : state === "required"
      ? { backgroundColor: "#bbf7d0", color: "#14532d" }
      : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" };

const SiteScoutSandbox = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ---------- survey inputs ----------
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
  const [rates] = useState<GroundworksRates>({ ...DEFAULT_RATES });
  const [dims] = useState<GroundworksDimensions>({ ...DEFAULT_DIMENSIONS });
  const [basis, setBasis] = useState<MuckAwayBasis>("volume");

  const [superInputs, setSuperInputs] = useState<SuperstructureInputs>({ ...DEFAULT_SUPER_INPUTS });
  const [mepInputs, setMepInputs] = useState<MepInputs>({ ...DEFAULT_MEP_INPUTS });
  const [finishesInputs, setFinishesInputs] = useState<FinishesInputs>({
    ...DEFAULT_FINISHES_INPUTS,
  });
  const [commercial, setCommercial] = useState<CommercialSettings>({
    ...DEFAULT_COMMERCIAL_SETTINGS,
  });

  // ---------- run state ----------
  const [status, setStatus] = useState<RunStatus>("idle");
  const [ground, setGround] = useState<TakeoffResult | null>(null);
  const [superResult, setSuperResult] = useState<SuperstructureResult | null>(null);
  const [mepResult, setMepResult] = useState<MepResult | null>(null);
  const [finishesResult, setFinishesResult] = useState<FinishesResult | null>(null);
  const [tab, setTab] = useState<TabId>("Substructure");
  const [filterAgent, setFilterAgent] = useState<AgentId | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { quantity?: number; rate?: number }>>(
    {},
  );

  const set = <K extends keyof GroundworksInputs>(key: K, value: GroundworksInputs[K]) =>
    setInputs((p) => ({ ...p, [key]: value }));
  const setSuper = <K extends keyof SuperstructureInputs>(key: K, value: SuperstructureInputs[K]) =>
    setSuperInputs((p) => ({ ...p, [key]: value }));
  const setMep = <K extends keyof MepInputs>(key: K, value: MepInputs[K]) =>
    setMepInputs((p) => ({ ...p, [key]: value }));
  const setFin = <K extends keyof FinishesInputs>(key: K, value: FinishesInputs[K]) =>
    setFinishesInputs((p) => ({ ...p, [key]: value }));

  const runTakeoff = () => {
    setStatus("analyzing");
    setOverrides({});
    const g = runSubstructureTakeoff(inputs, rates, dims, basis);
    // Caleb inherits the foundation perimeter baseline directly from Ian.
    const s = runSuperstructureTakeoff(inputs.trenchLength, superInputs, DEFAULT_SUPER_RATES, {
      ...DEFAULT_SUPER_DIMENSIONS,
    });
    const m = runMepTakeoff(mepInputs, DEFAULT_MEP_RATES);
    const f = runFinishesTakeoff(finishesInputs, DEFAULT_FINISHES_RATES);
    window.setTimeout(() => {
      setGround(g);
      setSuperResult(s);
      setMepResult(m);
      setFinishesResult(f);
      setStatus("verified");
    }, 900);
  };

  // ---------- live BoQ with editable quantities & rates ----------
  const baseBoq: BoqLine[] = useMemo(
    () => [
      ...(ground?.boq ?? []),
      ...(superResult?.boq ?? []),
      ...(mepResult?.boq ?? []),
      ...(finishesResult?.boq ?? []),
    ],
    [ground, superResult, mepResult, finishesResult],
  );

  const keyFor = (line: BoqLine, i: number) => `${line.phase}-${i}-${line.description}`;

  const liveBoq = useMemo(
    () =>
      baseBoq.map((line, i) => {
        const o = overrides[keyFor(line, i)];
        const quantity = o?.quantity ?? line.quantity;
        const rate = o?.rate ?? line.rate;
        return { ...line, quantity, rate, total: Number((quantity * rate).toFixed(2)) };
      }),
    [baseBoq, overrides],
  );

  const commercialResult = useMemo(
    () => runCommercialAnalysis(liveBoq, commercial),
    [liveBoq, commercial],
  );

  const complianceItems = useMemo(
    () =>
      buildComplianceChecklist({
        ground,
        superstructure: superResult,
        mep: mepResult,
        finishes: finishesResult,
      }),
    [ground, superResult, mepResult, finishesResult],
  );
  const logistics = useMemo(
    () => buildLogisticsPlan({ ground, superstructure: superResult, accessType: inputs.accessType }),
    [ground, superResult, inputs.accessType],
  );

  const netCost = commercialResult.netCost;
  const attentionCount = complianceItems.filter((c) => c.state === "attention").length;
  const jobHealth =
    status !== "verified"
      ? "Awaiting takeoff"
      : commercialResult.marginPct >= commercial.targetMarginPct - 0.5 && attentionCount <= 2
        ? "Healthy — signed off"
        : attentionCount > 2
          ? `Review — ${attentionCount} compliance flags`
          : "Margin under target";

  const phaseTotal = (phase: string) =>
    liveBoq.filter((l) => l.phase === phase).reduce((s, l) => s + l.total, 0);

  const dialogue = (agent: Agent): string => {
    if (status === "idle") return "Standing by for the survey data.";
    if (status === "analyzing") return "On site — measuring up and pricing now…";
    switch (agent.id) {
      case "lee":
        return `Whole job stacks up at ${money(netCost)} net, ${money(commercialResult.sellPrice)} to the client before VAT. ${attentionCount} item(s) need a second look before I sign it off.`;
      case "ian":
        return ground
          ? `${ground.digDepth}m dig, ${ground.bulkedMuckVolume} m³ bulked out over ${ground.grabWagonLoads} grab loads, ${ground.concreteVolume} m³ of concrete. ${money(phaseTotal("Substructure"))} in the ground.`
          : "No substructure data yet.";
      case "caleb":
        return superResult
          ? `${superResult.facingBricksQty} facings and ${superResult.denseBlocksQty} blocks over ${superResult.netWallArea} m² net. True roof surface ${superResult.trueRoofSurfaceArea} m² at ×${superResult.pitchMultiplier}. ${money(phaseTotal("Superstructure"))}.`
          : "No superstructure data yet.";
      case "megan":
        return mepResult
          ? `${mepResult.totalPoints} points first and second fix${mepInputs.consumerUnitUpgrade ? ", plus a metal board changeover" : ""}. Certification allowed for. ${money(phaseTotal("MEP"))}.`
          : "No MEP data yet.";
      case "ruby":
        return finishesResult
          ? `${finishesResult.boardSheets} sheets of 12.5mm, ${finishesResult.skimArea} m² skim, ${finishesInputs.skirtingRun} lm of skirting and ${finishesInputs.internalDoors} door sets. ${money(phaseTotal("Finishes"))}.`
          : "No finishes data yet.";
      case "amy":
        return `Packs A–E out to tender. Retail benchmark ${money(commercialResult.totalRetailBenchmark)} against ${money(netCost)} trade — ${money(commercialResult.totalArbitrage)} of buying advantage held. Margin locked at ${commercialResult.marginPct}%.`;
      case "elizabeth":
        return `${complianceItems.length} building control checks raised across Parts A, B, C, E, H, L and P. ${attentionCount} flagged for attention before work starts.`;
      case "sharon":
        return `${logistics.length}-stage delivery sequence set against ${inputs.accessType.toLowerCase()}. Handover pack scheduled for the final week.`;
      default:
        return "";
    }
  };

  const agentStatus = (agent: Agent) => {
    if (status === "idle") return "Standing by";
    if (status === "analyzing") return "On site";
    return agent.id === "lee" ? "Signed off" : "Verified";
  };

  const avatarState: "clean" | "site" = status === "analyzing" ? "site" : "clean";

  const filteredBoq = (phase: string) =>
    liveBoq.filter(
      (l) =>
        l.phase === phase &&
        (!filterAgent || PHASE_BY_AGENT[filterAgent] === phase || filterAgent === "lee"),
    );

  const updateOverride = (key: string, field: "quantity" | "rate", value: number) =>
    setOverrides((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));

  const BoqTable = ({ phase }: { phase: string }) => {
    const lines = baseBoq
      .map((line, i) => ({ line, key: keyFor(line, i), i }))
      .filter(({ line }) => line.phase === phase);
    if (!lines.length)
      return (
        <p className="font-mono text-xs text-white/45">
          No lines yet — run the master takeoff to populate this phase.
        </p>
      );
    return (
      <div className="space-y-3">
        {lines.map(({ line, key, i }) => {
          const live = liveBoq[i];
          return (
            <div key={key} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <p className="font-mono text-xs text-white/85 flex-1 min-w-[200px]">
                  {line.description}
                </p>
                <p className="font-heading text-sm text-[#1AC2BA] whitespace-nowrap">
                  {money(live.total)}
                </p>
              </div>
              <p className="font-mono text-[10px] text-white/40 mt-1">{line.formula}</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label={`Quantity (${line.unit})`}>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={live.quantity}
                    onChange={(e) => updateOverride(key, "quantity", Number(e.target.value))}
                  />
                </Field>
                <Field label="Unit rate (£)">
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={live.rate}
                    onChange={(e) => updateOverride(key, "rate", Number(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          );
        })}
        <div className="flex justify-between items-center border-t border-white/10 pt-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/55">
            {phase} subtotal
          </span>
          <span className="font-heading text-lg text-white">{money(phaseTotal(phase))}</span>
        </div>
      </div>
    );
  };

  const auditNotesFor = (phase: string) =>
    phase === "Substructure"
      ? ground?.auditNotes
      : phase === "Superstructure"
        ? superResult?.auditNotes
        : phase === "MEP"
          ? mepResult?.auditNotes
          : phase === "Finishes"
            ? finishesResult?.auditNotes
            : undefined;

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
        <div className="max-w-[1700px] mx-auto px-4 md:px-8 pt-14 md:pt-10 pb-24">
          <div className="mb-6">
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-[#1AC2BA] border border-[#1AC2BA]/40 rounded px-2 py-0.5 mb-3">
              Internal Beta · Sandbox
            </span>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              ProGrafter Multi-Agent Command Center &amp; BoQ Engine
            </h1>
            <p className="font-mono text-sm text-white/55 mt-2 max-w-3xl">
              Eight specialist agents run a deterministic takeoff off one SiteScout survey. Nothing
              here is wired into live quoting — it exists to calibrate the maths.
            </p>
          </div>

          {/* ---------- Lee: top command bar ---------- */}
          <div
            className="rounded-2xl border p-4 md:p-5 mb-6"
            style={{
              borderColor: "rgba(26,194,186,0.35)",
              background:
                "linear-gradient(120deg, rgba(26,194,186,0.12), rgba(255,255,255,0.02) 60%)",
            }}
          >
            <div className="flex items-start gap-4 flex-wrap">
              <AgentAvatar agent={AGENTS[0]} state={avatarState} size={72} active />
              <div className="flex-1 min-w-[220px]">
                <p className="font-heading text-lg font-bold text-white">
                  {AGENTS[0].name} — {AGENTS[0].title}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#1AC2BA] mt-0.5">
                  {AGENTS[0].roleBadge}
                </p>
                <p className="font-mono text-xs text-white/60 mt-2 italic">“{AGENTS[0].motto}”</p>
                <p className="font-mono text-xs text-white/75 mt-2">{dialogue(AGENTS[0])}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <p className={labelClass}>Total net build cost</p>
                  <p className="font-heading text-xl text-white">{money(netCost)}</p>
                </div>
                <div>
                  <p className={labelClass}>Live trade margin</p>
                  <p className="font-heading text-xl text-[#1AC2BA]">
                    {money(commercialResult.marginAmount)}{" "}
                    <span className="text-sm">/ {commercialResult.marginPct}%</span>
                  </p>
                </div>
                <div>
                  <p className={labelClass}>Overall job health</p>
                  <p
                    className="font-mono text-[11px] uppercase tracking-wider px-2 py-1 rounded-full inline-block"
                    style={stateStyle(
                      status !== "verified"
                        ? "info"
                        : jobHealth.startsWith("Healthy")
                          ? "required"
                          : "attention",
                    )}
                  >
                    {jobHealth}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* ---------- LEFT: survey inputs ---------- */}
            <div className="xl:col-span-3 space-y-4">
              <div className={cardClass}>
                <SectionTitle>Project meta</SectionTitle>
                <div className="space-y-3">
                  <Field label="Project reference">
                    <input
                      className={inputClass}
                      value={inputs.projectRef}
                      onChange={(e) => set("projectRef", e.target.value)}
                    />
                  </Field>
                  <Field label="Site access">
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
                  <Field label="Survey notes">
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={inputs.notes}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className={cardClass}>
                <SectionTitle>Substructure — Ian</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Trench run (lm)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={inputs.trenchLength}
                      onChange={(e) => set("trenchLength", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Soil type">
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
                  <Field label="Tree proximity (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={inputs.treeProximity}
                      onChange={(e) => set("treeProximity", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Tree species">
                    <input
                      className={inputClass}
                      value={inputs.treeSpecies}
                      onChange={(e) => set("treeSpecies", e.target.value)}
                    />
                  </Field>
                  <Field label="Drainage invert (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={inputs.drainageInvertBaseline}
                      onChange={(e) => set("drainageInvertBaseline", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Muckaway basis">
                    <select
                      className={inputClass}
                      value={basis}
                      onChange={(e) => setBasis(e.target.value as MuckAwayBasis)}
                    >
                      <option value="volume" className="bg-[#0B1B30]">
                        Per m³
                      </option>
                      <option value="grab_loads" className="bg-[#0B1B30]">
                        Per grab load
                      </option>
                    </select>
                  </Field>
                </div>
              </div>

              <div className={cardClass}>
                <SectionTitle>Superstructure — Caleb</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Brick format">
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
                  <Field label="Wall height (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superInputs.wallHeight}
                      onChange={(e) => setSuper("wallHeight", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Bi-fold width (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superInputs.bifoldWidth}
                      onChange={(e) => setSuper("bifoldWidth", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Bi-fold height (m)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superInputs.bifoldHeight}
                      onChange={(e) => setSuper("bifoldHeight", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Window openings (m²)">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={superInputs.windowOpeningsArea}
                      onChange={(e) => setSuper("windowOpeningsArea", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Roof type">
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
                  <div className="col-span-2">
                    <Field label="Roof covering">
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
              </div>

              <div className={cardClass}>
                <SectionTitle>MEP — Megan</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Floor area (m²)">
                    <input
                      type="number"
                      className={inputClass}
                      value={mepInputs.floorArea}
                      onChange={(e) => setMep("floorArea", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Double sockets">
                    <input
                      type="number"
                      className={inputClass}
                      value={mepInputs.doubleSockets}
                      onChange={(e) => setMep("doubleSockets", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Light points">
                    <input
                      type="number"
                      className={inputClass}
                      value={mepInputs.lightPoints}
                      onChange={(e) => setMep("lightPoints", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Switch plates">
                    <input
                      type="number"
                      className={inputClass}
                      value={mepInputs.switchPlates}
                      onChange={(e) => setMep("switchPlates", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Radiators">
                    <input
                      type="number"
                      className={inputClass}
                      value={mepInputs.radiators}
                      onChange={(e) => setMep("radiators", Number(e.target.value))}
                    />
                  </Field>
                  <div className="space-y-2 pt-5">
                    {(
                      [
                        ["consumerUnitUpgrade", "CU upgrade"],
                        ["evCharger", "EV charger"],
                        ["underfloorHeating", "Wet UFH"],
                      ] as [keyof MepInputs, string][]
                    ).map(([k, lbl]) => (
                      <label key={k} className="flex items-center gap-2 font-mono text-xs text-white/70">
                        <input
                          type="checkbox"
                          checked={Boolean(mepInputs[k])}
                          onChange={(e) => setMep(k, e.target.checked as never)}
                        />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <SectionTitle>Finishes — Ruby</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Internal wall area (m²)">
                    <input
                      type="number"
                      className={inputClass}
                      value={finishesInputs.internalWallArea}
                      onChange={(e) => setFin("internalWallArea", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Ceiling area (m²)">
                    <input
                      type="number"
                      className={inputClass}
                      value={finishesInputs.ceilingArea}
                      onChange={(e) => setFin("ceilingArea", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Skirting run (lm)">
                    <input
                      type="number"
                      className={inputClass}
                      value={finishesInputs.skirtingRun}
                      onChange={(e) => setFin("skirtingRun", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Internal doors">
                    <input
                      type="number"
                      className={inputClass}
                      value={finishesInputs.internalDoors}
                      onChange={(e) => setFin("internalDoors", Number(e.target.value))}
                    />
                  </Field>
                  <label className="col-span-2 flex items-center gap-2 font-mono text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={finishesInputs.twoCoatSkim}
                      onChange={(e) => setFin("twoCoatSkim", e.target.checked)}
                    />
                    2-coat Thistle multi-finish skim
                  </label>
                </div>
              </div>

              <button
                onClick={runTakeoff}
                className="w-full rounded-xl px-4 py-3 font-mono text-sm uppercase tracking-wider text-[#04231F] font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1AC2BA" }}
              >
                🚀 Run Master 8-Agent Takeoff &amp; Technical Audit
              </button>
            </div>

            {/* ---------- CENTER: agent war room ---------- */}
            <div className="xl:col-span-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <SectionTitle>Agent war room</SectionTitle>
                {filterAgent && (
                  <button
                    onClick={() => setFilterAgent(null)}
                    className="font-mono text-[10px] uppercase tracking-wider text-[#1AC2BA] border border-[#1AC2BA]/40 rounded px-2 py-1"
                  >
                    Clear BoQ filter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AGENTS.map((agent) => {
                  const active = filterAgent === agent.id;
                  return (
                    <div
                      key={agent.id}
                      className="rounded-2xl border p-4 transition-all duration-300"
                      style={{
                        borderColor: active ? "rgba(26,194,186,0.5)" : "rgba(255,255,255,0.10)",
                        background: active ? "rgba(26,194,186,0.07)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <AgentAvatar
                          agent={agent}
                          state={avatarState}
                          size={56}
                          active={active || status === "analyzing"}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-sm font-bold text-white truncate">
                            {agent.name}
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[#1AC2BA]">
                            {agent.roleBadge}
                          </p>
                          <span
                            className="inline-block mt-1.5 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={stateStyle(
                              status === "verified"
                                ? "required"
                                : status === "analyzing"
                                  ? "attention"
                                  : "info",
                            )}
                          >
                            {agentStatus(agent)}
                          </span>
                        </div>
                      </div>
                      <p className="font-mono text-[11px] text-white/45 mt-3">{agent.speciality}</p>
                      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="font-mono text-[11px] text-white/80 leading-relaxed">
                          {dialogue(agent)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFilterAgent(active ? null : agent.id);
                          const phase = PHASE_BY_AGENT[agent.id];
                          if (phase) setTab(phase as TabId);
                          else if (agent.id === "amy") setTab("Commercial");
                          else if (agent.id === "elizabeth" || agent.id === "sharon")
                            setTab("Compliance");
                        }}
                        className="mt-3 w-full rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/70 hover:border-[#1AC2BA] hover:text-white transition-colors"
                      >
                        {active ? "Filtering BoQ" : "Highlight in BoQ"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------- RIGHT: BoQ & arbitrage ---------- */}
            <div className="xl:col-span-4 space-y-4">
              <div className={cardClass}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-colors"
                      style={{
                        borderColor: tab === t ? "#1AC2BA" : "rgba(255,255,255,0.15)",
                        color: tab === t ? "#1AC2BA" : "rgba(255,255,255,0.6)",
                        backgroundColor: tab === t ? "rgba(26,194,186,0.10)" : "transparent",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {tab !== "Commercial" && tab !== "Compliance" && (
                  <>
                    <BoqTable phase={tab} />
                    {auditNotesFor(tab)?.length ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                          Technical audit
                        </p>
                        {auditNotesFor(tab)!.map((n, i) => (
                          <p key={i} className="font-mono text-[11px] text-white/70 leading-relaxed">
                            {n}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}

                {tab === "Commercial" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Contingency %">
                        <input
                          type="number"
                          className={inputClass}
                          value={commercial.contingencyPct}
                          onChange={(e) =>
                            setCommercial((p) => ({ ...p, contingencyPct: Number(e.target.value) }))
                          }
                        />
                      </Field>
                      <Field label="Overhead %">
                        <input
                          type="number"
                          className={inputClass}
                          value={commercial.overheadPct}
                          onChange={(e) =>
                            setCommercial((p) => ({ ...p, overheadPct: Number(e.target.value) }))
                          }
                        />
                      </Field>
                      <Field label="Target margin %">
                        <input
                          type="number"
                          className={inputClass}
                          value={commercial.targetMarginPct}
                          onChange={(e) =>
                            setCommercial((p) => ({
                              ...p,
                              targetMarginPct: Number(e.target.value),
                            }))
                          }
                        />
                      </Field>
                      <Field label="VAT %">
                        <input
                          type="number"
                          className={inputClass}
                          value={commercial.vatRate}
                          onChange={(e) =>
                            setCommercial((p) => ({ ...p, vatRate: Number(e.target.value) }))
                          }
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Net cost", money(commercialResult.netCost)],
                        ["Sell price (ex VAT)", money(commercialResult.sellPrice)],
                        [
                          "Margin",
                          `${money(commercialResult.marginAmount)} / ${commercialResult.marginPct}%`,
                        ],
                        ["Client total inc VAT", money(commercialResult.clientTotalIncVat)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-white/10 p-3">
                          <p className={labelClass}>{k}</p>
                          <p className="font-heading text-base text-white">{v}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-2">
                        Merchant tender splitter — Packs A–E
                      </p>
                      <div className="space-y-2">
                        {commercialResult.packs.map((p) => (
                          <div
                            key={p.pack.id}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                          >
                            <div className="flex justify-between gap-2 flex-wrap">
                              <p className="font-mono text-xs text-white/85">{p.pack.name}</p>
                              <p className="font-heading text-sm text-[#1AC2BA] whitespace-nowrap">
                                {money(p.tradeCost)}
                              </p>
                            </div>
                            <p className="font-mono text-[10px] text-white/40 mt-1">
                              {p.pack.merchantHint} · {p.lineCount} line(s)
                            </p>
                            <div className="flex gap-4 mt-2 font-mono text-[10px] text-white/60 flex-wrap">
                              <span>Retail benchmark {money(p.retailBenchmark)}</span>
                              <span className="text-[#1AC2BA]">
                                Arbitrage {money(p.arbitrage)} ({p.arbitragePct}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                        Amy — commercial audit
                      </p>
                      {commercialResult.auditNotes.map((n, i) => (
                        <p key={i} className="font-mono text-[11px] text-white/70 leading-relaxed">
                          {n}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "Compliance" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {complianceItems.map((c) => (
                        <div
                          key={c.part + c.title}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={stateStyle(c.state)}
                            >
                              {c.part}
                            </span>
                            <p className="font-mono text-xs text-white/85">{c.title}</p>
                          </div>
                          <p className="font-mono text-[11px] text-white/60 mt-2 leading-relaxed">
                            {c.detail}
                          </p>
                          <p className="font-mono text-[10px] text-white/35 mt-1">Owner: {c.owner}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-2">
                        Sharon — logistics &amp; handover sequence
                      </p>
                      <div className="space-y-2">
                        {logistics.map((l) => (
                          <div key={l.week} className="rounded-xl border border-white/10 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-[#1AC2BA]">
                              {l.week} · {l.activity}
                            </p>
                            <p className="font-mono text-[11px] text-white/65 mt-1 leading-relaxed">
                              {l.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={cardClass}>
                <SectionTitle>Unified totals</SectionTitle>
                <div className="space-y-2">
                  {["Substructure", "Superstructure", "MEP", "Finishes"].map((p) => (
                    <div key={p} className="flex justify-between font-mono text-xs text-white/70">
                      <span>{p}</span>
                      <span>{money(phaseTotal(p))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-white/55">
                      Net build cost
                    </span>
                    <span className="font-heading text-lg text-[#1AC2BA]">{money(netCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SiteScoutSandbox;
