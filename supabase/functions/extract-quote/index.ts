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
import { SCHEMAS, emptyExtraction, type CategoryDef, type ExtractionRecord } from "../_shared/quote-checker-schemas.ts";
import { extractPdfText, runPass0Regex, describePass0Candidates, type Pass0Candidates } from "./pass0.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";
const SCHEMA_VERSION = "landscaping-extraction-v1";

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

// ---- Pass 1 prompt ----------------------------------------------------------
function buildPass1Prompt(
  schema: CategoryDef[],
  pass0: Pass0Candidates,
  intake: Record<string, unknown>,
  supportingNames: string[],
): string {
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


  const ctx = (intake as any)?.landscaping_context ?? intake ?? {};

  return `You are ProGrafter's LANDSCAPING / DRIVEWAY QUOTE EXTRACTION engine (Pass 1 of a two-pass pipeline).

Your ONLY job is EXTRACTION, not judgment or scoring. A separate pass will score and write the homeowner report from your output. Do not editorialise, do not score, do not write prose commentary.

You are given the main quote first, then any supporting documents (${supportingNames.length ? supportingNames.join(", ") : "none"}).

HOMEOWNER CONTEXT (background only — never used to mark a field "absent" just because the homeowner didn't mention it):
${JSON.stringify(ctx, null, 2)}

A DETERMINISTIC PRE-SCAN of the document text (Pass 0, regex — not from you) found these candidate values. Use them as hints to cross-check your own reading; do not blindly copy one into a field that doesn't match its context (e.g. a detected percentage could be a VAT rate, not a deposit rate — read the surrounding text to decide):
${describePass0Candidates(pass0)}

===== FIXED EXTRACTION SCHEMA — every field below MUST appear exactly once in your output =====
${schemaLines}

===== RULES =====
- Where a field has a RULE line above, that RULE is binding and overrides your own judgement. Apply it literally.
- Default adjudication (used when no RULE is given, and never in conflict with one):
  * "present" = the document EXPLICITLY states the thing named by the field. Explicit means stated in words, not implied, not inferable from adjacent facts, not a reasonable industry assumption.
  * "ambiguous" = the thing IS mentioned, but the statement is vague, self-contradictory, conditional, or only a provisional sum/allowance.
  * "absent" = the thing is not mentioned. Silence, implication, and "a competent contractor would obviously do this" are ALL absent.
- Never use "ambiguous" as a hedge for evidence you had to infer. If you had to reason from a related fact to get there, the answer is "absent".
- Judge each field ONLY on evidence for that field. Evidence already used for a different field does not make this field present.

- If status is "present", "quote" MUST be a VERBATIM substring copied exactly from the document text — never paraphrase, never recompute, never invent. If you cannot find an exact verbatim span, use "ambiguous" instead of "present".
- If status is "absent" or you found nothing, "quote" MUST be null.
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
      const status = rf.status === "present" || rf.status === "ambiguous" ? rf.status : "absent";
      const quote = status !== "absent" && typeof rf.quote === "string" && rf.quote.trim() ? rf.quote.trim() : null;
      const evidence_source =
        rf.evidence_source === "in_quote" || rf.evidence_source === "supplied_in_supporting"
          ? rf.evidence_source
          : status === "absent" ? "not_found" : "in_quote";
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
    content.push({ type: "text", text: "===== MAIN LANDSCAPING / DRIVEWAY QUOTE =====" });
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

    content.push({ type: "text", text: buildPass1Prompt(schema, pass0, intake ?? {}, supportingNames) });

    const raw = await callAnthropic(content, 8000);
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
        schema_version: SCHEMA_VERSION,
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
