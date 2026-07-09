import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";

// ---- Types (kept local — independent of the advanced report) ----------------
export interface SimpleCategory {
  key: string;
  name: string;
  relevant: boolean;
  score: number | null;
  score_main?: number | null;
  score_pack?: number | null;
  status: "clear" | "supplied_separately" | "needs_clarifying" | "missing" | "not_scored" | string;
  note: string;
  evidence_source:
    | "in_quote"
    | "supplied_in_supporting"
    | "addendum_clarification"
    | "supplied_separately"
    | "homeowner_supplied"
    | "not_found"
    | string;
}

export interface SuppliedSeparatelyItem {
  item?: string;
  main_quote?: string;
  supporting?: string;
  status?: string;
  note?: string;
}

export interface SimpleReportJson {
  version?: string;
  generated_at?: string;
  project_type?: string | null;
  verdict?: { level: "clear" | "useful" | "vague" | string; line: string };
  clarity_score?: number;
  pack_confidence_score?: number;
  has_supporting_docs?: boolean;
  relevant_categories_count?: number;
  strong_categories?: string[];
  weak_categories?: string[];
  categories?: SimpleCategory[];
  what_looks_clear?: string[];
  what_needs_clarifying?: string[];
  what_appears_missing?: string[];
  supplied_separately?: SuppliedSeparatelyItem[];
  building_control?: { status?: string; detail?: string };
  questions?: string[];
  suggested_message?: string;
  supporting_docs?: { name: string; type: string; note: string; builder_confirmed?: string }[];
}

const VERDICT_THEME: Record<string, { label: string; ring: string; text: string; bar: string }> = {
  clear: { label: "Clear enough to consider", ring: "ring-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
  useful: { label: "Useful, but confirm key points", ring: "ring-amber-200", text: "text-amber-700", bar: "bg-amber-500" },
  vague: { label: "Too vague to accept safely yet", ring: "ring-rose-200", text: "text-rose-700", bar: "bg-rose-500" },
};

const SOURCE_LABEL: Record<string, string> = {
  in_quote: "In the main quote",
  supplied_in_supporting: "Supplied in supporting document",
  addendum_clarification: "Supplied in addendum — confirm with builder",
  supplied_separately: "Supplied separately — confirm with builder",
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

export default function SimpleQuoteReport({ report }: { report: SimpleReportJson }) {
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  const verdict = report.verdict ?? { level: "useful", line: "" };
  const theme = VERDICT_THEME[verdict.level] ?? VERDICT_THEME.useful;
  const score = typeof report.clarity_score === "number" ? report.clarity_score : 0;
  const packScore = typeof report.pack_confidence_score === "number" ? report.pack_confidence_score : null;
  const hasDocs = !!report.has_supporting_docs && packScore !== null;
  const categories = report.categories ?? [];
  const relevant = categories.filter((c) => c.relevant);
  const suppliedSeparately = report.supplied_separately ?? [];
  const bc = report.building_control ?? {};

  const copyMessage = async () => {
    if (!report.suggested_message) return;
    await navigator.clipboard.writeText(report.suggested_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* 1. Executive verdict + Quote Clarity Score */}
      <div className={`bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm ring-1 ${theme.ring}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-2">
            <span className={`font-mono text-[11px] uppercase tracking-wider ${theme.text}`}>{theme.label}</span>
            <p className="font-heading text-xl md:text-2xl text-navy leading-snug">{verdict.line}</p>
          </div>
          <div className="shrink-0 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Quote Clarity Score</p>
            <div className="relative inline-flex items-center justify-center">
              <span className="font-heading text-4xl md:text-5xl text-navy">{score}</span>
              <span className="font-mono text-sm text-muted-foreground ml-1">/100</span>
            </div>
            <div className="mt-2 h-2 w-40 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${theme.bar}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mt-2">
              Based on {report.relevant_categories_count ?? relevant.length} relevant categories
            </p>
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
              <p className="font-mono text-xs text-navy">{report.weak_categories?.join(", ") || "—"}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* 6. Building Control — always visible */}
      <div className="bg-card rounded-2xl border border-teal/40 p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-teal" />
          <h2 className="font-heading text-base md:text-lg text-navy">Building Control Status</h2>
        </div>
        <p className="font-mono text-sm text-navy/90 leading-relaxed">{bc.detail || "Not clear from the quote — confirm with the builder."}</p>
      </div>

      {/* 3. What looks clear */}
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

      {/* 4. What needs clarifying */}
      {report.what_needs_clarifying?.length ? (
        <Section title="What Needs Clarifying" icon={<HelpCircle className="h-5 w-5 text-amber-600" />}>
          <ul className="space-y-2">
            {report.what_needs_clarifying.map((t, i) => (
              <li key={i} className="flex gap-2 font-mono text-sm text-navy/90">
                <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 5. What appears missing */}
      {report.what_appears_missing?.length ? (
        <Section title="What Appears Missing" icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}>
          <ul className="space-y-2">
            {report.what_appears_missing.map((t, i) => (
              <li key={i} className="flex gap-2 font-mono text-sm text-navy/90">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 7. Main questions to ask the builder */}
      {report.questions?.length ? (
        <Section title="Main Questions To Ask The Builder" icon={<MessageSquare className="h-5 w-5 text-navy" />}>
          <ol className="space-y-2 list-decimal list-inside">
            {report.questions.slice(0, 8).map((q, i) => (
              <li key={i} className="font-mono text-sm text-navy/90">{q}</li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* 8. Suggested message to builder */}
      {report.suggested_message ? (
        <div className="bg-navy rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-heading text-base md:text-lg text-white">Suggested Message To Your Builder</h2>
            <button
              onClick={copyMessage}
              className="flex items-center gap-1.5 font-mono text-xs text-white/90 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="font-mono text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{report.suggested_message}</p>
        </div>
      ) : null}

      {/* Supporting docs note */}
      {report.supporting_docs?.length ? (
        <Section title="Supporting Documents" icon={<CheckCircle2 className="h-5 w-5 text-teal" />}>
          <ul className="space-y-2">
            {report.supporting_docs.map((d, i) => (
              <li key={i} className="font-mono text-xs text-navy/90">
                <span className="font-medium">{d.name}</span> — {d.type}. {d.note}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 9. Optional detail — collapsed category scores */}
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
            {categories.filter((c) => !c.relevant).length > 0 && (
              <p className="font-mono text-[11px] text-muted-foreground pt-3 border-t border-border">
                Not scored (not relevant to your expected scope):{" "}
                {categories.filter((c) => !c.relevant).map((c) => c.name).join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-center font-mono text-[11px] text-muted-foreground leading-relaxed px-4">
        This report helps you understand your quote. It is guidance only and does not replace professional advice,
        surveys, structural design or legal advice.
      </p>
    </div>
  );
}
