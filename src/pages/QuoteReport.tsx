import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MinusCircle,
  ShieldCheck,
} from "lucide-react";

interface Strength {
  title: string;
  detail: string;
}

interface QuestionItem {
  severity: "action" | "clarify";
  title: string;
  detail: string;
  ask: string;
}

interface AdditionalItem {
  label: string;
  low: number;
  high: number;
  note?: string | null;
}

interface ReportJson {
  error?: string;
  project?: {
    type?: string;
    location?: string;
    quote_total?: number;
    currency?: string;
    vat_status?: "inclusive" | "exclusive" | "unclear";
    vat_illustration?: string | null;
  };
  scope?: {
    detected?: string;
    summary?: string;
    covered?: string[];
  };
  completeness_score?: number;
  verdict_line?: string;
  strengths?: Strength[];
  questions_to_ask?: QuestionItem[];
  excluded_by_design?: string[];
  cost_picture?: {
    quoted?: number;
    vat_note?: string | null;
    additional_items?: AdditionalItem[];
    completion_low?: number;
    completion_high?: number;
    framing?: string;
  };
  bridge?: string | null;
}

const SCOPE_LABELS: Record<string, string> = {
  shell_only: "Shell only",
  full_build: "Full build",
  internals_only: "Internals only",
  single_trade: "Single trade",
  unclear: "Scope unclear",
};

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const DisclaimerBanner = () => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
    <div className="font-mono text-xs text-amber-800 leading-relaxed">
      This is budgeting guidance to help you ask the right questions — not a survey,
      valuation, or quotation. All figures are indicative ranges. Always confirm details
      directly with your builder and obtain independent professional advice before
      committing to any building work.
    </div>
  </div>
);

