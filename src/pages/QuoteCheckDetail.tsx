import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import SEO from "@/components/SEO";
import QuoteHealthCheckReport from "@/components/QuoteHealthCheckReport";
import QuoteAuditDiagnostic from "@/components/admin/QuoteAuditDiagnostic";
import { ArrowLeft, Download, Loader2, AlertTriangle } from "lucide-react";

interface CategoryDiff {
  category?: string;
  previous_quote_score?: number | null;
  new_quote_score?: number | null;
}
interface ConsistencyDiagnostic {
  warning?: string;
  previous_document_score?: number;
  new_document_score?: number;
  delta?: number;
  category_differences?: CategoryDiff[];
}


interface ReportJson {
  error?: string;
  score_addressed?: number;
  assessment?: "Ready to Accept" | "Needs Clarification" | "Significant Concerns";
  report_html?: string;
}

const QuoteCheckDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const { isAdmin } = useIsAdmin();
  const [report, setReport] = useState<ReportJson | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<ConsistencyDiagnostic | null>(null);
  const [audit, setAudit] = useState<{
    fileName: string | null;
    fileHash: string | null;
    evidence: Record<string, unknown> | null;
    validation: any;
    scoring: any;
    reportHtml: string | null;
    documentExtractions: any;
    supportingDiagnostic: any;
    mergedEvidence: any;
    checklistResults: any;
    reportJson: Record<string, any> | null;
  } | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!id) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("quote_checks")
        .select("status, report_json, report_html, consistency_diagnostic, pdf_url, file_hash, quote_evidence, evidence_validation, qs_scoring, document_extractions, supporting_docs_diagnostic, merged_evidence, checklist_results")
        .eq("id", id)
        .maybeSingle();
      if (err || !data) {
        setError("We couldn't find this report in your account.");
        return;
      }
      setStatus(data.status);
      if (data.status === "complete" && data.report_json) {
        setReport(data.report_json as unknown as ReportJson);
      }
      if (data.consistency_diagnostic) {
        setDiagnostic(data.consistency_diagnostic as unknown as ConsistencyDiagnostic);
      }
      setAudit({
        fileName: (data.pdf_url as string | null)?.split("/").pop() ?? null,
        fileHash: (data.file_hash as string | null) ?? null,
        evidence: (data.quote_evidence as Record<string, unknown> | null) ?? null,
        validation: (data.evidence_validation as any) ?? null,
        scoring: (data.qs_scoring as any) ?? null,
        reportHtml: (data.report_html as string | null) ?? null,
        documentExtractions: (data as any).document_extractions ?? null,
        supportingDiagnostic: (data as any).supporting_docs_diagnostic ?? null,
        mergedEvidence: (data as any).merged_evidence ?? null,
        checklistResults: (data as any).checklist_results ?? null,
        reportJson: (data.report_json as Record<string, any> | null) ?? null,
      });
    })();
  }, [isReady, id, user, navigate]);

  return (
    <div className="min-h-screen dashboard-dark">
      <SEO title="Quote Health Check — ProGrafter" description="Your saved Quote Health Check report." path={`/dashboard/quote-checks/${id}`} noindex />
      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="no-print flex items-center justify-between gap-3 flex-wrap">
          <Link
            to="/dashboard/quote-checks"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-secondary hover:opacity-80"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> My Quote Checks
          </Link>
          {report && !report.error && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          )}
        </div>

        {isAdmin && diagnostic && (
          <div className="no-print rounded-xl border border-amber-400/50 bg-amber-50 p-4 text-amber-900">
            <p className="flex items-center gap-2 font-mono text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" /> Admin: {diagnostic.warning || "Score changed materially from previous run."}
            </p>
            <p className="mt-2 font-mono text-xs">
              Previous score: <strong>{diagnostic.previous_document_score ?? "—"}/100</strong> · New score:{" "}
              <strong>{diagnostic.new_document_score ?? "—"}/100</strong>
              {typeof diagnostic.delta === "number" && (
                <> · Change: <strong>{diagnostic.delta > 0 ? "+" : ""}{diagnostic.delta}</strong></>
              )}
            </p>
            {diagnostic.category_differences && diagnostic.category_differences.length > 0 && (
              <ul className="mt-2 space-y-0.5 font-mono text-xs">
                {diagnostic.category_differences.map((d, i) => (
                  <li key={i}>
                    {d.category}: {d.previous_quote_score ?? "—"} → {d.new_quote_score ?? "—"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isAdmin && audit && (audit.evidence || audit.scoring || audit.documentExtractions || audit.supportingDiagnostic || audit.reportJson) && (
          <QuoteAuditDiagnostic
            fileName={audit.fileName}
            fileHash={audit.fileHash}
            evidence={audit.evidence}
            validation={audit.validation}
            scoring={audit.scoring}
            reportHtml={audit.reportHtml}
            documentExtractions={audit.documentExtractions}
            supportingDiagnostic={audit.supportingDiagnostic}
            mergedEvidence={audit.mergedEvidence}
            checklistResults={audit.checklistResults}
            reportJson={audit.reportJson}
          />
        )}


        <div className="qr-print-area">
          {error ? (
            <div className="text-center py-16">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-4" />
              <p className="font-mono text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
            </div>
          ) : status === "error" ? (
            <div className="text-center py-16">
              <p className="font-mono text-sm text-destructive">
                Something went wrong analysing this quote.
              </p>
            </div>
          ) : status === "needs_review" ? (
            <div className="text-center py-16 space-y-4">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
              <p className="font-heading text-xl text-foreground">Under manual review</p>
              <p className="font-mono text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                This quote produced some conflicting details, so our team is reviewing it
                by hand to keep your Quote Health Check accurate. We'll email you as soon
                as it's ready — usually within one working day.
              </p>
            </div>
          ) : !report ? (
            <div className="text-center py-16 space-y-4">
              <Loader2 className="mx-auto h-10 w-10 text-teal animate-spin" />
              <p className="font-mono text-sm text-muted-foreground">Loading your report…</p>
            </div>
          ) : report.error ? (
            <div className="text-center py-16">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-4" />
              <p className="font-mono text-sm text-muted-foreground max-w-md mx-auto">{report.error}</p>
            </div>
          ) : (
            <QuoteHealthCheckReport report={report} admin={isAdmin} />
          )}
        </div>
      </main>
    </div>
  );
};

export default QuoteCheckDetail;
