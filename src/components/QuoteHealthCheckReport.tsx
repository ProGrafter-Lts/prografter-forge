import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Printer,
  Copy,
  Check,
  ClipboardList,
  MessageSquareText,
  ChevronDown,
  ShieldCheck,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CalendarDays,
} from "lucide-react";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import logoLight from "@/assets/prografter-logo-light.png.asset.json";

interface ReportJson {
  // New structured fields
  checker_type?: string;
  quality_score?: number;
  document_score?: number;
  project_confidence_score?: number;
  recommendation_summary?: string;
  score_breakdown?: Array<{
    category: string;
    quote_score?: number;
    confidence_score?: number;
    status?: string;
    source?: string;
    note?: string;
  }>;
  completeness_pct?: number;
  risk_level?: "Low" | "Medium" | "High" | "Critical";
  project_confidence?: "Low" | "Medium" | "High";
  recommended_next_step?: string;
  comparison_readiness?: string;
  certification_readiness?: string;
  top_issues?: string[];
  what_to_do_next?: string[];
  builder_message?: string;
  questions_list?: string[];
  // Optional structured flags / strip (used if the analysis provides them,
  // otherwise derived from the report content — analysis logic is unchanged).
  green_flags?: string[];
  amber_flags?: string[];
  red_flags?: string[];
  project_type?: string;
  quote_value?: string;
  // Legacy / shared
  score_addressed?: number;
  assessment?: "Ready to Accept" | "Needs Clarification" | "Significant Concerns";
  report_html?: string;
}

/* ------------------------------------------------------------------ */
/* HTML parsing helpers — split the AI report_html into named sections  */
/* so we can re-order them, add intros and make them collapsible.       */
/* ------------------------------------------------------------------ */

interface ParsedSection {
  heading: string;
  html: string;
}

const parseSections = (html: string): ParsedSection[] => {
  if (!html || typeof window === "undefined") return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("section")).map((sec) => {
      const clone = sec.cloneNode(true) as HTMLElement;
      clone.querySelector("h2")?.remove();
      return {
        heading: sec.querySelector("h2")?.textContent?.trim() || "",
        html: clone.innerHTML.trim(),
      };
    });
  } catch {
    return [];
  }
};

/** Pull the plain text of every <li> in a fragment of HTML. */
const extractItems = (html?: string): string[] => {
  if (!html || typeof window === "undefined") return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("li"))
      .map((li) => li.textContent?.replace(/\s+/g, " ").trim() || "")
      .filter(Boolean);
  } catch {
    return [];
  }
};

interface QuestionGroup {
  group: string | null;
  items: string[];
}

const parseQuestionGroups = (html: string): QuestionGroup[] => {
  if (!html || typeof window === "undefined") return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const groups: QuestionGroup[] = [];
    let current: QuestionGroup = { group: null, items: [] };
    doc.body.childNodes.forEach((node) => {
      const el = node as HTMLElement;
      if (el.nodeName === "H3") {
        if (current.items.length) groups.push(current);
        current = { group: el.textContent?.trim() || null, items: [] };
      } else if (el.nodeName === "UL" || el.nodeName === "OL") {
        el.querySelectorAll("li").forEach((li) => {
          const t = li.textContent?.trim();
          if (t) current.items.push(t);
        });
      }
    });
    if (current.items.length) groups.push(current);
    return groups;
  } catch {
    return [];
  }
};

/* ------------------------------------------------------------------ */
/* Small reusable pieces                                               */
/* ------------------------------------------------------------------ */

const useCopy = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success(message);
      trackEvent("quote_copy", { key });
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      toast.error("Couldn't copy — please copy manually.");
    }
  };
  return { copied, copy };
};

