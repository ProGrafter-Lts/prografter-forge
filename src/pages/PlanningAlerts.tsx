import { useState, useEffect } from "react";

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
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";

// ── ProGrafter Brand Palette ──────────────────────────────────────────────────

const C = {
  cream:      "#F5F0E8",
  deep:       "#0F2238",
  navy:       "#1B3A5C",
  teal:       "#0D9488",
  tealHover:  "#14B8A6",
  tealLight:  "#CCFBF1",
  tealDim:    "rgba(13,148,136,0.12)",
  body:       "#1F2937",
  secondary:  "#4B5563",
  border:     "#D1CBB8",
  white:      "#FFFFFF",
  error:      "#DC2626",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberBorder:"#FDE68A",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  greenBorder:"#BBF7D0",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redBorder:  "#FECACA",
  purple:     "#7C3AED",
  purpleBg:   "#F5F3FF",
  purpleBorder:"#DDD6FE",
};

// ── Mock planning applications (mirrors real Idox/Planning Portal API structure)
// In production: replace with fetch() to your Supabase edge function which
// scrapes/proxies South Derbyshire (idox), Nottingham City, Broxtowe, Rushcliffe etc.
// Planning Alerts API: https://www.planningalerts.org.uk/api/v2/
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_APPLICATIONS = [
  {
    id: "SDDC/2026/0412",
    council: "South Derbyshire",
    address: "14 Orchard Lane, Swadlincote",
    postcode: "DE11 8PQ",
    type: "Householder",
    description: "Proposed two-storey rear extension and single-storey side extension to provide additional living accommodation and enlarged kitchen/diner.",
    status: "submitted",
    submitted_date: "2026-05-03",
    decision_date: null,
    applicant_name: "Mr & Mrs Holloway",
    agent: null,
    trades_needed: ["General Builder","Plasterer","Electrician","Plumber"],
    estimated_value: "£35,000–£55,000",
    floorspace_m2: 38,
    documents_available: true,
    validated: true,
  },
  {
    id: "SDDC/2026/0388",
    council: "South Derbyshire",
    address: "7 Bramble Close, Repton",
    postcode: "DE65 6GH",
    type: "Householder",
    description: "Loft conversion to habitable room with rear dormer window, Juliet balcony and two front roof lights.",
    status: "pending_decision",
    submitted_date: "2026-04-18",
    decision_date: null,
    applicant_name: "Ms Sarah Bates",
    agent: "Trent Architecture Ltd",
    trades_needed: ["Carpenter / Joiner","Plasterer","Electrician","Decorator / Painter"],
    estimated_value: "£28,000–£42,000",
    floorspace_m2: 24,
    documents_available: true,
    validated: true,
  },
  {
    id: "NCC/2026/1104",
    council: "Nottingham City",
    address: "23 Sherwood Vale, Mapperley",
    postcode: "NG3 5AA",
    type: "Householder",
    description: "Single-storey rear extension (4.5m x 6m) with bi-fold doors, flat roof with roof lantern, knock-through to existing dining room.",
    status: "submitted",
    submitted_date: "2026-05-07",
    decision_date: null,
    applicant_name: "Mr D Patel",
    agent: null,
    trades_needed: ["General Builder","Plasterer","Glazier","Electrician","Decorator / Painter"],
    estimated_value: "£22,000–£35,000",
    floorspace_m2: 27,
    documents_available: false,
    validated: false,
  },
  {
    id: "SDDC/2026/0341",
    council: "South Derbyshire",
    address: "Ashwood Farm, Ticknall Road, Hartshorne",
    postcode: "DE11 7AS",
    type: "Full",
    description: "Change of use of agricultural barn to residential dwelling (Class Q permitted development), with associated structural works and new services installation.",
    status: "pending_decision",
    submitted_date: "2026-04-02",
    decision_date: null,
    applicant_name: "Holloway Agricultural Ltd",
    agent: "PJD Planning Consultants",
    trades_needed: ["General Builder","Electrician","Plumber","Plasterer","Roofer","Carpenter / Joiner"],
    estimated_value: "£180,000–£280,000",
    floorspace_m2: 210,
    documents_available: true,
    validated: true,
  },
  {
    id: "BKTV/2026/0892",
    council: "Broxtowe",
    address: "4 Elm Park Drive, Beeston",
    postcode: "NG9 2QT",
    type: "Householder",
    description: "Garage conversion to habitable room, new front bay window, reclad existing render with brick slips.",
    status: "approved",
    submitted_date: "2026-03-14",
    decision_date: "2026-05-01",
    applicant_name: "Mr R Kaur",
    agent: null,
    trades_needed: ["General Builder","Plasterer","Electrician","Decorator / Painter"],
    estimated_value: "£12,000–£18,000",
    floorspace_m2: 18,
    documents_available: true,
    validated: true,
  },
  {
    id: "NCC/2026/0987",
    council: "Nottingham City",
    address: "118 Radcliffe Road, West Bridgford",
    postcode: "NG2 5HH",
    type: "Full",
    description: "Demolition of existing detached garage and erection of two-storey side extension with integrated garage at ground floor, bedroom and bathroom above.",
    status: "approved",
    submitted_date: "2026-02-28",
    decision_date: "2026-04-22",
    applicant_name: "Mrs J Thornton",
    agent: "Studio 44 Architects",
    trades_needed: ["General Builder","Roofer","Plasterer","Electrician","Plumber"],
    estimated_value: "£55,000–£80,000",
    floorspace_m2: 45,
    documents_available: true,
    validated: true,
  },
  {
    id: "SDDC/2026/0298",
    council: "South Derbyshire",
    address: "2 Canal Street, Melbourne",
    postcode: "DE73 8AN",
    type: "Householder",
    description: "Erection of detached garden room / home office (under 15m²) and associated hard landscaping.",
    status: "refused",
    submitted_date: "2026-03-05",
    decision_date: "2026-04-30",
    applicant_name: "Mr P Walsh",
    agent: null,
    trades_needed: ["General Builder","Landscaper","Electrician"],
    estimated_value: "£8,000–£15,000",
    floorspace_m2: 14,
    documents_available: true,
    validated: true,
  },
  {
    id: "RSHL/2026/0633",
    council: "Rushcliffe",
    address: "39 Melton Road, East Leake",
    postcode: "LE12 6PG",
    type: "Householder",
    description: "First floor extension over existing ground floor side extension to provide master bedroom with en-suite. New roofline to match existing.",
    status: "submitted",
    submitted_date: "2026-05-09",
    decision_date: null,
    applicant_name: "Dr & Mrs Okonkwo",
    agent: null,
    trades_needed: ["General Builder","Plasterer","Plumber","Electrician","Roofer"],
    estimated_value: "£30,000–£48,000",
    floorspace_m2: 22,
    documents_available: false,
    validated: false,
  },
];

