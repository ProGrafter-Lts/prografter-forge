import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_ID = "price_1TZBDKL4yG1Y84vbBzZwhKBH";

// Strict-enough email regex (RFC 5322 lite) with TLD requirement
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Common disposable / throwaway email providers. Not exhaustive, but catches
// the obvious abuse vectors.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info", "guerrillamail.biz",
  "guerrillamail.de", "guerrillamail.net", "guerrillamail.org", "sharklasers.com",
  "10minutemail.com", "10minutemail.net", "20minutemail.com", "30minutemail.com",
  "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmailo.com", "tmpmail.org",
  "tmpmail.net", "throwawaymail.com", "throwaway.email", "trashmail.com",
  "trashmail.de", "trashmail.net", "yopmail.com", "yopmail.net", "yopmail.fr",
  "fakeinbox.com", "fakemailgenerator.com", "maildrop.cc", "getnada.com",
  "nada.email", "dispostable.com", "mintemail.com", "mailnesia.com",
  "spamgourmet.com", "spam4.me", "anonbox.net", "mohmal.com", "mailcatch.com",
  "emailondeck.com", "moakt.com", "spamex.com", "mytemp.email", "discard.email",
  "harakirimail.com", "burnermail.io", "tempinbox.com", "tempr.email",
  "tempail.com", "instantemailaddress.com", "spambox.us", "mailforspam.com",
  "spamdecoy.net", "spambog.com", "spambog.de", "spambog.ru",
]);

function isValidEmail(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return false;
  if (!EMAIL_RE.test(email)) return false;
  const domain = email.split("@")[1];
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) return false;
  return true;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { quoteCheckId, email, website } = body as {
      quoteCheckId?: unknown;
      email?: unknown;
      website?: unknown;
    };

    // Honeypot: legitimate users won't fill the hidden "website" field.
    // Reject silently-but-distinctly so bots don't learn the trap.
    if (typeof website === "string" && website.trim().length > 0) {
      console.warn("create-quote-checkout: honeypot triggered");
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      typeof quoteCheckId !== "string" ||
      !UUID_RE.test(quoteCheckId)
    ) {
      return new Response(JSON.stringify({ error: "Invalid quoteCheckId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid, non-disposable email address." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const origin = req.headers.get("origin") || "https://graft-craft-co.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer_email: (email as string).trim().toLowerCase(),
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/quote-checker-classic?session_id={CHECKOUT_SESSION_ID}&quote_id=${quoteCheckId}`,
      cancel_url: `${origin}/quote-checker-classic?cancelled=true`,
      metadata: { quoteCheckId },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-quote-checkout error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
