import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import SEO from "@/components/SEO";
import QuoteHealthCheckReport from "@/components/QuoteHealthCheckReport";
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
        .select("status, report_json, consistency_diagnostic")
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
            <QuoteHealthCheckReport report={report} />
          )}
        </div>
      </main>
    </div>
  );
};

export default QuoteCheckDetail;
