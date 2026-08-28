// Business Health Dashboard — weighted scoring engine.
// Pure, deterministic helpers so the Trade Dashboard can present a single
// "How healthy is my business today, and what should I do next?" view.
//
// Every feature in ProGrafter contributes an independent module score. The
// overall Business Health Score is a weighted roll-up. New modules can be
// added to MODULE_WEIGHTS without redesigning the dashboard.

import type { ProfileStrength } from "@/lib/tradeProfileStrength";
import type { VaultDocument, DashboardVerification } from "@/lib/tradeVault";
import { computeVaultSummary } from "@/lib/tradeVault";

export type HealthTone = "green" | "orange" | "red";

export interface ModuleScore {
  key: ModuleKey;
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
}

export type ModuleKey =
  | "pipeline"
  | "tradevault"
  | "profile"
  | "quotes"
  | "availability"
  | "calendar"
  | "messages"
  | "verification";

// Weights must sum to 1. Future modules slot in here without UI changes.
export const MODULE_WEIGHTS: Record<ModuleKey, { label: string; weight: number }> = {
  pipeline: { label: "Pipeline", weight: 0.2 },
  tradevault: { label: "TradeVault", weight: 0.2 },
  profile: { label: "Profile", weight: 0.2 },
  quotes: { label: "Quotes", weight: 0.15 },
  availability: { label: "Availability", weight: 0.1 },
  calendar: { label: "Calendar", weight: 0.05 },
  messages: { label: "Messages", weight: 0.05 },
  verification: { label: "Verification", weight: 0.05 },
};

export const toneForScore = (score: number): HealthTone => {
  if (score >= 75) return "green";
  if (score >= 50) return "orange";
  return "red";
};