const QuoteReport = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState<ReportJson | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [accessError, setAccessError] = useState<string | null>(null);

  // The lookup token gates access — without it the report cannot be read,
  // so a guessed URL alone is not enough.
  const tokenFromUrl = searchParams.get("t");

  useEffect(() => {
    if (!id) return;
    let token = tokenFromUrl || "";
    if (!token) {
      const stored = localStorage.getItem(`quoteReportToken:${id}`);
      if (stored) token = stored;
    } else {
      localStorage.setItem(`quoteReportToken:${id}`, token);
    }

    if (!token) {
      setAccessError(
        "This report link is missing its secure access token. Please use the link from your confirmation or email.",
      );
      return;
    }

    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        const { data, error } = await supabase.functions.invoke("read-quote-check", {
          body: { quoteCheckId: id, lookupToken: token },
        });
        if (cancelled) return;
        if (error) {
          setAccessError("We couldn't load this report. The link may be invalid or expired.");
          return;
        }
        if (data) {
          setStatus(data.status);
          if (data.status === "complete" && data.report_json) {
            setReport(data.report_json as ReportJson);
            return;
          }
          if (data.status === "error") {
            setStatus("error");
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [id, tokenFromUrl]);

  const renderBody = () => {
    if (accessError) {
      return (
        <div className="text-center py-16">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-4" />
          <p className="font-mono text-sm text-muted-foreground max-w-md mx-auto">{accessError}</p>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="text-center py-16">
          <p className="font-mono text-sm text-destructive">
            Something went wrong analysing your quote. Please try again.
          </p>
        </div>
      );
    }

    if (!report) {
      return (
        <div className="text-center py-16 space-y-4">
          <Loader2 className="mx-auto h-10 w-10 text-teal animate-spin" />
          <h2 className="font-heading text-2xl text-navy">Reviewing your quote…</h2>
          <p className="font-mono text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            This usually takes around 60 seconds.
          </p>
        </div>
      );
    }

    if (report.error) {
      return (
        <div className="text-center py-16">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-4" />
          <p className="font-mono text-sm text-muted-foreground max-w-md mx-auto">{report.error}</p>
        </div>
      );
    }

    const project = report.project || {};
    const scope = report.scope || {};
    const cp = report.cost_picture;
    const actions = (report.questions_to_ask || []).filter((q) => q.severity === "action");
    const clarifications = (report.questions_to_ask || []).filter((q) => q.severity === "clarify");

    return (
      <div className="space-y-6">
        {/* Header / verdict */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-xs">
            {project.type && (
              <span className="bg-navy/5 text-navy px-2.5 py-1 rounded-full">{project.type}</span>
            )}
            {project.location && (
              <span className="bg-navy/5 text-navy px-2.5 py-1 rounded-full">{project.location}</span>
            )}
            {scope.detected && (
              <span className="bg-teal/10 text-teal px-2.5 py-1 rounded-full">
                {SCOPE_LABELS[scope.detected] || scope.detected}
              </span>
            )}
            {project.vat_status && (
              <span
                className={`px-2.5 py-1 rounded-full ${
                  project.vat_status === "inclusive"
                    ? "bg-[#E4F5F3] text-[#0E837D]"
                    : project.vat_status === "exclusive"
                      ? "bg-[#FBF1DC] text-[#B07A12]"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                VAT: {project.vat_status}
              </span>
            )}
          </div>

          <div className="flex items-center gap-5">
            {typeof report.completeness_score === "number" && (
              <div className="shrink-0 text-center">
                <div className="font-heading text-4xl text-navy leading-none">
                  {report.completeness_score}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                  / 100 for scope
                </div>
              </div>
            )}
            <div>
              {typeof project.quote_total === "number" && (
                <p className="font-mono text-xs text-muted-foreground mb-1">
                  Quoted total:{" "}
                  <span className="text-navy font-semibold">{gbp(project.quote_total)}</span>
                  {project.vat_illustration ? (
                    <span className="text-amber-700"> · {project.vat_illustration}</span>
                  ) : null}
                </p>
              )}
              {report.verdict_line && (
                <p className="font-body text-[16px] text-navy leading-snug font-medium">
                  {report.verdict_line}
                </p>
              )}
            </div>
          </div>

          {scope.summary && (
            <p className="font-mono text-sm text-muted-foreground leading-relaxed mt-4 pt-4 border-t border-border">
              {scope.summary}
            </p>
          )}
          {scope.covered && scope.covered.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
                Covered by this quote
              </p>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {scope.covered.map((c, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-mono text-xs text-navy leading-snug">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DisclaimerBanner />

        {/* Strengths */}
        {report.strengths && report.strengths.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-heading text-lg text-navy mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> What this quote does well
            </h3>
            <ul className="space-y-3">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-sm text-navy font-semibold leading-snug">{s.title}</p>
                    {s.detail && (
                      <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                        {s.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Questions to ask */}
        {(actions.length > 0 || clarifications.length > 0) && (
          <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-heading text-lg text-navy mb-3 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-teal" /> Questions to ask your builder
            </h3>
            <div className="space-y-4">
              {[...actions, ...clarifications].map((q, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    q.severity === "action"
                      ? "border-rose-200 bg-rose-50/60"
                      : "border-amber-200 bg-amber-50/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        q.severity === "action"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {q.severity === "action" ? "Worth confirming" : "Clarify"}
                    </span>
                    {q.title && (
                      <span className="font-mono text-xs text-navy font-semibold">{q.title}</span>
                    )}
                  </div>
                  {q.detail && (
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-2">
                      {q.detail}
                    </p>
                  )}
                  {q.ask && (
                    <p className="font-mono text-sm text-navy leading-snug border-l-2 border-navy/20 pl-3">
                      “{q.ask}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Excluded by design */}
        {report.excluded_by_design && report.excluded_by_design.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-heading text-lg text-navy mb-1 flex items-center gap-2">
              <MinusCircle className="h-5 w-5 text-muted-foreground" /> Not included in this quote
            </h3>
            <p className="font-mono text-xs text-muted-foreground mb-3">
              These sit outside the scope of this quote — not faults, just things to budget for separately.
            </p>
            <ul className="space-y-2">
              {report.excluded_by_design.map((s, i) => (
                <li key={i} className="flex gap-2 font-mono text-sm text-foreground/90">
                  <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Cost picture */}
        {cp && (
          <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-heading text-lg text-navy mb-3">The cost picture</h3>
            {cp.framing && (
              <p className="font-mono text-xs text-muted-foreground mb-4 leading-relaxed">{cp.framing}</p>
            )}
            {typeof cp.quoted === "number" && (
              <div className="flex justify-between font-mono text-sm border-b border-border py-2">
                <span className="text-muted-foreground">Quoted total</span>
                <span className="text-navy font-semibold">{gbp(cp.quoted)}</span>
              </div>
            )}
            {cp.vat_note && (
              <p className="font-mono text-xs text-amber-700 mt-2 leading-relaxed">{cp.vat_note}</p>
            )}
            {cp.additional_items && cp.additional_items.length > 0 && (
              <div className="mt-3 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  Likely additional / excluded elements
                </p>
                {cp.additional_items.map((item, i) => (
                  <div key={i} className="font-mono text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-foreground/90">{item.label}</span>
                      <span className="text-navy whitespace-nowrap">
                        {gbp(item.low)} – {gbp(item.high)}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(typeof cp.completion_low === "number" || typeof cp.completion_high === "number") && (
              <div className="flex justify-between items-center font-mono mt-4 pt-3 border-t border-border">
                <span className="text-navy font-semibold">Indicative completion range</span>
                <span className="font-heading text-lg text-teal whitespace-nowrap">
                  {gbp(cp.completion_low || 0)} – {gbp(cp.completion_high || 0)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Bridge */}
        {report.bridge && (
          <section className="bg-teal/5 rounded-2xl border border-teal/20 p-6">
            <p className="font-mono text-sm text-navy leading-relaxed flex gap-2">
              <ShieldCheck className="h-5 w-5 text-teal shrink-0 mt-0.5" />
              <span>{report.bridge}</span>
            </p>
          </section>
        )}

        <DisclaimerBanner />
      </div>
    );
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <SEO
          title="Your Quote Health Check — ProGrafter"
          description="An independent, plain-English review of your building quote to help you ask the right questions."
          path={`/report/${id ?? ""}`}
          noindex
        />
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-teal/10 text-teal font-mono text-xs px-3 py-1.5 rounded-full mb-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                Quote Health Check
              </div>
              <h1 className="font-heading text-3xl md:text-4xl text-navy">Your Quote Health Check</h1>
            </div>
            {renderBody()}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default QuoteReport;
