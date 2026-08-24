import { useState, useEffect, useCallback } from "react";
import SEO from "@/components/SEO";
import TradeSidebar from "@/components/trade/TradeSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Bell, Search, X, Radio, Building2, MapPin, Calendar, FileText, CheckCircle2, AlertTriangle, XCircle, Sparkles, TrendingUp, Target, RefreshCw, Loader2 } from "lucide-react";

import { usePlanningIntelligence } from "@/hooks/usePlanningIntelligence";
import OpportunityCommandCentre from "@/components/trade/planning/OpportunityCommandCentre";
import { scoreOpportunity, getBestAction, ACCESS_LABEL, PIPELINE_TABS, PipelineStatus } from "@/lib/planningIntelligence";

// ── Helpers ──────────────────────────────────────────────────────────────────
type ProjectKind = "DOMESTIC" | "CONVERSION" | "NEW BUILD";

const getProjectType = (app: { type: string; description: string }): ProjectKind => {
  const d = (app.description || "").toLowerCase();
  if (/erection of (a |new )?(dwelling|house)|\bnew dwelling\b|\bnew build\b/.test(d)) return "NEW BUILD";
  if (/\bclass q\b|barn conversion|change of use|commercial to residential|agricultural barn/.test(d)) return "CONVERSION";
  return "DOMESTIC";
};

const parseMaxValue = (v: string): number => {
  const nums = (v || "").replace(/[£,]/g, "").match(/\d+/g);
  if (!nums) return 0;
  return Math.max(...nums.map(Number));
};

const isLargeProject = (v: string) => parseMaxValue(v) >= 100000;

const PROJECT_TYPE_STYLES: Record<ProjectKind, string> = {
  "DOMESTIC": "bg-secondary/10 text-secondary border-secondary/30",
  "CONVERSION": "bg-purple-500/10 text-purple-700 border-purple-500/30",
  "NEW BUILD": "bg-blue-500/10 text-blue-700 border-blue-500/30",
};


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 899px)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

// ── Real planning applications ────────────────────────────────────────────────
// Rows come from `planning_alerts` (populated by the process-planning-alerts
// edge function from local-authority portals). No mock/demo records are used.
interface PlanningAlertRow {
  id: string;
  application_ref: string | null;
  address: string | null;
  postcode: string | null;
  application_type: string | null;
  description: string | null;
  approved_date: string | null;
  created_at: string;
  local_authority: string | null;
  planning_portal_url: string | null;
}

const mapAlertToApp = (row: PlanningAlertRow) => ({
  id: row.id,
  council: row.local_authority || "Unknown authority",
  address: row.address || "Address not stated",
  postcode: row.postcode || "",
  type: row.application_type || "Planning application",
  description: row.description || "",
  status: row.approved_date ? "approved" : "submitted",
  submitted_date: (row.approved_date || row.created_at || "").slice(0, 10),
  decision_date: row.approved_date,
  applicant_name: "Not published",
  agent: null,
  trades_needed: [] as string[],
  estimated_value: "Not stated",
  floorspace_m2: 0,
  documents_available: !!row.planning_portal_url,
  validated: true,
  source_url: row.planning_portal_url,
  reference: row.application_ref || "",
});


// ── Permitted development checker data ───────────────────────────────────────
const PD_PROJECTS = [
  { id:"rear_ext", name:"Rear extension" },
  { id:"loft", name:"Loft conversion" },
  { id:"garage_conv", name:"Garage conversion" },
  { id:"outbuilding", name:"Garden room / outbuilding" },
  { id:"side_ext", name:"Side extension" },
  { id:"porch", name:"Front porch" },
  { id:"solar", name:"Solar panels" },
  { id:"heat_pump", name:"Heat pump" },
  { id:"fence_wall", name:"Fence or wall" },
  { id:"rewire", name:"Full rewire / electrical" },
  { id:"boiler", name:"Boiler replacement" },
  { id:"new_build", name:"New dwelling" },
];

