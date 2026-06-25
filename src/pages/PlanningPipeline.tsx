import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const C = {
  cream: "#F5F0E8", deep: "#0F2238", navy: "#27396A",
  teal: "#14A8A1", tealHover: "#14B8A8", tealLight: "#CCFBF1",
  body: "#1F2937", secondary: "#4B5563", border: "#D1CBB8", white: "#FFFFFF",
  amber: "#D97706", amberBg: "#FFFBEB", amberBorder: "#FDE68A",
  green: "#16A34A", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  red: "#DC2626", redBg: "#FEF2F2", redBorder: "#FECACA",
  purple: "#7C3AED", purpleBg: "#F5F3FF", purpleBorder: "#DDD6FE",
  darkSurface: "#152C45", darkCard: "#27396A",
  darkBorder: "rgba(245,240,232,0.1)", dimText: "rgba(245,240,232,0.5)",
  brightText: "#F5F0E8",
};

type Agent = {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  relationship_status: string;
  intro_sent: boolean;
  meeting_held: boolean;
  councils_active: string[] | null;
  avg_job_value_estimate: number | null;
  notes: string | null;
};

type Lead = {
  id: string;
  application_ref: string;
  council_name: string;
  site_address: string;
  postcode: string | null;
  application_type: string | null;
  status: string;
  description: string | null;
  submitted_date: string | null;
  applicant_name: string | null;
  applicant_address: string | null;
  applicant_contact: string | null;
  agent_id: string | null;
  agent_name: string | null;
  agent_address: string | null;
  agent_contact: string | null;
  proposal_type: string | null;
  trades_likely: string[] | null;
  estimated_value_min: number | null;
  estimated_value_max: number | null;
  priority_score: number;
  pipeline_status: string;
  documents_available: boolean;
  form1app_extracted: boolean;
  council_application_url: string | null;
  pdf_source_url: string | null;
  pdf_enriched_at: string | null;
  notes: string | null;
  next_action: string | null;
  agent_contacted: boolean;
  agent_contacted_at: string | null;
  agent_contact_methods: string[] | null;
  homeowner_contacted: boolean;
  homeowner_contacted_at: string | null;
  homeowner_contact_methods: string[] | null;
  homeowner_interested: "yes" | "no" | "unknown" | null;
  outreach_status: string | null;
  letter_sent_at: string | null;
};

const CONTACT_METHODS = [
  { id: "call", label: "📞 Call" },
  { id: "email", label: "✉️ Email" },
  { id: "letter", label: "📬 Letter" },
  { id: "visit", label: "🚶 In person" },
];

const PIPELINE_STAGES = [
  { id: "new", label: "New lead", color: C.purple },
  { id: "letter_sent", label: "Letter sent", color: C.amber },
  { id: "contacted_agent", label: "Agent contacted", color: C.teal },
  { id: "call_made", label: "Call made", color: C.teal },
  { id: "meeting_booked", label: "Meeting booked", color: C.navy },
  { id: "quote_posted", label: "Quote posted", color: C.navy },
  { id: "job_won", label: "Job won", color: C.green },
  { id: "not_interested", label: "Not interested / Cold", color: C.secondary },
  // Legacy aliases — render so older rows still display correctly
  { id: "contacted_homeowner", label: "Homeowner contacted", color: C.amber },
  { id: "brief_posted", label: "Brief posted", color: C.navy },
  { id: "converted", label: "Converted", color: C.green },
  { id: "not_suitable", label: "Not suitable", color: C.secondary },
];

const SCORE_TOOLTIP =
  "Score factors: project value (40%) · recency, days since submission (30%) · " +
  "trades required, breadth of work (20%) · agent relationship status (10%). " +
  "Scores 75+ are flagged red as hot leads.";

const isOverdue = (status: string, days: number) =>
  (status === "new" && days > 14) || (status === "contacted_agent" && days > 30);

const isNonDomestic = (l: { application_type: string | null; description: string | null }) => {
  const t = `${l.application_type ?? ""} ${l.description ?? ""}`.toLowerCase();
  return /class\s*q|barn conversion|agricultural|change of use/.test(t)
    || (l.application_type ?? "").toLowerCase() === "full";
};

const AGENT_STATUS: Record<string, { label: string; bg: string; border: string; text: string }> = {
  identified: { label: "Identified", bg: C.purpleBg, border: C.purpleBorder, text: C.purple },
  contacted: { label: "Contacted", bg: C.amberBg, border: C.amberBorder, text: C.amber },
  interested: { label: "Interested", bg: C.tealLight, border: "#99F6E4", text: C.teal },
  partner: { label: "Partner", bg: C.greenBg, border: C.greenBorder, text: C.green },
  not_interested: { label: "Not interested", bg: "#F3F4F6", border: C.border, text: C.secondary },
};

const fmt = (n: number | null | undefined) => (n ? `£${Number(n).toLocaleString("en-GB")}` : "—");
const daysSince = (dateStr: string | null) => {
  if (!dateStr) return 0;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
};

// ---- Auto next-action (PART 1) ----
// Computes a suggested next action from existing data. Never overrides a human-set next_action.
const suggestedNextAction = (lead: Lead, agent?: Agent): string | null => {
  const os = lead.outreach_status || "not_contacted";
  const firm = agent?.company_name || agent?.contact_name || lead.agent_name || "agent";
  if (lead.agent_id && (os === "not_contacted" || os === "no_next_action")) {
    return `Email agent — ${firm}`;
  }
  if (!lead.agent_id && lead.applicant_address && os === "not_contacted") {
    return `Send letter to homeowner — ${lead.applicant_address}`;
  }
  if (!lead.agent_id && !lead.applicant_address) {
    return "Skip — insufficient contact data";
  }
  if (os === "letter_sent" && lead.letter_sent_at && daysSince(lead.letter_sent_at) > 14) {
    return `Follow up letter — sent ${daysSince(lead.letter_sent_at)}d ago`;
  }
  return null;
};

