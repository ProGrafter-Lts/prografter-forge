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
} from "lucide-react";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface ReportJson {
  // New structured fields
  checker_type?: string;
  quality_score?: number;
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
      {(open || !collapsible) && <div className="qr-section2-body">{children}</div>}
    </section>
  );
};

const RawHtml = ({ html }: { html: string }) => (
  <div className="qr-report qr-tablewrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
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
      <div className="qr-dash">
        {typeof qualityScore === "number" && (
          <div className="qr-metric">
            <div className="qr-metric-label">Quote Quality Score</div>
            <div className="qr-metric-value">{qualityScore} <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>/ 100</span></div>
          </div>
        )}
        {typeof report.completeness_pct === "number" && (
          <div className="qr-metric">
            <div className="qr-metric-label">Completeness</div>
            <div className="qr-metric-value">{report.completeness_pct}%</div>
            <div className="qr-metric-sub">approx. of expected scope</div>
          </div>
        )}
        {report.risk_level && (
          <div className="qr-metric">
            <div className="qr-metric-label">Risk Level</div>
            <div style={{ marginTop: "0.35rem" }}><span className={riskClass(report.risk_level)}>{report.risk_level}</span></div>
          </div>
        )}
        {report.project_confidence && (
          <div className="qr-metric">
            <div className="qr-metric-label">Project Confidence</div>
            <div style={{ marginTop: "0.35rem" }}><span className={confidenceClass(report.project_confidence)}>{report.project_confidence}</span></div>
          </div>
        )}
      </div>

      {report.recommended_next_step && (
        <div className="qr-nextstep" style={{ marginTop: "0.9rem" }}>
          <div className="qr-metric-label" style={{ color: "#0f766e" }}>Recommended Next Step</div>
          <p style={{ margin: "0.3rem 0 0", color: "#134e4a", fontWeight: 600 }}>{report.recommended_next_step}</p>
        </div>
      )}

      {Array.isArray(report.top_issues) && report.top_issues.length > 0 && (
        <div style={{ marginTop: "0.9rem" }}>
          <div className="qr-metric-label">Top {Math.min(3, report.top_issues.length)} Issues</div>
          <div className="qr-issues" style={{ marginTop: "0.4rem" }}>
            {report.top_issues.slice(0, 3).map((issue, i) => (
              <div key={i} className="qr-issue"><span>{i + 1}.</span> {issue}</div>
            ))}
          </div>
        </div>
      )}
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

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const QuoteHealthCheckReport = ({ report }: { report: ReportJson }) => {
  const sections = useMemo(() => parseSections(report.report_html || ""), [report.report_html]);

  const find = (kw: string) => sections.find((s) => s.heading.toLowerCase().includes(kw));

  const summary = find("summary");
  const figures = find("figure");
  const includes = find("includes");
  const excludes = find("excludes");
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

  const assessment = report.assessment;
  const assessmentClass =
    assessment === "Ready to Accept"
      ? "qr-chip qr-chip-good"
      : assessment === "Significant Concerns"
        ? "qr-chip qr-chip-bad"
        : "qr-chip qr-chip-warn";

  // If parsing produced nothing (older / unusual reports), fall back to the
  // raw HTML so we never lose content.
  const parsedAnything = sections.length > 0;

  return (
    <div className="qr-paper space-y-6">
      <div className="qr-card qr-report-stack">
        {assessment && (
          <div className="qr-card-head">
            <span className={assessmentClass}>{assessment}</span>
          </div>
        )}

        {/* 1. Dashboard */}
        <Dashboard report={report} />

        {/* 2. What To Do Next */}
        <WhatToDoNext actions={actions} />

        {parsedAnything ? (
          <>
            {/* 3. Plain-English Summary */}
            {summary && (
              <SectionCard title="Plain-English Summary" intro="A calm overview of what this quote covers and what to check.">
                <RawHtml html={summary.html} />
              </SectionCard>
            )}

            {/* 4. Quote Figures */}
            {figures && (
              <SectionCard title="Quote Figures" intro="The headline numbers taken directly from the quote.">
                <RawHtml html={figures.html} />
              </SectionCard>
            )}

            {/* 5. What Appears Included */}
            {includes && (
              <SectionCard title="What Appears Included" intro="Items the quote clearly states are covered." collapsible defaultOpen>
                <RawHtml html={includes.html} />
              </SectionCard>
            )}

            {/* 6. What Appears Missing / Unclear */}
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

            {/* 8. Risk Breakdown */}
            {(scoreBreakdown || costAreas || comparison) && (
              <SectionCard title="Risk Breakdown" intro="A closer look at quote quality and areas that may affect cost." collapsible defaultOpen={false}>
                {scoreBreakdown && <RawHtml html={scoreBreakdown.html} />}
                {comparison && <RawHtml html={comparison.html} />}
                {costAreas && <RawHtml html={costAreas.html} />}
              </SectionCard>
            )}

            {/* 9. Questions To Ask (copyable) */}
            <QuestionsSection groups={questionGroups} />

            {/* 10. Suggested Message To Builder */}
            <BuilderMessage message={builderMessage} />

            {/* 11. Final Recommendation */}
            {recommendation && (
              <SectionCard title="Final Recommendation" intro="Our overall guidance based on this review.">
                <RawHtml html={recommendation.html} />
              </SectionCard>
            )}
          </>
        ) : (
          <>
            <QuestionsSection groups={questionGroups} />
            <BuilderMessage message={builderMessage} />
            <RawHtml html={report.report_html || ""} />
          </>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <PostReportCTAs checkerType={report.checker_type} />
        </div>
      </div>

      {/* 12. Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};

export default QuoteHealthCheckReport;
