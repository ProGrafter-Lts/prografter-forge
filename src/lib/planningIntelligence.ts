// Planning Intelligence™ — scoring, best-action, work packages, timing,
// intro-letter generation and feature-gating helpers.
//
// All scoring here uses transparent placeholder logic so the product feels
// like a professional opportunity workflow rather than a raw lead list.

export interface PlanningApp {
  id: string;
  council: string;
  address: string;
  postcode: string;
  type: string;
  description: string;
  status: string; // submitted | pending_decision | approved | refused
  submitted_date: string;
  decision_date: string | null;
  applicant_name: string;
  agent: string | null;
  trades_needed: string[];
  estimated_value: string;
  floorspace_m2: number;
  documents_available: boolean;
  validated: boolean;
  source_url?: string | null;
}

// ── Value parsing ────────────────────────────────────────────────────────────
export const parseMaxValue = (v: string): number => {
  const nums = (v || "").replace(/[£,]/g, "").match(/\d+/g);
  if (!nums) return 0;
  return Math.max(...nums.map(Number));
};

export const daysSince = (dateStr: string | null): number => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

// ── Opportunity Score ────────────────────────────────────────────────────────
export type ScoreBand = "Strong opportunity" | "Worth tracking" | "Monitor" | "Low priority";

export interface OpportunityScore {
  score: number;
  band: ScoreBand;
  bandColor: string; // tailwind-ish token class colours used inline
}

export const getScoreBand = (score: number): ScoreBand => {
  if (score >= 80) return "Strong opportunity";
  if (score >= 60) return "Worth tracking";
  if (score >= 40) return "Monitor";
  return "Low priority";
};

const BAND_COLORS: Record<ScoreBand, string> = {
  "Strong opportunity": "#34D399",
  "Worth tracking": "#5EEAD4",
  Monitor: "#FCD34D",
  "Low priority": "#94A3B8",
};

/**
 * Score an opportunity 0-100 using transparent placeholder logic.
 * tradeTypes = the logged-in trade's own categories (lowercased) for match boost.
 */
export const scoreOpportunity = (app: PlanningApp, tradeTypes: string[] = []): OpportunityScore => {
  let score = 0;

  // Status weight
  switch (app.status) {
    case "approved":
      score += 45;
      break;
    case "pending_decision":
      score += 32;
      break;
    case "submitted":
      score += 26;
      break;
    case "refused":
      score += 5;
      break;
    default:
      score += 20;
  }

  // Value weight (up to 25)
  const value = parseMaxValue(app.estimated_value);
  if (value >= 200000) score += 25;
  else if (value >= 100000) score += 20;
  else if (value >= 50000) score += 15;
  else if (value >= 25000) score += 10;
  else score += 5;

  // Recency weight (up to 15) — newer is better
  const age = daysSince(app.submitted_date);
  if (age <= 7) score += 15;
  else if (age <= 21) score += 11;
  else if (age <= 45) score += 7;
  else if (age <= 90) score += 3;

  // Trade category match (up to 15)
  const needed = app.trades_needed.map((t) => t.toLowerCase());
  const matches = tradeTypes.filter((t) =>
    needed.some((n) => n.includes(t) || t.includes(n)),
  );
  if (matches.length >= 2) score += 15;
  else if (matches.length === 1) score += 9;

  // Recent high-value submitted bump
  if (app.status === "submitted" && value >= 100000 && age <= 14) score += 5;

  // Documents available signals a real, progressing application
  if (app.documents_available) score += 3;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const band = getScoreBand(score);
  return { score, band, bandColor: BAND_COLORS[band] };
};

// ── Best Action ──────────────────────────────────────────────────────────────
export interface BestAction {
  label: string;
  explanation: string;
}

export const getBestAction = (app: PlanningApp): BestAction => {
  switch (app.status) {
    case "approved":
      return {
        label: "Send intro now",
        explanation:
          "Planning appears approved, so the homeowner may now be gathering quotes. Create a ProGrafter invite link and approach them professionally using your verified profile.",
      };
    case "pending_decision":
      return {
        label: "Monitor decision",
        explanation:
          "This application is awaiting decision. Monitor it and prepare a soft introduction if it progresses.",
      };
    case "submitted":
      return {
        label: "Save for follow-up",
        explanation:
          "This application has been submitted but is not yet approved, so the homeowner may not be ready to appoint trades. Save it and set a follow-up for after the planning decision.",
      };
    case "refused":
      return {
        label: "No action",
        explanation:
          "This application appears refused. Usually no action is needed unless a redesign or appeal follows.",
      };
    default:
      return {
        label: "Monitor decision",
        explanation: "Keep an eye on this opportunity as it develops.",
      };
  }
};

// ── Planning stage explainers ────────────────────────────────────────────────
export const getStageExplainer = (status: string): string => {
  switch (status) {
    case "submitted":
      return "Early stage. Homeowner may not be ready for quotes yet.";
    case "pending_decision":
      return "Monitor. Good time to prepare a soft introduction.";
    case "approved":
      return "Strong opportunity. Homeowner may now be gathering quotes.";
    case "refused":
      return "Usually no action unless a redesign or appeal follows.";
    default:
      return "";
  }
};