// ---- Value bands + sort (PART 2) ----
const VALUE_BANDS = [
  { id: "all", label: "All", min: 0 },
  { id: "40k", label: "£40k+", min: 40000 },
  { id: "80k", label: "£80k+", min: 80000 },
  { id: "150k", label: "£150k+", min: 150000 },
];
const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "value_desc", label: "Value (high to low)" },
  { id: "value_asc", label: "Value (low to high)" },
  { id: "deadline", label: "Closest deadline" },
];
const LS_BAND = "pp_value_band";
const LS_SORT = "pp_sort";

// ---- Homeowner search launchers (PART 3) ----
// Best-effort town extraction from a free-text site address (last comma segment, postcode stripped).
const guessTown = (lead: Lead): string => {
  const parts = (lead.site_address || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const pc = (lead.postcode || "").trim();
  let last = parts[parts.length - 1] || "";
  if (pc && last.toUpperCase().includes(pc.toUpperCase()) && parts.length >= 2) {
    last = parts[parts.length - 2];
  }
  // strip any embedded postcode-looking token from the town string
  return last.replace(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/gi, "").trim();
};

const inp = (): CSSProperties => ({
  width: "100%", padding: "8px 10px", borderRadius: 7,
  border: `1px solid ${C.darkBorder}`, background: "rgba(255,255,255,0.05)",
  color: C.brightText, fontSize: 12, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box",
});

const SBadge = ({ status }: { status: string }) => {
  const stage = PIPELINE_STAGES.find((s) => s.id === status);
  if (!stage) return null;
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 700,
      color: stage.color, background: `${stage.color}22`,
      border: `1px solid ${stage.color}55`,
      borderRadius: 20, padding: "2px 8px", letterSpacing: "0.04em",
    }}>{stage.label}</span>
  );
};

const PriorityBar = ({ score }: { score: number }) => {
  const c = score >= 75 ? C.red : score >= 50 ? C.amber : C.teal;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }} title={SCORE_TOOLTIP}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: c }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: c, minWidth: 26, textAlign: "right", cursor: "help" }}>
        {score} ⓘ
      </span>
    </div>
  );
};

