/**
 * Planning Pipeline — shared model helpers.
 * Pure functions only. No DB writes here; the page owns persistence.
 * Everything below reads EXISTING planning_leads columns plus the additive
 * outreach columns; nothing is fabricated.
 */

export type Agent = {
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

export type Lead = {
  id: string;
  application_ref: string;
  council_name: string;
  site_address: string;
  postcode: string | null;
  application_type: string | null;
  status: string;
  description: string | null;
  submitted_date: string | null;
  created_at?: string | null;
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
  // additive outreach columns
  reviewed_at: string | null;
  homeowner_letter_template: string | null;
  homeowner_last_contact_method: string | null;
  homeowner_last_contact_at: string | null;
  agent_last_contact_method: string | null;
  agent_last_contact_at: string | null;
  agent_outreach_status: string | null;
  response_state: string | null;
  response_at: string | null;
  outreach_campaign: string | null;
  letter_batch_status: string | null;
  letter_batch_added_at: string | null;
  letter_batch_sent_at: string | null;
};

export type LeadEvent = {
  id: string;
  lead_id: string;
  event_type: string;
  detail: string | null;
  template: string | null;
  created_at: string;
};

/* ---------- palette ---------- */
export const C = {
  deep: "#0F2238",
  surface: "#152C45",
  raised: "#1B3A5C",
  teal: "#0D9488",
  tealBright: "#14B8A6",
  amber: "#D97706",
  amberBright: "#F59E0B",
  red: "#DC2626",
  purple: "#8B5CF6",
  green: "#16A34A",
  cream: "#F5F0E8",
  dim: "rgba(245,240,232,0.52)",
  faint: "rgba(245,240,232,0.34)",
  line: "rgba(245,240,232,0.08)",
  white: "#FFFFFF",
};

/* ---------- formatting ---------- */
export const fmt = (n: number | null | undefined) =>
  n ? `£${Number(n).toLocaleString("en-GB")}` : "—";

export const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `£${Math.round(n / 1_000)}k`;
  return `£${n}`;
};

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const daysSince = (dateStr: string | null | undefined) => {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
};

/* ---------- outreach vocabulary ---------- */
export const CONTACT_METHODS = [
  { id: "letter", label: "Letter" },
  { id: "email", label: "Email" },
  { id: "call", label: "Call" },
  { id: "visit", label: "In person" },
] as const;

export const LETTER_TEMPLATES = ["A", "B", "C"] as const;

export const campaignFor = (template: string | null | undefined) =>
  template ? `planning_letter_${template}` : null;

export const RESPONSE_STATES: { id: string; label: string; tone: "teal" | "amber" | "grey" | "purple" | "red" }[] = [
  { id: "no_response", label: "No response yet", tone: "grey" },
  { id: "interested", label: "Interested — ProGrafter", tone: "teal" },
  { id: "registered", label: "Registered", tone: "teal" },
  { id: "quote_checker_used", label: "Quote Checker used", tone: "teal" },
  { id: "project_created", label: "Project created", tone: "teal" },
  { id: "find_trades", label: "Find Trades", tone: "teal" },
  { id: "draftline_enquiry", label: "Draftline enquiry", tone: "purple" },
  { id: "not_interested", label: "Not interested", tone: "red" },
  { id: "closed", label: "No response / closed", tone: "grey" },
  { id: "not_suitable", label: "Not suitable", tone: "grey" },
];

export const responseLabel = (id: string | null) =>
  RESPONSE_STATES.find((r) => r.id === id)?.label ?? null;

/** Response states that count as a genuine reply from the recipient. */
const RESPONDED = new Set([
  "interested",
  "registered",
  "quote_checker_used",
  "project_created",
  "find_trades",
  "draftline_enquiry",
  "not_interested",
]);
const REGISTERED = new Set(["registered", "quote_checker_used", "project_created", "find_trades"]);

/* ---------- derived lead state ---------- */
export const isSkipped = (l: Lead) => l.outreach_status === "skipped";

export const isContacted = (l: Lead) =>
  Boolean(
    l.homeowner_contacted ||
      l.agent_contacted ||
      l.homeowner_last_contact_at ||
      l.agent_last_contact_at ||
      l.letter_sent_at ||
      l.letter_batch_sent_at ||
      l.outreach_status === "letter_sent" ||
      l.pipeline_status === "letter_sent",
  );

export const hasResponded = (l: Lead) => Boolean(l.response_state && RESPONDED.has(l.response_state));

export const isQualified = (l: Lead) =>
  !isSkipped(l) &&
  l.pipeline_status !== "not_suitable" &&
  l.response_state !== "not_suitable" &&
  (Number(l.estimated_value_max) || 0) >= 40000;

export const lastContactAt = (l: Lead) =>
  l.homeowner_last_contact_at || l.letter_sent_at || l.homeowner_contacted_at || null;

/** Short, human status for the lead card. */
export const outreachChip = (
  l: Lead,
): { label: string; color: string; date: string | null } => {
  if (isSkipped(l)) return { label: "SKIPPED", color: C.faint, date: null };
  if (l.response_state && l.response_state !== "no_response") {
    const s = RESPONSE_STATES.find((r) => r.id === l.response_state);
    const color =
      s?.tone === "teal" ? C.tealBright : s?.tone === "purple" ? C.purple : s?.tone === "red" ? C.red : C.faint;
    return { label: (s?.label || l.response_state).toUpperCase(), color, date: l.response_at };
  }
  if (l.letter_batch_status === "queued")
    return { label: "IN LETTER BATCH", color: C.amberBright, date: l.letter_batch_added_at };
  if (isContacted(l)) {
    const method = (l.homeowner_last_contact_method || "letter").toUpperCase();
    return {
      label: method === "LETTER" ? "LETTER SENT" : `${method} MADE`,
      color: C.amberBright,
      date: lastContactAt(l),
    };
  }
  if (l.reviewed_at) return { label: "REVIEWED", color: C.teal, date: l.reviewed_at };
  return { label: "NOT CONTACTED", color: C.faint, date: null };
};

