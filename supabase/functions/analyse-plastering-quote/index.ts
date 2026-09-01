// Plastering / Rendering Quote Checker — self-contained analyser.
// Independent of every other module. Refers to the tradesperson as the
// "plasterer" (or "renderer" where clearly rendering).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

const CATEGORIES: { key: string; name: string }[] = [
  { key: "quote_basics", name: "Quote Basics" },
  { key: "areas_measurements_rooms", name: "Areas / Measurements / Rooms" },
  { key: "prep_removal_protection", name: "Preparation / Removal / Protection" },
  { key: "boards_materials_beads", name: "Boards / Materials / Beads" },
  { key: "finish_spec", name: "Finish Specification" },
  { key: "access_scaffold_waste", name: "Access / Scaffold / Waste" },
  { key: "drying_aftercare_decoration", name: "Drying / Aftercare / Decoration" },
  { key: "exclusions_risk", name: "Exclusions / Extras / Risk Items" },
  { key: "price_payment", name: "Price / VAT / Payment Terms" },
  { key: "timescale_handover", name: "Timescale / Handover" },
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
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = s.indexOf("{");
  if (first === -1) return null;
  const last = s.lastIndexOf("}");
  const candidate = last > first ? s.slice(first, last + 1) : s.slice(first);
  const attempts = [candidate, candidate.replace(/,(\s*[}\]])/g, "$1"), repairTruncatedJson(candidate)];
  for (const a of attempts) {
    if (!a) continue;
    try { return JSON.parse(a); } catch { /* next */ }
  }
  return null;
}

