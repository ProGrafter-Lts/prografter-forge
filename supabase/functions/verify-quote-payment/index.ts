import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, quoteCheckId } = await req.json();
    if (!sessionId || !quoteCheckId) {
      return new Response(JSON.stringify({ error: "sessionId and quoteCheckId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed", paid: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the session is for this quote check
    if (session.metadata?.quoteCheckId !== quoteCheckId) {
      return new Response(JSON.stringify({ error: "Payment session mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read the CURRENT state first. Updating the row before checking would
    // always report status "analysing" (Postgres returns the post-update row),
    // so the already-complete guard could never fire and a refresh of the
    // Stripe return URL would wipe a finished report and re-run analysis.
    const { data: existing } = await supabase
      .from("quote_checks")
      .select("lookup_token, email, status, report_json")
      .eq("id", quoteCheckId)
      .single();

    const alreadyComplete = existing?.status === "complete" && existing?.report_json != null;

    if (alreadyComplete) {
      // Record the payment id but do NOT reset status or re-trigger analysis.
      await supabase
        .from("quote_checks")
        .update({ stripe_payment_id: session.payment_intent as string })
        .eq("id", quoteCheckId);

      return new Response(
        JSON.stringify({
          paid: true,
          analysisStarted: false,
          alreadyComplete: true,
          lookupToken: existing?.lookup_token ?? null,
          email: existing?.email ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Not complete yet — move to "analysing" and record the payment id.
    const { data: updated } = await supabase
      .from("quote_checks")
      .update({ stripe_payment_id: session.payment_intent as string, status: "analysing" })
      .eq("id", quoteCheckId)
      .select("lookup_token, email")
      .single();


    // Kick off the analysis WITHOUT blocking the response. Analysis can take
    // 1–3 minutes; awaiting it here caused the client invoke to time out, so
    // the browser never redirected to the report even though the report was
    // generated successfully in the background. We now return immediately and
    // let the report page poll for completion. EdgeRuntime.waitUntil keeps the
    // worker alive until the fire-and-forget analysis finishes.
    const analysisPromise = supabase.functions
      .invoke("analyse-quote", { body: { quoteCheckId } })
      .then((res) => {
        if (res.error) {
          console.error("verify-quote-payment: analyse-quote invoke error", quoteCheckId, res.error);
        }
      })
      .catch((e) => {
        console.error("verify-quote-payment: analyse-quote threw", quoteCheckId, e);
      });
    try {
      // @ts-ignore EdgeRuntime is available in the Supabase edge runtime.
      EdgeRuntime.waitUntil(analysisPromise);
    } catch {
      // If waitUntil is unavailable, fall back to best-effort (do not await).
    }

    return new Response(
      JSON.stringify({
        paid: true,
        analysisStarted: true,
        alreadyComplete: false,
        lookupToken: updated?.lookup_token ?? null,
        email: updated?.email ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("verify-quote-payment error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
