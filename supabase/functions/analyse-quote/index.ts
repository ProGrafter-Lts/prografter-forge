import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const CHECKLIST_PROMPT = `You are ProGrafter's Quote Checker AI. A homeowner has uploaded a construction quote PDF and provided the following details:

Project type: [PROJECT_TYPE]
Postcode: [POSTCODE]
What they asked to be quoted for: [HOMEOWNER_DESCRIPTION]

Analyse the quote against the following checklist for a [PROJECT_TYPE].
For each item, state whether it is: PRESENT (clearly included), MISSING (not mentioned), VAGUE (mentioned but with insufficient detail or unrealistic allowance), or NOT APPLICABLE (for this project type).

For every MISSING or VAGUE item provide:
- A plain English explanation of why it matters
- A realistic UK cost range for that item in the [POSTCODE] region based on current 2024-2025 UK construction market rates. Use your knowledge of BCIS, Spon's, and current trade pricing. Be specific — not generic ranges.
- A specific question the homeowner should ask the trade

IMPORTANT — COST ACCURACY:
- All cost estimates MUST reflect current UK construction market rates for the [POSTCODE] region.
- Factor in regional variation — London and the South East are typically 15-30% above national average.
- Use your knowledge of real trade day rates, material costs, and labour norms.
- If you are uncertain about a specific cost, state that clearly rather than guessing.
- Never quote unrealistically low figures that would undercut legitimate tradespeople.

Checklist:
PRELIMINARIES (6 items)
1. Site set-up costs included
2. Welfare facilities (toilet, welfare cabin if needed)
3. Scaffolding — specified and priced
4. Skip hire — number and size stated
5. Protection of existing building during works
6. Contractor's insurance during works confirmed

GROUNDWORKS (7 items)
7. Excavation — depth and volume stated
8. Disposal of spoil — included and priced
9. Foundation type specified (strip, raft, pile)
10. Foundation depth stated
11. Concrete specification stated
12. Drainage — existing drainage surveyed and new drainage designed
13. Damp proof membrane and radon barrier if required

STRUCTURE (6 items)
14. External wall specification — masonry type, insulation, wall ties
15. Structural steel — beams, padstones, engineer's calculations included
16. Internal walls specified
17. Openings in existing structure addressed
18. Lintels — type and specification stated
19. Party wall agreement — mentioned if applicable

ROOF (8 items)
20. Roof structure specified — rafters, joists, ridge, hips
21. Insulation type and thickness stated
22. U-value achieved vs Part L requirement confirmed
23. Breathable membrane/felt included
24. Battens included
25. Tile or slate specification stated
26. Flashings included
27. Guttering and downpipes included

WINDOWS AND DOORS (3 items)
28. Frame specification stated — UPVC, aluminium, or timber
29. Glazing U-value stated and Part L compliant
30. FENSA or CERTASS certification included

COMPLIANCE (4 items)
31. Building Control application fee included
32. Building Control inspection fees included
33. Structural engineer fees included
34. Planning conditions compliance addressed

SERVICES (3 items)
35. Electrical first and second fix included or excluded — clearly stated
36. Plumbing and heating extension — included or excluded — clearly stated
37. Ventilation — Part F compliance addressed

CONTRACT TERMS (6 items)
38. VAT status clearly stated — included, excluded, or not applicable
39. Payment schedule structured to protect homeowner — not front-loaded
40. Variation process — how changes are agreed and priced
41. Defects liability period stated
42. Dispute resolution process stated
43. Retention arrangement — if applicable

At the end provide:
1. An overall completeness score out of 100
2. An estimated true cost range accounting for all missing/vague items — clearly state this is an indicative range based on typical UK market rates and should not be treated as a formal quotation
3. A plain English executive summary (max 150 words)
4. Five specific questions to ask the trade before accepting

Write in plain English. No jargon. Be direct but not alarmist.
The homeowner may have an excellent trade who simply submitted an incomplete document — the tone should be helpful, not accusatory.
Format the output as structured HTML for email delivery. Use clean, inline-styled HTML that renders well in email clients. Use a professional colour scheme with #1B3A4B (navy) headers and #0D9488 (teal) accents.`;

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

    // Download the PDF from storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("quote-pdfs")
      .download(record.pdf_url);

    if (downloadError || !pdfData) {
      throw new Error("Failed to download PDF: " + downloadError?.message);
    }

    // Convert PDF to base64
    const pdfBytes = await pdfData.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

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
    const reportHtml = aiResult.content?.[0]?.text || "Analysis failed.";

    // Update the record with the report
    await supabase
      .from("quote_checks")
      .update({ report_html: reportHtml, status: "complete" })
      .eq("id", quoteCheckId);

    return new Response(JSON.stringify({ success: true, reportHtml }), {
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

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