const LeadCard = ({ lead, onSelect, selected, agent, onSkip }: {
  lead: Lead; onSelect: (l: Lead) => void; selected: boolean; agent?: Agent;
  onSkip: (l: Lead, skip: boolean) => void;
}) => {
  const days = daysSince(lead.submitted_date);
  const overdue = isOverdue(lead.pipeline_status, days);
  const manual = (lead.next_action || "").trim();
  const suggested = manual ? null : suggestedNextAction(lead, agent);
  const nonDomestic = isNonDomestic(lead);
  const skipped = lead.outreach_status === "skipped";
  return (
    <div onClick={() => onSelect(lead)}
      style={{
        background: selected ? C.darkCard : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? C.teal : C.darkBorder}`,
        borderRadius: 10, padding: "10px 14px", cursor: "pointer",
        marginBottom: 6, transition: "all 0.15s", opacity: skipped ? 0.6 : 1,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.brightText, margin: "0 0 2px", lineHeight: 1.3 }}>
            {lead.site_address}
          </p>
          <p style={{ fontSize: 10, color: C.dimText, margin: 0 }}>
            {lead.council_name} · {lead.application_ref}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.teal, margin: 0 }}>
            {fmt(lead.estimated_value_max)}
          </p>
          <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>{days}d ago</p>
        </div>
      </div>
      <div style={{ marginBottom: 6 }}>
        <PriorityBar score={lead.priority_score} />
      </div>
      {(overdue || nonDomestic) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {overdue && (
            <span style={{ fontSize: 9, fontWeight: 700, color: C.amber,
              background: "rgba(217,119,6,0.18)", border: `1px solid ${C.amberBorder}`,
              borderRadius: 4, padding: "1px 6px", letterSpacing: "0.04em" }}>
              ⚠ FOLLOW-UP OVERDUE
            </span>
          )}
          {nonDomestic && (
            <span style={{ fontSize: 9, fontWeight: 700, color: C.purple,
              background: "rgba(124,58,237,0.18)", border: `1px solid ${C.purpleBorder}`,
              borderRadius: 4, padding: "1px 6px", letterSpacing: "0.04em" }}>
              ⚠ NON-DOMESTIC
            </span>
          )}
        </div>
      )}
      {/* Next action — always shown: manual in white, or suggested in teal with an 'auto' tag */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: C.dimText, flexShrink: 0 }}>▸</span>
        <span style={{
          fontSize: 10, fontWeight: 600, lineHeight: 1.3,
          color: manual ? C.brightText : C.teal,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {manual || suggested || "No suggestion"}
        </span>
        {!manual && suggested && (
          <span style={{ fontSize: 8, fontWeight: 700, color: C.teal, background: "rgba(13,148,136,0.18)",
            border: `1px solid rgba(13,148,136,0.4)`, borderRadius: 4, padding: "0 5px", letterSpacing: "0.06em", flexShrink: 0 }}>
            AUTO
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <SBadge status={lead.pipeline_status} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: C.dimText, textAlign: "right" }}>
            {agent ? `🏛️ ${agent.company_name || agent.contact_name}` : "No agent"}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onSkip(lead, !skipped); }}
            title={skipped ? "Restore this lead" : "Skip this lead (reversible)"}
            style={{ background: "transparent", border: `1px solid ${C.darkBorder}`, color: skipped ? C.teal : C.dimText,
              borderRadius: 5, padding: "1px 7px", fontSize: 9, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            {skipped ? "↺ Restore" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
};

const LeadDetail = ({ lead, agent, onSaved, onSkip }: { lead: Lead; agent?: Agent; onSaved: () => void; onSkip: (l: Lead, skip: boolean) => void }) => {
  const [notes, setNotes] = useState(lead.notes || "");
  const [nextAction, setNextAction] = useState(lead.next_action || "");
  const [pipelineStatus, setPipelineStatus] = useState(lead.pipeline_status);
  const [agentContacted, setAgentContacted] = useState(lead.agent_contacted ?? false);
  const [agentMethods, setAgentMethods] = useState<string[]>(lead.agent_contact_methods ?? []);
  const [homeownerContacted, setHomeownerContacted] = useState(lead.homeowner_contacted ?? false);
  const [homeownerMethods, setHomeownerMethods] = useState<string[]>(lead.homeowner_contact_methods ?? []);
  const [homeownerInterested, setHomeownerInterested] = useState<string>(lead.homeowner_interested ?? "unknown");
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [councilUrl, setCouncilUrl] = useState(lead.council_application_url || "");
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    setNotes(lead.notes || "");
    setNextAction(lead.next_action || "");
    setPipelineStatus(lead.pipeline_status);
    setAgentContacted(lead.agent_contacted ?? false);
    setAgentMethods(lead.agent_contact_methods ?? []);
    setHomeownerContacted(lead.homeowner_contacted ?? false);
    setHomeownerMethods(lead.homeowner_contact_methods ?? []);
    setHomeownerInterested(lead.homeowner_interested ?? "unknown");
    setCouncilUrl(lead.council_application_url || "");
  }, [lead.id]);

  const saveCouncilUrl = async () => {
    const trimmed = councilUrl.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      toast({ title: "Invalid URL", description: "Must start with http:// or https://", variant: "destructive" });
      return;
    }
    setSavingUrl(true);
    const { error } = await supabase
      .from("planning_leads")
      .update({ council_application_url: trimmed || null } as never)
      .eq("id", lead.id);
    setSavingUrl(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Council URL saved", description: "You can now read the PDF form." });
      onSaved();
    }
  };



  const toggleMethod = (current: string[], setter: (v: string[]) => void, m: string) => {
    setter(current.includes(m) ? current.filter((x) => x !== m) : [...current, m]);
  };

  const save = async () => {
    setSaving(true);
    const patch: Record<string, unknown> = {
      notes,
      next_action: nextAction,
      pipeline_status: pipelineStatus,
      agent_contacted: agentContacted,
      agent_contact_methods: agentMethods,
      homeowner_contacted: homeownerContacted,
      homeowner_contact_methods: homeownerMethods,
      homeowner_interested: homeownerInterested === "unknown" ? null : homeownerInterested,
    };
    if (agentContacted && !lead.agent_contacted_at) patch.agent_contacted_at = new Date().toISOString();
    if (homeownerContacted && !lead.homeowner_contacted_at) patch.homeowner_contacted_at = new Date().toISOString();

    const { error } = await supabase.from("planning_leads").update(patch as never).eq("id", lead.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead updated" });
      onSaved();
    }
  };

  const acceptSuggested = async (text: string) => {
    setNextAction(text);
    const { error } = await supabase
      .from("planning_leads")
      .update({ next_action: text } as never)
      .eq("id", lead.id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Next action set", description: text });
      onSaved();
    }
  };

  const enrichFromPdf = async () => {
    setEnriching(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("enrich-planning-lead-pdf", {
      body: { lead_id: lead.id },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    setEnriching(false);
    if (error) {
      // supabase.functions.invoke puts non-2xx response bodies in error.context, not data.
      let detail = error.message;
      try {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) detail = body.error;
        }
      } catch { /* keep generic message */ }
      toast({ title: "PDF enrich failed", description: detail, variant: "destructive" });
      return;
    }
    const r = data as { ok?: boolean; error?: string };
    if (r?.error) {
      toast({ title: "PDF enrich failed", description: r.error, variant: "destructive" });
    } else {
      toast({ title: "PDF read", description: "Applicant & agent details extracted." });
      onSaved();
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard?.writeText(email);
    toast({ title: "Copied" });
  };

  const ds = daysSince(lead.submitted_date);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px 20px", color: C.brightText }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.brightText, margin: "0 0 4px" }}>
              {lead.site_address}
            </h2>
            <p style={{ fontSize: 12, color: C.dimText, margin: "0 0 8px" }}>
              {lead.council_name} · {lead.application_ref} · {lead.application_type}
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <SBadge status={lead.pipeline_status} />
              <span style={{ fontSize: 11, color: C.dimText }}>
                {lead.status === "submitted" ? "🔥 Submitted" :
                  lead.status === "pending_decision" ? "⏳ Pending" : "✅ Approved"}
              </span>
              <span style={{ fontSize: 11, color: C.dimText }}>{ds} days ago</span>
            </div>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.teal, margin: 0 }}>{fmt(lead.estimated_value_max)}</p>
            <p style={{ fontSize: 10, color: C.dimText, margin: 0 }}>est. value</p>
            <button onClick={enrichFromPdf} disabled={enriching || !lead.council_application_url}
              title={lead.council_application_url ? "Read the official application form PDF and extract applicant + agent details" : "No council URL on file"}
              style={{ marginTop: 6, background: lead.pdf_enriched_at ? "rgba(13,148,136,0.18)" : C.teal, color: lead.pdf_enriched_at ? C.teal : C.white, border: lead.pdf_enriched_at ? `1px solid rgba(13,148,136,0.4)` : "none", borderRadius: 7, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: enriching ? "not-allowed" : "pointer", opacity: enriching || !lead.council_application_url ? 0.6 : 1, whiteSpace: "nowrap" }}>
              {enriching ? "Reading PDF…" : lead.pdf_enriched_at ? "🔁 Re-read PDF" : "📄 Read PDF form"}
            </button>
            {lead.proposal_type && (
              <span style={{ fontSize: 10, color: C.dimText, marginTop: 2 }}>{lead.proposal_type}</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ background: lead.council_application_url ? "rgba(255,255,255,0.04)" : "rgba(217,119,6,0.10)", border: lead.council_application_url ? "none" : `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: lead.council_application_url ? C.teal : C.amber, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
            🔗 Council application URL {lead.council_application_url ? "" : "(missing — paste to enable PDF read)"}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="url"
              value={councilUrl}
              onChange={(e) => setCouncilUrl(e.target.value)}
              placeholder="https://publicaccess.council.gov.uk/online-applications/..."
              style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: C.brightText }}
            />
            <button
              onClick={saveCouncilUrl}
              disabled={savingUrl || councilUrl.trim() === (lead.council_application_url || "")}
              style={{ background: C.teal, color: C.white, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: savingUrl ? "not-allowed" : "pointer", opacity: savingUrl || councilUrl.trim() === (lead.council_application_url || "") ? 0.5 : 1, whiteSpace: "nowrap" }}
            >
              {savingUrl ? "Saving…" : "Save"}
            </button>
          </div>
          {!lead.council_application_url && (
            <p style={{ fontSize: 10, color: C.dimText, margin: "6px 0 0" }}>
              Open the council's public access portal, find this application, copy the page URL and paste here. Then click "📄 Read PDF form" above.
            </p>
          )}
        </div>


        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Description</p>
          <p style={{ fontSize: 12, color: C.brightText, lineHeight: 1.6, margin: 0 }}>{lead.description}</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Trades required</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(lead.trades_likely || []).map((t) => (
              <span key={t} style={{ fontSize: 11, fontWeight: 600, background: "rgba(13,148,136,0.15)", color: C.teal, border: `1px solid rgba(13,148,136,0.3)`, borderRadius: 6, padding: "3px 8px" }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>🏠 Applicant (homeowner)</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.brightText, margin: "0 0 2px" }}>{lead.applicant_name || "Name not listed"}</p>
          {lead.applicant_address && <p style={{ fontSize: 11, color: C.dimText, margin: "0 0 4px" }}>{lead.applicant_address}</p>}
          {lead.applicant_contact && (
            <p style={{ fontSize: 11, color: C.teal, margin: "4px 0 0", fontWeight: 600 }}>📞 {lead.applicant_contact}
              <button onClick={() => copyEmail(lead.applicant_contact!)} style={{ marginLeft: 8, background: "rgba(13,148,136,0.2)", color: C.teal, border: `1px solid rgba(13,148,136,0.3)`, borderRadius: 5, padding: "2px 7px", fontSize: 10, cursor: "pointer" }}>Copy</button>
            </p>
          )}
          {!agent && !lead.agent_name && (
            <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(217,119,6,0.12)", border: `1px solid rgba(217,119,6,0.3)`, borderRadius: 7 }}>
              <p style={{ fontSize: 11, color: C.amber, margin: "0 0 8px" }}>⚠️ No agent listed — read the PDF form or contact homeowner directly</p>
              {/* PART 3 — homeowner search launchers (open-in-new-tab only; nothing is scraped or stored) */}
              <p style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Find homeowner contact:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(() => {
                  const town = guessTown(lead);
                  const pc = (lead.postcode || "").trim();
                  const links = [
                    {
                      label: "🔎 192.com search",
                      url: `https://www.192.com/people/search/?initial=&surname=&town=${encodeURIComponent(town)}&postcode=${encodeURIComponent(pc)}`,
                    },
                    {
                      label: "🏷️ Land Registry",
                      url: "https://search-property-information.service.gov.uk/",
                    },
                    {
                      label: "🌐 Google: occupier",
                      url: `https://www.google.com/search?q=${encodeURIComponent(`occupier of ${lead.site_address}`)}`,
                    },
                  ];
                  return links.map((l) => (
                    <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.06)", color: C.amber, border: `1px solid ${C.amberBorder}`, borderRadius: 6, padding: "5px 10px", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
                      {l.label} ↗
                    </a>
                  ));
                })()}
              </div>
              <p style={{ fontSize: 9, color: C.dimText, margin: "6px 0 0", lineHeight: 1.5 }}>
                Convenience launchers only — ProGrafter does not fetch or store anything from these services.
              </p>
            </div>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>🏛️ Agent / representative (contact first)</p>
          {agent ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.brightText, margin: "0 0 2px" }}>{agent.contact_name}</p>
              {agent.company_name && <p style={{ fontSize: 11, color: C.teal, margin: "0 0 2px" }}>{agent.company_name}</p>}
              {agent.address && <p style={{ fontSize: 11, color: C.dimText, margin: "0 0 8px" }}>{agent.address}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {agent.email && (
                  <a href={`mailto:${agent.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.teal, color: C.white, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>✉️ {agent.email}</a>
                )}
                {agent.email && (
                  <button onClick={() => copyEmail(agent.email!)} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(13,148,136,0.2)", color: C.teal, border: `1px solid rgba(13,148,136,0.3)`, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Copy</button>
                )}
              </div>
              {agent.phone && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(217,119,6,0.10)", border: `1px solid ${C.amberBorder}`, borderRadius: 7, fontSize: 11, color: C.amber }}>
                  ⚠ Phone on file ({agent.phone}) is unverified — planning portals rarely publish real phone numbers. Confirm via Companies House or the agent's own website before calling.
                </div>
              )}
            </>
          ) : lead.agent_name ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.brightText, margin: "0 0 2px" }}>{lead.agent_name}</p>
              {lead.agent_address && <p style={{ fontSize: 11, color: C.dimText, margin: "0 0 6px" }}>{lead.agent_address}</p>}
              {lead.agent_contact && (
                <p style={{ fontSize: 11, color: C.teal, margin: 0, fontWeight: 600 }}>📞 {lead.agent_contact}
                  <button onClick={() => copyEmail(lead.agent_contact!)} style={{ marginLeft: 8, background: "rgba(13,148,136,0.2)", color: C.teal, border: `1px solid rgba(13,148,136,0.3)`, borderRadius: 5, padding: "2px 7px", fontSize: 10, cursor: "pointer" }}>Copy</button>
                </p>
              )}
              <p style={{ fontSize: 10, color: C.dimText, marginTop: 6 }}>Extracted from official application form PDF.</p>
            </>
          ) : (
            <p style={{ fontSize: 11, color: C.dimText, margin: 0 }}>No agent listed. Click "Read PDF form" above to extract from the official application.</p>
          )}
          {lead.council_application_url && (
            <p style={{ fontSize: 10, marginTop: 8, marginBottom: 0 }}>
              <a href={lead.council_application_url} target="_blank" rel="noreferrer" style={{ color: C.teal, textDecoration: "underline" }}>↗ Open council planning page</a>
              {lead.pdf_source_url && (
                <> · <a href={lead.pdf_source_url} target="_blank" rel="noreferrer" style={{ color: C.teal, textDecoration: "underline" }}>↗ Open form PDF</a></>
              )}
            </p>
          )}
        </div>

        {/* OUTREACH TRACKING */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
            📞 Outreach tracking
          </p>

          {/* Agent contact */}
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.darkBorder}` }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.brightText, cursor: "pointer", marginBottom: 6 }}>
              <input type="checkbox" checked={agentContacted} onChange={(e) => setAgentContacted(e.target.checked)} />
              <span style={{ fontWeight: 600 }}>Agent contacted</span>
              {lead.agent_contacted_at && (
                <span style={{ fontSize: 10, color: C.dimText }}>· first {new Date(lead.agent_contacted_at).toLocaleDateString()}</span>
              )}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 22 }}>
              {CONTACT_METHODS.map((m) => {
                const on = agentMethods.includes(m.id);
                return (
                  <button key={m.id} type="button" onClick={() => toggleMethod(agentMethods, setAgentMethods, m.id)} style={{
                    background: on ? C.teal : "transparent", color: on ? C.white : C.dimText,
                    border: `1px solid ${on ? C.teal : C.darkBorder}`, borderRadius: 20, padding: "3px 10px",
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                  }}>{m.label}</button>
                );
              })}
            </div>
          </div>

          {/* Homeowner contact */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.brightText, cursor: "pointer", marginBottom: 6 }}>
              <input type="checkbox" checked={homeownerContacted} onChange={(e) => setHomeownerContacted(e.target.checked)} />
              <span style={{ fontWeight: 600 }}>🏠 Homeowner contacted directly</span>
              {lead.homeowner_contacted_at && (
                <span style={{ fontSize: 10, color: C.dimText }}>· first {new Date(lead.homeowner_contacted_at).toLocaleDateString()}</span>
              )}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 22, marginBottom: 8 }}>
              {CONTACT_METHODS.map((m) => {
                const on = homeownerMethods.includes(m.id);
                return (
                  <button key={m.id} type="button" onClick={() => toggleMethod(homeownerMethods, setHomeownerMethods, m.id)} style={{
                    background: on ? C.teal : "transparent", color: on ? C.white : C.dimText,
                    border: `1px solid ${on ? C.teal : C.darkBorder}`, borderRadius: 20, padding: "3px 10px",
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                  }}>{m.label}</button>
                );
              })}
            </div>
            <div style={{ paddingLeft: 22, display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
              <span style={{ color: C.dimText }}>Interested?</span>
              {(["yes", "no", "unknown"] as const).map((v) => {
                const on = homeownerInterested === v;
                const color = v === "yes" ? C.green : v === "no" ? C.red : C.dimText;
                return (
                  <button key={v} type="button" onClick={() => setHomeownerInterested(v)} style={{
                    background: on ? color : "transparent", color: on ? C.white : color,
                    border: `1px solid ${color}`, borderRadius: 20, padding: "3px 12px",
                    fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                  }}>{v}</button>
                );
              })}
            </div>
          </div>
        </div>


        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Pipeline status</p>
          <select value={pipelineStatus} onChange={(e) => setPipelineStatus(e.target.value)} style={{ ...inp(), marginBottom: 10 }}>
            {PIPELINE_STAGES.map((s) => <option key={s.id} value={s.id} style={{ color: C.body }}>{s.label}</option>)}
          </select>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Notes on this lead — conversations, outcomes…" style={{ ...inp(), resize: "vertical", marginBottom: 8 }} />
          {/* PART 1 — one-click accept of the system-suggested next action */}
          {(() => {
            const sug = suggestedNextAction(lead, agent);
            if (!sug) return null;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(13,148,136,0.10)", border: `1px solid rgba(13,148,136,0.3)`, borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: C.teal, background: "rgba(13,148,136,0.18)", border: `1px solid rgba(13,148,136,0.4)`, borderRadius: 4, padding: "1px 5px", letterSpacing: "0.06em", flexShrink: 0 }}>AUTO</span>
                <span style={{ fontSize: 11, color: C.teal, fontWeight: 600, flex: 1, lineHeight: 1.3 }}>{sug}</span>
                <button onClick={() => acceptSuggested(sug)} style={{ background: C.teal, color: C.white, border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Accept</button>
              </div>
            );
          })()}
          <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next action — e.g. 'Call agent back after 20 May'" style={{ ...inp(), marginBottom: 8 }} />
          <button onClick={save} disabled={saving} style={{ width: "100%", background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, marginBottom: 8 }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {/* PART 2 — reversible skip from the detail page */}
          <button onClick={() => onSkip(lead, lead.outreach_status !== "skipped")} style={{ width: "100%", background: "transparent", color: lead.outreach_status === "skipped" ? C.teal : C.dimText, border: `1px solid ${C.darkBorder}`, borderRadius: 8, padding: "8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {lead.outreach_status === "skipped" ? "↺ Restore this lead" : "Skip this lead"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AgentCard = ({ agent, onSelect, selected, leadCount }: { agent: Agent; onSelect: (a: Agent) => void; selected: boolean; leadCount: number }) => {
  const status = AGENT_STATUS[agent.relationship_status] || AGENT_STATUS.identified;
  return (
    <div onClick={() => onSelect(agent)}
      style={{
        background: selected ? C.darkCard : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? C.teal : C.darkBorder}`,
        borderRadius: 10, padding: "10px 14px", cursor: "pointer",
        marginBottom: 6, transition: "all 0.15s",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.brightText, margin: "0 0 1px" }}>{agent.contact_name}</p>
          <p style={{ fontSize: 10, color: C.teal, margin: 0 }}>{agent.company_name || "Independent"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, background: status.bg, color: status.text, border: `1px solid ${status.border}`, borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>{status.label}</span>
          <span title={`${leadCount} planning application${leadCount === 1 ? "" : "s"}`} style={{ fontSize: 10, fontWeight: 700, color: leadCount > 1 ? C.amber : C.dimText, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.darkBorder}`, borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>
            {leadCount} app{leadCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 10, color: C.dimText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(agent.councils_active || []).join(", ")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {agent.intro_sent && <span style={{ fontSize: 10, color: C.teal }}>✉️</span>}
          {agent.meeting_held && <span style={{ fontSize: 10, color: C.green }}>🤝</span>}
        </div>
      </div>
    </div>
  );
};

export default function PlanningPipeline() {
  const [tab, setTab] = useState<"leads" | "agents" | "kanban">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPipeline, setFilterPipeline] = useState("all");
  const [search, setSearch] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [valueBand, setValueBand] = useState<string>(() => localStorage.getItem(LS_BAND) || "40k");
  const [sortBy, setSortBy] = useState<string>(() => localStorage.getItem(LS_SORT) || "value_desc");
  const [showSkipped, setShowSkipped] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => { localStorage.setItem(LS_BAND, valueBand); }, [valueBand]);
  useEffect(() => { localStorage.setItem(LS_SORT, sortBy); }, [sortBy]);

  const load = async () => {
    setLoading(true);
    const [{ data: lData, error: lErr }, { data: aData, error: aErr }] = await Promise.all([
      supabase.from("planning_leads").select("*").order("priority_score", { ascending: false }),
      supabase.from("planning_agents").select("*").order("created_at", { ascending: false }),
    ]);
    if (lErr) toast({ title: "Failed to load leads", description: lErr.message, variant: "destructive" });
    if (aErr) toast({ title: "Failed to load agents", description: aErr.message, variant: "destructive" });
    setLeads((lData as Lead[]) || []);
    setAgents((aData as Agent[]) || []);
    setLoading(false);
  };

  const runIngest = async () => {
    setIngesting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("ingest-planning-leads", {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    setIngesting(false);
    if (error) {
      toast({ title: "Ingest failed", description: error.message, variant: "destructive" });
      return;
    }
    const r = data as { inserted?: number; fetched?: number; councils?: number };
    toast({
      title: "Planning ingest complete",
      description: `${r.inserted ?? 0} new Notts leads from ${r.councils ?? 0} councils (${r.fetched ?? 0} scanned)`,
    });
    load();
  };

  useEffect(() => { load(); }, []);

  const agentsById = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a])), [agents]);
  const leadsByAgent = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of leads) if (l.agent_id) m[l.agent_id] = (m[l.agent_id] ?? 0) + 1;
    return m;
  }, [leads]);
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0] || null;

  const bandMin = useMemo(() => VALUE_BANDS.find((b) => b.id === valueBand)?.min ?? 0, [valueBand]);

  const filteredLeads = useMemo(() => {
    const out = leads.filter((l) => {
      // Skipped leads are hidden from default views unless toggled on
      if (!showSkipped && l.outreach_status === "skipped") return false;
      if (bandMin > 0 && (Number(l.estimated_value_max) || 0) < bandMin) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterPipeline !== "all" && l.pipeline_status !== filterPipeline) return false;
      if (search) {
        const s = search.toLowerCase();
        const agent = l.agent_id ? agentsById[l.agent_id] : null;
        if (!l.site_address.toLowerCase().includes(s)
          && !(l.description || "").toLowerCase().includes(s)
          && !(agent?.contact_name || "").toLowerCase().includes(s)
          && !(l.applicant_name || "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
    const val = (l: Lead) => Number(l.estimated_value_max) || 0;
    const sub = (l: Lead) => (l.submitted_date ? new Date(l.submitted_date).getTime() : 0);
    out.sort((a, b) => {
      switch (sortBy) {
        case "value_asc": return val(a) - val(b);
        case "value_desc": return val(b) - val(a);
        case "newest": return sub(b) - sub(a);
        case "deadline": return sub(a) - sub(b); // oldest submission = closest decision deadline
        default: return 0;
      }
    });
    return out;
  }, [leads, filterStatus, filterPipeline, search, agentsById, bandMin, showSkipped, sortBy]);

  const skippedCount = useMemo(() => leads.filter((l) => l.outreach_status === "skipped").length, [leads]);

  const skipLead = async (l: Lead, skip: boolean) => {
    const { error } = await supabase
      .from("planning_leads")
      .update({ outreach_status: skip ? "skipped" : "not_contacted" } as never)
      .eq("id", l.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: skip ? "Lead skipped" : "Lead restored" });
      load();
    }
  };

  const hotLeads = leads.filter((l) => l.pipeline_status === "new" && daysSince(l.submitted_date) <= 14).length;
  const totalValue = leads.reduce((s, l) => s + (Number(l.estimated_value_max) || 0), 0);

  const updateAgentStatus = async (agent: Agent, status: string) => {
    const { error } = await supabase.from("planning_agents").update({ relationship_status: status }).eq("id", agent.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agent updated" });
      setSelectedAgent({ ...agent, relationship_status: status });
      load();
    }
  };

  const navTab = (id: typeof tab, label: string) => (
    <button onClick={() => setTab(id)} style={{
      padding: "10px 18px", borderRadius: 10, border: "none",
      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
      background: tab === id ? C.teal : "transparent",
      color: tab === id ? C.white : C.dimText,
    }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: isMobile ? "auto" : "100vh", fontFamily: "system-ui, sans-serif", background: C.deep, width: "100%", overflowX: "hidden" }}>
      <div style={{ background: C.deep, borderBottom: `1px solid ${C.darkBorder}`, padding: isMobile ? "10px 14px" : "0 20px", minHeight: 56, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? 10 : 0, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="font-heading tracking-wider" style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700 }}>
            <Logo variant="light" className="h-9 w-auto inline-block" />
          </div>
          <span style={{ color: C.darkBorder }}>|</span>
          <span style={{ fontSize: isMobile ? 10 : 12, color: C.dimText, fontWeight: 500, letterSpacing: "0.05em" }}>PLANNING PIPELINE</span>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 8 : 16, alignItems: "center", flexWrap: "wrap", justifyContent: isMobile ? "space-between" : "flex-end" }}>
          <div style={{ textAlign: "center", flex: isMobile ? "1 1 60px" : "none" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.red, margin: 0 }}>{hotLeads}</p>
            <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>HOT</p>
          </div>
          <div style={{ textAlign: "center", flex: isMobile ? "1 1 60px" : "none" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.brightText, margin: 0 }}>{leads.length}</p>
            <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>TOTAL</p>
            <p style={{ fontSize: 9, color: C.teal, margin: 0, fontWeight: 700 }}>({filteredLeads.length} visible)</p>
          </div>
          <div style={{ textAlign: "center", flex: isMobile ? "1 1 60px" : "none" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.teal, margin: 0 }}>{agents.length}</p>
            <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>AGENTS</p>
          </div>
          <div style={{ textAlign: "center", flex: isMobile ? "1 1 80px" : "none" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.green, margin: 0 }}>{fmt(totalValue)}</p>
            <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>VALUE</p>
          </div>
          <a href="/admin/trade-scraper"
            style={{ background: "transparent", color: C.teal, border: `1px solid ${C.teal}`, borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, textDecoration: "none", flex: isMobile ? "1 1 100%" : "none", textAlign: "center" }}>
            🛠 Trade scraper
          </a>
          <button onClick={runIngest} disabled={ingesting}
            style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: ingesting ? "not-allowed" : "pointer", opacity: ingesting ? 0.6 : 1, flex: isMobile ? "1 1 100%" : "none" }}>
            {ingesting ? "Ingesting…" : "🔄 Ingest Notts planning"}
          </button>
        </div>
      </div>

      <div style={{ background: C.darkSurface, borderBottom: `1px solid ${C.darkBorder}`, padding: isMobile ? "0 8px" : "0 20px", display: "flex", gap: 4, overflowX: "auto" }}>
        {navTab("leads", isMobile ? `📋 (${leads.length})` : `📋 Leads (${leads.length})`)}
        {navTab("agents", isMobile ? `🏛️ (${agents.length})` : `🏛️ Agents (${agents.length})`)}
        {navTab("kanban", isMobile ? "📊 Board" : "📊 Pipeline board")}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.dimText, padding: 40 }}>Loading…</div>
      ) : tab === "leads" ? (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: isMobile ? "visible" : "hidden" }}>
          {(!isMobile || !selectedLeadId) && (
            <div style={{ width: isMobile ? "100%" : 320, flexShrink: 0, borderRight: isMobile ? "none" : `1px solid ${C.darkBorder}`, borderBottom: isMobile ? `1px solid ${C.darkBorder}` : "none", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: 12, borderBottom: `1px solid ${C.darkBorder}` }}>
                {/* PART 2 — value band pills */}
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {VALUE_BANDS.map((b) => {
                    const on = valueBand === b.id;
                    return (
                      <button key={b.id} type="button" onClick={() => setValueBand(b.id)} style={{
                        background: on ? C.teal : "transparent", color: on ? C.white : C.dimText,
                        border: `1px solid ${on ? C.teal : C.darkBorder}`, borderRadius: 20,
                        padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>{b.label}</button>
                    );
                  })}
                </div>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search address, applicant, agent…" style={{ ...inp(), marginBottom: 8 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inp()}>
                    <option value="all" style={{ color: C.body }}>All statuses</option>
                    <option value="submitted" style={{ color: C.body }}>🔥 Submitted</option>
                    <option value="pending_decision" style={{ color: C.body }}>⏳ Pending</option>
                    <option value="approved" style={{ color: C.body }}>✅ Approved</option>
                  </select>
                  <select value={filterPipeline} onChange={(e) => setFilterPipeline(e.target.value)} style={inp()}>
                    <option value="all" style={{ color: C.body }}>All stages</option>
                    {PIPELINE_STAGES.map((s) => <option key={s.id} value={s.id} style={{ color: C.body }}>{s.label}</option>)}
                  </select>
                </div>
                {/* PART 2 — sort dropdown + show-skipped toggle */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...inp(), flex: 1 }}>
                    {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id} style={{ color: C.body }}>{s.label}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowSkipped((v) => !v)} title="Toggle skipped leads" style={{
                    background: showSkipped ? C.teal : "transparent", color: showSkipped ? C.white : C.dimText,
                    border: `1px solid ${showSkipped ? C.teal : C.darkBorder}`, borderRadius: 7,
                    padding: "8px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  }}>{showSkipped ? "Hide" : "Show"} skipped{skippedCount ? ` (${skippedCount})` : ""}</button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", maxHeight: isMobile ? "none" : undefined }}>
                {filteredLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} agent={lead.agent_id ? agentsById[lead.agent_id] : undefined}
                    selected={selectedLead?.id === lead.id} onSelect={(l) => setSelectedLeadId(l.id)} onSkip={skipLead} />
                ))}
                {filteredLeads.length === 0 && (
                  <p style={{ color: C.dimText, fontSize: 12, textAlign: "center", marginTop: 20 }}>No leads match your filters.</p>
                )}
              </div>
            </div>
          )}
          {(!isMobile || selectedLeadId) && (
            <div style={{ flex: 1, overflow: isMobile ? "visible" : "hidden", background: C.darkSurface }}>
              {isMobile && selectedLeadId && (
                <button onClick={() => setSelectedLeadId(null)} style={{ background: "transparent", border: "none", color: C.teal, padding: "12px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  ← Back to leads
                </button>
              )}
              {selectedLead ? (
                <LeadDetail lead={selectedLead} agent={selectedLead.agent_id ? agentsById[selectedLead.agent_id] : undefined} onSaved={load} onSkip={skipLead} />
              ) : (
                !isMobile && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.dimText, fontSize: 13 }}>Select a lead to review</div>
              )}
            </div>
          )}
        </div>
      ) : tab === "agents" ? (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: isMobile ? "visible" : "hidden" }}>
          {(!isMobile || !selectedAgent) && (
            <div style={{ width: isMobile ? "100%" : 300, flexShrink: 0, borderRight: isMobile ? "none" : `1px solid ${C.darkBorder}`, borderBottom: isMobile ? `1px solid ${C.darkBorder}` : "none", padding: 12, overflowY: "auto" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Agent network ({agents.length})</p>
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} selected={selectedAgent?.id === agent.id} onSelect={setSelectedAgent} leadCount={leadsByAgent[agent.id] ?? 0} />
              ))}
            </div>
          )}
          {(!isMobile || selectedAgent) && (
            <div style={{ flex: 1, padding: isMobile ? "12px 16px" : 20, overflowY: "auto", color: C.brightText }}>
              {isMobile && selectedAgent && (
                <button onClick={() => setSelectedAgent(null)} style={{ background: "transparent", border: "none", color: C.teal, padding: "0 0 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  ← Back to agents
                </button>
              )}
              {selectedAgent ? (
                <div>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-start", marginBottom: 20, gap: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.brightText, margin: "0 0 4px" }}>{selectedAgent.contact_name}</h2>
                      <p style={{ fontSize: 13, color: C.teal, margin: "0 0 8px" }}>{selectedAgent.company_name}</p>
                      {(() => {
                        const s = AGENT_STATUS[selectedAgent.relationship_status] || AGENT_STATUS.identified;
                        return <span style={{ fontSize: 11, fontWeight: 600, background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 10px" }}>{s.label}</span>;
                      })()}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {selectedAgent.phone && <a href={`tel:${selectedAgent.phone}`} style={{ background: C.teal, color: C.white, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>📞 Call</a>}
                      {selectedAgent.email && <a href={`mailto:${selectedAgent.email}`} style={{ background: "none", border: `1px solid ${C.teal}`, color: C.teal, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>✉️ Email</a>}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    {[
                      { label: "Email", value: selectedAgent.email },
                      { label: "Phone", value: selectedAgent.phone },
                      { label: "Address", value: selectedAgent.address },
                      { label: "Active councils", value: (selectedAgent.councils_active || []).join(", ") },
                      { label: "Avg job value", value: fmt(selectedAgent.avg_job_value_estimate) },
                    ].map((r) => r.value ? (
                      <div key={r.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                        <p style={{ fontSize: 10, color: C.dimText, margin: "0 0 2px" }}>{r.label}</p>
                        <p style={{ fontSize: 12, color: C.brightText, fontWeight: 500, margin: 0, wordBreak: "break-word" }}>{r.value}</p>
                      </div>
                    ) : null)}
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Notes & relationship log</p>
                    <p style={{ fontSize: 12, color: selectedAgent.notes ? C.brightText : C.dimText, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{selectedAgent.notes || "No notes yet."}</p>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["contacted", "interested", "partner", "not_interested"] as const).map((s) => (
                      <button key={s} onClick={() => updateAgentStatus(selectedAgent, s)}
                        style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${AGENT_STATUS[s].border}`, color: AGENT_STATUS[s].text, borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        Mark as {AGENT_STATUS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                !isMobile && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.dimText, fontSize: 13 }}>Select an agent to view their profile</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflowX: isMobile ? "visible" : "auto", padding: isMobile ? 12 : 16, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 10 }}>
          {PIPELINE_STAGES.filter((s) => s.id !== "not_suitable").map((stage) => {
            const stageLeads = leads.filter((l) => l.pipeline_status === stage.id);
            return (
              <div key={stage.id} style={{ width: isMobile ? "100%" : 220, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: stage.color, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage.label}</p>
                  <span style={{ fontSize: 11, color: C.dimText, background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "1px 8px" }}>{stageLeads.length}</span>
                </div>
                <div>
                  {stageLeads.map((lead) => (
                    <div key={lead.id} onClick={() => { setSelectedLeadId(lead.id); setTab("leads"); }}
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.darkBorder}`, borderRadius: 8, padding: "8px 10px", marginBottom: 6, cursor: "pointer" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.brightText, margin: "0 0 2px", lineHeight: 1.3 }}>{lead.site_address.split(",")[0]}</p>
                      <p style={{ fontSize: 10, color: C.teal, margin: "0 0 4px" }}>{fmt(lead.estimated_value_max)}</p>
                      <PriorityBar score={lead.priority_score} />
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <p style={{ fontSize: 11, color: C.dimText, fontStyle: "italic", margin: "4px 0" }}>No leads in this stage</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
