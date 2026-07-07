import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { enqueueTransactionalEmail } from "../_shared/enqueue-transactional-email.ts";
import { robustParseJson } from "./json-repair.ts";
import {
  assembleResults,
  buildBuilderMessage,
  buildExtractionPrompt,
  buildFixedReportHtml,
  buildQuestions,
  DISCLAIMER,
  scoreChecklist,
  tradeFromContent,
  tradeFromProjectType,
  verdictSummary,
  type CheckResult,
  type CheckRow,
  type StandardRow,
} from "./standard-engine.ts";
import {
  buildDocExtractionPrompt,
  buildMergedChecklistPrompt,
  diffChecklists,
  docTypeLabel,
  guessTypeFromName,
  hasPaymentScheduleDoc,
  mergedEvidenceText,
  DOC_TYPES,
  type DocExtraction,
  type DocFact,
  type DocType,
} from "./document-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

function sanitizeReportHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "$1=$2#$2");
}

function mediaForFile(name: string): { kind: "pdf" | "image" | "text"; mediaType: string } {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return { kind: "image", mediaType: "image/png" };
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return { kind: "image", mediaType: "image/jpeg" };
  if (lower.endsWith(".webp")) return { kind: "image", mediaType: "image/webp" };
  if (lower.endsWith(".txt")) return { kind: "text", mediaType: "text/plain" };
  return { kind: "pdf", mediaType: "application/pdf" };
}

