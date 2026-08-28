import { useMemo, useRef, useState } from "react";
import TradeSidebar from "@/components/trade/TradeSidebar";
import AgentAvatar from "@/components/sitescout/AgentAvatar";
import { AGENTS, type Agent, type AgentId } from "@/lib/agentRegistry";
import {
  DEFAULT_DIMENSIONS,
  DEFAULT_RATES,
  runSubstructureTakeoff,
  type BoqLine,
  type GroundworksInputs,
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
  DEFAULT_ENVELOPE_INPUTS,
  DEFAULT_ENVELOPE_RATES,
  DEFAULT_PRELIMS_INPUTS,
  DEFAULT_PRELIMS_RATES,
  DEFAULT_SLAB_INPUTS,
  DEFAULT_SLAB_RATES,
  runEnvelopeTakeoff,
  runPrelimsTakeoff,
  runSlabTakeoff,
  type EnvelopeInputs,
  type EnvelopeResult,
  type PrelimsInputs,
  type PrelimsResult,
  type SlabInputs,
  type SlabResult,
} from "@/lib/buildPackagesEngine";
import {
  buildComplianceChecklist,
  buildLogisticsPlan,
  type ComplianceItem,
} from "@/lib/complianceEngine";
import {
  DEFAULT_GROUND_TRUTH,
  buildRiskExclusions,
  buildSiteRiskSummary,
  deriveGroundTruth,
  type ConsumerUnitType,
  type GroundTruth,
  type SystemType,
} from "@/lib/siteScoutGroundTruth";
import { checkCompetitorQuote } from "@/lib/competitorQuoteChecker";
import {
  allPacksToCsv,
  buildMasterBoq,
  downloadText,
  masterBoqToCsv,
  packToCsv,
  runArbitrage,
  
  type MasterBoqLine,
  type PackId,
} from "@/lib/procurementEngine";
import DrawingIngestZone from "@/components/sitescout/DrawingIngestZone";
import DrawingMarkupViewer from "@/components/sitescout/DrawingMarkupViewer";
import { type ExtractedDrawing } from "@/lib/drawingIngestion";
import { generateClientQuotePdf } from "@/lib/clientQuotePdf";

/* ------------------------------------------------------------------ theme */

const ACCENT = "#38bdf8";
const BG = "#0f172a";

const inputClass =
  "w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 font-mono text-sm text-white/90 placeholder:text-white/35 focus:outline-none focus:border-[#38bdf8]";
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

const Select = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) => (
  <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
    {options.map((o) => (
      <option key={o} value={o} style={{ backgroundColor: BG }}>
        {o}
      </option>
    ))}
  </select>
);

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center gap-2 font-mono text-xs text-white/70 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    {label}
  </label>
);

const stateStyle = (state: ComplianceItem["state"]) =>
  state === "attention"
    ? { backgroundColor: "#fde68a", color: "#78350f" }
    : state === "required"
      ? { backgroundColor: "#bbf7d0", color: "#14532d" }
      : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" };

/* ---------------------------------------------------------------- options */

const SOIL_TYPES: SoilType[] = ["Clay", "Sand & Gravel", "Rock", "Made Ground"];
const CU_TYPES: ConsumerUnitType[] = [
  "Modern metal 18th Ed.",
  "Plastic (pre-2016)",
  "Rewireable fuse board",
];
const SYSTEM_TYPES: SystemType[] = ["Combi", "System", "Regular"];
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

type StepId = 1 | 2 | 3 | 4;
const STEPS: { id: StepId; label: string; sub: string }[] = [
  { id: 1, label: "Physical Ground Truth", sub: "SiteScout baseline" },
  { id: 2, label: "Takeoff & Retail Costing", sub: "Granular material list" },
  { id: 3, label: "Customer Quote & Checker", sub: "Contract-ready" },
  { id: 4, label: "Procurement & Trade Gap", sub: "Merchant arbitrage" },
];

type RunStatus = "idle" | "analyzing" | "verified";

const PHASE_BY_AGENT: Partial<Record<AgentId, string>> = {
  ian: "Substructure",
  caleb: "Superstructure",
  megan: "MEP",
  ruby: "Finishes",
  sharon: "Prelims",
};

/* =================================================================== page */

