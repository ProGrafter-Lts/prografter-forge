// score-quote — Pass 2 (scoring + narrative).
//
// Part of the Quote Checker Pass 0/1/2 rebuild (Landscaping/Driveway pilot).
// Reads ONLY the structured Pass 1 extraction from quote_check_extractions —
// never the source document, never Claude's own multimodal read of it. This
// is the guarantee the build spec calls for: Pass 2 cannot narrate a fact
// Pass 1 didn't find, because it has nothing else to look at.
//
// Category scores are computed deterministically in code from Pass 1's field
// statuses (present/ambiguous/absent + verified/evidence_source) — not asked
// of the LLM. The LLM call here produces ONLY homeowner-facing narrative
// text (quick verdict, notes, risks, questions, suggested message, summary),
// constrained to the facts it's been handed. Output shape matches today's
// analyse-landscaping-quote report_json exactly — the frontend report
// component is unchanged by this rebuild.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { robustParseJson } from "../_shared/json-repair.ts";
import { SCHEMAS, metaFor, type CategoryDef, type ExtractionRecord, type ExtractedField } from "../_shared/quote-checker-schemas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

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
    throw new Error(`Anthropic error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return (data?.content?.[0]?.text as string) || "";
}

// ---- Deterministic scoring (no LLM) ----------------------------------------
function fieldCredit(f: ExtractedField): number {
  if (f.status === "present" && f.verified) return 1.0;
  if (f.status === "present" && !f.verified) return 0.6;
  if (f.status === "ambiguous") return 0.4;
  return 0;
}

function creditForMain(f: ExtractedField): number {
  if (f.evidence_source === "supplied_in_supporting") return 0;
  return fieldCredit(f);
}

interface CategoryScore {
  key: string;
  name: string;
  score_main: number;
  score_pack: number;
}

function scoreCategories(schema: CategoryDef[], extraction: ExtractionRecord): CategoryScore[] {
  return schema.map((c) => {
    const fields = c.fields.map((f) => extraction[c.key]?.[f.key]).filter(Boolean) as ExtractedField[];
    const avgMain = fields.length ? fields.reduce((s, f) => s + creditForMain(f), 0) / fields.length : 0;
    const avgPack = fields.length ? fields.reduce((s, f) => s + fieldCredit(f), 0) / fields.length : 0;
    const scoreMain = Math.round(avgMain * 10);
    const scorePack = Math.max(Math.round(avgPack * 10), scoreMain);
    return { key: c.key, name: c.name, score_main: scoreMain, score_pack: scorePack };
  });
}

function averageScore(scores: number[]): number {
  if (!scores.length) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10);
}

function statusLabel(f: ExtractedField): string {
  if (f.status === "present" && f.evidence_source === "supplied_in_supporting") return "supplied_separately";
  if (f.status === "present") return "clear";
  if (f.status === "ambiguous") return "needs_clarifying";
  return "missing";
}

// ---- Pass 2 prompt: narrative only, sourced only from Pass 1's JSON --------
function buildPass2Prompt(
  category: string,
  schema: CategoryDef[],
  extraction: ExtractionRecord,
  categoryScores: CategoryScore[],
  intake: Record<string, unknown>,
): string {
  const meta = metaFor(category);
  const ctx = (intake as any)?.[meta.contextKey] ?? intake ?? {};

  const evidenceLines = schema
    .map((c) => {
      const scoreRow = categoryScores.find((s) => s.key === c.key)!;
      const fieldLines = c.fields
        .map((f) => {
          const field = extraction[c.key][f.key];
          const q = field.quote ? ` — "${field.quote}"` : "";
          return `    - ${f.label}: ${field.status} [${field.evidence_source}]${q}`;
        })
        .join("\n");
      return `${c.name} (score_main ${scoreRow.score_main}/10, score_pack ${scoreRow.score_pack}/10):\n${fieldLines}`;
    })
    .join("\n\n");

  return `You are ProGrafter's ${meta.title} QUOTE CHECKER — Pass 2 (narrative) of a two-pass pipeline.

You do NOT have the original quote document. You have ONLY the structured evidence below, already extracted and verified by a separate pass, and category scores that are ALREADY COMPUTED (do not recompute or contradict them). Your job is ONLY to write clear, homeowner-friendly narrative text from this evidence. Never state that something is present, confirmed, or missing unless the evidence below says so — you have no other source of truth.

HOMEOWNER CONTEXT (background only):
${JSON.stringify(ctx, null, 2)}

EXTRACTED EVIDENCE (status: present | absent | ambiguous; evidence_source: in_quote | supplied_in_supporting | not_found):
${evidenceLines}

WORDING STYLE: practical, calm and homeowner-friendly. Never accuse the ${meta.tradeNoun}. Never sound like legal advice. Use phrases like "Not visible in the quote — confirm if required.", "Worth confirming before accepting.", "Good detail, but ask for written confirmation on…", "Ground conditions can surprise — worth flagging as a risk item."

Refer to the tradesperson as the "${meta.tradeNoun}", never a different trade.

Respond with STRICT JSON only (no prose, no markdown fences) in EXACTLY this shape:
{
  "quick_verdict": "2-3 sentence plain-English summary the homeowner reads first",
  "category_notes": { "<category_key>": "short plain-English note for that category, referencing only the evidence given" },
  "what_looks_clear": ["... short bullet points, only things marked present/in_quote or verified above ..."],
  "supplied_separately_notes": { "<category_key>.<field_key>": "short homeowner-friendly guidance for a field marked supplied_in_supporting" },
  "not_found": ["... items marked absent above, phrased as 'Not visible in the quote — confirm if required.' ..."],
  "key_risks": ["... the most important things worth confirming before accepting, based only on absent/ambiguous items above ..."],
  "questions": ["max 10 priority questions to ask the ${meta.tradeNoun}, based only on absent/ambiguous items above"],
  "suggested_message": "a short, polite, copyable message the homeowner can send the ${meta.tradeNoun} asking only for the most important clarifications — do not generate a huge list if the evidence is already strong",
  "summary": "a short ProGrafter summary paragraph"
}
Category keys available: ${schema.map((c) => c.key).join(", ")}.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let checkId: string | null = null;

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

    const { extractionId } = await req.json();
    if (!extractionId || typeof extractionId !== "string") {
      return new Response(JSON.stringify({ error: "extractionId is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: extractionRow, error: exErr } = await supabase
      .from("quote_check_extractions")
      .select("id, quote_check_id, category, pass1_json")
      .eq("id", extractionId)
      .single();
    if (exErr || !extractionRow) throw new Error("Extraction not found: " + exErr?.message);

    checkId = extractionRow.quote_check_id;
    const schema = SCHEMAS[extractionRow.category];
    if (!schema) throw new Error(`No schema for category "${extractionRow.category}"`);
    const extraction = extractionRow.pass1_json as ExtractionRecord;

    const { data: checkRow, error: checkErr } = await supabase
      .from("simple_quote_checks")
      .select("id, email, project_type, intake, lookup_token, supporting_files")
      .eq("id", checkId)
      .single();
    if (checkErr || !checkRow) throw new Error("simple_quote_checks row not found: " + checkErr?.message);

    const meta = metaFor(extractionRow.category);
    const categoryScores = scoreCategories(schema, extraction);
    const clarityScore = averageScore(categoryScores.map((c) => c.score_main));
    const packScore = averageScore(categoryScores.map((c) => c.score_pack));
    const strong = categoryScores.filter((c) => c.score_pack >= 7).map((c) => c.name);
    const weak = categoryScores.filter((c) => c.score_pack <= 4).map((c) => c.name);

    let verdictLevel: "low" | "moderate" | "good" | "strong";
    let verdictLine: string;
    if (clarityScore >= 78) {
      verdictLevel = "strong";
      verdictLine = meta.verdictStrong;
    } else if (clarityScore >= 45) {
      verdictLevel = clarityScore >= 68 ? "good" : "moderate";
      verdictLine = meta.verdictModerate;
    } else {
      verdictLevel = "low";
      verdictLine = meta.verdictLow;
    }

    const raw = await callAnthropic(
      [{ type: "text", text: buildPass2Prompt(extractionRow.category, schema, extraction, categoryScores, checkRow.intake ?? {}) }],
      4000,
    );
    const parsed = robustParseJson(raw) ?? {};

    const categoryNotes = (parsed.category_notes as Record<string, string>) || {};
    const suppliedNotes = (parsed.supplied_separately_notes as Record<string, string>) || {};

    const categories = schema.map((c) => {
      const scoreRow = categoryScores.find((s) => s.key === c.key)!;
      const fields = c.fields.map((f) => extraction[c.key][f.key]);
      const statuses = fields.map(statusLabel);
      let status: string;
      if (statuses.includes("supplied_separately")) status = "supplied_separately";
      else if (statuses.every((s) => s === "missing")) status = "missing";
      else if (statuses.some((s) => s === "needs_clarifying" || s === "missing")) status = "needs_clarifying";
      else status = "clear";
      const evidenceSource = fields.some((f) => f.evidence_source === "supplied_in_supporting")
        ? "supplied_in_supporting"
        : fields.some((f) => f.status === "present")
          ? "in_quote"
          : "not_found";
      return {
        key: c.key,
        name: c.name,
        relevant: true,
        score: scoreRow.score_pack,
        score_main: scoreRow.score_main,
        score_pack: scoreRow.score_pack,
        status,
        note: categoryNotes[c.key] || "",
        evidence_source: evidenceSource,
      };
    });

    const suppliedSeparately: Array<{ item: string; main_quote: string; supporting: string; status: string; note: string }> = [];
    for (const c of schema) {
      for (const f of c.fields) {
        const field = extraction[c.key][f.key];
        if (field.evidence_source === "supplied_in_supporting" && field.status !== "absent") {
          suppliedSeparately.push({
            item: f.label,
            main_quote: "Not visible in the main quote",
            supporting: field.quote || "",
            status: `Supplied separately — confirm with ${meta.tradeNoun}`,
            note: suppliedNotes[`${c.key}.${f.key}`] || `Confirm the ${meta.tradeNoun} agrees this forms part of the agreed quote.`,
          });
        }
      }
    }

    const report_json = {
      version: meta.reportVersion,
      generated_at: new Date().toISOString(),
      project_type: checkRow.project_type ?? null,
      is_landscaping_quote: extractionRow.category === "landscaping_driveway",
      verdict: { level: verdictLevel, line: verdictLine },
      clarity_score: clarityScore,
      pack_confidence_score: packScore,
      has_supporting_docs: Array.isArray(checkRow.supporting_files) && checkRow.supporting_files.length > 0,
      relevant_categories_count: categories.length,
      strong_categories: strong,
      weak_categories: weak,
      categories,
      quick_verdict: typeof parsed.quick_verdict === "string" ? parsed.quick_verdict : "",
      what_looks_clear: Array.isArray(parsed.what_looks_clear) ? parsed.what_looks_clear : [],
      supplied_separately: suppliedSeparately,
      not_found: Array.isArray(parsed.not_found) ? parsed.not_found : [],
      key_risks: Array.isArray(parsed.key_risks) ? parsed.key_risks : [],
      questions: (Array.isArray(parsed.questions) ? parsed.questions : []).slice(0, 10),
      suggested_message: typeof parsed.suggested_message === "string" ? parsed.suggested_message : "",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };

    await supabase.from("simple_quote_checks").update({ status: "complete", report_json }).eq("id", checkId);

    if (checkRow.email) {
      try {
        const base = "https://prografter.co.uk";
        const reportUrl = `${base}/${meta.reportRoute}/${checkId}?t=${encodeURIComponent(checkRow.lookup_token)}`;
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "quote-health-check-ready",
            recipientEmail: checkRow.email,
            idempotencyKey: `${extractionRow.category}-quote-ready-${checkId}`,
            templateData: { reportUrl, projectType: checkRow.project_type ?? "" },
          },
        });
      } catch (mailErr) {
        console.error("[score-quote] email send failed", (mailErr as Error).message);
      }
    }

    return new Response(JSON.stringify({ checkId, status: "complete" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("score-quote error:", err);
    if (checkId) {
      await supabase
        .from("simple_quote_checks")
        .update({ status: "error", error: String((err as Error).message).slice(0, 500) })
        .eq("id", checkId);
    }
    return new Response(JSON.stringify({ error: "Scoring failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
