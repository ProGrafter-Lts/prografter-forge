// Called by /quote-checker/success. Verifies the Stripe session is paid,
// then dispatches to the correct analyse-* function using the intake stored
// in `pending_module_checks`. Idempotent: repeat calls return the same
// analysed check id + lookup token.

import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODULE_ANALYSE_FN: Record<string, string> = {
  extension_building: "analyse-simple-quote",
  boiler_heating: "analyse-boiler-quote",
  electrical_rewire: "analyse-electrical-quote",
  bathroom: "analyse-bathroom-quote",
  roofing: "analyse-roofing-quote",
  kitchen: "analyse-kitchen-quote",
  windows_doors: "analyse-windows-doors-quote",
  landscaping_driveway: "analyse-landscaping-quote",
  plastering_rendering: "analyse-plastering-quote",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId } = await req.json().catch(() => ({}));
    if (typeof sessionId !== "string" || !sessionId) {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed", paid: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pendingId = (session.client_reference_id || session.metadata?.pending_id) as string | null;
    if (!pendingId) throw new Error("Session missing pending reference");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pending, error: pErr } = await supabase
      .from("pending_module_checks")
      .select("*")
      .eq("id", pendingId)
      .single();
    if (pErr || !pending) throw pErr ?? new Error("Pending record not found");

    // If already analysed, return the same report reference.
    if (pending.analysed_check_id) {
      return new Response(JSON.stringify({
        paid: true,
        module_id: pending.module_id,
        id: pending.analysed_check_id,
        lookupToken: pending.lookup_token ?? null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark paid (webhook may also do this — both are safe).
    await supabase
      .from("pending_module_checks")
      .update({
        payment_status: "paid",
        stripe_payment_intent_id: (session.payment_intent as string) ?? null,
        amount_paid: session.amount_total ?? null,
        currency: session.currency ?? "gbp",
        paid_at: new Date().toISOString(),
      })
      .eq("id", pendingId);

    const fnName = MODULE_ANALYSE_FN[pending.module_id];
    if (!fnName) throw new Error(`No analyse function for module ${pending.module_id}`);

    const { data: analysed, error: aErr } = await supabase.functions.invoke(fnName, {
      body: {
        email: pending.email,
        projectType: pending.project_type || pending.module_id,
        intake: pending.intake,
        pdfPath: pending.pdf_path,
        supportingFiles: pending.supporting_files || [],
        userId: pending.user_id,
      },
    });
    if (aErr) throw aErr;
    if (!analysed?.id) throw new Error("Analyse function returned no id");

    let lookupToken: string | null = analysed.lookupToken ?? null;
    if (!lookupToken) {
      const { data: row } = await supabase
        .from("simple_quote_checks")
        .select("lookup_token")
        .eq("id", analysed.id)
        .maybeSingle();
      lookupToken = row?.lookup_token ?? null;
    }

    await supabase
      .from("pending_module_checks")
      .update({
        analysed_check_id: analysed.id,
        analysed_at: new Date().toISOString(),
        lookup_token: lookupToken,
      })
      .eq("id", pendingId);


    return new Response(JSON.stringify({
      paid: true,
      module_id: pending.module_id,
      id: analysed.id,
      lookupToken: analysed.lookupToken ?? null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("run-paid-module-check error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
