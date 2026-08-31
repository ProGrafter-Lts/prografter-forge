// Sequential stage funding hook.
// Called by the core release logic the moment a stage's payment releases
// (inspection CLEAR + funds present). Immediately requests the next stage's
// deposit from the homeowner. No calendar prediction is involved.
//
// Also used to set/clear the "inspection passed — awaiting funds" flag when an
// inspection outpaces a deposit still in progress (not a dispute state).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { z } from 'npm:zod@3.23.8'
import { logDrawdownEvent, penceToPounds, requestNextStageDeposit } from '../_shared/drawdown.ts'
import { enqueueTransactionalEmail } from '../_shared/enqueue-transactional-email.ts'

const BodySchema = z.object({
  job_id: z.string().uuid(),
  released_stage_order: z.number().int().nonnegative().optional(),
  released_wallet_stage_id: z.string().uuid().optional(),
  // Optional: flag a stage as inspection-passed but unfunded.
  awaiting_funds_stage_id: z.string().uuid().optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
    const input = parsed.data

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: wallet } = await admin
      .from('project_wallets').select('*').eq('job_id', input.job_id).maybeSingle()
    if (!wallet) return json({ error: 'No wallet for this project' }, 404)

    if (input.awaiting_funds_stage_id) {
      await admin
        .from('project_wallet_stages')
        .update({ awaiting_funds: true })
        .eq('id', input.awaiting_funds_stage_id)
        .eq('wallet_id', wallet.id)
      await logDrawdownEvent(admin, {
        walletId: wallet.id,
        eventType: 'inspection_passed_awaiting_funds',
        actorRole: 'system',
        detail: { stage_id: input.awaiting_funds_stage_id },
      })
    }

    let order = input.released_stage_order
    if (order == null && input.released_wallet_stage_id) {
      const { data: s } = await admin
        .from('project_wallet_stages')
        .select('stage_order')
        .eq('id', input.released_wallet_stage_id)
        .maybeSingle()
      order = s?.stage_order
    }
    if (order == null) return json({ ok: true, next_stage: null })

    const nextStage = await requestNextStageDeposit(admin, wallet.id, order)
    if (!nextStage) return json({ ok: true, next_stage: null })

    const [{ data: homeowner }, { data: job }] = await Promise.all([
      admin.from('homeowners').select('name, email').eq('id', wallet.homeowner_id).maybeSingle(),
      admin.from('jobs').select('title').eq('id', wallet.job_id).maybeSingle(),
    ])

    if (homeowner?.email) {
      try {
        await enqueueTransactionalEmail(admin, {
          templateName: 'stage-deposit-requested',
          recipientEmail: homeowner.email,
          idempotencyKey: `stage-deposit-${nextStage.id}`,
          templateData: {
            firstName: homeowner.name?.split(' ')[0],
            amount: `£${penceToPounds(nextStage.expected_amount_pence)}`,
            stageName: nextStage.stage_name,
            projectTitle: job?.title ?? 'your project',
            jobId: wallet.job_id,
            isReminder: false,
          },
        })
      } catch (e) {
        console.error('[trigger-next-stage-funding] email failed', e)
      }
    }

    return json({ ok: true, next_stage: nextStage })
  } catch (e) {
    console.error('[trigger-next-stage-funding]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