// ── Permitted development checker data ───────────────────────────────────────

const PD_PROJECTS = [
  { id:"rear_ext",      name:"Rear extension",               icon:"🏠" },
  { id:"loft",          name:"Loft conversion",              icon:"🔺" },
  { id:"garage_conv",   name:"Garage conversion",            icon:"🚗" },
  { id:"outbuilding",   name:"Garden room / outbuilding",    icon:"🌿" },
  { id:"side_ext",      name:"Side extension",               icon:"↔️" },
  { id:"porch",         name:"Front porch",                  icon:"🚪" },
  { id:"solar",         name:"Solar panels",                 icon:"☀️" },
  { id:"heat_pump",     name:"Heat pump",                    icon:"♨️" },
  { id:"fence_wall",    name:"Fence or wall",                icon:"🧱" },
  { id:"rewire",        name:"Full rewire / electrical",     icon:"⚡" },
  { id:"boiler",        name:"Boiler replacement",           icon:"🔥" },
  { id:"new_build",     name:"New dwelling",                 icon:"🏗️" },
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

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; border: string; text: string; dot: string; priority: string }> = {
  submitted:       { label:"Submitted",        bg:"rgba(124,58,237,0.1)", border:C.purpleBorder, text:C.purple,  dot:C.purple,  priority:"🔥 Act now" },
  pending_decision:{ label:"Pending decision", bg:C.amberBg,              border:C.amberBorder,  text:C.amber,   dot:C.amber,   priority:"⏳ Still time" },
  approved:        { label:"Approved",         bg:C.greenBg,              border:C.greenBorder,  text:C.green,   dot:C.green,   priority:"✅ Ready" },
  refused:         { label:"Refused",          bg:C.redBg,                border:C.redBorder,    text:C.red,     dot:C.red,     priority:"❌ Refused" },
};

