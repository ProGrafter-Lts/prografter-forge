import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

type Stage = "new" | "contacted" | "no_answer" | "follow_up" | "interested" | "not_interested" | "converted";
type Pipeline = "trade" | "website";
type WebQuality = "none" | "poor" | "outdated" | "weak_mobile" | "no_form" | "ok";

type Scraped = {
  id: string;
  trade_name: string;
  trade_type: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  has_website: boolean;
  address: string | null;
  postcode: string | null;
  city: string | null;
  rating: number | null;
  reviews_count: number | null;
  source: string;
  search_query: string | null;
  contacted: boolean;
  outreach_stage: Stage;
  interested: boolean | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
  notes: string | null;
  last_scraped_at: string;
  pipeline: Pipeline;
  website_quality: WebQuality | null;
  mini_audit_sent: boolean;
  mini_audit_sent_at: string | null;
  proposal_sent: boolean;
  proposal_sent_at: string | null;
  // Extended Website Outreach fields
  website_status: string | null;
  website_score: number | null;
  opportunity_angle: string | null;
  main_website_issue: string | null;
  audit_notes: string | null;
  audit_sent: boolean;
  audit_sent_date: string | null;
  proposal_sent_date: string | null;
  package_recommended: string | null;
  quoted_value: number | null;
  monthly_care_interest: string | null;
  monthly_care_price: number | null;
  contact_name: string | null;
  contact_email: string | null;
  whatsapp_number: string | null;
  preferred_contact_method: string | null;
  tps_checked: boolean;
  ctps_checked: boolean;
  date_checked: string | null;
  do_not_call: boolean;
  objection_reason: string | null;
  source_of_number: string | null;
  last_contacted_date: string | null;
  next_follow_up_date: string | null;
  call_attempts: number | null;
  last_call_outcome: string | null;
  lost_reason: string | null;
};

const WEBSITE_STATUS_OPTIONS = [
  "Not checked", "No website found", "Facebook only", "Outdated website",
  "Poor mobile layout", "No enquiry form", "Weak content", "Weak gallery/photos",
  "No reviews shown", "No clear services", "Slow/confusing website",
  "Decent website", "Strong website", "Not suitable",
];
const PACKAGE_OPTIONS = ["Not selected", "Starter Site", "Growth Site", "Monthly Care Only", "Custom"];
const MONTHLY_CARE_INTEREST_OPTIONS = ["Not discussed", "Yes", "Maybe", "No"];
const PREFERRED_CONTACT_OPTIONS = ["Unknown", "Phone", "Email", "WhatsApp", "Text"];
const CALL_OUTCOME_OPTIONS = [
  "Not called", "No answer", "Voicemail left", "Spoke to owner",
  "Spoke to staff/gatekeeper", "Call back requested", "Interested",
  "Audit requested", "Not interested", "Do not call", "Won", "Lost",
];
const LOST_REASON_OPTIONS = [
  "Not selected", "Too expensive", "Already has designer", "Not interested",
  "No budget", "Too busy", "Wants to stay as is", "Could not contact", "Other",
];


const C = {
  cream: "#F5F0E8", deep: "#0F2238", navy: "#27396A",
  teal: "#14A8A1", red: "#DC2626", green: "#16A34A", amber: "#D97706",
  border: "rgba(245,240,232,0.1)", dim: "rgba(245,240,232,0.55)", bright: "#F5F0E8",
};

const STAGES: { value: Stage | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: C.dim },
  { value: "new", label: "New", color: C.dim },
  { value: "contacted", label: "Contacted", color: C.teal },
  { value: "no_answer", label: "No answer", color: "#0EA5E9" },
  { value: "follow_up", label: "Follow-up", color: C.amber },
  { value: "interested", label: "Interested", color: C.green },
  { value: "not_interested", label: "Not interested", color: C.red },
  { value: "converted", label: "Converted", color: "#7c3aed" },
];

const WEB_QUALITY: { value: WebQuality; label: string; color: string }[] = [
  { value: "none", label: "No website", color: C.red },
  { value: "poor", label: "Poor / weak", color: C.amber },
  { value: "outdated", label: "Outdated", color: C.amber },
  { value: "weak_mobile", label: "Weak mobile", color: "#0EA5E9" },
  { value: "no_form", label: "No enquiry form", color: "#7c3aed" },
  { value: "ok", label: "Looks OK", color: C.green },
];

const webQualityMeta = (q: WebQuality | null) =>
  WEB_QUALITY.find((x) => x.value === q) ?? null;

// Website opportunity focus for the scrape panel. `seed` sets an initial
// website_quality assessment on NEW leads only (Places can't verify site quality,
// so this is a starting hint the admin confirms). `noSiteOnly` strictly filters.
type WebFocus =
  | "any" | "no_website" | "poor" | "facebook_only" | "outdated"
  | "poor_mobile" | "no_form" | "weak_seo" | "strong_reviews_weak";

const WEB_FOCUS: { value: WebFocus; label: string; seed: WebQuality | null; noSiteOnly: boolean }[] = [
  { value: "any", label: "Any opportunity", seed: null, noSiteOnly: false },
  { value: "no_website", label: "No website only", seed: "none", noSiteOnly: true },
  { value: "poor", label: "Poor website", seed: "poor", noSiteOnly: false },
  { value: "facebook_only", label: "Facebook only", seed: "poor", noSiteOnly: false },
  { value: "outdated", label: "Outdated website", seed: "outdated", noSiteOnly: false },
  { value: "poor_mobile", label: "Poor mobile experience", seed: "weak_mobile", noSiteOnly: false },
  { value: "no_form", label: "No enquiry form", seed: "no_form", noSiteOnly: false },
  { value: "weak_seo", label: "Weak local SEO", seed: "poor", noSiteOnly: false },
  { value: "strong_reviews_weak", label: "Strong reviews but weak website", seed: "poor", noSiteOnly: false },
];

