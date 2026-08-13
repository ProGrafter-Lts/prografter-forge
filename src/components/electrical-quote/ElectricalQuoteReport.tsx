import { useState } from "react";
import SuggestedMessageBlock, { type SuggestedQuestion } from "@/components/quote-report/SuggestedMessageBlock";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  Copy,
  Check,
  MessageSquare,
  Zap,
} from "lucide-react";

// ---- Types (self-contained — independent of extension & boiler reports) -----
export interface ElectricalCategory {
  key: string;
  name: string;
  relevant: boolean;
  score: number | null;
  score_main?: number | null;
  score_pack?: number | null;
  status: string;
  note: string;
  evidence_source: string;
}

export interface ElectricalSuppliedSeparatelyItem {
  item?: string;
  main_quote?: string;
  supporting?: string;
  status?: string;
  note?: string;
}

export interface ElectricalReportJson {
  version?: string;
  generated_at?: string;
  project_type?: string | null;
  is_electrical_quote?: boolean;
  not_electrical_note?: string;
  verdict?: { level: "low" | "moderate" | "good" | "strong" | string; line: string };
  clarity_score?: number;
  pack_confidence_score?: number;
  has_supporting_docs?: boolean;
  relevant_categories_count?: number;
  strong_categories?: string[];
  weak_categories?: string[];
  categories?: ElectricalCategory[];
  quick_verdict?: string;
  what_looks_clear?: string[];
  supplied_separately?: ElectricalSuppliedSeparatelyItem[];
  not_found?: string[];
  not_found_grouped?: { category: string; items: string[] }[];
  key_risks?: string[];
  questions?: string[];
  suggested_message?: string;
  suggested_questions?: SuggestedQuestion[];
  suggested_message_text?: string;
  summary?: string;
}


