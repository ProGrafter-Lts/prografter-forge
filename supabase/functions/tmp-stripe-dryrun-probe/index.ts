// TEMPORARY harness for the mobilization drawdown / escrow dry run.
// Delete after the dry run.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import Stripe from 'https://esm.sh/stripe@18.5.0'

const USERS = [
  { id: '78be78e5-07b4-4ad0-8bc9-0dc684c9740c', role: 'homeowner' },
  { id: 'c4e2ccb1-0e63-473d-8ed1-d5dcb08e62dc', role: 'trade' },
  { id: '1c2d92b0-a9a3-4f99-9d19-54dfff94f365', role: 'admin' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const url = new URL(req.url)
  const password = url.searchParams.get('pw') ?? ''
  if (password.length < 16) return json({ error: 'pw required' }, 400)

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2025-08-27.basil',
  })

  const topup = Number(url.searchParams.get('topup_pence') ?? '0')
  if (topup > 0) {
    const charge = await stripe.charges.create({
      amount: topup,
      currency: 'gbp',
      source: 'tok_bypassPending',
      description: 'Dry run available-balance top-up',
    })
    const balance = await stripe.balance.retrieve()
    return json({ charge_id: charge.id, status: charge.status, balance: balance.available })
  }

  if (url.searchParams.get('balance')) {
    const balance = await stripe.balance.retrieve()
    return json({ available: balance.available, pending: balance.pending })
  }

  const out: Record<string, unknown> = {}
  for (const u of USERS) {
    const { data, error } = await admin.auth.admin.updateUserById(u.id, {
      password,
      email_confirm: true,
    })
    out[u.role] = error ? { error: error.message } : { id: data.user?.id, ok: true }
  }
  return json(out)
})
