import { supabase } from "@/integrations/supabase/client";

/**
 * Admin Attention Centre — single source of truth.
 *
 * Attention items are DERIVED from existing canonical records (applications,
 * documents, briefs, disputes, enquiries). Nothing is duplicated: we read the
 * source record's own status and compute priority with deterministic rules.
 * The only stored state is `attention_resolutions`, used when a source record
 * cannot tell us on its own that the work is done.
 */

export type AttentionPriority = "urgent" | "action_required" | "follow_up" | "information";

export const PRIORITY_LABEL: Record<AttentionPriority, string> = {
  urgent: "Urgent",
  action_required: "Action required",
  follow_up: "Follow up",
  information: "Information",
};

export const PRIORITY_ORDER: AttentionPriority[] = [
  "urgent",
  "action_required",
  "follow_up",
  "information",
];

export type AttentionSource =
  | "contact_enquiry"
  | "trade_application"
  | "verification_document"
  | "job_brief"
  | "dispute"
  | "manual_quote_review";

export const SOURCE_LABEL: Record<AttentionSource, string> = {
  contact_enquiry: "Enquiry",
  trade_application: "Trade application",
  verification_document: "Verification document",
  job_brief: "Job brief",
  dispute: "Dispute",
  manual_quote_review: "Manual quote review",
};

export interface AttentionItem {
  /** Stable key: `${source}:${sourceId}` */
  key: string;
  source: AttentionSource;
  sourceId: string;
  priority: AttentionPriority;
  type: string;
  title: string;
  description: string;
  person?: string | null;
  company?: string | null;
  status: string;
  createdAt: string;
  /** SLA deadline where one applies (enquiries only in V1). */
  dueAt?: string | null;
  overdue?: boolean;
  dueSoon?: boolean;
  relatedRef?: string | null;
  actionLabel: string;
  actionHref: string;
  /** Source record can't self-report completion → allow MARK RESOLVED. */
  manualResolveOnly: boolean;
}

export interface AttentionResolution {
  source_type: string;
  source_id: string;
  resolved_by_email: string | null;
  note: string | null;
  resolved_at: string;
}

// ---------------------------------------------------------------------------
// Working-day SLA (2 working days for enquiries — not applied to any other flow)
// ---------------------------------------------------------------------------

export const ENQUIRY_SLA_WORKING_DAYS = 2;

const isWorkingDay = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;

/** Deadline = `from` + n working days (weekends skipped; UK bank holidays not modelled). */
export const addWorkingDays = (from: Date, days: number): Date => {
  const d = new Date(from.getTime());
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d)) remaining -= 1;
  }
  return d;
};

/** Whole working days elapsed between two instants. */
export const workingDaysBetween = (from: Date, to: Date): number => {
  if (to <= from) return 0;
  let count = 0;
  const d = new Date(from.getTime());
  while (true) {
    d.setDate(d.getDate() + 1);
    if (d > to) break;
    if (isWorkingDay(d)) count += 1;
  }
  return count;
};

