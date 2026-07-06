import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { enqueueTransactionalEmail } from "../_shared/enqueue-transactional-email.ts";
import { robustParseJson } from "./json-repair.ts";
import { EXTRACTION_PROMPT, buildReportPrompt } from "./prompts.ts";
import {
  normaliseEvidence,
  validateEvidence,
  sanitiseMissingItems,
  scoreQuote,
  type HomeownerContext,
} from "./qs-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

// Server-side defence-in-depth sanitizer for AI-generated HTML.
function sanitizeReportHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "$1=$2#$2");
}

const MODE_MAP: Record<string, { label: string; guidance: string; questionsHeading: string; scoreCol: string; tradeNote: string }> = {
  homeowner: {
    label: "Homeowner checking a builder's quote",
    guidance: "Use protective, calm, plain-English language. Help them feel informed, not alarmed.",
    questionsHeading: "Questions To Ask The Builder",
    scoreCol: "What this means for you",
    tradeNote: "",
  },
  trade_self: {
    label: "Trade checking their OWN quote before sending it",
    guidance: "Use improvement-focused, supportive language: 'Here's how to make your quote clearer, stronger and easier for the customer to approve.' Never make the trade feel attacked.",
    questionsHeading: "Questions A Customer May Ask You",
    scoreCol: "How to improve your quote",
    tradeNote: `In addition, adapt section wording for a trade improving their own quote. Frame the summary as: "This quote can be made stronger and easier for a customer to approve by improving clarity, exclusions, payment stages and scope detail." Emphasise Suggested Improvements. Suggest structural improvements to the document, never change actual prices.`,
  },
  trade_sub: {
    label: "Trade checking a subcontractor's quote",
    guidance: "Use practical, peer-to-peer language focused on scope gaps, responsibilities and risk transfer between main contractor and subcontractor.",
    questionsHeading: "Questions To Ask The Subcontractor",
    scoreCol: "What this means for you",
    tradeNote: "",
  },
  other: {
    label: "Someone reviewing a building quote",
    guidance: "Use clear, neutral, plain-English language.",
    questionsHeading: "Questions To Ask The Builder",
    scoreCol: "What this means",
    tradeNote: "",
  },
};

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

