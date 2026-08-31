// Creates (or refreshes) a project wallet from the agreed payment schedule.
// Self-contained to the Mobilization Drawdown flow — does not alter existing
// payment/commission logic; it only mirrors project_stages amounts as
// "expected" wallet stages.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import {
  MOBILIZATION_TARGET_DAYS_BEFORE_START,
  MOBILIZATION_DEADLINE_DAYS_BEFORE_START,
  shiftDays,
  toPence,
  logDrawdownEvent,
} from '../_shared/drawdown.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const anon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )
    const { data: userData } = await anon.auth.getUser(token)
    const user = userData?.user
    if (!user) return json({ error: 'Not authenticated' }, 401)

    const body = await req.json().catch(() => ({}))
    const jobId: string | undefined = body.job_id
    const bookedStartDate: string | undefined = body.booked_start_date
    if (!jobId) return json({ error: 'job_id is required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: contract } = await admin
      .from('contracts')
      .select('id, job_id, homeowner_id, trade_id, estimated_start_date')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!contract) return json({ error: 'No contract found for this project' }, 404)

    // Only the two parties may initialise the wallet.
    const [{ data: ho }, { data: tr }] = await Promise.all([
      admin.from('homeowners').select('id').eq('id', contract.homeowner_id).eq('user_id', user.id).maybeSingle(),
      admin.from('trades').select('id').eq('id', contract.trade_id).eq('user_id', user.id).maybeSingle(),
    ])
    if (!ho && !tr) return json({ error: 'Not a party to this project' }, 403)

    const start = bookedStartDate || contract.estimated_start_date || null

    const { data: existing } = await admin
      .from('project_wallets').select('*').eq('job_id', jobId).maybeSingle()

    let wallet = existing
    if (!wallet) {
      const { data: created, error } = await admin
        .from('project_wallets')
        .insert({
          job_id: jobId,
          contract_id: contract.id,
          homeowner_id: contract.homeowner_id,
          trade_id: contract.trade_id,
          booked_start_date: start,
          mobilization_target_request_date: start ? shiftDays(start, -MOBILIZATION_TARGET_DAYS_BEFORE_START) : null,
          mobilization_hard_deadline: start ? shiftDays(start, -MOBILIZATION_DEADLINE_DAYS_BEFORE_START) : null,
        })
        .select()
        .single()
      if (error) return json({ error: error.message }, 400)
      wallet = created
      await logDrawdownEvent(admin, {
        walletId: wallet.id,
        eventType: 'wallet_created',
        actorUserId: user.id,
        actorRole: ho ? 'homeowner' : 'trade',
        detail: { booked_start_date: start },
      })
    } else if (start && start !== wallet.booked_start_date) {
      const { data: updated } = await admin
        .from('project_wallets')
        .update({
          booked_start_date: start,
          mobilization_target_request_date: shiftDays(start, -MOBILIZATION_TARGET_DAYS_BEFORE_START),
          mobilization_hard_deadline: shiftDays(start, -MOBILIZATION_DEADLINE_DAYS_BEFORE_START),
        })
        .eq('id', wallet.id)
        .select()
        .maybeSingle()
      if (updated) wallet = updated
      await logDrawdownEvent(admin, {
        walletId: wallet.id,
        eventType: 'start_date_updated',
        actorUserId: user.id,
        actorRole: ho ? 'homeowner' : 'trade',
        detail: { booked_start_date: start },
      })
    }

    // Mirror the agreed payment schedule as expected stages (never overwrite
    // a stage that has already been funded or released).
    const { data: stages } = await admin
      .from('project_stages')
      .select('id, stage_name, stage_order, payment_amount')
      .eq('job_id', jobId)
      .order('stage_order', { ascending: true })

    const { data: walletStages } = await admin
      .from('project_wallet_stages').select('*').eq('wallet_id', wallet.id)

    const byOrder = new Map((walletStages ?? []).map((s: any) => [s.stage_order, s]))

    for (const stage of stages ?? []) {
      const existingStage = byOrder.get(stage.stage_order)
      const expected = toPence(stage.payment_amount)
      if (!existingStage) {
        await admin.from('project_wallet_stages').insert({
          wallet_id: wallet.id,
          project_stage_id: stage.id,
          stage_name: stage.stage_name,
          stage_order: stage.stage_order,
          is_mobilization: stage.stage_order === (stages?.[0]?.stage_order ?? 1),
          expected_amount_pence: expected,
          funding_status: 'expected',
        })
      } else if (
        existingStage.funding_status === 'expected' &&
        existingStage.expected_amount_pence !== expected
      ) {
        await admin
          .from('project_wallet_stages')
          .update({ expected_amount_pence: expected, stage_name: stage.stage_name, project_stage_id: stage.id })
          .eq('id', existingStage.id)
      }
    }

    const { data: finalStages } = await admin
      .from('project_wallet_stages')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('stage_order', { ascending: true })

    // Final payment auto-sizing check: the last stage should be a meaningful
    // retention. Warn (never block) when it is 5% or less of contract value.
    const total = (finalStages ?? []).reduce((s: number, x: any) => s + Number(x.expected_amount_pence ?? 0), 0)
    const last = (finalStages ?? [])[(finalStages ?? []).length - 1]
    const finalPct = total > 0 && last ? (Number(last.expected_amount_pence) / total) * 100 : null
    const finalWarning = finalPct != null && finalPct > 5
    if (finalPct != null) {
      const { data: w2 } = await admin
        .from('project_wallets')
        .update({ final_stage_pct: Number(finalPct.toFixed(2)), final_stage_warning: finalWarning })
        .eq('id', wallet.id)
        .select()
        .maybeSingle()
      if (w2) wallet = w2
    }

    return json({
      wallet,
      stages: finalStages ?? [],
      final_stage_warning: finalWarning
        ? {
            pct: Number((finalPct ?? 0).toFixed(2)),
            stage_name: last?.stage_name,
            message: `The final stage is ${(finalPct ?? 0).toFixed(1)}% of contract value (over the 5% guide). Confirm this is intended before the schedule is agreed.`,
          }
        : null,
    })

  } catch (e) {
    console.error('[init-project-wallet]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
