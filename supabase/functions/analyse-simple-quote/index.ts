// Simple Quote Checker — a self-contained, homeowner-friendly quote analyser.
//
// This function is INTENTIONALLY independent of the advanced Quote Health Check
// (analyse-quote). It does NOT use the 116-point Extension Standard, the long
// audit trail, or the advanced report renderer. It scores a builder's quote
// against a small set of plain-English categories that are relevant to the
// homeowner's expected scope, and returns a simple report.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

// ---- The simple category set (A–T). Building Control (B) always shown. -------
const CATEGORIES: { key: string; name: string }[] = [
  { key: "quote_basics", name: "Quote Basics" },
  { key: "building_control", name: "Building Control" },
  { key: "demolition", name: "Demolition / Enabling Works" },
  { key: "test_dig", name: "Test Dig / Ground Conditions" },
  { key: "foundations", name: "Foundations & Groundworks" },
  { key: "drainage", name: "Below-Ground Drainage" },
  { key: "floor_structure", name: "Floor Structure" },
  { key: "walls", name: "Walls / Superstructure" },
  { key: "knock_throughs", name: "Existing Structure / Knock-Throughs" },
  { key: "roof", name: "Roof Structure & Covering" },
  { key: "envelope", name: "External Envelope" },
  { key: "insulation", name: "Insulation & Thermal Elements" },
  { key: "electrics", name: "Electrics" },
  { key: "plumbing_heating", name: "Plumbing / Heating" },
  { key: "plastering", name: "Plastering / Internal Finish" },
  { key: "joinery", name: "Second-Fix Joinery" },
  { key: "decoration", name: "Decoration / Flooring / Tiling" },
  { key: "site_setup", name: "Waste / Scaffold / Welfare" },
  { key: "allowances", name: "Allowances & Provisional Sums" },
  { key: "commercial", name: "Commercial Terms" },
];

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

function extractJson(raw: string): any {
  if (!raw) return null;
  let s = raw.trim();
  // Strip markdown code fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = s.indexOf("{");
  if (first === -1) return null;
  const last = s.lastIndexOf("}");
  const candidate = last > first ? s.slice(first, last + 1) : s.slice(first);

  const attempts = [
    candidate,
    candidate.replace(/,(\s*[}\]])/g, "$1"),
    repairTruncatedJson(candidate),
  ];
  for (const a of attempts) {
    if (!a) continue;
    try {
      return JSON.parse(a);
    } catch { /* try next */ }
  }
  return null;
}

