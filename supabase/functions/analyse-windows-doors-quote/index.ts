// Windows & Doors Quote Checker — a self-contained, homeowner-friendly analyser.
//
// This function is INTENTIONALLY independent of every other module. It NEVER
// uses those modules' categories. It scores a windows/doors quote against
// windows-and-doors-specific categories ONLY and refers to the tradesperson as
// the "window & door installer".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

// ---- Windows & Doors scoring categories (this module ONLY) ------------------
const CATEGORIES: { key: string; name: string }[] = [
  { key: "quote_basics", name: "Quote Basics" },
  { key: "product_specification", name: "Product Specification" },
  { key: "sizes_openings", name: "Sizes / Openings / Measurements" },
  { key: "glazing_security_vent", name: "Glazing / Security / Ventilation" },
  { key: "installation_making_good", name: "Installation / Making Good" },
  { key: "disposal_access", name: "Disposal / Access" },
  { key: "certification_guarantees", name: "Certification / Guarantees" },
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
  const ctx = intake?.windows_doors_context ?? intake ?? {};
  return `You are ProGrafter's WINDOWS & DOORS QUOTE CHECKER — a homeowner-friendly assistant.

Your job: check whether a quote for WINDOWS AND/OR DOORS (uPVC / aluminium / timber / composite windows, front doors, back doors, patio doors, bifold doors, French doors, or a mixed package) clearly explains the products, sizes, glazing, installation, making good, disposal, certification, guarantees, exclusions, price and payment.

You are NOT the extension, boiler, electrical, bathroom, roofing or kitchen checker. NEVER assess or score foundations, structural steels beyond what's needed for the opening, boilers, rewires, bathroom sanitaryware, roof coverings, kitchen units or unrelated items. Ignore any such items entirely — this is a windows & doors quote. Only mention Building Regulations / FENSA / CERTASS where it directly relates to the window & door scope (glazing certification, structural openings, replacement windows, lintels if openings are altered). Refer to the tradesperson as the "window & door installer", never the "builder" or "roofer".

===== FIRST: CONFIRM THIS IS A WINDOWS & DOORS QUOTE =====
Look at the MAIN document. If it is clearly NOT a windows/doors quote (e.g. it is an extension, boiler, electrical rewire, bathroom, kitchen, roofing, driveway or unrelated document), set "is_windows_doors_quote": false and STOP scoring — return the minimal shape with is_windows_doors_quote:false and a short note. Otherwise set "is_windows_doors_quote": true and complete the full analysis.

You are given the main quote first, then any supporting documents (${supportingNames.length ? supportingNames.join(", ") : "none"}).

HOMEOWNER CONTEXT (use ONLY to decide what is relevant — never penalise the quote for omitting something the homeowner does not expect):
${JSON.stringify(ctx, null, 2)}

===== WHAT TO CHECK (windows & doors only) =====
Quote Basics: window & door installer/company name, quote date, quote validity, property address, VAT status, total price, whether price is fixed or estimated.

Product Specification: type (window/door/bifold/patio/composite door); material (uPVC / aluminium / timber / composite); frame colour inside and outside; profile/system named; hardware finish; cill and trim finish.

Sizes / Openings / Measurements: sizes listed per opening, or "to be surveyed"; number of openings covered; opening configurations (e.g. tilt & turn, top-hung, fixed, French, bifold config); confirmation of a technical survey before manufacture.

Glazing / Security / Ventilation: glazing spec (double / triple, U-value, argon, low-E); toughened / safety glass where required (doors, low-level, near stairs); obscure glass where required (bathrooms); trickle vents (Building Regs since 2022 for replacement windows); locks and multi-point locking; handles; PAS 24 / Secured by Design where applicable.

Installation / Making Good: removal and installation method; internal and external making good; plaster reveals; silicone finish; new lintels if openings are being altered; internal sill/board; external trims and cover strips.

Disposal / Access: removal and disposal of old windows/doors; access (ladders, scaffold, tower); protection of internal furniture and floors.

Certification / Guarantees: FENSA or CERTASS certificate (or Building Control notification); manufacturer product warranty (frames, glass, hardware); installer workmanship guarantee.

Exclusions / Extras / Risk Items: structural alterations (new/enlarged openings, lintels); hidden defects around openings; asbestos in old sills or reveals; blinds/curtains re-fit; decoration after making good; scaffold cost if not included.

Price / VAT / Payment Terms: total price, VAT inclusive/exclusive, deposit, staged payments, balance trigger, variation process for changes on survey.

Timescale / Handover: lead time for manufacture, install duration, handover, certificates issued after install.

===== SCORE BEHAVIOUR & CALIBRATION =====
Do NOT punish a windows/doors quote for not including extension, boiler, electrical, bathroom, kitchen or roofing items. Score against the windows-and-doors categories ONLY.

Calibrate to these three reference quotes so scoring feels fair to homeowners:

WEAK (target overall 10-25/100): e.g. "Supply and fit new front door £1,100." — no product, no material, no glazing, no colour, no security, no guarantee, no certification, no VAT. Most categories 0-2.

MEDIUM (target overall 45-65/100): e.g. "Supply and fit white uPVC windows, dispose old windows, 10-year guarantee, £4,500." Reasonable scope so Product Specification 4-6, Disposal 6-7, Certification/Guarantees 5-6. Mark it DOWN — but not to the floor — for missing sizes, glazing spec, trickle vents, security detail, making good, VAT, payment terms and timescale: those categories should sit around 2-4, NOT 0-1. Overall must land near 45-65.

STRONG (target overall 80-90/100): a detailed windows/doors quote with product spec, sizes per opening, glazing spec, trickle vents, security/locks, colour inside and outside, installation and making good, disposal, FENSA/CERTASS certificate, manufacturer and installer guarantees, VAT, payment stages and clear exclusions. Only sensible final clarifications remain. Most categories 8-10.

Missing detail should reduce the score, but a quote with clear product, disposal and guarantee should always land in at least the moderate band even when sizes or trickle vents are not spelled out.

===== MAIN QUOTE vs SUPPORTING DOCUMENTS =====
Distinguish where each fact came from. If info is supplied in a supporting document but NOT the main quote, classify it as "Supplied separately — confirm with window & door installer". Do NOT mark it as fully confirmed unless it is clearly installer-issued or accepted. Do NOT treat homeowner-written notes as installer-confirmed unless clearly stated. Supporting docs may only IMPROVE the pack score, never reduce it. Do not call something "missing" if it appears in a supporting document.

===== TWO SCORES PER CATEGORY (0-10) =====
- "score_main" = based ONLY on the main quote.
- "score_pack" = main quote PLUS supporting documents.
Anchors: 0 = not mentioned; 2 = vaguely mentioned; 4-5 = present but missing confirmation/paperwork, or supplied in a supporting doc only; 7 = mostly clear, minor clarification; 8-10 = clear, specific, decision-ready. "score" should equal score_pack.

CATEGORIES to score:
${CATEGORIES.map((c) => `- ${c.key}: ${c.name}`).join("\n")}

STATUS values per category: "clear" | "supplied_separately" | "needs_clarifying" | "missing" | "not_scored".

WORDING STYLE: practical, calm and homeowner-friendly. Never accuse the window & door installer. Never sound like legal advice. Use phrases like "Not visible in the quote — confirm if required.", "Worth confirming before accepting.", "Good detail, but ask for written confirmation on…", "Trickle vents are now a Building Regs requirement for replacement windows — worth checking they're included.".

Respond with STRICT JSON only (no prose, no markdown fences) in EXACTLY this shape:
{
  "is_windows_doors_quote": true | false,
  "not_windows_doors_note": "only if is_windows_doors_quote is false: a short homeowner-friendly note",
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
    { "item": "<e.g. Glazing specification>", "main_quote": "<what the main quote says>", "supporting": "<what the supporting doc supplies>",
      "status": "Supplied separately — confirm with window & door installer", "note": "short homeowner-friendly guidance" }
  ],
  "not_found": ["... items NOT visible in the main quote OR supporting documents — phrase as 'Not visible in the quote — confirm if required.' ..."],
  "key_risks": ["... the most important things worth confirming before accepting ..."],
  "questions": ["max 10 priority questions to ask the window & door installer"],
  "suggested_message": "a short, polite, copyable message the homeowner can send the window & door installer asking only for the most important clarifications based on the actual quote — do not generate a huge list if the quote is already strong",
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
    content.push({ type: "text", text: "===== MAIN WINDOWS & DOORS QUOTE =====" });
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
      console.error("[windows-doors-quote] parse failed. rawLen=", raw?.length, "head=", (raw || "").slice(0, 400));
      throw new Error("Could not parse the analysis result.");
    }

    if (parsed.is_windows_doors_quote === false) {
      const report_json = {
        version: "windows-doors-v1",
        generated_at: new Date().toISOString(),
        project_type: projectType ?? null,
        is_windows_doors_quote: false,
        not_windows_doors_note:
          parsed.not_windows_doors_note ||
          "This does not appear to be a windows & doors quote. Please choose a different quote type or request a manual review.",
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
        "This is a strong windows & doors quote with clear product spec, sizes, glazing, installation and certification. A few final confirmation points should be agreed before accepting.";
    } else if (headline >= 45) {
      verdictLevel = headline >= 68 ? "good" : "moderate";
      verdictLine =
        "This quote covers the basics of the window & door work and includes useful scope, but glazing spec, trickle vents, making good, certification and commercial points should be confirmed before accepting.";
    } else {
      verdictLevel = "low";
      verdictLine =
        "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about the product, sizes, glazing, security, certification and guarantees.";
    }

    const suppliedSeparately = Array.isArray(parsed.supplied_separately)
      ? parsed.supplied_separately.filter((s: any) => s && (s.item || s.supporting))
      : [];

    const report_json = {
      version: "windows-doors-v1",
      generated_at: new Date().toISOString(),
      project_type: projectType ?? null,
      is_windows_doors_quote: true,
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
      not_found: Array.isArray(parsed.not_found) ? parsed.not_found : [],
      key_risks: Array.isArray(parsed.key_risks) ? parsed.key_risks : [],
      questions: (Array.isArray(parsed.questions) ? parsed.questions : []).slice(0, 10),
      suggested_message: parsed.suggested_message || "",
      summary: parsed.summary || "",
    };

    await supabase.from("simple_quote_checks").update({ status: "complete", report_json }).eq("id", checkId);

    if (email) {
      try {
        const base = "https://prografter.co.uk";
        const reportUrl = `${base}/windows-doors-quote-report/${checkId}?t=${encodeURIComponent(lookupToken)}`;
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "quote-health-check-ready",
            recipientEmail: email,
            idempotencyKey: `windows-doors-quote-ready-${checkId}`,
            templateData: { reportUrl, projectType: projectType ?? "" },
          },
        });
      } catch (mailErr) {
        console.error("[windows-doors-quote] email send failed", (mailErr as Error).message);
      }
    }
  } catch (err) {
    console.error("analyse-windows-doors-quote background error:", err);
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
        project_type: typeof projectType === "string" ? projectType : "Windows & Doors",
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
    console.error("analyse-windows-doors-quote error:", err);
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
