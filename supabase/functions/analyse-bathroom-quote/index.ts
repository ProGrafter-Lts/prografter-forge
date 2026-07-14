// Bathroom Quote Checker — a self-contained, homeowner-friendly analyser.
//
// This function is INTENTIONALLY independent of the Extension checker
// (analyse-simple-quote), the Boiler checker (analyse-boiler-quote) and the
// Electrical checker (analyse-electrical-quote). It NEVER uses extension
// categories (foundations, drainage, roof, steels, structural Building Control),
// boiler categories (boiler, Gas Safe, flue, heating system) or electrical/rewire
// categories (consumer unit, full rewire, Part P as a standalone scored trade).
// It scores a BATHROOM quote against bathroom-specific categories only, and refers
// to the tradesperson as the "bathroom installer" or "contractor".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

// ---- Bathroom scoring categories (this module ONLY) -------------------------
// Bathroom-specific ONLY. MUST NOT overlap with extension, boiler or electrical
// scored categories.
const CATEGORIES: { key: string; name: string }[] = [
  { key: "quote_basics", name: "Quote Basics" },
  { key: "strip_out_waste", name: "Strip-Out & Waste Removal" },
  { key: "plumbing_scope", name: "Plumbing Scope" },
  { key: "sanitaryware_fixtures", name: "Sanitaryware & Fixtures" },
  { key: "tiling_waterproofing", name: "Tiling / Waterproofing / Tanking" },
  { key: "electrical_ventilation", name: "Electrical & Ventilation" },
  { key: "flooring_making_good", name: "Flooring / Plastering / Making Good" },
  { key: "exclusions_risk", name: "Exclusions / Extras / Risk Items" },
  { key: "price_payment", name: "Price / VAT / Payment Terms" },
  { key: "timescale_guarantees", name: "Timescale / Handover / Guarantees" },
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
  const ctx = intake?.bathroom_context ?? intake ?? {};
  return `You are ProGrafter's BATHROOM QUOTE CHECKER — a homeowner-friendly assistant.

Your job: check whether a quote for a BATHROOM (full refit, ensuite, shower room, cloakroom or bathroom repair) clearly explains the strip-out, plumbing, electrics, tiling, waterproofing, sanitaryware, finishes, exclusions, waste removal, certification and the questions to ask before accepting.

You are NOT the extension / structural building checker, NOT the boiler / heating checker and NOT the electrical / rewire checker. NEVER assess or score foundations, drainage runs, roof structure, steels, structural Building Control, boilers, Gas Safe, flues, heating systems, or a whole-house rewire / consumer unit. Only mention electrics where they relate to BATHROOM electrics (extractor fan, shaver socket, lights, electric mirror, underfloor heating, IP-rated zones). Refer to the tradesperson as the "bathroom installer" or "contractor", never the "builder".

===== FIRST: CONFIRM THIS IS A BATHROOM QUOTE =====
Look at the MAIN document. If it is clearly NOT a bathroom / ensuite / shower room / cloakroom quote (e.g. it is an extension, boiler, whole-house rewire, kitchen, roofing, driveway or unrelated document), set "is_bathroom_quote": false and STOP scoring — return the minimal shape with is_bathroom_quote:false and a short note. Otherwise set "is_bathroom_quote": true and complete the full analysis.

You are given the main quote first, then any supporting documents (${supportingNames.length ? supportingNames.join(", ") : "none"}).

HOMEOWNER CONTEXT (use ONLY to decide what is relevant — never penalise the quote for omitting something the homeowner does not expect):
${JSON.stringify(ctx, null, 2)}

===== WHAT TO CHECK (bathroom only) =====
Quote Basics: bathroom installer/contractor name, quote date, quote validity, property address, VAT status, total price, whether the price is fixed or estimated, type of bathroom (full refit / ensuite / shower room / cloakroom / repair).

Strip-Out & Waste Removal: strip-out of existing bathroom included, removal of old suite/tiles/flooring, disposal of old bathroom, skip/waste removal, protection of floors and stairs, whether waste removal is included or excluded.

Plumbing Scope: pipework alterations, hot/cold/waste connections, moving or keeping the layout, new soil/waste connections, shower pump if required, isolation valves, connection of taps and wastes, first fix and second fix plumbing.

Sanitaryware & Fixtures: toilet, basin, bath, shower, shower tray, screen, taps and wastes, brassware, who supplies the fixtures (homeowner or contractor), whether a sanitaryware allowance / PC sum is stated and whether it is realistic.

Tiling / Waterproofing / Tanking: tiling area in m², wall tiling, floor tiling, tile adhesive / grout / trim, who supplies the tiles, tanking / waterproofing to wet areas, plasterboard / tile backer board behind tiles, quality of substrate preparation.

Electrical & Ventilation: extractor fan, lights, shaver socket, electric mirror, underfloor heating if relevant, IP-rated zones / bathroom electrics, whether bathroom electrics are certified (Part P / test certificate for the bathroom electrics only).

Flooring / Plastering / Making Good: flooring included, plastering, making good, decoration, painting, whether these are included or excluded.

Exclusions / Extras / Risk Items: strip-out excluded, waste removal unclear, tiles supplied by customer, sanitaryware allowance too low, hidden pipework issues, rotten floors, poor existing walls, inadequate ventilation, waterproofing/tanking missing, electrics uncertified, flooring excluded, plastering excluded, decoration excluded, layout changes, access assumptions.

Price / VAT / Payment Terms: total price, VAT inclusive/exclusive, PC sums / allowances, payment schedule, deposit, balance trigger, staged payments, variation process.

Timescale / Handover / Guarantees: start date, duration, sequencing, handover, workmanship guarantee, manufacturer warranties on sanitaryware/fittings.

===== SCORE BEHAVIOUR & CALIBRATION =====
Do NOT punish a bathroom quote for not including extension/building, boiler or whole-house rewire items. Score against the bathroom categories ONLY.

Calibrate to these three reference quotes so scoring feels fair to homeowners:

WEAK (target overall 5-15/100): e.g. "Fit new bathroom £4,500." — no strip-out detail, no sanitaryware list, no tiling area, no waterproofing, no VAT, no timescale, no exclusions. Most categories 0-2. Keep the weak quote scoring low.

MEDIUM (target overall 45-60/100): e.g. "Strip out bathroom, fit new suite, tile shower area, fit fan, waste included, £6,000 plus VAT." Some real scope — strip-out, a suite, some tiling and an extractor fan — so Strip-Out & Waste Removal, Plumbing Scope and Sanitaryware should score around 5-7. Mark it DOWN — but not to the floor — for missing detail on tiling area in m², who supplies tiles/sanitaryware, waterproofing/tanking, flooring, making good, payment terms, timescale and guarantees: those categories should sit around 3-5, NOT 0-1. The overall average must land near 45-60, never near 30.

STRONG (target overall 82-88/100): a fully itemised bathroom quote covering strip-out, removal/disposal, sanitaryware list, hot/cold/waste pipework, moisture-resistant plasterboard, tanking/waterproofing to wet areas, wall and floor tiling, extractor fan, bathroom light fitting, silicone finish, final clean, waste removal, clear exclusions, timescale, VAT-inclusive price, staged payments, 12-month workmanship guarantee and quote validity. This is clear and mostly decision-ready — only sensible final clarifications remain. Most categories 8-10 and the overall score MUST land in 82-88, not in the 70s.

===== REWARD CLARITY (do not penalise) =====
- Clear exclusions (e.g. decoration, moving soil pipe, underfloor heating, rotten floor repairs, electrical circuit upgrades, tiles above an allowance) are a POSITIVE feature — they reduce dispute risk. "Exclusions / Extras / Risk Items" MUST score high (8-10) where exclusions are clearly stated. Do not penalise clear exclusions.
- Clear allowances (e.g. "Tiles over £35/m² unless agreed as extra") are useful clarity, NOT a weakness. Do not reduce the score materially — instead raise a minor clarification question such as "Confirm the final tile choice and whether it stays within the £35/m² allowance."

===== CATEGORY CALIBRATION FOR STRONG QUOTES =====
- Sanitaryware & Fixtures: if the quote lists the key items (bath, basin, toilet, vanity unit, taps, shower screen), score 7-9/10. Only reduce slightly if exact brands/models are not stated — never score low for this alone.
- Electrical & Ventilation: if the quote includes an extractor fan AND a bathroom light fitting, this category MUST NOT score low. Suggested range 6-8/10 depending on detail. It is fine to ask whether bathroom electrics are certified, whether the existing circuit is suitable, and whether fan model/location is confirmed — but do not treat this as a major gap.

Missing waterproofing or certification detail should reduce the score, but must NEVER make an otherwise detailed quote score as if it is almost empty. A quote with clear strip-out, plumbing, sanitaryware, tiling and price should always land in at least the moderate band even when tanking / guarantees are not spelled out.

===== STRONG QUOTE RULE (overall >= 80) =====
If the overall main score is 80 or above, keep the "not_found" list SHORT (max 6) and SOFT. Only include genuinely useful final confirmations, drawn from: contractor details if not shown, exact sanitaryware makes/models if not stated, final tile choice and allowance, extractor fan model/location, bathroom electrical certification, rotten floor / hidden defect process, start date. Use softer wording such as "Worth confirming before acceptance.", "Minor confirmation point.", "Not a major issue, but useful to agree in writing." Do NOT make a strong bathroom quote feel risky.

===== MAIN QUOTE vs SUPPORTING DOCUMENTS =====
Distinguish where each fact came from. If info is supplied in a supporting document but NOT the main quote, classify it as "Supplied separately — confirm with bathroom installer". Do NOT mark it as fully confirmed unless it is clearly contractor-issued or accepted. Do NOT treat homeowner-written notes as contractor-confirmed unless clearly stated. Supporting docs may only IMPROVE the pack score, never reduce it. Do not call something "missing" if it appears in a supporting document.

===== TWO SCORES PER CATEGORY (0-10) =====
- "score_main" = based ONLY on the main quote.
- "score_pack" = main quote PLUS supporting documents.
Anchors: 0 = not mentioned; 2 = vaguely mentioned; 4-5 = present but missing confirmation/detail, or supplied in a supporting doc only; 7 = mostly clear, minor clarification; 8-10 = clear, specific, decision-ready. "score" should equal score_pack.

CATEGORIES to score:
${CATEGORIES.map((c) => `- ${c.key}: ${c.name}`).join("\n")}

STATUS values per category: "clear" | "supplied_separately" | "needs_clarifying" | "missing" | "not_scored".

WORDING STYLE: practical, calm and homeowner-friendly. Never accuse the bathroom installer. Never sound like legal advice. Use phrases like "Not visible in the quote — confirm if required.", "Worth confirming before accepting.", "Good detail, but ask for written confirmation on…", "Waterproofing/tanking is often assumed but should be clearly stated.".

Respond with STRICT JSON only (no prose, no markdown fences) in EXACTLY this shape:
{
  "is_bathroom_quote": true | false,
  "not_bathroom_note": "only if is_bathroom_quote is false: a short homeowner-friendly note",
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
    { "item": "<e.g. Tile spec / sanitaryware list>", "main_quote": "<what the main quote says>", "supporting": "<what the supporting doc supplies>",
      "status": "Supplied separately — confirm with bathroom installer", "note": "short homeowner-friendly guidance" }
  ],
  "not_found": ["... items NOT visible in the main quote OR supporting documents — phrase as 'Not visible in the quote — confirm if required.' ..."],
  "key_risks": ["... the most important things worth confirming before accepting ..."],
  "questions": ["max 10 priority questions to ask the bathroom installer"],
  "suggested_message": "a short, polite, copyable message the homeowner can send the bathroom installer asking only for the most important clarifications based on the actual quote — do not generate a huge list if the quote is already strong",
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
    content.push({ type: "text", text: "===== MAIN BATHROOM QUOTE =====" });
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
      console.error("[bathroom-quote] parse failed. rawLen=", raw?.length, "head=", (raw || "").slice(0, 400));
      throw new Error("Could not parse the analysis result.");
    }

    // Manual review fallback — wrong document type.
    if (parsed.is_bathroom_quote === false) {
      const report_json = {
        version: "bathroom-v1",
        generated_at: new Date().toISOString(),
        project_type: projectType ?? null,
        is_bathroom_quote: false,
        not_bathroom_note:
          parsed.not_bathroom_note ||
          "This does not appear to be a bathroom quote. Please choose a different quote type or request a manual review.",
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

    // Deterministic bathroom verdict wording, banded off the headline (main) score.
    const headline = clarityScore;
    let verdictLevel: "low" | "moderate" | "good" | "strong";
    let verdictLine: string;
    if (headline >= 78) {
      verdictLevel = "strong";
      verdictLine =
        "This is a strong bathroom quote with clear strip-out, plumbing, sanitaryware, tiling, waterproofing and sensible exclusions. A few final confirmation points should be agreed before accepting.";
    } else if (headline >= 45) {
      verdictLevel = headline >= 68 ? "good" : "moderate";
      verdictLine =
        "This quote covers the basics of the bathroom work, but key points on waterproofing, tiling detail, who supplies fixtures, making good and commercial terms should be confirmed before accepting.";
    } else {
      verdictLevel = "low";
      verdictLine =
        "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about the strip-out, plumbing, sanitaryware, tiling, waterproofing and exclusions.";
    }

    const suppliedSeparately = Array.isArray(parsed.supplied_separately)
      ? parsed.supplied_separately.filter((s: any) => s && (s.item || s.supporting))
      : [];

    const report_json = {
      version: "bathroom-v1",
      generated_at: new Date().toISOString(),
      project_type: projectType ?? null,
      is_bathroom_quote: true,
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
        const reportUrl = `${base}/bathroom-quote-report/${checkId}?t=${encodeURIComponent(lookupToken)}`;
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "quote-health-check-ready",
            recipientEmail: email,
            idempotencyKey: `bathroom-quote-ready-${checkId}`,
            templateData: { reportUrl, projectType: projectType ?? "" },
          },
        });
      } catch (mailErr) {
        console.error("[bathroom-quote] email send failed", (mailErr as Error).message);
      }
    }
  } catch (err) {
    console.error("analyse-bathroom-quote background error:", err);
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
        project_type: typeof projectType === "string" ? projectType : "Bathroom",
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
    console.error("analyse-bathroom-quote error:", err);
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
