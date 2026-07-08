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
  extraction_success?: boolean;
  extraction_error?: string | null;
  summary?: string;
  affected_report?: boolean;
  affected_reason?: string | null;
  facts?: Array<{ label?: string; value?: string; source_type?: string; status?: string }>;
  key_facts?: string[];
  used_in_quote_document_score?: boolean;
  used_in_project_pack_confidence_score?: boolean;
  affected_checks?: string[];
  warnings?: string[];
}

interface SupportingDiagnostic {
  analysis_run_id?: string;
  generated_at?: string;
  selected_standard?: string;
  standard_id?: string;
  standard_version?: string;
  file_count?: number;
  uploaded_file_count?: number;
  supporting_file_count?: number;
  documents?: DocExtraction[];
  document_extractions?: DocExtraction[];
  improved_checks?: Array<{ check_id: string; check_title: string; quote_verdict: string; merged_verdict: string; note: string }>;
  quote_document_score?: number;
  project_pack_confidence_score?: number;
  payment_structure_status?: TopicStatus | null;
  building_control_status?: TopicStatus | null;
  programme_timescale_status?: TopicStatus | null;
  supporting_document_merge_status?: MergeStatus | null;
  warnings?: string[];
  no_evidence_merged_warning?: string | null;
}

interface TopicStatus {
  label?: string;
  found?: boolean;
  payment_schedule_found?: boolean;
  source?: string | null;
  source_files?: string[];
  stages_extracted?: number;
  intake_status?: string | null;
  used_in_quote_document_score?: boolean;
  used_in_project_pack_confidence_score?: boolean;
  affected_checks?: string[];
  status?: string;
  warning?: string | null;
}