const SiteScoutSandbox = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState<StepId>(1);

  // ---------- Step 1: SiteScout ground truth ----------
  const [gt, setGt] = useState<GroundTruth>({ ...DEFAULT_GROUND_TRUTH });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    ground: true,
    logistics: true,
    services: true,
  });
  const setGtField = <K extends keyof GroundTruth>(k: K, v: GroundTruth[K]) =>
    setGt((p) => ({ ...p, [k]: v }));
  const derived = useMemo(() => deriveGroundTruth(gt), [gt]);
  const riskSummary = useMemo(() => buildSiteRiskSummary(gt, derived), [gt, derived]);
  const riskExclusions = useMemo(() => buildRiskExclusions(gt, derived), [gt, derived]);
  const [groundTruthLocked, setGroundTruthLocked] = useState(false);


  // ---------- Step 2: drawing + geometry ----------
  const [projectRef, setProjectRef] = useState("TEST-01-SMEDLEY");
  const [drawingName, setDrawingName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [extracted, setExtracted] = useState<ExtractedDrawing | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [boqTab, setBoqTab] = useState<"boq" | "drawings">("boq");
  const [quoteLocked, setQuoteLocked] = useState(false);
  const [trenchLength, setTrenchLength] = useState(24.5);
  const [drainageRun, setDrainageRun] = useState(14);
  const [basis, setBasis] = useState<MuckAwayBasis>("volume");
  const [superInputs, setSuperInputs] = useState<SuperstructureInputs>({ ...DEFAULT_SUPER_INPUTS });
  const [mepInputs, setMepInputs] = useState<MepInputs>({ ...DEFAULT_MEP_INPUTS });
  const [finishesInputs, setFinishesInputs] = useState<FinishesInputs>({
    ...DEFAULT_FINISHES_INPUTS,
    externalRenderArea: 28,
  });
  const [slabInputs, setSlabInputs] = useState<SlabInputs>({ ...DEFAULT_SLAB_INPUTS });
  const [envInputs, setEnvInputs] = useState<EnvelopeInputs>({ ...DEFAULT_ENVELOPE_INPUTS });
  const [prelimsInputs, setPrelimsInputs] = useState<PrelimsInputs>({ ...DEFAULT_PRELIMS_INPUTS });
  const setSuper = <K extends keyof SuperstructureInputs>(k: K, v: SuperstructureInputs[K]) =>
    setSuperInputs((p) => ({ ...p, [k]: v }));
  const setMep = <K extends keyof MepInputs>(k: K, v: MepInputs[K]) =>
    setMepInputs((p) => ({ ...p, [k]: v }));
  const setFin = <K extends keyof FinishesInputs>(k: K, v: FinishesInputs[K]) =>
    setFinishesInputs((p) => ({ ...p, [k]: v }));
  const setSlab = <K extends keyof SlabInputs>(k: K, v: SlabInputs[K]) =>
    setSlabInputs((p) => ({ ...p, [k]: v }));
  const setEnv = <K extends keyof EnvelopeInputs>(k: K, v: EnvelopeInputs[K]) =>
    setEnvInputs((p) => ({ ...p, [k]: v }));
  const setPrelims = <K extends keyof PrelimsInputs>(k: K, v: PrelimsInputs[K]) =>
    setPrelimsInputs((p) => ({ ...p, [k]: v }));

  const [status, setStatus] = useState<RunStatus>("idle");
  const [ground, setGround] = useState<TakeoffResult | null>(null);
  const [superResult, setSuperResult] = useState<SuperstructureResult | null>(null);
  const [mepResult, setMepResult] = useState<MepResult | null>(null);
  const [finishesResult, setFinishesResult] = useState<FinishesResult | null>(null);
  const [slabResult, setSlabResult] = useState<SlabResult | null>(null);
  const [envResult, setEnvResult] = useState<EnvelopeResult | null>(null);
  const [prelimsResult, setPrelimsResult] = useState<PrelimsResult | null>(null);
  const [overrides, setOverrides] = useState<
    Record<string, { quantity?: number; rate?: number; description?: string }>
  >({});

  const loadPreset = () => {
    setTrenchLength(24.5);
    setDrainageRun(14);
    setSuperInputs({ ...DEFAULT_SUPER_INPUTS });
    setMepInputs({ ...DEFAULT_MEP_INPUTS });
    setFinishesInputs({ ...DEFAULT_FINISHES_INPUTS, externalRenderArea: 28 });
    setSlabInputs({ ...DEFAULT_SLAB_INPUTS });
    setEnvInputs({ ...DEFAULT_ENVELOPE_INPUTS });
    setPrelimsInputs({ ...DEFAULT_PRELIMS_INPUTS });
    setDrawingName("preset-rear-extension-6x4.pdf");
  };

  /** Runs every agent engine. Explicit config lets drawing ingestion run without stale state. */
  const runTakeoff = (cfg?: {
    trenchLength?: number;
    drainageRun?: number;
    superInputs?: SuperstructureInputs;
    mepInputs?: MepInputs;
    finishesInputs?: FinishesInputs;
    slabInputs?: SlabInputs;
    envInputs?: EnvelopeInputs;
    prelimsInputs?: PrelimsInputs;
    groundTruth?: GroundTruth;
  }) => {
    setStatus("analyzing");
    setOverrides({});

    const gtNow = cfg?.groundTruth ?? gt;
    const derivedNow = cfg?.groundTruth ? deriveGroundTruth(cfg.groundTruth) : derived;
    const trench = cfg?.trenchLength ?? trenchLength;
    const drain = cfg?.drainageRun ?? drainageRun;
    const sup = cfg?.superInputs ?? superInputs;
    const mep = cfg?.mepInputs ?? mepInputs;
    const fin = cfg?.finishesInputs ?? finishesInputs;
    const slab = cfg?.slabInputs ?? slabInputs;
    const env = cfg?.envInputs ?? envInputs;
    const prel = cfg?.prelimsInputs ?? prelimsInputs;

    const groundInputs: GroundworksInputs = {
      projectRef,
      trenchLength: trench,
      soilType: gtNow.soilType,
      treeProximity: gtNow.treeProximity,
      treeSpecies: gtNow.treeSpecies,
      accessType: derivedNow.accessType,
      drainageInvertBaseline: gtNow.drainageInvertDepth,
      notes: "",
      drainageRunLength: drain,
      depthOverride: derivedNow.digDepth,
      clayboardOverride: derivedNow.clayboardRequired,
    };
    const effectiveBasis: MuckAwayBasis =
      derivedNow.accessType === "8-Wheel Grab Direct Access" ? basis : "volume";

    const g = runSubstructureTakeoff(groundInputs, DEFAULT_RATES, DEFAULT_DIMENSIONS, effectiveBasis);
    const s = runSuperstructureTakeoff(trench, sup, DEFAULT_SUPER_RATES, {
      ...DEFAULT_SUPER_DIMENSIONS,
    });
    const m = runMepTakeoff(
      { ...mep, consumerUnitUpgrade: derivedNow.consumerUnitUpgrade },
      DEFAULT_MEP_RATES,
    );
    const f = runFinishesTakeoff(fin, DEFAULT_FINISHES_RATES);
    const sl = runSlabTakeoff(slab, DEFAULT_SLAB_RATES);
    const en = runEnvelopeTakeoff(env, DEFAULT_ENVELOPE_RATES);
    const pr = runPrelimsTakeoff(prel, DEFAULT_PRELIMS_RATES);

    window.setTimeout(() => {
      setGround(g);
      setSuperResult(s);
      setMepResult(m);
      setFinishesResult(f);
      setSlabResult(sl);
      setEnvResult(en);
      setPrelimsResult(pr);
      setStatus("verified");
      setStep(2);
    }, 900);
  };

  /** Drawing ingestion → auto-populate every agent input, then run the takeoff. */
  const handleIngest = (data: ExtractedDrawing, url: string | null) => {
    const nextGt: GroundTruth = { ...gt, ...data.groundTruthPatch };
    setExtracted(data);
    setPreviewUrl(url);
    setDrawingName(data.sheetName);
    setGt(nextGt);
    setTrenchLength(data.trenchLength);
    setDrainageRun(data.drainageRun);
    setSuperInputs(data.superInputs);
    setMepInputs(data.mepInputs);
    setFinishesInputs(data.finishesInputs);
    setSlabInputs(data.slabInputs);
    setEnvInputs(data.envelopeInputs);
    setPrelimsInputs(data.prelimsInputs);
    setBoqTab("boq");
    runTakeoff({
      trenchLength: data.trenchLength,
      drainageRun: data.drainageRun,
      superInputs: data.superInputs,
      mepInputs: data.mepInputs,
      finishesInputs: data.finishesInputs,
      slabInputs: data.slabInputs,
      envInputs: data.envelopeInputs,
      prelimsInputs: data.prelimsInputs,
      groundTruth: nextGt,
    });
  };


  // ---------- Step 3: master BoQ ----------
  const [ohpPct, setOhpPct] = useState(15);

  const baseBoq: BoqLine[] = useMemo(() => {
    const lines: BoqLine[] = [
      ...(prelimsResult?.boq ?? []),
      ...(ground?.boq ?? []),
      ...(slabResult?.boq ?? []),
      ...(superResult?.boq ?? []),
      ...(envResult?.boq ?? []),
      ...(mepResult?.boq ?? []),
      ...(finishesResult?.boq ?? []),
    ];
    if (lines.length && ohpPct > 0) {
      const net = lines.reduce((sum, l) => sum + l.total, 0);
      lines.push({
        phase: "Prelims",
        description: `Main contractor preliminaries, site supervision, overheads & profit (OH&P) @ ${ohpPct}%`,
        formula: `${ohpPct}% of £${net.toFixed(2)} net trade works`,
        quantity: 1,
        unit: "item",
        rate: Number(((net * ohpPct) / 100).toFixed(2)),
        total: Number(((net * ohpPct) / 100).toFixed(2)),
      });
    }
    return lines;
  }, [ground, slabResult, superResult, envResult, mepResult, finishesResult, prelimsResult, ohpPct]);


  const masterBoq: MasterBoqLine[] = useMemo(() => {
    return buildMasterBoq(baseBoq).map((line) => {
      const o = overrides[line.key];
      const quantity = o?.quantity ?? line.quantity;
      const rate = o?.rate ?? line.rate;
      return {
        ...line,
        description: o?.description ?? line.description,
        quantity,
        rate,
        total: Number((quantity * rate).toFixed(2)),
      };
    });
  }, [baseBoq, overrides]);

  const updateOverride = (
    key: string,
    field: "quantity" | "rate" | "description",
    value: number | string,
  ) => setOverrides((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));

  const [agentFilter, setAgentFilter] = useState<AgentId | null>(null);
  const visibleBoq = agentFilter ? masterBoq.filter((l) => l.agent === agentFilter) : masterBoq;

  // Stage 2 — contractor profit markup on top of the measured cost roll-up.
  const [markupPct, setMarkupPct] = useState(25);
  const [openPacks, setOpenPacks] = useState<Record<string, boolean>>({ A: true });

  // Stage 3 — competitor quote checker.
  const [competitorText, setCompetitorText] = useState("");


  // ---------- Step 4: arbitrage ----------
  const [negotiated, setNegotiated] = useState<Record<PackId, number | undefined>>(
    {} as Record<PackId, number | undefined>,
  );
  const [globalDiscount, setGlobalDiscount] = useState(18);
  const [retainPct, setRetainPct] = useState(70);
  const [vatRate, setVatRate] = useState(20);

  const arbitrage = useMemo(
    () => runArbitrage(masterBoq, negotiated, retainPct, vatRate),
    [masterBoq, negotiated, retainPct, vatRate],
  );

  const applyGlobalDiscount = () => {
    const next = {} as Record<PackId, number | undefined>;
    for (const p of arbitrage.packs)
      next[p.pack.id] = Number((p.retailTotal * (1 - globalDiscount / 100)).toFixed(2));
    setNegotiated(next);
  };

  // ---------- shared derived ----------
  const retailTotal = arbitrage.retailTotal;
  /** Stage 2 cost roll-up + contractor markup = base retail customer quotation. */
  const markupValue = Number(((retailTotal * markupPct) / 100).toFixed(2));
  const baseRetailQuote = Number((retailTotal + markupValue).toFixed(2));
  /** Stage 4 may pass part of the trade gap back to the customer. */
  const finalCustomerExVat = Number((baseRetailQuote - arbitrage.passedToCustomer).toFixed(2));
  const finalCustomerIncVat = Number((finalCustomerExVat * (1 + vatRate / 100)).toFixed(2));
  const quoteArbitrage = useMemo(
    () => ({
      ...arbitrage,
      retailTotal: baseRetailQuote,
      customerQuoteTotal: finalCustomerExVat,
      customerQuoteIncVat: finalCustomerIncVat,
    }),
    [arbitrage, baseRetailQuote, finalCustomerExVat, finalCustomerIncVat],
  );
  const competitorCheck = useMemo(
    () => checkCompetitorQuote(masterBoq, competitorText, finalCustomerExVat),
    [masterBoq, competitorText, finalCustomerExVat],
  );
  const packGroups = useMemo(
    () =>
      arbitrage.packs.map((p) => ({
        pack: p.pack,
        retailTotal: p.retailTotal,
        lines: agentFilter ? p.lines.filter((l) => l.agent === agentFilter) : p.lines,
      })),
    [arbitrage.packs, agentFilter],
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
    () =>
      buildLogisticsPlan({
        ground,
        superstructure: superResult,
        accessType: derived.accessType,
      }),
    [ground, superResult, derived.accessType],
  );
  const attentionCount = complianceItems.filter((c) => c.state === "attention").length;
  const phaseTotal = (phase: string) =>
    masterBoq.filter((l) => l.phase === phase).reduce((s, l) => s + l.total, 0);

  const avatarState: "clean" | "site" = status === "analyzing" ? "site" : "clean";

  const dialogue = (agent: Agent): string => {
    if (status === "idle")
      return agent.id === "lee"
        ? "Survey first. No drawing gets priced until SiteScout has set the ground truth."
        : "Standing by for the SiteScout ground truth.";
    if (status === "analyzing") return "On site — measuring up and pricing now…";
    switch (agent.id) {
      case "lee":
        return `Retail benchmark ${money(retailTotal)}, negotiated trade ${money(arbitrage.negotiatedTotal)}. ${money(arbitrage.tradeGap)} of trade gap on the table (${arbitrage.tradeGapPct}%), ${retainPct}% retained. ${attentionCount} compliance flag(s) before I sign it off.`;
      case "ian":
        return ground
          ? `SiteScout put me at ${ground.digDepth}m in ${gt.soilType.toLowerCase()}${derived.clayboardRequired ? " with clayboard" : ""}. ${gt.accessWidth}m access means ${derived.accessType.toLowerCase()} — ${ground.bulkedMuckVolume} m³ bulked across ${ground.grabWagonLoads} load(s). ${money(phaseTotal("Substructure"))} in the ground.`
          : "No substructure data yet.";
      case "caleb":
        return superResult
          ? `Off the drawing: ${superResult.netWallArea} m² net wall after cutouts, ${superResult.facingBricksQty} facings (${superInputs.brickFormat}) and ${superResult.denseBlocksQty} inner blocks. True roof surface ${superResult.trueRoofSurfaceArea} m² at ×${superResult.pitchMultiplier}. ${money(phaseTotal("Superstructure"))}.`
          : "No superstructure data yet.";
      case "megan":
        return mepResult
          ? `${mepResult.totalPoints} points first and second fix. SiteScout logged a "${gt.consumerUnitType}" with ${gt.spareWays} spare way(s) — ${derived.consumerUnitUpgrade ? "board changeover priced" : "no changeover needed"}. ${derived.boilerUpgradeLikely ? `Existing ${gt.boilerOutputKw}kW ${gt.systemType} flagged as marginal. ` : ""}${money(phaseTotal("MEP"))}.`
          : "No MEP data yet.";
      case "ruby":
        return finishesResult
          ? `${finishesResult.boardSheets} sheets of 12.5mm, ${finishesResult.skimArea} m² skim, ${finishesInputs.externalRenderArea} m² external render, ${finishesInputs.skirtingRun} lm skirting. ${money(phaseTotal("Finishes"))}.`
          : "No finishes data yet.";
      case "amy":
        return `${masterBoq.length} BoQ lines split into 5 RFQ tender packs at retail benchmark ${money(retailTotal)}. Merchants quoting back against ${money(arbitrage.negotiatedTotal)} — that's ${money(arbitrage.tradeGap)} of buying advantage I'm holding, not giving away by accident.`;
      case "elizabeth":
        return `${complianceItems.length} building control checks across Parts A, B, C, E, H, L and P. ${attentionCount} flagged.${gt.utilitiesCrossingFootprint ? " In-ground utilities cross the footprint — CAT scan before any machine work." : ""}`;
      case "sharon":
        return `${logistics.length}-stage delivery sequence against ${gt.accessWidth}m access and ${gt.distanceToRoad}m to the road.${gt.overheadCables ? " GS6 exclusion zone applies to all lifting." : ""}`;
      default:
        return "";
    }
  };

  const agentStatus = () =>
    status === "idle" ? "Standing by" : status === "analyzing" ? "On site" : "Verified";

  /* ------------------------------------------------------------ renderers */

  const Group = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        onClick={() => setOpenGroups((p) => ({ ...p, [id]: !p[id] }))}
        className="w-full flex items-center justify-between px-3 py-2.5"
      >
        <span className="font-mono text-[11px] uppercase tracking-wider text-white/75">{title}</span>
        <span style={{ color: ACCENT }} className="font-mono text-xs">
          {openGroups[id] ? "−" : "+"}
        </span>
      </button>
      {openGroups[id] && <div className="px-3 pb-3 grid grid-cols-2 gap-3">{children}</div>}
    </div>
  );

  /** Strictly sequential — a stage only unlocks when the previous one has produced its output. */
  const stageUnlocked = (n: StepId) =>
    n === 1 ? true : n === 2 ? groundTruthLocked : status === "verified" && groundTruthLocked;

  const StepBadge = ({ n }: { n: StepId }) => {
    const active = step === n;
    const s = STEPS[n - 1];
    const unlocked = stageUnlocked(n);
    return (
      <button
        onClick={() => unlocked && setStep(n)}
        aria-pressed={active}
        disabled={!unlocked}
        title={unlocked ? undefined : "Complete the previous stage first"}
        className="flex-1 min-w-[170px] text-left rounded-xl border px-3 py-2.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
        style={{
          borderColor: active ? ACCENT : "rgba(255,255,255,0.12)",
          backgroundColor: active ? "rgba(56,189,248,0.10)" : "rgba(255,255,255,0.02)",
        }}
      >
        <p
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: active ? ACCENT : "rgba(255,255,255,0.45)" }}
        >
          Stage {n} · {s.sub} {unlocked ? "" : "🔒"}
        </p>
        <p className="font-heading text-sm font-bold text-white mt-0.5">{s.label}</p>
      </button>
    );
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
          background: `radial-gradient(1100px 560px at 10% -10%, rgba(56,189,248,0.10), transparent 60%), ${BG}`,
        }}
      >
        <div className="max-w-[1700px] mx-auto px-4 md:px-8 pt-14 md:pt-10 pb-24">
          {/* ---------------- header ---------------- */}
          <div className="mb-5">
            <span
              className="inline-block font-mono text-[10px] uppercase tracking-[0.18em] rounded px-2 py-0.5 mb-3"
              style={{ color: ACCENT, border: `1px solid ${ACCENT}66` }}
            >
              Internal Beta · Sandbox
            </span>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              2-Tier ProGrafter Engine — SiteScout Ground Truth + Multi-Agent Takeoff &amp; Merchant
              Procurement Hub
            </h1>
            <p className="font-mono text-sm text-white/55 mt-2 max-w-4xl">
              Tier 1 sets the physical site baseline. Tier 2 runs four specialist takeoff agents
              against the drawing geometry, compiles a retail-benchmark BoQ, tenders it as five
              merchant RFQ packs, then splits the negotiated trade gap between profit and price.
            </p>
          </div>

          {/* ---------------- Lee command bar ---------------- */}
          <div
            className="rounded-2xl border p-4 md:p-5 mb-5"
            style={{
              borderColor: "rgba(56,189,248,0.35)",
              background:
                "linear-gradient(120deg, rgba(56,189,248,0.12), rgba(255,255,255,0.02) 60%)",
            }}
          >
            <div className="flex items-start gap-4 flex-wrap">
              <AgentAvatar agent={AGENTS[0]} state={avatarState} size={72} active />
              <div className="flex-1 min-w-[240px]">
                <p className="font-heading text-lg font-bold text-white">
                  {AGENTS[0].name} — {AGENTS[0].title}
                </p>
                <p
                  className="font-mono text-[10px] uppercase tracking-wider mt-0.5"
                  style={{ color: ACCENT }}
                >
                  {AGENTS[0].roleBadge}
                </p>
                <p className="font-mono text-xs text-white/60 mt-2 italic">“{AGENTS[0].motto}”</p>
                <p className="font-mono text-xs text-white/75 mt-2">{dialogue(AGENTS[0])}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div>
                  <p className={labelClass}>Retail benchmark</p>
                  <p className="font-heading text-xl text-white">{money(retailTotal)}</p>
                </div>
                <div>
                  <p className={labelClass}>Negotiated trade</p>
                  <p className="font-heading text-xl text-white">
                    {money(arbitrage.negotiatedTotal)}
                  </p>
                </div>
                <div>
                  <p className={labelClass}>Trade gap</p>
                  <p className="font-heading text-xl" style={{ color: ACCENT }}>
                    {money(arbitrage.tradeGap)}{" "}
                    <span className="text-sm">/ {arbitrage.tradeGapPct}%</span>
                  </p>
                </div>
                <div>
                  <p className={labelClass}>Job health</p>
                  <p
                    className="font-mono text-[11px] uppercase tracking-wider px-2 py-1 rounded-full inline-block"
                    style={stateStyle(
                      status !== "verified" ? "info" : attentionCount > 2 ? "attention" : "required",
                    )}
                  >
                    {status !== "verified"
                      ? "Awaiting takeoff"
                      : attentionCount > 2
                        ? `Review — ${attentionCount} flags`
                        : "Healthy — signed off"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------- pipeline steps ---------------- */}
          <div className="flex flex-wrap gap-3 mb-6">
            {STEPS.map((s) => (
              <StepBadge key={s.id} n={s.id} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* ================= LEFT: Step 1 ground truth ================= */}
            <div className="xl:col-span-4 space-y-4">
              <DrawingIngestZone
                extracted={extracted}
                previewUrl={previewUrl}
                onIngest={handleIngest}
                onOpenViewer={() => {
                  setStep(2);
                  setBoqTab("drawings");
                }}
              />

              <div className={cardClass}>
                <div className="flex items-center justify-between mb-3">
                  <SectionTitle>Stage 1 · Physical Ground Truth</SectionTitle>
                  <span
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(56,189,248,0.15)", color: ACCENT }}
                  >
                    Tier 1
                  </span>
                </div>
                <div className="space-y-3">
                  <Group id="ground" title="Ground & geotechnical">
                    <Field label="Soil class">
                      <Select
                        value={gt.soilType}
                        options={SOIL_TYPES}
                        onChange={(v) => setGtField("soilType", v)}
                      />
                    </Field>
                    <Field label="Tree species">
                      <input
                        className={inputClass}
                        value={gt.treeSpecies}
                        onChange={(e) => setGtField("treeSpecies", e.target.value)}
                      />
                    </Field>
                    <Field label="Tree proximity (m)">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={gt.treeProximity}
                        onChange={(e) => setGtField("treeProximity", Number(e.target.value))}
                      />
                    </Field>
                    <div className="flex items-end pb-2">
                      <Toggle
                        label="Utilities cross footprint"
                        checked={gt.utilitiesCrossingFootprint}
                        onChange={(v) => setGtField("utilitiesCrossingFootprint", v)}
                      />
                    </div>
                  </Group>

                  <Group id="logistics" title="Logistics & boundary">
                    <Field label="Access width (m)">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={gt.accessWidth}
                        onChange={(e) => setGtField("accessWidth", Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Distance to road (m)">
                      <input
                        type="number"
                        step="0.5"
                        className={inputClass}
                        value={gt.distanceToRoad}
                        onChange={(e) => setGtField("distanceToRoad", Number(e.target.value))}
                      />
                    </Field>
                    <div className="flex items-end pb-2 col-span-2">
                      <Toggle
                        label="Overhead cables on site"
                        checked={gt.overheadCables}
                        onChange={(v) => setGtField("overheadCables", v)}
                      />
                    </div>
                  </Group>

                  <Group id="services" title="Existing services">
                    <div className="col-span-2">
                      <Field label="Consumer unit type">
                        <Select
                          value={gt.consumerUnitType}
                          options={CU_TYPES}
                          onChange={(v) => setGtField("consumerUnitType", v)}
                        />
                      </Field>
                    </div>
                    <Field label="Spare ways">
                      <input
                        type="number"
                        className={inputClass}
                        value={gt.spareWays}
                        onChange={(e) => setGtField("spareWays", Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Boiler output (kW)">
                      <input
                        type="number"
                        className={inputClass}
                        value={gt.boilerOutputKw}
                        onChange={(e) => setGtField("boilerOutputKw", Number(e.target.value))}
                      />
                    </Field>
                    <Field label="System type">
                      <Select
                        value={gt.systemType}
                        options={SYSTEM_TYPES}
                        onChange={(v) => setGtField("systemType", v)}
                      />
                    </Field>
                    <Field label="Drainage invert (m)">
                      <input
                        type="number"
                        step="0.1"
                        className={inputClass}
                        value={gt.drainageInvertDepth}
                        onChange={(e) => setGtField("drainageInvertDepth", Number(e.target.value))}
                      />
                    </Field>
                  </Group>
                </div>
              </div>

              {/* derived rules */}
              <div className={cardClass}>
                <SectionTitle>Ground truth → agent rules</SectionTitle>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    ["Dig depth", `${derived.digDepth} m`],
                    ["Clayboard", derived.clayboardRequired ? "Required" : "Not required"],
                    ["Muck-away", derived.accessType],
                    ["Board upgrade", derived.consumerUnitUpgrade ? "Priced" : "Not needed"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-white/10 p-2.5">
                      <p className={labelClass}>{k}</p>
                      <p className="font-mono text-xs text-white/85">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                  {derived.notes.map((n, i) => (
                    <p key={i} className="font-mono text-[11px] text-white/70 leading-relaxed">
                      {n}
                    </p>
                  ))}
                </div>
              </div>

              {/* Stage 1 output — locked site risk & ground condition summary */}
              <div
                className={cardClass}
                style={groundTruthLocked ? { borderColor: `${ACCENT}66` } : undefined}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <SectionTitle>Site Risk &amp; Ground Condition Summary</SectionTitle>
                  <span
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={
                      groundTruthLocked
                        ? { backgroundColor: "rgba(56,189,248,0.15)", color: ACCENT }
                        : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                    }
                  >
                    {groundTruthLocked ? "Locked" : "Draft"}
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                  {riskSummary.map((n, i) => (
                    <p key={i} className="font-mono text-[11px] text-white/75 leading-relaxed">
                      • {n}
                    </p>
                  ))}
                </div>
                <p className={`${labelClass} mt-3`}>Stated ground-risk exclusions</p>
                <div className="rounded-xl border border-white/10 p-3 space-y-2">
                  {riskExclusions.map((n, i) => (
                    <p key={i} className="font-mono text-[11px] text-white/55 leading-relaxed">
                      • {n}
                    </p>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setGroundTruthLocked(true);
                    setStep(2);
                  }}
                  className="mt-3 w-full rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider font-bold"
                  style={
                    groundTruthLocked
                      ? { border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.7)" }
                      : { backgroundColor: ACCENT, color: "#04233a" }
                  }
                >
                  {groundTruthLocked
                    ? "Ground truth locked · continue to Stage 2"
                    : "🔒 Lock ground truth & open Stage 2"}
                </button>
              </div>
            </div>

            {/* ================= RIGHT: stages 2–4 ================= */}
            <div className="xl:col-span-8 space-y-5">
              {/* ---------- STEP 2 ---------- */}
              {step <= 2 && (
                <div className={cardClass}>
                  <SectionTitle>Step 2 · Drawing upload &amp; specialist agent takeoffs</SectionTitle>

                  <div className="rounded-xl border border-dashed border-white/20 p-4 mb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.dwg,.txt"
                        className="hidden"
                        onChange={(e) => setDrawingName(e.target.files?.[0]?.name ?? null)}
                      />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-white/80 border border-white/20 hover:border-[#38bdf8]"
                      >
                        📐 Attach drawing / spec
                      </button>
                      <button
                        onClick={loadPreset}
                        className="rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-white/80 border border-white/20 hover:border-[#38bdf8]"
                      >
                        Load preset — 6×4m rear extension
                      </button>
                      <span className="font-mono text-[11px] text-white/50">
                        {drawingName ? `Attached: ${drawingName}` : "No drawing attached"}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-white/40 mt-2">
                      Geometry below is the parsed baseline — confirm or correct it against the
                      drawing before running the takeoff.
                    </p>
                  </div>

                  <Field label="Project reference">
                    <input
                      className={inputClass}
                      value={projectRef}
                      onChange={(e) => setProjectRef(e.target.value)}
                    />
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Ian */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="font-heading text-sm font-bold text-white mb-2">
                        Ian · Groundworks &amp; Substructure
                      </p>
                      <p className="font-mono text-[10px] text-white/45 mb-3">
                        Inherits {derived.digDepth}m dig and {derived.accessType.toLowerCase()} from
                        SiteScout.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Trench perimeter (lm)">
                          <input
                            type="number"
                            step="0.1"
                            className={inputClass}
                            value={trenchLength}
                            onChange={(e) => setTrenchLength(Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Drainage run (lm)">
                          <input
                            type="number"
                            step="0.5"
                            className={inputClass}
                            value={drainageRun}
                            onChange={(e) => setDrainageRun(Number(e.target.value))}
                          />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Muck-away basis">
                            <select
                              className={inputClass}
                              value={basis}
                              disabled={derived.accessType !== "8-Wheel Grab Direct Access"}
                              onChange={(e) => setBasis(e.target.value as MuckAwayBasis)}
                            >
                              <option value="volume" style={{ backgroundColor: BG }}>
                                Per m³ (skip / conveyor)
                              </option>
                              <option value="grab_loads" style={{ backgroundColor: BG }}>
                                Per 8-wheel grab load
                              </option>
                            </select>
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* Caleb */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="font-heading text-sm font-bold text-white mb-2">
                        Caleb · Superstructure, Masonry &amp; Roof
                      </p>
                      <p className="font-mono text-[10px] text-white/45 mb-3">
                        Inherits the {trenchLength} lm perimeter from Ian.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Field label="Brick format">
                            <Select
                              value={superInputs.brickFormat}
                              options={BRICK_FORMATS}
                              onChange={(v) => setSuper("brickFormat", v)}
                            />
                          </Field>
                        </div>
                        <Field label="Wall height (m)">
                          <input
                            type="number"
                            step="0.1"
                            className={inputClass}
                            value={superInputs.wallHeight}
                            onChange={(e) => setSuper("wallHeight", Number(e.target.value))}
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
                        <div className="col-span-2">
                          <Field label="Roof type">
                            <Select
                              value={superInputs.roofType}
                              options={ROOF_TYPES}
                              onChange={(v) => setSuper("roofType", v)}
                            />
                          </Field>
                        </div>
                        <div className="col-span-2">
                          <Field label="Roof covering">
                            <Select
                              value={superInputs.roofCovering}
                              options={ROOF_COVERINGS}
                              onChange={(v) => setSuper("roofCovering", v)}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* Megan */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="font-heading text-sm font-bold text-white mb-2">
                        Megan · Building Services &amp; MEP
                      </p>
                      <p className="font-mono text-[10px] text-white/45 mb-3">
                        Board changeover is set by the SiteScout service survey
                        {derived.consumerUnitUpgrade ? " — priced" : " — not required"}.
                      </p>
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
                          <Toggle
                            label="EV charger"
                            checked={mepInputs.evCharger}
                            onChange={(v) => setMep("evCharger", v)}
                          />
                          <Toggle
                            label="Wet UFH"
                            checked={mepInputs.underfloorHeating}
                            onChange={(v) => setMep("underfloorHeating", v)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ruby */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="font-heading text-sm font-bold text-white mb-2">
                        Ruby · Drylining, Plastering &amp; Finishes
                      </p>
                      <p className="font-mono text-[10px] text-white/45 mb-3">
                        Inherits internal areas and external elevation specs from the drawing.
                      </p>
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
                        <Field label="External render (m²)">
                          <input
                            type="number"
                            className={inputClass}
                            value={finishesInputs.externalRenderArea}
                            onChange={(e) => setFin("externalRenderArea", Number(e.target.value))}
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
                        <div className="flex items-end pb-2">
                          <Toggle
                            label="2-coat skim"
                            checked={finishesInputs.twoCoatSkim}
                            onChange={(v) => setFin("twoCoatSkim", v)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Slab, glazing, steel, roofline & prelims */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 md:col-span-2">
                      <p className="font-heading text-sm font-bold text-white mb-2">
                        Ian &amp; Caleb &amp; Sharon · Slab, Glazing, Steel, Roofline &amp; Prelims
                      </p>
                      <p className="font-mono text-[10px] text-white/45 mb-3">
                        Turnkey packages — oversite slab, external openings, knock-through steel,
                        rainwater goods, plant hire and site prelims.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Field label="Ground-floor area (m²)">
                          <input
                            type="number"
                            className={inputClass}
                            value={slabInputs.floorArea}
                            onChange={(e) => setSlab("floorArea", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Bi-fold door sets (Nr)">
                          <input
                            type="number"
                            className={inputClass}
                            value={envInputs.bifoldSets}
                            onChange={(e) => setEnv("bifoldSets", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Casement windows (Nr)">
                          <input
                            type="number"
                            className={inputClass}
                            value={envInputs.windowCount}
                            onChange={(e) => setEnv("windowCount", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Rooflights (Nr)">
                          <input
                            type="number"
                            className={inputClass}
                            value={envInputs.rooflightCount}
                            onChange={(e) => setEnv("rooflightCount", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Steel span (lm)">
                          <input
                            type="number"
                            step="0.1"
                            className={inputClass}
                            value={envInputs.steelSpan}
                            onChange={(e) => setEnv("steelSpan", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Roofline run (lm)">
                          <input
                            type="number"
                            step="0.5"
                            className={inputClass}
                            value={envInputs.perimeterRun}
                            onChange={(e) => setEnv("perimeterRun", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Abutment lead run (lm)">
                          <input
                            type="number"
                            step="0.5"
                            className={inputClass}
                            value={envInputs.abutmentRun}
                            onChange={(e) => setEnv("abutmentRun", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="8-yard skips (Nr)">
                          <input
                            type="number"
                            className={inputClass}
                            value={prelimsInputs.skipCount}
                            onChange={(e) => setPrelims("skipCount", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Digger hire (weeks)">
                          <input
                            type="number"
                            className={inputClass}
                            value={prelimsInputs.diggerWeeks}
                            onChange={(e) => setPrelims("diggerWeeks", Number(e.target.value))}
                          />
                        </Field>
                        <Field label="OH&P (%)">
                          <input
                            type="number"
                            className={inputClass}
                            value={ohpPct}
                            onChange={(e) => setOhpPct(Number(e.target.value))}
                          />
                        </Field>
                        <Field label="Dumper hire (weeks)">
                          <input
                            type="number"
                            className={inputClass}
                            value={prelimsInputs.dumperWeeks}
                            onChange={(e) => setPrelims("dumperWeeks", Number(e.target.value))}
                          />
                        </Field>
                        <div className="flex items-end pb-2 gap-4 col-span-2">
                          <Toggle
                            label="Rooflights"
                            checked={envInputs.rooflights}
                            onChange={(v) => setEnv("rooflights", v)}
                          />
                          <Toggle
                            label="Knock-through"
                            checked={envInputs.knockThrough}
                            onChange={(v) => setEnv("knockThrough", v)}
                          />
                          <Toggle
                            label="Site setup"
                            checked={prelimsInputs.siteSetup}
                            onChange={(v) => setPrelims("siteSetup", v)}
                          />
                          <Toggle
                            label="Scaffolding"
                            checked={prelimsInputs.scaffolding}
                            onChange={(v) => setPrelims("scaffolding", v)}
                          />
                          <Toggle
                            label="BC / SE fees"
                            checked={prelimsInputs.statutoryFees}
                            onChange={(v) => setPrelims("statutoryFees", v)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                  <button
                    onClick={() => runTakeoff()}
                    disabled={status === "analyzing"}
                    className="mt-4 w-full rounded-xl px-4 py-3 font-mono text-sm uppercase tracking-wider font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: ACCENT, color: "#04233a" }}
                  >
                    {status === "analyzing"
                      ? "Agents on site — calculating…"
                      : "🚀 Run 4-agent takeoff against SiteScout ground truth"}
                  </button>
                </div>
              )}

              {/* ---------- STAGE 2 OUTPUT: granular takeoff & retail costing ---------- */}
              {step === 2 && status === "verified" && (
                <>
                  <div className={cardClass}>
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <SectionTitle>
                        Stage 2 · Granular material takeoff (retail costing)
                      </SectionTitle>
                      <div className="flex gap-2 flex-wrap">
                        {agentFilter && (
                          <button
                            onClick={() => setAgentFilter(null)}
                            className="font-mono text-[10px] uppercase tracking-wider rounded px-2 py-1 border"
                            style={{ borderColor: `${ACCENT}66`, color: ACCENT }}
                          >
                            Clear agent filter
                          </button>
                        )}
                        <button
                          onClick={() =>
                            downloadText(
                              `${projectRef}-master-boq.csv`,
                              masterBoqToCsv(masterBoq, projectRef),
                            )
                          }
                          className="font-mono text-[10px] uppercase tracking-wider rounded px-2 py-1 border border-white/20 text-white/75"
                        >
                          📥 Export master BoQ (CSV)
                        </button>
                        <button
                          disabled={!masterBoq.length}
                          onClick={() => setStep(3)}
                          className="font-mono text-[10px] uppercase tracking-wider rounded px-2.5 py-1 font-bold disabled:opacity-50"
                          style={{ backgroundColor: ACCENT, color: "#04233a" }}
                        >
                          Continue to Stage 3 · Customer quote →
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      {([
                        ["boq", "Bill of Quantities"],
                        ["drawings", "Drawings & Markup"],
                      ] as const).map(([id, label]) => {
                        const on = boqTab === id;
                        return (
                          <button
                            key={id}
                            onClick={() => setBoqTab(id)}
                            aria-pressed={on}
                            className="rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border transition-colors"
                            style={{
                              borderColor: on ? ACCENT : "rgba(255,255,255,0.15)",
                              backgroundColor: on ? "rgba(56,189,248,0.12)" : "transparent",
                              color: on ? ACCENT : "rgba(255,255,255,0.65)",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                      {quoteLocked && (
                        <span
                          className="self-center font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full"
                          style={{ backgroundColor: "rgba(56,189,248,0.15)", color: ACCENT }}
                        >
                          Quote locked &amp; exported
                        </span>
                      )}
                    </div>

                    {boqTab === "drawings" ? (
                      <DrawingMarkupViewer extracted={extracted} previewUrl={previewUrl} />
                    ) : !masterBoq.length ? (
                      <p className="font-mono text-xs text-white/45">
                        No lines yet — run the agent takeoff in Step 2.
                      </p>
                    ) : (
                      <>
                        <p className="font-mono text-[11px] text-white/45 mb-3">
                          Every pack is expandable — click a pack to audit the exact formula,
                          quantity, unit and rate behind each priced line.
                        </p>
                        <div className="space-y-2">
                          {packGroups.map((g) => {
                            const open = !!openPacks[g.pack.id];
                            return (
                              <div
                                key={g.pack.id}
                                className="rounded-xl border border-white/10 bg-white/[0.02]"
                              >
                                <button
                                  onClick={() =>
                                    setOpenPacks((p) => ({ ...p, [g.pack.id]: !p[g.pack.id] }))
                                  }
                                  aria-expanded={open}
                                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
                                >
                                  <span className="min-w-0">
                                    <span className="block font-mono text-xs text-white/85 truncate">
                                      {g.pack.name}
                                    </span>
                                    <span className="block font-mono text-[10px] text-white/40 mt-0.5">
                                      {g.lines.length} line(s) · {g.pack.merchantHint}
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-3 shrink-0">
                                    <span
                                      className="font-heading text-sm"
                                      style={{ color: ACCENT }}
                                    >
                                      {money(g.retailTotal)}
                                    </span>
                                    <span className="font-mono text-xs" style={{ color: ACCENT }}>
                                      {open ? "−" : "+"}
                                    </span>
                                  </span>
                                </button>
                                {open && (
                                  <div className="overflow-x-auto px-3 pb-3">
                                    <table className="w-full min-w-[1080px] text-left border-collapse">
                                      <thead>
                                        <tr>
                                          {[
                                            "Trade Agent",
                                            "Category",
                                            "Item Description",
                                            "Formula / Metric",
                                            "Qty",
                                            "Unit",
                                            "Retail Rate (£)",
                                            "Retail Total (£)",
                                          ].map((h) => (
                                            <th
                                              key={h}
                                              className="font-mono text-[9px] uppercase tracking-wider text-white/45 border-b border-white/10 pb-2 pr-3 whitespace-nowrap"
                                            >
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {g.lines.map((l) => (
                                          <tr
                                            key={l.key}
                                            className="border-b border-white/5 align-top"
                                          >
                                            <td className="py-2 pr-3">
                                              <span
                                                className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                style={{
                                                  backgroundColor: "rgba(56,189,248,0.14)",
                                                  color: ACCENT,
                                                }}
                                              >
                                                {l.agent}
                                              </span>
                                            </td>
                                            <td className="py-2 pr-3 font-mono text-[11px] text-white/65 min-w-[120px]">
                                              {l.category}
                                            </td>
                                            <td className="py-2 pr-3 min-w-[220px]">
                                              <input
                                                className={inputClass}
                                                value={l.description}
                                                onChange={(e) =>
                                                  updateOverride(
                                                    l.key,
                                                    "description",
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                            </td>
                                            <td className="py-2 pr-3 font-mono text-[10px] text-white/40 min-w-[160px]">
                                              {l.formula}
                                            </td>
                                            <td className="py-2 pr-3 w-[110px]">
                                              <input
                                                type="number"
                                                step="0.01"
                                                className={inputClass}
                                                value={l.quantity}
                                                onChange={(e) =>
                                                  updateOverride(
                                                    l.key,
                                                    "quantity",
                                                    Number(e.target.value),
                                                  )
                                                }
                                              />
                                            </td>
                                            <td className="py-2 pr-3 font-mono text-[11px] text-white/60">
                                              {l.unit}
                                            </td>
                                            <td className="py-2 pr-3 w-[110px]">
                                              <input
                                                type="number"
                                                step="0.01"
                                                className={inputClass}
                                                value={l.rate}
                                                onChange={(e) =>
                                                  updateOverride(
                                                    l.key,
                                                    "rate",
                                                    Number(e.target.value),
                                                  )
                                                }
                                              />
                                            </td>
                                            <td
                                              className="py-2 font-heading text-sm whitespace-nowrap"
                                              style={{ color: ACCENT }}
                                            >
                                              {money(l.total)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                          {["Substructure", "Superstructure", "MEP", "Finishes"].map((p) => (
                            <div key={p} className="rounded-lg border border-white/10 p-2.5">
                              <p className={labelClass}>{p}</p>
                              <p className="font-mono text-xs text-white/85">
                                {money(phaseTotal(p))}
                              </p>
                            </div>
                          ))}
                          <div
                            className="rounded-lg border p-2.5"
                            style={{ borderColor: `${ACCENT}66` }}
                          >
                            <p className={labelClass}>Retail benchmark</p>
                            <p className="font-heading text-base" style={{ color: ACCENT }}>
                              {money(retailTotal)}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Stage 2 cost roll-up → base retail customer quotation */}
                  <div className={cardClass}>
                    <SectionTitle>Cost roll-up &amp; contractor markup</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="md:col-span-1">
                        <Field label="Contractor profit markup (%)">
                          <input
                            type="number"
                            className={inputClass}
                            value={markupPct}
                            onChange={(e) => setMarkupPct(Number(e.target.value))}
                          />
                        </Field>
                      </div>
                      {[
                        ["Measured cost roll-up (materials, plant, skips, labour)", money(retailTotal), false],
                        [`Markup @ ${markupPct}%`, money(markupValue), false],
                        ["Base retail customer quotation (ex VAT)", money(baseRetailQuote), true],
                      ].map(([k, v, hl]) => (
                        <div
                          key={k as string}
                          className="rounded-xl border p-3"
                          style={{ borderColor: hl ? `${ACCENT}66` : "rgba(255,255,255,0.10)" }}
                        >
                          <p className={labelClass}>{k as string}</p>
                          <p
                            className="font-heading text-base"
                            style={{ color: hl ? ACCENT : "#fff" }}
                          >
                            {v as string}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ---------- STAGE 3: customer quote & competitor checker ---------- */}
              {step === 3 && (
                <>
                  <div className={cardClass}>
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <SectionTitle>Stage 3 · Contract-ready customer quotation</SectionTitle>
                      <div className="flex gap-2 flex-wrap items-center">
                        {quoteLocked && (
                          <span
                            className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full"
                            style={{ backgroundColor: "rgba(56,189,248,0.15)", color: ACCENT }}
                          >
                            Quote locked &amp; exported
                          </span>
                        )}
                        <button
                          disabled={!masterBoq.length}
                          onClick={() => {
                            setQuoteLocked(true);
                            generateClientQuotePdf(masterBoq, quoteArbitrage, {
                              projectRef,
                              sheetName: extracted?.sheetName,
                              vatRate,
                              riskSummary,
                              exclusions: riskExclusions,
                            });
                          }}
                          className="font-mono text-[10px] uppercase tracking-wider rounded px-2.5 py-1 font-bold disabled:opacity-50"
                          style={{ backgroundColor: ACCENT, color: "#04233a" }}
                        >
                          🔒 Lock &amp; Export Client Quote (PDF)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {[
                        ["Base retail quotation (ex VAT)", money(baseRetailQuote), false],
                        ["Trade saving passed to customer", money(arbitrage.passedToCustomer), false],
                        ["Total payable inc VAT", money(finalCustomerIncVat), true],
                      ].map(([k, v, hl]) => (
                        <div
                          key={k as string}
                          className="rounded-xl border p-3"
                          style={{ borderColor: hl ? `${ACCENT}66` : "rgba(255,255,255,0.10)" }}
                        >
                          <p className={labelClass}>{k as string}</p>
                          <p
                            className="font-heading text-lg"
                            style={{ color: hl ? ACCENT : "#fff" }}
                          >
                            {v as string}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className={labelClass}>Schedule of works (as presented to the homeowner)</p>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-1.5 mb-4">
                      {[...new Map(masterBoq.map((l) => [l.category, 0])).keys()].map((cat) => {
                        const value = masterBoq
                          .filter((l) => l.category === cat)
                          .reduce((s, l) => s + l.total, 0);
                        const factor = retailTotal > 0 ? finalCustomerExVat / retailTotal : 1;
                        return (
                          <div key={cat} className="flex justify-between gap-3">
                            <span className="font-mono text-[11px] text-white/70">{cat}</span>
                            <span className="font-mono text-[11px] text-white/85 whitespace-nowrap">
                              {money(value * factor)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <p className={labelClass}>Ground-risk exclusions carried onto the quote</p>
                    <div className="rounded-xl border border-white/10 p-3 space-y-1.5">
                      {riskExclusions.map((e, i) => (
                        <p key={i} className="font-mono text-[11px] text-white/55 leading-relaxed">
                          • {e}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Competitor quote checker */}
                  <div className={cardClass}>
                    <SectionTitle>Quote Checker · cross-examine a competitor quote</SectionTitle>
                    <p className="font-mono text-[11px] text-white/45 mb-3">
                      Paste the cheap, vague quote the homeowner has been given. Every priced
                      package in your BoQ is checked against their wording.
                    </p>
                    <textarea
                      className={`${inputClass} min-h-[140px]`}
                      placeholder="Paste the competitor quotation text here — including their headline price…"
                      value={competitorText}
                      onChange={(e) => setCompetitorText(e.target.value)}
                    />

                    {competitorCheck.wordCount === 0 ? (
                      <p className="font-mono text-xs text-white/45 mt-3">
                        Nothing pasted yet — the comparison runs as soon as you paste their quote.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                          {[
                            [
                              "Their headline price",
                              competitorCheck.competitorTotal === null
                                ? "No £ figure found"
                                : money(competitorCheck.competitorTotal),
                              false,
                            ],
                            ["Your quotation", money(finalCustomerExVat), false],
                            [
                              "Value of work they never mention",
                              money(competitorCheck.unpricedValue),
                              true,
                            ],
                            [
                              "Their likely true cost",
                              competitorCheck.trueLikelyCost === null
                                ? "—"
                                : money(competitorCheck.trueLikelyCost),
                              true,
                            ],
                          ].map(([k, v, hl]) => (
                            <div
                              key={k as string}
                              className="rounded-xl border p-3"
                              style={{
                                borderColor: hl ? `${ACCENT}66` : "rgba(255,255,255,0.10)",
                              }}
                            >
                              <p className={labelClass}>{k as string}</p>
                              <p
                                className="font-heading text-base"
                                style={{ color: hl ? ACCENT : "#fff" }}
                              >
                                {v as string}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          <div>
                            <p className={labelClass}>
                              Missing from their quote ({competitorCheck.missing.length})
                            </p>
                            <div className="space-y-2">
                              {competitorCheck.missing.length === 0 && (
                                <p className="font-mono text-[11px] text-white/45">
                                  Nothing obviously missing — compare on specification and
                                  workmanship instead.
                                </p>
                              )}
                              {competitorCheck.missing.map((f) => (
                                <div
                                  key={f.category}
                                  className="rounded-xl border p-3"
                                  style={{ borderColor: "rgba(248,113,113,0.45)" }}
                                >
                                  <div className="flex justify-between gap-2">
                                    <p className="font-mono text-xs text-white/85">{f.category}</p>
                                    <p
                                      className="font-mono text-xs whitespace-nowrap"
                                      style={{ color: "#fca5a5" }}
                                    >
                                      {money(f.ourValue)}
                                    </p>
                                  </div>
                                  <p className="font-mono text-[11px] text-white/55 mt-1.5 leading-relaxed">
                                    {f.risk}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className={labelClass}>
                              Covered by both quotes ({competitorCheck.covered.length})
                            </p>
                            <div className="rounded-xl border border-white/10 p-3 space-y-1.5">
                              {competitorCheck.covered.map((f) => (
                                <div key={f.category} className="flex justify-between gap-3">
                                  <span className="font-mono text-[11px] text-white/70">
                                    {f.category}
                                  </span>
                                  <span className="font-mono text-[11px] text-white/50 whitespace-nowrap">
                                    {money(f.ourValue)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            navigator.clipboard?.writeText(
                              [
                                `ProGrafter Quote Comparison — ${projectRef}`,
                                `Our quotation (ex VAT): £${finalCustomerExVat.toFixed(2)}`,
                                competitorCheck.competitorTotal !== null
                                  ? `Competitor headline price: £${competitorCheck.competitorTotal.toFixed(2)}`
                                  : "Competitor headline price: not stated",
                                "",
                                "Not mentioned anywhere in the competitor quotation:",
                                ...competitorCheck.missing.map(
                                  (f) => `• ${f.category} — ${f.risk} (we price this at £${f.ourValue.toFixed(2)})`,
                                ),
                                "",
                                competitorCheck.trueLikelyCost !== null
                                  ? `Adding the unpriced work back, their likely true cost is £${competitorCheck.trueLikelyCost.toFixed(2)}.`
                                  : "",
                                "Sent via ProGrafter (prografter.co.uk) — verified trades, documented projects.",
                              ]
                                .filter(Boolean)
                                .join("\n"),
                            )
                          }
                          className="mt-4 rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider border border-white/20 text-white/80"
                        >
                          Copy comparison for the homeowner
                        </button>
                      </>
                    )}
                  </div>

                  {/* compliance + logistics */}
                  <div className={cardClass}>
                    <SectionTitle>Elizabeth &amp; Sharon · Compliance and logistics</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {logistics.map((l) => (
                          <div key={l.week} className="rounded-xl border border-white/10 p-3">
                            <p
                              className="font-mono text-[10px] uppercase tracking-wider"
                              style={{ color: ACCENT }}
                            >
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
                </>
              )}

              {/* ---------- STAGE 4: merchant procurement & the trade gap ---------- */}
              {step === 4 && (
                <>
                  {/* RFQ packs */}
                  <div className={cardClass}>
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <SectionTitle>Amy · Merchant RFQ tender pack generator</SectionTitle>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            downloadText(
                              `${projectRef}-rfq-packs.csv`,
                              allPacksToCsv(arbitrage.packs, projectRef),
                            )
                          }
                          className="rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider font-bold"
                          style={{ backgroundColor: ACCENT, color: "#04233a" }}
                        >
                          📥 Export 5 merchant RFQ tender packs (CSV)
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {arbitrage.packs.map((p) => (
                        <div
                          key={p.pack.id}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                        >
                          <div className="flex justify-between gap-2 flex-wrap items-start">
                            <div className="min-w-[200px]">
                              <p className="font-mono text-xs text-white/85">{p.pack.name}</p>
                              <p className="font-mono text-[10px] text-white/40 mt-1">
                                {p.pack.merchantHint} · {p.lines.length} line(s) · typical trade
                                discount {p.pack.typicalDiscountPct}%
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p
                                className="font-heading text-sm whitespace-nowrap"
                                style={{ color: ACCENT }}
                              >
                                {money(p.retailTotal)}
                              </p>
                              <button
                                onClick={() =>
                                  navigator.clipboard?.writeText(packToCsv(p, projectRef))
                                }
                                className="font-mono text-[10px] uppercase tracking-wider rounded px-2 py-1 border border-white/20 text-white/70"
                              >
                                Copy
                              </button>
                              <button
                                onClick={() =>
                                  downloadText(
                                    `${projectRef}-pack-${p.pack.id}.csv`,
                                    packToCsv(p, projectRef),
                                  )
                                }
                                className="font-mono text-[10px] uppercase tracking-wider rounded px-2 py-1 border border-white/20 text-white/70"
                              >
                                CSV
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={cardClass}>
                    <SectionTitle>
                      Stage 4 · Trade Gap calculator &amp; margin splitter
                    </SectionTitle>

                    <div className="flex items-end gap-3 flex-wrap mb-4">
                      <div className="w-[180px]">
                        <Field label="Blanket trade discount %">
                          <input
                            type="number"
                            className={inputClass}
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                          />
                        </Field>
                      </div>
                      <button
                        onClick={applyGlobalDiscount}
                        className="rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider border border-white/20 text-white/80 hover:border-[#38bdf8]"
                      >
                        Apply to all packs
                      </button>
                      <button
                        onClick={() => setNegotiated({} as Record<PackId, number | undefined>)}
                        className="rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider border border-white/20 text-white/60"
                      >
                        Reset to typical
                      </button>
                      <div className="w-[120px]">
                        <Field label="VAT %">
                          <input
                            type="number"
                            className={inputClass}
                            value={vatRate}
                            onChange={(e) => setVatRate(Number(e.target.value))}
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {arbitrage.packs.map((p) => (
                        <div
                          key={p.pack.id}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                        >
                          <div className="md:col-span-2">
                            <p className="font-mono text-xs text-white/85">{p.pack.name}</p>
                            <p className="font-mono text-[10px] text-white/40 mt-1">
                              Retail benchmark {money(p.retailTotal)}
                            </p>
                          </div>
                          <Field label="Returned merchant quote (£)">
                            <input
                              type="number"
                              step="0.01"
                              className={inputClass}
                              value={p.negotiatedTotal}
                              onChange={(e) =>
                                setNegotiated((prev) => ({
                                  ...prev,
                                  [p.pack.id]: Number(e.target.value),
                                }))
                              }
                            />
                          </Field>
                          <div>
                            <p className={labelClass}>Gap</p>
                            <p className="font-heading text-sm" style={{ color: ACCENT }}>
                              {money(p.gap)} <span className="text-xs">/ {p.gapPct}%</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <SectionTitle>The trade gap breakdown</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        ["Retail benchmark cost (customer quoting price)", money(retailTotal)],
                        ["Negotiated trade merchant cost", money(arbitrage.negotiatedTotal)],
                        [
                          "Gross material trade gap (potential profit)",
                          `${money(arbitrage.tradeGap)} (${arbitrage.tradeGapPct}%)`,
                        ],
                      ].map(([k, v], i) => (
                        <div
                          key={k}
                          className="rounded-xl border p-3"
                          style={{ borderColor: i === 2 ? `${ACCENT}66` : "rgba(255,255,255,0.10)" }}
                        >
                          <p className={labelClass}>{k}</p>
                          <p
                            className="font-heading text-lg"
                            style={{ color: i === 2 ? ACCENT : "#fff" }}
                          >
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-white/55 mb-2">
                        <span>Pass discount to customer</span>
                        <span>Retain as contractor net profit</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={retainPct}
                        onChange={(e) => setRetainPct(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: ACCENT }}
                        aria-label="Margin split — retain as contractor net profit"
                      />
                      <div className="flex justify-between font-mono text-xs text-white/70 mt-1">
                        <span>{100 - retainPct}% passed</span>
                        <span style={{ color: ACCENT }}>{retainPct}% retained</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                        {[
                          ["Retained net profit", money(arbitrage.retainedProfit), true],
                          ["Passed to customer", money(arbitrage.passedToCustomer), false],
                          ["Final customer quote (ex VAT)", money(arbitrage.customerQuoteTotal), false],
                          ["Customer total inc VAT", money(arbitrage.customerQuoteIncVat), false],
                        ].map(([k, v, hl]) => (
                          <div
                            key={k as string}
                            className="rounded-xl border p-3"
                            style={{
                              borderColor: hl ? `${ACCENT}66` : "rgba(255,255,255,0.10)",
                            }}
                          >
                            <p className={labelClass}>{k as string}</p>
                            <p
                              className="font-heading text-base"
                              style={{ color: hl ? ACCENT : "#fff" }}
                            >
                              {v as string}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="font-mono text-[11px] text-white/50 mt-3 leading-relaxed">
                        Passing {100 - retainPct}% of the gap drops the customer quote by{" "}
                        {money(arbitrage.passedToCustomer)} against the retail benchmark while still
                        leaving {money(arbitrage.retainedProfit)} of material margin in the job.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ---------- agent war room (always on) ---------- */}
              <div className={cardClass}>
                <SectionTitle>Agent war room</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AGENTS.map((agent) => {
                    const active = agentFilter === agent.id;
                    return (
                      <div
                        key={agent.id}
                        className="rounded-2xl border p-4 transition-all duration-300"
                        style={{
                          borderColor: active ? `${ACCENT}80` : "rgba(255,255,255,0.10)",
                          background: active ? "rgba(56,189,248,0.07)" : "rgba(255,255,255,0.03)",
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
                            <p
                              className="font-mono text-[10px] uppercase tracking-wider"
                              style={{ color: ACCENT }}
                            >
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
                              {agentStatus()}
                            </span>
                          </div>
                        </div>
                        <p className="font-mono text-[11px] text-white/45 mt-3">
                          {agent.speciality}
                        </p>
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                          <p className="font-mono text-[11px] text-white/80 leading-relaxed">
                            {dialogue(agent)}
                          </p>
                        </div>
                        {PHASE_BY_AGENT[agent.id] && (
                          <button
                            onClick={() => {
                              setAgentFilter(active ? null : agent.id);
                              setStep(3);
                            }}
                            className="mt-3 w-full rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                          >
                            {active ? "Filtering BoQ" : "Filter BoQ to this agent"}
                          </button>
                        )}
                      </div>
                    );
                  })}
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