export const TONE_HEX: Record<HealthTone, string> = {
  green: "#14A8A1",
  orange: "#F59E0B",
  red: "#EF4444",
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// ── Pipeline ──────────────────────────────────────────────────────────────

export interface PipelineInput {
  toContact: number; // warm leads awaiting a first response
  waiting: number; // homeowners awaiting a reply
  quotesSubmitted: number;
  activeProjects: number;
  wonJobs: number;
}

export const scorePipeline = (p: PipelineInput): number => {
  // Activity across the funnel. Reward momentum, penalise leads left uncontacted.
  let score = 40;
  if (p.quotesSubmitted > 0) score += 15;
  if (p.activeProjects > 0) score += 20;
  if (p.wonJobs > 0) score += 15;
  if (p.toContact === 0) score += 10;
  else score -= Math.min(20, p.toContact * 5); // uncontacted warm leads hurt
  if (p.quotesSubmitted === 0 && p.activeProjects === 0 && p.wonJobs === 0) score = 35;
  return clamp(score);
};

// ── Quotes ───────────────────────────────────────────────────────────────

export interface QuotesInput {
  submitted: number;
  won: number;
  lost: number;
  pending: number;
  totalValue: number;
}

export const scoreQuotes = (q: QuotesInput): number => {
  if (q.submitted === 0) return 30;
  const decided = q.won + q.lost;
  const winRate = decided > 0 ? q.won / decided : 0.5;
  // Base on volume + win rate.
  const volume = Math.min(1, q.submitted / 8) * 40;
  const conversion = winRate * 50;
  const activity = q.pending > 0 ? 10 : 5;
  return clamp(volume + conversion + activity);
};

// ── TradeVault ───────────────────────────────────────────────────────────

export const scoreTradeVault = (docs: VaultDocument[], tradeType?: string | null): number => {
  const summary = computeVaultSummary(docs, tradeType);
  if (summary.requiredTotal === 0) return 100;
  let score = (summary.requiredUploaded / summary.requiredTotal) * 100;
  score -= summary.expired * 15;
  score -= summary.expiringSoon * 5;
  return clamp(score);
};

// ── Availability ─────────────────────────────────────────────────────────

export interface AvailabilityInput {
  serviceRadiusMiles: number | null;
  calendarConnected: boolean;
  activeProjects: number;
}

export const scoreAvailability = (a: AvailabilityInput): number => {
  let score = 40;
  if ((a.serviceRadiusMiles ?? 0) > 0) score += 30;
  if (a.calendarConnected) score += 20;
  // Some active work signals real availability data exists.
  if (a.activeProjects > 0) score += 10;
  return clamp(score);
};

// ── Verification ─────────────────────────────────────────────────────────

export const scoreVerification = (status: string | null | undefined): number => {
  if (!status) return 0;
  if (status === "approved" || status === "verified") return 100;
  if (status.startsWith("pending") || status === "info_requested") return 55;
  if (status === "rejected") return 20;
  return 40;
};

// ── Roll-up ──────────────────────────────────────────────────────────────

export interface BusinessHealthInput {
  pipeline: PipelineInput;
  quotes: QuotesInput;
  vaultDocs: VaultDocument[];
  /** Trade type used to filter TradeVault documents to only those relevant to the trade. */
  tradeType?: string | null;
  profileStrength: ProfileStrength;
  availability: AvailabilityInput;
  calendarConnected: boolean;
  messages: { unread: number; openConversations: number; responseRate: number | null };
  verificationStatus: string | null | undefined;
}

export interface BusinessHealth {
  overall: number;
  tone: HealthTone;
  modules: ModuleScore[];
}

const scoreMessages = (m: BusinessHealthInput["messages"]): number => {
  // No live messaging data yet → neutral baseline, nudged by response rate.
  if (m.responseRate != null) return clamp(m.responseRate);
  return 70;
};

export const computeBusinessHealth = (input: BusinessHealthInput): BusinessHealth => {
  const raw: Record<ModuleKey, number> = {
    pipeline: scorePipeline(input.pipeline),
    tradevault: scoreTradeVault(input.vaultDocs, input.tradeType),
    profile: clamp(input.profileStrength.percent),
    quotes: scoreQuotes(input.quotes),
    availability: scoreAvailability(input.availability),
    calendar: input.calendarConnected ? 100 : 20,
    messages: scoreMessages(input.messages),
    verification: scoreVerification(input.verificationStatus),
  };

  const modules: ModuleScore[] = (Object.keys(MODULE_WEIGHTS) as ModuleKey[]).map((key) => ({
    key,
    label: MODULE_WEIGHTS[key].label,
    weight: MODULE_WEIGHTS[key].weight,
    score: raw[key],
  }));

  const overall = clamp(
    modules.reduce((sum, m) => sum + m.score * m.weight, 0),
  );

  return { overall, tone: toneForScore(overall), modules };
};

// ── Priorities (Today's focus) ──────────────────────────────────────────────

export type PriorityDot = "red" | "orange" | "green";

export interface HealthTask {
  dot: PriorityDot;
  label: string;
  target: PriorityNav;
}

export type PriorityNav =
  | "find-work"
  | "pipeline"
  | "quotes"
  | "tradevault"
  | "profile"
  | "calendar"
  | "messages";

export const computeTasks = (input: BusinessHealthInput): HealthTask[] => {
  const tasks: HealthTask[] = [];

  if (input.pipeline.toContact > 0) {
    tasks.push({
      dot: "red",
      label: `Contact ${input.pipeline.toContact} homeowner${input.pipeline.toContact > 1 ? "s" : ""}`,
      target: "pipeline",
    });
  }
  if (input.pipeline.waiting > 0) {
    tasks.push({
      dot: "orange",
      label: `Awaiting replies from ${input.pipeline.waiting} homeowner${input.pipeline.waiting > 1 ? "s" : ""}`,
      target: "pipeline",
    });
  }

  const vault = computeVaultSummary(input.vaultDocs, input.tradeType);
  if (vault.missingRequired.length > 0) {
    tasks.push({
      dot: "red",
      label: `Complete TradeVault — ${vault.missingRequired.length} document${vault.missingRequired.length > 1 ? "s" : ""} outstanding`,
      target: "tradevault",
    });
  } else if (vault.expiringSoon > 0) {
    tasks.push({
      dot: "orange",
      label: `${vault.expiringSoon} TradeVault document${vault.expiringSoon > 1 ? "s" : ""} expiring soon`,
      target: "tradevault",
    });
  } else {
    tasks.push({ dot: "green", label: "TradeVault up to date", target: "tradevault" });
  }

  if (input.quotes.pending > 0) {
    tasks.push({
      dot: "orange",
      label: `${input.quotes.pending} quote${input.quotes.pending > 1 ? "s" : ""} awaiting a decision`,
      target: "quotes",
    });
  } else {
    tasks.push({ dot: "green", label: "No quotes overdue", target: "quotes" });
  }

  if (input.profileStrength.percent < 80) {
    tasks.push({
      dot: "orange",
      label: `Profile ${input.profileStrength.percent}% complete — finish to win more work`,
      target: "profile",
    });
  }

  if (input.calendarConnected) {
    tasks.push({ dot: "green", label: "Calendar connected", target: "calendar" });
  } else {
    tasks.push({ dot: "orange", label: "Connect your calendar", target: "calendar" });
  }

  // Prioritise reds, then oranges, then greens; cap at 5.
  const order: Record<PriorityDot, number> = { red: 0, orange: 1, green: 2 };
  return tasks.sort((a, b) => order[a.dot] - order[b.dot]).slice(0, 5);
};

// ── Improve Your Score ─────────────────────────────────────────────────────

export interface ScoreBooster {
  points: number;
  label: string;
  target: PriorityNav;
}

export const computeBoosters = (input: BusinessHealthInput): ScoreBooster[] => {
  const boosters: ScoreBooster[] = [];
  const vault = computeVaultSummary(input.vaultDocs, input.tradeType);

  if (vault.missingRequired.length > 0) {
    boosters.push({ points: 4, label: "Complete TradeVault documents", target: "tradevault" });
  }
  input.profileStrength.items.forEach((item) => {
    if (item.state !== "missing") return;
    if (item.key === "bio") boosters.push({ points: 2, label: "Complete your biography", target: "profile" });
    if (item.key === "specialisms") boosters.push({ points: 2, label: "Add your specialisms", target: "profile" });
    if (item.key === "radius") boosters.push({ points: 1, label: "Set your travel radius", target: "profile" });
    if (item.key === "insurance") boosters.push({ points: 3, label: "Add your insurance details", target: "tradevault" });
  });
  const photos = input.profileStrength.items.find((i) => i.key === "photos");
  if (photos && photos.state !== "complete") {
    boosters.push({ points: 1, label: "Upload company logo & photos", target: "profile" });
  }
  if (!input.calendarConnected) {
    boosters.push({ points: 3, label: "Connect your calendar", target: "calendar" });
  }
  if (input.quotes.won === 0) {
    boosters.push({ points: 4, label: "Win your first project", target: "find-work" });
  }

  return boosters.sort((a, b) => b.points - a.points).slice(0, 7);
};

// ── Daily AI Briefing ───────────────────────────────────────────────────────

export const buildSummarySentence = (health: BusinessHealth, input: BusinessHealthInput): string => {
  const weakest = [...health.modules].sort((a, b) => a.score - b.score)[0];
  const lead =
    health.overall >= 75
      ? "Your business is performing well."
      : health.overall >= 50
      ? "Your business is in reasonable shape but has room to grow."
      : "Your business needs attention today.";

  const actions: string[] = [];
  const vault = computeVaultSummary(input.vaultDocs, input.tradeType);
  if (vault.missingRequired.length > 0) actions.push("completing your TradeVault");
  if (input.pipeline.toContact > 0) actions.push(`following up ${input.pipeline.toContact} homeowner${input.pipeline.toContact > 1 ? "s" : ""}`);
  if (input.profileStrength.percent < 80) actions.push("finishing your profile");
  if (actions.length === 0 && weakest) actions.push(`strengthening ${weakest.label.toLowerCase()}`);

  const tail = actions.length
    ? ` ${capitalise(joinList(actions))} could increase your score this week.`
    : " Keep the momentum going.";

  return lead + tail;
};

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const joinList = (items: string[]) =>
  items.length <= 1
    ? items[0] ?? ""
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export interface BriefingContent {
  focus: string[];
  singleAction: string;
}

export const buildBriefing = (
  health: BusinessHealth,
  input: BusinessHealthInput,
): BriefingContent => {
  const focus: string[] = [];
  const vault = computeVaultSummary(input.vaultDocs);

  if (input.pipeline.toContact > 0)
    focus.push(`Contact ${input.pipeline.toContact} warm homeowner lead${input.pipeline.toContact > 1 ? "s" : ""}.`);
  if (vault.missingRequired.length > 0)
    focus.push(`Complete your TradeVault — ${vault.missingRequired.length} document${vault.missingRequired.length > 1 ? "s" : ""} outstanding.`);
  if (input.profileStrength.percent < 80)
    focus.push(`Finish your profile (currently ${input.profileStrength.percent}%).`);
  if (input.pipeline.waiting > 0)
    focus.push(`${input.pipeline.waiting} homeowner${input.pipeline.waiting > 1 ? "s are" : " is"} awaiting a reply.`);
  if (input.quotes.totalValue > 0)
    focus.push(`Your pipeline represents approximately ${formatMoney(input.quotes.totalValue)} of potential work.`);
  if (focus.length === 0) focus.push("No urgent actions — a good day to chase new opportunities in Find Work.");

  // Single highest-value action.
  const weakest = [...health.modules].sort((a, b) => a.score - b.score)[0];
  let singleAction = "Chase a new opportunity in Find Work.";
  if (input.pipeline.toContact > 0)
    singleAction = "Contact your warmest homeowner lead — a fast reply is the single biggest driver of won work.";
  else if (vault.missingRequired.length > 0)
    singleAction = "Complete your TradeVault to unlock full verification and renewal reminders.";
  else if (input.profileStrength.percent < 80)
    singleAction = "Finish your profile — complete profiles receive noticeably more homeowner engagement.";
  else if (weakest && weakest.score < 60)
    singleAction = `Focus on your ${weakest.label} — it's currently your lowest-scoring area.`;

  return { focus, singleAction };
};

export const formatMoney = (n: number): string => {
  if (n >= 1000) return `£${Math.round(n / 1000)}k`;
  return `£${Math.round(n).toLocaleString()}`;
};

export const greeting = (date = new Date()): string => {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};
