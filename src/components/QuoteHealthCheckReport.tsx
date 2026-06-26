import { AlertTriangle } from "lucide-react";
import DOMPurify from "dompurify";

interface ReportJson {
  score_addressed?: number;
  assessment?: "Ready to Accept" | "Needs Clarification" | "Significant Concerns";
  report_html?: string;
}

const DisclaimerBanner = () => (
  <div className="qr-disclaimer">
    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
    <div>
      This is guidance to help you compare quotes. It is not a quote, a survey, or
      professional advice.
    </div>
  </div>
);

/**
 * Renders the stored Quote Health Check as a self-contained white "paper"
 * document. All colours are fixed (not theme tokens) so the report is legible
 * and identical whether it is shown on the dark dashboard, on the public report
 * page, or printed to PDF. See .qr-paper / .qr-report styles in index.css.
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
        <div className="qr-card-head">
          {typeof report.score_addressed === "number" && (
            <div className="qr-score-block">
              <div className="qr-score">{report.score_addressed}</div>
              <div className="qr-score-label">/ 43 addressed</div>
            </div>
          )}
          {assessment && <span className={assessmentClass}>{assessment}</span>}
        </div>
        <div
          className="qr-report"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report.report_html || "") }}
        />
      </div>
      <DisclaimerBanner />
    </div>
  );
};

export default QuoteHealthCheckReport;
