import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import SEO from "@/components/SEO";
import { SearchCheck, ArrowRight, FileText, Loader2, ArrowLeft } from "lucide-react";
import { MODULE_REPORT_PATH, type ModuleId } from "@/lib/quoteCheckerPayment";

interface Row {
  id: string;
  reportPath: string;
  title: string;
  postcode: string | null;
  created_at: string;
  status: string;
  score?: number;
  assessment?: string;
}

const MODULE_LABEL: Record<ModuleId, string> = {
  extension_building: "Extension / Building",
  boiler_heating: "Boiler / Heating",
  electrical_rewire: "Electrical / Rewire",
  bathroom: "Bathroom",
  roofing: "Roofing",
  kitchen: "Kitchen",
  windows_doors: "Windows & Doors",
  landscaping_driveway: "Landscaping / Driveway",
  plastering_rendering: "Plastering / Rendering",
};

const MyQuoteChecks = () => {
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    (async () => {
      // 1) Modular checker results (routed via pending_module_checks -> simple_quote_checks)
      const { data: pendings } = await supabase
        .from("pending_module_checks")
        .select("id, module_id, analysed_check_id, project_type, created_at, payment_status")
        .eq("user_id", user.id)
        .not("analysed_check_id", "is", null)
        .order("created_at", { ascending: false });

      const analysedIds = (pendings ?? []).map((p: any) => p.analysed_check_id).filter(Boolean);
      let simpleById: Record<string, any> = {};
      if (analysedIds.length) {
        const { data: simples } = await supabase
          .from("simple_quote_checks")
          .select("id, status, report_json, intake, created_at, lookup_token")
          .in("id", analysedIds);
        simpleById = Object.fromEntries((simples ?? []).map((s: any) => [s.id, s]));
      }

      const modularRows: Row[] = (pendings ?? []).map((p: any) => {
        const s = simpleById[p.analysed_check_id] ?? {};
        const report = s.report_json ?? {};
        const moduleId = p.module_id as ModuleId;
        const reportBase = MODULE_REPORT_PATH[moduleId] ?? "/simple-quote-report";
        const token = s.lookup_token ? `?t=${encodeURIComponent(s.lookup_token)}` : "";
        return {
          id: p.analysed_check_id,
          reportPath: `${reportBase}/${p.analysed_check_id}${token}`,
          title: MODULE_LABEL[moduleId] ?? p.project_type ?? "Quote Check",
          postcode: s.intake?.postcode ?? null,
          created_at: s.created_at ?? p.created_at,
          status: s.status ?? "complete",
          score: typeof report.clarity_score === "number" ? report.clarity_score
                : typeof report.score_addressed === "number" ? report.score_addressed
                : undefined,
          assessment: report.assessment ?? report.verdict ?? undefined,
        };
      });

      // 2) Legacy quote_checks (older detailed checker)
      const { data: legacy } = await supabase
        .from("quote_checks")
        .select("id, project_type, postcode, created_at, status, report_json")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const legacyRows: Row[] = (legacy ?? []).map((r: any) => {
        const raw = r.report_json?.score_addressed;
        const normalisedScore =
          typeof raw === "number" ? Math.round((raw / 43) * 100) : undefined;
        return {
          id: r.id,
          reportPath: `/dashboard/quote-checks/${r.id}`,
          title: r.project_type || "Quote Check",
          postcode: r.postcode ?? null,
          created_at: r.created_at,
          status: r.status,
          score: normalisedScore,
          assessment: r.report_json?.assessment,
        };
      });

      const merged = [...modularRows, ...legacyRows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRows(merged);
      setLoading(false);
    })();
  }, [isReady, user, navigate]);

  return (
    <div className="min-h-screen dashboard-dark">
      <SEO title="My Quote Checks — ProGrafter" description="Your saved AI Quote Checker reports." path="/dashboard/quote-checks" noindex />
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Link to="/dashboard/homeowner?tab=quotes" className="inline-flex items-center gap-1.5 font-mono text-xs text-secondary hover:opacity-80">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>

        <div>
          <h1 className="font-heading text-primary text-3xl md:text-4xl flex items-center gap-2">
            <SearchCheck className="w-7 h-7" /> My Quote Checks
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">
            Every AI Quote Checker report saved to your account.
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
            {rows.map((r) => (
              <Link
                key={r.id}
                to={r.reportPath}
                className="block bg-card rounded-2xl p-5 border border-border hover:border-secondary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading text-primary text-lg truncate">{r.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      {r.postcode ? `${r.postcode} · ` : ""}
                      {new Date(r.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                      {r.assessment ? ` · ${r.assessment}` : r.status !== "complete" ? ` · ${r.status}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {typeof r.score === "number" && (
                      <div className="text-center">
                        <div className="font-heading text-2xl text-navy leading-none">{r.score}</div>
                        <div className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                          / 100
                        </div>
                      </div>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyQuoteChecks;
