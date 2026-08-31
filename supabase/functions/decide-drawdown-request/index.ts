// Homeowner-side: approve or decline a mobilization drawdown.
// Approval requires the homeowner's own authenticated action — no auto-approval,
// no timeout release, no admin override.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import Stripe from 'https://esm.sh/stripe@18.5.0'
import { z } from 'npm:zod@3.23.8'
import { logDrawdownEvent, penceToPounds, requestNextStageDeposit } from '../_shared/drawdown.ts'
import { notifyTrade } from '../_shared/trade-notify.ts'
import { assertNotFrozen } from '../_shared/escrow.ts'
import { enqueueTransactionalEmail } from '../_shared/enqueue-transactional-email.ts'

const BodySchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(['approve', 'decline']),
  decline_reason: z.string().max(1000).optional(),
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

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
    const { request_id, decision, decline_reason } = parsed.data

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: request } = await admin
      .from('drawdown_requests').select('*').eq('id', request_id).maybeSingle()
    if (!request) return json({ error: 'Request not found' }, 404)
    if (request.status !== 'pending_approval') {
      return json({ error: `Request is already ${request.status}` }, 409)
    }

    const frozenReason = await assertNotFrozen(admin, request.wallet_id)
    if (frozenReason) return json({ error: frozenReason }, 409)

    // Strictly the homeowner on this project.
    const { data: homeowner } = await admin
      .from('homeowners')
      .select('id, name, email')
      .eq('id', request.homeowner_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!homeowner) return json({ error: 'Only the homeowner can approve or decline' }, 403)

    const { data: stage } = await admin
      .from('project_wallet_stages').select('*').eq('id', request.wallet_stage_id).maybeSingle()
    const { data: trade } = await admin
      .from('trades')
      .select('id, name, company_name, user_id, stripe_connect_account_id')
      .eq('id', request.trade_id)
      .maybeSingle()

    const nowIso = new Date().toISOString()

    if (decision === 'decline') {
      const { data: updated } = await admin
        .from('drawdown_requests')
        .update({
          status: 'declined',
          decided_by: user.id,
          decided_at: nowIso,
          decline_reason: decline_reason ?? null,
        })
        .eq('id', request.id)
        .eq('status', 'pending_approval')
        .select()
        .maybeSingle()

      if (!updated) return json({ error: 'Request is no longer pending' }, 409)

      await logDrawdownEvent(admin, {
        walletId: request.wallet_id,
        requestId: request.id,
        eventType: 'drawdown_declined',
        actorUserId: user.id,
        actorRole: 'homeowner',
        detail: {
          amount_pence: request.amount_pence,
          decline_reason: decline_reason ?? null,
          proforma_path: request.proforma_path,
        },
      })

      if (trade) {
        await notifyTrade(admin, {
          tradeId: trade.id,
          userId: trade.user_id,
          type: 'general',
          title: 'Drawdown declined',
          body: `Your £${penceToPounds(request.amount_pence)} drawdown request was declined. No funds have moved.`,
          link: `/project/${request.job_id}/wallet`,
          jobId: request.job_id,
        })
      }

      return json({ request: updated })
    }

    // ---- APPROVE: fire the transfer, then record the outcome. ----
    if (!trade?.stripe_connect_account_id) {
      return json(
        { error: 'This trade has no connected Stripe account, so funds cannot be released yet.' },
        400,
      )
    }

    // Re-check funded balance at the moment of release.
    const available =
      Number(stage?.funded_amount_pence ?? 0) - Number(stage?.released_amount_pence ?? 0)
    if (request.amount_pence > available) {
      return json({ error: 'Funded balance no longer covers this request', available_pence: Math.max(available, 0) }, 409)
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    })

    let transfer: any
    try {
      transfer = await stripe.transfers.create(
        {
          amount: request.amount_pence,
          currency: 'gbp',
          destination: trade.stripe_connect_account_id,
          description: `Mobilization drawdown — ${request.description}`.slice(0, 200),
          metadata: {
            drawdown_request_id: request.id,
            job_id: request.job_id,
            wallet_stage_id: request.wallet_stage_id,
          },
        },
        { idempotencyKey: `drawdown-${request.id}` },
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Stripe transfer failed'
      await admin
        .from('drawdown_requests')
        .update({ status: 'transfer_failed', transfer_error: message })
        .eq('id', request.id)
      await logDrawdownEvent(admin, {
        walletId: request.wallet_id,
        requestId: request.id,
        eventType: 'drawdown_transfer_failed',
        actorUserId: user.id,
        actorRole: 'homeowner',
        detail: { amount_pence: request.amount_pence, error: message },
      })
      return json({ error: `Approval recorded but the transfer failed: ${message}` }, 502)
    }

    const { data: updated } = await admin
      .from('drawdown_requests')
      .update({
        status: 'approved',
        decided_by: user.id,
        decided_at: nowIso,
        stripe_transfer_id: transfer.id,
      })
      .eq('id', request.id)
      .select()
      .maybeSingle()

    const releasedTotal = Number(stage?.released_amount_pence ?? 0) + request.amount_pence
    const fullyReleased = releasedTotal >= Number(stage?.funded_amount_pence ?? 0)

    await admin
      .from('project_wallet_stages')
      .update({
        released_amount_pence: releasedTotal,
        funding_status: fullyReleased ? 'released' : stage?.funding_status,
        released_at: fullyReleased ? nowIso : stage?.released_at,
        awaiting_funds: false,
      })
      .eq('id', request.wallet_stage_id)

    await logDrawdownEvent(admin, {
      walletId: request.wallet_id,
      requestId: request.id,
      eventType: 'drawdown_approved',
      actorUserId: user.id,
      actorRole: 'homeowner',
      detail: {
        amount_pence: request.amount_pence,
        stripe_transfer_id: transfer.id,
        proforma_path: request.proforma_path,
        stage_name: stage?.stage_name,
      },
    })

    // Sequential stage funding: the release event itself triggers the next
    // stage's deposit request.
    let nextStage: any = null
    if (fullyReleased && stage) {
      nextStage = await requestNextStageDeposit(admin, request.wallet_id, stage.stage_order)
      if (nextStage && homeowner.email) {
        const { data: job } = await admin
          .from('jobs').select('title').eq('id', request.job_id).maybeSingle()
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
              tradeName: trade.company_name || trade.name,
              jobId: request.job_id,
              isReminder: false,
            },
          })
        } catch (e) {
          console.error('[decide-drawdown-request] next stage email failed', e)
        }
      }
    }

    await notifyTrade(admin, {
      tradeId: trade.id,
      userId: trade.user_id,
      type: 'general',
      title: 'Drawdown approved',
      body: `£${penceToPounds(request.amount_pence)} has been released to your account.`,
      link: `/project/${request.job_id}/wallet`,
      jobId: request.job_id,
    })

    return json({ request: updated, transfer_id: transfer.id, next_stage: nextStage })
  } catch (e) {
    console.error('[decide-drawdown-request]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