const SectionCard = ({
  title,
  intro,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="qr-section2">
      <div className="qr-section2-head">
        <div>
          <h2 className="qr-section2-title">{title}</h2>
          {intro && <p className="qr-section2-intro">{intro}</p>}
        </div>
        {collapsible && (
          <button
            type="button"
            className="qr-collapse-btn no-print"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide" : "Show"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      <div className={`qr-section2-body${collapsible && !open ? " qr-collapsed" : ""}`}>{children}</div>
    </section>
  );
};

const RawHtml = ({ html }: { html: string }) => (
  <div className="qr-report qr-tablewrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
);

/** Branded teal/amber callout that breaks up long text. */
const Insight = ({
  title,
  children,
  tone = "teal",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "teal" | "amber";
}) => (
  <div className={`qr-insight qr-insight-${tone}`}>
    <div className="qr-insight-icon">
      {tone === "amber" ? <AlertTriangle className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
    </div>
    <div>
      <div className="qr-insight-title">{title}</div>
      <p className="qr-insight-body">{children}</p>
    </div>
  </div>
);

const DisclaimerBanner = () => (
  <div className="qr-disclaimer">
    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
    <div>
      ProGrafter's Quote Health Check is guidance only. It is based on the information provided in the
      uploaded quote and does not replace professional legal, surveying, structural, tax or building
      control advice. Pricing, VAT, compliance and scope should be confirmed directly with the
      contractor and relevant professionals before work begins.
    </div>
  </div>
);

const riskClass = (level?: string) => {
  switch ((level || "").toLowerCase()) {
    case "low": return "qr-badge qr-badge-low";
    case "medium": return "qr-badge qr-badge-medium";
    case "high": return "qr-badge qr-badge-high";
    case "critical": return "qr-badge qr-badge-critical";
    default: return "qr-badge qr-badge-medium";
  }
};

const confidenceClass = (level?: string) => {
  switch ((level || "").toLowerCase()) {
    case "high": return "qr-badge qr-badge-low";
    case "medium": return "qr-badge qr-badge-medium";
    case "low": return "qr-badge qr-badge-high";
    default: return "qr-badge qr-badge-medium";
  }
};

/* ------------------------------------------------------------------ */
/* 1. Branded report hero                                              */
/* ------------------------------------------------------------------ */

const ReportHero = ({
  riskLevel,
  quoteValue,
  projectType,
}: {
  riskLevel?: string;
  quoteValue?: string;
  projectType?: string;
}) => {
  const generated = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <header className="qr-hero">
      <div className="qr-hero-top">
        <img src={logoLight.url} alt="ProGrafter" className="qr-hero-logo" />
        <span className="qr-hero-kicker">Quote Health Check</span>
      </div>
      <div className="qr-hero-rule" />
      <h1 className="qr-hero-title">Quote Health Check</h1>
      <p className="qr-hero-prepared">Prepared by ProGrafter · Independent quote intelligence</p>

      <div className="qr-hero-meta">
        {projectType && (
          <div className="qr-hero-metaitem">
            <span className="qr-hero-metalabel">Project</span>
            <span className="qr-hero-metavalue">{projectType}</span>
          </div>
        )}
        {quoteValue && (
          <div className="qr-hero-metaitem">
            <span className="qr-hero-metalabel">Quote value</span>
            <span className="qr-hero-metavalue">{quoteValue}</span>
          </div>
        )}
        {riskLevel && (
          <div className="qr-hero-metaitem">
            <span className="qr-hero-metalabel">Risk level</span>
            <span className={`qr-hero-risk qr-hero-risk-${riskLevel.toLowerCase()}`}>{riskLevel}</span>
          </div>
        )}
        <div className="qr-hero-metaitem">
          <span className="qr-hero-metalabel">Generated</span>
          <span className="qr-hero-metavalue">
            <CalendarDays className="h-3.5 w-3.5" style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />
            {generated}
          </span>
        </div>
      </div>

      <p className="qr-hero-desc">
        A practical review of quote clarity, missing items, risk areas and questions to ask before
        accepting.
      </p>
    </header>
  );
};

/* ------------------------------------------------------------------ */
/* 2. Upgraded score dashboard                                        */
/* ------------------------------------------------------------------ */

const scoreExplain = (score?: number) => {
  if (typeof score !== "number") return "";
  if (score >= 85) return "Strong, well-detailed quote with few gaps.";
  if (score >= 70) return "Solid detail, but a few items need confirming.";
  if (score >= 55) return "Useful detail, but key commercial terms are missing.";
  if (score >= 40) return "Important gaps — clarify before you commit.";
  return "Significant detail is missing from this quote.";
};

const riskExplain = (level?: string) => {
  switch ((level || "").toLowerCase()) {
    case "low": return "Reasonable to proceed after minor checks.";
    case "medium": return "Confirm the open items in writing first.";
    case "high": return "Do not proceed until clarified in writing.";
    case "critical": return "Major omissions — request a revised quote.";
    default: return "";
  }
};

const completenessExplain = (pct?: number) => {
  if (typeof pct !== "number") return "";
  if (pct >= 80) return "Most expected scope appears covered.";
  if (pct >= 60) return "Good coverage, with some scope unaccounted for.";
  return "Notable parts of the expected scope aren't clearly covered.";
};

const confidenceExplain = (level?: string) => {
  switch ((level || "").toLowerCase()) {
    case "high": return "Enough detail to plan with confidence.";
    case "medium": return "Workable, but firm up the unknowns.";
    case "low": return "Too many unknowns to rely on as-is.";
    default: return "";
  }
};

const barTone = (pct: number) =>
  pct >= 70 ? "good" : pct >= 45 ? "warn" : "bad";

const Ring = ({ value }: { value: number }) => {
  const tone = barTone(value);
  const dash = Math.max(0, Math.min(100, value));
  return (
    <div className={`qr-ring qr-ring-${tone}`}>
      <svg viewBox="0 0 36 36" className="qr-ring-svg" aria-hidden="true">
        <path className="qr-ring-bg" d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31" />
        <path
          className="qr-ring-fg"
          strokeDasharray={`${dash}, 100`}
          d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31"
        />
      </svg>
      <div className="qr-ring-label">
        <span className="qr-ring-num">{value}</span>
        <span className="qr-ring-den">/100</span>
      </div>
    </div>
  );
};

/** Executive dashboard rendered from the structured JSON fields. */
const Dashboard = ({ report }: { report: ReportJson }) => {
  const hasNew =
    typeof report.quality_score === "number" ||
    typeof report.completeness_pct === "number" ||
    !!report.risk_level;

  const qualityScore =
    typeof report.quality_score === "number"
      ? report.quality_score
      : typeof report.score_addressed === "number"
        ? Math.round((report.score_addressed / 43) * 100)
        : undefined;

  if (!hasNew && typeof qualityScore !== "number") return null;

  return (
    <section className="qr-section2">
      <div className="qr-section2-head">
        <div>
          <h2 className="qr-section2-title">Quote Health Dashboard</h2>
          <p className="qr-section2-intro">An at-a-glance view of how clear and complete this quote is.</p>
        </div>
      </div>

      <div className="qr-dash2">
        {typeof qualityScore === "number" && (
          <div className="qr-metric2 qr-metric2-hero">
            <div className="qr-metric-label">Quote Quality Score</div>
            <div className="qr-metric2-ringrow">
              <Ring value={qualityScore} />
              <p className="qr-metric2-explain">{scoreExplain(qualityScore)}</p>
            </div>
          </div>
        )}

        {typeof report.completeness_pct === "number" && (
          <div className="qr-metric2">
            <div className="qr-metric-label">Completeness</div>
            <div className="qr-metric2-value">{report.completeness_pct}%</div>
            <div className={`qr-bar qr-bar-${barTone(report.completeness_pct)}`}>
              <span style={{ width: `${Math.max(4, Math.min(100, report.completeness_pct))}%` }} />
            </div>
            <p className="qr-metric2-explain">{completenessExplain(report.completeness_pct)}</p>
          </div>
        )}

        {report.risk_level && (
          <div className="qr-metric2">
            <div className="qr-metric-label">Risk Level</div>
            <div style={{ marginTop: "0.4rem" }}>
              <span className={riskClass(report.risk_level)}>{report.risk_level}</span>
            </div>
            <p className="qr-metric2-explain">{riskExplain(report.risk_level)}</p>
          </div>
        )}

        {report.project_confidence && (
          <div className="qr-metric2">
            <div className="qr-metric-label">Project Confidence</div>
            <div style={{ marginTop: "0.4rem" }}>
              <span className={confidenceClass(report.project_confidence)}>{report.project_confidence}</span>
            </div>
            <p className="qr-metric2-explain">{confidenceExplain(report.project_confidence)}</p>
          </div>
        )}
      </div>

      {report.recommended_next_step && (
        <div className="qr-nextstep2">
          <div className="qr-nextstep2-icon"><ShieldCheck className="h-4 w-4" /></div>
          <div>
            <div className="qr-metric-label" style={{ color: "#0f766e" }}>Recommended Next Step</div>
            <p className="qr-nextstep2-text">{report.recommended_next_step}</p>
          </div>
        </div>
      )}

      {Array.isArray(report.top_issues) && report.top_issues.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div className="qr-metric-label">Top {Math.min(3, report.top_issues.length)} Issues</div>
          <div className="qr-issues" style={{ marginTop: "0.5rem" }}>
            {report.top_issues.slice(0, 3).map((issue, i) => (
              <div key={i} className="qr-issue"><span>{i + 1}.</span> {issue}</div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* 3. Risk status strip                                               */
/* ------------------------------------------------------------------ */

type PillStatus = "clear" | "confirm" | "missing" | "advisory" | "na";

const PILL_LABEL: Record<PillStatus, string> = {
  clear: "Clear",
  confirm: "Needs confirming",
  missing: "Missing",
  advisory: "Advisory",
  na: "Not applicable",
};

const STRIP_TOPICS: { key: string; label: string; re: RegExp }[] = [
  { key: "vat", label: "VAT Clarity", re: /\bvat\b/i },
  { key: "payment", label: "Payment Terms", re: /payment|deposit|instal(?:ment|l)|stage payment|retention/i },
  { key: "programme", label: "Programme", re: /programme|program|timeline|timescale|start date|completion|duration|schedule|lead[- ]?time/i },
  { key: "scope", label: "Scope Detail", re: /scope|specification|materials|method|works included|breakdown/i },
  { key: "exclusions", label: "Exclusions", re: /exclu|not included|excluded/i },
];

const NEGATIVE_RE = /\b(no|not|missing|absent|none|isn't|does not|doesn't|unclear|unstated|not stated|omit|lacks?)\b/i;

const deriveStrip = (
  includes: string[],
  missing: string[],
  excludes: string[],
): { label: string; status: PillStatus }[] =>
  STRIP_TOPICS.map((t) => {
    const inMissing = missing.filter((m) => t.re.test(m));
    const inIncludes = includes.some((m) => t.re.test(m));
    const inExcludes = excludes.some((m) => t.re.test(m));

    let status: PillStatus = "na";
    if (inMissing.length) {
      status = inMissing.some((m) => NEGATIVE_RE.test(m)) ? "missing" : "confirm";
    } else if (t.key === "exclusions" && (inExcludes || excludes.length)) {
      status = "clear";
    } else if (inIncludes) {
      status = "clear";
    } else if (t.key === "exclusions") {
      status = "advisory";
    }
    return { label: t.label, status };
  });

const RiskStrip = ({ items }: { items: { label: string; status: PillStatus }[] }) => {
  if (!items.some((i) => i.status !== "na")) return null;
  return (
    <section className="qr-section2">
      <div className="qr-section2-head">
        <div>
          <h2 className="qr-section2-title">Risk Status</h2>
          <p className="qr-section2-intro">An instant read on the areas that matter most in any quote.</p>
        </div>
      </div>
      <div className="qr-strip">
        {items.map((it) => (
          <div key={it.label} className="qr-strip-card">
            <div className="qr-strip-label">{it.label}</div>
            <span className={`qr-pill qr-pill-${it.status}`}>{PILL_LABEL[it.status]}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* 4. Red / Amber / Green flags                                       */
/* ------------------------------------------------------------------ */

const QuoteFlags = ({
  green,
  amber,
  red,
}: {
  green: string[];
  amber: string[];
  red: string[];
}) => {
  if (!green.length && !amber.length && !red.length) return null;
  const cols: { tone: "green" | "amber" | "red"; title: string; sub: string; items: string[]; Icon: typeof CheckCircle2 }[] = [
    { tone: "green", title: "Green Flags", sub: "Looks positive or reasonably covered", items: green, Icon: CheckCircle2 },
    { tone: "amber", title: "Amber Flags", sub: "Needs clarification", items: amber, Icon: AlertCircle },
    { tone: "red", title: "Red Flags", sub: "Confirm before proceeding", items: red, Icon: XCircle },
  ];
  return (
    <section className="qr-section2">
      <div className="qr-section2-head">
        <div>
          <h2 className="qr-section2-title">Quote Flags</h2>
          <p className="qr-section2-intro">
            What looks positive, what needs checking, and what should be clarified before accepting.
          </p>
        </div>
      </div>
      <div className="qr-flags">
        {cols.map((c) =>
          c.items.length ? (
            <div key={c.tone} className={`qr-flagcol qr-flagcol-${c.tone}`}>
              <div className="qr-flagcol-head">
                <c.Icon className="h-4 w-4" />
                <div>
                  <div className="qr-flagcol-title">{c.title}</div>
                  <div className="qr-flagcol-sub">{c.sub}</div>
                </div>
              </div>
              <ul className="qr-flaglist">
                {c.items.slice(0, 8).map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </div>
    </section>
  );
};

/** Highlighted "What To Do Next" action plan. */
const WhatToDoNext = ({ actions }: { actions: string[] }) => {
  if (!actions.length) return null;
  return (
    <section className="qr-actionplan">
      <div className="qr-actionplan-head">
        <ClipboardList className="h-5 w-5 shrink-0" />
        <div>
          <h2 className="qr-actionplan-title">What To Do Next</h2>
          <p className="qr-actionplan-sub">Your practical next steps before accepting this quote.</p>
        </div>
      </div>
      <ol className="qr-actionplan-list">
        {actions.map((a, i) => (
          <li key={i}><span>{i + 1}</span>{a}</li>
        ))}
      </ol>
    </section>
  );
};

/** Copyable questions list. */
const QuestionsSection = ({ groups }: { groups: QuestionGroup[] }) => {
  const { copied, copy } = useCopy();
  const all = groups.flatMap((g) => g.items);
  if (!all.length) return null;
  const allText = all.map((q, i) => `${i + 1}. ${q}`).join("\n");

  return (
    <SectionCard
      title="Questions To Ask The Builder"
      intro="Copy any question to raise it directly with the builder."
    >
      <div className="no-print" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className="qr-copyall-btn"
          onClick={() => copy("all-questions", allText, "Questions copied")}
        >
          {copied === "all-questions" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copy All Questions
        </button>
      </div>
      <div className="qr-qgroups">
        {groups.map((g, gi) => (
          <div key={gi} className="qr-qgroup">
            {g.group && <h3 className="qr-qgroup-title">{g.group}</h3>}
            <ul className="qr-qlist">
              {g.items.map((q, qi) => {
                const key = `${gi}-${qi}`;
                return (
                  <li key={qi} className="qr-qitem">
                    <span className="qr-qtext">{q}</span>
                    <button
                      type="button"
                      className="qr-qcopy no-print"
                      aria-label="Copy question"
                      onClick={() => copy(key, q, "Question copied")}
                    >
                      {copied === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

/** Suggested message to send the builder, with copy. */
const BuilderMessage = ({ message }: { message: string }) => {
  const { copied, copy } = useCopy();
  if (!message.trim()) return null;
  return (
    <section className="qr-msgcard">
      <div className="qr-actionplan-head">
        <MessageSquareText className="h-5 w-5 shrink-0" style={{ color: "#0d9488" }} />
        <div>
          <h2 className="qr-section2-title">Suggested Message To Send The Builder</h2>
          <p className="qr-section2-intro">You can copy this message and send it to the builder to clarify the quote.</p>
        </div>
      </div>
      <pre className="qr-msgbox">{message}</pre>
      <button
        type="button"
        className="qr-copyall-btn no-print"
        style={{ marginTop: "0.85rem" }}
        onClick={() => copy("builder-msg", message, "Copied")}
      >
        {copied === "builder-msg" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied === "builder-msg" ? "Copied" : "Copy Message"}
      </button>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* 7. Final recommendation conclusion card                            */
/* ------------------------------------------------------------------ */

const verdictHeadline = (risk?: string): { line: string; tone: "bad" | "warn" | "good" } => {
  switch ((risk || "").toLowerCase()) {
    case "critical":
    case "high":
      return { line: "Do not accept this quote yet.", tone: "bad" };
    case "medium":
      return { line: "Request clarification before proceeding.", tone: "warn" };
    case "low":
      return { line: "Reasonable to proceed once a few details are confirmed.", tone: "good" };
    default:
      return { line: "Request clarification before proceeding.", tone: "warn" };
  }
};

const FinalRecommendation = ({
  report,
  recommendationHtml,
  builderMessage,
  isTrade,
}: {
  report: ReportJson;
  recommendationHtml?: string;
  builderMessage: string;
  isTrade: boolean;
}) => {
  const { copied, copy } = useCopy();
  const v = verdictHeadline(report.risk_level);
  const action =
    report.recommended_next_step ||
    "Request a revised quote showing the missing details clearly before you accept.";

  return (
    <section className={`qr-final qr-final-${v.tone}`}>
      <div className="qr-final-tag">Final Recommendation</div>
      <h2 className="qr-final-headline">{v.line}</h2>

      {recommendationHtml && (
        <div className="qr-final-why qr-report" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(recommendationHtml) }} />
      )}

      <div className="qr-final-action">
        <span className="qr-final-action-label">Recommended action</span>
        <p>{action}</p>
      </div>

      <div className="no-print qr-final-btns">
        <button
          type="button"
          className="qr-final-btn qr-final-btn-primary"
          onClick={() => copy("final-msg", builderMessage, "Message copied")}
        >
          {copied === "final-msg" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy message to builder
        </button>
        {isTrade ? (
          <Link to="/quote-checker" className="qr-final-btn qr-final-btn-ghost" onClick={() => trackEvent("quote_cta", { action: "clearer_docs" })}>
            <ClipboardList className="h-4 w-4" /> Create clearer documentation
          </Link>
        ) : (
          <>
            <Link to="/quote-checker" className="qr-final-btn qr-final-btn-ghost" onClick={() => trackEvent("quote_cta", { action: "clearer_brief" })}>
              <ClipboardList className="h-4 w-4" /> Create clearer project brief
            </Link>
            <Link to="/post-a-job" className="qr-final-btn qr-final-btn-ghost" onClick={() => trackEvent("quote_cta", { action: "matched_trades" })}>
              <ArrowRight className="h-4 w-4" /> Request matched quotes
            </Link>
          </>
        )}
        <button
          type="button"
          className="qr-final-btn qr-final-btn-ghost"
          onClick={() => { trackEvent("quote_cta", { action: "print_report" }); window.print(); }}
        >
          <Printer className="h-4 w-4" /> Download PDF
        </button>
      </div>
    </section>
  );
};

const PostReportCTAs = ({ checkerType }: { checkerType?: string }) => {
  const isTrade = checkerType === "trade_self" || checkerType === "trade_sub";
  const primary =
    "inline-flex items-center gap-1.5 bg-teal text-white font-mono text-xs px-4 py-2.5 rounded-xl hover:bg-teal-hover transition-colors shadow-sm no-underline";
  const secondary =
    "inline-flex items-center gap-1.5 bg-white text-navy border border-border font-mono text-xs px-4 py-2.5 rounded-xl hover:border-teal/50 transition-colors no-underline";

  if (isTrade) {
    return (
      <div className="no-print qr-cta-row" style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        <Link to="/quote-checker" className={primary} onClick={() => trackEvent("quote_cta", { action: "improve_quote" })}>
          Improve this quote before sending <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link to="/apply" className={secondary} onClick={() => trackEvent("quote_cta", { action: "trade_profile" })}>
          Create a ProGrafter trade profile
        </Link>
        <Link to="/quote-checker" className={secondary} onClick={() => trackEvent("quote_cta", { action: "clearer_docs" })}>
          Produce clearer customer documentation
        </Link>
      </div>
    );
  }

  return (
    <div className="no-print qr-cta-row" style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
      <Link to="/post-a-job" className={primary} onClick={() => trackEvent("quote_cta", { action: "matched_trades" })}>
        Request a clearer quote from matched trades <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <button type="button" onClick={() => { trackEvent("quote_cta", { action: "print_questions" }); window.print(); }} className={secondary}>
        <Printer className="h-3.5 w-3.5" /> Download / print full report
      </button>
      <Link to="/dashboard/homeowner" className={secondary} onClick={() => trackEvent("quote_cta", { action: "project_hub" })}>
        Create a Project Hub
      </Link>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Fallback generators (for older reports without the new fields)      */
/* ------------------------------------------------------------------ */

const buildFallbackActions = (report: ReportJson, questions: string[]): string[] => {
  const actions: string[] = [];
  if (Array.isArray(report.top_issues)) {
    report.top_issues.slice(0, 4).forEach((i) => actions.push(`Ask the builder to clarify: ${i}`));
  }
  if (!actions.length) {
    questions.slice(0, 4).forEach((q) => actions.push(q));
  }
  actions.push(report.recommended_next_step || "Request a revised quote before accepting if key items remain unclear.");
  return actions.filter(Boolean).slice(0, 6);
};

const buildFallbackMessage = (questions: string[]): string => {
  const lines = [
    "Hi, thanks for sending the quote.",
    "",
    "Before I make a decision, could you please confirm a few points for me?",
    "",
  ];
  (questions.length
    ? questions
    : [
        "Does the total price include VAT, or would VAT be added separately?",
        "What payment stages would you require?",
        "When would you be able to start and how long do you expect the work to take?",
        "Could you confirm what is included and excluded from the quote?",
      ]
  )
    .slice(0, 8)
    .forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  lines.push("", "Once confirmed, could you please issue a revised quote showing these details clearly?", "", "Thanks.");
  return lines.join("\n");
};

/** Split "missing / unclear" items into amber (needs clarifying) vs red (missing / high risk). */
const splitMissing = (items: string[]): { amber: string[]; red: string[] } => {
  const amber: string[] = [];
  const red: string[] = [];
  items.forEach((it) => {
    if (NEGATIVE_RE.test(it)) red.push(it);
    else amber.push(it);
  });
  return { amber, red };
};

const extractQuoteValue = (figuresHtml?: string): string | undefined => {
  if (!figuresHtml || typeof window === "undefined") return undefined;
  try {
    const doc = new DOMParser().parseFromString(figuresHtml, "text/html");
    const text = doc.body.textContent || "";
    const totalMatch = text.match(/total[^£]*£\s*([\d.,]+)/i);
    if (totalMatch) return `£${totalMatch[1].replace(/[.,]$/, "")}`;
    const anyMatch = text.match(/£\s*([\d.,]+)/);
    if (anyMatch) return `£${anyMatch[1].replace(/[.,]$/, "")}`;
  } catch {
    /* ignore */
  }
  return undefined;
};

const PROJECT_LABELS: Record<string, string> = {
  homeowner: "Homeowner project",
  trade_self: "Trade — own quote",
  trade_sub: "Trade — subcontract quote",
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const QuoteHealthCheckReport = ({ report }: { report: ReportJson }) => {
  const sections = useMemo(() => parseSections(report.report_html || ""), [report.report_html]);

  const find = (kw: string) => sections.find((s) => s.heading.toLowerCase().includes(kw));

  const summary = find("summary");
  const figures = find("figure");
  const includes = find("include");
  const excludes = find("exclude");
  const missing = find("missing or unclear") || find("unclear");
  const scoreBreakdown = find("score breakdown") || find("quality score");
  const comparison = find("comparison");
  const costAreas = find("cost area");
  const questionsSec = sections.find((s) => s.heading.toLowerCase().includes("question"));
  const recommendation = find("recommendation") || find("final");

  const questionGroups = useMemo(
    () =>
      report.questions_list?.length
        ? [{ group: null, items: report.questions_list }]
        : parseQuestionGroups(questionsSec?.html || ""),
    [report.questions_list, questionsSec],
  );
  const flatQuestions = questionGroups.flatMap((g) => g.items);

  const actions = report.what_to_do_next?.length
    ? report.what_to_do_next
    : buildFallbackActions(report, flatQuestions);

  const builderMessage = report.builder_message?.trim() || buildFallbackMessage(flatQuestions);

  // Derive risk strip + R/A/G flags from the report content (or use structured
  // fields if the analysis provides them). Analysis logic itself is unchanged.
  const includeItems = useMemo(() => extractItems(includes?.html), [includes]);
  const missingItems = useMemo(() => extractItems(missing?.html), [missing]);
  const excludeItems = useMemo(() => extractItems(excludes?.html), [excludes]);

  const strip = useMemo(
    () => deriveStrip(includeItems, missingItems, excludeItems),
    [includeItems, missingItems, excludeItems],
  );

  const { amber: derivedAmber, red: derivedRed } = useMemo(
    () => splitMissing(missingItems),
    [missingItems],
  );

  const greenFlags = report.green_flags?.length ? report.green_flags : includeItems;
  const amberFlags = report.amber_flags?.length ? report.amber_flags : derivedAmber;
  const redFlags = report.red_flags?.length
    ? report.red_flags
    : Array.from(new Set([...(report.top_issues || []), ...derivedRed]));

  const quoteValue = report.quote_value || extractQuoteValue(figures?.html);
  const projectType = report.project_type || PROJECT_LABELS[report.checker_type || ""];

  const isTrade = report.checker_type === "trade_self" || report.checker_type === "trade_sub";

  // If parsing produced nothing (older / unusual reports), fall back to the
  // raw HTML so we never lose content.
  const parsedAnything = sections.length > 0;

  return (
    <div className="qr-paper qr-paper-v2 space-y-6">
      {/* 1. Branded hero */}
      <ReportHero riskLevel={report.risk_level} quoteValue={quoteValue} projectType={projectType} />

      <div className="qr-card qr-report-stack">
        {/* 2. Dashboard */}
        <Dashboard report={report} />

        {/* 3. Risk status strip */}
        <RiskStrip items={strip} />

        {/* ProGrafter Insight callout */}
        <div className="qr-section2">
          <Insight title="ProGrafter Insight — why this matters">
            Most quote disputes come from unclear scope, payment expectations or assumptions that were
            never written down. Getting these confirmed in writing now protects both you and the builder.
          </Insight>
        </div>

        {/* 4. Quote flags */}
        <QuoteFlags green={greenFlags} amber={amberFlags} red={redFlags} />

        {/* What To Do Next */}
        <WhatToDoNext actions={actions} />

        {parsedAnything ? (
          <>
            {/* Plain-English Summary */}
            {summary && (
              <SectionCard title="Plain-English Summary" intro="A calm overview of what this quote covers and what to check.">
                <RawHtml html={summary.html} />
              </SectionCard>
            )}

            {/* Quote Figures */}
            {figures && (
              <SectionCard title="Quote Figures" intro="The headline numbers taken directly from the quote.">
                <RawHtml html={figures.html} />
              </SectionCard>
            )}

            {/* What Appears Included */}
            {includes && (
              <SectionCard title="What Appears Included" intro="Items the quote clearly states are covered." collapsible defaultOpen>
                <RawHtml html={includes.html} />
              </SectionCard>
            )}

            {/* What Appears Missing / Unclear */}
            {missing && (
              <SectionCard title="What Is Missing or Unclear" intro="Items not stated or that need confirming before you accept." collapsible defaultOpen>
                <RawHtml html={missing.html} />
              </SectionCard>
            )}

            {/* What Appears Excluded */}
            {excludes && (
              <SectionCard title="What Appears Excluded" intro="Items the quote states are not covered." collapsible defaultOpen={false}>
                <RawHtml html={excludes.html} />
              </SectionCard>
            )}

            {/* ProGrafter Insight — before you pay */}
            <div className="qr-section2">
              <Insight title="Before you pay a deposit" tone="amber">
                Payment stages should be tied to clear work milestones, not vague dates. If VAT is
                excluded, the final price could increase materially — ask for the VAT status in writing.
              </Insight>
            </div>

            {/* Risk Breakdown */}
            {(scoreBreakdown || costAreas || comparison) && (
              <SectionCard title="Risk Breakdown" intro="A closer look at quote quality and areas that may affect cost." collapsible defaultOpen={false}>
                {scoreBreakdown && <RawHtml html={scoreBreakdown.html} />}
                {comparison && <RawHtml html={comparison.html} />}
                {costAreas && <RawHtml html={costAreas.html} />}
              </SectionCard>
            )}

            {/* Questions To Ask (copyable) */}
            <QuestionsSection groups={questionGroups} />

            {/* Suggested Message To Builder */}
            <BuilderMessage message={builderMessage} />
          </>
        ) : (
          <>
            <QuestionsSection groups={questionGroups} />
            <BuilderMessage message={builderMessage} />
            <RawHtml html={report.report_html || ""} />
          </>
        )}

        {/* 7. Final Recommendation conclusion card */}
        <FinalRecommendation
          report={report}
          recommendationHtml={recommendation?.html}
          builderMessage={builderMessage}
          isTrade={isTrade}
        />

        <div style={{ marginTop: "1.5rem" }}>
          <PostReportCTAs checkerType={report.checker_type} />
        </div>
      </div>

      {/* Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};

export default QuoteHealthCheckReport;
