// Records money IN against a wallet stage (admin-only reconciliation).
//
// DECISION PENDING: the homeowner-facing deposit collection rail (Stripe
// Checkout / bank transfer / open banking) has NOT been chosen, so no
// automated money-in path is wired. This function exists so an admin can
// record a confirmed deposit and exercise the drawdown flow end to end.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { z } from 'npm:zod@3.23.8'
import { logDrawdownEvent } from '../_shared/drawdown.ts'

const BodySchema = z.object({
  wallet_stage_id: z.string().uuid(),
  amount_pence: z.number().int().positive().max(100_000_000),
  reference: z.string().max(200).optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const anon = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    const { data: userData } = await anon.auth.getUser(token)
    const user = userData?.user
    if (!user) return json({ error: 'Not authenticated' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    if (!isAdmin) return json({ error: 'Admin only' }, 403)

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
    const input = parsed.data

    const { data: stage } = await admin
      .from('project_wallet_stages').select('*').eq('id', input.wallet_stage_id).maybeSingle()
    if (!stage) return json({ error: 'Wallet stage not found' }, 404)

    const funded = Number(stage.funded_amount_pence) + input.amount_pence
    const nowIso = new Date().toISOString()

    const { data: updated, error } = await admin
      .from('project_wallet_stages')
      .update({
        funded_amount_pence: funded,
        funded_at: stage.funded_at ?? nowIso,
        funding_status: funded >= Number(stage.expected_amount_pence) ? 'funded' : stage.funding_status,
        awaiting_funds: false,
      })
      .eq('id', stage.id)
      .select()
      .maybeSingle()
    if (error) return json({ error: error.message }, 400)

    // Funding the mobilization clears the at-risk flag going forward.
    if (stage.is_mobilization && funded >= Number(stage.expected_amount_pence)) {
      await admin
        .from('project_wallets')
        .update({ start_date_at_risk: false, start_date_at_risk_at: null })
        .eq('id', stage.wallet_id)
    }

    await logDrawdownEvent(admin, {
      walletId: stage.wallet_id,
      eventType: 'stage_funded',
      actorUserId: user.id,
      actorRole: 'admin',
      detail: {
        stage_id: stage.id,
        stage_name: stage.stage_name,
        amount_pence: input.amount_pence,
        reference: input.reference ?? null,
        funded_total_pence: funded,
      },
    })

    return json({ stage: updated })
  } catch (e) {
    console.error('[record-stage-funding]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