// Website-outreach opportunity score (0-100): higher = better prospect to sell a website to.
// An established local business (lots of reviews, decent rating) with a missing/weak website
// is the strongest target — they clearly have demand but a poor online presence.
const webScore = (r: Scraped): number => {
  let score = 0;
  const q = r.website_quality;
  if (!r.has_website || q === "none") score += 45;
  else if (q === "poor" || q === "outdated") score += 30;
  else if (q === "weak_mobile" || q === "no_form") score += 18;
  else if (q === "ok") score += 4;
  else score += 20; // not assessed yet — treat as a live unknown

  const reviews = r.reviews_count ?? 0;
  if (reviews >= 100) score += 30;
  else if (reviews >= 40) score += 22;
  else if (reviews >= 15) score += 14;
  else if (reviews >= 5) score += 8;

  const rating = r.rating ?? 0;
  if (rating >= 4.5) score += 15;
  else if (rating >= 4.0) score += 10;
  else if (rating >= 3.0) score += 4;

  if (r.phone) score += 5;
  return Math.max(0, Math.min(100, score));
};

const scoreColor = (s: number): string =>
  s >= 70 ? C.green : s >= 45 ? C.amber : C.dim;

// Website opportunity score bands for the small coloured badge in the table.
const SCORE_BANDS: { min: number; color: string; label: string }[] = [
  { min: 80, color: C.green, label: "Excellent" },
  { min: 60, color: "#22C55E", label: "Good" },
  { min: 40, color: C.amber, label: "Possible" },
  { min: 0, color: C.dim, label: "Weak" },
];
const scoreBand = (s: number) => SCORE_BANDS.find((b) => s >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];

const stageMeta = (s: Stage) => STAGES.find((x) => x.value === s) ?? STAGES[1];

// Website Outreach stage filters — each has a live predicate over a lead.
const isNoWebsite = (r: Scraped) =>
  !r.has_website || r.website_quality === "none" || r.website_status === "No website found";
const isPoorWebsite = (r: Scraped) =>
  ["poor", "outdated", "weak_mobile", "no_form"].includes(r.website_quality ?? "") ||
  ["Facebook only", "Outdated website", "Poor mobile layout", "No enquiry form",
   "Weak content", "Weak gallery/photos", "No reviews shown", "No clear services",
   "Slow/confusing website"].includes(r.website_status ?? "");

const WEB_FILTERS: { value: string; label: string; color: string; match: (r: Scraped) => boolean }[] = [
  { value: "all", label: "All", color: C.dim, match: () => true },
  { value: "new", label: "New", color: "#0EA5E9", match: (r) => r.outreach_stage === "new" },
  { value: "no_website", label: "No website", color: C.teal, match: isNoWebsite },
  { value: "poor_website", label: "Poor website", color: C.amber, match: isPoorWebsite },
  { value: "contacted", label: "Contacted", color: "#06B6D4", match: (r) => r.outreach_stage === "contacted" },
  { value: "no_answer", label: "No answer", color: "#3B82F6", match: (r) => r.outreach_stage === "no_answer" || r.last_call_outcome === "No answer" },
  { value: "interested", label: "Interested", color: C.green, match: (r) => r.interested === true || r.outreach_stage === "interested" || r.last_call_outcome === "Interested" },
  { value: "audit_sent", label: "Audit sent", color: "#7c3aed", match: (r) => !!(r.audit_sent || r.mini_audit_sent) },
  { value: "proposal_sent", label: "Proposal sent", color: C.amber, match: (r) => !!r.proposal_sent },
  { value: "won", label: "Won", color: "#22C55E", match: (r) => r.last_call_outcome === "Won" || r.outreach_stage === "converted" },
  { value: "lost", label: "Lost", color: C.red, match: (r) => r.last_call_outcome === "Lost" || r.outreach_stage === "not_interested" || !!r.lost_reason && r.lost_reason !== "Not selected" },
  { value: "do_not_call", label: "Do not call", color: "#9CA3AF", match: (r) => !!r.do_not_call },
];


const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.05)",
  color: C.bright, fontSize: 13, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box",
};

const btn = (primary = true): React.CSSProperties => ({
  background: primary ? C.teal : "transparent",
  color: primary ? "#fff" : C.teal,
  border: primary ? "none" : `1px solid ${C.teal}`,
  borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700,
  cursor: "pointer",
});

const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase",
  letterSpacing: "0.05em", marginBottom: 4, display: "block",
};
const smallInp: React.CSSProperties = { ...inp, padding: "7px 10px", fontSize: 12 };

