import { CheckCircle2, AlertTriangle, ShieldAlert, type LucideIcon } from "lucide-react";

export type AiVerdict = "fair" | "needs_detail" | "high_risk" | null | undefined;

export interface VerdictTheme {
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  // Subtle border-left accent and badge styles using Tailwind utility classes.
  borderClass: string;
  badgeClass: string;
  iconClass: string;
  ringClass: string;
}

const THEMES: Record<NonNullable<AiVerdict>, VerdictTheme> = {
  fair: {
    label: "Quote Checker AI: Fair",
    shortLabel: "Fair",
    description: "Itemised, compliant, within market range",
    icon: CheckCircle2,
    borderClass: "border-l-4 border-l-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    iconClass: "text-emerald-600",
    ringClass: "ring-emerald-200",
  },
  needs_detail: {
    label: "Quote Checker AI: Needs detail",
    shortLabel: "Needs Detail",
    description: "Missing detail — review carefully",
    icon: AlertTriangle,
    borderClass: "border-l-4 border-l-amber-500",
    badgeClass: "bg-amber-50 text-amber-800 border border-amber-200",
    iconClass: "text-amber-600",
    ringClass: "ring-amber-200",
  },
  high_risk: {
    label: "Quote Checker AI: High risk",
    shortLabel: "High Risk",
    description: "Compliance issues detected",
    icon: ShieldAlert,
    borderClass: "border-l-4 border-l-rose-600",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
    iconClass: "text-rose-600",
    ringClass: "ring-rose-200",
  },
};

const NEUTRAL: VerdictTheme = {
  label: "Quote Checker AI: Pending",
  shortLabel: "Pending",
  description: "Not yet analysed",
  icon: AlertTriangle,
  borderClass: "border-l-4 border-l-muted",
  badgeClass: "bg-muted text-muted-foreground border border-border",
  iconClass: "text-muted-foreground",
  ringClass: "ring-border",
};

export const getVerdictTheme = (verdict: AiVerdict): VerdictTheme =>
  verdict && THEMES[verdict] ? THEMES[verdict] : NEUTRAL;
