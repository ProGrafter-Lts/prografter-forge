import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { enqueueTransactionalEmail } from "../_shared/enqueue-transactional-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

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

const CHECKLIST_PROMPT = `You are a senior UK quantity surveyor reviewing a residential building quote. Your job is AWARENESS and CLARITY, NOT DIAGNOSIS. ProGrafter does NOT produce a competing quotation. You guide, clarify, flag risks, explain gaps and help the user ask better questions. You do NOT give professional advice, you do NOT determine what is required, and you do NOT state what anything should cost.

PRIME PRINCIPLE — THE QUOTE IS THE SOURCE OF TRUTH.
The quote document is the primary source of truth. The user's project description, ticked expectations and concerns are SUPPORTING CONTEXT ONLY. Clearly separate what the quote actually STATES from what the user EXPECTED and from what may be MISSING or UNCLEAR. Never treat a user expectation as something the quote includes.

WHO IS CHECKING THIS QUOTE: [CHECKER_MODE]
[MODE_GUIDANCE]

CONTEXT PROVIDED BY THE USER (supporting only):
Project type: [PROJECT_TYPE]
Location: [POSTCODE]
Approx size: [SIZE]
Stage: [STAGE]
Has drawings: [DRAWINGS] | Planning: [PLANNING] | Structural calcs: [STRUCTURAL]
What they asked to be included: [EXPECTED_SCOPE]
Items they expected/want checked (NOT proof of inclusion): [EXPECTED_ITEMS]
Their concerns: [CONCERNS]
Stated quote total (context): [QUOTE_TOTAL] | Labour/materials: [LABOUR_MATERIAL] | Quotes received: [NUM_QUOTES]

STEP 0 — EXTRACT FIGURES VERBATIM from the quote. Do not calculate or infer. If absent, use "not stated".
- SUBTOTAL (net, before VAT), VAT line, TOTAL — copy exactly as printed.

SAFETY — NEVER say a builder is a cowboy, is ripping the user off, that the quote is definitely wrong, that they should reject the builder, that any figure is a guaranteed price, or that this replaces professional advice. You MAY say: the quote is unclear, an item is not mentioned, something may lead to additional cost, ask the builder to confirm in writing, and you may wish to request a revised quote.

STEP 1 — Assess the quote against common UK residential scope areas (adapt to project type): site setup & protection; welfare; access; demolition/strip-out; groundworks; foundations; drainage; concrete; brick/blockwork; cavity insulation; structural steels; roof structure; roof covering; rainwater goods; windows & doors; first-fix electrics; second-fix electrics; electrical testing/Part P; plumbing; heating; Gas Safe where relevant; ventilation; insulation/Part L; plasterboarding; skimming; kitchen install; bathroom install; tiling; flooring; decoration; waste removal; scaffolding; making good; Building Control; structural engineer; party wall; completion certificates; guarantees/warranties; VAT; payment stages; programme/duration; variations process.
For each relevant area classify as: INCLUDED, EXCLUDED, UNCLEAR, or NOT MENTIONED — based ONLY on the quote text.

STEP 2 — Score the quote out of 10 in each of these ten categories, then compute overall QUALITY SCORE out of 100 (sum x 1): Scope Completeness; Clarity of Wording; Pricing Transparency; Labour/Materials Responsibility; Exclusions Clearly Listed; Compliance & Certification; Programme/Timescale Clarity; Payment Structure; Variation Handling; Customer Decision Safety.

STEP 3 — Derive:
- completeness_pct: approximate % of expected residential scope this quote clearly addresses (0-100).
- risk_level: Low / Medium / High / Critical.
- project_confidence: Low / Medium / High.
- recommended_next_step: EXACTLY one of: "Safe to proceed subject to minor clarification." | "Clarify key items before accepting." | "Request a revised quote before proceeding." | "Seek a second quote using a clearer scope." | "Do not proceed until major omissions are resolved."
- comparison_readiness: "Ready to compare" | "Partially ready" | "Not ready to compare".
- certification_readiness (internal ProGrafter Certified Quote assessment): "Ready" | "Needs improvement" | "Not ready". "Ready" requires quality_score >= 85, no critical missing scope, clear exclusions, payment terms present, variation process present, clear VAT status, clear labour/material responsibility, clear compliance responsibilities, and a programme/timescale.
- top_issues: array of the 3 most important issues (short strings).

IF THE INPUT IS NOT A BUILDING QUOTE, return exactly: {"error": "This doesn't look like a building quote. Please upload a builder's quotation or estimate."}

OUTPUT — return ONLY a single valid JSON object. No markdown, no code fences, no commentary. Keys:
{
  "figures": { "subtotal": string, "vat": string, "total": string },
  "checker_type": "[CHECKER_KEY]",
  "quality_score": number,
  "completeness_pct": number,
  "risk_level": "Low"|"Medium"|"High"|"Critical",
  "project_confidence": "Low"|"Medium"|"High",
  "recommended_next_step": string,
  "comparison_readiness": string,
  "certification_readiness": "Ready"|"Needs improvement"|"Not ready",
  "top_issues": [string, string, string],
  "what_to_do_next": [string, ...],
  "questions_list": [string, ...],
  "builder_message": string,
  "assessment": "Ready to Accept"|"Needs Clarification"|"Significant Concerns",
  "report_html": string
}

LANGUAGE — write for a homeowner. Use plain English. Avoid jargon; where a technical term is unavoidable, explain it in everyday words. For example, do NOT write "domestic reverse charge applies"; instead write "confirm whether VAT is included, excluded, or not applicable". Keep the tone professional, calm, practical and protective — never alarmist and never accusing the builder. Prefer safe wording: "not stated", "needs confirming", "appears unclear", "should be requested before accepting", "may affect the final cost", "could lead to misunderstanding".

what_to_do_next — 3 to 6 short, practical, homeowner-friendly action steps (imperatives) derived from the actual findings, ordered by importance. Example: "Ask the builder to confirm whether VAT is included or excluded." Do not include monetary figures.

questions_list — a flat list of 5 to 12 clear, homeowner-friendly questions to ask the builder, drawn from the findings. Avoid technical phrasing. Example: "Can you confirm whether VAT is included, excluded, or not applicable?" These must mirror the questions in report_html but as plain strings.

builder_message — a single polite, professional message the homeowner can copy and send to the builder to clarify the quote. Open with a thank-you, then a short numbered list of the specific points to confirm (only those relevant to THIS quote's findings — e.g. include VAT if VAT is unclear, payment stages if missing, start/completion timing if missing, exclusions if unclear, certificates/warranties if relevant), and close by politely asking for a revised quote showing these details clearly. Use \n for line breaks.


report_html — clean semantic HTML using ONLY these classes. No inline styles, scripts, or <html>/<body> wrappers — inner body markup only. Produce these sections in order:

<section class="qr-section qr-figures"><h2>Figures</h2><ul><li><strong>Subtotal:</strong> …</li><li><strong>VAT:</strong> …</li><li><strong>Total:</strong> …</li></ul></section>
<section class="qr-section qr-summary"><h2>Executive Summary</h2><p>…calm, fair plain-English summary. Never accuse the builder. State what is covered, what to clarify, overall impression.…</p></section>
<section class="qr-section"><h2>What The Quote Clearly Includes</h2><table><thead><tr><th>Scope item</th><th>Evidence from quote</th><th>Confidence</th><th>Notes</th></tr></thead><tbody>…only items clearly stated…</tbody></table></section>
<section class="qr-section"><h2>What The Quote Clearly Excludes</h2><table><thead><tr><th>Excluded item</th><th>Evidence</th><th>Impact</th><th>Question to ask</th></tr></thead><tbody>…</tbody></table></section>
<section class="qr-section"><h2>What Is Missing Or Unclear</h2><table><thead><tr><th>Item</th><th>Status</th><th>Why it matters</th><th>Risk</th><th>Question to ask</th></tr></thead><tbody>…each row Status = Included/Excluded/Unclear/Not mentioned, Risk = Low/Medium/High…</tbody></table></section>
<section class="qr-section"><h2>Quote Quality Score Breakdown</h2><table><thead><tr><th>Category</th><th>Score /10</th><th>[SCORE_COL_LABEL]</th></tr></thead><tbody>…all ten categories…</tbody></table><p><strong>Overall Quote Quality Score: X / 100</strong></p></section>
<section class="qr-section"><h2>Quote Comparison Readiness</h2><p><strong>…Ready to compare / Partially ready / Not ready to compare…</strong> — explain why in plain English.</p></section>
<section class="qr-section"><h2>Possible Missing Cost Areas</h2><table><thead><tr><th>Item</th><th>Why it could affect cost</th><th>Risk level</th></tr></thead><tbody>…risk bands only, NO monetary figures, this is NOT an alternative quotation…</tbody></table></section>
<section class="qr-section qr-questions"><h2>[QUESTIONS_HEADING]</h2>…group questions by category using <h3>Category</h3> then <ul><li>…</li></ul> the user can copy and send…</section>
<section class="qr-section qr-assessment"><h2>Final Recommendation</h2><p><strong>…one of the five recommended_next_step values…</strong> Keep tone fair and professional.</p></section>

[TRADE_REPORT_NOTE]

Return ONLY the JSON object.`;

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
    tradeNote: `In addition, adapt section wording for a trade improving their own quote. Frame the summary as: "This quote can be made stronger and easier for a customer to approve by improving clarity, exclusions, payment stages and scope detail." Emphasise Suggested Improvements and Recommended Quote Improvements. Suggest structural improvements to the document, never change actual prices.`,
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

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("quote-pdfs")
      .download(record.pdf_url);
    if (downloadError || !fileData) {
      throw new Error("Failed to download file: " + downloadError?.message);
    }

    const media = mediaForFile(record.pdf_url || "");
    const fileBytes = await fileData.arrayBuffer();
    const bytes = new Uint8Array(fileBytes);

    // Build the intake context and mode guidance.
    const intake = (record.intake || {}) as Record<string, unknown>;
    const checkerKey = (record.checker_type || "homeowner") as string;
    const mode = MODE_MAP[checkerKey] || MODE_MAP.homeowner;
    const str = (v: unknown) => (v == null || v === "" ? "Not specified" : String(v));
    const items = Array.isArray(intake.expected_items) ? (intake.expected_items as string[]).join(", ") : "Not specified";

    const prompt = CHECKLIST_PROMPT
      .replaceAll("[CHECKER_MODE]", mode.label)
      .replaceAll("[MODE_GUIDANCE]", mode.guidance)
      .replaceAll("[QUESTIONS_HEADING]", mode.questionsHeading)
      .replaceAll("[SCORE_COL_LABEL]", mode.scoreCol)
      .replaceAll("[TRADE_REPORT_NOTE]", mode.tradeNote)
      .replaceAll("[CHECKER_KEY]", checkerKey)
      .replaceAll("[PROJECT_TYPE]", record.project_type || "Not specified")
      .replaceAll("[POSTCODE]", record.postcode || "Not specified")
      .replaceAll("[SIZE]", str(intake.project_size))
      .replaceAll("[STAGE]", str(intake.stage))
      .replaceAll("[DRAWINGS]", str(intake.has_drawings))
      .replaceAll("[PLANNING]", str(intake.has_planning))
      .replaceAll("[STRUCTURAL]", str(intake.has_structural))
      .replaceAll("[EXPECTED_SCOPE]", record.description || str(intake.expected_scope))
      .replaceAll("[EXPECTED_ITEMS]", items)
      .replaceAll("[CONCERNS]", str(intake.concerns))
      .replaceAll("[QUOTE_TOTAL]", str(intake.quote_total))
      .replaceAll("[LABOUR_MATERIAL]", str(intake.labour_material))
      .replaceAll("[NUM_QUOTES]", str(intake.num_quotes));

    // Build the content block appropriate to the uploaded file type.
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

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 20000,
        temperature: 0,
        messages: [{ role: "user", content: [contentBlock, { type: "text", text: prompt }] }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Claude API error ${aiResponse.status}: ${errText}`);
    }

    const aiResult = await aiResponse.json();
    const rawText = aiResult.content?.[0]?.text || "";
    if (aiResult.stop_reason === "max_tokens") {
      console.warn("analyse-quote: model output hit max_tokens; attempting repair");
    }

    let jsonText = rawText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) jsonText = jsonText.slice(first, last + 1);
    else if (first !== -1) jsonText = jsonText.slice(first);

    // Attempt to repair JSON truncated by the token limit: close any open
    // string, then balance any unclosed brackets/braces.
    const repairTruncatedJson = (s: string): string => {
      let inStr = false;
      let esc = false;
      const stack: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inStr) {
          if (esc) esc = false;
          else if (c === "\\") esc = true;
          else if (c === '"') inStr = false;
          continue;
        }
        if (c === '"') inStr = true;
        else if (c === "{" || c === "[") stack.push(c);
        else if (c === "}" || c === "]") stack.pop();
      }
      let out = s;
      if (inStr) out += '"';
      for (let i = stack.length - 1; i >= 0; i--) {
        out += stack[i] === "{" ? "}" : "]";
      }
      return out;
    };

    let reportJson: any;
    try {
      reportJson = JSON.parse(jsonText);
    } catch (_e1) {
      try {
        reportJson = JSON.parse(repairTruncatedJson(jsonText));
      } catch (e) {
        console.error("analyse-quote: failed to parse model JSON", e, rawText.slice(0, 500));
        await supabase.from("quote_checks").update({ status: "error" }).eq("id", quoteCheckId);
        return new Response(JSON.stringify({ error: "The analysis could not be formatted. Please try again." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const isErrorReport = reportJson && typeof reportJson === "object" && "error" in reportJson;

    const figures = reportJson?.figures || {};
    const rawReportHtml = typeof reportJson?.report_html === "string" ? reportJson.report_html : null;
    const reportHtml = rawReportHtml ? sanitizeReportHtml(rawReportHtml) : null;
    if (reportHtml) reportJson.report_html = reportHtml;

    const clampInt = (v: unknown) => {
      const n = Math.round(Number(v));
      return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
    };

    // Account on purchase for homeowners only (trades have their own accounts).
    let userId: string | null = null;
    let magicLink: string | null = null;
    if (!isErrorReport && record.email) {
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

    await supabase
      .from("quote_checks")
      .update({
        report_json: reportJson,
        report_html: reportHtml,
        status: "complete",
        user_id: userId,
        subtotal_text: figures.subtotal ?? null,
        vat_text: figures.vat ?? null,
        total_text: figures.total ?? null,
        quality_score: isErrorReport ? null : clampInt(reportJson.quality_score),
        completeness_pct: isErrorReport ? null : clampInt(reportJson.completeness_pct),
        risk_level: isErrorReport ? null : (reportJson.risk_level ?? null),
        project_confidence: isErrorReport ? null : (reportJson.project_confidence ?? null),
        recommended_next_step: isErrorReport ? null : (reportJson.recommended_next_step ?? null),
        comparison_readiness: isErrorReport ? null : (reportJson.comparison_readiness ?? null),
        certification_readiness: isErrorReport ? null : (reportJson.certification_readiness ?? null),
        quote_total_text: (intake.quote_total as string) || null,
        labour_material: (intake.labour_material as string) || null,
        top_issues: isErrorReport ? null : (Array.isArray(reportJson.top_issues) ? reportJson.top_issues : null),
      })
      .eq("id", quoteCheckId);

    try {
      if (!isErrorReport && record.email) {
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
