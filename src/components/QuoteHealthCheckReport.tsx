import { AlertTriangle } from "lucide-react";
import DOMPurify from "dompurify";

interface ReportJson {
  score_addressed?: number;
  assessment?: "Ready to Accept" | "Needs Clarification" | "Significant Concerns";
  report_html?: string;
}

const DisclaimerBanner = () => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
    <div className="font-mono text-xs text-amber-800 leading-relaxed">
      This is guidance to help you compare quotes. It is not a quote, a survey, or
      professional advice.
    </div>
  </div>
);

/**
 * Renders the stored Quote Health Check exactly as the Image 2 design:
 * score badge, assessment chip, the model's HTML body (.qr-report) and the
 * disclaimer footer. Used both on the public report page and the in-account
 * report view so the on-screen and printed artefact are identical.
 */
const QuoteHealthCheckReport = ({ report }: { report: ReportJson }) => {
  const assessment = report.assessment;
  const assessmentClass =
    assessment === "Ready to Accept"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : assessment === "Significant Concerns"
        ? "bg-[#FBF1DC] text-[#B07A12] border border-[#EBD9AE]"
        : "bg-[#F1EEE7] text-navy border border-[#E3DECE]";

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {typeof report.score_addressed === "number" && (
            <div className="shrink-0 text-center">
              <div className="qr-score font-heading text-4xl text-navy leading-none">
                {report.score_addressed}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                / 43 addressed
              </div>
            </div>
          )}
          {assessment && (
            <span className={`font-mono text-xs px-3 py-1.5 rounded-full ${assessmentClass}`}>
              {assessment}
            </span>
          )}
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
