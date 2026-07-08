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
    weight?: number;
    quote_score?: number;
    confidence_score?: number;
    anchor?: string;
    status?: string;
    source?: string;
    note?: string;
    improvement?: string;
  }>;
  completeness_pct?: number;
  construction_completeness_pct?: number;
  commercial_completeness_pct?: number;
  overall_readiness_pct?: number;
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
  // Fixed-standard (v2) fields
  analysis_mode?: "fixed_standard" | "general_guidance";
  standard_name?: string;
  standard_version?: string;
  checked_against?: string;
  checklist_score?: number;
  total_checks?: number;
  addressed_count?: number;
  clarification_count?: number;
  missing_count?: number;
  verdict_summary?: string;
  general_guidance_notice?: string;
  figures?: { subtotal?: string | null; vat_rate?: string | null; vat_amount?: string | null; total_incl_vat?: string | null };
  figures_reconcile?: boolean;
  checklist_results?: Array<{
    check_id: string;
    check_title: string;
    section_name?: string | null;
    verdict: "ADDRESSED" | "NEEDS CLARIFICATION" | "MISSING";
    evidence_quote?: string | null;
    source_type?: string;
    reason_from_standard?: string | null;
  }>;
  questions_detailed?: Array<{ check_id: string; question: string; why_it_matters?: string | null }>;
  additional_observations?: string[];
  disclaimer?: string;
  standard_mismatch?: boolean;
  // Multi-document staged pipeline fields
  supporting_documents?: Array<{
    file_name: string;
    detected_type?: string;
    detected_type_label?: string;
    key_facts?: string[];
    affected_report?: boolean;
    affected_reason?: string | null;
  }>;
  improved_checks?: Array<{ check_id: string; check_title: string; quote_verdict: string; merged_verdict: string; note: string }>;
  payment_supplied_separately?: boolean;
  no_evidence_merged_warning?: string | null;
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
  documentScore,
  confidenceScore,
}: {
  riskLevel?: string;
  quoteValue?: string;
  projectType?: string;
  documentScore?: number;
  confidenceScore?: number;
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
        {typeof documentScore === "number" && (
          <div className="qr-hero-metaitem">
            <span className="qr-hero-metalabel">Quote Document Score</span>
            <span className="qr-hero-metavalue">{documentScore}/100</span>
          </div>
        )}
        {typeof confidenceScore === "number" && (
          <div className="qr-hero-metaitem">
            <span className="qr-hero-metalabel">Project Confidence Score</span>
            <span className="qr-hero-metavalue">{confidenceScore}/100</span>
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

  const documentScore =
    typeof report.document_score === "number" ? report.document_score : qualityScore;
  const confidenceScore =
    typeof report.project_confidence_score === "number"
      ? report.project_confidence_score
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
        {typeof documentScore === "number" && (
          <div className="qr-metric2 qr-metric2-hero">
            <div className="qr-metric-label">Quote Document Score</div>
            <div className="qr-metric2-ringrow">
              <Ring value={documentScore} />
              <p className="qr-metric2-explain">How complete and clear the uploaded quote itself is. {scoreExplain(documentScore)}</p>
            </div>
          </div>
        )}

        {typeof confidenceScore === "number" && (
          <div className="qr-metric2 qr-metric2-hero">
            <div className="qr-metric-label">Project Confidence Score</div>
            <div className="qr-metric2-ringrow">
              <Ring value={confidenceScore} />
              <p className="qr-metric2-explain">How confident you can be after the quote plus the extra details you supplied. Anything supplied separately should be confirmed in writing.</p>
            </div>
          </div>
        )}

        {typeof report.overall_readiness_pct === "number" && (
          <div className="qr-metric2">
            <div className="qr-metric-label">Overall Quote Readiness</div>
            <div className="qr-metric2-value">{report.overall_readiness_pct}%</div>
            <div className={`qr-bar qr-bar-${barTone(report.overall_readiness_pct)}`}>
              <span style={{ width: `${Math.max(4, Math.min(100, report.overall_readiness_pct))}%` }} />
            </div>
            <p className="qr-metric2-explain">Weighted across all categories — construction and commercial combined.</p>
          </div>
        )}

        {typeof report.construction_completeness_pct === "number" && (
          <div className="qr-metric2">
            <div className="qr-metric-label">Construction Scope Completeness</div>
            <div className="qr-metric2-value">{report.construction_completeness_pct}%</div>
            <div className={`qr-bar qr-bar-${barTone(report.construction_completeness_pct)}`}>
              <span style={{ width: `${Math.max(4, Math.min(100, report.construction_completeness_pct))}%` }} />
            </div>
            <p className="qr-metric2-explain">How well the physical build items are described.</p>
          </div>
        )}

        {typeof report.commercial_completeness_pct === "number" && (
          <div className="qr-metric2">
            <div className="qr-metric-label">Commercial Completeness</div>
            <div className="qr-metric2-value">{report.commercial_completeness_pct}%</div>
            <div className={`qr-bar qr-bar-${barTone(report.commercial_completeness_pct)}`}>
              <span style={{ width: `${Math.max(4, Math.min(100, report.commercial_completeness_pct))}%` }} />
            </div>
            <p className="qr-metric2-explain">Payment stages, programme, variations, warranties and handover.</p>
          </div>
        )}

        {typeof report.construction_completeness_pct !== "number" &&
          typeof report.completeness_pct === "number" && (
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
            {report.recommendation_summary && (
              <p className="qr-nextstep2-text" style={{ marginTop: "0.4rem", opacity: 0.85 }}>{report.recommendation_summary}</p>
            )}
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
      {Array.isArray(report.score_breakdown) && report.score_breakdown.length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <div className="qr-metric-label">Score Breakdown</div>
          <p className="qr-section2-intro" style={{ marginTop: "0.25rem" }}>
            Each category is scored out of 10. "Quote" is what the uploaded quote shows; "Confidence" also reflects details you supplied through the form.
          </p>
          <div className="qr-breakdown" style={{ marginTop: "0.6rem", display: "grid", gap: "0.4rem" }}>
            {report.score_breakdown.map((row, i) => {
              const statusLabel: Record<string, string> = {
                clear: "Clear",
                missing: "Missing from quote",
                supplied_separately: "Supplied separately — confirm in writing",
                builder_confirmed: "Builder confirmed",
                project_dependent: "Project dependent",
                not_applicable: "Not applicable",
                advisory: "Advisory",
              };
              const q = typeof row.quote_score === "number" ? row.quote_score : undefined;
              const c = typeof row.confidence_score === "number" ? row.confidence_score : undefined;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    padding: "0.55rem 0.7rem",
                    border: "1px solid rgba(15,118,110,0.15)",
                    borderRadius: "0.6rem",
                    background: "rgba(15,118,110,0.03)",
                  }}
                >
                  <div style={{ minWidth: "10rem", flex: "1 1 12rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      {row.category}
                      {typeof row.weight === "number" ? (
                        <span style={{ fontWeight: 500, fontSize: "0.68rem", opacity: 0.6 }}> · {row.weight}% weight</span>
                      ) : ""}
                    </div>
                    <div style={{ fontSize: "0.72rem", opacity: 0.7 }}>
                      {statusLabel[row.status || ""] || row.status || ""}
                      {row.source ? ` · Source: ${row.source}` : ""}
                    </div>
                    {row.note && <div style={{ fontSize: "0.72rem", opacity: 0.75, marginTop: "0.2rem" }}>{row.note}</div>}
                    {typeof q === "number" && q < 8 && row.improvement && (
                      <div style={{ fontSize: "0.72rem", opacity: 0.85, marginTop: "0.2rem", color: "#0f766e" }}>
                        To improve: {row.improvement}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.9rem", fontSize: "0.8rem", fontVariantNumeric: "tabular-nums" }}>
                    {typeof q === "number" && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: 700 }}>{q}/10</div>
                        <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>Quote</div>
                      </div>
                    )}
                    {typeof c === "number" && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontWeight: 700, color: "#0f766e" }}>{c}/10</div>
                        <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>Confidence</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

/**
 * Build the Risk Status strip DIRECTLY from the deterministic score breakdown so
 * it can never contradict the scores/evidence (e.g. VAT clear in the breakdown
 * must show "Clear" here, never "Not applicable").
 */
const STATUS_TO_PILL: Record<string, PillStatus> = {
  clear: "clear",
  supplied_separately: "confirm",
  builder_confirmed: "clear",
  advisory: "advisory",
  project_dependent: "advisory",
  missing: "missing",
  not_applicable: "na",
};

const BREAKDOWN_STRIP_MAP: { label: string; match: RegExp }[] = [
  { label: "VAT Clarity", match: /vat/i },
  { label: "Payment Terms", match: /payment/i },
  { label: "Programme", match: /programme|timescale/i },
  { label: "Scope Detail", match: /scope/i },
  { label: "Exclusions", match: /exclusion/i },
];

const deriveStripFromBreakdown = (
  breakdown: NonNullable<ReportJson["score_breakdown"]>,
): { label: string; status: PillStatus }[] =>
  BREAKDOWN_STRIP_MAP.map((t) => {
    const row = breakdown.find((b) => t.match.test(b.category || ""));
    const status: PillStatus = row ? STATUS_TO_PILL[row.status || ""] ?? "advisory" : "na";
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
    { tone: "green", title: "Key Strengths", sub: "Clear and well covered in this quote", items: green, Icon: CheckCircle2 },
    { tone: "amber", title: "Key Clarifications Needed", sub: "Confirm these in writing before accepting", items: amber, Icon: AlertCircle },
    { tone: "red", title: "Higher Priority", sub: "Address before proceeding", items: red, Icon: XCircle },
  ];
  return (
    <section className="qr-section2">
      <div className="qr-section2-head">
        <div>
          <h2 className="qr-section2-title">Strengths &amp; Clarifications</h2>
          <p className="qr-section2-intro">
            What this quote does well, and the specific points to confirm before you accept.
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
/* Executive verdict — top-of-report summary a homeowner reads first   */
/* ------------------------------------------------------------------ */

const ExecutiveVerdict = ({ report }: { report: ReportJson }) => {
  const v = verdictHeadline(report.risk_level);
  const summary =
    report.recommendation_summary?.trim() ||
    "This is a plain-English health check of the quote you uploaded — see the strengths and clarifications below.";
  const docScore =
    typeof report.document_score === "number" ? report.document_score : report.quality_score;
  const confScore = report.project_confidence_score;
  return (
    <section className={`qr-final qr-final-${v.tone}`} style={{ marginTop: 0 }}>
      <div className="qr-final-tag">Executive Verdict</div>
      <h2 className="qr-final-headline">{v.line}</h2>
      <p className="qr-final-why" style={{ marginTop: "0.6rem" }}>{summary}</p>
      <div className="qr-verdict-metrics" style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginTop: "1rem" }}>
        {typeof docScore === "number" && (
          <div>
            <div className="qr-metric-label">Quote Document Score</div>
            <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f2544" }}>{docScore}<span style={{ fontSize: "0.8rem", opacity: 0.6 }}>/100</span></div>
          </div>
        )}
        {typeof confScore === "number" && (
          <div>
            <div className="qr-metric-label">Project Confidence Score</div>
            <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f766e" }}>{confScore}<span style={{ fontSize: "0.8rem", opacity: 0.6 }}>/100</span></div>
          </div>
        )}
        {report.risk_level && (
          <div>
            <div className="qr-metric-label">Risk Level</div>
            <div style={{ marginTop: "0.25rem" }}><span className={riskClass(report.risk_level)}>{report.risk_level}</span></div>
          </div>
        )}
        {report.assessment && (
          <div>
            <div className="qr-metric-label">Assessment</div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f2544", marginTop: "0.3rem" }}>{report.assessment}</div>
          </div>
        )}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */

const VerdictPill = ({ v }: { v: "ADDRESSED" | "NEEDS CLARIFICATION" | "MISSING" }) => {
  const map = {
    ADDRESSED: { cls: "bg-teal/15 text-teal border-teal/30", Icon: CheckCircle2, label: "Addressed" },
    "NEEDS CLARIFICATION": { cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", Icon: AlertCircle, label: "Clarify" },
    MISSING: { cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: XCircle, label: "Missing" },
  }[v];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${map.cls}`}>
      <map.Icon className="h-3 w-3" /> {map.label}
    </span>
  );
};

const fixedVerdict = (
  score: number,
): { line: string; tone: "good" | "warn" | "bad"; tag: string; action: string } => {
  if (score >= 80)
    return {
      line: "This quote is largely complete.",
      tone: "good",
      tag: "Ready with minor checks",
      action: "Confirm the few remaining clarifications in writing, then you can reasonably proceed.",
    };
  if (score >= 55)
    return {
      line: "Clarify key items before you proceed.",
      tone: "warn",
      tag: "Needs clarification",
      action: "Send the builder the questions below and get written answers before you commit.",
    };
  return {
    line: "This quote has significant gaps — do not accept it yet.",
    tone: "bad",
    tag: "Significant concerns",
    action: "Request a revised quote that clearly addresses the missing items before making any payment.",
  };
};

const StandardHero = ({
  report,
  score,
  generated,
}: {
  report: ReportJson;
  score: number;
  generated: string;
}) => (
  <header className="qr-hero">
    <div className="qr-hero-top">
      <img src={logoLight.url} alt="ProGrafter" className="qr-hero-logo" />
      <span className="qr-hero-kicker">Quote Health Check</span>
    </div>
    <div className="qr-hero-rule" />
    <h1 className="qr-hero-title">Quote Health Check</h1>
    <p className="qr-hero-prepared">Prepared by ProGrafter · Fixed-standard compliance audit</p>

    <div className="qr-hero-meta">
      {report.standard_name && (
        <div className="qr-hero-metaitem">
          <span className="qr-hero-metalabel">Checked against</span>
          <span className="qr-hero-metavalue">{report.standard_name}</span>
        </div>
      )}
      {report.standard_version && (
        <div className="qr-hero-metaitem">
          <span className="qr-hero-metalabel">Standard version</span>
          <span className="qr-hero-metavalue">v{report.standard_version}</span>
        </div>
      )}
      {report.figures?.total_incl_vat && (
        <div className="qr-hero-metaitem">
          <span className="qr-hero-metalabel">Quote value</span>
          <span className="qr-hero-metavalue">{report.figures.total_incl_vat}</span>
        </div>
      )}
      <div className="qr-hero-metaitem">
        <span className="qr-hero-metalabel">Quote Check Score</span>
        <span className="qr-hero-metavalue">{score}/100</span>
      </div>
      <div className="qr-hero-metaitem">
        <span className="qr-hero-metalabel">Generated</span>
        <span className="qr-hero-metavalue">
          <CalendarDays className="h-3.5 w-3.5" style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />
          {generated}
        </span>
      </div>
    </div>

    <p className="qr-hero-desc">
      Every check below comes from a fixed ProGrafter standard. The checklist decides the score — not
      an AI opinion — so the same quote produces the same result every time.
    </p>
  </header>
);

const FixedStandardReport = ({ report, admin = false }: { report: ReportJson; admin?: boolean }) => {
  const { copied, copy } = useCopy();
  const [showChecklist, setShowChecklist] = useState(false);
  const results = report.checklist_results || [];
  const score = report.checklist_score ?? 0;
  const v = fixedVerdict(score);
  const generated = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const grouped = useMemo(() => {
    const m = new Map<string, typeof results>();
    for (const r of results) {
      const s = r.section_name || "General";
      if (!m.has(s)) m.set(s, []);
      m.get(s)!.push(r);
    }
    return [...m.entries()];
  }, [results]);

  const sectionStats = useMemo(
    () =>
      grouped.map(([section, rows]) => {
        const total = rows.length;
        const addressed = rows.filter((r) => r.verdict === "ADDRESSED").length;
        const clarify = rows.filter((r) => r.verdict === "NEEDS CLARIFICATION").length;
        const missing = rows.filter((r) => r.verdict === "MISSING").length;
        const pct = total ? Math.round((addressed / total) * 100) : 0;
        return { section, total, addressed, clarify, missing, pct };
      }),
    [grouped],
  );

  const allQuestions = report.questions_detailed || [];
  // Focused consumer report: prioritise the questions that matter most (missing items
  // first, then clarifications) and cap the list so the report stays a good/bad
  // decision aid rather than an exhaustive 100+ item audit. The full list lives in
  // the admin Advanced Review Engine.
  const MAX_CONSUMER_QUESTIONS = 10;
  const verdictByCheck = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of results) m.set(r.check_id, r.verdict || "");
    return m;
  }, [results]);
  const priority = (checkId: string) => {
    const v = verdictByCheck.get(checkId);
    if (v === "MISSING") return 0;
    if (v === "NEEDS CLARIFICATION") return 1;
    return 2;
  };
  const prioritisedQuestions = useMemo(
    () => [...allQuestions].sort((a, b) => priority(a.check_id) - priority(b.check_id)),
    [allQuestions, verdictByCheck],
  );
  const questions = admin ? prioritisedQuestions : prioritisedQuestions.slice(0, MAX_CONSUMER_QUESTIONS);
  const hiddenQuestionCount = admin ? 0 : Math.max(0, prioritisedQuestions.length - questions.length);
  const questionsText = questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
  // showChecklist retained for potential external toggling; appendix uses SectionCard collapse.
  void showChecklist;
  void setShowChecklist;

  return (
    <div className="qr-paper qr-paper-v2 space-y-6">
      <StandardHero report={report} score={score} generated={generated} />

      <div className="qr-card qr-report-stack">
        {report.standard_mismatch && (
          <div className="qr-section2">
            <Insight title="Project type mismatch flagged" tone="amber">
              A project type mismatch was flagged for this quote. The report was generated against the
              confirmed standard shown above.
            </Insight>
          </div>
        )}

        {/* Executive verdict */}
        <section className={`qr-final qr-final-${v.tone}`} style={{ marginTop: 0 }}>
          <div className="qr-final-tag">{v.tag}</div>
          <h2 className="qr-final-headline">{v.line}</h2>
          {report.verdict_summary && (
            <p className="qr-final-why" style={{ marginTop: "0.6rem" }}>{report.verdict_summary}</p>
          )}
          <div className="qr-verdict-metrics" style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginTop: "1rem" }}>
            <div>
              <div className="qr-metric-label">Quote Check Score</div>
              <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f2544" }}>
                {score}<span style={{ fontSize: "0.8rem", opacity: 0.6 }}>/100</span>
              </div>
            </div>
            <div>
              <div className="qr-metric-label">Checks run</div>
              <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f2544" }}>{report.total_checks ?? results.length}</div>
            </div>
            <div>
              <div className="qr-metric-label">Checked against</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f2544", marginTop: "0.3rem" }}>
                {report.checked_against || `${report.standard_name} · v${report.standard_version}`}
              </div>
            </div>
          </div>
          <div className="qr-final-action">
            <span className="qr-final-action-label">Recommended action</span>
            <p>{v.action}</p>
          </div>
        </section>

        {/* Score dashboard */}
        <section className="qr-section2">
          <div className="qr-section2-head">
            <div>
              <h2 className="qr-section2-title">Quote Check Dashboard</h2>
              <p className="qr-section2-intro">
                The fixed checklist scores this quote — {report.addressed_count ?? 0} addressed,{" "}
                {report.clarification_count ?? 0} to clarify, {report.missing_count ?? 0} missing.
              </p>
            </div>
          </div>
          <div className="qr-dash2">
            <div className="qr-metric2 qr-metric2-hero">
              <div className="qr-metric-label">Quote Check Score</div>
              <div className="qr-metric2-ringrow">
                <Ring value={score} />
                <p className="qr-metric2-explain">{scoreExplain(score)} Based only on the fixed standard checks.</p>
              </div>
            </div>
            <div className="qr-metric2">
              <div className="qr-metric-label">Addressed</div>
              <div className="qr-metric2-value" style={{ color: "#0f766e" }}>{report.addressed_count ?? 0}</div>
              <p className="qr-metric2-explain">Clearly covered in the quote.</p>
            </div>
            <div className="qr-metric2">
              <div className="qr-metric-label">Needs clarification</div>
              <div className="qr-metric2-value" style={{ color: "#b45309" }}>{report.clarification_count ?? 0}</div>
              <p className="qr-metric2-explain">Stated but unclear or unconfirmed.</p>
            </div>
            <div className="qr-metric2">
              <div className="qr-metric-label">Missing</div>
              <div className="qr-metric2-value" style={{ color: "#b91c1c" }}>{report.missing_count ?? 0}</div>
              <p className="qr-metric2-explain">Not found anywhere in the quote.</p>
            </div>
          </div>

          {sectionStats.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <div className="qr-metric-label">Completeness by section</div>
              <div style={{ marginTop: "0.6rem", display: "grid", gap: "0.7rem" }}>
                {sectionStats.map((s) => (
                  <div key={s.section}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.82rem", color: "#374151" }}>
                      <span style={{ fontWeight: 600 }}>{s.section}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.75 }}>
                        {s.addressed}/{s.total} addressed · {s.pct}%
                      </span>
                    </div>
                    <div className={`qr-bar qr-bar-${barTone(s.pct)}`}>
                      <span style={{ width: `${Math.max(4, Math.min(100, s.pct))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Two-score summary + payment note (only when supporting docs supplied) */}
        {(report.supporting_documents?.length ?? 0) > 0 && (
          <section className="qr-section2">
            <div className="qr-section2-head">
              <div>
                <h2 className="qr-section2-title">Two Scores: Quote vs Project Pack</h2>
                <p className="qr-section2-intro">
                  The Quote Document Score reflects the main builder quote alone. The Project Pack Confidence Score
                  also includes the supporting documents you supplied.
                </p>
              </div>
            </div>
            <div className="qr-strip">
              <div className="qr-strip-card">
                <div className="qr-strip-label">Quote Document Score</div>
                <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "#0f2544" }}>
                  {report.document_score ?? report.checklist_score ?? 0}<span style={{ fontSize: "0.75rem", opacity: 0.6 }}>/100</span>
                </span>
                <p className="qr-strip-label" style={{ marginTop: "0.3rem", opacity: 0.7 }}>Main quote only</p>
              </div>
              <div className="qr-strip-card">
                <div className="qr-strip-label">Project Pack Confidence</div>
                <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "#0f766e" }}>
                  {report.project_confidence_score ?? report.checklist_score ?? 0}<span style={{ fontSize: "0.75rem", opacity: 0.6 }}>/100</span>
                </span>
                <p className="qr-strip-label" style={{ marginTop: "0.3rem", opacity: 0.7 }}>Quote + supporting documents</p>
              </div>
            </div>
            {report.payment_supplied_separately && (
              <div style={{ marginTop: "0.85rem" }}>
                <Insight title="Payment structure supplied separately" tone="amber">
                  Payment schedule is not visible in the main quote, but a payment structure has been supplied
                  separately. Confirm with the builder that this payment schedule forms part of the agreed
                  quote/contract.
                </Insight>
              </div>
            )}
          </section>
        )}

        {/* Improved by supporting documents */}
        {(report.improved_checks?.length ?? 0) > 0 && (
          <section className="qr-section2">
            <div className="qr-section2-head">
              <div>
                <h2 className="qr-section2-title">Improved By Supporting Documents</h2>
                <p className="qr-section2-intro">These checks changed because of the documents you supplied.</p>
              </div>
            </div>
            <div style={{ display: "grid", gap: "0.7rem" }}>
              {report.improved_checks!.map((c) => (
                <div key={c.check_id} className="qr-strip-card" style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, color: "#0f2544", fontSize: "0.9rem" }}>
                    {c.check_id} · {c.check_title}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#374151", marginTop: "0.25rem" }}>
                    {c.quote_verdict} → <strong>{c.merged_verdict}</strong>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.2rem" }}>{c.note}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Supporting Documents Reviewed */}
        {(report.supporting_documents?.length ?? 0) > 0 && (
          <section className="qr-section2">
            <div className="qr-section2-head">
              <div>
                <h2 className="qr-section2-title">Supporting Documents Reviewed</h2>
                <p className="qr-section2-intro">
                  Each document was identified and extracted separately. We show what it added and whether it
                  affected the report.
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gap: "0.8rem" }}>
              {report.supporting_documents!.map((d, i) => (
                <div key={`${d.file_name}-${i}`} className="qr-strip-card" style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, color: "#0f2544", fontSize: "0.9rem" }}>{d.file_name}</div>
                  <div style={{ fontSize: "0.82rem", color: "#374151", marginTop: "0.2rem" }}>
                    Detected as: {d.detected_type_label || d.detected_type || "Supporting document"}
                  </div>
                  {(d.key_facts?.length ?? 0) > 0 ? (
                    <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem", fontSize: "0.82rem", color: "#374151" }}>
                      {d.key_facts!.slice(0, 8).map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "0.3rem" }}>No usable facts extracted.</div>
                  )}
                  <div style={{ fontSize: "0.8rem", color: d.affected_report ? "#0f766e" : "#6b7280", marginTop: "0.35rem", fontWeight: 600 }}>
                    {d.affected_report ? "Used in: Project Pack Confidence Score" : "Did not change the report"}
                    {d.affected_reason ? ` — ${d.affected_reason}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* Figures */}
        {report.figures && (
          <section className="qr-section2">
            <div className="qr-section2-head">
              <div>
                <h2 className="qr-section2-title">Figures (as stated in the quote)</h2>
                <p className="qr-section2-intro">Quoted verbatim from the document — never recalculated.</p>
              </div>
            </div>
            <div className="qr-strip">
              <div className="qr-strip-card">
                <div className="qr-strip-label">Subtotal</div>
                <span style={{ fontWeight: 700, color: "#0f2544" }}>{report.figures.subtotal ?? "Not stated"}</span>
              </div>
              <div className="qr-strip-card">
                <div className="qr-strip-label">VAT</div>
                <span style={{ fontWeight: 700, color: "#0f2544" }}>
                  {report.figures.vat_amount ?? report.figures.vat_rate ?? "Not stated"}
                </span>
              </div>
              <div className="qr-strip-card">
                <div className="qr-strip-label">Total incl. VAT</div>
                <span style={{ fontWeight: 700, color: "#0f2544" }}>{report.figures.total_incl_vat ?? "Not stated"}</span>
              </div>
            </div>
            {report.figures_reconcile === false && (
              <div style={{ marginTop: "0.85rem" }}>
                <Insight title="Figures do not reconcile" tone="amber">
                  The subtotal, VAT and total shown in the quote do not add up. Ask the contractor to
                  confirm the correct figures in writing.
                </Insight>
              </div>
            )}
          </section>
        )}

        {/* Questions to ask */}
        {questions.length > 0 && (
          <SectionCard
            title="Key Questions To Ask The Builder"
            intro={
              admin
                ? "Every missing or unclear check — copy any question to raise it directly."
                : "The most important things to confirm on this quote before you proceed — copy any question to raise it directly."
            }
          >
            <div className="no-print" style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                className="qr-copyall-btn"
                onClick={() => copy("all-q", questionsText, "Questions copied")}
              >
                {copied === "all-q" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy All Questions
              </button>
            </div>
            <ul className="qr-qlist">
              {questions.map((q, i) => (
                <li key={q.check_id} className="qr-qitem">
                  <span className="qr-qtext">
                    <strong style={{ color: "#0d9488" }}>{q.check_id}</strong> {q.question}
                    {q.why_it_matters && (
                      <span style={{ display: "block", marginTop: "0.2rem", fontSize: "0.78rem", color: "#6b7280" }}>
                        Why it matters: {q.why_it_matters}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="qr-qcopy no-print"
                    aria-label="Copy question"
                    onClick={() => copy(`q-${i}`, q.question, "Question copied")}
                  >
                    {copied === `q-${i}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
            {hiddenQuestionCount > 0 && (
              <p className="qr-section2-intro" style={{ marginTop: "0.85rem", opacity: 0.75 }}>
                Showing the {questions.length} most important questions. {hiddenQuestionCount} further
                minor points were checked against the standard but are not critical to your decision.
              </p>
            )}
          </SectionCard>
        )}

        {/* Builder message */}
        {report.builder_message && <BuilderMessage message={report.builder_message} />}

        {/* Full checklist appendix — admin-only audit trail (Advanced Review Engine) */}
        {admin && (
        <SectionCard
          title={`Full Checklist Results (${results.length})`}
          intro="Admin audit trail — every check in the standard, with the evidence found. Not shown on the public report."
          collapsible
          defaultOpen={false}
        >
          <div className="space-y-5">
            {grouped.map(([section, rows]) => (
              <div key={section}>
                <h3 className="qr-appendix-h3">{section}</h3>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {rows.map((r) => (
                    <div
                      key={r.check_id}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.6rem",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        padding: "0.6rem 0.7rem",
                        border: "1px solid #e3e6ec",
                        borderRadius: "0.6rem",
                        background: "#ffffff",
                      }}
                    >
                      <div style={{ flex: "1 1 16rem", minWidth: "12rem" }}>
                        <p style={{ fontSize: "0.85rem", color: "#0f2544", margin: 0 }}>
                          <span style={{ color: "#6b7280", fontFamily: "var(--font-mono, monospace)" }}>{r.check_id}</span>{" "}
                          {r.check_title}
                        </p>
                        {r.evidence_quote && (
                          <p style={{ margin: "0.3rem 0 0", fontSize: "0.76rem", color: "#52606d", fontStyle: "italic" }}>
                            “{r.evidence_quote}”
                          </p>
                        )}
                        {r.reason_from_standard && r.verdict !== "ADDRESSED" && (
                          <p style={{ margin: "0.2rem 0 0", fontSize: "0.74rem", color: "#6b7280" }}>{r.reason_from_standard}</p>
                        )}
                      </div>
                      <VerdictPill v={r.verdict} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        )}

        {/* Additional observations */}
        {(report.additional_observations?.length ?? 0) > 0 && (
          <SectionCard
            title="Additional Observations"
            intro="Outside the fixed checklist — these do not affect the score."
            collapsible
            defaultOpen={false}
          >
            <ul className="qr-flaglist">
              {report.additional_observations!.map((o, i) => (
                <li key={i} style={{ paddingLeft: "1rem", position: "relative" }}>{o}</li>
              ))}
            </ul>
          </SectionCard>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <PostReportCTAs checkerType={report.checker_type} />
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};

const GeneralGuidanceReport = ({ report }: { report: ReportJson }) => {
  const generated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="qr-paper qr-paper-v2 space-y-6">
      <header className="qr-hero">
        <div className="qr-hero-top">
          <img src={logoLight.url} alt="ProGrafter" className="qr-hero-logo" />
          <span className="qr-hero-kicker">Quote Health Check</span>
        </div>
        <div className="qr-hero-rule" />
        <h1 className="qr-hero-title">Quote Health Check</h1>
        <p className="qr-hero-prepared">Prepared by ProGrafter · General guidance</p>
        <div className="qr-hero-meta">
          <div className="qr-hero-metaitem">
            <span className="qr-hero-metalabel">Generated</span>
            <span className="qr-hero-metavalue">
              <CalendarDays className="h-3.5 w-3.5" style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />
              {generated}
            </span>
          </div>
        </div>
        <p className="qr-hero-desc">
          A fixed ProGrafter checklist standard is not yet available for this project type, so this is
          general guidance rather than a scored compliance audit.
        </p>
      </header>

      <div className="qr-card qr-report-stack">
        <div className="qr-section2">
          <Insight title="General guidance only" tone="amber">
            {report.general_guidance_notice ||
              "This is general quote guidance. A fixed ProGrafter checklist standard is not yet available for this project type, so no score is given."}
          </Insight>
        </div>

        {report.figures && (
          <section className="qr-section2">
            <div className="qr-section2-head">
              <div>
                <h2 className="qr-section2-title">Figures (as stated)</h2>
                <p className="qr-section2-intro">Quoted verbatim from the document.</p>
              </div>
            </div>
            <div className="qr-strip">
              <div className="qr-strip-card">
                <div className="qr-strip-label">Subtotal</div>
                <span style={{ fontWeight: 700, color: "#0f2544" }}>{report.figures.subtotal ?? "Not stated"}</span>
              </div>
              <div className="qr-strip-card">
                <div className="qr-strip-label">VAT</div>
                <span style={{ fontWeight: 700, color: "#0f2544" }}>{report.figures.vat_amount ?? report.figures.vat_rate ?? "Not stated"}</span>
              </div>
              <div className="qr-strip-card">
                <div className="qr-strip-label">Total incl. VAT</div>
                <span style={{ fontWeight: 700, color: "#0f2544" }}>{report.figures.total_incl_vat ?? "Not stated"}</span>
              </div>
            </div>
          </section>
        )}

        {(report.additional_observations?.length ?? 0) > 0 && (
          <SectionCard title="Observations">
            <ul className="qr-flaglist">
              {report.additional_observations!.map((o, i) => (
                <li key={i} style={{ paddingLeft: "1rem", position: "relative" }}>{o}</li>
              ))}
            </ul>
          </SectionCard>
        )}

        {(report.questions_list?.length ?? 0) > 0 && (
          <SectionCard title="Questions To Ask" intro="Sensible points to confirm with the builder before accepting.">
            <ul className="qr-qlist">
              {report.questions_list!.map((q, i) => (
                <li key={i} className="qr-qitem"><span className="qr-qtext">{q}</span></li>
              ))}
            </ul>
          </SectionCard>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <PostReportCTAs checkerType={report.checker_type} />
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};

const QuoteHealthCheckReport = ({ report, admin = false }: { report: ReportJson; admin?: boolean }) => {
  if (report.analysis_mode === "fixed_standard") return <FixedStandardReport report={report} admin={admin} />;
  if (report.analysis_mode === "general_guidance") return <GeneralGuidanceReport report={report} />;
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

  // Prefer the deterministic score breakdown for the Risk Status strip so it can
  // never contradict the scores/evidence; fall back to text parsing for legacy reports.
  const strip = useMemo(
    () =>
      report.score_breakdown?.length
        ? deriveStripFromBreakdown(report.score_breakdown)
        : deriveStrip(includeItems, missingItems, excludeItems),
    [report.score_breakdown, includeItems, missingItems, excludeItems],
  );

  const { amber: derivedAmber, red: derivedRed } = useMemo(
    () => splitMissing(missingItems),
    [missingItems],
  );

  // Build strengths / clarifications from the deterministic breakdown so they
  // always agree with the scores. Fall back to text-derived flags for legacy reports.
  const breakdownStrengths = useMemo(
    () =>
      (report.score_breakdown || [])
        .filter((b) => (b.quote_score ?? 0) >= 8 && !/decision safety/i.test(b.category || ""))
        .map((b) => b.note || b.category)
        .filter(Boolean) as string[],
    [report.score_breakdown],
  );
  const breakdownClarifications = useMemo(
    () =>
      (report.score_breakdown || [])
        .filter((b) => (b.quote_score ?? 10) <= 5 && !/decision safety/i.test(b.category || ""))
        .map((b) => b.note || b.category)
        .filter(Boolean) as string[],
    [report.score_breakdown],
  );

  const hasBreakdown = !!report.score_breakdown?.length;
  const greenFlags = report.green_flags?.length
    ? report.green_flags
    : hasBreakdown ? breakdownStrengths : includeItems;
  const amberFlags = report.amber_flags?.length
    ? report.amber_flags
    : hasBreakdown ? breakdownClarifications : derivedAmber;
  const redFlags = report.red_flags?.length
    ? report.red_flags
    : hasBreakdown ? [] : Array.from(new Set([...(report.top_issues || []), ...derivedRed]));

  const quoteValue = report.quote_value || extractQuoteValue(figures?.html);
  const projectType = report.project_type || PROJECT_LABELS[report.checker_type || ""];

  const isTrade = report.checker_type === "trade_self" || report.checker_type === "trade_sub";

  // If parsing produced nothing (older / unusual reports), fall back to the
  // raw HTML so we never lose content.
  const parsedAnything = sections.length > 0;

  // Evidence-aware VAT flag so callouts never contradict the score breakdown.
  const vatRow = report.score_breakdown?.find((b) => /vat/i.test(b.category || ""));
  const vatClear = vatRow ? vatRow.status === "clear" : undefined;

  return (
    <div className="qr-paper qr-paper-v2 space-y-6">
      {/* 1. Branded hero */}
      <ReportHero
        riskLevel={report.risk_level}
        quoteValue={quoteValue}
        projectType={projectType}
        documentScore={typeof report.document_score === "number" ? report.document_score : report.quality_score}
        confidenceScore={report.project_confidence_score}
      />

      <div className="qr-card qr-report-stack">
        {/* 1. Executive verdict — read this first */}
        <ExecutiveVerdict report={report} />

        {/* 2. Score summary */}
        <Dashboard report={report} />

        {/* Risk status strip (evidence-aware) */}
        <RiskStrip items={strip} />

        {/* 3 + 4. Key strengths / clarifications */}
        <QuoteFlags green={greenFlags} amber={amberFlags} red={redFlags} />

        {/* 5. What to do next */}
        <WhatToDoNext actions={actions} />

        {/* 6. Suggested message to builder */}
        <BuilderMessage message={builderMessage} />

        {/* Questions to ask */}
        <QuestionsSection groups={questionGroups} />

        {/* Evidence-aware callout — never contradicts the VAT evidence */}
        <div className="qr-section2">
          {vatClear ? (
            <Insight title="Where to focus your clarifications" tone="teal">
              VAT is clearly shown in this quote. Focus clarification on payment stages, programme,
              variations and handover documents — get these confirmed in writing before you commit.
            </Insight>
          ) : (
            <Insight title="Before you pay a deposit" tone="amber">
              Payment stages should be tied to clear work milestones, not vague dates. Ask the builder
              to confirm the VAT status, payment schedule and programme in writing before you commit.
            </Insight>
          )}
        </div>

        {/* 7 + 8. Detailed evidence + full scope tables (appendix) */}
        {parsedAnything ? (
          <>
            {summary && (
              <SectionCard title="Detailed Summary" intro="A calm overview of what this quote covers and what to check." collapsible defaultOpen={false}>
                <RawHtml html={summary.html} />
              </SectionCard>
            )}

            {figures && (
              <SectionCard title="Quote Figures" intro="The headline numbers taken directly from the quote." collapsible defaultOpen={false}>
                <RawHtml html={figures.html} />
              </SectionCard>
            )}

            <SectionCard
              title="Detailed Scope Review"
              intro="The full breakdown of what appears included, missing/unclear and excluded — kept here so the summary above stays easy to scan."
              collapsible
              defaultOpen={false}
            >
              {includes && (
                <>
                  <h3 className="qr-appendix-h3">What Appears Included</h3>
                  <RawHtml html={includes.html} />
                </>
              )}
              {missing && (
                <>
                  <h3 className="qr-appendix-h3">What Is Missing or Unclear</h3>
                  <RawHtml html={missing.html} />
                </>
              )}
              {excludes && (
                <>
                  <h3 className="qr-appendix-h3">What Appears Excluded</h3>
                  <RawHtml html={excludes.html} />
                </>
              )}
            </SectionCard>

            {(scoreBreakdown || costAreas || comparison) && (
              <SectionCard title="Risk Breakdown" intro="A closer look at quote quality and areas that may affect cost." collapsible defaultOpen={false}>
                {scoreBreakdown && <RawHtml html={scoreBreakdown.html} />}
                {comparison && <RawHtml html={comparison.html} />}
                {costAreas && <RawHtml html={costAreas.html} />}
              </SectionCard>
            )}
          </>
        ) : (
          <SectionCard title="Full Report Detail" collapsible defaultOpen={false}>
            <RawHtml html={report.report_html || ""} />
          </SectionCard>
        )}

        {/* Final Recommendation conclusion card */}
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