const PD_RULES: Record<string, Record<string, { pd: boolean | "maybe"; notes: string }>> = {
  rear_ext: {
    detached: { pd: true, notes: "Up to 4m depth (8m if prior approval obtained). Must not exceed original height. Materials to match." },
    semi: { pd: true, notes: "Up to 3m depth (6m with prior approval). Single storey only for PD." },
    terraced: { pd: true, notes: "Up to 3m depth (6m with prior approval)." },
    flat: { pd: false, notes: "Flats have no PD rights for extensions. Full planning required." },
    listed: { pd: false, notes: "Listed buildings require Listed Building Consent regardless of works." },
  },
  loft: {
    detached: { pd: true, notes: "Up to 50m³ additional volume. No side-facing windows above ground floor. Hip-to-gable allowed." },
    semi: { pd: true, notes: "Up to 40m³. No side-facing windows above ground floor level." },
    terraced: { pd: true, notes: "Up to 40m³. No side-facing windows. Must not extend beyond original roof slope at front." },
    flat: { pd: false, notes: "Flats have no PD rights. Full planning required." },
    listed: { pd: false, notes: "Listed Building Consent required." },
  },
  garage_conv: {
    detached: { pd: true, notes: "Generally permitted development — no increase in footprint. Building regs required." },
    semi: { pd: true, notes: "Generally permitted — building regs required. Check if integral or detached." },
    terraced: { pd: true, notes: "Generally permitted — building regs required." },
    flat: { pd: false, notes: "Not applicable to flats." },
    listed: { pd: "maybe", notes: "Likely requires Listed Building Consent. Take professional advice." },
  },
  outbuilding: {
    detached: { pd: true, notes: "Up to 15m² without regs. Must be single storey, max 2.5m eaves height. Not forward of principal elevation." },
    semi: { pd: true, notes: "Same rules as detached — max 15m² without regs, single storey." },
    terraced: { pd: true, notes: "Same rules — max 15m²." },
    flat: { pd: false, notes: "No PD rights for flats." },
    listed: { pd: false, notes: "Listed Building Consent required." },
  },
  side_ext: {
    detached: { pd: true, notes: "Must not exceed half the width of the original house. Single storey only for PD. Materials to match." },
    semi: { pd: true, notes: "Single storey only. Must not exceed half original house width. Two-storey needs full planning." },
    terraced: { pd: "maybe", notes: "Side extensions on terraced houses are often restricted — check with your LPA." },
    flat: { pd: false, notes: "No PD rights." },
    listed: { pd: false, notes: "Listed Building Consent required." },
  },
  porch: {
    detached: { pd: true, notes: "Under 3m² floor area. Max 3m height. Must be more than 2m from road." },
    semi: { pd: true, notes: "Same rules — under 3m², max 3m high." },
    terraced: { pd: true, notes: "Same rules." },
    flat: { pd: false, notes: "No PD rights." },
    listed: { pd: false, notes: "Consent required." },
  },
  solar: {
    detached: { pd: true, notes: "Generally PD on most properties. Must not protrude more than 200mm from roof slope." },
    semi: { pd: true, notes: "Generally PD. Same rules." },
    terraced: { pd: true, notes: "Generally PD — check if in conservation area." },
    flat: { pd: true, notes: "Flat roof installation generally PD but check building lease." },
    listed: { pd: false, notes: "Listed Building Consent required." },
  },
  heat_pump: {
    detached: { pd: true, notes: "Air source heat pumps are PD under MCS guidelines. One per property. Must be 1m from boundary." },
    semi: { pd: true, notes: "PD — same rules. Must be sited to rear or side, not visible from road." },
    terraced: { pd: true, notes: "PD — sited to rear only, not visible from a highway." },
    flat: { pd: "maybe", notes: "Check permitted development rights in your lease and with building management." },
    listed: { pd: false, notes: "Listed Building Consent likely required." },
  },
  fence_wall: {
    detached: { pd: true, notes: "Up to 2m high (1m if adjacent to highway). Planning required above these heights." },
    semi: { pd: true, notes: "Same rules." },
    terraced: { pd: true, notes: "Same rules." },
    flat: { pd: "maybe", notes: "Check with freeholder and building management." },
    listed: { pd: false, notes: "Consent required — even boundary works." },
  },
  rewire: {
    detached: { pd: true, notes: "Electrical work does not require planning permission but does require Building Regs (Part P). Use a registered electrician (NICEIC/NAPIT)." },
    semi: { pd: true, notes: "Same — Building Regs required, not planning." },
    terraced: { pd: true, notes: "Same." },
    flat: { pd: true, notes: "Building Regs required. Check lease for access rights." },
    listed: { pd: true, notes: "No planning for electrical, but discuss any structural implications of cable routing with your Conservation Officer." },
  },
  boiler: {
    detached: { pd: true, notes: "Boiler replacement does not require planning. Building Regs apply — must be installed by Gas Safe registered engineer." },
    semi: { pd: true, notes: "Same — Gas Safe required, Building Regs notification." },
    terraced: { pd: true, notes: "Same." },
    flat: { pd: true, notes: "Same — check lease for flue positioning." },
    listed: { pd: true, notes: "Generally no planning — but discuss flue positioning if it affects the listed exterior." },
  },
  new_build: {
    detached: { pd: false, notes: "New dwellings always require full planning permission." },
    semi: { pd: false, notes: "Full planning required." },
    terraced: { pd: false, notes: "Full planning required." },
    flat: { pd: false, notes: "Full planning required." },
    listed: { pd: false, notes: "Full planning + Listed Building Consent." },
  },
};

