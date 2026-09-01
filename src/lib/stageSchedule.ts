/**
 * Stage schedule derivation.
 *
 * Turns the payment schedule already agreed in the trade's quote / contract
 * into the project's stage timeline, so the dashboard timeline, the payment
 * schedule and the branded PDF all read from one agreed source of truth.
 *
 * Purely a read/derive helper — nothing here writes to the database.
 */

export interface StageDraft {
  stage_name: string;
  stage_order: number;
  payment_amount: number;
  scope_detail: string | null;
}

const num = (v: unknown): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

/**
 * Reads a quote/contract payment schedule (JSON, historically several shapes)
 * into ordered stage drafts. Percentages are resolved against `totalValue`.
 */
export function deriveStagesFromSchedule(
  schedule: unknown,
  totalValue: number,
): StageDraft[] {
  if (!Array.isArray(schedule)) return [];
  const drafts: StageDraft[] = [];

  schedule.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") return;
    const row = raw as Record<string, unknown>;

    const name =
      str(row.stage_name) ??
      str(row.label) ??
      str(row.name) ??
      str(row.title) ??
      str(row.milestone) ??
      `Stage ${i + 1}`;

    const pct = num(row.percentage ?? row.percent ?? row.pct);
    const explicit = num(row.amount ?? row.payment_amount ?? row.value ?? row.total);
    const amount = explicit > 0 ? explicit : pct > 0 ? Math.round((totalValue * pct) / 100) : 0;

    drafts.push({
      stage_name: name.slice(0, 120),
      stage_order: i + 1,
      payment_amount: amount,
      scope_detail: str(row.description) ?? str(row.detail) ?? str(row.scope) ?? null,
    });
  });

  return drafts;
}

/** Percentage of the contract value a stage payment represents. */
export const stagePercent = (amount: number, contractValue: number) =>
  contractValue > 0 ? Math.round((amount / contractValue) * 100) : 0;

export type StageTone = "green" | "teal" | "amber" | "grey";

export const stageTone = (status: string): StageTone =>
  status === "complete" || status === "completed"
    ? "green"
    : status === "active"
      ? "teal"
      : status === "blocked" || status === "on_hold"
        ? "amber"
        : "grey";

export const paymentTone = (status: string): StageTone =>
  status === "paid" ? "green" : status === "due" ? "amber" : "grey";

export const formatStageDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const gbp = (n: number) =>
  `£${Number(n || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
