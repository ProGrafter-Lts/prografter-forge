// Scheduled sweep for the Mobilization Drawdown flow.
// 1. Flags start dates at risk when the mobilization hard deadline passes unfunded.
// 2. Sends a single 48h follow-up reminder for unfunded next-stage deposits.
// No automatic rebooking, no slot forfeiture, no auto-approval of anything.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { logDrawdownEvent, penceToPounds, NEXT_STAGE_REMINDER_HOURS } from '../_shared/drawdown.ts'
import { notifyTrade } from '../_shared/trade-notify.ts'
import { enqueueTransactionalEmail } from '../_shared/enqueue-transactional-email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const today = new Date().toISOString().slice(0, 10)
  const summary = { at_risk_flagged: 0, reminders_sent: 0 }

  try {
    // --- 1. Mobilization hard deadline ---
    const { data: wallets } = await admin
      .from('project_wallets')
      .select('*, project_wallet_stages(*)')
      .eq('start_date_at_risk', false)
      .not('mobilization_hard_deadline', 'is', null)
      .lte('mobilization_hard_deadline', today)

    for (const wallet of wallets ?? []) {
      const mob = (wallet.project_wallet_stages ?? []).find((s: any) => s.is_mobilization)
      if (!mob) continue
      if (Number(mob.funded_amount_pence) >= Number(mob.expected_amount_pence)) continue

      await admin
        .from('project_wallets')
        .update({ start_date_at_risk: true, start_date_at_risk_at: new Date().toISOString() })
        .eq('id', wallet.id)

      await logDrawdownEvent(admin, {
        walletId: wallet.id,
        eventType: 'start_date_flagged_at_risk',
        actorRole: 'system',
        detail: {
          hard_deadline: wallet.mobilization_hard_deadline,
          booked_start_date: wallet.booked_start_date,
          expected_amount_pence: mob.expected_amount_pence,
          funded_amount_pence: mob.funded_amount_pence,
        },
      })

      const [{ data: trade }, { data: homeowner }, { data: job }] = await Promise.all([
        admin.from('trades').select('id, name, company_name, user_id, email').eq('id', wallet.trade_id).maybeSingle(),
        admin.from('homeowners').select('name, email').eq('id', wallet.homeowner_id).maybeSingle(),
        admin.from('jobs').select('title').eq('id', wallet.job_id).maybeSingle(),
      ])

      const shortfall = Number(mob.expected_amount_pence) - Number(mob.funded_amount_pence)

      if (trade) {
        await notifyTrade(admin, {
          tradeId: trade.id,
          userId: trade.user_id,
          type: 'general',
          title: 'Start date at risk — mobilization unfunded',
          body: `Mobilization is £${penceToPounds(shortfall)} short past the funding deadline. Push the start date back if you need to — nothing has been rebooked.`,
          link: `/project/${wallet.job_id}/wallet`,
          jobId: wallet.job_id,
        })
        if ((trade as any).email) {
          try {
            await enqueueTransactionalEmail(admin, {
              templateName: 'mobilization-at-risk',
              recipientEmail: (trade as any).email,
              idempotencyKey: `mobilization-at-risk-trade-${wallet.id}`,
              templateData: {
                firstName: trade.name?.split(' ')[0],
                amount: `£${penceToPounds(shortfall)}`,
                projectTitle: job?.title ?? 'the project',
                startDate: wallet.booked_start_date ?? 'the booked start date',
                jobId: wallet.job_id,
                audience: 'trade',
              },
            })
          } catch (e) { console.error('[drawdown-scheduler] trade email failed', e) }
        }
      }

      if (homeowner?.email) {
        try {
          await enqueueTransactionalEmail(admin, {
            templateName: 'mobilization-at-risk',
            recipientEmail: homeowner.email,
            idempotencyKey: `mobilization-at-risk-homeowner-${wallet.id}`,
            templateData: {
              firstName: homeowner.name?.split(' ')[0],
              amount: `£${penceToPounds(shortfall)}`,
              projectTitle: job?.title ?? 'your project',
              startDate: wallet.booked_start_date ?? 'the booked start date',
              jobId: wallet.job_id,
              audience: 'homeowner',
            },
          })
        } catch (e) { console.error('[drawdown-scheduler] homeowner email failed', e) }
      }

      summary.at_risk_flagged++
    }

    // --- 2. Single 48h follow-up on unfunded next-stage deposits ---
    const cutoff = new Date(Date.now() - NEXT_STAGE_REMINDER_HOURS * 3600 * 1000).toISOString()
    const { data: dueStages } = await admin
      .from('project_wallet_stages')
      .select('*, project_wallets(*)')
      .eq('funding_status', 'deposit_requested')
      .is('deposit_reminder_sent_at', null)
      .lte('deposit_requested_at', cutoff)

    for (const stage of dueStages ?? []) {
      const wallet: any = stage.project_wallets
      if (!wallet) continue

      const [{ data: homeowner }, { data: job }] = await Promise.all([
        admin.from('homeowners').select('name, email').eq('id', wallet.homeowner_id).maybeSingle(),
        admin.from('jobs').select('title').eq('id', wallet.job_id).maybeSingle(),
      ])

      if (homeowner?.email) {
        try {
          await enqueueTransactionalEmail(admin, {
            templateName: 'stage-deposit-requested',
            recipientEmail: homeowner.email,
            idempotencyKey: `stage-deposit-reminder-${stage.id}`,
            templateData: {
              firstName: homeowner.name?.split(' ')[0],
              amount: `£${penceToPounds(stage.expected_amount_pence)}`,
              stageName: stage.stage_name,
              projectTitle: job?.title ?? 'your project',
              jobId: wallet.job_id,
              isReminder: true,
            },
          })
        } catch (e) { console.error('[drawdown-scheduler] reminder email failed', e) }
      }

      await admin
        .from('project_wallet_stages')
        .update({ deposit_reminder_sent_at: new Date().toISOString() })
        .eq('id', stage.id)

      await logDrawdownEvent(admin, {
        walletId: wallet.id,
        eventType: 'stage_deposit_reminder_sent',
        actorRole: 'system',
        detail: { stage_id: stage.id, stage_name: stage.stage_name },
      })

      summary.reminders_sent++
    }

    return new Response(JSON.stringify({ ok: true, ...summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[drawdown-scheduler]', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