// ── Top status message (reworded, ProGrafter-aligned) ────────────────────────
export const getTopStatusMessage = (status: string): string => {
  switch (status) {
    case "submitted":
      return "This application may become a live quoting opportunity. Save it, set a follow-up, or create a ProGrafter invite link to approach professionally.";
    case "approved":
      return "Planning appears approved. The homeowner may now be gathering quotes. Use a ProGrafter invite link so they can view your verified profile and submit project details safely.";
    case "pending_decision":
      return "This application is still awaiting decision. Monitor it and prepare a soft introduction if it progresses.";
    case "refused":
      return "This application appears refused. Usually no action is needed unless a redesign or appeal follows.";
    default:
      return "";
  }
};

// ── Timing guidance ──────────────────────────────────────────────────────────
export const getTimingGuidance = (app: PlanningApp): string => {
  const age = daysSince(app.submitted_date);
  switch (app.status) {
    case "submitted":
      return `Submitted ${age} day${age === 1 ? "" : "s"} ago. Typical householder planning decisions are often targeted around 8 weeks, subject to council workload.`;
    case "pending_decision":
      return "Decision may be approaching. Monitor and prepare a soft introduction.";
    case "approved":
      return "Planning appears approved. Homeowner may now be gathering quotes.";
    case "refused":
      return "Usually no action unless a redesign or appeal follows.";
    default:
      return "";
  }
};

// ── Recommended next step ────────────────────────────────────────────────────
export const getRecommendedNextStep = (app: PlanningApp): string => {
  switch (app.status) {
    case "approved":
      return "This is a stronger opportunity. Create a ProGrafter invite link and approach the homeowner professionally using your verified profile.";
    case "submitted":
      return "This is worth tracking but may be early. Save the opportunity and set a follow-up for after the planning decision.";
    case "pending_decision":
      return "Keep this on your radar. Prepare a soft introduction ready for when a decision is issued.";
    case "refused":
      return "No action needed for now. Only revisit if the homeowner submits a redesign or lodges an appeal.";
    default:
      return "Save the opportunity to keep it in your pipeline.";
  }
};

// ── Planning type helper labels ──────────────────────────────────────────────
export const getPlanningTypeLabel = (type: string): { label: string; helper: string } => {
  const t = (type || "").toLowerCase();
  if (t.includes("householder")) {
    return {
      label: "Householder application",
      helper:
        "Residential homeowner application, usually extensions, alterations or domestic works.",
    };
  }
  if (t.includes("full")) {
    return {
      label: "Full planning application",
      helper: "Larger or more complex works requiring full planning assessment.",
    };
  }
  return { label: type, helper: "" };
};

// ── Likely Work Packages ─────────────────────────────────────────────────────
export interface WorkPackageGroup {
  group: string;
  items: string[];
}

const PKG_KEYWORDS: { pkg: string; group: string; match: RegExp }[] = [
  { pkg: "General builder / main contractor", group: "Structure", match: /extension|conversion|dwelling|build|knock|barn|storey/i },
  { pkg: "Groundworks", group: "Structure", match: /extension|dwelling|new build|foundation|barn|garage/i },
  { pkg: "Brickwork / blockwork", group: "Structure", match: /extension|brick|render|dwelling|wall|storey/i },
  { pkg: "Structural steel / knock-through", group: "Structure", match: /knock|steel|open plan|through|two-storey|structural/i },
  { pkg: "Roofing", group: "Envelope", match: /roof|loft|dormer|extension|storey|flat roof/i },
  { pkg: "Glazing / bi-folds / roof lantern", group: "Envelope", match: /bi-?fold|glaz|lantern|window|door|bay/i },
  { pkg: "Plastering", group: "Internal", match: /extension|conversion|plaster|loft|garage|dwelling/i },
  { pkg: "Electrics", group: "Internal", match: /extension|rewire|electric|kitchen|loft|conversion|dwelling|room/i },
  { pkg: "Plumbing / heating", group: "Internal", match: /kitchen|diner|bathroom|en-?suite|plumb|heating|dwelling/i },
  { pkg: "Kitchen installation", group: "Internal", match: /kitchen|diner/i },
  { pkg: "Decorating / making good", group: "Internal", match: /extension|conversion|decorat|room|loft|dwelling/i },
  { pkg: "Landscaping", group: "External", match: /landscap|garden|driveway|patio|outbuilding|garden room/i },
  { pkg: "Waste removal", group: "External", match: /demolition|demolish|conversion|extension|clearance/i },
];