const VERDICT_THEME: Record<string, { label: string; ring: string; text: string; bar: string }> = {
  low: { label: "Too vague to accept safely yet", ring: "ring-rose-200", text: "text-rose-700", bar: "bg-rose-500" },
  moderate: { label: "Useful, but confirm key points", ring: "ring-amber-200", text: "text-amber-700", bar: "bg-amber-500" },
  good: { label: "Decent quote, but key points should be confirmed", ring: "ring-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
  strong: { label: "Strong quote, with final confirmations", ring: "ring-emerald-300", text: "text-emerald-700", bar: "bg-emerald-600" },
};

const SOURCE_LABEL: Record<string, string> = {
  in_quote: "In the main quote",
  supplied_in_supporting: "Supplied in supporting document",
  addendum_clarification: "Supplied separately — confirm with electrician",
  supplied_separately: "Supplied separately — confirm with electrician",
  homeowner_supplied: "You supplied this",
  not_found: "Not found",
};

const scoreColor = (s: number | null) => {
  if (s === null) return "text-muted-foreground";
  if (s >= 7) return "text-emerald-600";
  if (s >= 5) return "text-amber-600";
  return "text-rose-600";
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-3">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="font-heading text-base md:text-lg text-navy">{title}</h2>
    </div>
    {children}
  </div>
);

export default function ElectricalQuoteReport({ report }: { report: ElectricalReportJson }) {
  const [showDetail, setShowDetail] = useState(false);

  const verdict = report.verdict ?? { level: "moderate", line: "" };
  const theme = VERDICT_THEME[verdict.level] ?? VERDICT_THEME.moderate;
  const score = typeof report.clarity_score === "number" ? report.clarity_score : 0;
  const isStrong = score > 80;
  const packScore = typeof report.pack_confidence_score === "number" ? report.pack_confidence_score : null;
  const hasDocs = !!report.has_supporting_docs && packScore !== null;
  const categories = report.categories ?? [];
  const relevant = categories.filter((c) => c.relevant);
  const suppliedSeparately = report.supplied_separately ?? [];



  return (
    <div className="space-y-5">
      {/* Quote Clarity Score + confidence */}
      <div className={`bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm ring-1 ${theme.ring}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-2">
            <span className={`font-mono text-[11px] uppercase tracking-wider ${theme.text}`}>{theme.label}</span>
            <p className="font-heading text-xl md:text-2xl text-navy leading-snug">{verdict.line}</p>
          </div>
          <div className="shrink-0 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Quote Clarity Score
            </p>
            <div className="relative inline-flex items-center justify-center">
              <span className="font-heading text-4xl md:text-5xl text-navy">{score}</span>
              <span className="font-mono text-sm text-muted-foreground ml-1">/100</span>
            </div>
            <div className="mt-2 h-2 w-40 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${theme.bar}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
            </div>
            {hasDocs && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="font-mono text-[10px] uppercase tracking-wider text-teal mb-1">With supporting docs</p>
                <div className="relative inline-flex items-center justify-center">
                  <span className="font-heading text-3xl md:text-4xl text-navy">{packScore}</span>
                  <span className="font-mono text-sm text-muted-foreground ml-1">/100</span>
                </div>
                <div className="mt-2 h-2 w-40 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-teal" style={{ width: `${Math.min(100, Math.max(0, packScore ?? 0))}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {(report.strong_categories?.length || report.weak_categories?.length) ? (
          <div className="grid sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 mb-1">Strong areas</p>
              <p className="font-mono text-xs text-navy">{report.strong_categories?.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-rose-600 mb-1">Weaker areas</p>
              <p className="font-mono text-xs text-navy">
                {report.weak_categories?.length
                  ? report.weak_categories.join(", ")
                  : "No major weak areas — see items to confirm below."}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* 1. Quick Verdict */}
      {report.quick_verdict ? (
        <div className="bg-card rounded-2xl border border-teal/40 p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-teal" />
            <h2 className="font-heading text-base md:text-lg text-navy">Quick Verdict</h2>
          </div>
          <p className="font-mono text-sm text-navy/90 leading-relaxed whitespace-pre-wrap">{report.quick_verdict}</p>
        </div>
      ) : null}

      {/* 2. What Looks Clear */}
      {report.what_looks_clear?.length ? (
        <Section title="What Looks Clear" icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}>
          <ul className="space-y-2">
            {report.what_looks_clear.map((t, i) => (
              <li key={i} className="flex gap-2 font-mono text-sm text-navy/90">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 4. Not Found / Confirm If Required (paired with supplied separately below) */}
      {suppliedSeparately.length ? (
        <Section title="Supplied Separately — Confirm With Electrician" icon={<ShieldCheck className="h-5 w-5 text-teal" />}>
          <p className="font-mono text-xs text-muted-foreground mb-3">
            These items are not in the main quote but appear in your supporting documents. Confirm the electrician
            agrees they form part of the agreed quote.
          </p>
          <ul className="space-y-3">
            {suppliedSeparately.map((s, i) => (
              <li key={i} className="rounded-xl border border-teal/30 bg-teal/5 p-3">
                <p className="font-mono text-sm text-navy font-medium">{s.item}</p>
                <div className="mt-1.5 space-y-1">
                  {s.main_quote && (
                    <p className="font-mono text-xs text-navy/80"><span className="text-muted-foreground">Main quote:</span> {s.main_quote}</p>
                  )}
                  {s.supporting && (
                    <p className="font-mono text-xs text-navy/80"><span className="text-muted-foreground">Supporting document:</span> {s.supporting}</p>
                  )}
                  {s.status && <p className="font-mono text-xs text-teal">{s.status}</p>}
                  {s.note && <p className="font-mono text-xs text-navy/70">{s.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 3 & 4. What Needs Clarifying / Not Found */}
      {report.not_found_grouped?.length ? (
        <Section
          title={isStrong ? "Final Confirmations" : "Not Found / Confirm If Required"}
          icon={<HelpCircle className={`h-5 w-5 ${isStrong ? "text-teal" : "text-amber-600"}`} />}
        >
          {isStrong ? (
            <p className="font-mono text-xs text-muted-foreground mb-3">
              Worth confirming before acceptance. These are minor points — not major issues, but useful to agree in writing.
            </p>
          ) : (
            <p className="font-mono text-xs text-muted-foreground mb-3">
              These items were not visible in the main quote or supporting documents. They may simply be outside the
              agreed scope — confirm with your electrician if required.
            </p>
          )}
          <div className="space-y-4">
            {report.not_found_grouped.map((g, gi) => (
              <div key={gi}>
                <p className={`font-mono text-xs uppercase tracking-wider mb-1.5 ${isStrong ? "text-teal" : "text-amber-700"}`}>
                  {g.category}
                </p>
                <ul className="space-y-1.5">
                  {g.items.map((t, i) => (
                    <li key={i} className="flex gap-2 font-mono text-sm text-navy/90">
                      <HelpCircle className={`h-4 w-4 shrink-0 mt-0.5 ${isStrong ? "text-teal" : "text-amber-600"}`} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : report.not_found?.length ? (
        <Section
          title={isStrong ? "Final Confirmations" : "Not Found / Confirm If Required"}
          icon={<HelpCircle className={`h-5 w-5 ${isStrong ? "text-teal" : "text-amber-600"}`} />}
        >
          {isStrong ? (
            <p className="font-mono text-xs text-muted-foreground mb-2">
              Worth confirming before acceptance. These are minor points — not major issues, but useful to agree in writing.
            </p>
          ) : (
            <p className="font-mono text-xs text-muted-foreground mb-2">
              These items were not visible in the main quote or supporting documents. They may simply be outside the
              agreed scope — confirm with your electrician if required.
            </p>
          )}
          <ul className="space-y-2">
            {report.not_found.map((t, i) => (
              <li key={i} className="flex gap-2 font-mono text-sm text-navy/90">
                <HelpCircle className={`h-4 w-4 shrink-0 mt-0.5 ${isStrong ? "text-teal" : "text-amber-600"}`} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}


      {/* 5. Key Risks To Clarify */}
      {report.key_risks?.length ? (
        <Section title={score >= 80 ? "Final Confirmation Points" : "Key Risks To Clarify"} icon={<AlertTriangle className={`h-5 w-5 ${score >= 80 ? "text-teal" : "text-rose-500"}`} />}>
          <ul className="space-y-2">
            {report.key_risks.map((t, i) => (
              <li key={i} className="flex gap-2 font-mono text-sm text-navy/90">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 6. Main Questions To Ask The Electrician */}
      {report.questions?.length ? (
        <Section title="Main Questions To Ask The Electrician" icon={<MessageSquare className="h-5 w-5 text-navy" />}>
          <ol className="space-y-2 list-decimal list-inside">
            {report.questions.slice(0, isStrong ? 8 : 10).map((q, i) => (
              <li key={i} className="font-mono text-sm text-navy/90">{q}</li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* Suggested message — deterministic, built from the V2 field results */}
      <SuggestedMessageBlock report={report} title="Suggested Message To The Electrician" />

      {/* 9. ProGrafter Summary */}
      {report.summary ? (
        <Section title="ProGrafter Summary" icon={<ShieldCheck className="h-5 w-5 text-teal" />}>
          <p className="font-mono text-sm text-navy/90 leading-relaxed whitespace-pre-wrap">{report.summary}</p>
        </Section>
      ) : null}

      {/* 8. Detailed Category Scores */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <button
          onClick={() => setShowDetail((v) => !v)}
          className="w-full flex items-center justify-between px-5 md:px-6 py-4 text-left"
        >
          <span className="font-heading text-base text-navy">Show detailed category scores</span>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showDetail ? "rotate-180" : ""}`} />
        </button>
        {showDetail && (
          <div className="px-5 md:px-6 pb-5 space-y-1">
            {relevant.map((c) => (
              <div key={c.key} className="flex items-start justify-between gap-4 py-2.5 border-t border-border">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-navy">{c.name}</p>
                  {c.note && <p className="font-mono text-xs text-muted-foreground mt-0.5">{c.note}</p>}
                  <span className="font-mono text-[10px] text-muted-foreground">{SOURCE_LABEL[c.evidence_source] || c.evidence_source}</span>
                </div>
                <span className={`font-heading text-lg shrink-0 ${scoreColor(c.score)}`}>
                  {c.score === null ? "—" : `${c.score}/10`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center font-mono text-[11px] text-muted-foreground leading-relaxed px-4">
        This report helps you understand your quote. It is guidance only and does not replace professional advice or a
        qualified electrician's assessment.
      </p>
    </div>
  );
}
