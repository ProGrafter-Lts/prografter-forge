// Electrical / Rewire Quote Checker — a self-contained, homeowner-friendly analyser.
//
// This function is INTENTIONALLY independent of the Extension checker
// (analyse-simple-quote) and the Boiler checker (analyse-boiler-quote). It NEVER
// uses extension categories (foundations, drainage, roof, steels, plastering as a
// scored extension category, structural Building Control) or boiler categories
// (boiler, Gas Safe, flue, heating system). It scores an electrical / rewire
// quote against electrical-specific categories only. It refers to the tradesperson
// as the "electrician".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

// ---- Electrical / rewire scoring categories (this module ONLY) --------------
// These are electrical-specific ONLY. They MUST NOT overlap with any extension
// checker categories (foundations, drainage, roof, steels, structural Building
// Control, plastering) or any boiler checker categories (boiler, Gas Safe, flue,
// heating system, condensate).
const CATEGORIES: { key: string; name: string }[] = [
  { key: "quote_basics", name: "Quote Basics" },
  { key: "electrical_scope", name: "Electrical Scope & Quantities" },
  { key: "consumer_unit", name: "Consumer Unit / Distribution Board" },
  { key: "cabling_circuits", name: "Cabling, Circuits & Accessories" },
  { key: "safety_compliance", name: "Safety Devices & Compliance" },
  { key: "certification_partp", name: "Certification / Testing / Part P" },
  { key: "making_good_access", name: "Making Good / Access / Occupied Property" },
  { key: "exclusions_risk", name: "Exclusions / Extras / Risk Items" },
  { key: "price_payment", name: "Price / VAT / Payment Terms" },
  { key: "timescale_handover", name: "Timescale / Programme / Handover" },
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
  const ctx = intake?.electrical_context ?? intake ?? {};
  return `You are ProGrafter's ELECTRICAL / REWIRE QUOTE CHECKER — a homeowner-friendly assistant.

Your job: check whether a quote for ELECTRICAL work, a CONSUMER UNIT replacement, or a full/partial REWIRE clearly explains the scope, quantities, certification, exclusions, making good, payment terms and what to ask before accepting.

You are NOT the extension / structural building checker and NOT the boiler / heating checker. NEVER assess or score foundations, drainage, roof structure, steels, plastering as a building trade, structural Building Control, boilers, Gas Safe, flues or heating systems. Ignore any such items entirely — this is an electrical / rewire quote. Only mention Building Regulations / Part P where it relates to electrical work. Refer to the tradesperson as the "electrician", never the "builder".

===== FIRST: CONFIRM THIS IS AN ELECTRICAL / REWIRE QUOTE =====
Look at the MAIN document. If it is clearly NOT an electrical or rewire quote (e.g. it is an extension, boiler, kitchen, bathroom, roofing, driveway or unrelated document), set "is_electrical_quote": false and STOP scoring — return the minimal shape with is_electrical_quote:false and a short note. Otherwise set "is_electrical_quote": true and complete the full analysis.

You are given the main quote first, then any supporting documents (${supportingNames.length ? supportingNames.join(", ") : "none"}).

HOMEOWNER CONTEXT (use ONLY to decide what is relevant — never penalise the quote for omitting something the homeowner does not expect):
${JSON.stringify(ctx, null, 2)}

===== WHAT TO CHECK (electrical only) =====
Quote Basics: electrician/contractor name, quote date, quote validity, property address, VAT status, total price, whether the price is fixed or estimated.

Electrical Scope & Quantities: full or partial rewire, number of rooms/areas, number of sockets, number of light points, number of switches, appliance points, cooker supply, shower supply, smoke/heat/CO alarms, external lights, outdoor sockets, garage/shed supply, data/TV points if relevant.

Consumer Unit / Distribution Board: whether a new consumer unit is included, brand/model if stated, number of ways, RCBOs or MCB/RCD split-load arrangement, SPD surge protection, AFDDs if included or excluded, main switch rating, tails/meter connection assumptions, earthing/bonding assumptions, labelling.

Cabling, Circuits & Accessories: new cabling included, first fix and second fix included, accessory finish (white plastic / metal / decorative), socket/switch type, downlights/fittings included or client supplied, chases, back boxes and containment, loft/underfloor access, whether existing wiring is stripped out or disconnected.

Safety Devices & Compliance: smoke alarms, heat alarms, CO alarms where relevant, bonding to gas/water, earthing arrangement, RCD/RCBO protection, surge protection, load assumptions, electrical safety compliance.

Certification / Testing / Part P: Electrical Installation Certificate, Minor Electrical Installation Works Certificate where relevant, Electrical Installation Condition Report if relevant, Part P / Building Regulations notification, NICEIC / NAPIT / competent person registration if stated, testing and commissioning, handover certificate.

Making Good / Access / Occupied Property: chasing walls, lifting floorboards, access to loft/floors, dust protection, whether the property must be empty, whether furniture needs moving, whether making good is included, whether plastering/decoration is excluded, whether temporary power is provided.

Exclusions / Extras / Risk Items: making good excluded, decoration excluded, flooring removal/reinstatement excluded, access issues, asbestos, unsuitable existing earthing/bonding, meter tails upgrade, DNO/meter operator works, hidden faults, additional points, client changes, upgrade from standard white accessories, damaged plaster/floors.

Price / VAT / Payment Terms: total price, VAT inclusive/exclusive, payment schedule, deposit amount, balance trigger, staged payments for larger rewires, variation process.

Timescale / Programme / Handover: start date, duration, whether the property is liveable during works, sequencing, final testing, handover paperwork, warranty/workmanship guarantee.

===== SCORE BEHAVIOUR & CALIBRATION =====
Do NOT punish an electrical quote for not including extension/building or boiler items. Score against the electrical categories ONLY.

Calibrate to these three reference quotes so scoring feels fair to homeowners:

WEAK (target overall 5-15/100): e.g. "Rewire house £4,500." — no quantities, no consumer unit detail, no certification, no VAT, no timescale, no exclusions. Most categories 0-2.

MEDIUM (target overall 55-70/100): e.g. "Full rewire of 3-bed semi. New consumer unit with SPD. 20 double sockets, 10 light points, smoke alarms, white accessories, EIC certificate. £6,200 plus VAT. Making good excluded." Good scope and quantities, so Electrical Scope & Quantities, Consumer Unit and Cabling/Circuits should score 7-9. Mark it DOWN — but not to the floor — for missing detail on RCBOs/AFDDs, Part P notification, bonding, access/occupied assumptions, timescale, payment terms and handover: those categories should sit around 3-5, NOT 0-1. The overall average must land near 55-70, never near 34.

STRONG (target overall 80-90/100): e.g. "Full rewire of occupied 3-bed semi including new 18th edition RCBO consumer unit with SPD, 24 double sockets, 12 light points, 2 smoke alarms, 1 heat alarm, cooker circuit, shower circuit, bonding to gas/water, white accessories, first and second fix, testing, Electrical Installation Certificate, Part P notification, 10 working days, making good excluded, £7,800 inc VAT, staged payments." Clear scope, quantities, compliance, price and exclusions. Only sensible final clarifications remain. Most categories 8-10.

Missing certification/compliance detail should reduce the score, but must NEVER make an otherwise detailed quote score as if it is almost empty. A quote with clear scope, quantities, consumer unit, cabling and price should always land in at least the moderate band even when Part P / certification paperwork is not spelled out.

===== MAIN QUOTE vs SUPPORTING DOCUMENTS =====
Distinguish where each fact came from. If info is supplied in a supporting document but NOT the main quote, classify it as "Supplied separately — confirm with electrician". Do NOT mark it as fully confirmed unless it is clearly electrician-issued or accepted. Do NOT treat homeowner-written notes as electrician-confirmed unless clearly stated. Supporting docs may only IMPROVE the pack score, never reduce it. Do not call something "missing" if it appears in a supporting document.

===== TWO SCORES PER CATEGORY (0-10) =====
- "score_main" = based ONLY on the main quote.
- "score_pack" = main quote PLUS supporting documents.
Anchors: 0 = not mentioned; 2 = vaguely mentioned; 4-5 = present but missing confirmation/paperwork, or supplied in a supporting doc only; 7 = mostly clear, minor clarification; 8-10 = clear, specific, decision-ready. "score" should equal score_pack.

CATEGORIES to score:
${CATEGORIES.map((c) => `- ${c.key}: ${c.name}`).join("\n")}

STATUS values per category: "clear" | "supplied_separately" | "needs_clarifying" | "missing" | "not_scored".

WORDING STYLE: practical, calm and homeowner-friendly. Never accuse the electrician. Never sound like legal advice, and never use absolute regulatory language. Prefer softened guidance wording. For example, instead of "A full rewire legally requires an EIC and Part P notification", say "A full domestic rewire would normally require an Electrical Installation Certificate and Building Regulations / Part P notification." Use phrases like "Not visible in the quote — confirm if required.", "Worth confirming before accepting.", "would normally include…", "is typically expected on a full rewire…", "Making good is often excluded from electrical rewires, but it should be clearly stated.".

===== NOT FOUND — GROUPING RULE =====
Do NOT return a long flat list of every missing electrical item. Instead group missing items into the following homeowner-friendly categories, and only include a group if it has at least one missing item:
- "Scope detail missing" — e.g. number of rooms, socket quantities, light points, switches, appliance circuits.
- "Consumer unit detail missing" — e.g. whether a new consumer unit is included, brand/model, number of ways, RCBO/RCD arrangement, SPD, bonding/earthing assumptions.
- "Certification missing" — e.g. Electrical Installation Certificate, Part P / Building Regulations notification, NICEIC/NAPIT or competent person registration, testing and commissioning.
- "Site impact missing" — e.g. chasing, making good, dust protection, furniture moving, temporary power.
- "Commercial terms missing" — e.g. VAT status, quote validity, deposit amount, duration, workmanship guarantee, exclusions.
Return this as "not_found_grouped". Keep "not_found" as a short flat fallback (max 6 items) covering only the single most important gaps.

Respond with STRICT JSON only (no prose, no markdown fences) in EXACTLY this shape:
{
  "is_electrical_quote": true | false,
  "not_electrical_note": "only if is_electrical_quote is false: a short homeowner-friendly note",
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
    { "item": "<e.g. Consumer unit spec>", "main_quote": "<what the main quote says>", "supporting": "<what the supporting doc supplies>",
      "status": "Supplied separately — confirm with electrician", "note": "short homeowner-friendly guidance" }
  ],
  "not_found_grouped": [
    { "category": "Scope detail missing" | "Consumer unit detail missing" | "Certification missing" | "Site impact missing" | "Commercial terms missing",
      "items": ["short homeowner-friendly item", "..."] }
  ],
  "not_found": ["max 6 short fallback items — the single most important gaps only"],
  "key_risks": ["... the most important things worth confirming before accepting ..."],
  "questions": ["max 10 priority questions to ask the electrician — softened wording, no absolute legal claims"],
  "suggested_message": "a short, polite, copyable message the homeowner can send the electrician asking only for the most important clarifications based on the actual quote — do not generate a huge list if the quote is already strong",
  "summary": "a short ProGrafter summary paragraph"
}

Include EVERY category from the list in "categories" (mark not-relevant ones relevant:false, score null). Keep questions to a maximum of 10, prioritised. Always use softened, non-absolute wording about certification and Part P.`;
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
    content.push({ type: "text", text: "===== MAIN ELECTRICAL / REWIRE QUOTE =====" });
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
      console.error("[electrical-quote] parse failed. rawLen=", raw?.length, "head=", (raw || "").slice(0, 400));
      throw new Error("Could not parse the analysis result.");
    }

    // Manual review fallback — wrong document type.
    if (parsed.is_electrical_quote === false) {
      const report_json = {
        version: "electrical-v1",
        generated_at: new Date().toISOString(),
        project_type: projectType ?? null,
        is_electrical_quote: false,
        not_electrical_note:
          parsed.not_electrical_note ||
          "This does not appear to be an electrical or rewire quote. Please choose a different quote type or request a manual review.",
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

    // Deterministic electrical verdict wording, banded off the headline (main) score.
    // Keeps language electrical-specific — never references extensions or boilers.
    const headline = clarityScore;
    let verdictLevel: "low" | "moderate" | "good" | "strong";
    let verdictLine: string;
    if (headline >= 78) {
      verdictLevel = "strong";
      verdictLine =
        "This is a strong electrical quote with clear scope, quantities, consumer unit detail, certification and sensible exclusions. A few final confirmation points should be agreed before accepting.";
    } else if (headline >= 45) {
      verdictLevel = headline >= 68 ? "good" : "moderate";
      verdictLine =
        "This quote covers the basics of the electrical work and includes useful scope and quantities, but key certification, making-good and commercial points should be confirmed before accepting.";
    } else {
      verdictLevel = "low";
      verdictLine =
        "This quote is too vague to accept safely yet. It gives a price, but leaves out important detail that would normally be included on a rewire — scope quantities, consumer unit spec, certification, making good and commercial terms.";
    }


    const suppliedSeparately = Array.isArray(parsed.supplied_separately)
      ? parsed.supplied_separately.filter((s: any) => s && (s.item || s.supporting))
      : [];

    const report_json = {
      version: "electrical-v1",
      generated_at: new Date().toISOString(),
      project_type: projectType ?? null,
      is_electrical_quote: true,
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
        const reportUrl = `${base}/electrical-quote-report/${checkId}?t=${encodeURIComponent(lookupToken)}`;
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "quote-health-check-ready",
            recipientEmail: email,
            idempotencyKey: `electrical-quote-ready-${checkId}`,
            templateData: { reportUrl, projectType: projectType ?? "" },
          },
        });
      } catch (mailErr) {
        console.error("[electrical-quote] email send failed", (mailErr as Error).message);
      }
    }
  } catch (err) {
    console.error("analyse-electrical-quote background error:", err);
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
        project_type: typeof projectType === "string" ? projectType : "Electrical / Rewire",
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
    console.error("analyse-electrical-quote error:", err);
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