export const getWorkPackages = (app: PlanningApp): WorkPackageGroup[] => {
  const desc = app.description || "";
  const hit = new Set<string>();
  const grouped: Record<string, string[]> = {};

  for (const { pkg, group, match } of PKG_KEYWORDS) {
    if (match.test(desc) && !hit.has(pkg)) {
      hit.add(pkg);
      (grouped[group] ||= []).push(pkg);
    }
  }

  // Always include a certification prompt for domestic building work
  if (Object.keys(grouped).length) {
    (grouped["Compliance"] ||= []).push("Building Control / certification prompts");
  }

  const order = ["Structure", "Envelope", "Internal", "External", "Compliance"];
  return order
    .filter((g) => grouped[g]?.length)
    .map((g) => ({ group: g, items: grouped[g] }));
};

// ── Intro letter generator ───────────────────────────────────────────────────
export interface TradeIdentity {
  name: string;
  company_name: string;
  trade_type: string;
}

export const generateIntroLetter = (
  app: PlanningApp,
  trade: TradeIdentity,
  inviteUrl: string,
): string => {
  const area = app.address.split(",").pop()?.trim() || app.postcode;
  const project = describeProject(app);
  const tradeLabel = (trade.trade_type || "tradesperson").toLowerCase();
  const company = trade.company_name || trade.name;

  return `Dear Homeowner,

I noticed your planning application (${app.id}) for ${project} in ${area}, using publicly available planning information.

I'm ${trade.name} of ${company}, a local ProGrafter-verified ${tradeLabel}. If you're gathering quotes for this project, I'd be happy to help — there's no obligation.

You can view my verified ProGrafter profile — including my verification, insurance and qualification status — and submit your project details securely here:

${inviteUrl}

Everything goes through ProGrafter, so your details stay protected and you stay in control. If you'd prefer not to be contacted again, just let me know and I'll respect that.

Kind regards,
${trade.name}
${company}
ProGrafter-verified ${tradeLabel}`;
};

const describeProject = (app: PlanningApp): string => {
  const d = (app.description || "").toLowerCase();
  if (d.includes("loft")) return "your loft conversion";
  if (d.includes("rear extension")) return "your rear extension";
  if (d.includes("side extension")) return "your side extension";
  if (d.includes("extension")) return "your extension";
  if (d.includes("conversion")) return "your conversion project";
  if (d.includes("garage")) return "your garage project";
  return "your home project";
};

// ── ProGrafter Outreach Code ─────────────────────────────────────────────────
export const OUTREACH_CODE: string[] = [
  "Be honest about how you found the project.",
  "Do not imply you are connected to the council.",
  "Do not pressure the homeowner.",
  "Be clear that contact is no obligation.",
  "Use your verified ProGrafter profile link.",
  "Keep communication professional.",
  "If asked not to contact again, respect it.",
];

// ── Pipeline statuses ────────────────────────────────────────────────────────
export type PipelineStatus = "new" | "saved" | "contacted" | "follow_up" | "converted" | "dismissed";

export const PIPELINE_TABS: { id: PipelineStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "saved", label: "Saved" },
  { id: "contacted", label: "Contacted" },
  { id: "follow_up", label: "Follow-ups" },
  { id: "converted", label: "Converted" },
  { id: "dismissed", label: "Dismissed" },
];

// ── Feature gating ───────────────────────────────────────────────────────────
export type AccessLevel = "founding" | "free" | "pro" | "plus";

export interface PlanningFeatures {
  can_generate_intro_letters: boolean;
  can_create_homeowner_invite_links: boolean;
  can_use_opportunity_scores: boolean;
  can_use_follow_up_reminders: boolean;
  can_use_full_detail_panel: boolean;
}

export const DEFAULT_FEATURES: Record<AccessLevel, PlanningFeatures> = {
  founding: {
    can_generate_intro_letters: true,
    can_create_homeowner_invite_links: true,
    can_use_opportunity_scores: true,
    can_use_follow_up_reminders: true,
    can_use_full_detail_panel: true,
  },
  free: {
    can_generate_intro_letters: false,
    can_create_homeowner_invite_links: false,
    can_use_opportunity_scores: false,
    can_use_follow_up_reminders: false,
    can_use_full_detail_panel: false,
  },
  pro: {
    can_generate_intro_letters: false,
    can_create_homeowner_invite_links: false,
    can_use_opportunity_scores: true,
    can_use_follow_up_reminders: true,
    can_use_full_detail_panel: true,
  },
  plus: {
    can_generate_intro_letters: true,
    can_create_homeowner_invite_links: true,
    can_use_opportunity_scores: true,
    can_use_follow_up_reminders: true,
    can_use_full_detail_panel: true,
  },
};

export const resolveFeatures = (
  level: AccessLevel,
  overrides?: Partial<PlanningFeatures> | null,
): PlanningFeatures => ({
  ...DEFAULT_FEATURES[level],
  ...(overrides || {}),
});

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  founding: "Planning Intelligence — internal access enabled.",
  free: "Free Verified Trade",
  pro: "Planning Intelligence Pro",
  plus: "Planning Intelligence Plus",
};

// Generate a URL-safe token for invite links
export const generateInviteToken = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};