interface MergeStatus {
  supporting_documents_uploaded?: number;
  documents_successfully_extracted?: number;
  extracted_evidence_available?: boolean;
  merge_attempted?: boolean;
  merged_into_project_pack_confidence?: boolean;
  improved_check_count?: number;
  main_quote_unchanged?: boolean;
  explanation?: string;
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
  reportJson?: Record<string, any> | null;
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

const yesNo = (value?: boolean | null) => value ? "YES" : "NO";

const listOrDash = (items?: string[]) => items && items.length > 0 ? items.join(", ") : "—";

const topicFound = (topic?: TopicStatus | null) => topic?.payment_schedule_found ?? topic?.found ?? false;

const TopicPanel = ({ title, status, payment = false }: { title: string; status?: TopicStatus | null; payment?: boolean }) => (
  <div className="rounded-[4px] border border-border/60 bg-card p-3 font-mono text-xs">
    <p className="font-semibold text-navy">{title}</p>
    <div className="mt-2 grid gap-1 text-muted-foreground md:grid-cols-2">
      <div>{payment ? "Payment schedule found" : "Found"}: <strong className="text-navy">{yesNo(topicFound(status))}</strong></div>
      <div>Source: <strong className="text-navy">{status?.source || listOrDash(status?.source_files)}</strong></div>
      {payment && <div>Stages extracted: <strong className="text-navy">{status?.stages_extracted ?? 0}</strong></div>}
      <div>Used in Quote Document Score: <strong className="text-navy">{yesNo(status?.used_in_quote_document_score)}</strong></div>
      <div>Used in Project Pack Confidence Score: <strong className="text-navy">{yesNo(status?.used_in_project_pack_confidence_score)}</strong></div>
      <div>Affected checks: <strong className="text-navy">{listOrDash(status?.affected_checks)}</strong></div>
      {status?.intake_status && <div>Intake answer: <strong className="text-navy">{status.intake_status}</strong></div>}
    </div>
    {status?.status && <p className="mt-2 text-muted-foreground">{status.status}</p>}
    {status?.warning && <p className="mt-2 text-rose-700">{status.warning}</p>}
  </div>
);

const QuoteAuditDiagnostic = ({ fileName, fileHash, evidence, validation, scoring, reportHtml, documentExtractions, supportingDiagnostic, mergedEvidence, checklistResults, reportJson }: Props) => {
  const missingAfterAll = (checklistResults || []).filter((r) => r.verdict === "MISSING");
  const improved = supportingDiagnostic?.improved_checks || reportJson?.improved_checks || [];
  const docs = (documentExtractions && documentExtractions.length > 0)
    ? documentExtractions
    : (supportingDiagnostic?.document_extractions && supportingDiagnostic.document_extractions.length > 0)
      ? supportingDiagnostic.document_extractions
      : supportingDiagnostic?.documents || [];
  const documentScore = scoring?.document_score ?? supportingDiagnostic?.quote_document_score ?? reportJson?.document_score;
  const projectConfidence = scoring?.project_confidence_score ?? supportingDiagnostic?.project_pack_confidence_score ?? reportJson?.project_confidence_score;
  const fileCount = supportingDiagnostic?.file_count ?? supportingDiagnostic?.uploaded_file_count ?? reportJson?.file_count ?? (1 + docs.length);
  const warnings = [
    ...(supportingDiagnostic?.warnings || []),
    supportingDiagnostic?.no_evidence_merged_warning,
    reportJson?.no_evidence_merged_warning,
  ].filter((w): w is string => typeof w === "string" && w.length > 0);
  const mergeStatus = supportingDiagnostic?.supporting_document_merge_status || reportJson?.supporting_document_merge_status || null;
  const paymentStatus = supportingDiagnostic?.payment_structure_status || reportJson?.payment_structure_status || null;
  const buildingControlStatus = supportingDiagnostic?.building_control_status || reportJson?.building_control_status || null;
  const programmeStatus = supportingDiagnostic?.programme_timescale_status || reportJson?.programme_timescale_status || null;
  const mainQuoteUnchanged = mergeStatus?.main_quote_unchanged ?? ((docs.length > 0 || (supportingDiagnostic?.supporting_file_count ?? 0) > 0) && true);
  return (
    <div className="no-print space-y-3 rounded-[4px] border border-amber-400/50 bg-amber-50/60 p-4">
      <p className="flex items-center gap-2 font-mono text-sm font-semibold text-amber-900">
        <ShieldCheck className="h-4 w-4" /> Admin diagnostic — QS audit pipeline
      </p>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs text-amber-900/90">
        <div><span className="opacity-60">File:</span> {fileName || "—"}</div>
        <div className="truncate"><span className="opacity-60">Hash:</span> {fileHash ? fileHash.slice(0, 16) + "…" : "—"}</div>
        <div><span className="opacity-60">Analysis Run ID:</span> <strong>{supportingDiagnostic?.analysis_run_id || reportJson?.analysis_run_id || "—"}</strong></div>
        <div><span className="opacity-60">Generated timestamp:</span> <strong>{supportingDiagnostic?.generated_at || reportJson?.generated_at || "—"}</strong></div>
        <div><span className="opacity-60">Selected standard:</span> <strong>{supportingDiagnostic?.selected_standard || reportJson?.standard_name || "—"}</strong></div>
        <div><span className="opacity-60">Version:</span> <strong>{supportingDiagnostic?.standard_version || reportJson?.standard_version || "—"}</strong></div>
        <div><span className="opacity-60">Number of uploaded files:</span> <strong>{fileCount}</strong></div>
        <div><span className="opacity-60">Supporting files:</span> <strong>{supportingDiagnostic?.supporting_file_count ?? reportJson?.supporting_file_count ?? docs.length}</strong></div>
      </div>

      <div className="grid gap-2 font-mono text-xs md:grid-cols-2">
        <div className="rounded-[4px] border border-border/60 bg-card p-3">
          <p className="font-semibold text-navy">Quote Document Score: <strong>{documentScore ?? "—"}/100</strong></p>
          <p className="mt-1 text-muted-foreground">This should only use the main quote.</p>
        </div>
        <div className="rounded-[4px] border border-border/60 bg-card p-3">
          <p className="font-semibold text-navy">Project Pack Confidence Score: <strong>{projectConfidence ?? "—"}/100</strong></p>
          <p className="mt-1 text-muted-foreground">This should use the main quote plus supporting documents.</p>
        </div>
      </div>

      {mainQuoteUnchanged && docs.length > 0 && (
        <div className="rounded-[4px] border border-amber-500 bg-amber-100 p-3 font-mono text-xs text-amber-900">
          <p className="font-semibold">Main quote unchanged. Supporting documents added.</p>
          <p className="mt-1">{improved.length > 0 ? `Supporting documents changed ${improved.length} finding(s): ${improved.map((c) => c.check_id).join(", ")}.` : "Supporting documents did not change any findings."}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-[4px] border border-amber-500 bg-amber-100 p-3 font-mono text-xs text-amber-900">
          <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Warnings</p>
          <ul className="mt-1 list-disc pl-4">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <Section title="Uploaded files, extraction and score usage" icon={<Database className="h-3.5 w-3.5" />} defaultOpen>
        <div className="space-y-3">
          <div className="rounded-[4px] border border-border/60 bg-card p-3 font-mono text-xs">
            <p className="font-semibold text-navy">{fileName || "Main quote"}</p>
            <p className="text-muted-foreground">Detected: Main builder quote · Extraction: {evidence ? "success" : "unknown"}</p>
            <p className="text-muted-foreground">Used in Quote Document Score: YES · Used in Project Pack Confidence Score: YES</p>
            <p className="text-muted-foreground">Affected checks: all fixed-standard checks scored from the quote-only extraction.</p>
          </div>
          {docs.map((d, i) => (
            <div key={i} className="rounded-[4px] border border-border/60 bg-card p-3 font-mono text-xs">
              <p className="font-semibold text-navy">{d.file_name || "—"}</p>
              <p className="text-muted-foreground">Detected: {d.detected_type_label || d.detected_type || "—"} · Extraction: {d.extraction_success === false ? "failed" : "success"}</p>
              {d.extraction_error && <p className="text-rose-700">Extraction error: {d.extraction_error}</p>}
              <p className="text-muted-foreground">Used in Quote Document Score: {yesNo(d.used_in_quote_document_score)} · Used in Project Pack Confidence Score: {yesNo(d.used_in_project_pack_confidence_score ?? d.affected_report)}</p>
              <p className="text-muted-foreground">Affected checks: {listOrDash(d.affected_checks)}</p>
              {d.affected_reason && <p className="text-muted-foreground">{d.affected_reason}</p>}
              {d.summary && <p className="mt-1 text-navy/80">{d.summary}</p>}
              {(d.facts?.length ?? 0) > 0 ? (
                <table className="mt-2 w-full border-collapse">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-0.5 pr-2">Fact</th><th className="py-0.5 pr-2">Value</th><th className="py-0.5 pr-2">Source</th><th className="py-0.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.facts!.map((f, j) => (
                      <tr key={j} className="border-t border-border/40 align-top">
                        <td className="py-0.5 pr-2">{f.label}</td>
                        <td className="py-0.5 pr-2">{f.value}</td>
                        <td className="py-0.5 pr-2">{f.source_type}</td>
                        <td className="py-0.5">{f.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (d.key_facts?.length ?? 0) > 0 ? (
                <ul className="mt-2 list-disc pl-4 text-navy/80">
                  {d.key_facts!.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">No key facts extracted.</p>
              )}
              {(d.warnings?.length ?? 0) > 0 && (
                <ul className="mt-2 list-disc pl-4 text-rose-700">
                  {d.warnings!.map((w, j) => <li key={j}>{w}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Payment, Building Control and programme status" icon={<ShieldCheck className="h-3.5 w-3.5" />} defaultOpen>
        <div className="grid gap-3">
          <TopicPanel title="Payment structure status" status={paymentStatus} payment />
          <TopicPanel title="Building Control status" status={buildingControlStatus} />
          <TopicPanel title="Programme/timescale status" status={programmeStatus} />
        </div>
      </Section>

      {mergeStatus && (
        <Section title="Supporting document merge status" icon={<Database className="h-3.5 w-3.5" />} defaultOpen>
          <div className="grid gap-1 font-mono text-xs text-navy md:grid-cols-2">
            <div>Supporting documents uploaded: <strong>{mergeStatus.supporting_documents_uploaded ?? "—"}</strong></div>
            <div>Documents successfully extracted: <strong>{mergeStatus.documents_successfully_extracted ?? "—"}</strong></div>
            <div>Extracted evidence available: <strong>{yesNo(mergeStatus.extracted_evidence_available)}</strong></div>
            <div>Merge attempted: <strong>{yesNo(mergeStatus.merge_attempted)}</strong></div>
            <div>Merged into Project Pack Confidence: <strong>{yesNo(mergeStatus.merged_into_project_pack_confidence)}</strong></div>
            <div>Improved check count: <strong>{mergeStatus.improved_check_count ?? 0}</strong></div>
          </div>
          {mergeStatus.explanation && <p className="mt-2 font-mono text-xs text-muted-foreground">{mergeStatus.explanation}</p>}
        </Section>
      )}

      {improved.length > 0 && (
        <Section title={`Checks improved by supporting docs (${improved.length})`} icon={<Calculator className="h-3.5 w-3.5" />}>
          <ul className="space-y-1 font-mono text-xs">
            {improved.map((c, i) => (
              <li key={i}><strong>{c.check_id}</strong> {c.check_title}: {c.quote_verdict} → {c.merged_verdict} <span className="text-muted-foreground">({c.note})</span></li>
            ))}
          </ul>
        </Section>
      )}

      {mergedEvidence && (
        <Section title="Merged evidence record (JSON)" icon={<Database className="h-3.5 w-3.5" />}>
          <pre className="max-h-80 overflow-auto rounded-[4px] bg-navy/5 p-3 font-mono text-[10px] leading-relaxed text-navy">
            {JSON.stringify(mergedEvidence, null, 2)}
          </pre>
        </Section>
      )}

      {missingAfterAll.length > 0 && (
        <Section title={`Still missing after all documents reviewed (${missingAfterAll.length})`} icon={<AlertTriangle className="h-3.5 w-3.5" />}>
          <ul className="list-disc pl-4 font-mono text-xs">
            {missingAfterAll.map((m, i) => <li key={i}><strong>{m.check_id}</strong> {m.check_title}</li>)}
          </ul>
        </Section>
      )}


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
