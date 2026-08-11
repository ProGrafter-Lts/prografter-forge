// Creates a Stripe Checkout Session for a modular Quote Checker purchase.
// Stores the uploaded quote + intake in `pending_module_checks` keyed by the
// Stripe session id; after payment the success page (via run-paid-module-check)
// or the Stripe webhook consumes it and runs the module's analyse function.

import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded live price IDs as fallback (already used in create-quote-checkout).
// Env vars override these when set: STRIPE_PRICE_SINGLE_TRADE / _STANDARD_TRADE / _EXTENSION.
const FALLBACK_PRICES = {
  single_trade: "price_1TssGYL4yG1Y84vbuBugCi1W", // £19
  standard_trade: "price_1TssHJL4yG1Y84vbzGT7yLTB", // £39
  extension: "price_1TssGxL4yG1Y84vbOUNxKOsF", // £59
} as const;

type PriceBand = keyof typeof FALLBACK_PRICES;

const MODULE_PRICE_BAND: Record<string, PriceBand> = {
  boiler_heating: "single_trade",
  windows_doors: "single_trade",
  plastering_rendering: "single_trade",
  electrical_rewire: "standard_trade",
  bathroom: "standard_trade",
  kitchen: "standard_trade",
  roofing: "standard_trade",
  landscaping_driveway: "standard_trade",
  extension_building: "extension",
};

// RETIRED 2026-08-11: legacy V1 single-pass analysers, not on the Pass 0/1/2
// fixed-standard pipeline. Off sale until rebuilt on the V2 standard. This is
// the server-side block — the UI also hides them, but this stops any direct
// API call from creating a paid session.
const RETIRED_MODULES = new Set([
  // Kitchen: V2 gate cleared but NOT signed off — strong fixture flips
  // appliances.integrated_vs_freestanding (3/5 present, 2/5 ambiguous).
  // Off sale until the clause is tightened and the gate re-run.
  "kitchen",
  "roofing",
  "windows_doors",
  "plastering_rendering",
]);

const PRICE_BAND_AMOUNT: Record<PriceBand, number> = {
  single_trade: 1900,
  standard_trade: 3900,
  extension: 5900,
};

function priceIdForBand(band: PriceBand): string {
  const envKey =
    band === "single_trade" ? "STRIPE_PRICE_SINGLE_TRADE" :
    band === "standard_trade" ? "STRIPE_PRICE_STANDARD_TRADE" :
    "STRIPE_PRICE_EXTENSION";
  return Deno.env.get(envKey) || FALLBACK_PRICES[band];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { moduleId, email, projectType, intake, pdfPath, supportingFiles, userId } = body as {
      moduleId?: unknown;
      email?: unknown;
      projectType?: unknown;
      intake?: unknown;
      pdfPath?: unknown;
      supportingFiles?: unknown;
      userId?: unknown;
    };

    if (typeof moduleId !== "string" || !MODULE_PRICE_BAND[moduleId]) {
      return new Response(JSON.stringify({ error: "Unknown module" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (RETIRED_MODULES.has(moduleId)) {
      return new Response(JSON.stringify({
        error: "This quote checker is temporarily unavailable while we rebuild it. Please request a manual ProGrafter review.",
        retired: true,
      }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof pdfPath !== "string" || !pdfPath) {
      return new Response(JSON.stringify({ error: "Uploaded quote required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const band = MODULE_PRICE_BAND[moduleId];
    const amount = PRICE_BAND_AMOUNT[band];
    const priceId = priceIdForBand(band);

    // Insert pending row first so we have an id for client_reference_id.
    const { data: pending, error: pendingErr } = await supabase
      .from("pending_module_checks")
      .insert({
        module_id: moduleId,
        email: (email as string).trim().toLowerCase(),
        user_id: (typeof userId === "string" && userId) ? userId : null,
        intake: (intake && typeof intake === "object") ? intake : {},
        pdf_path: pdfPath,
        supporting_files: Array.isArray(supportingFiles) ? supportingFiles : [],
        project_type: typeof projectType === "string" ? projectType : null,
        price_band: band,
        amount_due: amount,
        currency: "gbp",
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (pendingErr || !pending) throw pendingErr ?? new Error("Failed to create pending record");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://prografter.co.uk";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: (email as string).trim().toLowerCase(),
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: pending.id,
      success_url: `${origin}/quote-checker/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/quote-checker/cancel?pending_id=${pending.id}`,
      metadata: {
        pending_id: pending.id,
        module_id: moduleId,
        price_band: band,
        user_id: (typeof userId === "string" && userId) ? userId : "",
      },
    });

    await supabase
      .from("pending_module_checks")
      .update({ stripe_session_id: session.id })
      .eq("id", pending.id);

    return new Response(JSON.stringify({ url: session.url, pending_id: pending.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-module-quote-checkout error:", err);
    return new Response(JSON.stringify({ error: "Payment session could not be created." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