/* ---------- next action ---------- */
export type NextAction = { key: string; label: string; hint?: string; tone: "teal" | "amber" | "grey" | "red" };

export const nextActionFor = (l: Lead): NextAction => {
  if (isSkipped(l)) return { key: "closed", label: "SKIPPED", tone: "grey" };
  if (l.response_state && REGISTERED.has(l.response_state))
    return { key: "none", label: "REGISTERED — NO ACTION REQUIRED", tone: "teal" };
  if (l.response_state === "draftline_enquiry")
    return { key: "action_response", label: "ACTION DRAFTLINE ENQUIRY", tone: "purple" as never as "teal" };
  if (l.response_state === "interested")
    return { key: "action_response", label: "ACTION RESPONSE", hint: "Homeowner is interested", tone: "teal" };
  if (l.response_state === "not_interested" || l.response_state === "closed" || l.response_state === "not_suitable")
    return { key: "closed", label: "CLOSED", tone: "grey" };
  if (l.letter_batch_status === "queued")
    return { key: "batch", label: "IN LETTER BATCH — PRINT & SEND", tone: "amber" };
  if (isContacted(l)) {
    const d = daysSince(lastContactAt(l));
    if (d > 21) return { key: "follow_up", label: "FOLLOW UP", hint: `${d} days since contact`, tone: "amber" };
    return { key: "await", label: "AWAIT RESPONSE", hint: d ? `${d} days since contact` : undefined, tone: "grey" };
  }
  if (!l.reviewed_at) return { key: "review", label: "REVIEW LEAD", tone: "teal" };
  return { key: "add_batch", label: "ADD TO LETTER BATCH", tone: "teal" };
};

/* ---------- funnel + today ---------- */
export type Funnel = {
  identified: number;
  qualified: number;
  contacted: number;
  responded: number;
  registered: number;
  projects: number;
};

export const buildFunnel = (leads: Lead[]): Funnel => ({
  identified: leads.length,
  qualified: leads.filter(isQualified).length,
  contacted: leads.filter((l) => !isSkipped(l) && isContacted(l)).length,
  responded: leads.filter(hasResponded).length,
  registered: leads.filter((l) => l.response_state && REGISTERED.has(l.response_state)).length,
  projects: leads.filter((l) => l.response_state === "project_created").length,
});

export type TodayQueue = {
  toReview: number;
  lettersReady: number;
  responsesToAction: number;
  followUpsDue: number;
  historic: number;
  total: number;
};

/**
 * Historic backlog: leads imported (or bulk-flagged) before this outreach
 * workflow existed. A lead is historic when the application is older than
 * 120 days AND nothing has ever been done with it *through this workflow*.
 * These must not pollute "today's" workload.
 */
export const HISTORIC_AGE_DAYS = 120;

/** True when a lead has been touched through the current outreach workflow. */
export const isWorkflowTracked = (l: Lead) =>
  Boolean(
    l.reviewed_at ||
      l.homeowner_last_contact_method ||
      l.agent_last_contact_method ||
      l.letter_batch_status ||
      l.letter_batch_sent_at ||
      l.letter_sent_at ||
      l.response_state,
  );

export const isHistoric = (l: Lead) =>
  !isWorkflowTracked(l) && daysSince(l.submitted_date || l.created_at) > HISTORIC_AGE_DAYS;

export const buildToday = (leads: Lead[]): TodayQueue => {
  const live = leads.filter((l) => !isSkipped(l));
  const current = live.filter((l) => !isHistoric(l));
  const toReview = current.filter((l) => !l.reviewed_at && !isContacted(l) && isQualified(l)).length;
  const lettersReady = live.filter((l) => l.letter_batch_status === "queued").length;
  const responsesToAction = live.filter(
    (l) => l.response_state === "interested" || l.response_state === "draftline_enquiry",
  ).length;
  // Only chase follow-ups for contact that was actually logged through the workflow.
  const followUpsDue = current.filter(
    (l) => nextActionFor(l).key === "follow_up" && isWorkflowTracked(l),
  ).length;

  return {
    toReview,
    lettersReady,
    responsesToAction,
    followUpsDue,
    historic: live.filter(isHistoric).length,
    total: toReview + lettersReady + responsesToAction + followUpsDue,
  };
};

/** Duplicate protection: a letter has already physically gone out to this lead. */
export const letterAlreadySent = (l: Lead) =>
  Boolean(l.letter_batch_sent_at || l.letter_sent_at || l.outreach_status === "letter_sent");


/* ---------- quick views ---------- */
export const QUICK_VIEWS = [
  { id: "all", label: "All" },
  { id: "review", label: "To review" },
  { id: "ready", label: "Ready to send" },
  { id: "contacted", label: "Contacted" },
  { id: "responses", label: "Responses" },
  { id: "historic", label: "Historic" },
] as const;

export type QuickView = (typeof QUICK_VIEWS)[number]["id"];

export const matchesView = (l: Lead, view: QuickView) => {
  switch (view) {
    case "review":
      return !l.reviewed_at && !isContacted(l) && !isHistoric(l);
    case "ready":
      return l.letter_batch_status === "queued";
    case "contacted":
      return isContacted(l);
    case "responses":
      return hasResponded(l);
    case "historic":
      return isHistoric(l);
    default:
      return true;
  }
};

