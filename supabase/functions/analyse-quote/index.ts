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
// Removes dangerous elements and inline event handlers / javascript: URLs.
function sanitizeReportHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "$1=$2#$2");
}

const CHECKLIST_PROMPT = `You are a senior UK quantity surveyor reviewing a residential building quote for a homeowner. Your job is AWARENESS, NOT DIAGNOSIS: help the homeowner understand what this quote does and does not cover, and what to clarify with their builder before work starts. You do NOT give professional advice, you do NOT determine what is required, and you do NOT state what anything should cost.

CONTEXT PROVIDED BY THE HOMEOWNER
Project type (their stated intent): [PROJECT_TYPE]
Location / postcode area: [POSTCODE]
What they asked to be quoted for: [HOMEOWNER_DESCRIPTION]

STEP 0 — EXTRACT THE FIGURES VERBATIM, BEFORE ANYTHING ELSE.
Read these straight from the quote, exactly as printed. Do not calculate, re-add, round or infer. If a value is not present, record "not stated" — never estimate.
- SUBTOTAL (net, before VAT): copy exactly, or "not stated"
- VAT: copy the VAT line exactly (e.g. "VAT @ 20%: £7,827.61"), or "not stated"
- TOTAL: copy the document's own stated Total exactly, or "not stated"
The "Quoted total" shown to the user MUST be the document's stated Total, to the penny. Every price you mention uses ONLY these extracted figures.

RULE ON VAT — report it, never judge it.
- If a VAT line is shown, report it as shown: e.g. "Net £33,371.76, VAT added at 20% (£6,674.35), total including VAT £40,046.11."
- If a total is shown with no VAT line, report: "VAT treatment not stated — confirm whether this price includes VAT."
- NEVER label a quote "VAT inclusive" or "VAT exclusive" as an assumption. State only what the document explicitly shows.

RULE ON SCOPE — describe only what is itemised.
- The scope summary and the "covered by this quote" list may contain ONLY items that actually appear as line items in the quote.
- If a trade or element (electrical, plumbing, heating, etc.) is NOT itemised, you may NOT call it included, partial, "rough-in", or "basic". Flag it instead: "No [X] work is itemised — confirm whether it is meant to be included."
- If it is not written on the page, it is a question, not a fact. Never invent or infer scope.

RULE — GIVE THE REASON, NOT JUST THE QUESTION.
For any item that carries genuine hidden risk (foundations, structural openings, beams/lintels, drainage, anything assumed or relied upon), the clarify note must FIRST explain WHY it matters in plain builder's English (what could go wrong, or what cost/delay it could cause), THEN ask the specific question. Awareness with a reason — never a blank prompt. Routine, low-risk items can stay as a short question.


STEP 1 — Analyse the quote against the 43-point checklist for a [PROJECT_TYPE].
The 43 points cover the full lifecycle of such a project, including (adapt sensibly to the project type): preliminaries & welfare; site setup, access & protection; demolition/strip-out; muck-away & skips; setting out; excavation; foundation type & depth; building control / inspections; structural engineer's calcs; party wall matters; drainage (foul & surface water); DPC/DPM & damp proofing; substructure brick/block; ground floor build-up & insulation; superstructure walls; cavity insulation; lintels & openings; structural steel/beams; roof structure; roof covering & flashings; rainwater goods; external doors & windows (incl. FENSA/CERTASS); plastering & rendering; screeding; first-fix carpentry; first-fix electrics (incl. Part P); first-fix plumbing & heating (incl. Gas Safe); ventilation (Part F); insulation to meet Part L; second-fix electrics; second-fix plumbing & heating; second-fix carpentry; kitchen supply & fit; bathroom/sanitaryware supply & fit; tiling; decoration; flooring; external works/landscaping; making good; waste removal & clean; testing & commissioning; certificates & handover documents; warranties/guarantees; payment schedule & contract terms.
For each item state one of:
ADDRESSED — the item clearly appears in the quote with adequate detail
MISSING — the item does not appear at all
NEEDS CLARIFICATION — mentioned but vague, or possibly inadequate
Mark ADDRESSED only if the item genuinely appears in the document. Do not credit an item because it would normally be expected — only because it is actually there.

TONE — this is an honesty document that brings the homeowner and the builder onto the same page. It is NOT a judgement of the trade. Frame every gap as something to confirm together, never as a fault or a sign of a bad builder. Where relevant, note that a missing item may simply sit outside this quote's scope rather than being an error. Be helpful and factual, never alarmist.

For any flagged foundation item where a fixed depth is stated, add only this awareness note (do not specify what the depth should be): "Foundation depth shown is [X]; actual depth can vary with ground conditions and nearby trees — worth confirming it's allowed for, and what happens if deeper digging is needed."

IF THE INPUT IS NOT A BUILDING QUOTE
Return exactly: {"error": "This doesn't look like a building quote. Please upload a builder's quotation or estimate."}

OUTPUT — return ONLY a single valid JSON object. No markdown, no code fences, no commentary before or after (any stray text breaks the renderer). Use these exact keys:
{
  "figures": {
    "subtotal": string,
    "vat": string,
    "total": string
  },
  "score_addressed": number,
  "assessment": "Ready to Accept" | "Needs Clarification" | "Significant Concerns",
  "report_html": string
}

REPORT_HTML STRUCTURE (Block B order). Produce clean, semantic HTML using ONLY these classes. Do not add inline styles, scripts, or <html>/<body> wrappers — output the inner body markup only.

<section class="qr-section qr-figures">
  <h2>Figures</h2>
  <ul>
    <li><strong>Subtotal:</strong> …verbatim…</li>
    <li><strong>VAT:</strong> …verbatim, or the confirm-VAT line…</li>
    <li><strong>Total:</strong> …verbatim…</li>
  </ul>
</section>
<section class="qr-section qr-summary">
  <h2>Executive Summary</h2>
  <p>…3 sentences max, plain English: what is covered, what to clarify, overall impression. Reference only itemised scope and the extracted figures.…</p>
</section>
<section class="qr-section qr-checklist">
  <h2>Checklist (43 points)</h2>
  <ul>
    <li class="addressed"><strong>Item name —</strong> short note</li>
    <li class="missing"><strong>Item name —</strong> short note (frame as something to confirm together)</li>
    <li class="unclear"><strong>Item name —</strong> short note</li>
  </ul>
</section>
<section class="qr-section qr-questions">
  <h2>Five Key Questions to Ask Your Builder</h2>
  <ol>
    <li>…specific, based on the gaps found…</li>
  </ol>
</section>
<section class="qr-section qr-assessment">
  <h2>Overall Assessment</h2>
  <p><strong>…Ready to Accept / Needs Clarification / Significant Concerns…</strong></p>
</section>
<section class="qr-section qr-score">
  <h2>Summary Score</h2>
  <p><strong>X of 43</strong> items clearly addressed.</p>
</section>

The checklist <ul> must contain exactly 43 <li> items, each with class "addressed" (ADDRESSED), "missing" (MISSING), or "unclear" (NEEDS CLARIFICATION). The questions <ol> must contain exactly 5 <li>. The score and the count of "addressed" <li> elements must agree with score_addressed. Return ONLY the JSON object. Nothing else.`;

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

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the quote check record
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

    // Idempotency guard: if this quote check has already been analysed, return
    // the stored result instead of re-calling Claude. This prevents a caller who
    // knows a valid quoteCheckId from repeatedly burning AI credits.
    if (record.status === "complete" && record.report_json) {
      return new Response(
        JSON.stringify({ success: true, reportJson: record.report_json, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Defence-in-depth: never call Claude unless Stripe payment is confirmed.
    // verify-quote-payment is meant to be the only caller, but we re-verify
    // here so a stray invocation can't burn AI credits.
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (!record.stripe_payment_id) {
      return new Response(
        JSON.stringify({ error: "Payment not verified for this quote check" }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    // Free Quote Check entitlement: redeem-quote-check-entitlement already
    // verified the signed-in user owns an unconsumed entitlement and consumed
    // it server-side, so there is no Stripe payment to verify here.
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
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Download the PDF from storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("quote-pdfs")
      .download(record.pdf_url);

    if (downloadError || !pdfData) {
      throw new Error("Failed to download PDF: " + downloadError?.message);
    }

    // Convert PDF to base64 in chunks. Spreading the whole byte array into
    // String.fromCharCode overflows the call stack for large PDFs, so we
    // process it in fixed-size slices instead.
    const pdfBytes = await pdfData.arrayBuffer();
    const bytes = new Uint8Array(pdfBytes);
    let binary = "";
    const CHUNK = 0x8000; // 32KB per chunk
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    const pdfBase64 = btoa(binary);

    // Build the prompt
    const prompt = CHECKLIST_PROMPT
      .replaceAll("[PROJECT_TYPE]", record.project_type)
      .replaceAll("[POSTCODE]", record.postcode || "UK average")
      .replaceAll("[HOMEOWNER_DESCRIPTION]", record.description || "Not specified");

    // Call Claude API
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8000,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Claude API error ${aiResponse.status}: ${errText}`);
    }

    const aiResult = await aiResponse.json();
    const rawText = aiResult.content?.[0]?.text || "";

    // The model is instructed to return a single JSON object. Strip any
    // accidental code fences, then extract the outermost {...} block.
    let jsonText = rawText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      jsonText = jsonText.slice(first, last + 1);
    }

    let reportJson: unknown;
    try {
      reportJson = JSON.parse(jsonText);
    } catch (e) {
      console.error("analyse-quote: failed to parse model JSON", e, rawText.slice(0, 500));
      await supabase
        .from("quote_checks")
        .update({ status: "error" })
        .eq("id", quoteCheckId);
      return new Response(JSON.stringify({ error: "The analysis could not be formatted. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isErrorReport =
      reportJson && typeof reportJson === "object" && "error" in (reportJson as Record<string, unknown>);

    // Verbatim figures extracted by the model (STEP 0 of the prompt).
    const figures =
      (reportJson as { figures?: { subtotal?: string; vat?: string; total?: string } })?.figures || {};
    const rawReportHtml =
      typeof (reportJson as { report_html?: string })?.report_html === "string"
        ? (reportJson as { report_html?: string }).report_html ?? null
        : null;
    // Defence-in-depth: strip script/style/iframe tags and inline event handlers
    // before persisting AI-generated HTML (prompt-injection mitigation).
    const reportHtml = rawReportHtml ? sanitizeReportHtml(rawReportHtml) : null;

    // ACCOUNT ON PURCHASE — before saving the report, ensure the homeowner has
    // an auth account, then tie the report to it and prepare a magic link.
    let userId: string | null = null;
    let magicLink: string | null = null;
    if (!isErrorReport && record.email) {
      try {
        // Create the user if they don't already exist (no password, confirmed).
        await supabase.auth.admin
          .createUser({
            email: record.email,
            email_confirm: true,
            user_metadata: { user_type: "homeowner" },
          })
          .catch(() => {/* already registered — fine */});

        // Generate a magic link that lands on their Quote Checks list.
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: record.email,
          options: { redirectTo: "https://prografter.co.uk/dashboard/quote-checks" },
        });
        if (linkErr) console.error("analyse-quote: generateLink failed", linkErr);
        userId = linkData?.user?.id ?? null;
        magicLink =
          (linkData?.properties as { action_link?: string } | undefined)?.action_link ?? null;
      } catch (acctErr) {
        console.error("analyse-quote: account creation failed", acctErr);
      }
    }

    // Save the report row WITH the user_id and the verbatim figures.
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
      })
      .eq("id", quoteCheckId);

    // Notification email (NOT the report itself) — a short branded message with
    // a magic link to the homeowner's account, where they can read & print it.
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

    // Try to mark as error if we have the ID
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.quoteCheckId) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from("quote_checks")
          .update({ status: "error" })
          .eq("id", body.quoteCheckId);
      }
    } catch { /* best effort */ }

    return new Response(JSON.stringify({ error: "An unexpected error occurred while analysing the quote." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