// ── Status config (uses semantic tokens via Tailwind classes) ────────────────
const STATUS_CFG: Record<string, { label: string; chip: string; dot: string; priority: string; accent: string }> = {
  submitted:        { label:"Submitted",        chip:"bg-secondary/10 text-secondary border-secondary/30",        dot:"bg-secondary",        priority:"Act now",       accent:"text-secondary" },
  pending_decision: { label:"Pending decision", chip:"bg-amber-500/10 text-amber-700 border-amber-500/30",        dot:"bg-amber-500",        priority:"Still time",    accent:"text-amber-700" },
  approved:         { label:"Approved",         chip:"bg-emerald-500/10 text-emerald-700 border-emerald-500/30",  dot:"bg-emerald-500",      priority:"Ready",         accent:"text-emerald-700" },
  refused:          { label:"Refused",          chip:"bg-destructive/10 text-destructive border-destructive/30",  dot:"bg-destructive",      priority:"No further action", accent:"text-destructive" },
};

const PROP_TYPES = [
  { id:"detached",  name:"Detached house" },
  { id:"semi",      name:"Semi-detached" },
  { id:"terraced",  name:"Terraced house" },
  { id:"flat",      name:"Flat / apartment" },
  { id:"listed",    name:"Listed building" },
];

// ── Reusable atoms ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_CFG[status] || STATUS_CFG.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const TradePill = ({ trade }: { trade: string }) => (
  <span className="inline-block bg-secondary/10 text-secondary font-mono text-[10px] px-2 py-0.5 rounded-full border border-secondary/20 uppercase tracking-wider">
    {trade}
  </span>
);

// ── Application card ──────────────────────────────────────────────────────────

interface PlanningApp {
  id: string; council: string; address: string; postcode: string; type: string;
  description: string; status: string; submitted_date: string; decision_date: string | null;
  applicant_name: string; agent: string | null; trades_needed: string[];
  estimated_value: string; floorspace_m2: number; documents_available: boolean; validated: boolean;
}

