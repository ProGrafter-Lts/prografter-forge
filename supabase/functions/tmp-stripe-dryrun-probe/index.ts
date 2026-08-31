// TEMPORARY diagnostic for the mobilization drawdown dry run.
// Verifies which Stripe account the project's STRIPE_SECRET_KEY belongs to,
// whether Connect is enabled, and whether a given connected account is visible.
// Delete after the dry run.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import Stripe from 'https://esm.sh/stripe@18.5.0'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const key = Deno.env.get('STRIPE_SECRET_KEY') || ''
  const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' })

  const out: Record<string, unknown> = {
    key_mode: key.startsWith('sk_test') ? 'test' : key.startsWith('sk_live') ? 'live' : 'unknown',
  }

  try {
    const acct = await stripe.accounts.retrieve()
    out.platform_account_id = acct.id
    out.charges_enabled = acct.charges_enabled
  } catch (e) {
    out.platform_error = e instanceof Error ? e.message : String(e)
  }

  const target = new URL(req.url).searchParams.get('account')
  if (target) {
    try {
      const a = await stripe.accounts.retrieve(target)
      out.target_account = {
        id: a.id,
        charges_enabled: a.charges_enabled,
        payouts_enabled: a.payouts_enabled,
        capabilities: a.capabilities,
      }
    } catch (e) {
      out.target_account_error = e instanceof Error ? e.message : String(e)
    }
  }

  try {
    const bal = await stripe.balance.retrieve()
    out.balance = bal.available
  } catch (e) {
    out.balance_error = e instanceof Error ? e.message : String(e)
  }

  return json(out)
})