function repairTruncatedJson(input: string): string | null {
  let s = input;
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
  const ctx = intake?.plastering_context ?? intake ?? {};
  return `You are ProGrafter's PLASTERING / RENDERING QUOTE CHECKER — a homeowner-friendly assistant.

Your job: check whether a quote for PLASTERING, SKIMMING, BOARDING, RENDERING or PATCH REPAIR clearly explains areas, preparation, materials, finish, exclusions, waste, access and payment terms.

You are NOT the extension, boiler, electrical, bathroom, kitchen, roofing, windows/doors or landscaping checker. NEVER assess or score foundations, boilers, rewires, sanitaryware, roof coverings, kitchen units, windows or driveways. Ignore any such items entirely — this is a plastering / rendering quote. Refer to the tradesperson as the "plasterer" (or "renderer" where clearly rendering), never the "builder".

===== FIRST: CONFIRM THIS IS A PLASTERING / RENDERING QUOTE =====
Look at the MAIN document. If it is clearly NOT a plastering / skimming / boarding / rendering / patch-repair quote, set "is_plastering_quote": false and STOP scoring — return the minimal shape with is_plastering_quote:false and a short note. Otherwise set "is_plastering_quote": true and complete the full analysis.

You are given the main quote first, then any supporting documents (${supportingNames.length ? supportingNames.join(", ") : "none"}).

HOMEOWNER CONTEXT (use ONLY to decide what is relevant — never penalise the quote for omitting something the homeowner does not expect):
${JSON.stringify(ctx, null, 2)}

===== WHAT TO CHECK (plastering / rendering only) =====
Quote Basics: plasterer/company name, quote date, quote validity, property address, VAT status, total price, whether price is fixed or estimated.

Areas / Measurements / Rooms: rooms/areas listed; m² where relevant; walls vs ceilings identified; number of walls/ceilings; site visit or measured survey noted.

Preparation / Removal / Protection: removal of old/blown plaster; hacking off; PVA/SBR bonding; mesh scrim; protection of floors/furniture; dust sheets; masking.

Boards / Materials / Beads: plasterboard type (standard/moisture/sound/fire); board thickness; angle beads; stop beads; bonding coat; multi-finish/skim brand; render type (sand/cement, monocouche, silicone, K-Rend etc.).

Finish Specification: skim finish, float finish, polished finish; render texture; number of coats; expected drying time between coats.

Access / Scaffold / Waste: scaffold or tower needed (external render); access route; waste bags/skip; disposal of removed plaster; parking/loading arrangements.

Drying / Aftercare / Decoration: expected drying time before painting; mist-coat guidance; decoration excluded/included; aftercare notes.

Exclusions / Extras / Risk Items: hidden damp/blown areas; asbestos in old artex; lath and plaster surprises; extras if additional prep needed; making good electrics/plumbing chases.

Price / VAT / Payment Terms: total price, VAT inclusive/exclusive, deposit, staged payments, balance trigger, variation process.

Timescale / Handover: start date, duration in days, drying allowance, clear handover.

===== COMMON RISKS TO FLAG =====
- No m² or room list stated
- Old plaster removal unclear
- Board type/thickness vague
- Beads/scrim not mentioned
- No PVA/SBR/bonding stated
- Protection/dust control not covered
- Waste removal excluded or unclear
- Drying time not mentioned
- Decoration silently expected but excluded
- Lath and plaster / damp / asbestos risks not flagged

===== SCORE BEHAVIOUR & CALIBRATION =====
Do NOT punish a plastering quote for not including extension, boiler, electrical, bathroom, kitchen, roofing, windows or landscaping items. Score against the plastering / rendering categories ONLY.

First identify the JOB TYPE and judge proportionately:
A. Small room skim (e.g. one bedroom, walls + ceiling)
B. Full house plastering
C. Boarding and skim
D. Rendering (external)
E. Patch repair
F. Damp / blown plaster repair
Do NOT judge a small bedroom skim as if it were a full renovation package or an external render job. For a small skim, the quote does NOT need full technical spec (board thickness, bead schedules, render systems, scaffold) if the core scope is clear.

Calibrate to these three reference quotes:

WEAK (target overall 5-15/100): e.g. "Plaster room £600." — no area, no walls/ceilings, no prep, no materials, no waste, no VAT. Most categories 0-2.

MEDIUM (target overall 45-65/100): e.g. "Skim walls and ceiling in bedroom, materials included, £750." — reasonable scope so Areas 5-6, Boards/Materials 4-5, Finish 5-6. Mark it DOWN — but not to the floor — for missing m², prep detail, beads, protection, waste, drying, VAT and payment terms: those should sit around 2-4, NOT 0-1.

STRONG SMALL SKIM (target overall 78-84/100): a small bedroom/room skim quote that includes room/area identified, approximate room size, walls and ceiling, preparation stated (PVA/bonding where required, scrim to minor cracks), plaster and standard materials included, floor protection, waste removal, left ready for decoration after drying, decoration excluded, drying guidance, VAT-inclusive price, payment on completion and quote validity. Only sensible clarifications remain. Most relevant categories 7-9.

STRONG COMPLEX (target overall 82-90/100): a full house plaster, boarding-and-skim or rendering quote with detailed areas, board type/thickness, beads, prep, finish, scaffold, waste, exclusions, VAT/payment and timescale.

Missing detail should reduce the score, but a small skim quote with clear rooms, prep, materials, protection, waste and exclusions should always land in the strong band even when exact m² or plaster brand aren't spelled out.

Category-level calibration for a small skim (apply on top of anchors below):
- Areas / Measurements / Rooms: if the room is named with an approximate size and walls + ceiling are covered, score 7-9/10. Do NOT score low just because exact m² are missing.
- Preparation / Removal / Protection: if prep of existing plaster, PVA/bonding where required and scrim to minor cracks are stated, score 7-9/10. Blown plaster / major defect handling can be a clarification, not a failure.
- Boards / Materials / Beads: if plaster and standard materials are included, score 6-8/10. Missing plaster brand is NOT a critical homeowner decision on a bedroom skim — treat as minor confirmation only.
- Finish Specification: if a skim finish left ready for decoration is stated, score 7-9/10.
- Access / Scaffold / Waste: for internal skim, if floor protection and waste removal are included, score 7-9/10. Scaffold is not relevant for an internal room — mark that item not-relevant rather than penalising.
- Drying / Aftercare / Decoration: if drying guidance is given and decoration is clearly excluded (left ready for decoration after drying), score 7-9/10. Do NOT treat decoration as missing when it is clearly excluded.
- Exclusions / Extras / Risk Items: if the quote clearly excludes blown plaster removal, reboarding, major crack repairs, damp treatment, painting/decorating, moving large furniture and hidden defects, score 8-10/10.
- Timescale / Handover: a stated start date or duration with drying allowance should score 7-9/10.

===== MAIN QUOTE vs SUPPORTING DOCUMENTS =====
Distinguish where each fact came from. If info is supplied in a supporting document but NOT the main quote, classify it as "Supplied separately — confirm with plasterer". Supporting docs may only IMPROVE the pack score, never reduce it. Do not call something "missing" if it appears in a supporting document.

===== TWO SCORES PER CATEGORY (0-10) =====
- "score_main" = based ONLY on the main quote.
- "score_pack" = main quote PLUS supporting documents.
Anchors: 0 = not mentioned; 2 = vaguely mentioned; 4-5 = present but missing confirmation, or supplied in a supporting doc only; 7 = mostly clear, minor clarification; 8-10 = clear, specific, decision-ready. "score" should equal score_pack.

CATEGORIES to score:
${CATEGORIES.map((c) => `- ${c.key}: ${c.name}`).join("\n")}

STATUS values per category: "clear" | "supplied_separately" | "needs_clarifying" | "missing" | "not_scored".

===== STRONG QUOTE RULE (clarity_score ≥ 78) =====
If the overall main-quote clarity is 78 or higher, the "not_found" list MUST be short (max 6 items) and MUST only include genuinely useful final confirmations, such as:
- plasterer / company contact details if missing
- whether price is fixed if wall condition is as expected
- what happens if blown plaster is found
- exact drying time before decorating
- whether furniture moving is required
- start date
Use softer wording: "Worth confirming before acceptance.", "Minor confirmation point.", "Not a major issue, but useful to agree in writing." Do NOT make a good small plastering quote feel worse than it is.

WORDING STYLE: practical, calm and homeowner-friendly. Never accuse the plasterer. Never sound like legal advice. Use phrases like "Not visible in the quote — confirm if required.", "Worth confirming before accepting.", "Good detail, but ask for written confirmation on…", "Hidden damp or lath and plaster can surprise — worth flagging as a risk item.".

Respond with STRICT JSON only (no prose, no markdown fences) in EXACTLY this shape:
{
  "is_plastering_quote": true | false,
  "not_plastering_note": "only if is_plastering_quote is false: a short homeowner-friendly note",
  "verdict": { "level": "low" | "moderate" | "good" | "strong", "line": "one homeowner-friendly sentence" },
  "categories": [
    { "key": "<one of the keys above>", "name": "<name>", "relevant": true|false,
      "score_main": <0-10 or null>, "score_pack": <0-10 or null>, "score": <same as score_pack or null>,
      "status": "clear" | "supplied_separately" | "needs_clarifying" | "missing" | "not_scored",
      "note": "short plain-English explanation",
      "evidence_source": "in_quote" | "supplied_in_supporting" | "addendum_clarification" | "homeowner_supplied" | "not_found" }
  ],
  "quick_verdict": "2-3 sentence plain-English summary the homeowner reads first",
  "what_looks_clear": ["..."],
  "supplied_separately": [
    { "item": "<e.g. PVA bonding>", "main_quote": "<what the main quote says>", "supporting": "<what the supporting doc supplies>",
      "status": "Supplied separately — confirm with plasterer", "note": "short homeowner-friendly guidance" }
  ],
  "not_found": ["... items NOT visible in the main quote OR supporting documents — phrase as 'Not visible in the quote — confirm if required.' ..."],
  "key_risks": ["... the most important things worth confirming before accepting ..."],
  "questions": ["max 10 priority questions to ask the plasterer"],
  "suggested_message": "a short, polite, copyable message the homeowner can send the plasterer asking only for the most important clarifications based on the actual quote — do not generate a huge list if the quote is already strong",
  "summary": "a short ProGrafter summary paragraph"
}

Include EVERY category from the list in "categories" (mark not-relevant ones relevant:false, score null). Keep questions to a maximum of 10, prioritised.`;
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

function averageScore(scores: number[]): number {
  if (!scores.length) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10);
}

