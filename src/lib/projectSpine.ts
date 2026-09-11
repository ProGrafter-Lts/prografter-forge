/**
 * PROJECT SPINE — one canonical read of a project, shared by the homeowner
 * and trade dashboards so the two views can never disagree.
 *
 * Reads only existing records keyed by job_id:
 *   jobs, project_stages, contracts, contract_variations, stage_updates,
 *   quotes, job_matches, project_messages.
 *
 * No writes, no schema assumptions beyond what already exists.
 */
import { supabase } from "@/integrations/supabase/client";

export type ProjectRole = "homeowner" | "trade";

export interface ProjectStageRow {
  id: string;
  stage_name: string;
  stage_order: number;
  status: string | null;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  payment_amount: number | null;
  payment_status: string | null;
  homeowner_confirmed: boolean | null;
  homeowner_confirmed_at: string | null;
}

export interface SiteUpdateRow {
  id: string;
  created_at: string;
  entry_date: string | null;
  update_text: string | null;
  work_completed: string | null;
  issues_found: string | null;
  delay_reason: string | null;
  tomorrow_plan: string | null;
  programme_impact_days: number | null;
  photo_urls: string[] | null;
  stage_id: string | null;
  stage_name?: string | null;
  trade_name?: string | null;
}

export interface VariationRow {
  id: string;
  contract_id: string;
  sequence: number | null;
  title: string | null;
  description: string | null;
  cost_change_pence: number | null;
  programme_impact_days: number | null;
  status: string | null;
  homeowner_signed_at: string | null;
  created_at: string;
}

export interface ProjectSnapshot {
  jobId: string;
  title: string;
  jobType: string | null;
  address: string | null;
  postcode: string | null;
  status: string | null;
  stage: string | null;

  stages: ProjectStageRow[];
  currentStage: ProjectStageRow | null;
  nextStage: ProjectStageRow | null;
  completedStageCount: number;
  progressPercent: number;
  expectedCompletion: string | null;

  latestUpdate: SiteUpdateRow | null;
  updates: SiteUpdateRow[];

  variations: VariationRow[];
  pendingVariations: VariationRow[];

  contractId: string | null;
  contractValuePence: number | null;
  approvedVariationsPence: number;
  currentProjectValuePence: number | null;
  paidPence: number;
  nextPaymentStage: ProjectStageRow | null;

  pendingQuoteCount: number;
  milestonesAwaitingSignoff: ProjectStageRow[];

  health: "on_programme" | "attention" | "delayed";
}

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const isStageDone = (s: ProjectStageRow) =>
  ["complete", "completed", "signed_off", "approved"].includes((s.status || "").toLowerCase()) ||
  Boolean(s.actual_end);

const isPaid = (s: ProjectStageRow) => ["paid", "released"].includes((s.payment_status || "").toLowerCase());

