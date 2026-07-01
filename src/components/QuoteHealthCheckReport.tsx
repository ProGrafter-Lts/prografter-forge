import { AlertTriangle, ArrowRight, Printer } from "lucide-react";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
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
  // Legacy / shared
  score_addressed?: number;
  assessment?: "Ready to Accept" | "Needs Clarification" | "Significant Concerns";
  report_html?: string;
}

const DisclaimerBanner = () => (
  <div className="qr-disclaimer">
    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
    <div>
      This report is guidance to help you understand, compare and question quotes. It is not a quote,
      a survey, or professional advice. Ask your builder to confirm anything unclear in writing.
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

  // Legacy fallback: older reports only stored score_addressed (/43).
  const qualityScore =
    typeof report.quality_score === "number"
      ? report.quality_score
      : typeof report.score_addressed === "number"
        ? Math.round((report.score_addressed / 43) * 100)
        : undefined;

  if (!hasNew && typeof qualityScore !== "number") return null;

  return (
    <section className="qr-section" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
      <h2>Quote Health Dashboard</h2>
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
        <Printer className="h-3.5 w-3.5" /> Print / send these questions
      </button>
      <Link to="/dashboard/homeowner" className={secondary} onClick={() => trackEvent("quote_cta", { action: "project_hub" })}>
        Create a Project Hub
      </Link>
    </div>
  );
};

/**
 * Renders the stored Quote Health Check as a self-contained white "paper"
 * document: executive dashboard (from structured JSON) + the detailed report
 * sections (report_html) + post-report next steps.
 */
const QuoteHealthCheckReport = ({ report }: { report: ReportJson }) => {
  const assessment = report.assessment;
  const assessmentClass =
    assessment === "Ready to Accept"
      ? "qr-chip qr-chip-good"
      : assessment === "Significant Concerns"
        ? "qr-chip qr-chip-bad"
        : "qr-chip qr-chip-warn";

  return (
    <div className="qr-paper space-y-6">
      <div className="qr-card">
        {assessment && (
          <div className="qr-card-head">
            <span className={assessmentClass}>{assessment}</span>
          </div>
        )}
        <Dashboard report={report} />
        <div
          className="qr-report"
          style={{ marginTop: "1.5rem" }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report.report_html || "") }}
        />
        <div style={{ marginTop: "1.5rem" }}>
          <PostReportCTAs checkerType={report.checker_type} />
        </div>
      </div>
      <DisclaimerBanner />
    </div>
  );
};

export default QuoteHealthCheckReport;
