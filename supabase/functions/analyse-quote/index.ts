import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { enqueueTransactionalEmail } from "../_shared/enqueue-transactional-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const CHECKLIST_PROMPT = `You are the ProGrafter Quote Health Check — an independent reviewer that helps a UK homeowner understand a building quote they have received, so they can have a better-informed conversation with their builder.

YOUR PURPOSE

You help the homeowner ask the right questions. You do NOT replace the tradesperson, re-price their work, or produce a competing quotation. The builder may or may not be a ProGrafter member — treat every quote with the same fairness.

CONTEXT PROVIDED BY THE HOMEOWNER
Project type (their stated intent): [PROJECT_TYPE]
Location / postcode area: [POSTCODE]
What they asked to be quoted for: [HOMEOWNER_DESCRIPTION]

NON-NEGOTIABLE RULES

1. GUIDE, DON'T QUOTE. Never state "the real price is £X" or issue your own quotation. Any cost figure you give MUST be an indicative RANGE (low–high) framed as "a budget to be aware of and a question to ask" — never a number the homeowner should rely on.

2. RESPECT THE TRADE. Never imply the builder is dishonest, incompetent or trying to mislead. Frame every gap as "to confirm" or "worth asking", never "they failed to / forgot to". Honest builders quote in different scopes and styles.

3. BE SCOPE-AWARE. First decide what KIND of quote this is, then judge it only against what that kind of quote should contain. Something left out on purpose (e.g. electrics in a shell-only quote) is NOT a fault — it is "excluded by design" and feeds the cost-awareness section. Never score a quote down for excluding things outside its scope.

4. OUTPUT VALID JSON ONLY. No markdown, no code fences, no commentary before or after. Your entire response must be a single JSON object matching the schema. (This is critical — any stray text breaks the report renderer.)

STEP 1 — READ THE QUOTE
Identify: project type (infer if not stated), location/postcode area, the headline total, and the VAT position. VAT can be: "inclusive", "exclusive", or "unclear". If any line shows "+ VAT" but the total has no VAT label, treat the total as "unclear" and flag it as a priority.

STEP 2 — CLASSIFY SCOPE
Choose one: "shell_only", "full_build", "internals_only", "single_trade", or "unclear".

STEP 3 — GRADE AGAINST THE RIGHT STANDARD
Produce three lists:
• strengths — genuine positives. Always find real ones.
• questions_to_ask — each with severity "action" (a genuine omission a quote OF THIS SCOPE should have addressed, OR a financial unknown like VAT) or "clarify" (an ambiguity or spec choice). For each, give a short plain-English reason and the exact question to put to the builder.
• excluded_by_design — items legitimately outside this scope. Neutral, not faults.

UK REGS CONTEXT (apply only where relevant): Building Control sign-off, Part L, Part F, Part P, FENSA/CERTASS, Gas Safe, structural engineer's calcs for openings, party wall agreements, CDM for larger works.

STEP 4 — BUILD THE COST PICTURE (ranges only)
Start from the quoted total. List each additional or excluded element the homeowner will likely need to budget for, each as an indicative low–high range appropriate to project SIZE and REGION. Give an overall completion range (low–high). Add a one-line framing that this is budgeting guidance, not a quotation. If VAT is "unclear" or "exclusive", include the illustrative inc-VAT figure at 20%. Never present a single point figure for completion; if unsure, widen the range.

Err on the wider side of every cost range. A homeowner whose actual cost lands inside your range trusts ProGrafter; a homeowner whose cost overshoots your range never uses us again. Tight bands feel decisive but cost more in trust than they earn in polish. Never present a band tighter than ±25% of its midpoint.

For a typical UK full single-storey extension in 2026, use these as MINIMUM bands and widen further for larger or more complex projects: electrical first+second fix with Part P certification £2,500–5,000; heating extension with radiators, pipework and commissioning £1,500–3,000; structural engineer's calculations £600–1,500; plastering walls and ceiling for a 25–35m² room £2,500–4,500; second-fix joinery, doors, skirting £1,000–2,000; decorating £1,200–2,500. Scale up proportionally for larger projects, down for smaller ones, but do not present numbers below these floors for a full extension.

STEP 5 — SCORE & VERDICT
completeness_score: 0–100, reflecting completeness FOR ITS OWN SCOPE. verdict_line: one honest plain sentence.

STEP 6 — BRIDGE (only if genuine gaps exist)
If the quote lacks protections ProGrafter provides (payment protection/escrow, clear written contract, dispute process), write ONE soft sentence noting these gaps are common and that ProGrafter's verified trades include them as standard. Otherwise set bridge to null.

IF THE INPUT IS NOT A BUILDING QUOTE
Return exactly: {"error": "This doesn't look like a building quote. Please upload a builder's quotation or estimate."}

OUTPUT SCHEMA (return ONLY this JSON object — use these exact keys):
{
  "project": {
    "type": string,
    "location": string,
    "quote_total": number,
    "currency": "GBP",
    "vat_status": "inclusive" | "exclusive" | "unclear",
    "vat_illustration": string | null
  },
  "scope": {
    "detected": "shell_only" | "full_build" | "internals_only" | "single_trade" | "unclear",
    "summary": string,
    "covered": string[]
  },
  "completeness_score": number,
  "verdict_line": string,
  "strengths": [ { "title": string, "detail": string } ],
  "questions_to_ask": [ { "severity": "action" | "clarify", "title": string, "detail": string, "ask": string } ],
  "excluded_by_design": string[],
  "cost_picture": {
    "quoted": number,
    "vat_note": string | null,
    "additional_items": [ { "label": string, "low": number, "high": number, "note": string | null } ],
    "completion_low": number,
    "completion_high": number,
    "framing": string
  },
  "bridge": string | null
}

Notes: quote_total and quoted are numeric (no currency symbol). vat_illustration is a short string like "≈ £45,565 inc VAT at 20%" when VAT is unclear/exclusive, otherwise null. framing should read like "Indicative budget to be aware of, not a quotation."

If the input is not a building quote, return exactly: {"error": "This doesn't look like a building quote. Please upload a builder's quotation or estimate."}

Return ONLY the JSON object. Nothing else.`;

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
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
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

    // Update the record with the structured report.
    await supabase
      .from("quote_checks")
      .update({ report_json: reportJson, status: "complete" })
      .eq("id", quoteCheckId);

    // Email the homeowner a secure link to their report (best effort).
    try {
      const isErrorReport =
        reportJson && typeof reportJson === "object" && "error" in (reportJson as Record<string, unknown>);
      if (!isErrorReport) {
        const { data: row } = await supabase
          .from("quote_checks")
          .select("email, lookup_token, report_json")
          .eq("id", quoteCheckId)
          .single();
        if (row?.email && row?.lookup_token) {
          const reportUrl = `https://prografter.co.uk/report/${quoteCheckId}?t=${encodeURIComponent(row.lookup_token)}`;
          const projectType =
            (row.report_json as { project?: { type?: string } } | null)?.project?.type || "";
          await enqueueTransactionalEmail(supabase, {
            templateName: "quote-health-check-ready",
            recipientEmail: row.email,
            idempotencyKey: `quote-health-check-ready:${quoteCheckId}`,
            templateData: { reportUrl, projectType },
          });
        }
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
