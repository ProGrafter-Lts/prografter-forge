// Admin-only: resolve an inspection dispute and unfreeze the project.
// Unfreezing is always a deliberate human act — nothing times out.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { z } from 'npm:zod@3.23.8'
import { logDrawdownEvent } from '../_shared/drawdown.ts'

const BodySchema = z.object({
  dispute_id: z.string().uuid(),
  outcome: z.enum(['resolved', 'rejected']),
  resolution_note: z.string().max(2000).optional(),
  // Leave the project frozen even after closing the dispute if needed.
  unfreeze: z.boolean().default(true),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

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

    const { data: dispute } = await admin
      .from('inspection_disputes').select('*').eq('id', input.dispute_id).maybeSingle()
    if (!dispute) return json({ error: 'Dispute not found' }, 404)

    const nowIso = new Date().toISOString()
    const { data: updated } = await admin
      .from('inspection_disputes')
      .update({
        status: input.outcome,
        resolved_by: user.id,
        resolved_at: nowIso,
        resolution_note: input.resolution_note ?? null,
      })
      .eq('id', dispute.id)
      .select()
      .maybeSingle()

    // A rejected dispute restores the report; a resolved one leaves it
    // superseded so a follow-up report drives the next decision.
    await admin
      .from('stage_inspection_reports')
      .update({ status: input.outcome === 'rejected' ? 'active' : 'superseded' })
      .eq('id', dispute.inspection_report_id)

    let unfrozen = false
    if (input.unfreeze && dispute.wallet_id) {
      const { count } = await admin
        .from('inspection_disputes')
        .select('id', { count: 'exact', head: true })
        .eq('wallet_id', dispute.wallet_id)
        .eq('status', 'open')
      if (!count) {
        await admin
          .from('project_wallets')
          .update({ frozen: false, frozen_at: null, frozen_reason: null, frozen_by_dispute_id: null })
          .eq('id', dispute.wallet_id)
        unfrozen = true
      }
    }

    await logDrawdownEvent(admin, {
      walletId: dispute.wallet_id,
      eventType: unfrozen ? 'project_unfrozen' : 'inspection_dispute_closed',
      actorUserId: user.id,
      actorRole: 'admin',
      detail: {
        dispute_id: dispute.id,
        outcome: input.outcome,
        resolution_note: input.resolution_note ?? null,
        still_frozen: !unfrozen,
      },
    })

    return json({ dispute: updated, unfrozen })
  } catch (e) {
    console.error('[resolve-inspection-dispute]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
