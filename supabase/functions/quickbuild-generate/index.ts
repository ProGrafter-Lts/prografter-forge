// QuickBuild edge function: generates an AI quote draft from voice transcript,
// photos, and structured trade input. Hidden behind the `quickBuild` feature
// flag in the client; this function is safe to deploy because it requires a
// valid auth token and rate-limits per trade.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT = 5;
const RATE_WINDOW_HOURS = 24;

const SYSTEM_PROMPT =
  "You are a UK construction estimator. Generate quotes consistent with UK 2026 trade pricing, UK Building Regulations, and UK trade practices. Be conservative on labour estimates. Flag genuine compliance requirements; do not over-flag.";

const QUOTE_TOOL = {
  type: "function",
  function: {
    name: "emit_quote_draft",
    description:
      "Emit a structured Schedule of Works draft for the trade to review.",
    parameters: {
      type: "object",
      properties: {
        line_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              description: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
              estimated_unit_price: { type: "number" },
              labour_or_materials: {
                type: "string",
                enum: ["labour", "materials"],
              },
            },
            required: [
              "category",
              "description",
              "quantity",
              "unit",
              "estimated_unit_price",
              "labour_or_materials",
            ],
            additionalProperties: false,
          },
        },
        methodology: { type: "string" },
        timeline_days: { type: "integer" },
        risk_flags: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "planning_permission_likely",
              "building_control_required",
              "part_p_notification_required",
              "gas_safe_required",
              "scaffold_needed",
              "asbestos_consideration",
              "listed_building_consent",
              "specialist_contractor_required",
              "neighbour_party_wall_notice",
              "lead_paint_risk",
            ],
          },
        },
        variation_buffer_recommended_pence: { type: "integer" },
        confidence_score: { type: "integer", minimum: 0, maximum: 100 },
        notes_to_trade: { type: "string" },
      },
      required: [
        "line_items",
        "methodology",
        "timeline_days",
        "risk_flags",
        "variation_buffer_recommended_pence",
        "confidence_score",
        "notes_to_trade",
      ],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceRole);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "unauthorized" }, 401);
    }
    const userId = userData.user.id;

    if (!lovableKey) {
      return json({ error: "ai_unavailable", code: "no_key" }, 503);
    }

    const body = await req.json().catch(() => ({}));
    const transcript = String(body.transcript ?? "").slice(0, 8000);
    const photoPaths: string[] = Array.isArray(body.photo_paths)
      ? body.photo_paths.slice(0, 8).map((p: unknown) => String(p))
      : [];
    const photoCaptions: string[] = Array.isArray(body.photo_captions)
      ? body.photo_captions.map((c: unknown) => String(c).slice(0, 200))
      : [];
    const structured = (body.structured_input ?? {}) as Record<string, unknown>;

    if (!transcript.trim() && photoPaths.length === 0) {
      return json(
        { error: "validation", message: "Provide a transcript or at least one photo." },
        400,
      );
    }

    // Rate limit: count rows in last 24h
    const since = new Date(
      Date.now() - RATE_WINDOW_HOURS * 60 * 60 * 1000,
    ).toISOString();
    const { count, error: countErr } = await admin
      .from("quickbuild_generations")
      .select("id", { count: "exact", head: true })
      .eq("trade_user_id", userId)
      .gte("created_at", since);
    if (countErr) {
      console.error("rate-limit count error", countErr);
      return json({ error: "internal" }, 500);
    }
    const used = count ?? 0;
    if (used >= RATE_LIMIT) {
      return json(
        {
          error: "rate_limited",
          message: `You have reached the daily QuickBuild limit (${RATE_LIMIT} per 24h). Try again later.`,
          remaining: 0,
        },
        429,
      );
    }
    const remainingAfter = Math.max(0, RATE_LIMIT - used - 1);

    // Sign photo URLs (1 hour) so the model can fetch them
    const signedPhotos: { url: string; caption?: string }[] = [];
    for (let i = 0; i < photoPaths.length; i++) {
      const path = photoPaths[i];
      const { data: signed, error: signErr } = await admin.storage
        .from("quickbuild-photos")
        .createSignedUrl(path, 60 * 60);
      if (!signErr && signed?.signedUrl) {
        signedPhotos.push({ url: signed.signedUrl, caption: photoCaptions[i] });
      }
    }

    // Build user content (multimodal: text + images)
    const userContent: Array<Record<string, unknown>> = [];
    const userText = [
      "Please draft a Schedule of Works.",
      "",
      "STRUCTURED INPUT:",
      JSON.stringify(structured, null, 2),
      "",
      "TRADE'S VOICE TRANSCRIPT:",
      transcript || "(none)",
      "",
      signedPhotos.length
        ? "Photographs of the site are attached. Use them to inform the estimate."
        : "No photographs were provided.",
      "",
      "Return your output via the emit_quote_draft tool only.",
    ].join("\n");
    userContent.push({ type: "text", text: userText });
    for (const p of signedPhotos) {
      userContent.push({ type: "image_url", image_url: { url: p.url } });
      if (p.caption) {
        userContent.push({ type: "text", text: `Photo caption: ${p.caption}` });
      }
    }

    // Call Lovable AI Gateway
    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          tools: [QUOTE_TOOL],
          tool_choice: {
            type: "function",
            function: { name: "emit_quote_draft" },
          },
        }),
      },
    );

    if (aiResp.status === 429) {
      return json(
        { error: "ai_rate_limited", message: "AI provider rate limit hit. Try again shortly." },
        429,
      );
    }
    if (aiResp.status === 402) {
      return json(
        { error: "ai_payment_required", message: "AI credits exhausted. Please top up workspace usage." },
        402,
      );
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return json({ error: "ai_error", message: "QuickBuild had trouble — try with more detail in the description." }, 502);
    }

    const aiJson = await aiResp.json();
    const toolCall =
      aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!toolCall) {
      return json(
        { error: "invalid_ai_output", message: "QuickBuild had trouble — try with more detail in the description." },
        502,
      );
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(toolCall);
    } catch {
      return json(
        { error: "invalid_ai_output", message: "QuickBuild had trouble — try with more detail in the description." },
        502,
      );
    }

    // Persist
    const { data: row, error: insertErr } = await admin
      .from("quickbuild_generations")
      .insert({
        trade_user_id: userId,
        transcript,
        photo_paths: photoPaths,
        structured_input: structured,
        ai_output: parsed,
      })
      .select("id")
      .single();
    if (insertErr) {
      console.error("insert error", insertErr);
      return json({ error: "internal" }, 500);
    }

    return json({
      generation_id: row.id,
      output: parsed,
      remaining: remainingAfter,
    });
  } catch (e) {
    console.error("quickbuild-generate fatal", e);
    return json({ error: "internal" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
