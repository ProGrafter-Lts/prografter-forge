/**
 * PROJECT COMPLETION — one canonical read of everything needed to close a
 * project and to render its permanent records afterwards.
 *
 * Reads only existing records keyed by job_id. There is no second project
 * system: the completion record (`project_completions`) and the trade-private
 * delivery review (`project_reviews`) both hang off the same canonical job.
 *
 * Privacy: trade cost/margin data lives in `project_commercials`, which is
 * protected by RLS (owning trade only). This module never merges it into any
 * homeowner-facing shape.
 */
import { supabase } from "@/integrations/supabase/client";

export type ReadinessLevel = "ok" | "review" | "blocking";

export interface ReadinessItem {
  id: string;
  label: string;
  detail: string;
  level: ReadinessLevel;
}

export interface CompletionVariationSummary {
  raised: number;
  approved: number;
  rejected: number;
  pending: number;
  approvedPence: number;
  programmeDaysAdded: number;
  percentOfContract: number | null;
}

export interface CompletionPaymentSummary {
  milestones: number;
  paidMilestones: number;
  paidPence: number;
  outstandingPence: number;
  latePayments: number;
  largestGapDays: number | null;
  firstPaymentDate: string | null;
  lastPaymentDate: string | null;
  outcome: "worked_well" | "needs_review" | "insufficient_data";
}

export interface CompletionProgrammeSummary {
  plannedStart: string | null;
  actualStart: string | null;
  plannedEnd: string | null;
  actualEnd: string | null;
  plannedDurationDays: number | null;
  actualDurationDays: number | null;
  varianceDays: number | null;
  recordedDelayDays: number;
  delayReasons: { category: string; note: string; days: number }[];
}

export interface CompletionReport {
  job: any;
  contract: any | null;
  stages: any[];
  variations: any[];
  updates: any[];
  photosCount: number;
  documentsCount: number;
  certificates: any[];
  warranties: any[];
  materials: any[];
  commercials: any | null;
  completion: any | null;
  review: any | null;

  originalContractPence: number | null;
  approvedVariationsPence: number;
  finalValuePence: number | null;

  variationSummary: CompletionVariationSummary;
  paymentSummary: CompletionPaymentSummary;
  programmeSummary: CompletionProgrammeSummary;
  readiness: ReadinessItem[];
  overall: ReadinessLevel;
}

const DELAY_CATEGORIES: { category: string; match: RegExp }[] = [
  { category: "Weather", match: /weather|rain|snow|frost|wind|storm/i },
  { category: "Materials", match: /material|deliver|supply|supplier|stock|lead time/i },
  { category: "Client decision", match: /client|homeowner|decision|choice|approval/i },
  { category: "Variation", match: /variation|extra work|change/i },
  { category: "Subcontractor", match: /sub-?contractor|sub-?trade|electrician|plumber|roofer/i },
  { category: "Inspection / Building Control", match: /inspection|building control|\bbc\b|inspector/i },
  { category: "Design / information", match: /design|drawing|spec|information|architect/i },
  { category: "Unforeseen site condition", match: /unforeseen|ground|asbestos|drain|hidden|existing/i },
  { category: "Trade / internal", match: /labour|staff|illness|sick|resource|internal/i },
];

const categoriseDelay = (text: string) =>
  DELAY_CATEGORIES.find((c) => c.match.test(text))?.category ?? "Other";

const daysBetween = (a: string | null, b: string | null) =>
  a && b ? Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) : null;

const minDate = (dates: (string | null)[]) => {
  const list = dates.filter(Boolean) as string[];
  return list.length ? list.reduce((x, y) => (x < y ? x : y)) : null;
};
const maxDate = (dates: (string | null)[]) => {
  const list = dates.filter(Boolean) as string[];
  return list.length ? list.reduce((x, y) => (x > y ? x : y)) : null;
};

const isStageDone = (s: any) =>
  ["complete", "completed", "signed_off", "approved"].includes((s.status || "").toLowerCase()) ||
  Boolean(s.actual_end);

const isStagePaid = (s: any) => ["paid", "released"].includes((s.payment_status || "").toLowerCase());

