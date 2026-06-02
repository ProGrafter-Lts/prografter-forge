import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Redeem a homeowner's free Quote Check entitlement instead of paying via Stripe.
// Verifies the signed-in user owns an unconsumed entitlement, consumes it,
// marks the quote check as covered, and kicks off the analysis.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { quoteCheckId } = await req.json();
    if (!quoteCheckId) {
      return new Response(JSON.stringify({ error: "quoteCheckId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authenticate the caller
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find an unconsumed entitlement (atomic-ish: re-check before consuming)
    const { data: ent } = await supabase
      .from("quote_check_entitlements")
      .select("id")
      .eq("user_id", userId)
      .is("consumed_at", null)
      .limit(1)
      .maybeSingle();

    if (!ent) {
      return new Response(JSON.stringify({ error: "No free quote check available", redeemed: false }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Consume the entitlement, guarding against double-spend via the consumed_at filter
    const { data: consumed, error: consumeErr } = await supabase
      .from("quote_check_entitlements")
      .update({ consumed_at: new Date().toISOString(), quote_check_id: quoteCheckId })
      .eq("id", ent.id)
      .is("consumed_at", null)
      .select("id")
      .maybeSingle();

    if (consumeErr || !consumed) {
      return new Response(JSON.stringify({ error: "Could not redeem entitlement", redeemed: false }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark the quote check as covered and trigger analysis
    await supabase
      .from("quote_checks")
      .update({ stripe_payment_id: "free_entitlement" })
      .eq("id", quoteCheckId);

    await supabase.functions.invoke("analyse-quote", { body: { quoteCheckId } });

    return new Response(JSON.stringify({ redeemed: true, paid: true, analysisStarted: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("redeem-quote-check-entitlement error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