// Best-effort repair of JSON truncated mid-stream: close any open strings,
// then close outstanding arrays/objects in the right order.
function repairTruncatedJson(input: string): string | null {
  let s = input;
  // Drop a trailing partial token after the last complete value separator.
  // Track structure while ignoring string contents.
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  if (inString) s += '"';
  // Remove trailing comma / dangling colon-key fragments.
  s = s.replace(/,\s*$/, "").replace(/:\s*$/, ": null");
  while (stack.length) s += stack.pop();
  return s;
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
    throw new Error(`Anthropic error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  return (data?.content?.[0]?.text as string) || "";
}

function buildPrompt(intake: Record<string, unknown>, supportingNames: string[]): string {
  const ctx = intake?.simple_context ?? intake ?? {};
  return `You are ProGrafter's SIMPLE QUOTE CHECKER — a homeowner-friendly assistant.

Your job: check whether a builder's quote for a DOMESTIC EXTENSION clearly covers the works the homeowner expects, what appears missing, what needs clarifying, and what to ask the builder before accepting.

You are NOT the advanced project-readiness engine. Do NOT assess planning permission, architectural drawings, architect involvement, party wall, asbestos, or wider statutory design. The ONLY statutory/project-readiness item you may consider is BUILDING CONTROL, because it affects the job starting, inspections and completion.

You are given the main builder quote first, then any supporting documents (${supportingNames.length ? supportingNames.join(", ") : "none"}).

HOMEOWNER CONTEXT (use ONLY to decide what is relevant — never penalise the quote for omitting something the homeowner does not expect):
${JSON.stringify(ctx, null, 2)}

RELEVANCE RULES:
- A category is RELEVANT if: the homeowner expects it, the quote says it's included, it's a core part of the described works, OR it's essential to any quote (price, VAT, Building Control, payment, timescale, changes/extras).
- A category is NOT relevant (set "relevant": false, "score": null) if the homeowner says it is not expected, it's outside the expected finish level, or it's wider project readiness.
- If the homeowner is "Not sure", keep the category relevant but frame it as "Ask builder to confirm".
- Finish level drives internal categories: "Shell only" / "Watertight shell" -> do NOT score plastering, joinery, decoration, or most internals. "Plastered finish" -> score plastering but not decoration/flooring/tiling unless expected. "Full finish" -> internals and finishes are relevant.

SCORING — score each RELEVANT category 0–10 using these anchors:
- 0 = not mentioned at all but expected/relevant
- 2 = vaguely mentioned only
- 5 = partly covered but important detail missing
- 7 = mostly clear but some clarification needed
- 10 = clear, specific and decision-ready

CATEGORIES to consider (only score relevant ones):
${CATEGORIES.map((c) => `- ${c.key}: ${c.name}`).join("\n")}

SUPPORTING DOCUMENTS: use them only as supporting context. For each fact, distinguish the source: "in_quote", "supplied_separately", "homeowner_supplied", or "not_found". If payment stages were supplied separately, say so and tell the homeowner to confirm they form part of the agreed quote.

BUILDING CONTROL must ALWAYS be included in "categories" and in a dedicated building_control object, even if unclear.

Respond with STRICT JSON only (no prose, no markdown fences) in EXACTLY this shape:
{
  "verdict": { "level": "clear" | "useful" | "vague", "line": "one homeowner-friendly sentence" },
  "categories": [
    { "key": "<one of the keys above>", "name": "<name>", "relevant": true|false,
      "score": <0-10 or null if not relevant>,
      "status": "clear" | "needs_clarifying" | "missing" | "not_scored",
      "note": "short plain-English explanation",
      "evidence_source": "in_quote" | "supplied_separately" | "homeowner_supplied" | "not_found" }
  ],
  "what_looks_clear": ["..."],
  "what_needs_clarifying": ["..."],
  "what_appears_missing": ["... only items relevant to expected scope ..."],
  "building_control": { "status": "included" | "arranged_separately" | "designer_dealing" | "not_arranged" | "unclear", "detail": "plain-English explanation of what the quote says and what to confirm" },
  "questions": ["max 8 priority questions to ask the builder"],
  "suggested_message": "a short, polite, copyable message the homeowner can send the builder",
  "supporting_docs": [ { "name": "<file name>", "type": "<what it appears to be>", "note": "how it was used" } ]
}

Verdict guidance:
- "clear" -> "Quote is clear enough to consider, with minor clarifications."
- "useful" -> "Quote has useful detail, but key points need confirming."
- "vague" -> "Quote is too vague to accept safely yet."

Use simple homeowner language. Include EVERY category from the list in "categories" (mark not-relevant ones with relevant:false). Keep questions to a maximum of 8, prioritised.`;
}

async function downloadBlock(supabase: any, path: string, displayName: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabase.storage.from("quote-pdfs").download(path);
    if (error || !data) {
      console.error("download failed", path, error?.message);
      return null;
    }
    const media = mediaForFile(displayName || path);
    const bytes = new Uint8Array(await data.arrayBuffer());
    return contentBlockFromBytes(bytes, media);
  } catch (e) {
    console.error("download exception", path, (e as Error).message);
    return null;
  }
}

// Deterministic Quote Clarity Score = average of relevant category scores * 10.
function computeClarityScore(categories: any[]): number {
  const scores = categories
    .filter((c) => c && c.relevant && typeof c.score === "number")
    .map((c) => c.score as number);
  if (!scores.length) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10);
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
    const {
      email,
      projectType,
      intake,
      pdfPath,
      supportingFiles,
      userId,
    } = body ?? {};

    if (!pdfPath || typeof pdfPath !== "string") {
      return new Response(JSON.stringify({ error: "A quote file is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supporting: { path: string; name: string }[] = Array.isArray(supportingFiles)
      ? supportingFiles.slice(0, 10).map((s: any) => ({ path: String(s.path), name: String(s.name || s.path) }))
      : [];

    // Create the record up-front so we always have an id + lookup token.
    const { data: inserted, error: insertErr } = await supabase
      .from("simple_quote_checks")
      .insert({
        email: typeof email === "string" ? email : null,
        project_type: typeof projectType === "string" ? projectType : null,
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

    // Build the AI content: main quote first, then supporting docs.
    const content: unknown[] = [];
    const mainBlock = await downloadBlock(supabase, pdfPath, pdfPath);
    if (!mainBlock) throw new Error("Could not download the main quote file.");
    content.push({ type: "text", text: "===== MAIN BUILDER QUOTE =====" });
    content.push(mainBlock);

    const supportingNames: string[] = [];
    for (const sf of supporting) {
      const b = await downloadBlock(supabase, sf.path, sf.name);
      if (b) {
        content.push({ type: "text", text: `===== SUPPORTING DOCUMENT: ${sf.name} =====` });
        content.push(b);
        supportingNames.push(sf.name);
      }
    }

    content.push({ type: "text", text: buildPrompt(intake ?? {}, supportingNames) });

    const raw = await callAnthropic(content, 8000);
    const parsed = extractJson(raw);
    if (!parsed) {
      console.error("[simple-quote] parse failed. rawLen=", raw?.length,
        "head=", (raw || "").slice(0, 400), "tail=", (raw || "").slice(-400));
      throw new Error("Could not parse the analysis result.");
    }

    // Normalise categories: ensure all present, and Building Control always relevant.
    const byKey: Record<string, any> = {};
    for (const c of Array.isArray(parsed.categories) ? parsed.categories : []) {
      if (c && typeof c.key === "string") byKey[c.key] = c;
    }
    const categories = CATEGORIES.map(({ key, name }) => {
      const c = byKey[key] || {};
      const relevant = key === "building_control" ? true : !!c.relevant;
      return {
        key,
        name,
        relevant,
        score: relevant && typeof c.score === "number" ? c.score : null,
        status: c.status || (relevant ? "needs_clarifying" : "not_scored"),
        note: c.note || "",
        evidence_source: c.evidence_source || "not_found",
      };
    });

    const clarityScore = computeClarityScore(categories);
    const relevantCount = categories.filter((c) => c.relevant).length;
    const strong = categories.filter((c) => c.relevant && typeof c.score === "number" && c.score >= 7).map((c) => c.name);
    const weak = categories.filter((c) => c.relevant && typeof c.score === "number" && c.score <= 4).map((c) => c.name);

    const report_json = {
      version: "simple-v1",
      generated_at: new Date().toISOString(),
      project_type: projectType ?? null,
      verdict: parsed.verdict || { level: "useful", line: "Quote has useful detail, but key points need confirming." },
      clarity_score: clarityScore,
      relevant_categories_count: relevantCount,
      strong_categories: strong,
      weak_categories: weak,
      categories,
      what_looks_clear: Array.isArray(parsed.what_looks_clear) ? parsed.what_looks_clear : [],
      what_needs_clarifying: Array.isArray(parsed.what_needs_clarifying) ? parsed.what_needs_clarifying : [],
      what_appears_missing: Array.isArray(parsed.what_appears_missing) ? parsed.what_appears_missing : [],
      building_control: parsed.building_control || { status: "unclear", detail: "Building Control responsibility is not clear from the quote." },
      questions: (Array.isArray(parsed.questions) ? parsed.questions : []).slice(0, 8),
      suggested_message: parsed.suggested_message || "",
      supporting_docs: Array.isArray(parsed.supporting_docs) ? parsed.supporting_docs : [],
    };

    await supabase
      .from("simple_quote_checks")
      .update({ status: "complete", report_json })
      .eq("id", checkId);

    return new Response(
      JSON.stringify({ id: checkId, lookupToken, report_json }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("analyse-simple-quote error:", err);
    if (checkId) {
      await supabase
        .from("simple_quote_checks")
        .update({ status: "error", error: String((err as Error).message).slice(0, 500) })
        .eq("id", checkId);
    }
    return new Response(JSON.stringify({ error: "Analysis failed. Please try again.", id: checkId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