const PROP_TYPES = [
  { id:"detached",  name:"Detached house" },
  { id:"semi",      name:"Semi-detached" },
  { id:"terraced",  name:"Terraced house" },
  { id:"flat",      name:"Flat / apartment" },
  { id:"listed",    name:"Listed building" },
];

// ── Styles ───────────────────────────────────────────────────────────────────

const inp = () => ({
  width:"100%", padding:"9px 12px", borderRadius:8,
  border:`1.5px solid ${C.border}`, fontSize:13, color:C.body,
  fontFamily:"inherit", outline:"none", background:C.white,
});

const tab = (active: boolean) => ({
  padding:"10px 20px", borderRadius:10, border:"none", fontSize:13,
  fontWeight:600, cursor:"pointer", transition:"all 0.15s",
  background: active ? C.teal : "transparent",
  color: active ? C.white : C.secondary,
});

// ── Components ────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_CFG[status] || STATUS_CFG.submitted;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      borderRadius:20, border:`1px solid ${s.border}`, background:s.bg,
      padding:"3px 10px", fontSize:11, fontWeight:600, color:s.text }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  );
};

const TradePill = ({ trade }: { trade: string }) => (
  <span style={{ display:"inline-block", background:C.tealLight,
    color:"#0F766E", fontSize:10, fontWeight:600, padding:"2px 8px",
    borderRadius:20, border:`1px solid #99F6E4`, letterSpacing:"0.02em" }}>
    {trade}
  </span>
);

const PriorityFlag = ({ status }: { status: string }) => {
  const s = STATUS_CFG[status];
  if (!s) return null;
  return (
    <span style={{ fontSize:11, fontWeight:700, color:s.text }}>
      {s.priority}
    </span>
  );
};

// ── Application card ──────────────────────────────────────────────────────────

interface PlanningApp {
  id: string;
  council: string;
  address: string;
  postcode: string;
  type: string;
  description: string;
  status: string;
  submitted_date: string;
  decision_date: string | null;
  applicant_name: string;
  agent: string | null;
  trades_needed: string[];
  estimated_value: string;
  floorspace_m2: number;
  documents_available: boolean;
  validated: boolean;
}

