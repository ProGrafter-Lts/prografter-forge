// Stripe webhook (checkout.session.completed) — belt-and-braces confirmation
// that the pending module check has been paid. Also idempotently kicks off
// analysis in case the user never returns to /quote-checker/success.
//
// Verifies the signature using STRIPE_WEBHOOK_SECRET.

import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

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
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Stripe not configured", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("stripe-module-webhook: signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ignored", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const pendingId = (session.client_reference_id || session.metadata?.pending_id) as string | null;
  if (!pendingId) return new Response("no pending id", { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: pending } = await supabase
    .from("pending_module_checks")
    .select("*")
    .eq("id", pendingId)
    .single();
  if (!pending) return new Response("pending not found", { status: 200 });

  await supabase
    .from("pending_module_checks")
    .update({
      payment_status: "paid",
      stripe_payment_intent_id: (session.payment_intent as string) ?? null,
      amount_paid: session.amount_total ?? null,
      currency: session.currency ?? "gbp",
      paid_at: pending.paid_at ?? new Date().toISOString(),
    })
    .eq("id", pendingId);

  // If the success page hasn't already run analysis, run it here.
  if (!pending.analysed_check_id) {
    const fnName = MODULE_ANALYSE_FN[pending.module_id];
    if (fnName) {
      try {
        const { data: analysed } = await supabase.functions.invoke(fnName, {
          body: {
            email: pending.email,
            projectType: pending.project_type || pending.module_id,
            intake: pending.intake,
            pdfPath: pending.pdf_path,
            supportingFiles: pending.supporting_files || [],
            userId: pending.user_id,
          },
        });
        if (analysed?.id) {
          await supabase
            .from("pending_module_checks")
            .update({ analysed_check_id: analysed.id, analysed_at: new Date().toISOString() })
            .eq("id", pendingId);
        }
      } catch (err) {
        console.error("stripe-module-webhook: analyse invoke failed", err);
      }
    }
  }

  return new Response("ok", { status: 200 });
});