export const timeWaiting = (createdAt: string, now = new Date()): string => {
  const ms = now.getTime() - new Date(createdAt).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hr`;
  return `${Math.round(hours / 24)} days`;
};

export const formatWhen = (iso: string): string =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

const OPEN_APPLICATION_STATUSES = ["new", "in_review", "reference_checks"];
const WAITING_APPLICATION_STATUSES = ["awaiting_info"];

export interface AttentionSnapshot {
  items: AttentionItem[];
  resolved: (AttentionItem & { resolution?: AttentionResolution })[];
  counts: Record<AttentionPriority, number>;
  total: number;
}

export const emptySnapshot = (): AttentionSnapshot => ({
  items: [],
  resolved: [],
  counts: { urgent: 0, action_required: 0, follow_up: 0, information: 0 },
  total: 0,
});

export async function loadAttention(now = new Date()): Promise<AttentionSnapshot> {
  const [enquiries, applications, documents, briefs, disputes, manualReviews, resolutions] =
    await Promise.all([
      supabase
        .from("contact_enquiries")
        .select("id,name,email,subject,message,status,created_at,responded_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("trade_applications")
        .select("id,full_name,business_name,applicant_email,trade_category_id,verification_status,created_at")
        .in("verification_status", [...OPEN_APPLICATION_STATUSES, ...WAITING_APPLICATION_STATUSES])
        .order("created_at", { ascending: true }),
      supabase
        .from("tradevault_documents")
        .select("id,trade_id,document_type,status,created_at,original_filename")
        .in("status", ["pending", "submitted", "under_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("job_briefs")
        .select("id,ref,full_name,job_title,status,created_at,city,postcode")
        .eq("status", "under_review")
        .order("created_at", { ascending: true }),
      supabase
        .from("disputes")
        .select("id,ref,reason_label,status,created_at,job_id")
        .not("status", "in", "(resolved,closed,withdrawn)")
        .order("created_at", { ascending: true }),
      supabase
        .from("manual_quote_review_requests")
        .select("id,name,email,quote_type,status,created_at")
        .in("status", ["new", "pending", "in_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("attention_resolutions")
        .select("source_type,source_id,resolved_by_email,note,resolved_at"),
    ]);

  const resolutionMap = new Map<string, AttentionResolution>();
  (resolutions.data ?? []).forEach((r) =>
    resolutionMap.set(`${r.source_type}:${r.source_id}`, r as AttentionResolution),
  );

  const all: AttentionItem[] = [];

  // --- Enquiries (2 working-day SLA) ---------------------------------------
  (enquiries.data ?? []).forEach((e) => {
    if (e.status !== "new") return; // responded/closed resolves automatically
    const created = new Date(e.created_at);
    const due = addWorkingDays(created, ENQUIRY_SLA_WORKING_DAYS);
    const overdue = now > due;
    const dueSoon = !overdue && workingDaysBetween(created, now) >= 1;
    all.push({
      key: `contact_enquiry:${e.id}`,
      source: "contact_enquiry",
      sourceId: e.id,
      priority: overdue ? "urgent" : "action_required",
      type: e.subject,
      title: e.subject,
      description: (e.message ?? "").slice(0, 160),
      person: e.name,
      company: null,
      status: "New",
      createdAt: e.created_at,
      dueAt: due.toISOString(),
      overdue,
      dueSoon,
      actionLabel: "Open enquiry",
      actionHref: `/admin/attention?item=contact_enquiry:${e.id}`,
      manualResolveOnly: false,
    });
  });

  // --- Trade applications ---------------------------------------------------
  (applications.data ?? []).forEach((a) => {
    const waiting = WAITING_APPLICATION_STATUSES.includes(a.verification_status);
    all.push({
      key: `trade_application:${a.id}`,
      source: "trade_application",
      sourceId: a.id,
      priority: waiting ? "follow_up" : "action_required",
      type: waiting ? "Awaiting applicant information" : "Application review",
      title: a.business_name || a.full_name || a.applicant_email || "Trade application",
      description: a.trade_category_id ? `Trade: ${a.trade_category_id}` : "Trade application",
      person: a.full_name,
      company: a.business_name,
      status: a.verification_status,
      createdAt: a.created_at,
      actionLabel: "Review application",
      actionHref: `/admin/applications/${a.id}`,
      manualResolveOnly: false,
    });
  });

  // --- Verification documents ----------------------------------------------
  (documents.data ?? []).forEach((d) => {
    all.push({
      key: `verification_document:${d.id}`,
      source: "verification_document",
      sourceId: d.id,
      priority: "action_required",
      type: "Document review",
      title: d.document_type ?? "Verification document",
      description: d.original_filename ?? "Awaiting admin review",
      person: null,
      company: null,
      status: d.status,
      createdAt: d.created_at,
      actionLabel: "Review document",
      actionHref: "/admin/tradevault",
      manualResolveOnly: false,
    });
  });

  // --- Job briefs -----------------------------------------------------------
  (briefs.data ?? []).forEach((b) => {
    all.push({
      key: `job_brief:${b.id}`,
      source: "job_brief",
      sourceId: b.id,
      priority: "action_required",
      type: "Job brief review",
      title: b.job_title ?? "Job brief",
      description: [b.city, b.postcode].filter(Boolean).join(", ") || "Awaiting review",
      person: b.full_name,
      company: null,
      status: b.status,
      createdAt: b.created_at,
      relatedRef: b.ref,
      actionLabel: "Open job brief",
      actionHref: "/admin/job-briefs",
      manualResolveOnly: false,
    });
  });

  // --- Disputes -------------------------------------------------------------
  (disputes.data ?? []).forEach((d) => {
    all.push({
      key: `dispute:${d.id}`,
      source: "dispute",
      sourceId: d.id,
      priority: "urgent",
      type: "Open dispute",
      title: d.reason_label ?? "Dispute",
      description: `Dispute ${d.ref ?? ""}`.trim(),
      person: null,
      company: null,
      status: d.status,
      createdAt: d.created_at,
      relatedRef: d.ref,
      actionLabel: "View problem",
      actionHref: `/admin/disputes`,
      manualResolveOnly: false,
    });
  });

  // --- Manual quote review requests ----------------------------------------
  (manualReviews.data ?? []).forEach((m) => {
    all.push({
      key: `manual_quote_review:${m.id}`,
      source: "manual_quote_review",
      sourceId: m.id,
      priority: "action_required",
      type: "Manual quote review",
      title: m.quote_type ? `${m.quote_type} quote` : "Quote review request",
      description: m.email ?? "",
      person: m.name,
      company: null,
      status: m.status,
      createdAt: m.created_at,
      actionLabel: "Open request",
      actionHref: "/admin/quote-checker-modules",
      manualResolveOnly: true,
    });
  });

  const items: AttentionItem[] = [];
  const resolved: (AttentionItem & { resolution?: AttentionResolution })[] = [];
  all.forEach((item) => {
    const res = resolutionMap.get(item.key);
    if (res) resolved.push({ ...item, resolution: res });
    else items.push(item);
  });

  items.sort(sortAttention);
  resolved.sort((a, b) => +new Date(b.resolution?.resolved_at ?? 0) - +new Date(a.resolution?.resolved_at ?? 0));

  const counts = { urgent: 0, action_required: 0, follow_up: 0, information: 0 } as Record<
    AttentionPriority,
    number
  >;
  items.forEach((i) => { counts[i.priority] += 1; });

  return { items, resolved, counts, total: items.length };
}

/** Overdue urgent → urgent → action required → follow up → information; oldest first. */
export function sortAttention(a: AttentionItem, b: AttentionItem): number {
  const rank = (i: AttentionItem) =>
    (i.priority === "urgent" && i.overdue ? -1 : PRIORITY_ORDER.indexOf(i.priority));
  const diff = rank(a) - rank(b);
  if (diff !== 0) return diff;
  return +new Date(a.createdAt) - +new Date(b.createdAt);
}
