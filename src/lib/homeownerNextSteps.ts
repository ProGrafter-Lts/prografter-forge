/**
 * Derives the homeowner's ordered "Your Next Steps" task list from data that is
 * already loaded on the dashboard. Pure + presentation-agnostic: it returns
 * intent + an action descriptor, and the component decides how to navigate.
 */

export type NextStepPriority = "high" | "medium" | "low";

export type NextStepAction =
  | { kind: "tab"; tab: string }
  | { kind: "drawer"; path: string }
  | { kind: "link"; href: string };

export interface NextStep {
  id: string;
  priority: NextStepPriority;
  title: string;
  description: string;
  estTime: string;
  ctaLabel: string;
  action: NextStepAction;
}

interface Quote {
  id: string;
  status: string;
  job_id: string;
  jobs?: { title: string | null; job_type: string } | null;
}
interface Variation {
  id: string;
  job_id: string;
  title?: string | null;
}
interface Brief {
  id: string;
  job_title?: string | null;
  status?: string | null;
}
interface Job {
  id: string;
  title?: string | null;
  job_type?: string;
}
interface SiteUpdate {
  id: string;
  update_text?: string;
  created_at: string;
}

interface Inputs {
  jobs: Job[];
  quotes: Quote[];
  variations: Variation[];
  briefs: Brief[];
  siteUpdates: SiteUpdate[];
  freeChecks: number;
  hasPassword: boolean;
}

const PRIORITY_ORDER: Record<NextStepPriority, number> = { high: 0, medium: 1, low: 2 };

const jobLabel = (q: Quote) => q.jobs?.title || q.jobs?.job_type || "your project";

export function buildNextSteps(input: Inputs): NextStep[] {
  const { jobs, quotes, variations, briefs, siteUpdates, freeChecks, hasPassword } = input;
  const steps: NextStep[] = [];

  // No projects at all → the single most important action is posting a job.
  if (jobs.length === 0 && briefs.length === 0) {
    steps.push({
      id: "post-first-job",
      priority: "high",
      title: "Post your first job",
      description: "Tell us about your project and we'll match you with up to three vetted local trades.",
      estTime: "5 mins",
      ctaLabel: "Post a Job",
      action: { kind: "link", href: "/post-a-job" },
    });
  }

  // Pending quotes awaiting a decision.
  const pendingQuotes = quotes.filter((q) => q.status === "pending");
  if (pendingQuotes.length > 0) {
    const q = pendingQuotes[0];
    steps.push({
      id: `review-quote-${q.id}`,
      priority: "high",
      title: pendingQuotes.length > 1 ? "Review new quotes" : "Review new quote",
      description: `A new quote has arrived for your ${jobLabel(q)}. Review it before you accept.`,
      estTime: "5 mins",
      ctaLabel: "Review Quote",
      action: { kind: "tab", tab: "quotes" },
    });

    // Recommend an AI Quote Checker review before committing (esp. while free).
    steps.push({
      id: "run-quote-check",
      priority: "medium",
      title: "Run AI Quote Checker",
      description:
        freeChecks > 0
          ? "Before accepting, run a free AI review to spot missing items, unclear wording and questions worth asking."
          : "Before accepting, run an AI review to spot missing items, unclear wording and questions worth asking.",
      estTime: "2 mins",
      ctaLabel: freeChecks > 0 ? "Run free Quote Check" : "Run Quote Checker",
      action: { kind: "link", href: "/quote-checker" },
    });
  }

  // Pending variations / change requests need a response.
  if (variations.length > 0) {
    const v = variations[0];
    steps.push({
      id: `variation-${v.id}`,
      priority: "high",
      title: "Respond to a change request",
      description: `Your tradesperson has raised "${v.title || "a variation"}" that needs your approval before work continues.`,
      estTime: "3 mins",
      ctaLabel: "Review Request",
      action: { kind: "drawer", path: `/project/${v.job_id}` },
    });
  }

  // Recent site update (within the last 7 days) → nudge to view progress.
  const recentUpdate = siteUpdates.find(
    (u) => Date.now() - new Date(u.created_at).getTime() < 7 * 86400000,
  );
  if (recentUpdate) {
    steps.push({
      id: `update-${recentUpdate.id}`,
      priority: "low",
      title: "View latest progress",
      description: "Your tradesperson has posted a new update on your project.",
      estTime: "1 min",
      ctaLabel: "View Update",
      action: { kind: "tab", tab: "projects" },
    });
  }

  // Account security: set a password to skip the email link next time.
  if (!hasPassword) {
    steps.push({
      id: "set-password",
      priority: "low",
      title: "Set an account password",
      description: "Add a password so you can sign straight back in without waiting for an email link.",
      estTime: "1 min",
      ctaLabel: "Set Password",
      action: { kind: "tab", tab: "profile" },
    });
  }

  return steps.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