/** Load everything both dashboards need for one project. */
export async function loadProjectSnapshot(jobId: string): Promise<ProjectSnapshot | null> {
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, job_type, address, postcode, status, stage")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) return null;

  const [stageRes, contractRes, quoteRes] = await Promise.all([
    supabase
      .from("project_stages")
      .select(
        "id, stage_name, stage_order, status, planned_start, planned_end, actual_start, actual_end, payment_amount, payment_status, homeowner_confirmed, homeowner_confirmed_at",
      )
      .eq("job_id", jobId)
      .order("stage_order", { ascending: true }),
    supabase
      .from("contracts")
      .select(
        "id, total_value_incl_vat_pence, estimated_completion_date, contract_variations(id, contract_id, sequence, title, description, cost_change_pence, programme_impact_days, status, homeowner_signed_at, created_at)",
      )
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("quotes").select("id, status, amount").eq("job_id", jobId),
  ]);

  const stages = asArray<ProjectStageRow>(stageRes.data);
  const stageIds = stages.map((s) => s.id);

  let updates: SiteUpdateRow[] = [];
  if (stageIds.length > 0) {
    const { data: updateRows } = await supabase
      .from("stage_updates")
      .select(
        "id, created_at, entry_date, update_text, work_completed, issues_found, delay_reason, tomorrow_plan, programme_impact_days, photo_urls, stage_id, trades:trades_public!stage_updates_trade_id_fkey(name), project_stages(stage_name)",
      )
      .in("stage_id", stageIds)
      .order("created_at", { ascending: false })
      .limit(30);

    updates = asArray<any>(updateRows).map((u) => ({
      id: u.id,
      created_at: u.created_at,
      entry_date: u.entry_date ?? null,
      update_text: u.update_text ?? null,
      work_completed: u.work_completed ?? null,
      issues_found: u.issues_found ?? null,
      delay_reason: u.delay_reason ?? null,
      tomorrow_plan: u.tomorrow_plan ?? null,
      programme_impact_days: u.programme_impact_days ?? null,
      photo_urls: u.photo_urls ?? null,
      stage_id: u.stage_id ?? null,
      stage_name: u.project_stages?.stage_name ?? null,
      trade_name: u.trades?.name ?? null,
    }));
  }

  const contract = asArray<any>(contractRes.data)[0] ?? null;
  const variations = asArray<VariationRow>(contract?.contract_variations);
  const pendingVariations = variations.filter(
    (v) => (v.status || "").toLowerCase() === "pending" && !v.homeowner_signed_at,
  );
  const approvedVariationsPence = variations
    .filter((v) => ["approved", "active", "signed"].includes((v.status || "").toLowerCase()))
    .reduce((sum, v) => sum + (v.cost_change_pence ?? 0), 0);

  const quotes = asArray<any>(quoteRes.data);
  const acceptedQuote = quotes.find((q) => (q.status || "").toLowerCase() === "accepted");
  const pendingQuoteCount = quotes.filter((q) => (q.status || "").toLowerCase() === "pending").length;

  const contractValuePence =
    contract?.total_value_incl_vat_pence ??
    (acceptedQuote?.amount != null ? Math.round(Number(acceptedQuote.amount) * 100) : null);

  const completed = stages.filter(isStageDone);
  const currentStage = stages.find((s) => !isStageDone(s)) ?? null;
  const currentIndex = currentStage ? stages.indexOf(currentStage) : stages.length;
  const nextStage = stages[currentIndex + 1] ?? null;
  const progressPercent = stages.length > 0 ? Math.round((completed.length / stages.length) * 100) : 0;

  const expectedCompletion =
    contract?.estimated_completion_date ??
    stages[stages.length - 1]?.planned_end ??
    null;

  const paidPence = stages
    .filter(isPaid)
    .reduce((sum, s) => sum + Math.round(Number(s.payment_amount ?? 0) * 100), 0);
  const nextPaymentStage = stages.find((s) => !isPaid(s) && (s.payment_amount ?? 0) > 0) ?? null;

  const milestonesAwaitingSignoff = stages.filter(
    (s) => isStageDone(s) && !s.homeowner_confirmed,
  );

  const latestUpdate = updates[0] ?? null;
  const hasDelay = updates.some((u) => u.delay_reason || (u.programme_impact_days ?? 0) > 0);
  const hasIssue = updates.some((u) => u.issues_found);
  const health: ProjectSnapshot["health"] = hasDelay
    ? "delayed"
    : hasIssue || pendingVariations.length > 0 || milestonesAwaitingSignoff.length > 0
      ? "attention"
      : "on_programme";

  return {
    jobId: job.id,
    title: job.title || job.job_type || "Your project",
    jobType: job.job_type ?? null,
    address: (job as any).address ?? null,
    postcode: job.postcode ?? null,
    status: job.status ?? null,
    stage: job.stage ?? null,
    stages,
    currentStage,
    nextStage,
    completedStageCount: completed.length,
    progressPercent,
    expectedCompletion,
    latestUpdate,
    updates,
    variations,
    pendingVariations,
    contractId: contract?.id ?? null,
    contractValuePence,
    approvedVariationsPence,
    currentProjectValuePence:
      contractValuePence != null ? contractValuePence + approvedVariationsPence : null,
    paidPence,
    nextPaymentStage,
    pendingQuoteCount,
    milestonesAwaitingSignoff,
    health,
  };
}

/* ------------------------------------------------------------------ */
/* Action engine — typed items that deep-link to the underlying object */
/* ------------------------------------------------------------------ */

export interface ActionItem {
  id: string;
  label: string;
  detail?: string;
  to: string;
  tone: "urgent" | "normal";
}

export function buildProjectActions(snap: ProjectSnapshot, role: ProjectRole): ActionItem[] {
  const items: ActionItem[] = [];
  const base = `/project/${snap.jobId}`;

  if (role === "homeowner") {
    snap.pendingVariations.forEach((v) =>
      items.push({
        id: `variation-${v.id}`,
        label: `Variation ${v.sequence ? `#${String(v.sequence).padStart(3, "0")}` : ""} requires approval`.trim(),
        detail: v.title ?? undefined,
        to: `${base}?tab=variations`,
        tone: "urgent",
      }),
    );
    snap.milestonesAwaitingSignoff.forEach((s) =>
      items.push({
        id: `milestone-${s.id}`,
        label: `${s.stage_name} is ready for your sign-off`,
        to: `${base}?tab=stages`,
        tone: "urgent",
      }),
    );
    if (snap.pendingQuoteCount > 0) {
      items.push({
        id: "quotes",
        label: `${snap.pendingQuoteCount} quote${snap.pendingQuoteCount > 1 ? "s" : ""} ready to review`,
        to: `/dashboard/homeowner?tab=quotes`,
        tone: "normal",
      });
    }
  } else {
    snap.variations
      .filter((v) => ["approved", "active"].includes((v.status || "").toLowerCase()))
      .slice(0, 3)
      .forEach((v) =>
        items.push({
          id: `variation-approved-${v.id}`,
          label: `Variation approved${v.title ? ` — ${v.title}` : ""}`,
          to: `${base}?tab=variations`,
          tone: "normal",
        }),
      );
    snap.milestonesAwaitingSignoff.forEach((s) =>
      items.push({
        id: `awaiting-${s.id}`,
        label: `${s.stage_name} awaiting homeowner sign-off`,
        to: `${base}?tab=stages`,
        tone: "normal",
      }),
    );
    if (!snap.latestUpdate || isOlderThanADay(snap.latestUpdate.created_at)) {
      items.push({
        id: "site-update",
        label: "Today's site update not posted yet",
        to: `${base}?tab=photos`,
        tone: "urgent",
      });
    }
  }

  return items;
}

const isOlderThanADay = (iso: string) => Date.now() - new Date(iso).getTime() > 24 * 60 * 60 * 1000;

export const formatPence = (pence: number | null | undefined) =>
  pence == null
    ? "—"
    : `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

export const HEALTH_LABEL: Record<ProjectSnapshot["health"], string> = {
  on_programme: "On programme",
  attention: "Attention required",
  delayed: "Delayed",
};
