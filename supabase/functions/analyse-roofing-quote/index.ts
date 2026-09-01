// Roofing Quote Checker — a self-contained, homeowner-friendly analyser.
//
// This function is INTENTIONALLY independent of the Extension checker
// (analyse-simple-quote), the Boiler checker (analyse-boiler-quote), the
// Electrical checker (analyse-electrical-quote) and the Bathroom checker
// (analyse-bathroom-quote). It NEVER uses those modules' categories. It scores a
// roofing quote against roofing-specific categories ONLY and refers to the
// tradesperson as the "roofer".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

// ---- Roofing scoring categories (this module ONLY) --------------------------
// These are roofing-specific ONLY. They MUST NOT overlap with any extension,
// boiler, electrical or bathroom checker categories.
const CATEGORIES: { key: string; name: string }[] = [
  { key: "quote_basics", name: "Quote Basics" },
  { key: "roofing_scope", name: "Roofing Scope" },
  { key: "materials_spec", name: "Materials Specification" },
  { key: "access_scaffold", name: "Access / Scaffold / Safety" },
  { key: "roof_details", name: "Roof Details / Leadwork / Junctions" },
  { key: "insulation_ventilation", name: "Insulation / Ventilation / Building Regulations" },
  { key: "waste_protection", name: "Waste Removal / Protection" },
  { key: "exclusions_risk", name: "Exclusions / Extras / Risk Items" },
  { key: "price_payment", name: "Price / VAT / Payment Terms" },
  { key: "timescale_guarantees", name: "Timescale / Guarantees / Handover" },
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
  const ctx = intake?.roofing_context ?? intake ?? {};
  return `You are ProGrafter's ROOFING QUOTE CHECKER — a homeowner-friendly assistant.

Your job: check whether a quote for ROOFING work (a repair, re-roof, flat roof, chimney work, or fascia/soffit/gutter/roofline work) clearly explains the scope, materials, access, scaffold, waste, leadwork, insulation, ventilation, guarantees, exclusions and what to ask before accepting.

You are NOT the extension / structural building checker, NOT the boiler / heating checker, NOT the electrical / rewire checker and NOT the bathroom checker. NEVER assess or score foundations, drainage as a groundworks trade, steels, plastering, boilers, Gas Safe, flues, heating systems, consumer units, rewiring, sanitaryware, tiling of bathrooms or any unrelated items. Ignore any such items entirely — this is a roofing quote. Only mention Building Regulations where it relates to roofing (e.g. full roof replacement or insulation upgrade). Refer to the tradesperson as the "roofer", never the "builder" or "installer".

===== FIRST: CONFIRM THIS IS A ROOFING QUOTE =====
Look at the MAIN document. If it is clearly NOT a roofing quote (e.g. it is an extension, boiler, electrical, bathroom, kitchen, driveway or unrelated document), set "is_roofing_quote": false and STOP scoring — return the minimal shape with is_roofing_quote:false and a short note. Otherwise set "is_roofing_quote": true and complete the full analysis.

You are given the main quote first, then any supporting documents (${supportingNames.length ? supportingNames.join(", ") : "none"}).

HOMEOWNER CONTEXT (use ONLY to decide what is relevant — never penalise the quote for omitting something the homeowner does not expect):
${JSON.stringify(ctx, null, 2)}

===== WHAT TO CHECK (roofing only) =====
Quote Basics: roofer/company name, quote date, quote validity, property address, VAT status, total price, whether the price is fixed or estimated.

Roofing Scope: repair vs full re-roof, roof area, which roof/elevation, tile/slate replacement or repair, flat roof works, chimney works, fascia/soffit/gutter/roofline scope, whether existing covering is stripped off or overlaid.

Materials Specification: tile or slate type/brand, felt or breather membrane, battens (spec/treated), dry ridge / dry verge systems if included, flat roof system (felt / EPDM / GRP / single-ply), ridge/hip tiles, fixings, fascias/soffits material (uPVC etc.), guttering spec.

Access / Scaffold / Safety: whether scaffold is included or excluded, tower/ladder access, edge protection, roof access arrangements, safe working, who provides scaffold and for how long.

Roof Details / Leadwork / Junctions: lead flashing, chimney flashing/soakers, valleys, hips, ridges, abutments, junctions, verges, soaker details, replacement of rotten timbers/rafters where found.

Insulation / Ventilation / Building Regulations: insulation included or excluded, roof/eaves ventilation, condensation control, whether Building Regulations apply (full replacement or insulation upgrade) and who notifies.

Waste Removal / Protection: skip/waste removal included, disposal of old covering, protection from weather during works, temporary covering, protection of property/garden/driveway.

Exclusions / Extras / Risk Items: scaffold excluded, rotten timbers excluded, hidden defects, additional leadwork, chimney condition, structural issues, weather delays, access difficulties, extras and variation handling.

Price / VAT / Payment Terms: total price, VAT inclusive/exclusive, deposit, staged payments, balance trigger, variation process.

Timescale / Guarantees / Handover: start date, duration, weather delay assumptions, workmanship guarantee, materials/manufacturer guarantee, insurance-backed guarantee, handover paperwork.

===== SCORE BEHAVIOUR & CALIBRATION =====
Do NOT punish a roofing quote for not including extension, boiler, electrical or bathroom items. Score against the roofing categories ONLY.

Calibrate to these three reference quotes so scoring feels fair to homeowners:

WEAK (target overall 5-20/100): e.g. "Fix roof leak £850." — no scope, no materials, no scaffold, no waste, no VAT, no guarantee. Most categories 0-2.

MEDIUM (target overall 45-65/100): e.g. "Replace rear roof tiles, felt and battens, remove waste, £4,500 plus VAT." Reasonable scope and some materials, so Roofing Scope and Materials Specification should score 5-7 and Waste Removal 6-8. Mark it DOWN — but not to the floor — for missing scaffold detail, leadwork/junctions, ventilation, guarantees, payment terms and timescale: those categories should sit around 2-4, NOT 0-1. The overall average must land near 45-65.

STRONG (target overall 80-90/100): a detailed re-roof quote with tile/slate spec, membrane, battens, dry ridge, scaffold, leadwork, valleys, ventilation, insulation where relevant, waste removal, weather protection, workmanship and materials guarantees, VAT, payment terms and clear exclusions. Only sensible final clarifications remain. Most categories 8-10.

Missing detail should reduce the score, but a quote with clear scope, materials, scaffold and price should always land in at least the moderate band even when guarantees or Building Regulations are not spelled out.

===== MAIN QUOTE vs SUPPORTING DOCUMENTS =====
Distinguish where each fact came from. If info is supplied in a supporting document but NOT the main quote, classify it as "Supplied separately — confirm with roofer". Do NOT mark it as fully confirmed unless it is clearly roofer-issued or accepted. Do NOT treat homeowner-written notes as roofer-confirmed unless clearly stated. Supporting docs may only IMPROVE the pack score, never reduce it. Do not call something "missing" if it appears in a supporting document.

===== TWO SCORES PER CATEGORY (0-10) =====
- "score_main" = based ONLY on the main quote.
- "score_pack" = main quote PLUS supporting documents.
Anchors: 0 = not mentioned; 2 = vaguely mentioned; 4-5 = present but missing confirmation/paperwork, or supplied in a supporting doc only; 7 = mostly clear, minor clarification; 8-10 = clear, specific, decision-ready. "score" should equal score_pack.

CATEGORIES to score:
${CATEGORIES.map((c) => `- ${c.key}: ${c.name}`).join("\n")}

STATUS values per category: "clear" | "supplied_separately" | "needs_clarifying" | "missing" | "not_scored".

WORDING STYLE: practical, calm and homeowner-friendly. Never accuse the roofer. Never sound like legal advice. Use phrases like "Not visible in the quote — confirm if required.", "Worth confirming before accepting.", "Good detail, but ask for written confirmation on…", "Scaffold is often excluded from roofing quotes, but it should be clearly stated.".

Respond with STRICT JSON only (no prose, no markdown fences) in EXACTLY this shape:
{
  "is_roofing_quote": true | false,
  "not_roofing_note": "only if is_roofing_quote is false: a short homeowner-friendly note",
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
    { "item": "<e.g. Tile specification>", "main_quote": "<what the main quote says>", "supporting": "<what the supporting doc supplies>",
      "status": "Supplied separately — confirm with roofer", "note": "short homeowner-friendly guidance" }
  ],
  "not_found": ["... items NOT visible in the main quote OR supporting documents — phrase as 'Not visible in the quote — confirm if required.' ..."],
  "key_risks": ["... the most important things worth confirming before accepting ..."],
  "questions": ["max 10 priority questions to ask the roofer"],
  "suggested_message": "a short, polite, copyable message the homeowner can send the roofer asking only for the most important clarifications based on the actual quote — do not generate a huge list if the quote is already strong",
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
    content.push({ type: "text", text: "===== MAIN ROOFING QUOTE =====" });
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
      console.error("[roofing-quote] parse failed. rawLen=", raw?.length, "head=", (raw || "").slice(0, 400));
      throw new Error("Could not parse the analysis result.");
    }

    // Manual review fallback — wrong document type.
    if (parsed.is_roofing_quote === false) {
      const report_json = {
        version: "roofing-v1",
        generated_at: new Date().toISOString(),
        project_type: projectType ?? null,
        is_roofing_quote: false,
        not_roofing_note:
          parsed.not_roofing_note ||
          "This does not appear to be a roofing quote. Please choose a different quote type or request a manual review.",
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

    // Deterministic roofing verdict wording, banded off the headline (main) score.
    const headline = clarityScore;
    let verdictLevel: "low" | "moderate" | "good" | "strong";
    let verdictLine: string;
    if (headline >= 78) {
      verdictLevel = "strong";
      verdictLine =
        "This is a strong roofing quote with clear scope, materials, access, leadwork and sensible exclusions. A few final confirmation points should be agreed before accepting.";
    } else if (headline >= 45) {
      verdictLevel = headline >= 68 ? "good" : "moderate";
      verdictLine =
        "This quote covers the basics of the roofing work and includes useful scope and materials, but scaffold, leadwork, guarantees and commercial points should be confirmed before accepting.";
    } else {
      verdictLevel = "low";
      verdictLine =
        "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about the scope, materials, scaffold, waste and guarantees.";
    }

    const suppliedSeparately = Array.isArray(parsed.supplied_separately)
      ? parsed.supplied_separately.filter((s: any) => s && (s.item || s.supporting))
      : [];

    const report_json = {
      version: "roofing-v1",
      generated_at: new Date().toISOString(),
      project_type: projectType ?? null,
      is_roofing_quote: true,
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
        const reportUrl = `${base}/roofing-quote-report/${checkId}?t=${encodeURIComponent(lookupToken)}`;
        await supabase.functions.invoke("send-app-email", {
          body: {
            templateName: "quote-health-check-ready",
            recipientEmail: email,
            idempotencyKey: `roofing-quote-ready-${checkId}`,
            templateData: { reportUrl, projectType: projectType ?? "" },
          },
        });
      } catch (mailErr) {
        console.error("[roofing-quote] email send failed", (mailErr as Error).message);
      }
    }
  } catch (err) {
    console.error("analyse-roofing-quote background error:", err);
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
        project_type: typeof projectType === "string" ? projectType : "Roofing",
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
    console.error("analyse-roofing-quote error:", err);
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