const AppCard = ({ app, onSelect, selected, tradeTypes, pipelineStatus, showScore }: { app: PlanningApp; onSelect: (app: PlanningApp) => void; selected: boolean; tradeTypes: string[]; pipelineStatus?: PipelineStatus; showScore: boolean }) => {
  const s = STATUS_CFG[app.status];
  const [tradesExpanded, setTradesExpanded] = useState(false);
  const projectKind = getProjectType(app);
  const large = isLargeProject(app.estimated_value);
  const visibleTrades = tradesExpanded ? app.trades_needed : app.trades_needed.slice(0, 3);
  const overflow = app.trades_needed.length - 3;
  const score = scoreOpportunity(app, tradeTypes);
  const action = getBestAction(app);
  const pipelineLabel = pipelineStatus && pipelineStatus !== "new"
    ? PIPELINE_TABS.find((t) => t.id === pipelineStatus)?.label
    : null;

  return (
    <div
      onClick={() => onSelect(app)}
      className={`bg-card rounded-2xl p-5 border cursor-pointer transition-all shadow-sm hover:shadow-md ${
        selected ? "border-secondary ring-2 ring-secondary/20" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Building2 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
            <span className="font-mono text-xs text-secondary font-semibold">{app.id}</span>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${PROJECT_TYPE_STYLES[projectKind]}`}>
              {projectKind}
            </span>
            {large && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-700 border-amber-500/30 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> Large project
              </span>
            )}
          </div>
          <h4 className="font-heading text-primary text-sm leading-snug">{app.address}</h4>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{app.council} · {app.postcode}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <StatusBadge status={app.status} />
          {s && <span className={`font-mono text-[10px] uppercase tracking-wider ${s.accent}`}>{s.priority}</span>}
          {pipelineLabel && (
            <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {pipelineLabel}
            </span>
          )}
        </div>
      </div>

      {showScore && (
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span
            className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: `${score.bandColor}22`, color: score.bandColor }}
          >
            <TrendingUp className="w-2.5 h-2.5" /> {score.score}/100 · {score.band}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20">
            <Target className="w-2.5 h-2.5" /> {action.label}
          </span>
        </div>
      )}

      <p className="font-sans text-xs text-foreground leading-relaxed mb-2 line-clamp-2">
        {app.description}
      </p>
      {app.status === "approved" && (
        <p className="font-mono text-[11px] text-emerald-700 mb-3 leading-relaxed">
          Planning approved — homeowner can proceed with work.
        </p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {visibleTrades.map(t => <TradePill key={t} trade={t} />)}
          {overflow > 0 && !tradesExpanded && (
            <button
              onClick={(e) => { e.stopPropagation(); setTradesExpanded(true); }}
              className="font-mono text-[10px] text-secondary self-center uppercase tracking-wider hover:underline cursor-pointer"
              aria-label={`Show ${overflow} more trade${overflow === 1 ? "" : "s"}`}
            >
              +{overflow} more
            </button>
          )}
          {tradesExpanded && overflow > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setTradesExpanded(false); }}
              className="font-mono text-[10px] text-muted-foreground self-center uppercase tracking-wider hover:underline cursor-pointer"
            >
              Show less
            </button>
          )}
        </div>
        <div className="text-right">
          <p className="font-mono text-xs font-semibold text-primary">{app.estimated_value}</p>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {new Date(app.submitted_date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── PD Checker ───────────────────────────────────────────────────────────────

const PDChecker = () => {
  const [project, setProject] = useState("");
  const [propType, setPropType] = useState("");
  const [conservation, setConservation] = useState(false);
  const [result, setResult] = useState<{ pd: boolean | "maybe"; notes: string } | null>(null);

  const check = () => {
    if (!project || !propType) return;
    const rules = PD_RULES[project];
    if (!rules) return;
    let r = rules[propType] || rules.detached;
    if (conservation && r.pd === true) {
      r = { ...r, pd:"maybe" as const,
        notes: r.notes + " ⚠️ Conservation Area: additional restrictions apply — check with your Local Planning Authority before proceeding." };
    }
    setResult(r);
  };

  const verdict = !result ? null : result.pd === true
    ? { wrap:"bg-emerald-500/10 border-emerald-500/40", text:"text-emerald-700", icon:<CheckCircle2 className="w-6 h-6" />, label:"Likely permitted development" }
    : result.pd === false
    ? { wrap:"bg-destructive/10 border-destructive/40", text:"text-destructive", icon:<XCircle className="w-6 h-6" />, label:"Planning permission required" }
    : { wrap:"bg-amber-500/10 border-amber-500/40", text:"text-amber-700", icon:<AlertTriangle className="w-6 h-6" />, label:"Seek professional advice" };

  return (
    <div>
      <div className="text-center mb-7">
        <h2 className="font-heading text-primary text-xl mb-2">Do I need planning permission?</h2>
        <p className="font-sans text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Check whether your project falls under permitted development or requires a full planning
          application — before you spend a penny.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5 mb-5">
        {PD_PROJECTS.map(p => (
          <button
            key={p.id}
            onClick={() => { setProject(p.id); setResult(null); }}
            className={`rounded-xl px-3 py-3 border-2 transition-all text-center ${
              project === p.id
                ? "bg-secondary/10 border-secondary"
                : "bg-card border-border hover:border-secondary/40"
            }`}
          >
            <p className={`font-mono text-[11px] font-semibold leading-tight uppercase tracking-wider ${
              project === p.id ? "text-secondary" : "text-primary"
            }`}>
              {p.name}
            </p>
          </button>
        ))}
      </div>

      {project && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="block font-mono text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5">
                Property type <span className="text-secondary">*</span>
              </label>
              <select
                value={propType}
                onChange={e => { setPropType(e.target.value); setResult(null); }}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background font-mono text-xs text-foreground outline-none focus:border-secondary"
              >
                <option value="">Select...</option>
                {PROP_TYPES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className={`flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl border-2 ${
                conservation ? "border-amber-500 bg-amber-500/10" : "border-border bg-muted/30"
              }`}>
                <input
                  type="checkbox"
                  checked={conservation}
                  onChange={e => { setConservation(e.target.checked); setResult(null); }}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <span className="font-mono text-xs text-foreground">In a Conservation Area?</span>
              </label>
            </div>
          </div>
          <button
            onClick={check}
            disabled={!propType}
            className="w-full bg-primary text-primary-foreground font-mono text-xs px-4 py-3 rounded-xl uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Check planning requirements →
          </button>
        </div>
      )}

      {result && verdict && (
        <div className={`border-2 rounded-2xl overflow-hidden mb-5 ${verdict.wrap}`}>
          <div className="px-5 py-4 border-b border-current/20 flex items-center gap-3">
            <span className={verdict.text}>{verdict.icon}</span>
            <div>
              <p className={`font-heading text-base ${verdict.text}`}>{verdict.label}</p>
              <p className={`font-mono text-[10px] uppercase tracking-wider mt-1 opacity-80 ${verdict.text}`}>
                {PD_PROJECTS.find(p=>p.id===project)?.name} · {PROP_TYPES.find(p=>p.id===propType)?.name}
                {conservation ? " · Conservation Area" : ""}
              </p>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="font-sans text-sm text-foreground leading-relaxed mb-3">{result.notes}</p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 font-mono text-[11px] text-amber-700 leading-relaxed">
              <strong className="uppercase tracking-wider">Important:</strong> This is a general guide only. Always confirm with your Local
              Planning Authority before starting work. Rules vary in Article 4 Direction areas,
              National Parks, and AONBs.
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="font-heading text-primary text-sm mb-2">Ready to find a vetted trader for this project?</p>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-3">
            Every trader on ProGrafter is personally vetted, insured, and referenced.
            Post your job brief and we'll match you with up to three vetted, local, available trades — not thirty.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button className="flex-1 bg-secondary text-primary-foreground font-mono text-xs px-4 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors uppercase tracking-wider">
              Post a job brief →
            </button>
            <button className="flex-1 bg-transparent border-2 border-primary text-primary font-mono text-xs px-4 py-2.5 rounded-xl hover:bg-primary/5 transition-colors uppercase tracking-wider">
              Check a quote first
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export default function PlanningAlerts() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarNav, setSidebarNav] = useState("alerts");
  const [activeTab, setActiveTab] = useState("pipeline");
  const [selectedApp, setSelectedApp] = useState<PlanningApp | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTrade, setFilterTrade] = useState("all");
  const [filterCouncil, setFilterCouncil] = useState("all");
  const [filterDate, setFilterDate] = useState<"all" | "7" | "30" | "90">("90");
  const [filterProjectType, setFilterProjectType] = useState<"all" | ProjectKind>("all");
  const [showRefused, setShowRefused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelineTab, setPipelineTab] = useState<PipelineStatus | "all">("all");
  const [mineOnly, setMineOnly] = useState(false);

  const pi = usePlanningIntelligence();
  const tradeTypes = pi.trade?.trade_type ? [pi.trade.trade_type.toLowerCase()] : [];

  const [apps, setApps] = useState<PlanningApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tradeId = pi.trade?.id ?? null;

  const loadApps = useCallback(async () => {
    if (!tradeId) {
      setApps([]);
      setLoadingApps(false);
      return;
    }
    setLoadingApps(true);
    const { data } = await supabase
      .from("planning_alerts")
      .select("id, application_ref, address, postcode, application_type, description, approved_date, created_at, local_authority, planning_portal_url")
      .eq("trade_id", tradeId)
      .order("created_at", { ascending: false })
      .limit(200);
    setApps(((data ?? []) as PlanningAlertRow[]).map(mapAlertToApp));
    setLoadingApps(false);
  }, [tradeId]);

  useEffect(() => {
    if (!pi.ready) return;
    void loadApps();
  }, [pi.ready, loadApps]);

  // Same proven refresh path used by the trade dashboard planning feed.
  const handleRefresh = async (days: number = 90) => {
    if (!tradeId) return;
    setRefreshing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Please sign in again to refresh your planning feed.");
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/process-planning-alerts?trade_id=${tradeId}&days=${days}`,
        { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, apikey: anon } },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Refresh failed");
      toast({
        title: "Planning feed refreshed",
        description: `${json.inserted ?? 0} new application(s) found in your area (last 3 months).`,
      });
      await loadApps();
    } catch (e: any) {
      toast({ title: "Refresh failed", description: e?.message ?? "Please try again shortly.", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const allTrades = [...new Set(apps.flatMap(a => a.trades_needed))].sort();
  const allCouncils = [...new Set(apps.map(a => a.council))].sort();

  const filtered = apps.filter(app => {
    // Hide refused by default unless user explicitly toggles or status filter is "refused"
    if (!showRefused && app.status === "refused" && filterStatus !== "refused") return false;
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    if (filterTrade !== "all" && !app.trades_needed.includes(filterTrade)) return false;
    if (filterCouncil !== "all" && app.council !== filterCouncil) return false;
    if (filterProjectType !== "all" && getProjectType(app) !== filterProjectType) return false;
    if (filterDate !== "all") {
      const cutoff = Date.now() - Number(filterDate) * 86400000;
      if (new Date(app.submitted_date).getTime() < cutoff) return false;
    }
    if (searchQuery && !app.description.toLowerCase().includes(searchQuery.toLowerCase())
      && !app.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (mineOnly && tradeTypes.length) {
      const needed = app.trades_needed.map((t) => t.toLowerCase());
      if (!tradeTypes.some((t) => needed.some((n) => n.includes(t) || t.includes(n)))) return false;
    }
    if (pipelineTab !== "all") {
      const st = pi.interactions[app.id]?.status ?? "new";
      if (st !== pipelineTab) return false;
    }
    return true;
  });

  const sortOrder: Record<string, number> = { submitted:0, pending_decision:1, approved:2, refused:3 };
  const sorted = [...filtered].sort((a,b) => sortOrder[a.status] - sortOrder[b.status]);

  const counts = {
    submitted: apps.filter(a=>a.status==="submitted").length,
    pending_decision: apps.filter(a=>a.status==="pending_decision").length,
    approved: apps.filter(a=>a.status==="approved").length,
    refused: apps.filter(a=>a.status==="refused").length,
  };


  const tabClass = (active: boolean) =>
    `px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${
      active ? "bg-secondary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-primary"
    }`;

  return (
    <>
      <SEO
        title="Planning Intelligence — Live Pipeline & PD Checker | ProGrafter"
        description="Browse live planning applications from East Midlands councils. Check permitted development rules before you apply."
        path="/planning-alerts"
      />
      <div className="min-h-screen dashboard-dark flex">
        <TradeSidebar
          activeNav={sidebarNav}
          setActiveNav={setSidebarNav}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 overflow-auto pt-10 md:pt-0">
        <div className="min-h-[calc(100vh-64px)] bg-background">
          {/* Sub-header */}
          <div className="bg-primary px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-secondary" />
              <h1 className="font-heading text-primary-foreground text-lg">Planning Intelligence</h1>
            </div>
            <span className="font-mono text-[10px] text-secondary bg-secondary/15 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
              Live Feed
            </span>
          </div>

          <div className="mx-auto px-4 py-6 max-w-[1100px]">
            {activeTab === "pipeline" && (
              <>
                {/* Founding access banner */}
                {pi.trade && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3">
                    <Sparkles className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                    <p className="font-sans text-xs text-primary leading-relaxed">
                      <span className="font-semibold">{ACCESS_LABEL[pi.accessLevel] ?? ACCESS_LABEL.founding}</span>
                    </p>
                  </div>
                )}

                {/* Pipeline tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {PIPELINE_TABS.map((t) => {
                    const active = pipelineTab === t.id;
                    const count = t.id === "all"
                      ? undefined
                      : apps.filter((a) => (pi.interactions[a.id]?.status ?? "new") === t.id).length;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setPipelineTab(t.id as PipelineStatus | "all")}
                        className={`px-3 py-1.5 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-colors ${
                          active ? "bg-secondary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {t.label}{count !== undefined ? ` (${count})` : ""}
                      </button>
                    );
                  })}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
                  {[
                    { status:"submitted",        label:"Submitted",        count:counts.submitted },
                    { status:"pending_decision", label:"Pending decision", count:counts.pending_decision },
                    { status:"approved",         label:"Approved",         count:counts.approved },
                    { status:"refused",          label:"Refused",          count:counts.refused },
                  ].map(s => {
                    const sc = STATUS_CFG[s.status];
                    const active = filterStatus===s.status;
                    return (
                      <button
                        key={s.status}
                        onClick={()=>setFilterStatus(f=>f===s.status?"all":s.status)}
                        className={`rounded-2xl px-4 py-3 border-2 cursor-pointer transition-all text-left flex flex-col ${
                          active ? `${sc.chip.replace("text-","border-").split(" ").find(c=>c.startsWith("border-")) ?? "border-secondary"} bg-card`
                                 : "bg-card border-border hover:border-secondary/40"
                        }`}
                      >
                        <span className={`font-mono text-2xl font-bold leading-none ${active ? sc.accent : "text-primary"}`}>
                          {s.count}
                        </span>
                        <p className={`font-mono text-[10px] mt-2 uppercase tracking-wider font-semibold ${active ? sc.accent : "text-muted-foreground"}`}>
                          {s.label}
                        </p>
                        <p className={`font-mono text-[10px] mt-0.5 uppercase tracking-wider opacity-80 ${sc.accent}`}>
                          {sc.priority}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2.5 mb-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      value={searchQuery}
                      onChange={e=>setSearchQuery(e.target.value)}
                      placeholder="Search address or description…"
                      aria-label="Search address or description"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-card font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-secondary"
                    />
                  </div>
                  <select
                    value={filterTrade}
                    onChange={e=>setFilterTrade(e.target.value)}
                    aria-label="Filter by trade"
                    className="px-3 py-2.5 rounded-xl border border-border bg-card font-mono text-xs text-foreground outline-none focus:border-secondary"
                  >
                    <option value="all">All trades</option>
                    {allTrades.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    value={filterCouncil}
                    onChange={e=>setFilterCouncil(e.target.value)}
                    aria-label="Filter by council"
                    className="px-3 py-2.5 rounded-xl border border-border bg-card font-mono text-xs text-foreground outline-none focus:border-secondary"
                  >
                    <option value="all">All councils</option>
                    {allCouncils.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={filterProjectType}
                    onChange={e=>setFilterProjectType(e.target.value as "all" | ProjectKind)}
                    aria-label="Filter by project type"
                    className="px-3 py-2.5 rounded-xl border border-border bg-card font-mono text-xs text-foreground outline-none focus:border-secondary"
                  >
                    <option value="all">All project types</option>
                    <option value="DOMESTIC">Domestic</option>
                    <option value="CONVERSION">Conversion</option>
                    <option value="NEW BUILD">New build</option>
                  </select>
                  <select
                    value={filterDate}
                    onChange={e=>setFilterDate(e.target.value as "all" | "7" | "30" | "90")}
                    aria-label="Filter by recency"
                    className="px-3 py-2.5 rounded-xl border border-border bg-card font-mono text-xs text-foreground outline-none focus:border-secondary"
                  >
                    <option value="all">All dates</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                  <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card font-mono text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRefused}
                      onChange={e=>setShowRefused(e.target.checked)}
                      className="w-3.5 h-3.5 accent-secondary cursor-pointer"
                    />
                    Show refused applications
                  </label>
                  <button
                    onClick={()=>{setFilterStatus("all");setFilterTrade("all");setFilterCouncil("all");setFilterProjectType("all");setFilterDate("90");setShowRefused(false);setSearchQuery("");}}
                    className="px-4 py-2.5 bg-card border border-border rounded-xl font-mono text-xs text-primary uppercase tracking-wider hover:bg-muted transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                </div>

                <p className="font-mono text-[11px] text-muted-foreground mb-5 leading-relaxed">
                  Budget estimates are indicative only, based on typical UK build costs. Actual project costs will vary.
                </p>

                <div className={`grid gap-4 items-start ${selectedApp && !isMobile ? "grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
                  {/* Application list */}
                  <div className="flex flex-col gap-3">
                    {sorted.length === 0 && (
                      <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <p className="font-sans text-sm text-muted-foreground">No applications match your filters</p>
                      </div>
                    )}
                    {sorted.map(app => (
                      <AppCard
                        key={app.id}
                        app={app}
                        selected={selectedApp?.id === app.id}
                        onSelect={a => setSelectedApp(prev=>prev?.id===a.id?null:a)}
                        tradeTypes={tradeTypes}
                        pipelineStatus={pi.interactions[app.id]?.status ?? "new"}
                        showScore={pi.features.can_use_opportunity_scores}
                      />
                    ))}

                    {/* Data source notice */}
                    <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-start gap-3">
                      <span className="relative flex w-2.5 h-2.5 mt-1.5 flex-shrink-0" aria-hidden>
                        <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                        <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </span>
                      <div>
                        <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-primary">Live planning data</span> — updated nightly from local authority planning portals covering South Derbyshire, Nottingham City, Broxtowe, Rushcliffe, Amber Valley, Erewash and North West Leicestershire. New applications appear within 24 hours of council validation.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detail panel — Opportunity Command Centre */}
                  {selectedApp && (
                    <OpportunityCommandCentre
                      app={selectedApp}
                      onClose={() => setSelectedApp(null)}
                      isMobile={isMobile}
                      interaction={pi.interactions[selectedApp.id]}
                      trade={pi.trade}
                      features={pi.features}
                      onStatus={(status) => pi.upsertInteraction(selectedApp.id, { status })}
                      onNotes={(notes) => pi.upsertInteraction(selectedApp.id, { notes })}
                      onFollowUp={(date) => pi.upsertInteraction(selectedApp.id, { status: date ? "follow_up" : (pi.interactions[selectedApp.id]?.status ?? "saved"), follow_up_date: date })}
                      onCreateInvite={() => pi.createInviteLink(selectedApp.id, getProjectType(selectedApp))}
                      onLetterGenerated={() => pi.upsertInteraction(selectedApp.id, { intro_letter_generated: true })}
                    />
                  )}
                </div>
              </>
            )}
          </div>

        </div>
        </main>
      </div>
    </>
  );
}
