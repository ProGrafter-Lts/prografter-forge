import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all active subscriptions
    const { data: subs, error: subErr } = await supabase
      .from("planning_alert_subs")
      .select("*, trades(name, postcode, trade_type)")
      .eq("active", true);

    if (subErr) throw subErr;

    console.log(`[PLANNING-ALERTS] Processing ${subs?.length ?? 0} active subscriptions`);

    // In production, this would call the PlanIt API for each subscription's
    // postcode + radius and insert matched alerts. For now, log the intent.
    for (const sub of subs ?? []) {
      console.log(
        `[PLANNING-ALERTS] Would fetch alerts for trade ${sub.trade_id}, ` +
        `tier=${sub.tier}, radius=${sub.radius_miles}mi`
      );
    }

    return new Response(
      JSON.stringify({ processed: subs?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[PLANNING-ALERTS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
