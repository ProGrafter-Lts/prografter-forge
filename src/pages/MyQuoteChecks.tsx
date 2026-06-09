import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import SEO from "@/components/SEO";
import { SearchCheck, ArrowRight, FileText, Loader2, ArrowLeft } from "lucide-react";

interface QuoteCheckRow {
  id: string;
  project_type: string | null;
  postcode: string | null;
  created_at: string;
  status: string;
  report_json: { score_addressed?: number; assessment?: string } | null;
}

const MyQuoteChecks = () => {
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const [rows, setRows] = useState<QuoteCheckRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("quote_checks")
        .select("id, project_type, postcode, created_at, status, report_json")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) console.error("Failed to load quote checks", error);
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, [isReady, user, navigate]);

  return (
    <div className="min-h-screen dashboard-dark">
      <SEO title="My Quote Checks — ProGrafter" description="Your saved Quote Health Check reports." path="/dashboard/quote-checks" noindex />
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Link to="/dashboard/homeowner?tab=quotes" className="inline-flex items-center gap-1.5 font-mono text-xs text-secondary hover:opacity-80">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>


        <div>
          <h1 className="font-heading text-primary text-3xl md:text-4xl flex items-center gap-2">
            <SearchCheck className="w-7 h-7" /> My Quote Checks
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            Every Quote Health Check saved to your account.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 font-mono text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your reports…
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-mono text-sm text-muted-foreground mb-4">
              You haven't run any quote checks yet.
            </p>
            <a
              href="/quote-checker"
              className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              Run a Quote Check <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const score = r.report_json?.score_addressed;
              const assessment = r.report_json?.assessment;
              return (
                <Link
                  key={r.id}
                  to={`/dashboard/quote-checks/${r.id}`}
                  className="block bg-card rounded-2xl p-5 border border-border hover:border-secondary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-heading text-primary text-lg truncate">
                        {r.project_type || "Quote Check"}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {r.postcode ? `${r.postcode} · ` : ""}
                        {new Date(r.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {assessment ? ` · ${assessment}` : r.status !== "complete" ? ` · ${r.status}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {typeof score === "number" && (
                        <div className="text-center">
                          <div className="font-heading text-2xl text-navy leading-none">{score}</div>
                          <div className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                            / 43
                          </div>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyQuoteChecks;
