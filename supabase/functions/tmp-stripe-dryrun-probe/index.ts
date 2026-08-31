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

  if (new URL(req.url).searchParams.get('create') === '1') {
    const payload = {
      contact_email: 'dryrun-trade@prografter.co.uk',
      display_name: 'ProGrafter Dry Run Trade',
      dashboard: 'express',
      identity: {
        country: 'gb',
        entity_type: 'individual',
        individual: {
          given_name: 'Dry',
          surname: 'Run',
          email: 'dryrun-trade@prografter.co.uk',
          date_of_birth: { day: 1, month: 1, year: 1980 },
          address: { line1: '10 Downing Street', city: 'London', postal_code: 'SW1A 2AA', country: 'GB' },
          phone: '+447000000000',
        },
      },
      configuration: {
        recipient: {
          capabilities: { stripe_balance: { stripe_transfers: { requested: true } } },
        },
      },
      defaults: {
        currency: 'gbp',
        responsibilities: { fees_collector: 'application', losses_collector: 'application' },
      },
      include: ['configuration.recipient', 'identity', 'requirements'],
    }
    const res = await fetch('https://api.stripe.com/v2/core/accounts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Stripe-Version': '2026-06-24.preview',
      },
      body: JSON.stringify(payload),
    })
    out.create_status = res.status
    out.create_body = await res.json().catch(() => null)
  }

  return json(out)
})