async function callAnthropic(content: unknown, maxTokens: number): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0,
      messages: [{ role: "user", content }],
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${errText}`);
  }
  const result = await resp.json();
  return result.content?.[0]?.text || "";
}

function contentBlockFromBytes(bytes: Uint8Array, media: { kind: "pdf" | "image" | "text"; mediaType: string }): unknown {
  if (media.kind === "text") {
    return { type: "text", text: "DOCUMENT TEXT:\n" + new TextDecoder().decode(bytes) };
  }
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  const base64 = btoa(binary);
  return media.kind === "image"
    ? { type: "image", source: { type: "base64", media_type: media.mediaType, data: base64 } }
    : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };
}

// Download + identify + extract facts from ONE supporting document.
async function extractSupportingDoc(
  supabase: ReturnType<typeof createClient>,
  path: string,
  displayName: string,
): Promise<DocExtraction | null> {
  try {
    const { data: fileData, error } = await supabase.storage.from("quote-pdfs").download(path);
    if (error || !fileData) {
      console.error("extractSupportingDoc: download failed", path, error?.message);
      return null;
    }
    const media = mediaForFile(displayName || path);
    const bytes = new Uint8Array(await fileData.arrayBuffer());
    const block = contentBlockFromBytes(bytes, media);
    const hint = guessTypeFromName(displayName || path);
    const raw = await callAnthropic([block, { type: "text", text: buildDocExtractionPrompt(displayName || path, hint) }], 3000);
    const parsed = robustParseJson(raw) || {};
    let detected = String(parsed.detected_type || "").trim() as DocType;
    if (!DOC_TYPES.includes(detected)) detected = hint;
    const facts: DocFact[] = Array.isArray(parsed.facts)
      ? parsed.facts.slice(0, 40).map((f: Record<string, unknown>) => ({
          label: String(f.label ?? "").slice(0, 200),
          value: String(f.value ?? "").slice(0, 1000),
          source_type: String(f.source_type ?? "ai_inference") as DocFact["source_type"],
          status: String(f.status ?? "stated").slice(0, 80),
        })).filter((f: DocFact) => f.label || f.value)
      : [];
    return {
      file_name: displayName || path,
      detected_type: detected,
      detected_type_label: docTypeLabel(detected),
      facts,
      summary: String(parsed.summary ?? "").slice(0, 600) || "No summary available.",
      affected_report: false,
      affected_reason: null,
    };
  } catch (e) {
    console.error("extractSupportingDoc: error", path, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { quoteCheckId } = await req.json();
    if (!quoteCheckId) {
      return new Response(JSON.stringify({ error: "quoteCheckId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: record, error: fetchError } = await supabase
      .from("quote_checks").select("*").eq("id", quoteCheckId).single();
    if (fetchError || !record) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (record.status === "complete" && record.report_json) {
      return new Response(
        JSON.stringify({ success: true, reportJson: record.report_json, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Payment verification ---
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (!record.stripe_payment_id) {
      return new Response(JSON.stringify({ error: "Payment not verified for this quote check" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (record.stripe_payment_id !== "free_entitlement") {
      const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      let paid = false;
      try {
        const intent = await stripe.paymentIntents.retrieve(record.stripe_payment_id);
        paid = intent.status === "succeeded";
      } catch (e) { console.error("analyse-quote: Stripe verification failed", e); }
      if (!paid) {
        return new Response(JSON.stringify({ error: "Stripe payment not in 'succeeded' state" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // --- Download + fingerprint ---
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("quote-pdfs").download(record.pdf_url);
    if (downloadError || !fileData) throw new Error("Failed to download file: " + downloadError?.message);

    const media = mediaForFile(record.pdf_url || "");
    const fileBytes = await fileData.arrayBuffer();
    const bytes = new Uint8Array(fileBytes);
    let fileHash: string | null = null;
    try {
      const digest = await crypto.subtle.digest("SHA-256", fileBytes);
      fileHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { console.error("analyse-quote: hashing failed", e); }

    const contentBlock: unknown = contentBlockFromBytes(bytes, media);

    // --- Standard selection ---
    const selectedTrade = tradeFromProjectType(record.project_type);

    // =========================================================================
    // GENERAL GUIDANCE MODE — no fixed standard for this project type
    // =========================================================================
    if (!selectedTrade) {
      const genPrompt = `You are reviewing a UK residential building quote for which NO fixed ProGrafter checklist standard exists yet. Extract facts only (no scoring). Return ONLY valid JSON: {"is_building_quote":boolean,"figures":{"subtotal":string|null,"vat_rate":string|null,"vat_amount":string|null,"total_incl_vat":string|null},"figures_reconcile":boolean,"observations":[string],"questions":[string]}. Quote figures verbatim; never recompute.`;
      const genRaw = await callAnthropic([contentBlock, { type: "text", text: genPrompt }], 3000);
      const gen = robustParseJson(genRaw) || {};
      const figures = gen.figures || {};
      const reportJson = {
        analysis_mode: "general_guidance",
        standard_id: null,
        standard_name: null,
        standard_version: null,
        general_guidance_notice: "This is general quote guidance. A fixed ProGrafter checklist standard is not yet available for this project type.",
        figures,
        additional_observations: Array.isArray(gen.observations) ? gen.observations : [],
        questions_list: Array.isArray(gen.questions) ? gen.questions : [],
        builder_message: buildBuilderMessage((Array.isArray(gen.questions) ? gen.questions : []).map((q: string, i: number) => ({ check_id: `G-${i + 1}`, question: q }))),
        disclaimer: DISCLAIMER,
        report_html: `<div class="qr-report"><div class="qr-general-notice">This is general quote guidance. A fixed ProGrafter checklist standard is not yet available for this project type.</div><h2>Figures (as stated)</h2><p>Subtotal: ${figures.subtotal ?? "not stated"} · VAT: ${figures.vat_amount ?? figures.vat_rate ?? "not stated"} · Total: ${figures.total_incl_vat ?? "not stated"}</p><h2>Observations</h2><ul>${(Array.isArray(gen.observations) ? gen.observations : []).map((o: string) => `<li>${String(o)}</li>`).join("")}</ul><h2>Disclaimer</h2><p class="muted">${DISCLAIMER}</p></div>`,
      };
      await supabase.from("quote_checks").update({
        status: "complete", report_json: reportJson, report_html: reportJson.report_html,
        analysis_mode: "general_guidance", file_hash: fileHash,
      }).eq("id", quoteCheckId);
      await maybeSendEmail(supabase, record, quoteCheckId);
      return new Response(JSON.stringify({ success: true, reportJson }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Load the active standard + fixed checklist ---
    const { data: stdRow } = await supabase
      .from("quote_standards").select("*")
      .eq("trade_type", selectedTrade).eq("status", "active").single();
    if (!stdRow) throw new Error(`No active standard for trade ${selectedTrade}`);
    const standard = stdRow as StandardRow;

    const { data: checkRows } = await supabase
      .from("quote_standard_checks").select("*")
      .eq("standard_uuid", standard.id).order("display_order", { ascending: true });
    const checks = (checkRows || []) as CheckRow[];
    if (checks.length === 0) throw new Error("Standard has no checks");

    // =========================================================================
    // STAGE B — QUOTE-ONLY EVIDENCE EXTRACTION (main quote only -> Document Score)
    // =========================================================================
    const prompt = buildExtractionPrompt(standard, checks);
    const raw = await callAnthropic([contentBlock, { type: "text", text: prompt }], 8000);
    const parsed = robustParseJson(raw);
    if (!parsed) {
      await supabase.from("quote_checks").update({ status: "error" }).eq("id", quoteCheckId);
      return new Response(JSON.stringify({ error: "We couldn't read this quote. Please try re-uploading a clearer copy." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (parsed.is_building_quote === false) {
      const errReport = { error: "This doesn't look like a building quote. Please upload a builder's quotation or estimate." };
      await supabase.from("quote_checks").update({ status: "complete", report_json: errReport, file_hash: fileHash }).eq("id", quoteCheckId);
      return new Response(JSON.stringify({ success: true, reportJson: errReport }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const contentTrade = tradeFromContent({ detected_trade: parsed.detected_trade });
    const mismatch = !!contentTrade && contentTrade !== selectedTrade;

    // Quote-only results (Document Score = the main builder quote alone).
    const quoteResults = assembleResults(checks, Array.isArray(parsed.checks) ? parsed.checks : []);
    const quoteCounts = scoreChecklist(quoteResults);
    const figures = parsed.figures || {};
    const figuresReconcile = parsed.figures_reconcile !== false;
    const additionalObservations = Array.isArray(parsed.additional_observations) ? parsed.additional_observations : [];

    // =========================================================================
    // STAGE A — IDENTIFY + EXTRACT EACH SUPPORTING DOCUMENT SEPARATELY
    // =========================================================================
    const supportingFilesRaw: unknown[] = Array.isArray(record.supporting_files) ? record.supporting_files : [];
    const docExtractions: DocExtraction[] = [];
    for (const sf of supportingFilesRaw.slice(0, 10)) {
      const obj = (sf && typeof sf === "object") ? sf as Record<string, unknown> : null;
      const path = typeof sf === "string" ? sf : String(obj?.path ?? obj?.url ?? "");
      const name = typeof sf === "string" ? sf : String(obj?.name ?? obj?.path ?? "supporting document");
      if (!path) continue;
      const ext = await extractSupportingDoc(supabase, path, name);
      if (ext) docExtractions.push(ext);
    }

    // =========================================================================
    // STAGE C — MERGED CHECKLIST (main quote + supporting evidence -> Project Pack Confidence)
    // =========================================================================
    let mergedResults: CheckResult[] = quoteResults;
    let mergedCounts = quoteCounts;
    const evidenceText = mergedEvidenceText(docExtractions);
    if (docExtractions.length > 0 && evidenceText) {
      try {
        const mPrompt = buildMergedChecklistPrompt(standard, checks, evidenceText);
        const mRaw = await callAnthropic([contentBlock, { type: "text", text: mPrompt }], 8000);
        const mParsed = robustParseJson(mRaw);
        if (mParsed && Array.isArray(mParsed.checks)) {
          const mr = assembleResults(checks, mParsed.checks);
          const mc = scoreChecklist(mr);
          // Project Pack Confidence must never be LOWER than the quote-only score
          // just because more documents were supplied.
          if (mc.score >= quoteCounts.score) {
            mergedResults = mr;
            mergedCounts = mc;
          }
        }
      } catch (e) { console.error("analyse-quote: merged checklist pass failed", e); }
    }

    // --- What supporting documents changed, and payment-structure logic ---
    const improvedChecks = diffChecklists(quoteResults, mergedResults);
    const paymentSuppliedSeparately = hasPaymentScheduleDoc(docExtractions);
    const paymentImproved = improvedChecks.some((c) => /payment|stage|instal|deposit|retention/i.test(c.check_title));

    // Attribute whether each document affected the report.
    for (const d of docExtractions) {
      if (d.facts.length === 0) {
        d.affected_report = false;
        d.affected_reason = "No usable evidence could be extracted from this document.";
      } else if (d.detected_type === "payment_schedule" && paymentImproved) {
        d.affected_report = true;
        d.affected_reason = "Payment structure supplied separately — improved Project Pack Confidence, subject to written confirmation.";
      } else if (improvedChecks.length > 0) {
        d.affected_report = true;
        d.affected_reason = "Evidence merged into the Project Pack Confidence assessment.";
      } else {
        d.affected_report = false;
        d.affected_reason = "Reviewed, but it did not change any checklist result.";
      }
    }

    // Admin warning: docs uploaded but nothing merged.
    const noEvidenceMergedWarning = docExtractions.length > 0 && improvedChecks.length === 0
      ? "Supporting documents uploaded but no evidence was merged into the report. Review extraction."
      : null;

    // The report body is generated from the MERGED evidence record.
    const results = mergedResults;
    const counts = mergedCounts;
    const questions = buildQuestions(results);
    const builderMessage = buildBuilderMessage(questions);

    const supportingDocsSummary = docExtractions.map((d) => ({
      file_name: d.file_name,
      detected_type: d.detected_type,
      detected_type_label: d.detected_type_label,
      key_facts: d.facts.slice(0, 8).map((f) => `${f.label}: ${f.value}`),
      affected_report: d.affected_report,
      affected_reason: d.affected_reason,
    }));

    const reportHtml = sanitizeReportHtml(buildFixedReportHtml({
      standard, counts, results, figures, figures_reconcile: figuresReconcile,
      questions, builderMessage, additionalObservations, mismatch,
      documentScore: quoteCounts.score,
      projectConfidenceScore: mergedCounts.score,
      supportingDocs: supportingDocsSummary,
      improvedChecks,
      paymentSuppliedSeparately,
      paymentImproved,
    }));

    const reportJson = {
      analysis_mode: "fixed_standard",
      standard_id: standard.standard_id,
      standard_name: standard.standard_name,
      standard_version: standard.version,
      checked_against: `${standard.standard_name} \u00b7 Version ${standard.version}`,
      checklist_score: counts.score,
      document_score: quoteCounts.score,
      project_confidence_score: mergedCounts.score,
      total_checks: counts.total_checks,
      addressed_count: counts.addressed_count,
      clarification_count: counts.clarification_count,
      missing_count: counts.missing_count,
      verdict_summary: verdictSummary(counts),
      figures,
      figures_reconcile: figuresReconcile,
      checklist_results: results,
      quote_only_results: quoteResults,
      supporting_documents: supportingDocsSummary,
      improved_checks: improvedChecks,
      payment_supplied_separately: paymentSuppliedSeparately,
      questions_detailed: questions,
      questions_list: questions.map((q) => `${q.check_id}: ${q.question}`),
      builder_message: builderMessage,
      additional_observations: additionalObservations,
      standard_mismatch: mismatch,
      no_evidence_merged_warning: noEvidenceMergedWarning,
      disclaimer: DISCLAIMER,
      report_html: reportHtml,
    };

    // --- Consistency check vs prior run of same file + same standard version ---
    let consistencyDiagnostic: Record<string, unknown> | null = null;
    if (fileHash) {
      try {
        const { data: prior } = await supabase
          .from("quote_checks")
          .select("id, created_at, checklist_score, checklist_results, standard_version")
          .eq("file_hash", fileHash).eq("standard_id", standard.standard_id)
          .eq("standard_version", standard.version).neq("id", quoteCheckId)
          .eq("status", "complete").order("created_at", { ascending: false }).limit(1);
        const p = prior?.[0];
        if (p) {
          const prevScore = Number(p.checklist_score);
          const priorResults = (p.checklist_results as typeof results) || [];
          const changed = results.filter((r) => {
            const pr = priorResults.find((x) => x.check_id === r.check_id);
            return pr && pr.verdict !== r.verdict;
          }).map((r) => {
            const pr = priorResults.find((x) => x.check_id === r.check_id)!;
            return { check_id: r.check_id, previous_verdict: pr.verdict, new_verdict: r.verdict, previous_evidence: pr.evidence_quote, new_evidence: r.evidence_quote };
          });
          if (Number.isFinite(prevScore) && (Math.abs(counts.score - prevScore) > 3 || changed.length > 0)) {
            consistencyDiagnostic = {
              warning: docExtractions.length > 0
                ? "Main quote unchanged. Supporting documents added."
                : "Consistency warning: this quote produced a different result under the same standard.",
              main_quote_unchanged: true,
              supporting_documents_added: docExtractions.length,
              previous_run_id: p.id, previous_score: prevScore, new_score: counts.score,
              changed_checks: changed,
              improved_by_supporting_docs: improvedChecks,
              compared_at: new Date().toISOString(),
            };
          }
        }
      } catch (e) { console.error("analyse-quote: consistency check failed", e); }
    }

    if (noEvidenceMergedWarning) {
      consistencyDiagnostic = {
        ...(consistencyDiagnostic || {}),
        admin_warning: noEvidenceMergedWarning,
      };
    }

    // --- Account + magic link ---
    let userId: string | null = null;
    let magicLink: string | null = null;
    if (record.email) {
      try {
        await supabase.auth.admin.createUser({ email: record.email, email_confirm: true, user_metadata: { user_type: "homeowner" } }).catch(() => {});
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: "magiclink", email: record.email,
          options: { redirectTo: "https://prografter.co.uk/dashboard/quote-checks" },
        });
        userId = linkData?.user?.id ?? null;
        magicLink = (linkData?.properties as { action_link?: string } | undefined)?.action_link ?? null;
      } catch (e) { console.error("analyse-quote: account creation failed", e); }
    }

    await supabase.from("quote_checks").update({
      status: "complete",
      file_hash: fileHash,
      analysis_mode: "fixed_standard",
      standard_id: standard.standard_id,
      standard_name: standard.standard_name,
      standard_version: standard.version,
      checklist_results: results,
      checklist_score: counts.score,
      addressed_count: counts.addressed_count,
      clarification_count: counts.clarification_count,
      missing_count: counts.missing_count,
      total_checks: counts.total_checks,
      standard_mismatch: mismatch,
      quote_evidence: { figures, detected_trade: parsed.detected_trade, figures_reconcile: figuresReconcile },
      consistency_diagnostic: consistencyDiagnostic,
      report_json: reportJson,
      report_html: reportHtml,
      quality_score: counts.score,
      user_id: userId,
      subtotal_text: figures.subtotal ?? null,
      vat_text: figures.vat_amount ?? figures.vat_rate ?? null,
      total_text: figures.total_incl_vat ?? null,
    }).eq("id", quoteCheckId);

    await maybeSendEmail(supabase, record, quoteCheckId, magicLink);

    return new Response(JSON.stringify({ success: true, reportJson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyse-quote error:", err);
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.quoteCheckId) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from("quote_checks").update({ status: "error" }).eq("id", body.quoteCheckId);
      }
    } catch { /* best effort */ }
    return new Response(JSON.stringify({ error: "An unexpected error occurred while analysing the quote." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function maybeSendEmail(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>,
  quoteCheckId: string,
  magicLink?: string | null,
) {
  try {
    if (record.email) {
      const projectType = (record.project_type as string) || "";
      const reportUrl = magicLink || "https://prografter.co.uk/dashboard/quote-checks";
      await enqueueTransactionalEmail(supabase, {
        templateName: "quote-health-check-ready",
        recipientEmail: record.email as string,
        idempotencyKey: `quote-health-check-ready:${quoteCheckId}`,
        templateData: { reportUrl, projectType },
      });
    }
  } catch (e) { console.error("analyse-quote: failed to enqueue report email", e); }
}