interface RunArgs {
  checkId: string;
  lookupToken: string;
  projectType?: string;
  intake?: Record<string, unknown>;
  pdfPath: string;
  supporting: { path: string; name: string }[];
  email?: string;
}

async function runAnalysis(supabase: any, args: RunArgs): Promise<void> {
  const { checkId, lookupToken, projectType, intake, pdfPath, supporting, email } = args;
  try {
    const content: unknown[] = [];
    const mainBlock = await downloadBlock(supabase, pdfPath, pdfPath);
    if (!mainBlock) throw new Error("Could not download the main quote file.");
    content.push({ type: "text", text: "===== MAIN PLASTERING / RENDERING QUOTE =====" });
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
      console.error("[plastering-quote] parse failed. rawLen=", raw?.length, "head=", (raw || "").slice(0, 400));
      throw new Error("Could not parse the analysis result.");
    }

    if (parsed.is_plastering_quote === false) {
      const report_json = {
        version: "plastering-v1",
        generated_at: new Date().toISOString(),
        project_type: projectType ?? null,
        is_plastering_quote: false,
        not_plastering_note:
          parsed.not_plastering_note ||
          "This does not appear to be a plastering / rendering quote. Please choose a different quote type or request a manual review.",
      };
      await supabase.from("simple_quote_checks").update({ status: "complete", report_json }).eq("id", checkId);
      return;
    }

    const byKey: Record<string, any> = {};
    for (const c of Array.isArray(parsed.categories) ? parsed.categories : []) {
      if (c && typeof c.key === "string") byKey[c.key] = c;
    }
    const categories = CATEGORIES.map(({ key, name }) => {
      const c = byKey[key] || {};
      const relevant = c.relevant === undefined ? true : !!c.relevant;
      const rawPack = typeof c.score_pack === "number" ? c.score_pack
        : typeof c.score === "number" ? c.score : null;
      const rawMain = typeof c.score_main === "number" ? c.score_main : rawPack;
      const scoreMain = relevant && typeof rawMain === "number" ? rawMain : null;
      let scorePack = relevant && typeof rawPack === "number" ? rawPack : null;
      if (scorePack !== null && scoreMain !== null && scorePack < scoreMain) scorePack = scoreMain;
      return {
        key, name, relevant,
        score: scorePack,
        score_main: scoreMain,
        score_pack: scorePack,
        status: c.status || (relevant ? "needs_clarifying" : "not_scored"),
        note: c.note || "",
        evidence_source: c.evidence_source || "not_found",
      };
    });

    const clarityScore = averageScore(
      categories.filter((c) => c.relevant && typeof c.score_main === "number").map((c) => c.score_main as number),
    );
    const packScore = averageScore(
      categories.filter((c) => c.relevant && typeof c.score_pack === "number").map((c) => c.score_pack as number),
    );
    const relevantCount = categories.filter((c) => c.relevant).length;
    const strong = categories.filter((c) => c.relevant && typeof c.score_pack === "number" && (c.score_pack as number) >= 7).map((c) => c.name);
    const weak = categories.filter((c) => c.relevant && typeof c.score_pack === "number" && (c.score_pack as number) <= 4).map((c) => c.name);

    const headline = clarityScore;
    let verdictLevel: "low" | "moderate" | "good" | "strong";
    let verdictLine: string;
    if (headline >= 78) {
      verdictLevel = "strong";
      verdictLine =
        "This is a strong plastering quote with clear areas, preparation, materials, finish and commercial terms. A few final confirmation points should be agreed before accepting.";
    } else if (headline >= 45) {
      verdictLevel = headline >= 68 ? "good" : "moderate";
      verdictLine =
        "This quote covers the basics of the plastering work and includes useful scope, but m², preparation, materials, waste and commercial points should be confirmed before accepting.";
    } else {
      verdictLevel = "low";
      verdictLine =
        "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about areas, preparation, materials and waste handling.";
    }

    const suppliedSeparately = Array.isArray(parsed.supplied_separately)
      ? parsed.supplied_separately.filter((s: any) => s && (s.item || s.supporting))
      : [];

    const report_json = {
      version: "plastering-v1",
      generated_at: new Date().toISOString(),
      project_type: projectType ?? null,
      is_plastering_quote: true,
      verdict: { level: verdictLevel, line: verdictLine },
      clarity_score: clarityScore,
      pack_confidence_score: packScore,
      has_supporting_docs: supporting.length > 0,
      relevant_categories_count: relevantCount,
      strong_categories: strong,
      weak_categories: weak,
      categories,
      quick_verdict: parsed.quick_verdict || "",
      what_looks_clear: Array.isArray(parsed.what_looks_clear) ? parsed.what_looks_clear : [],
      supplied_separately: suppliedSeparately,
      not_found: (Array.isArray(parsed.not_found) ? parsed.not_found : []).slice(0, clarityScore >= 78 ? 6 : 20),
      key_risks: Array.isArray(parsed.key_risks) ? parsed.key_risks : [],
      questions: (Array.isArray(parsed.questions) ? parsed.questions : []).slice(0, 10),
      suggested_message: parsed.suggested_message || "",
      summary: parsed.summary || "",
    };

    await supabase.from("simple_quote_checks").update({ status: "complete", report_json }).eq("id", checkId);

    if (email) {
      try {
        const base = "https://prografter.co.uk";
        const reportUrl = `${base}/plastering-quote-report/${checkId}?t=${encodeURIComponent(lookupToken)}`;
        await supabase.functions.invoke("send-app-email", {
          body: {
            templateName: "quote-health-check-ready",
            recipientEmail: email,
            idempotencyKey: `plastering-quote-ready-${checkId}`,
            templateData: { reportUrl, projectType: projectType ?? "" },
          },
        });
      } catch (mailErr) {
        console.error("[plastering-quote] email send failed", (mailErr as Error).message);
      }
    }
  } catch (err) {
    console.error("analyse-plastering-quote background error:", err);
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
    const { email, projectType, intake, pdfPath, supportingFiles, userId } = body ?? {};

    if (!pdfPath || typeof pdfPath !== "string") {
      return new Response(JSON.stringify({ error: "A quote file is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supporting: { path: string; name: string }[] = Array.isArray(supportingFiles)
      ? supportingFiles.slice(0, 10).map((s: any) => ({ path: String(s.path), name: String(s.name || s.path) }))
      : [];

    const { data: inserted, error: insertErr } = await supabase
      .from("simple_quote_checks")
      .insert({
        email: typeof email === "string" ? email : null,
        project_type: typeof projectType === "string" ? projectType : "Plastering",
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

    // @ts-ignore EdgeRuntime is available in the Supabase Edge runtime.
    EdgeRuntime.waitUntil(
      runAnalysis(supabase, {
        checkId,
        lookupToken,
        projectType: typeof projectType === "string" ? projectType : undefined,
        intake: intake ?? {},
        pdfPath,
        supporting,
        email: typeof email === "string" ? email : undefined,
      }),
    );

    return new Response(
      JSON.stringify({ id: checkId, lookupToken, status: "processing" }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("analyse-plastering-quote error:", err);
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
