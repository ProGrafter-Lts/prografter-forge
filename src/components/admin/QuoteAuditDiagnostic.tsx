import { useState } from "react";
import { ChevronDown, ChevronRight, Database, ShieldCheck, Calculator, AlertTriangle } from "lucide-react";

interface CategoryScore {
  category?: string;
  quote_score?: number;
  confidence_score?: number;
  status?: string;
  source?: string;
  note?: string;
}

interface QsScoring {
  breakdown?: CategoryScore[];
  document_score?: number;
  project_confidence_score?: number;
  sanitised_missing?: string[];
}

interface Validation {
  checks?: Array<{ rule?: string; passed?: boolean; detail?: string }>;
  contradictions?: string[];
  blocked?: boolean;
}

interface DocExtraction {
  file_name?: string;
  detected_type?: string;
  detected_type_label?: string;
  summary?: string;
  affected_report?: boolean;
  affected_reason?: string | null;
  facts?: Array<{ label?: string; value?: string; source_type?: string; status?: string }>;
}

interface SupportingDiagnostic {
  documents?: Array<Record<string, unknown>>;
  improved_checks?: Array<{ check_id: string; check_title: string; quote_verdict: string; merged_verdict: string; note: string }>;
  no_evidence_merged_warning?: string | null;
}

interface Props {
  fileName?: string | null;
  fileHash?: string | null;
  evidence?: Record<string, unknown> | null;
  validation?: Validation | null;
  scoring?: QsScoring | null;
  reportHtml?: string | null;
  documentExtractions?: DocExtraction[] | null;
  supportingDiagnostic?: SupportingDiagnostic | null;
  mergedEvidence?: Record<string, unknown> | null;
  checklistResults?: Array<{ check_id: string; check_title: string; verdict: string }> | null;
}

const Section = ({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[4px] border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {icon} {title}
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="border-t border-border px-4 py-3">{children}</div>}
    </div>
  );
};

const QuoteAuditDiagnostic = ({ fileName, fileHash, evidence, validation, scoring, reportHtml, documentExtractions, supportingDiagnostic, mergedEvidence, checklistResults }: Props) => {
  const missingAfterAll = (checklistResults || []).filter((r) => r.verdict === "MISSING");
  const improved = supportingDiagnostic?.improved_checks || [];
  const docs = documentExtractions || [];
  return (
    <div className="no-print space-y-3 rounded-[4px] border border-amber-400/50 bg-amber-50/60 p-4">
      <p className="flex items-center gap-2 font-mono text-sm font-semibold text-amber-900">
        <ShieldCheck className="h-4 w-4" /> Admin diagnostic — QS audit pipeline
      </p>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs text-amber-900/90">
        <div><span className="opacity-60">File:</span> {fileName || "—"}</div>
        <div className="truncate"><span className="opacity-60">Hash:</span> {fileHash ? fileHash.slice(0, 16) + "…" : "—"}</div>
        <div><span className="opacity-60">Document score:</span> <strong>{scoring?.document_score ?? "—"}/100</strong></div>
        <div><span className="opacity-60">Project confidence:</span> <strong>{scoring?.project_confidence_score ?? "—"}/100</strong></div>
      </div>

      {validation?.contradictions && validation.contradictions.length > 0 && (
        <div className="rounded-[4px] border border-rose-300 bg-rose-50 p-3 font-mono text-xs text-rose-800">
          <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Contradictions</p>
          <ul className="mt-1 list-disc pl-4">
            {validation.contradictions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      <Section title="Scoring breakdown" icon={<Calculator className="h-3.5 w-3.5" />} defaultOpen>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 pr-3">Category</th>
                <th className="py-1 pr-3">Quote</th>
                <th className="py-1 pr-3">Conf.</th>
                <th className="py-1 pr-3">Status</th>
                <th className="py-1 pr-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {(scoring?.breakdown || []).map((b, i) => (
                <tr key={i} className="border-t border-border/60 align-top">
                  <td className="py-1 pr-3">{b.category}</td>
                  <td className="py-1 pr-3">{b.quote_score}/10</td>
                  <td className="py-1 pr-3">{b.confidence_score}/10</td>
                  <td className="py-1 pr-3">{b.status}</td>
                  <td className="py-1 pr-3">{b.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Validation checks" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        <ul className="space-y-1 font-mono text-xs">
          {(validation?.checks || []).map((c, i) => (
            <li key={i}>
              <span className={c.passed ? "text-emerald-700" : "text-rose-700"}>{c.passed ? "✓" : "✗"}</span> <strong>{c.rule}:</strong> {c.detail}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Extracted evidence (JSON)" icon={<Database className="h-3.5 w-3.5" />}>
        <pre className="max-h-80 overflow-auto rounded-[4px] bg-navy/5 p-3 font-mono text-[10px] leading-relaxed text-navy">
          {JSON.stringify(evidence, null, 2)}
        </pre>
      </Section>

      {scoring?.sanitised_missing && scoring.sanitised_missing.length > 0 && (
        <Section title="Genuinely missing items (post-filter)" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
          <ul className="list-disc pl-4 font-mono text-xs">
            {scoring.sanitised_missing.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </Section>
      )}

      {reportHtml && (
        <Section title="Raw report HTML" icon={<Database className="h-3.5 w-3.5" />}>
          <pre className="max-h-80 overflow-auto rounded-[4px] bg-navy/5 p-3 font-mono text-[10px] leading-relaxed text-navy whitespace-pre-wrap">
            {reportHtml}
          </pre>
        </Section>
      )}
    </div>
  );
};

export default QuoteAuditDiagnostic;