const AppCard = ({ app, onSelect, selected }: { app: PlanningApp; onSelect: (app: PlanningApp) => void; selected: boolean }) => (
  <div onClick={() => onSelect(app)}
    style={{ background:C.white, border:`1.5px solid ${selected ? C.teal : C.border}`,
      borderRadius:14, padding:"14px 16px", cursor:"pointer",
      boxShadow: selected ? `0 0 0 2px ${C.tealLight}` : "0 1px 4px rgba(15,34,56,0.05)",
      transition:"all 0.15s" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:8 }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:700, color:C.deep, margin:"0 0 2px", lineHeight:1.3 }}>
          {app.address}
        </p>
        <p style={{ fontSize:11, color:C.secondary, margin:0 }}>
          {app.council} · {app.id}
        </p>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <StatusBadge status={app.status} />
        <p style={{ fontSize:10, margin:"4px 0 0", textAlign:"right" }}>
          <PriorityFlag status={app.status} />
        </p>
      </div>
    </div>
    <p style={{ fontSize:12, color:C.body, lineHeight:1.55, margin:"0 0 10px",
      display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
      {app.description}
    </p>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
        {app.trades_needed.slice(0,3).map(t => <TradePill key={t} trade={t} />)}
        {app.trades_needed.length > 3 && (
          <span style={{ fontSize:10, color:C.secondary, alignSelf:"center" }}>
            +{app.trades_needed.length - 3} more
          </span>
        )}
      </div>
      <div style={{ textAlign:"right" }}>
        <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:0 }}>{app.estimated_value}</p>
        <p style={{ fontSize:10, color:C.secondary, margin:0 }}>
          Submitted {new Date(app.submitted_date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
        </p>
      </div>
    </div>
  </div>
);

// ── Application detail panel ──────────────────────────────────────────────────

const AppDetail = ({ app, onClose, isMobile }: { app: PlanningApp; onClose: () => void; isMobile: boolean }) => {
  const s = STATUS_CFG[app.status] || STATUS_CFG.submitted;
  const daysSinceSubmission = Math.floor((Date.now() - new Date(app.submitted_date).getTime()) / 86400000);

  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobile]);

  const panel = (
    <div style={{
      background:C.white,
      borderRadius: isMobile ? 0 : 16,
      border: isMobile ? "none" : `2px solid ${C.teal}`,
      overflow: "hidden",
      position: isMobile ? "static" : "sticky",
      top: isMobile ? undefined : 80,
      height: isMobile ? "100%" : "auto",
      maxHeight: isMobile ? "100%" : "calc(100vh - 100px)",
      display:"flex", flexDirection:"column",
    }}>
      <div style={{ background:C.deep, padding:"14px 18px",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexShrink:0 }}>
        <div style={{ minWidth:0, flex:1 }}>
          <p style={{ fontSize:13, fontWeight:700, color:C.cream, margin:0,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.address}</p>
          <p style={{ fontSize:11, color:"rgba(245,240,232,0.78)", margin:"2px 0 0",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.id} · {app.council}</p>
        </div>
        <button onClick={onClose} aria-label="Close"
          style={{ background:"rgba(245,240,232,0.15)", border:"none", color:C.cream,
            fontSize:16, cursor:"pointer", padding:0, lineHeight:1, flexShrink:0,
            width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
      </div>

      {/* Priority alert */}
      {(app.status === "submitted" || app.status === "pending_decision") && (
        <div style={{ background:s.bg, borderBottom:`1px solid ${s.border}`,
          padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>{app.status === "submitted" ? "🔥" : "⏳"}</span>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:s.text, margin:0 }}>
              {app.status === "submitted"
                ? `Submitted ${daysSinceSubmission} days ago — homeowner likely sourcing trades now`
                : `Decision pending — homeowner preparing for works to start`}
            </p>
            <p style={{ fontSize:11, color:s.text, margin:"2px 0 0", opacity:0.8 }}>
              Register your interest now to be first in front of this homeowner
            </p>
          </div>
        </div>
      )}

      <div style={{ padding:"16px 18px", overflowY:"auto", flex:1, minHeight:0 }}>
        {/* Key info */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { label:"Application type", value:app.type },
            { label:"Estimated value", value:app.estimated_value },
            { label:"Floorspace", value:`${app.floorspace_m2}m²` },
            { label:"Submitted", value:new Date(app.submitted_date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) },
            { label:"Decision date", value:app.decision_date ? new Date(app.decision_date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "Pending" },
            { label:"Documents", value:app.documents_available ? "✅ Available" : "⏳ Not yet uploaded" },
          ].map(item => (
            <div key={item.label} style={{ background:C.cream, borderRadius:8, padding:"8px 10px" }}>
              <p style={{ fontSize:10, color:C.secondary, margin:"0 0 2px" }}>{item.label}</p>
              <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:0 }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.1em",
            textTransform:"uppercase", margin:"0 0 6px" }}>Full description</p>
          <p style={{ fontSize:12, color:C.body, lineHeight:1.65, margin:0 }}>{app.description}</p>
        </div>

        {/* Trades */}
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.1em",
            textTransform:"uppercase", margin:"0 0 8px" }}>Trades likely required</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {app.trades_needed.map(t => <TradePill key={t} trade={t} />)}
          </div>
        </div>

        {/* CTA */}
        {(app.status === "submitted" || app.status === "pending_decision") && (
          <div style={{ background:C.tealDim, border:`1.5px solid #99F6E4`,
            borderRadius:12, padding:"14px 16px" }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.navy, margin:"0 0 6px" }}>
              Register your interest
            </p>
            <p style={{ fontSize:11, color:C.secondary, lineHeight:1.6, margin:"0 0 12px" }}>
              ProGrafter will notify the homeowner that a vetted {app.trades_needed[0]} in
              their area has seen their application and is available to quote.
              Your credentials and reviews are shared — no cold calling.
            </p>
            <button style={{ width:"100%", background:C.teal, color:C.white,
              border:"none", borderRadius:8, padding:"11px 16px",
              fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Register interest in this job →
            </button>
            <p style={{ fontSize:10, color:C.secondary, textAlign:"center", marginTop:6 }}>
              You'll only be charged ProGrafter's 7.5% commission if you win and complete the job.
            </p>
          </div>
        )}

        {app.status === "approved" && (
          <div style={{ background:C.greenBg, border:`1px solid ${C.greenBorder}`,
            borderRadius:10, padding:"12px 14px" }}>
            <p style={{ fontSize:12, fontWeight:600, color:C.green, margin:"0 0 4px" }}>
              Permission granted — homeowner likely sourcing trades now
            </p>
            <button style={{ background:C.green, color:C.white, border:"none",
              borderRadius:8, padding:"9px 16px", fontSize:13, fontWeight:600, cursor:"pointer", marginTop:8 }}>
              Register interest →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0, background:"rgba(15,34,56,0.6)",
          zIndex:1000, display:"flex", alignItems:"stretch", justifyContent:"center",
        }}
      >
        <div onClick={e => e.stopPropagation()} style={{ width:"100%", height:"100%", background:C.white, display:"flex", flexDirection:"column" }}>
          {panel}
        </div>
      </div>
    );
  }

  return panel;
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

  const verdictConfig = !result ? null : result.pd === true
    ? { bg:C.greenBg,  border:C.greenBorder,  text:C.green,  icon:"✅", label:"Likely permitted development" }
    : result.pd === false
    ? { bg:C.redBg,    border:C.redBorder,    text:C.red,    icon:"❌", label:"Planning permission required" }
    : { bg:C.amberBg,  border:C.amberBorder,  text:C.amber,  icon:"⚠️", label:"Seek professional advice" };

  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:C.deep, margin:"0 0 6px" }}>
          Do I need planning permission?
        </h2>
        <p style={{ fontSize:13, color:C.secondary, maxWidth:480, margin:"0 auto", lineHeight:1.65 }}>
          Check whether your project falls under permitted development or requires
          a full planning application — before you spend a penny.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginBottom:20 }}>
        {PD_PROJECTS.map(p => (
          <button key={p.id} onClick={() => { setProject(p.id); setResult(null); }}
            style={{ background: project === p.id ? C.tealDim : C.white,
              border:`1.5px solid ${project === p.id ? C.teal : C.border}`,
              borderRadius:10, padding:"12px 10px", cursor:"pointer",
              textAlign:"center", transition:"all 0.15s" }}>
            <div style={{ fontSize:22, marginBottom:5 }}>{p.icon}</div>
            <p style={{ fontSize:11, fontWeight:600, color: project === p.id ? C.teal : C.navy,
              margin:0, lineHeight:1.3 }}>{p.name}</p>
          </button>
        ))}
      </div>

      {project && (
        <div style={{ background:C.white, border:`1.5px solid ${C.border}`,
          borderRadius:14, padding:"1.25rem", marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600,
                color:C.navy, marginBottom:5 }}>Property type <span style={{color:C.teal}}>*</span></label>
              <select style={inp()} value={propType}
                onChange={e => { setPropType(e.target.value); setResult(null); }}>
                <option value="">Select...</option>
                {PROP_TYPES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer",
                padding:"10px 12px", background:C.cream, borderRadius:8,
                border:`1.5px solid ${conservation ? C.amber : C.border}` }}>
                <input type="checkbox" checked={conservation}
                  onChange={e => { setConservation(e.target.checked); setResult(null); }}
                  style={{ width:16, height:16, accentColor:C.amber, cursor:"pointer" }} />
                <span style={{ fontSize:12, color:C.body }}>In a Conservation Area?</span>
              </label>
            </div>
          </div>
          <button onClick={check} disabled={!propType}
            style={{ width:"100%", background: propType ? C.navy : "#D1D5DB",
              color:C.white, border:"none", borderRadius:8, padding:"11px",
              fontSize:14, fontWeight:700, cursor: propType ? "pointer" : "not-allowed" }}>
            Check planning requirements →
          </button>
        </div>
      )}

      {result && verdictConfig && (
        <div style={{ background:verdictConfig.bg, border:`2px solid ${verdictConfig.border}`,
          borderRadius:14, overflow:"hidden", marginBottom:20 }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${verdictConfig.border}`,
            display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:26 }}>{verdictConfig.icon}</span>
            <div>
              <p style={{ fontSize:16, fontWeight:700, color:verdictConfig.text, margin:0 }}>
                {verdictConfig.label}
              </p>
              <p style={{ fontSize:11, color:verdictConfig.text, opacity:0.8, margin:"2px 0 0" }}>
                {PD_PROJECTS.find(p=>p.id===project)?.name} · {PROP_TYPES.find(p=>p.id===propType)?.name}
                {conservation ? " · Conservation Area" : ""}
              </p>
            </div>
          </div>
          <div style={{ padding:"14px 18px" }}>
            <p style={{ fontSize:13, color:C.body, lineHeight:1.7, margin:"0 0 14px" }}>{result.notes}</p>
            <div style={{ background:C.amberBg, border:`1px solid ${C.amberBorder}`,
              borderRadius:8, padding:"10px 12px", fontSize:11, color:C.amber, lineHeight:1.6 }}>
              <strong>Important:</strong> This is a general guide only. Always confirm with your Local
              Planning Authority before starting work. Rules vary in Article 4 Direction areas,
              National Parks, and AONBs. ProGrafter can connect you with a planning consultant if needed.
            </div>
          </div>
        </div>
      )}

      {result && (
        <div style={{ background:C.white, border:`1.5px solid ${C.border}`,
          borderRadius:14, padding:"1.25rem" }}>
          <p style={{ fontSize:13, fontWeight:700, color:C.deep, margin:"0 0 10px" }}>
            Ready to find a vetted trader for this project?
          </p>
          <p style={{ fontSize:12, color:C.secondary, lineHeight:1.6, margin:"0 0 12px" }}>
            Every trader on ProGrafter is personally vetted, insured, and referenced.
            Post your job brief and get quotes from qualified tradespeople in your area.
          </p>
          <div style={{ display:"flex", gap:10 }}>
            <button style={{ flex:1, background:C.teal, color:C.white, border:"none",
              borderRadius:8, padding:"11px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Post a job brief →
            </button>
            <button style={{ flex:1, background:"none", border:`1.5px solid ${C.navy}`,
              color:C.navy, borderRadius:8, padding:"11px",
              fontSize:13, fontWeight:600, cursor:"pointer" }}>
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
  const [activeTab, setActiveTab] = useState("pipeline");
  const [selectedApp, setSelectedApp] = useState<PlanningApp | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTrade, setFilterTrade] = useState("all");
  const [filterCouncil, setFilterCouncil] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allTrades = [...new Set(MOCK_APPLICATIONS.flatMap(a => a.trades_needed))].sort();
  const allCouncils = [...new Set(MOCK_APPLICATIONS.map(a => a.council))].sort();

  const filtered = MOCK_APPLICATIONS.filter(app => {
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    if (filterTrade !== "all" && !app.trades_needed.includes(filterTrade)) return false;
    if (filterCouncil !== "all" && app.council !== filterCouncil) return false;
    if (searchQuery && !app.description.toLowerCase().includes(searchQuery.toLowerCase())
      && !app.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sort: submitted first, then pending, then approved, then refused
  const sortOrder: Record<string, number> = { submitted:0, pending_decision:1, approved:2, refused:3 };
  const sorted = [...filtered].sort((a,b) => sortOrder[a.status] - sortOrder[b.status]);

  const counts = {
    submitted: MOCK_APPLICATIONS.filter(a=>a.status==="submitted").length,
    pending_decision: MOCK_APPLICATIONS.filter(a=>a.status==="pending_decision").length,
    approved: MOCK_APPLICATIONS.filter(a=>a.status==="approved").length,
    refused: MOCK_APPLICATIONS.filter(a=>a.status==="refused").length,
  };

  return (
    <>
      <SEO
        title="Planning Intelligence — Live Pipeline &amp; PD Checker | ProGrafter"
        description="Browse live planning applications from East Midlands councils. Check permitted development rules before you apply."
        path="/planning-alerts"
      />
      <AppShell>
        <div style={{ minHeight:"calc(100vh - 64px)", background:C.cream, fontFamily:"'DM Sans', system-ui, sans-serif" }}>

          {/* Sub-header */}
          <div style={{ background:C.deep, padding:"16px 24px",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.5px" }}>
              <span style={{ color:C.cream }}>Pro</span>
              <span style={{ color:C.teal }}>Grafter</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:C.teal, background:"rgba(13,148,136,0.15)",
                padding:"3px 10px", borderRadius:20, fontWeight:600, letterSpacing:"0.05em" }}>
                PLANNING INTELLIGENCE
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`,
            padding:"0 16px", display:"flex", alignItems:"stretch", gap:4, flexWrap:"wrap", overflowX:"auto" }}>
            <button style={{ ...tab(activeTab==="pipeline"), whiteSpace:"nowrap" }} onClick={()=>setActiveTab("pipeline")}>
              📡 Live pipeline
            </button>
            <button style={{ ...tab(activeTab==="checker"), whiteSpace:"nowrap" }} onClick={()=>setActiveTab("checker")}>
              🔍 Planning permission?
            </button>
          </div>

          <div style={{ maxWidth:activeTab==="pipeline" ? 1100 : 700, margin:"0 auto", padding:"1.5rem 1rem" }}>
            {activeTab === "pipeline" && (
              <>
                {/* Stats row */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                  {[
                    { status:"submitted",       label:"Submitted",       count:counts.submitted,        note:"Act now" },
                    { status:"pending_decision",label:"Pending decision",count:counts.pending_decision, note:"Still time" },
                    { status:"approved",        label:"Approved",        count:counts.approved,         note:"Ready" },
                    { status:"refused",         label:"Refused",         count:counts.refused,          note:"Not viable" },
                  ].map(s => {
                    const sc = STATUS_CFG[s.status];
                    return (
                      <button key={s.status}
                        onClick={()=>setFilterStatus(f=>f===s.status?"all":s.status)}
                        style={{ background: filterStatus===s.status ? sc.bg : C.white,
                          border:`1.5px solid ${filterStatus===s.status ? sc.border : C.border}`,
                          borderRadius:12, padding:"12px 14px", cursor:"pointer",
                          textAlign:"left", transition:"all 0.15s" }}>
                        <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:2 }}>
                          <span style={{ fontSize:24, fontWeight:700,
                            color:filterStatus===s.status ? sc.text : C.deep }}>{s.count}</span>
                        </div>
                        <p style={{ fontSize:11, fontWeight:600,
                          color:filterStatus===s.status ? sc.text : C.secondary, margin:0 }}>{s.label}</p>
                        <p style={{ fontSize:10, color:sc.text, margin:"2px 0 0", opacity:0.8 }}>{s.note}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Filters */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10, marginBottom:16 }}>
                  <div style={{ position:"relative", gridColumn:"1 / -1" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                      fontSize:14, color:C.secondary, pointerEvents:"none",
                      display: searchQuery ? "none" : "block" }}>
                      🔍 Search address or description…
                    </span>
                    <input style={inp()} value={searchQuery}
                      onChange={e=>setSearchQuery(e.target.value)}
                      aria-label="Search address or description" />
                  </div>
                  <select style={inp()} value={filterTrade} onChange={e=>setFilterTrade(e.target.value)}>
                    <option value="all">All trades</option>
                    {allTrades.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <select style={inp()} value={filterCouncil} onChange={e=>setFilterCouncil(e.target.value)}>
                    <option value="all">All councils</option>
                    {allCouncils.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={()=>{setFilterStatus("all");setFilterTrade("all");setFilterCouncil("all");setSearchQuery("");}}
                    style={{ padding:"9px 14px", background:C.white, border:`1.5px solid ${C.border}`,
                      borderRadius:8, fontSize:12, fontWeight:600, color:C.deep, cursor:"pointer", whiteSpace:"nowrap" }}>
                    Clear filters
                  </button>
                </div>

                <div style={{ display:"grid", gridTemplateColumns: (selectedApp && !isMobile) ? "1fr 380px" : "1fr", gap:16, alignItems:"start" }}>
                  {/* Application list */}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {sorted.length === 0 && (
                      <div style={{ background:C.white, borderRadius:14, border:`1px solid ${C.border}`,
                        padding:"2rem", textAlign:"center" }}>
                        <p style={{ fontSize:14, color:C.secondary, margin:0 }}>No applications match your filters</p>
                      </div>
                    )}
                    {sorted.map(app => (
                      <AppCard key={app.id} app={app}
                        selected={selectedApp?.id === app.id}
                        onSelect={a => setSelectedApp(prev=>prev?.id===a.id?null:a)} />
                    ))}

                    {/* Data source notice */}
                    <div style={{ background:C.white, border:`1px solid ${C.border}`,
                      borderRadius:10, padding:"12px 16px",
                      display:"flex", alignItems:"flex-start", gap:10 }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>📡</span>
                      <div>
                        <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:"0 0 3px" }}>
                          Live data in production
                        </p>
                        <p style={{ fontSize:11, color:C.secondary, lineHeight:1.6, margin:0 }}>
                          This feed pulls live planning applications from South Derbyshire (Idox Public Access),
                          Nottingham City, Broxtowe, and Rushcliffe council portals via a Supabase
                          Edge Function that runs nightly. New applications appear within 24 hours of
                          council validation. Connect the <strong>PlanningAlerts.org.uk API</strong> or
                          scrape individual LPA portals to expand coverage across the East Midlands.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detail panel */}
                  {selectedApp && (
                    <AppDetail app={selectedApp} onClose={()=>setSelectedApp(null)} isMobile={isMobile} />
                  )}
                </div>
              </>
            )}

            {activeTab === "checker" && <PDChecker />}
          </div>
        </div>
      </AppShell>
    </>
  );
}