function WebLeadDetails({ row, onSave, colSpan }: {
  row: Scraped;
  onSave: (patch: Partial<Scraped>) => Promise<void> | void;
  colSpan: number;
}) {
  const [d, setD] = useState<Partial<Scraped>>({
    website_status: row.website_status ?? "Not checked",
    website_score: row.website_score,
    opportunity_angle: row.opportunity_angle ?? "",
    main_website_issue: row.main_website_issue ?? "",
    audit_notes: row.audit_notes ?? "",
    audit_sent: row.audit_sent ?? false,
    audit_sent_date: row.audit_sent_date ?? "",
    proposal_sent: row.proposal_sent ?? false,
    proposal_sent_date: row.proposal_sent_date ?? "",
    package_recommended: row.package_recommended ?? "Not selected",
    quoted_value: row.quoted_value,
    monthly_care_interest: row.monthly_care_interest ?? "Not discussed",
    monthly_care_price: row.monthly_care_price,
    contact_name: row.contact_name ?? "",
    contact_email: row.contact_email ?? "",
    whatsapp_number: row.whatsapp_number ?? "",
    preferred_contact_method: row.preferred_contact_method ?? "Unknown",
    tps_checked: row.tps_checked ?? false,
    ctps_checked: row.ctps_checked ?? false,
    date_checked: row.date_checked ?? "",
    do_not_call: row.do_not_call ?? false,
    objection_reason: row.objection_reason ?? "",
    source_of_number: row.source_of_number ?? "",
    last_contacted_date: row.last_contacted_date ?? "",
    next_follow_up_date: row.next_follow_up_date ?? "",
    call_attempts: row.call_attempts ?? 0,
    last_call_outcome: row.last_call_outcome ?? "Not called",
    lost_reason: row.lost_reason ?? "Not selected",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Scraped, v: unknown) => setD((p) => ({ ...p, [k]: v }));

  const num = (v: unknown) => (v === "" || v == null ? null : Number(v));
  const str = (v: unknown) => (v === "" ? null : v);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      website_status: str(d.website_status) as string | null,
      website_score: num(d.website_score),
      opportunity_angle: str(d.opportunity_angle) as string | null,
      main_website_issue: str(d.main_website_issue) as string | null,
      audit_notes: str(d.audit_notes) as string | null,
      audit_sent: !!d.audit_sent,
      audit_sent_date: str(d.audit_sent_date) as string | null,
      proposal_sent: !!d.proposal_sent,
      proposal_sent_date: str(d.proposal_sent_date) as string | null,
      package_recommended: str(d.package_recommended) as string | null,
      quoted_value: num(d.quoted_value),
      monthly_care_interest: str(d.monthly_care_interest) as string | null,
      monthly_care_price: num(d.monthly_care_price),
      contact_name: str(d.contact_name) as string | null,
      contact_email: str(d.contact_email) as string | null,
      whatsapp_number: str(d.whatsapp_number) as string | null,
      preferred_contact_method: str(d.preferred_contact_method) as string | null,
      tps_checked: !!d.tps_checked,
      ctps_checked: !!d.ctps_checked,
      date_checked: str(d.date_checked) as string | null,
      do_not_call: !!d.do_not_call,
      objection_reason: str(d.objection_reason) as string | null,
      source_of_number: str(d.source_of_number) as string | null,
      last_contacted_date: str(d.last_contacted_date) as string | null,
      next_follow_up_date: str(d.next_follow_up_date) as string | null,
      call_attempts: num(d.call_attempts),
      last_call_outcome: str(d.last_call_outcome) as string | null,
      lost_reason: str(d.lost_reason) as string | null,
    });
    setSaving(false);
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label style={lbl}>{label}</label>{children}</div>
  );
  const Check = ({ label, k }: { label: string; k: keyof Scraped }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.bright, cursor: "pointer" }}>
      <input type="checkbox" checked={!!d[k]} onChange={(e) => set(k, e.target.checked)} />
      {label}
    </label>
  );
  const Sel = ({ k, options }: { k: keyof Scraped; options: string[] }) => (
    <select value={(d[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} style={smallInp}>
      {options.map((o) => <option key={o} value={o} style={{ color: "#000" }}>{o}</option>)}
    </select>
  );
  const section: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: C.teal, textTransform: "uppercase", letterSpacing: "0.06em", margin: "4px 0 2px" };
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 };

  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0, background: "rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={section}>Website</div>
          <div style={grid}>
            <Field label="Website status"><Sel k="website_status" options={WEBSITE_STATUS_OPTIONS} /></Field>
            <Field label="Website score (0-100)"><input type="number" min={0} max={100} value={d.website_score ?? ""} onChange={(e) => set("website_score", e.target.value)} style={smallInp} /></Field>
            <Field label="Opportunity angle"><input value={d.opportunity_angle ?? ""} onChange={(e) => set("opportunity_angle", e.target.value)} placeholder="Strong reviews but website does not reflect quality…" style={smallInp} /></Field>
            <Field label="Main website issue"><input value={d.main_website_issue ?? ""} onChange={(e) => set("main_website_issue", e.target.value)} style={smallInp} /></Field>
          </div>
          <Field label="Audit notes"><textarea rows={3} value={d.audit_notes ?? ""} onChange={(e) => set("audit_notes", e.target.value)} style={smallInp} /></Field>

          <div style={section}>Audit &amp; Proposal</div>
          <div style={grid}>
            <Check label="Audit sent" k="audit_sent" />
            <Field label="Audit sent date"><input type="date" value={d.audit_sent_date ?? ""} onChange={(e) => set("audit_sent_date", e.target.value)} style={smallInp} /></Field>
            <Check label="Proposal sent" k="proposal_sent" />
            <Field label="Proposal sent date"><input type="date" value={d.proposal_sent_date ?? ""} onChange={(e) => set("proposal_sent_date", e.target.value)} style={smallInp} /></Field>
            <Field label="Package recommended"><Sel k="package_recommended" options={PACKAGE_OPTIONS} /></Field>
            <Field label="Quoted value (£)"><input type="number" min={0} value={d.quoted_value ?? ""} onChange={(e) => set("quoted_value", e.target.value)} style={smallInp} /></Field>
            <Field label="Monthly care interest"><Sel k="monthly_care_interest" options={MONTHLY_CARE_INTEREST_OPTIONS} /></Field>
            <Field label="Monthly care price (£)"><input type="number" min={0} value={d.monthly_care_price ?? ""} onChange={(e) => set("monthly_care_price", e.target.value)} style={smallInp} /></Field>
          </div>

          <div style={section}>Contact &amp; Compliance</div>
          <div style={grid}>
            <Field label="Contact name"><input value={d.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} style={smallInp} /></Field>
            <Field label="Contact email"><input value={d.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} style={smallInp} /></Field>
            <Field label="WhatsApp number"><input value={d.whatsapp_number ?? ""} onChange={(e) => set("whatsapp_number", e.target.value)} style={smallInp} /></Field>
            <Field label="Preferred contact method"><Sel k="preferred_contact_method" options={PREFERRED_CONTACT_OPTIONS} /></Field>
            <Field label="Date checked"><input type="date" value={d.date_checked ?? ""} onChange={(e) => set("date_checked", e.target.value)} style={smallInp} /></Field>
            <Field label="Source of number"><input value={d.source_of_number ?? ""} onChange={(e) => set("source_of_number", e.target.value)} style={smallInp} /></Field>
            <Field label="Objection reason"><input value={d.objection_reason ?? ""} onChange={(e) => set("objection_reason", e.target.value)} style={smallInp} /></Field>
            <Field label="Last contacted date"><input type="date" value={d.last_contacted_date ?? ""} onChange={(e) => set("last_contacted_date", e.target.value)} style={smallInp} /></Field>
            <Field label="Next follow-up date"><input type="date" value={d.next_follow_up_date ?? ""} onChange={(e) => set("next_follow_up_date", e.target.value)} style={smallInp} /></Field>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 2 }}>
            <Check label="TPS checked" k="tps_checked" />
            <Check label="CTPS checked" k="ctps_checked" />
            <Check label="Do not call" k="do_not_call" />
          </div>

          <div style={section}>Sales Tracking</div>
          <div style={grid}>
            <Field label="Call attempts"><input type="number" min={0} value={d.call_attempts ?? 0} onChange={(e) => set("call_attempts", e.target.value)} style={smallInp} /></Field>
            <Field label="Last call outcome"><Sel k="last_call_outcome" options={CALL_OUTCOME_OPTIONS} /></Field>
            <Field label="Lost reason"><Sel k="lost_reason" options={LOST_REASON_OPTIONS} /></Field>
          </div>

          <div>
            <button onClick={handleSave} disabled={saving} style={{ ...btn(true), opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "Save details"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// Generates a simple, editable cold-call script for a website-outreach lead.
function buildCallScript(r: Scraped): string {
  const name = r.contact_name || "there";
  const biz = r.trade_name;
  const issue = r.main_website_issue || r.website_status || (r.has_website ? "your current website" : "not having a website");
  const reviews = r.reviews_count ? `${r.reviews_count} reviews` : "your reputation";
  const rating = r.rating ? ` at ${r.rating}★` : "";
  return [
    `CALL SCRIPT — ${biz}`,
    ``,
    `Opener:`,
    `"Hi, is that ${name}? My name's [YOU] from ProGrafter. I'll be quick — I help local businesses like ${biz} get more enquiries from their website. Have you got 30 seconds?"`,
    ``,
    `Reason for call:`,
    `"I had a look at ${biz} online — you've got ${reviews}${rating}, which is brilliant. But I noticed ${issue}, and that's likely costing you enquiries from people who'd otherwise call."`,
    ``,
    `Value:`,
    `"We build fast, mobile-friendly sites that turn visitors into phone calls and form enquiries — usually live within a couple of weeks."`,
    ``,
    `Ask:`,
    `"Would it help if I put together a free 2-minute mini-audit of your online presence and send it over? No obligation."`,
    ``,
    `If yes → confirm best email/WhatsApp. If not now → agree a follow-up date.`,
  ].join("\n");
}

// Generates a plain-text mini website audit the admin can copy and send.
function buildAuditText(r: Scraped): string {
  const lines = [
    `WEBSITE MINI-AUDIT — ${r.trade_name}`,
    ``,
    `Prepared by ProGrafter`,
    `Date: ${new Date().toLocaleDateString()}`,
    ``,
    `Business: ${r.trade_name}${r.trade_type ? ` (${r.trade_type})` : ""}`,
    `Location: ${[r.city, r.postcode].filter(Boolean).join(", ") || r.address || "—"}`,
    `Google rating: ${r.rating ? `${r.rating}★ (${r.reviews_count ?? 0} reviews)` : "—"}`,
    `Current website: ${r.website || "None found"}`,
    ``,
    `WHAT WE FOUND`,
    `• Website status: ${r.website_status || (r.has_website ? "Has a website" : "No website found")}`,
    `• Main issue: ${r.main_website_issue || "Site does not reflect the quality of the business"}`,
    `• Opportunity: ${r.opportunity_angle || "Strong reviews but weak online presence — enquiries are being lost."}`,
    ``,
    `WHY IT MATTERS`,
    `Most customers check you online before calling. A slow, outdated or missing website means`,
    `they move on to a competitor — even when your reviews are excellent.`,
    ``,
    `WHAT WE'D RECOMMEND`,
    `• A fast, mobile-first website that loads in under 2 seconds`,
    `• Clear services, service area and a prominent "call / enquire" button`,
    `• Reviews and photos front and centre to build trust`,
    `${r.package_recommended && r.package_recommended !== "Not selected" ? `• Suggested package: ${r.package_recommended}` : "• Suggested package: Starter or Growth Site"}`,
    ``,
    `NEXT STEP`,
    `Reply to this message or call us back and we'll walk you through it — no obligation.`,
  ];
  return lines.join("\n");
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  } catch {
    toast({ title: "Copy failed", description: "Select the text and copy manually.", variant: "destructive" });
  }
}

export default function AdminTradeScraper() {
  const [rows, setRows] = useState<Scraped[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Pipeline>("trade");
  const [tradeType, setTradeType] = useState("electricians");
  const [location, setLocation] = useState("Nottingham, Nottinghamshire");
  const [limit, setLimit] = useState(10);
  const [webFocus, setWebFocus] = useState<WebFocus>("no_website");
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStage, setFilterStage] = useState<Stage | "all">("all");
  const [webFilter, setWebFilter] = useState<string>("all");
  const [hideContacted, setHideContacted] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftFollowUp, setDraftFollowUp] = useState("");
  const [modal, setModal] = useState<{ title: string; text: string } | null>(null);


  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scraped_trades")
      .select("*")
      .order("last_scraped_at", { ascending: false })
      .limit(1000);
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data as unknown as Scraped[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScrape = async () => {
    if (!tradeType.trim()) {
      toast({ title: pipeline === "website" ? "Pick a business type" : "Pick a trade type", variant: "destructive" });
      return;
    }
    setRunning(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("scrape-trades", {
      body: {
        trade_type: tradeType,
        location,
        limit,
        pipeline,
        website_focus: pipeline === "website" ? webFocus : undefined,
        no_website_only: pipeline === "website" && WEB_FOCUS.find((f) => f.value === webFocus)?.noSiteOnly,
      },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    setRunning(false);
    if (error) {
      toast({ title: "Scrape failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Scrape complete",
      description: `${(data as { upserted?: number }).upserted ?? 0} ${pipeline === "website" ? "businesses" : "trades"} added/updated`,
    });
    load();
  };

  const updateRow = async (id: string, patch: Partial<Scraped>) => {

    const { error } = await supabase.from("scraped_trades").update(patch as never).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } as Scraped : r)));
  };

  const setStage = (row: Scraped, stage: Stage) => {
    const patch: Record<string, unknown> = { outreach_stage: stage };
    if (stage !== "new") {
      patch.contacted = true;
      patch.last_contacted_at = new Date().toISOString();
      if (!row.last_contacted_at) patch.contacted_at = new Date().toISOString();
    }
    if (stage === "interested") patch.interested = true;
    if (stage === "not_interested") patch.interested = false;
    updateRow(row.id, patch as Partial<Scraped>);
  };

  const setWebQuality = (row: Scraped, q: WebQuality) => {
    updateRow(row.id, { website_quality: q });
  };

  const setWebsiteStatus = (row: Scraped, status: string) => {
    updateRow(row.id, { website_status: status });
  };

  const toggleAudit = (row: Scraped) => {
    const next = !row.mini_audit_sent;
    updateRow(row.id, {
      mini_audit_sent: next,
      mini_audit_sent_at: next ? new Date().toISOString() : null,
    });
  };

  const toggleProposal = (row: Scraped) => {
    const next = !row.proposal_sent;
    updateRow(row.id, {
      proposal_sent: next,
      proposal_sent_at: next ? new Date().toISOString() : null,
    });
  };

  const beginEdit = (r: Scraped) => {
    setEditing(r.id);
    setDraftNotes(r.notes ?? "");
    setDraftFollowUp(r.follow_up_at ? r.follow_up_at.slice(0, 10) : "");
  };
  const saveEdit = async (r: Scraped) => {
    await updateRow(r.id, {
      notes: draftNotes,
      follow_up_at: draftFollowUp ? new Date(draftFollowUp).toISOString() : null,
    });
    setEditing(null);
  };

  const deleteRow = async (row: Scraped) => {
    if (!confirm(`Delete ${row.trade_name}?`)) return;
    const { error } = await supabase.from("scraped_trades").delete().eq("id", row.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  const pipelineRows = useMemo(
    () => rows.filter((r) => (r.pipeline ?? "trade") === pipeline),
    [rows, pipeline],
  );

  const tradeTypes = Array.from(new Set(pipelineRows.map((r) => r.trade_type).filter(Boolean))) as string[];

  const filtered = useMemo(() => pipelineRows.filter((r) => {
    if (filterType !== "all" && r.trade_type !== filterType) return false;
    if (pipeline === "website") {
      const wf = WEB_FILTERS.find((f) => f.value === webFilter);
      if (wf && !wf.match(r)) return false;
    } else if (filterStage !== "all" && r.outreach_stage !== filterStage) return false;
    if (hideContacted && r.contacted) return false;
    if (filter) {
      const s = filter.toLowerCase();
      return (
        r.trade_name.toLowerCase().includes(s) ||
        (r.address ?? "").toLowerCase().includes(s) ||
        (r.phone ?? "").toLowerCase().includes(s) ||
        (r.notes ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  }), [pipelineRows, filter, filterType, filterStage, webFilter, pipeline, hideContacted]);

  // In the website pipeline, surface the strongest opportunities first.
  const sorted = useMemo(() => {
    if (pipeline !== "website") return filtered;
    return [...filtered].sort((a, b) => webScore(b) - webScore(a));
  }, [filtered, pipeline]);


  const counts = useMemo(() => {
    const c: Record<string, number> = { all: pipelineRows.length };
    for (const s of STAGES) if (s.value !== "all") c[s.value] = 0;
    for (const r of pipelineRows) c[r.outreach_stage] = (c[r.outreach_stage] ?? 0) + 1;
    return c;
  }, [pipelineRows]);

  const webCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of WEB_FILTERS) c[f.value] = pipelineRows.filter(f.match).length;
    return c;
  }, [pipelineRows]);



  const pipelineCounts = useMemo(() => {
    let trade = 0, website = 0;
    for (const r of rows) ((r.pipeline ?? "trade") === "website" ? (website++) : (trade++));
    return { trade, website };
  }, [rows]);


  const exportCsv = () => {
    if (!filtered.length) return;
    const isWeb = pipeline === "website";
    const header = isWeb
      ? ["Business name","Type","Phone","Email","Website","Website quality","Audit sent","Proposal sent","Address","Postcode","City","Rating","Reviews","Stage","Interested","Follow-up","Last contacted","Notes"]
      : ["Trade name","Type","Phone","Email","Website","Address","Postcode","City","Rating","Reviews","Stage","Interested","Follow-up","Last contacted","Notes"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      const cells = (isWeb
        ? [
            r.trade_name, r.trade_type ?? "", r.phone ?? "", r.email ?? "",
            r.website ?? "", webQualityMeta(r.website_quality)?.label ?? "",
            r.mini_audit_sent ? "yes" : "no", r.proposal_sent ? "yes" : "no",
            r.address ?? "", r.postcode ?? "", r.city ?? "",
            r.rating?.toString() ?? "", r.reviews_count?.toString() ?? "",
            r.outreach_stage,
            r.interested == null ? "" : r.interested ? "yes" : "no",
            r.follow_up_at ?? "", r.last_contacted_at ?? "", r.notes ?? "",
          ]
        : [
            r.trade_name, r.trade_type ?? "", r.phone ?? "", r.email ?? "",
            r.website ?? "", r.address ?? "", r.postcode ?? "", r.city ?? "",
            r.rating?.toString() ?? "", r.reviews_count?.toString() ?? "",
            r.outreach_stage,
            r.interested == null ? "" : r.interested ? "yes" : "no",
            r.follow_up_at ?? "", r.last_contacted_at ?? "", r.notes ?? "",
          ]
      ).map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isWeb ? "website-outreach" : "trades"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div style={{ minHeight: "100vh", background: C.deep, fontFamily: "system-ui, sans-serif", color: C.bright, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="font-heading tracking-wider" style={{ fontSize: 22, fontWeight: 700 }}>
            <Logo variant="light" className="h-9 w-auto inline-block" />
            <span style={{ color: C.dim, fontSize: 12, marginLeft: 12 }}>
              {pipeline === "website" ? "WEBSITE OUTREACH PIPELINE" : "TRADE OUTREACH PIPELINE"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.dim, margin: "4px 0 0" }}>
            {pipeline === "website"
              ? "Find local businesses with weak or missing websites, log calls, send mini-audits and proposals. Admin only."
              : "Scrape local trades, track outreach, log follow-ups. Admin only."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/admin/planning-pipeline" style={{ ...btn(false), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            ← Planning pipeline
          </Link>
          <button onClick={exportCsv} disabled={!filtered.length} style={{ ...btn(false), opacity: filtered.length ? 1 : 0.4 }}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Pipeline tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {([
          { value: "trade" as Pipeline, label: "🔧 Trade Outreach", count: pipelineCounts.trade },
          { value: "website" as Pipeline, label: "🌐 Website Outreach", count: pipelineCounts.website },
        ]).map((t) => {
          const active = pipeline === t.value;
          return (
            <button
              key={t.value}
              onClick={() => { setPipeline(t.value); setFilterStage("all"); setFilterType("all"); setEditing(null); }}
              style={{
                background: active ? C.teal : "rgba(255,255,255,0.04)",
                color: active ? "#fff" : C.bright,
                border: `1px solid ${active ? C.teal : C.border}`,
                borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              {t.label}
              <span style={{
                background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                borderRadius: 999, padding: "1px 8px", fontSize: 11,
              }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
          {pipeline === "website" ? "Find businesses (website prospects)" : "New scrape"}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: pipeline === "website" ? "2fr 2fr 1fr" : "2fr 2fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>
              {pipeline === "website" ? "Business type" : "Trade type"}
            </label>
            <input
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value)}
              placeholder={pipeline === "website"
                ? "landscapers, builders, electricians, cafes, dog groomers, salons, mechanics, takeaways, cleaners"
                : "electricians"}
              style={inp}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Nottingham, Mansfield, Sutton-in-Ashfield, Derby, Sheffield"
              style={inp}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>Limit (max 20)</label>
            <input type="number" min={1} max={20} value={limit} onChange={(e) => setLimit(Math.min(20, parseInt(e.target.value, 10) || 10))} style={inp} />
          </div>
          {pipeline !== "website" && (
            <button onClick={runScrape} disabled={running} style={{ ...btn(true), opacity: running ? 0.6 : 1 }}>
              {running ? "Scraping…" : "🔎 Run scrape"}
            </button>
          )}
        </div>
        {pipeline === "website" && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr auto", gap: 10, alignItems: "end", marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>Website opportunity focus</label>
              <select value={webFocus} onChange={(e) => setWebFocus(e.target.value as WebFocus)} style={inp}>
                {WEB_FOCUS.map((f) => (
                  <option key={f.value} value={f.value} style={{ color: "#000" }}>{f.label}</option>
                ))}
              </select>
            </div>
            <button onClick={runScrape} disabled={running} style={{ ...btn(true), opacity: running ? 0.6 : 1 }}>
              {running ? "Scraping…" : "🔎 Run website scrape"}
            </button>
          </div>
        )}
        <p style={{ fontSize: 10, color: C.dim, margin: "10px 0 0" }}>
          Re-running the same search won't create duplicates — existing leads are refreshed and your stage/notes are preserved.
        </p>
      </div>


      {/* Stage chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {pipeline === "website"
          ? WEB_FILTERS.map((s) => {
              const active = webFilter === s.value;
              return (
                <button key={s.value} onClick={() => setWebFilter(s.value)} style={{
                  background: active ? s.color : "transparent",
                  color: active ? "#fff" : s.color,
                  border: `1px solid ${s.color}`,
                  borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>
                  {s.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{webCounts[s.value] ?? 0}</span>
                </button>
              );
            })
          : STAGES.map((s) => {
              const active = filterStage === s.value;
              return (
                <button key={s.value} onClick={() => setFilterStage(s.value)} style={{
                  background: active ? s.color : "transparent",
                  color: active ? "#fff" : s.color,
                  border: `1px solid ${s.color}`,
                  borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>
                  {s.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts[s.value] ?? 0}</span>
                </button>
              );
            })}
      </div>


      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search name, address, phone, notes…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...inp, maxWidth: 320 }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inp, maxWidth: 200 }}>
          <option value="all" style={{ color: "#000" }}>All trade types</option>
          {tradeTypes.map((t) => <option key={t} value={t} style={{ color: "#000" }}>{t}</option>)}
        </select>
        <button
          onClick={() => setFilterStage((prev) => (prev === "no_answer" ? "all" : "no_answer"))}
          style={{
            background: filterStage === "no_answer" ? "#0EA5E9" : "transparent",
            color: filterStage === "no_answer" ? "#fff" : "#0EA5E9",
            border: "1px solid #0EA5E9",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>📞</span>
          No answer only {counts["no_answer"] ? `(${counts["no_answer"]})` : ""}
        </button>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.dim, cursor: "pointer" }}>
          <input type="checkbox" checked={hideContacted} onChange={(e) => setHideContacted(e.target.checked)} />
          Hide already-contacted
        </label>
        <span style={{ color: C.dim, fontSize: 12, marginLeft: "auto" }}>
          {filtered.length} of {pipelineRows.length}
        </span>

      </div>

      {loading ? (
        <div style={{ color: C.dim, padding: 40, textAlign: "center" }}>Loading…</div>
      ) : (
        <div style={{ overflowX: "auto", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ background: "rgba(255,255,255,0.04)" }}>
              <tr style={{ textAlign: "left", color: C.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "10px 12px" }}>{pipeline === "website" ? "Business" : "Trade"}</th>
                <th style={{ padding: "10px 12px" }}>Contact</th>
                <th style={{ padding: "10px 12px" }}>Location</th>
                <th style={{ padding: "10px 12px" }}>Rating</th>
                {pipeline === "website" && <th style={{ padding: "10px 12px" }}>Website status</th>}
                {pipeline === "website" && <th style={{ padding: "10px 12px" }}>Website score</th>}
                <th style={{ padding: "10px 12px" }}>Stage</th>
                <th style={{ padding: "10px 12px" }}>Follow-up</th>
                <th style={{ padding: "10px 12px" }}>Notes</th>
                <th style={{ padding: "10px 12px" }}>Actions</th>
              </tr>

            </thead>
            <tbody>
              {sorted.map((r) => {
                const m = stageMeta(r.outreach_stage);
                const isEditing = editing === r.id;
                const isExpanded = expanded === r.id;
                return (
                  <React.Fragment key={r.id}>
                  <tr style={{ borderTop: `1px solid ${C.border}`, verticalAlign: "top" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{r.trade_name}</div>
                      <div style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>{r.trade_type ?? "—"}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {r.phone && <div><a href={`tel:${r.phone}`} style={{ color: C.teal }}>{r.phone}</a></div>}
                      {r.email && <div><a href={`mailto:${r.email}`} style={{ color: C.teal }}>{r.email}</a></div>}
                      {r.website && <div><a href={r.website} target="_blank" rel="noreferrer" style={{ color: C.green }}>website ↗</a></div>}
                      {!r.phone && !r.email && !r.website && <span style={{ color: C.dim }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 12px", color: C.dim, maxWidth: 200 }}>
                      {[r.city, r.postcode].filter(Boolean).join(" · ") || r.address || "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {r.rating != null ? `${r.rating} (${r.reviews_count ?? 0})` : "—"}
                    </td>
                    {pipeline === "website" && (
                      <td style={{ padding: "10px 12px", minWidth: 170 }}>
                        <select
                          value={r.website_status ?? "Not checked"}
                          onChange={(e) => setWebsiteStatus(r, e.target.value)}
                          style={{ ...inp, padding: "5px 8px", fontSize: 11, fontWeight: 700, width: "auto" }}
                        >
                          {WEBSITE_STATUS_OPTIONS.map((o) => (
                            <option key={o} value={o} style={{ color: "#000" }}>{o}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    {pipeline === "website" && (() => {
                      const sc = r.website_score ?? webScore(r);
                      const band = scoreBand(sc);
                      return (
                        <td style={{ padding: "10px 12px" }}>
                          <div
                            title={`${band.label} opportunity`}
                            style={{
                              display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2,
                              background: "rgba(255,255,255,0.04)", border: `1px solid ${band.color}`,
                              borderRadius: 10, padding: "6px 10px", minWidth: 56,
                            }}
                          >
                            <span style={{ fontSize: 16, fontWeight: 800, color: band.color, lineHeight: 1 }}>{sc}</span>
                            <span style={{ fontSize: 8, color: band.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {band.label}
                            </span>
                          </div>
                        </td>
                      );
                    })()}
                    <td style={{ padding: "10px 12px", minWidth: 160 }}>
                      <select
                        value={r.outreach_stage}
                        onChange={(e) => setStage(r, e.target.value as Stage)}
                        style={{
                          ...inp, padding: "5px 8px", fontSize: 11, fontWeight: 700,
                          borderColor: m.color, color: m.color, width: "auto",
                        }}
                      >
                        {STAGES.filter((s) => s.value !== "all").map((s) => (
                          <option key={s.value} value={s.value} style={{ color: "#000" }}>{s.label}</option>
                        ))}
                      </select>
                      {r.last_contacted_at && (
                        <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>
                          last: {new Date(r.last_contacted_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing ? (
                        <input type="date" value={draftFollowUp} onChange={(e) => setDraftFollowUp(e.target.value)} style={{ ...inp, padding: "5px 8px", fontSize: 11 }} />
                      ) : r.follow_up_at ? (
                        <span style={{ color: new Date(r.follow_up_at) < new Date() ? C.red : C.amber, fontWeight: 600 }}>
                          {new Date(r.follow_up_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ color: C.dim }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", maxWidth: 220 }}>
                      {isEditing ? (
                        <textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} rows={3} style={{ ...inp, fontSize: 11 }} />
                      ) : (
                        <div
                          onClick={() => beginEdit(r)}
                          title={r.notes || "Click to add or edit a note"}
                          style={{
                            color: r.notes ? C.bright : C.dim, fontSize: 11, cursor: "pointer", minHeight: 18,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                            overflow: "hidden", textOverflow: "ellipsis",
                          }}
                        >
                          {r.notes || "✎ Add note…"}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(r)} style={{ ...btn(true), padding: "5px 10px", fontSize: 10, marginRight: 4 }}>Save</button>
                          <button onClick={() => setEditing(null)} style={{ background: "transparent", color: C.dim, border: "none", cursor: "pointer", fontSize: 11 }}>Cancel</button>
                        </>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 220 }}>
                          <button onClick={() => beginEdit(r)} style={{ ...btn(false), padding: "5px 10px", fontSize: 10 }}>Edit</button>
                          {pipeline === "website" && (
                            <>
                              <button onClick={() => setModal({ title: `Call script — ${r.trade_name}`, text: buildCallScript(r) })} style={{ ...btn(false), padding: "5px 10px", fontSize: 10 }}>Call script</button>
                              <button onClick={() => setModal({ title: `Website audit — ${r.trade_name}`, text: buildAuditText(r) })} style={{ ...btn(false), padding: "5px 10px", fontSize: 10 }}>Build audit</button>
                              <button
                                onClick={() => toggleAudit(r)}
                                style={{
                                  background: r.mini_audit_sent ? C.green : "transparent",
                                  color: r.mini_audit_sent ? "#fff" : C.green,
                                  border: `1px solid ${C.green}`, borderRadius: 8,
                                  padding: "5px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                {r.mini_audit_sent ? "✓ Audit sent" : "Mark audit sent"}
                              </button>
                              <button
                                onClick={() => toggleProposal(r)}
                                style={{
                                  background: r.proposal_sent ? "#7c3aed" : "transparent",
                                  color: r.proposal_sent ? "#fff" : "#a78bfa",
                                  border: "1px solid #7c3aed", borderRadius: 8,
                                  padding: "5px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                {r.proposal_sent ? "✓ Proposal" : "Proposal"}
                              </button>
                              <button onClick={() => setExpanded(isExpanded ? null : r.id)} style={{ ...btn(false), padding: "5px 10px", fontSize: 10 }}>
                                {isExpanded ? "Close ▲" : "Details ▾"}
                              </button>
                            </>
                          )}
                          <button onClick={() => deleteRow(r)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 11 }}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {isExpanded && pipeline === "website" && (
                    <WebLeadDetails
                      row={r}
                      colSpan={10}
                      onSave={async (patch) => {
                        await updateRow(r.id, patch);
                        toast({ title: "Details saved" });
                      }}
                    />
                  )}
                  </React.Fragment>
                );
              })}
              {!filtered.length && (
                <tr><td colSpan={pipeline === "website" ? 10 : 8} style={{ padding: 40, textAlign: "center", color: C.dim }}>
                  {pipeline === "website"
                    ? "No website prospects match. Try a different filter or run a search above."
                    : "No trades match. Try a different filter or run a scrape above."}
                </td></tr>

              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
              width: "min(640px, 100%)", maxHeight: "85vh", display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ color: C.bright }}>{modal.title}</strong>
              <button onClick={() => setModal(null)} style={{ background: "transparent", color: C.dim, border: "none", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <pre style={{ margin: 0, padding: 18, overflow: "auto", whiteSpace: "pre-wrap", fontSize: 13, color: C.bright, fontFamily: "inherit" }}>
              {modal.text}
            </pre>
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => copyToClipboard(modal.text)} style={{ ...btn(true), padding: "7px 14px", fontSize: 12 }}>Copy</button>
              <button onClick={() => setModal(null)} style={{ ...btn(false), padding: "7px 14px", fontSize: 12 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
