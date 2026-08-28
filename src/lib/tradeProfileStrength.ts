// Trade profile strength + "Today's Priorities" logic.
// Pure helpers so the dashboard can render an action-led command centre.

import type { VaultDocument, DashboardVerification } from "@/lib/tradeVault";
import { computeVaultSummary } from "@/lib/tradeVault";

export type ChecklistState = "complete" | "missing" | "optional" | "coming_soon";

export interface ChecklistItem {
  key: string;
  label: string;
  state: ChecklistState;
  /** Optional items don't count against the score. */
  weightable: boolean;
}

export interface ProfileStrength {
  percent: number;
  label: "Incomplete" | "Improving" | "Strong" | "Complete";
  items: ChecklistItem[];
}

export interface TradeStrengthInput {
  bio: string | null;
  phone: string | null;
  postcode: string | null;
  trade_type: string | null;
  name: string | null;
  service_radius_miles: number | null;
  public_liability_insurer: string | null;
  insurance_cert_url: string | null;
  business_logo_path: string | null;
  verified: boolean;
  hasQualification: boolean;
  specialismCount: number;
  portfolioCount: number;
  calendarConnected: boolean;
  vaultDocs: VaultDocument[];
}

const strengthLabel = (percent: number): ProfileStrength["label"] => {
  if (percent >= 100) return "Complete";
  if (percent >= 80) return "Strong";
  if (percent >= 40) return "Improving";
  return "Incomplete";
};

export const computeProfileStrength = (t: TradeStrengthInput): ProfileStrength => {
  const summary = computeVaultSummary(t.vaultDocs, t.trade_type);
  const vaultComplete = summary.missingRequired.length === 0 && t.vaultDocs.length > 0;

  const insuranceDone =
    !!t.public_liability_insurer || !!t.insurance_cert_url || t.verified;
  const qualificationsDone = t.hasQualification || t.verified;

  const items: ChecklistItem[] = [
    {
      key: "basic",
      label: "Basic details",
      state: t.name && t.trade_type ? "complete" : "missing",
      weightable: true,
    },
    {
      key: "phone",
      label: "Phone number",
      state: t.phone ? "complete" : "missing",
      weightable: true,
    },
    {
      key: "insurance",
      label: "Insurance",
      state: insuranceDone ? "complete" : "missing",
      weightable: true,
    },
    {
      key: "qualifications",
      label: "Qualifications",
      state: qualificationsDone ? "complete" : "missing",
      weightable: true,
    },
    {
      key: "specialisms",
      label: "Specialisms",
      state: t.specialismCount > 0 ? "complete" : "missing",
      weightable: true,
    },
    {
      key: "radius",
      label: "Service radius",
      state: (t.service_radius_miles ?? 0) > 0 ? "complete" : "missing",
      weightable: true,
    },
    {
      key: "bio",
      label: "Bio",
      state: t.bio && t.bio.trim().length > 0 ? "complete" : "missing",
      weightable: true,
    },
    {
      key: "photos",
      label: "Photos",
      state:
        t.business_logo_path || t.portfolioCount > 0 ? "complete" : "optional",
      weightable: false,
    },
    {
      key: "calendar",
      label: "Calendar",
      state: t.calendarConnected ? "complete" : "optional",
      weightable: false,
    },
    {
      key: "tradevault",
      label: "TradeVault",
      state: vaultComplete ? "complete" : "missing",
      weightable: true,
    },
  ];

  const weightable = items.filter((i) => i.weightable);
  const done = weightable.filter((i) => i.state === "complete").length;
  const percent = Math.round((done / weightable.length) * 100);

  return { percent, label: strengthLabel(percent), items };
};

// ── Today's Priorities ────────────────────────────────────────────────────────

export type PriorityTarget =
  | "tradevault"
  | "profile"
  | "specialisms"
  | "settings"
  | "planning"
  | "jobs";

export interface Priority {
  key: string;
  title: string;
  text: string;
  cta: string;
  target: PriorityTarget;
  badge?: string;
}

export interface PriorityInput {
  strength: ProfileStrength;
  verification: DashboardVerification;
  vaultDocs: VaultDocument[];
  specialismCount: number;
  bio: string | null;
  calendarConnected: boolean;
  planningOpportunities: number;
  jobMatchCount: number;
}

export const computePriorities = (input: PriorityInput): Priority[] => {
  const priorities: Priority[] = [];
  const summary = computeVaultSummary(input.vaultDocs);
  const hasVaultDocs = input.vaultDocs.some((d) => d.is_current && d.file_url);

  // 1. Legacy manual verified with no TradeVault docs → migration.
  if (input.verification.migrationRequired) {
    priorities.push({
      key: "vault-migrate",
      title: "Move your documents into TradeVault",
      text: "Your documents were manually reviewed before TradeVault was introduced. Please upload copies to TradeVault so your verification stays complete and renewal reminders can work properly.",
      cta: "Upload Documents",
      target: "tradevault",
      badge: "Grace period",
    });
  } else if (summary.missingRequired.length > 0) {
    // 2. Missing required TradeVault documents.
    priorities.push({
      key: "vault",
      title: "Complete your TradeVault",
      text: "Upload your required insurance, qualification and trade documents so ProGrafter can keep your verification record complete.",
      cta: "Open TradeVault",
      target: "tradevault",
    });
  }

  // 3. Specialisms missing.
  if (input.specialismCount === 0) {
    priorities.push({
      key: "specialisms",
      title: "Add your specialisms",
      text: "Tell homeowners what kind of projects you take on so ProGrafter can match better jobs to your profile.",
      cta: "Add Specialisms",
      target: "specialisms",
    });
  }

  // 4. Bio missing.
  if (!input.bio || input.bio.trim().length === 0) {
    priorities.push({
      key: "bio",
      title: "Write your trade profile",
      text: "Add a short description of your work, experience and the type of jobs you want.",
      cta: "Complete Profile",
      target: "profile",
    });
  }

  // 5. Calendar not connected.
  if (!input.calendarConnected) {
    priorities.push({
      key: "calendar",
      title: "Connect your calendar",
      text: "Add ProGrafter project dates, payment milestones, quote deadlines and reminders to your calendar.",
      cta: "Connect Calendar",
      target: "settings",
    });
  }

  // 6. Planning opportunities available.
  if (input.planningOpportunities > 0) {
    priorities.push({
      key: "planning",
      title: "Review local planning opportunities",
      text: "New planning applications have appeared in your area. Save, follow up or create a ProGrafter invite link.",
      cta: "View Planning Intelligence",
      target: "planning",
    });
  } else if (input.jobMatchCount === 0) {
    // 7. No available jobs → proactive.
    priorities.push({
      key: "no-jobs",
      title: "Check proactive opportunities",
      text: "No matched homeowner jobs yet. Use Planning Intelligence to track upcoming local projects.",
      cta: "View Planning Intelligence",
      target: "planning",
    });
  }

  // 8. Profile below 80%.
  if (input.strength.percent < 80) {
    priorities.push({
      key: "profile-strength",
      title: "Improve your profile strength",
      text: "Complete your profile to improve trust and increase your chances of receiving suitable jobs.",
      cta: "Improve Profile",
      target: "profile",
    });
  }

  return priorities.slice(0, 5);
};