const clampInt = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
      .from("quote_checks")
      .select("*")
      .eq("id", quoteCheckId)
      .single();

    if (fetchError || !record) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (record.status === "complete" && record.report_json) {
      return new Response(
        JSON.stringify({ success: true, reportJson: record.report_json, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Payment / entitlement verification (unchanged) ---
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (!record.stripe_payment_id) {
      return new Response(
        JSON.stringify({ error: "Payment not verified for this quote check" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (record.stripe_payment_id !== "free_entitlement") {
      const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      let paid = false;
      try {
        const intent = await stripe.paymentIntents.retrieve(record.stripe_payment_id);
        paid = intent.status === "succeeded";
      } catch (e) {
        console.error("analyse-quote: Stripe verification failed", e);
      }
      if (!paid) {
        return new Response(
          JSON.stringify({ error: "Stripe payment not in 'succeeded' state" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // --- Download + fingerprint the uploaded file ---
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("quote-pdfs")
      .download(record.pdf_url);
    if (downloadError || !fileData) {
      throw new Error("Failed to download file: " + downloadError?.message);
    }

    const media = mediaForFile(record.pdf_url || "");
    const fileBytes = await fileData.arrayBuffer();
    const bytes = new Uint8Array(fileBytes);

    let fileHash: string | null = null;
    try {
      const digest = await crypto.subtle.digest("SHA-256", fileBytes);
      fileHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (hashErr) {
      console.error("analyse-quote: hashing failed", hashErr);
    }

    // Build the content block for the uploaded file.
    let contentBlock: unknown;
    if (media.kind === "text") {
      contentBlock = { type: "text", text: "QUOTE TEXT:\n" + new TextDecoder().decode(bytes) };
    } else {
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);
      contentBlock = media.kind === "image"
        ? { type: "image", source: { type: "base64", media_type: media.mediaType, data: base64 } }
        : { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };
    }

    const intake = (record.intake || {}) as Record<string, unknown>;
    const checkerKey = (record.checker_type || "homeowner") as string;
    const mode = MODE_MAP[checkerKey] || MODE_MAP.homeowner;
    const str = (v: unknown) => (v == null || v === "" ? "Not specified" : String(v));
    const items = Array.isArray(intake.expected_items) ? (intake.expected_items as string[]).join(", ") : "Not specified";

    // =====================================================================
    // STAGE 1 — QUOTE EVIDENCE EXTRACTION (facts only)
    // =====================================================================
    const extractionRaw = await callAnthropic(
      [contentBlock, { type: "text", text: EXTRACTION_PROMPT }],
      4000,
    );
    const rawEvidence = robustParseJson(extractionRaw);
    if (!rawEvidence) {
      console.error("analyse-quote: evidence extraction failed to parse", extractionRaw.slice(0, 500));
      await supabase.from("quote_checks").update({ status: "error" }).eq("id", quoteCheckId);
      return new Response(JSON.stringify({ error: "We couldn't read this quote. Please try re-uploading a clearer copy." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const evidence = normaliseEvidence(rawEvidence);

    // Not a building quote — store a friendly error report.
    if (!evidence.is_building_quote) {
      const errReport = { error: "This doesn't look like a building quote. Please upload a builder's quotation or estimate." };
      await supabase.from("quote_checks").update({
        status: "complete",
        report_json: errReport,
        quote_evidence: evidence,
        file_hash: fileHash,
      }).eq("id", quoteCheckId);
      return new Response(JSON.stringify({ success: true, reportJson: errReport }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =====================================================================
    // STAGE 2 — EVIDENCE VALIDATION
    // =====================================================================
    const validation = validateEvidence(evidence);
    if (validation.blocked) {
      console.warn("analyse-quote: evidence blocked for admin review", validation.contradictions);
      await supabase.from("quote_checks").update({
        status: "needs_review",
        quote_evidence: evidence,
        evidence_validation: validation,
        file_hash: fileHash,
      }).eq("id", quoteCheckId);
      return new Response(
        JSON.stringify({ error: "This quote produced conflicting information and has been flagged for a manual review. We'll be in touch shortly." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // =====================================================================
    // STAGE 3 + 4 — QS RULES ENGINE + DETERMINISTIC SCORING
    // =====================================================================
    const combinedContext = `${record.description || ""} ${str(intake.expected_scope)} ${str(intake.concerns)}`.toLowerCase();
    const ctx: HomeownerContext = {
      project_type: record.project_type || null,
      expected_items: Array.isArray(intake.expected_items) ? (intake.expected_items as string[]) : [],
      expected_scope: (record.description as string) || (intake.expected_scope as string) || null,
      concerns: (intake.concerns as string) || null,
      quote_total: (intake.quote_total as string) || null,
      labour_material: (intake.labour_material as string) || null,
      payment_supplied: /payment|deposit|stage payment|instal|milestone/.test(combinedContext),
      programme_supplied: /start date|finish|complete|completion|\bweeks?\b|\bmonths?\b|timescale|timeline|duration|programme/.test(combinedContext),
    };

    const scoring = scoreQuote(evidence, ctx);
    const sanitisedMissing = sanitiseMissingItems(evidence);

    // =====================================================================
    // STAGE 5 — AI REPORT GENERATION from the structured evidence
    // =====================================================================
    const reportPrompt = buildReportPrompt({
      modeLabel: mode.label,
      modeGuidance: mode.guidance,
      questionsHeading: mode.questionsHeading,
      tradeNote: mode.tradeNote,
      evidence,
      scoring,
      ruleNotes: scoring.breakdown.map((b) => ({ category: b.category, score: `${b.quote_score}/10`, weight: `${b.weight}%`, anchor: b.anchor, status: b.status, source: b.source, note: b.note, improvement: b.improvement })),
      sanitisedMissing,
      context: {
        project_type: record.project_type || "Not specified",
        postcode: record.postcode || "Not specified",
        expected_items: items,
        expected_scope: (record.description as string) || str(intake.expected_scope),
        concerns: str(intake.concerns),
      },
    });

    const narrativeRaw = await callAnthropic([{ type: "text", text: reportPrompt }], 8000);
    const narrative = robustParseJson(narrativeRaw) || {};

    // =====================================================================
    // ASSEMBLE the final report_json — deterministic scores + AI narrative
    // =====================================================================
    const rawReportHtml = typeof narrative.report_html === "string" ? narrative.report_html : null;
    const reportHtml = rawReportHtml ? sanitizeReportHtml(rawReportHtml) : null;

    const figures = {
      subtotal: evidence.subtotal ?? "not stated",
      vat: evidence.vat_amount ?? (evidence.vat_rate ?? "not stated"),
      total: evidence.total_incl_vat ?? "not stated",
    };

    const reportJson: Record<string, unknown> = {
      figures,
      checker_type: checkerKey,
      document_score: scoring.document_score,
      project_confidence_score: scoring.project_confidence_score,
      quality_score: scoring.document_score,
      score_breakdown: scoring.breakdown.map((b) => ({
        category: b.category,
        weight: b.weight,
        quote_score: b.quote_score,
        confidence_score: b.confidence_score,
        anchor: b.anchor,
        status: b.status,
        source: b.source,
        note: b.note,
        improvement: b.improvement,
      })),
      completeness_pct: scoring.completeness_pct,
      construction_completeness_pct: scoring.construction_completeness_pct,
      commercial_completeness_pct: scoring.commercial_completeness_pct,
      overall_readiness_pct: scoring.overall_readiness_pct,
      risk_level: scoring.risk_level,
      project_confidence: scoring.project_confidence,
      recommended_next_step: scoring.recommended_next_step,
      comparison_readiness: scoring.comparison_readiness,
      certification_readiness: scoring.certification_readiness,
      assessment: scoring.assessment,
      top_issues: scoring.top_issues,
      recommendation_summary: typeof narrative.recommendation_summary === "string" ? narrative.recommendation_summary : "",
      what_to_do_next: Array.isArray(narrative.what_to_do_next) ? narrative.what_to_do_next : [],
      questions_list: Array.isArray(narrative.questions_list) ? narrative.questions_list : [],
      builder_message: typeof narrative.builder_message === "string" ? narrative.builder_message : "",
      report_html: reportHtml,
    };

    // --- Account on purchase for homeowners (unchanged) ---
    let userId: string | null = null;
    let magicLink: string | null = null;
    if (record.email) {
      try {
        await supabase.auth.admin
          .createUser({ email: record.email, email_confirm: true, user_metadata: { user_type: "homeowner" } })
          .catch(() => {});
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: record.email,
          options: { redirectTo: "https://prografter.co.uk/dashboard/quote-checks" },
        });
        if (linkErr) console.error("analyse-quote: generateLink failed", linkErr);
        userId = linkData?.user?.id ?? null;
        magicLink = (linkData?.properties as { action_link?: string } | undefined)?.action_link ?? null;
      } catch (acctErr) {
        console.error("analyse-quote: account creation failed", acctErr);
      }
    }

    // --- Re-run consistency check (STEP 7) ---
    const docScore = scoring.document_score;
    const confScore = scoring.project_confidence_score;
    const analysisSnapshot: Record<string, unknown> = {
      file_hash: fileHash,
      document_score: docScore,
      project_confidence_score: confScore,
      score_breakdown: scoring.breakdown,
      context_used: {
        project_type: record.project_type || null,
        checker_type: checkerKey,
        expected_items: items,
        quote_total: (intake.quote_total as string) || null,
      },
      analysed_at: new Date().toISOString(),
    };

    let consistencyDiagnostic: Record<string, unknown> | null = null;
    if (fileHash) {
      try {
        const { data: priorRuns } = await supabase
          .from("quote_checks")
          .select("id, created_at, document_score, quality_score, qs_scoring, analysis_snapshot")
          .eq("file_hash", fileHash)
          .neq("id", quoteCheckId)
          .eq("status", "complete")
          .order("created_at", { ascending: false })
          .limit(1);
        const prior = priorRuns?.[0];
        if (prior) {
          const priorDoc = prior.document_score != null
            ? Number(prior.document_score)
            : (prior.analysis_snapshot as Record<string, unknown> | null)?.document_score != null
              ? Number((prior.analysis_snapshot as Record<string, unknown>).document_score)
              : prior.quality_score != null ? Number(prior.quality_score) : NaN;
          if (Number.isFinite(priorDoc)) {
            const delta = docScore - priorDoc;
            if (Math.abs(delta) > 5) {
              const priorBreakdown = Array.isArray((prior.qs_scoring as Record<string, unknown> | null)?.breakdown)
                ? ((prior.qs_scoring as Record<string, unknown>).breakdown as any[])
                : Array.isArray((prior.analysis_snapshot as Record<string, unknown> | null)?.score_breakdown)
                  ? ((prior.analysis_snapshot as Record<string, unknown>).score_breakdown as any[])
                  : [];
              const category_differences = scoring.breakdown.map((c) => {
                const p = priorBreakdown.find((x: any) => x?.category === c.category);
                return {
                  category: c.category,
                  previous_quote_score: p ? p.quote_score : null,
                  new_quote_score: c.quote_score,
                  changed: p ? Number(p.quote_score) !== Number(c.quote_score) : true,
                };
              }).filter((d) => d.changed);
              consistencyDiagnostic = {
                warning: "Score changed materially from previous run — review differences.",
                previous_run_id: prior.id,
                previous_document_score: priorDoc,
                new_document_score: docScore,
                delta,
                category_differences,
                compared_at: new Date().toISOString(),
              };
            }
          }
        }
      } catch (consErr) {
        console.error("analyse-quote: consistency check failed", consErr);
      }
    }

    await supabase
      .from("quote_checks")
      .update({
        file_hash: fileHash,
        quote_evidence: evidence,
        evidence_validation: validation,
        qs_scoring: { breakdown: scoring.breakdown, document_score: docScore, project_confidence_score: confScore, sanitised_missing: sanitisedMissing },
        document_score: docScore,
        project_confidence_score: confScore,
        analysis_snapshot: analysisSnapshot,
        consistency_diagnostic: consistencyDiagnostic,
        report_json: reportJson,
        report_html: reportHtml,
        status: "complete",
        user_id: userId,
        subtotal_text: figures.subtotal ?? null,
        vat_text: figures.vat ?? null,
        total_text: figures.total ?? null,
        quality_score: docScore,
        completeness_pct: clampInt(scoring.completeness_pct),
        risk_level: scoring.risk_level,
        project_confidence: scoring.project_confidence,
        recommended_next_step: scoring.recommended_next_step,
        comparison_readiness: scoring.comparison_readiness,
        certification_readiness: scoring.certification_readiness,
        quote_total_text: (intake.quote_total as string) || null,
        labour_material: (intake.labour_material as string) || null,
        top_issues: scoring.top_issues,
      })
      .eq("id", quoteCheckId);

    try {
      if (record.email) {
        const projectType = record.project_type || "";
        const reportUrl = magicLink || "https://prografter.co.uk/dashboard/quote-checks";
        await enqueueTransactionalEmail(supabase, {
          templateName: "quote-health-check-ready",
          recipientEmail: record.email,
          idempotencyKey: `quote-health-check-ready:${quoteCheckId}`,
          templateData: { reportUrl, projectType },
        });
      }
    } catch (emailErr) {
      console.error("analyse-quote: failed to enqueue report email", emailErr);
    }

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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