export async function loadCompletionReport(jobId: string): Promise<CompletionReport | null> {
  const { data: job } = await supabase
    .from("jobs")
    .select("id, ref, title, job_type, description, address, postcode, status, stage, property_id, homeowner_id, created_at")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return null;

  const [contractRes, stageRes, photoRes, certRes, warrantyRes, materialRes, commercialRes, completionRes, reviewRes, docRes] =
    await Promise.all([
      supabase
        .from("contracts")
        .select(
          "id, total_value_incl_vat_pence, total_value_excl_vat_pence, estimated_start_date, estimated_completion_date, created_at, trade_id, contract_variations(id, sequence, title, description, cost_change_pence, programme_impact_days, status, homeowner_signed_at, created_at)",
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase.from("project_stages").select("*").eq("job_id", jobId).order("stage_order"),
      supabase.from("job_photos").select("id", { count: "exact", head: true }).eq("job_id", jobId),
      supabase.from("project_certificates").select("*").eq("job_id", jobId),
      supabase.from("project_warranties").select("*").eq("job_id", jobId),
      supabase.from("materials_log").select("*").eq("job_id", jobId).order("created_at"),
      supabase.from("project_commercials").select("*").eq("job_id", jobId).maybeSingle(),
      supabase.from("project_completions").select("*").eq("job_id", jobId).maybeSingle(),
      supabase.from("project_reviews").select("*").eq("job_id", jobId).maybeSingle(),
      supabase.from("job_brief_files").select("id", { count: "exact", head: true }).eq("job_id", jobId),
    ]);

  const contract = (contractRes.data || [])[0] ?? null;
  const stages = stageRes.data || [];
  const variations = (contract?.contract_variations as any[]) || [];

  let updates: any[] = [];
  const stageIds = stages.map((s: any) => s.id);
  if (stageIds.length) {
    const { data } = await supabase
      .from("stage_updates")
      .select("*")
      .in("stage_id", stageIds)
      .order("created_at");
    updates = data || [];
  }

  const statusOf = (v: any) => (v.status || "").toLowerCase();
  const approved = variations.filter((v) => ["accepted", "approved", "active", "signed"].includes(statusOf(v)));
  const rejected = variations.filter((v) => ["rejected", "declined"].includes(statusOf(v)));
  const pending = variations.filter((v) => !["accepted", "approved", "active", "signed", "rejected", "declined"].includes(statusOf(v)));

  const approvedVariationsPence = approved.reduce((sum, v) => sum + Number(v.cost_change_pence || 0), 0);
  const originalContractPence =
    contract?.total_value_incl_vat_pence ?? contract?.total_value_excl_vat_pence ?? null;
  const finalValuePence =
    originalContractPence != null ? Number(originalContractPence) + approvedVariationsPence : null;

  const variationSummary: CompletionVariationSummary = {
    raised: variations.length,
    approved: approved.length,
    rejected: rejected.length,
    pending: pending.length,
    approvedPence: approvedVariationsPence,
    programmeDaysAdded: approved.reduce((s, v) => s + Number(v.programme_impact_days || 0), 0),
    percentOfContract:
      originalContractPence && Number(originalContractPence) > 0
        ? Math.round((approvedVariationsPence / Number(originalContractPence)) * 1000) / 10
        : null,
  };

  /* Payments -------------------------------------------------------- */
  const paidStages = stages.filter(isStagePaid);
  const paidPence = paidStages.reduce((s: number, st: any) => s + Math.round(Number(st.payment_amount || 0) * 100), 0);
  const outstandingPence = Math.max((finalValuePence ?? 0) - paidPence, 0);
  const paymentDates = paidStages
    .map((s: any) => s.paid_at || s.actual_end || s.updated_at || null)
    .filter(Boolean)
    .sort() as string[];
  let largestGapDays: number | null = null;
  for (let i = 1; i < paymentDates.length; i++) {
    const gap = daysBetween(paymentDates[i - 1], paymentDates[i]) ?? 0;
    if (largestGapDays == null || gap > largestGapDays) largestGapDays = gap;
  }
  const latePayments = stages.filter(
    (s: any) => isStageDone(s) && !isStagePaid(s) && Number(s.payment_amount || 0) > 0,
  ).length;

  const paymentSummary: CompletionPaymentSummary = {
    milestones: stages.length,
    paidMilestones: paidStages.length,
    paidPence,
    outstandingPence,
    latePayments,
    largestGapDays,
    firstPaymentDate: paymentDates[0] ?? null,
    lastPaymentDate: paymentDates[paymentDates.length - 1] ?? null,
    outcome:
      stages.length === 0 || paidStages.length === 0
        ? "insufficient_data"
        : latePayments === 0 && outstandingPence === 0 && (largestGapDays ?? 0) <= 45
          ? "worked_well"
          : "needs_review",
  };

  /* Programme ------------------------------------------------------- */
  const plannedStart = minDate(stages.map((s: any) => s.planned_start));
  const actualStart = minDate(stages.map((s: any) => s.actual_start));
  const plannedEnd = maxDate(stages.map((s: any) => s.planned_end)) ?? contract?.estimated_completion_date ?? null;
  const actualEnd = maxDate(stages.map((s: any) => s.actual_end));
  const plannedDurationDays = daysBetween(plannedStart, plannedEnd);
  const actualDurationDays = daysBetween(actualStart, actualEnd);
  const delayReasons = updates
    .filter((u) => u.delay_reason || Number(u.programme_impact_days || 0) > 0)
    .map((u) => ({
      category: categoriseDelay(u.delay_reason || u.issues_found || ""),
      note: u.delay_reason || u.issues_found || "",
      days: Number(u.programme_impact_days || 0),
    }));

  const programmeSummary: CompletionProgrammeSummary = {
    plannedStart,
    actualStart,
    plannedEnd,
    actualEnd,
    plannedDurationDays,
    actualDurationDays,
    varianceDays:
      plannedDurationDays != null && actualDurationDays != null
        ? plannedDurationDays - actualDurationDays
        : plannedEnd && actualEnd
          ? (daysBetween(actualEnd, plannedEnd) ?? null)
          : null,
    recordedDelayDays: delayReasons.reduce((s, d) => s + d.days, 0),
    delayReasons,
  };

  /* Readiness ------------------------------------------------------- */
  const readiness: ReadinessItem[] = [];
  const push = (id: string, label: string, detail: string, level: ReadinessLevel) =>
    readiness.push({ id, label, detail, level });

  if (!contract) {
    push("contract", "Contract", "No contract found for this project.", "blocking");
  } else {
    push(
      "contract",
      "Contract",
      originalContractPence != null
        ? `Agreed value £${(Number(originalContractPence) / 100).toLocaleString("en-GB")}`
        : "Contract in place",
      "ok",
    );
  }

  if (pending.length > 0) {
    push(
      "variations",
      "Unresolved variations",
      `${pending.length} variation${pending.length > 1 ? "s" : ""} still awaiting a decision.`,
      "blocking",
    );
  } else {
    push(
      "variations",
      "Variations",
      variations.length === 0
        ? "No variations raised."
        : `${approved.length} approved, ${rejected.length} rejected.`,
      "ok",
    );
  }

  const openStages = stages.filter((s: any) => !isStageDone(s));
  if (openStages.length > 0) {
    push(
      "stages",
      "Payment milestones",
      `${openStages.length} of ${stages.length} milestone${stages.length > 1 ? "s" : ""} not marked complete.`,
      "review",
    );
  } else if (stages.length > 0) {
    push("stages", "Payment milestones", `All ${stages.length} milestones complete.`, "ok");
  }

  const awaitingSignoff = stages.filter((s: any) => isStageDone(s) && !s.homeowner_confirmed);
  if (awaitingSignoff.length > 0) {
    push(
      "signoff",
      "Homeowner sign-off",
      `${awaitingSignoff.length} completed milestone${awaitingSignoff.length > 1 ? "s" : ""} not yet signed off.`,
      "review",
    );
  }

  if (outstandingPence > 0) {
    push(
      "balance",
      "Outstanding balance",
      `£${(outstandingPence / 100).toLocaleString("en-GB")} of the project value is not recorded as paid.`,
      "review",
    );
  } else if (paidPence > 0) {
    push("balance", "Payments", "Project value fully recorded as paid.", "ok");
  }

  const photosCount = photoRes.count ?? 0;
  const documentsCount = docRes.count ?? 0;
  push(
    "records",
    "Project records",
    `${photosCount} photo${photosCount === 1 ? "" : "s"}, ${updates.length} site update${updates.length === 1 ? "" : "s"}, ${(certRes.data || []).length} certificate${(certRes.data || []).length === 1 ? "" : "s"}.`,
    photosCount === 0 && updates.length === 0 ? "review" : "ok",
  );

  const overall: ReadinessLevel = readiness.some((r) => r.level === "blocking")
    ? "blocking"
    : readiness.some((r) => r.level === "review")
      ? "review"
      : "ok";

  return {
    job,
    contract,
    stages,
    variations,
    updates,
    photosCount,
    documentsCount,
    certificates: certRes.data || [],
    warranties: warrantyRes.data || [],
    materials: materialRes.data || [],
    commercials: commercialRes.data ?? null,
    completion: completionRes.data ?? null,
    review: reviewRes.data ?? null,
    originalContractPence: originalContractPence != null ? Number(originalContractPence) : null,
    approvedVariationsPence,
    finalValuePence,
    variationSummary,
    paymentSummary,
    programmeSummary,
    readiness,
    overall,
  };
}

export const READINESS_LABEL: Record<ReadinessLevel, string> = {
  ok: "Ready to complete",
  review: "Items to review",
  blocking: "Blocking items",
};

export const money = (pence: number | null | undefined) =>
  pence == null ? "—" : `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;

/** Write the permanent completion record and move the canonical job to completed. */
export async function completeProject(
  report: CompletionReport,
  opts: { completedBy: string; role: "trade" | "homeowner"; notes?: string },
) {
  const payload = {
    job_id: report.job.id,
    completed_by: opts.completedBy,
    completed_by_role: opts.role,
    completion_status: "completed",
    original_contract_pence: report.originalContractPence,
    approved_variations_pence: report.approvedVariationsPence,
    final_value_pence: report.finalValuePence,
    paid_pence: report.paymentSummary.paidPence,
    outstanding_pence: report.paymentSummary.outstandingPence,
    planned_start: report.programmeSummary.plannedStart,
    actual_start: report.programmeSummary.actualStart,
    planned_end: report.programmeSummary.plannedEnd,
    actual_end: report.programmeSummary.actualEnd ?? new Date().toISOString().slice(0, 10),
    readiness_snapshot: report.readiness as any,
    completion_notes: opts.notes || null,
  };

  const { error: completionError } = await supabase
    .from("project_completions")
    .upsert(payload as any, { onConflict: "job_id" });
  if (completionError) throw completionError;

  const { error: jobError } = await supabase
    .from("jobs")
    .update({ stage: "completed", status: "completed" })
    .eq("id", report.job.id);
  if (jobError) throw jobError;
}
