import {
  TRANSACTIONAL_TEMPLATE_NAMES,
  AUTH_TEMPLATE_KEYS,
} from "./emailRegistry.generated";

export type EmailCategory =
  | "auth"
  | "onboarding"
  | "waitlist"
  | "contract"
  | "payments"
  | "quotes"
  | "jobs"
  | "disputes"
  | "project"
  | "system";

export interface EmailCatalogEntry {
  /** Display name in the admin table. */
  name: string;
  category: EmailCategory;
  /** Value stored in email_send_log.template_name. */
  matchKey: string;
  /** True when a template exists in the registry (or it's an auth pipeline). */
  registered: boolean;
}

const AUTH_LABELS: Record<string, string> = {
  signup: "auth_signup_verification",
  recovery: "auth_password_reset",
  email_change: "auth_email_change",
  magiclink: "auth_magic_link",
  invite: "auth_invite",
  reauthentication: "auth_reauthentication",
};

function categorise(name: string): EmailCategory {
  if (name.startsWith("waitlist-")) return "waitlist";
  if (name.startsWith("contract-") || name.startsWith("variation-") || name.startsWith("completion-"))
    return "contract";
  if (name.startsWith("payment-")) return "payments";
  if (name.startsWith("dispute-")) return "disputes";
  if (name.startsWith("quote-") || name.includes("quote")) return "quotes";
  if (name.startsWith("job-brief") || name.startsWith("new-job")) return "jobs";
  if (name.startsWith("project-")) return "project";
  if (
    name.startsWith("trade-") ||
    name.startsWith("homeowner-") ||
    name.startsWith("finish-") ||
    name.startsWith("tradevault-") ||
    name.startsWith("testimonial-")
  )
    return "onboarding";
  return "system";
}

/**
 * Builds the admin email catalog from the generated template registry, the
 * auth pipelines, and any template_name observed in email_send_log (so
 * non-registry senders such as bounce/`system` rows still surface).
 */
export function buildEmailCatalog(observedTemplateNames: string[] = []): EmailCatalogEntry[] {
  const entries = new Map<string, EmailCatalogEntry>();

  for (const key of AUTH_TEMPLATE_KEYS) {
    entries.set(key, {
      name: AUTH_LABELS[key] || key,
      category: "auth",
      matchKey: key,
      registered: true,
    });
  }

  for (const name of TRANSACTIONAL_TEMPLATE_NAMES) {
    entries.set(name, {
      name,
      category: categorise(name),
      matchKey: name,
      registered: true,
    });
  }

  for (const name of observedTemplateNames) {
    if (!name || entries.has(name)) continue;
    entries.set(name, {
      name,
      category: name === "system" ? "system" : categorise(name),
      matchKey: name,
      registered: false,
    });
  }

  return [...entries.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );
}
