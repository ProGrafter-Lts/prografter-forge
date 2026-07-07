# Quote Health Check — Staged Multi-Document Pipeline

## Root cause (confirmed in code)
- `QuoteChecker.tsx` line 113 & `AdminAdvancedQuoteReview.tsx` line 154 both do `setFile(e.target.files?.[0])` — **only one file is ever captured**.
- `create_quote_check_v2` stores a single `_pdf_url`; `quote_checks` has one `pdf_url` column, no supporting-files column.
- `analyse-quote/index.ts` lines 124-148 download only `record.pdf_url` and send it as one content block in a single AI pass (lines 200-201). No per-document extraction, no merge, no second score.
- Result: any "extra documents" were never uploaded or read, so the report cannot change. This is a structural gap, not a merge bug.

## 1. Storage & schema
- Migration: add `supporting_files jsonb` (array of `{path, name, mime}`) to `quote_checks`, plus `merged_evidence jsonb`, `document_extractions jsonb`, `supporting_docs_diagnostic jsonb`. (`document_score`/`project_confidence_score` already exist.)
- Update `create_quote_check_v2` RPC to accept `_supporting_files jsonb default '[]'` and persist it. Keep old signature working (default empty).

## 2. Upload UI (minimal, no redesign)
- Add an optional multi-file "Supporting documents (payment schedule, drawings, spec, emails…)" dropzone below the main quote upload in `QuoteChecker.tsx` and `AdminAdvancedQuoteReview.tsx`.
- Upload each to `quote-pdfs`; pass array to the RPC as `_supporting_files`.
- Main quote stays the single required `pdf_url`.

## 3. Edge function — staged workflow (`analyse-quote/index.ts` + new `document-pipeline.ts`)
Replace the single-pass block with:
1. **Identify**: for each file (main + supporting) classify type from filename + a light AI/heuristic pass → one of: main_builder_quote, payment_schedule, drawings, specification, scope_of_works, builder_message, homeowner_notes, building_control, planning, structural_calcs, photo_evidence, unknown_supporting_document.
2. **Extract per document** (separate temperature-0 call per file, chunk long PDFs by page/section and merge chunk facts): use type-specific extraction schemas (main quote fields, payment-schedule fields, drawings/spec fields, homeowner-notes fields).
3. **Source-tag every fact**: main_quote, payment_schedule_document, drawing, specification, homeowner_note, builder_message, admin_note, ai_inference, not_found.
4. **Merged evidence record**: combine all documents; each fact keeps its source + status. Store in `merged_evidence`/`document_extractions`.
5. **Two scores**:
   - Document Score = checklist run against **main quote evidence only**.
   - Project Pack Confidence Score = checklist against **merged evidence**; must not decrease when more docs are added.
   - Persist to `document_score` and `project_confidence_score`.
6. **Report generated from merged evidence** (not first doc only).

## 4. Payment-structure logic
- If payment stages absent from main quote but present in a supporting doc: Document Score → "Needs clarification / missing from main quote"; Project Pack Confidence → "Supplied separately — confirm it forms part of the agreed quote/contract." Wording exactly as specified.

## 5. Report wording & sections (`QuoteHealthCheckReport.tsx`)
- Tag each line: Included in quote / Supplied separately / Homeowner supplied / Builder confirmed separately / Not found / AI inference.
- Add "Supporting Documents Reviewed" section: file name, detected type, key facts, whether it affected the report (and why not if unused).
- Show both scores distinctly.

## 6. Consistency check
- Extend existing file_hash consistency logic: when main quote unchanged but supporting docs added, show "Main quote unchanged. Supporting documents added." + which checks changed (e.g. payment: Missing → Supplied separately). If docs uploaded but nothing merged, set an admin warning "Supporting documents uploaded but no evidence was merged into the report. Review extraction."

## 7. Admin diagnostics (`QuoteAuditDiagnostic.tsx`)
- Panel: all uploaded docs + detected types, extracted facts per doc with source tags, merged evidence record, both score calculations, checks affected by supporting docs, checks still missing after all docs reviewed.

## Success criteria
Every uploaded doc identified & extracted separately; payment schedules recognised when supplied separately; supporting docs raise Project Pack Confidence while Document Score stays quote-only; report shows quote vs supporting provenance; same quote + added payment structure no longer yields identical result without explanation; admin can inspect why docs did/didn't affect the report; long docs chunked; deterministic (temperature 0) extraction.

## Notes / risks
- Touches the paid analysis pipeline — keep general_guidance mode and single-file fallback intact so existing/paid checks never break.
- More AI calls per run (one per document + chunks) → higher latency/cost; runs in background via existing `EdgeRuntime.waitUntil`.
