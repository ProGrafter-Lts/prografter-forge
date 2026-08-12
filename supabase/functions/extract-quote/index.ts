// extract-quote — Pass 0 (deterministic) + Pass 1 (structured extraction).
//
// Part of the Quote Checker Pass 0/1/2 rebuild (Landscaping/Driveway pilot).
// This function does NOT score or write the homeowner-facing report — see
// score-quote for Pass 2. Its only job is to turn a quote document into a
// complete, schema-shaped, evidence-checked JSON extraction and store it.
//
// Deliberately mirrors analyse-landscaping-quote's request/response contract
// (same insert into simple_quote_checks, same {id, lookupToken, status}
// response) so run-paid-module-check needs only a routing change, not a
// rewrite, to call this instead.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { robustParseJson } from "../_shared/json-repair.ts";
import { SCHEMAS, metaFor, emptyExtraction, type CategoryDef, type ExtractionRecord } from "../_shared/quote-checker-schemas.ts";
import { extractPdfText, runPass0Regex, describePass0Candidates, type Pass0Candidates } from "./pass0.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

// ---- File handling (duplicated from analyse-landscaping-quote — each Edge
// Function deploys independently, and this repo's convention is to keep
// cross-cutting helpers like this duplicated per-function rather than reach
// into a sibling function directory; only supabase/functions/_shared/ is
// actually shared). --------------------------------------------------------
function mediaForFile(name: string): { kind: "pdf" | "image" | "text"; mediaType: string } {
  const lower = (name || "").toLowerCase();
  if (lower.endsWith(".png")) return { kind: "image", mediaType: "image/png" };
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return { kind: "image", mediaType: "image/jpeg" };
  if (lower.endsWith(".webp")) return { kind: "image", mediaType: "image/webp" };
  if (lower.endsWith(".txt")) return { kind: "text", mediaType: "text/plain" };
  return { kind: "pdf", mediaType: "application/pdf" };
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

async function downloadBytes(supabase: any, path: string): Promise<Uint8Array | null> {
  try {
    const { data, error } = await supabase.storage.from("quote-pdfs").download(path);
    if (error || !data) {
      console.error("download failed", path, error?.message);
      return null;
    }
    return new Uint8Array(await data.arrayBuffer());
  } catch (e) {
    console.error("download exception", path, (e as Error).message);
    return null;
  }
}

// ---- JSON repair moved to _shared/json-repair.ts; keep a thin alias so this
// file reads the same as the other analyse-* functions. --------------------
const extractJson = robustParseJson;

async function callAnthropic(system: unknown[], content: unknown, maxTokens: number): Promise<string> {
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
      // The schema + rulebook live in `system` with a cache_control breakpoint
      // so Anthropic prompt caching can reuse them across every call for a
      // category (all 15 runs of a consistency gate, and every live check).
      // Cache writes cost 1.25x, cache reads 0.1x — with a 38-116 field
      // schema that's the bulk of the prompt. The documents and the per-run
      // dynamic block stay in the user message and are never cached, so each
      // run is still a genuinely fresh extraction.
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Anthropic error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  const u = data?.usage ?? {};
  console.log(
    `[extract-quote] usage input=${u.input_tokens} cache_write=${u.cache_creation_input_tokens ?? 0} cache_read=${u.cache_read_input_tokens ?? 0} output=${u.output_tokens}`,
  );
  // A silent max_tokens stop is the dangerous failure mode here: the JSON
  // repair layer still yields a parseable object, the missing tail categories
  // default to "absent", and every run fails identically — so the consistency
  // gate reports 100% agreement on a truncated extraction. Fail loudly instead.
  if (data?.stop_reason === "max_tokens") {
    throw new Error(
      `Extraction truncated: model hit max_tokens (${maxTokens}). Raise the Pass 1 token budget for this schema size.`,
    );
  }
  return (data?.content?.[0]?.text as string) || "";
}


// ---- Pass 1 prompt ----------------------------------------------------------
//
// Split into two halves so Anthropic prompt caching can do real work:
//   * buildPass1System() — schema + rulebook + output contract. Byte-identical
//     for every call in a category, so it is sent as the `system` block with a
//     cache_control breakpoint and read from cache on subsequent calls.
//   * buildPass1Runtime() — homeowner context, Pass 0 hints, supporting-doc
//     names. Varies per run/document and is never cached.
// The documents themselves are always re-sent and re-read, so nothing about
// the extraction result is reused between runs.

/** Static half — identical across every call for a given category. */
function buildPass1System(category: string, schema: CategoryDef[]): string {
  const meta = metaFor(category);
  const schemaLines = schema
    .map(
      (c) =>
        `${c.key} (${c.name}):\n` +
        c.fields
          .map(
            (f) =>
              `  - ${c.key}.${f.key}: ${f.label}` +
              (f.criteria ? `\n      RULE: ${f.criteria}` : ""),
          )
          .join("\n"),
    )
    .join("\n\n");

  return `You are ProGrafter's ${meta.title} QUOTE EXTRACTION engine (Pass 1 of a two-pass pipeline).

Your ONLY job is EXTRACTION, not judgment or scoring. A separate pass will score and write the homeowner report from your output. Do not editorialise, do not score, do not write prose commentary.

You are given the main quote first, then any supporting documents, then a short run-specific briefing (homeowner context and deterministic pre-scan hints).

===== FIXED EXTRACTION SCHEMA — every field below MUST appear exactly once in your output =====
${schemaLines}


===== RULES =====
- Where a field has a RULE line above, that RULE is binding and overrides your own judgement. Apply it literally. A RULE narrows how you judge a field; it never removes evidence from view.
- Default adjudication (used when no RULE is given, and never in conflict with one):
  * "present" = the document EXPLICITLY and SPECIFICALLY states the thing named by the field. Explicit means stated in words, not implied, not inferable from adjacent facts, not a reasonable industry assumption.
  * "ambiguous" = the thing IS mentioned, but the statement is vague, hedged, approximate, non-committal, conditional, self-contradictory, or only a provisional sum/allowance.
  * "not_applicable" = ONLY permitted for a field whose RULE explicitly defines a not_applicable condition (branch fields), and ONLY when that condition is met. It means the field's subject does not exist on this job at all — not that the document is silent about it. Never use "not_applicable" for any field whose RULE does not define it; silence on such a field is "absent".
  * "absent" = the thing is not mentioned at all. Silence, implication, and "a competent contractor would obviously do this" are ALL absent.
- GLOBAL VAGUENESS RULE (applies to EVERY field, including fields with a RULE line): if the field expects a specific fact — a date, a figure, a measurement, a duration, a named material, or a confirmed action — and the document only gestures at it with vague, hedged, approximate or non-committal wording, the answer is "ambiguous", NEVER "present". Hedging markers include: "about", "around", "approximately", "roughly", "or so", "circa", "typically", "usually", "normally", "should", "aim to", "hope to", "expect to", "in the region of", "TBC", "to be confirmed", "as required", "where necessary", "subject to", "if needed", "similar", "or equivalent" (when no base spec is named), and any passing social or conversational reference rather than a stated commitment. Only mark "present" when the document COMMITS to the specific fact.
- PRECISION HEDGING EXCEPTION to the rule above: a hedge word placed NEXT TO a specific, usable figure, date or spec does NOT make the field ambiguous — the figure is still actionable. "Approximate area: 62m²", "anticipated start date: 16 March 2026", "circa 150mm sub-base" are all "present". A hedge word that REPLACES the specific figure or date leaves nothing actionable and IS ambiguous — "should take about a week or so", "start in the spring", "roughly the same as last time". Test: strip the hedge word — if a concrete number, date or named spec remains, mark "present"; if nothing concrete remains, mark "ambiguous".
- "ambiguous" is the correct answer for vague-but-mentioned wording. Do NOT use "ambiguous" for evidence you had to infer from an unrelated fact — that is "absent". Vague mention → ambiguous. No mention → absent.
- NEAR-MISS RULE (decides between "ambiguous" and "absent"): "ambiguous" requires the document to actually name the field's OWN subject, just vaguely. Wording that only gestures at an ADJACENT or WEAKER subject without naming this field's subject is "absent", not "ambiguous". Examples: "fully qualified engineers" / "20 years experience" does NOT name a Gas Safe registration → absent. "we'll size it correctly" / "correctly sized boiler" does NOT name a heat-loss calculation or survey → absent. "we leave things tidy" does NOT name waste removal or making good → absent on its own. "we're insured" without naming the cover type → absent for a specific named cover. Test: strip every word that is not the field's own named subject — if the subject itself was never named, mark "absent".
- EITHER/OR FIELDS: where a field is satisfied by ANY ONE of several facts (e.g. "removal of old unit OR waste removal OR making good"), one clearly stated qualifying fact makes the field "present". Vague or near-miss wording elsewhere in the same document does NOT dilute or downgrade that solid evidence. Cite the strongest qualifying span.
- COMPOUND FIELDS: where a field's label or RULE requires TWO OR MORE facts together (e.g. name AND address), all required parts must be present for "present". If only some parts are present, the answer is "ambiguous", never "present".
- Judge each field on evidence for that field's own subject. A single sentence, clause or section MAY legitimately evidence more than one field (for example a payment sentence can evidence both the deposit and the payment schedule) — do NOT withhold evidence from a field merely because you already cited it elsewhere. What you must not do is transfer evidence about a DIFFERENT subject to fill a field it does not actually speak to.


- If status is "present", "quote" MUST be a VERBATIM substring copied exactly from the document text — never paraphrase, never recompute, never invent. If you cannot find an exact verbatim span, use "ambiguous" instead of "present".
- If status is "absent", "not_applicable", or you found nothing, "quote" MUST be null.
- BRANCH FIELDS: where RULEs define a branch (e.g. pitched-roof-only vs flat-roof-only fields), decide the branch ONCE from the field named in those RULEs, then apply it consistently to every branch field. Evidence about one branch must never be used to score the other branch's fields.
- "evidence_source": "in_quote" if the fact comes from the MAIN quote document; "supplied_in_supporting" if it is ONLY in a supporting document (not the main quote); "not_found" if status is "absent".
- Never mark something "absent" if it appears in a supporting document — use "supplied_in_supporting" with status "present" or "ambiguous" instead.
- Do NOT skip, merge, reorder or add fields. Every single field key listed above must appear in your JSON output exactly once, even if you are just marking it absent.
- Do NOT include any narrative, scoring, or commentary — evidence only.

===== OUTPUT =====
Return ONLY one JSON object, no prose, no markdown code fences, no preamble. Shape:
{
  "quote_basics": { "contractor_name": {"status": "...", "quote": "...", "evidence_source": "..."}, ... },
  "scope_area_measurements": { ... },
  ...one key per category above, each containing one key per field above...
}`;
}

/** Dynamic half — varies per run and per document; never cached. */
function buildPass1Runtime(
  category: string,
  pass0: Pass0Candidates,
  intake: Record<string, unknown>,
  supportingNames: string[],
): string {
  const meta = metaFor(category);
  const ctx = (intake as any)?.[meta.contextKey] ?? intake ?? {};
  return `===== RUN BRIEFING =====
Supporting documents supplied with this quote: ${supportingNames.length ? supportingNames.join(", ") : "none"}.

HOMEOWNER CONTEXT (background only — never used to mark a field "absent" just because the homeowner didn't mention it):
${JSON.stringify(ctx, null, 2)}

A DETERMINISTIC PRE-SCAN of the document text (Pass 0, regex — not from you) found these candidate values. Use them as hints to cross-check your own reading; do not blindly copy one into a field that doesn't match its context (e.g. a detected percentage could be a VAT rate, not a deposit rate — read the surrounding text to decide):
${describePass0Candidates(pass0)}

Now produce the JSON object exactly as specified in the OUTPUT section, covering every field in the fixed extraction schema.`;
}


// ---- Substring anti-hallucination check ------------------------------------
function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function verifyExtractionAgainstSource(extraction: ExtractionRecord, sourceText: string | null): void {
  if (!sourceText) {
    // No independently-extracted text to check against (image-only upload,
    // or PDF text extraction failed) — every "present" field is left
    // unverified rather than silently treated as confirmed.
    for (const cat of Object.values(extraction)) {
      for (const field of Object.values(cat)) {
        if (field.status === "present") field.verified = false;
      }
    }
    return;
  }
  const normalizedSource = normalize(sourceText);
  for (const cat of Object.values(extraction)) {
    for (const field of Object.values(cat)) {
      if (field.status !== "present" || !field.quote) continue;
      const ok = normalizedSource.includes(normalize(field.quote));
      if (ok) {
        field.verified = true;
      } else {
        // Anti-hallucination downgrade: claimed a verbatim quote that isn't
        // actually present in the source text we extracted independently.
        field.status = "ambiguous";
        field.verified = false;
      }
    }
  }
}

// ---- Merge raw model output onto the schema-complete baseline --------------
function coerceExtraction(raw: any, schema: CategoryDef[]): ExtractionRecord {
  const record = emptyExtraction(schema);
  if (!raw || typeof raw !== "object") return record;
  for (const c of schema) {
    const rawCat = raw[c.key];
    if (!rawCat || typeof rawCat !== "object") continue;
    for (const f of c.fields) {
      const rf = rawCat[f.key];
      if (!rf || typeof rf !== "object") continue;
      const status =
        rf.status === "present" || rf.status === "ambiguous" || rf.status === "not_applicable"
          ? rf.status
          : "absent";
      const quote =
        status === "present" || status === "ambiguous"
          ? (typeof rf.quote === "string" && rf.quote.trim() ? rf.quote.trim() : null)
          : null;
      const evidence_source =
        rf.evidence_source === "in_quote" || rf.evidence_source === "supplied_in_supporting"
          ? rf.evidence_source
          : status === "absent" || status === "not_applicable" ? "not_found" : "in_quote";
      record[c.key][f.key] = {
        status: status === "present" && !quote ? "ambiguous" : status,
        quote,
        evidence_source,
        verified: false,
      };
    }
  }
  return record;
}

// ---- Pass 0 VAT-number lock (see pass0.ts for why only this field is
// locked, not price/date/percentage) ----------------------------------------
function applyVatLock(extraction: ExtractionRecord, pass0: Pass0Candidates): void {
  if (!pass0.vatNumber) return;
  const field = extraction.quote_basics?.vat_status;
  if (!field) return;
  if (field.status !== "present") {
    extraction.quote_basics.vat_status = {
      status: "present",
      quote: pass0.vatNumber,
      evidence_source: "in_quote",
      verified: true, // it's a direct regex match against the same source text
    };
  }
}

interface RunArgs {
  checkId: string;
  lookupToken: string;
  category: string;
  projectType?: string;
  intake?: Record<string, unknown>;
  pdfPath: string;
  supporting: { path: string; name: string }[];
  email?: string;
  userId?: string;
}

async function runExtraction(supabase: any, args: RunArgs): Promise<void> {
  const { checkId, category, intake, pdfPath, supporting } = args;
  try {
    const schema = SCHEMAS[category];
    if (!schema) throw new Error(`No extraction schema for category "${category}"`);

    const mainBytes = await downloadBytes(supabase, pdfPath);
    if (!mainBytes) throw new Error("Could not download the main quote file.");
    const mainMedia = mediaForFile(pdfPath);

    // Pass 0: deterministic text extraction + regex, main document only (the
    // spec scopes Pass 0 to the main quote; supporting docs still go through
    // Pass 1's multimodal read as before).
    let sourceText: string | null = null;
    if (mainMedia.kind === "pdf") {
      sourceText = await extractPdfText(mainBytes);
    } else if (mainMedia.kind === "text") {
      sourceText = new TextDecoder().decode(mainBytes);
    }
    const pass0 = sourceText ? runPass0Regex(sourceText) : { vatNumber: null, priceCandidates: [], dateCandidates: [], percentageCandidates: [] };

    // Build the same multimodal content the model reads, main quote then
    // supporting docs, matching today's analyse-landscaping-quote behaviour.
    const content: unknown[] = [];
    content.push({ type: "text", text: `===== MAIN ${metaFor(category).title} QUOTE =====` });
    content.push(contentBlockFromBytes(mainBytes, mainMedia));

    const supportingNames: string[] = [];
    for (const sf of supporting) {
      const bytes = await downloadBytes(supabase, sf.path);
      if (!bytes) continue;
      const media = mediaForFile(sf.name);
      content.push({ type: "text", text: `===== SUPPORTING DOCUMENT: ${sf.name} =====` });
      content.push(contentBlockFromBytes(bytes, media));
      supportingNames.push(sf.name);
    }

    content.push({ type: "text", text: buildPass1Runtime(category, pass0, intake ?? {}, supportingNames) });

    // Token budget must scale with the schema: every field emits a status, a
    // verbatim quote and an evidence_source, so a 116-field category (Extension)
    // needs roughly 3x the output of a 21-field one. A flat 8000 silently
    // truncated Extension's last two categories.
    const fieldCount = schema.reduce((n, c) => n + c.fields.length, 0);
    const maxTokens = Math.min(32_000, Math.max(8_000, fieldCount * 250));
    const system = [
      {
        type: "text",
        text: buildPass1System(category, schema),
        cache_control: { type: "ephemeral" },
      },
    ];
    const raw = await callAnthropic(system, content, maxTokens);

    const parsed = extractJson(raw);
    if (!parsed) {
      console.error("[extract-quote] parse failed. rawLen=", raw?.length, "head=", (raw || "").slice(0, 400));
      throw new Error("Could not parse the extraction result.");
    }

    // coerceExtraction always builds from the schema-complete emptyExtraction
    // baseline (see quote-checker-schemas.ts), so every field key is
    // structurally guaranteed to be present in `extraction` regardless of
    // what the model returned — no separate completeness check needed here.
    const extraction = coerceExtraction(parsed, schema);
    verifyExtractionAgainstSource(extraction, sourceText);
    applyVatLock(extraction, pass0);

    const { data: extractionRow, error: exErr } = await supabase
      .from("quote_check_extractions")
      .insert({
        quote_check_id: checkId,
        category,
        schema_version: metaFor(category).schemaVersion,
        pass0_json: pass0,
        pass1_json: extraction,
        model: MODEL,
        source_text_available: !!sourceText,
        raw_model_output: (raw || "").slice(0, 8000),
      })
      .select("id")
      .single();
    if (exErr || !extractionRow) throw new Error("Failed to store extraction: " + exErr?.message);

    const { error: scoreErr } = await supabase.functions.invoke("score-quote", {
      body: { extractionId: extractionRow.id },
    });
    if (scoreErr) throw new Error("score-quote invocation failed: " + scoreErr.message);
  } catch (err) {
    console.error("extract-quote background error:", err);
    await supabase
      .from("simple_quote_checks")
      .update({ status: "error", error: String((err as Error).message).slice(0, 500) })
      .eq("id", checkId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let checkId: string | null = null;

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

    const body = await req.json();
    const { email, projectType, intake, pdfPath, supportingFiles, userId, category } = body ?? {};

    if (!pdfPath || typeof pdfPath !== "string") {
      return new Response(JSON.stringify({ error: "A quote file is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const resolvedCategory = typeof category === "string" && SCHEMAS[category] ? category : "landscaping_driveway";

    const supporting: { path: string; name: string }[] = Array.isArray(supportingFiles)
      ? supportingFiles.slice(0, 10).map((s: any) => ({ path: String(s.path), name: String(s.name || s.path) }))
      : [];

    const { data: inserted, error: insertErr } = await supabase
      .from("simple_quote_checks")
      .insert({
        email: typeof email === "string" ? email : null,
        project_type: typeof projectType === "string" ? projectType : "Landscaping / Driveway",
        pdf_url: pdfPath,
        supporting_files: supporting,
        intake: intake ?? {},
        status: "processing",
        user_id: typeof userId === "string" ? userId : null,
      })
      .select("id, lookup_token")
      .single();
    if (insertErr || !inserted) throw new Error("Failed to create check: " + insertErr?.message);
    checkId = inserted.id;
    const lookupToken = inserted.lookup_token;

    // @ts-expect-error EdgeRuntime is available in the Supabase Edge runtime.
    EdgeRuntime.waitUntil(
      runExtraction(supabase, {
        checkId,
        lookupToken,
        category: resolvedCategory,
        projectType: typeof projectType === "string" ? projectType : undefined,
        intake: intake ?? {},
        pdfPath,
        supporting,
        email: typeof email === "string" ? email : undefined,
        userId: typeof userId === "string" ? userId : undefined,
      }),
    );

    return new Response(
      JSON.stringify({ id: checkId, lookupToken, status: "processing" }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("extract-quote error:", err);
    if (checkId) {
      await supabase
        .from("simple_quote_checks")
        .update({ status: "error", error: String((err as Error).message).slice(0, 500) })
        .eq("id", checkId);
    }
    return new Response(JSON.stringify({ error: "Extraction failed. Please try again.", id: checkId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
