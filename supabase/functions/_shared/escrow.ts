// Milestone Escrow Release engine — core stage-release logic.
//
// A stage releases ONLY when both are true:
//   1. the stage's latest inspection is classified CLEAR, and
//   2. the stage's wallet status is `funded`.
// CLEAR-but-unfunded is not a dispute: the stage is flagged `awaiting_funds`
// and the release fires automatically the moment funding completes — no
// approval click. A qualifying inspection dispute freezes the whole project.
import Stripe from 'https://esm.sh/stripe@18.5.0'
import { logDrawdownEvent, penceToPounds } from './drawdown.ts'
import { notifyTrade } from './trade-notify.ts'

export type ReleaseOutcome =
  | { released: true; amount_pence: number; stripe_transfer_id: string; next_stage: unknown }
  | { released: false; blocked_by: string; reason: string; outstanding?: string[] }

/** Project-level freeze from a qualifying inspection dispute. */
export async function assertNotFrozen(admin: any, walletId: string): Promise<string | null> {
  const { data: wallet } = await admin
    .from('project_wallets').select('frozen, frozen_reason').eq('id', walletId).maybeSingle()
  if (wallet?.frozen) {
    return wallet.frozen_reason || 'This project is frozen pending a disputed inspection report.'
  }
  return null
}

/**
 * Statutory certificates for a released stage become homeowner-visible.
 * STRICT one-to-one: a certificate belongs to exactly the stage it was issued
 * for. No inheritance from earlier stage orders — a certificate is never
 * released on the back of a different stage's release.
 */
async function releaseCertificates(admin: any, jobId: string, walletStageId: string, stageOrder: number) {
  const nowIso = new Date().toISOString()
  const patch = { visible_to_homeowner: true, released_at: nowIso }

  // Primary link: explicit wallet_stage_id.
  await admin
    .from('project_certificates')
    .update(patch)
    .eq('job_id', jobId)
    .eq('visible_to_homeowner', false)
    .eq('wallet_stage_id', walletStageId)

  // Legacy fallback: certificates recorded before wallet_stage_id existed,
  // matched on the EXACT stage order only.
  await admin
    .from('project_certificates')
    .update(patch)
    .eq('job_id', jobId)
    .eq('visible_to_homeowner', false)
    .is('wallet_stage_id', null)
    .eq('stage_order', stageOrder)
}

/** Fire the already-built sequential funding hook. */
async function callTriggerNextStageFunding(jobId: string, releasedStageOrder: number) {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-next-stage-funding`
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ job_id: jobId, released_stage_order: releasedStageOrder }),
    })
    return await resp.json().catch(() => null)
  } catch (e) {
    console.error('[escrow] trigger-next-stage-funding failed', e)
    return null
  }
}

/**
 * Evaluate (and, when everything lines up, perform) the release of one wallet
 * stage. Safe to call repeatedly — it is a no-op on an already-released stage.
 */
export async function attemptStageRelease(
  admin: any,
  args: {
    walletStageId: string
    actorUserId?: string | null
    actorRole?: string
    trigger: 'inspection_uploaded' | 'stage_funded' | 'manual'
  },
): Promise<ReleaseOutcome> {
  const { data: stage } = await admin
    .from('project_wallet_stages').select('*').eq('id', args.walletStageId).maybeSingle()
  if (!stage) return { released: false, blocked_by: 'not_found', reason: 'Wallet stage not found' }

  const { data: wallet } = await admin
    .from('project_wallets').select('*').eq('id', stage.wallet_id).maybeSingle()
  if (!wallet) return { released: false, blocked_by: 'not_found', reason: 'Wallet not found' }

  if (stage.funding_status === 'released') {
    return { released: false, blocked_by: 'already_released', reason: 'This stage has already been released.' }
  }

  const frozen = await assertNotFrozen(admin, wallet.id)
  if (frozen) {
    await admin.from('project_wallet_stages')
      .update({ release_block_reason: frozen }).eq('id', stage.id)
    return { released: false, blocked_by: 'project_frozen', reason: frozen }
  }

  // --- Gate 1: inspection must be CLEAR -------------------------------------
  const { data: report } = await admin
    .from('stage_inspection_reports')
    .select('*')
    .eq('wallet_stage_id', stage.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!report) {
    const reason = 'No Building Control inspection report has been uploaded for this stage yet.'
    await admin.from('project_wallet_stages').update({ release_block_reason: reason }).eq('id', stage.id)
    return { released: false, blocked_by: 'no_inspection', reason }
  }

  if (report.classification !== 'CLEAR') {
    const outstanding: string[] = Array.isArray(report.open_items) ? [...report.open_items] : []
    const actions: string[] = Array.isArray(report.required_actions) ? report.required_actions : []
    const unable: string[] = Array.isArray(report.unable_to_assess) ? report.unable_to_assess : []
    const all = [...actions, ...unable, ...outstanding]
    const reason =
      report.classification === 'MIXED'
        ? 'Inspection is MIXED (resolved and open items in the same report) — routed to manual review, no automatic release.'
        : 'Inspection is on HOLD — outstanding items must be closed out and a follow-up inspection uploaded.'

    await admin.from('project_wallet_stages').update({ release_block_reason: reason }).eq('id', stage.id)
    await logDrawdownEvent(admin, {
      walletId: wallet.id,
      eventType: report.classification === 'MIXED' ? 'release_blocked_mixed' : 'release_blocked_hold',
      actorUserId: args.actorUserId ?? null,
      actorRole: args.actorRole ?? 'system',
      detail: { stage_id: stage.id, stage_name: stage.stage_name, inspection_report_id: report.id, outstanding: all },
    })

    const { data: trade } = await admin
      .from('trades').select('id, user_id').eq('id', wallet.trade_id).maybeSingle()
    if (trade) {
      await notifyTrade(admin, {
        tradeId: trade.id,
        userId: trade.user_id,
        type: 'general',
        title: report.classification === 'MIXED' ? 'Inspection mixed — manual review' : 'Inspection on hold',
        body:
          `${stage.stage_name}: no release yet. Outstanding — ` +
          (all.length ? all.slice(0, 5).join(' | ') : 'see the inspection report'),
        link: `/project/${wallet.job_id}/wallet`,
        jobId: wallet.job_id,
      })
    }
    return { released: false, blocked_by: report.classification.toLowerCase(), reason, outstanding: all }
  }

  // --- Gate 2: the stage must actually be funded ----------------------------
  const funded = Number(stage.funded_amount_pence ?? 0)
  const released = Number(stage.released_amount_pence ?? 0)
  const expected = Number(stage.expected_amount_pence ?? 0)
  const available = funded - released

  if (stage.funding_status !== 'funded' || funded < expected || available <= 0) {
    const reason = 'Inspection passed — awaiting funds. Release fires automatically once this stage is funded.'
    await admin
      .from('project_wallet_stages')
      .update({ awaiting_funds: true, release_block_reason: reason })
      .eq('id', stage.id)
    await logDrawdownEvent(admin, {
      walletId: wallet.id,
      eventType: 'inspection_passed_awaiting_funds',
      actorUserId: args.actorUserId ?? null,
      actorRole: args.actorRole ?? 'system',
      detail: { stage_id: stage.id, stage_name: stage.stage_name, expected_pence: expected, funded_pence: funded },
    })
    return { released: false, blocked_by: 'awaiting_funds', reason }
  }

  // --- Release --------------------------------------------------------------
  const { data: trade } = await admin
    .from('trades').select('id, user_id, stripe_connect_account_id').eq('id', wallet.trade_id).maybeSingle()
  if (!trade?.stripe_connect_account_id) {
    const reason = 'This trade has no connected payout account, so funds cannot be released yet.'
    await admin.from('project_wallet_stages').update({ release_block_reason: reason }).eq('id', stage.id)
    return { released: false, blocked_by: 'no_payout_account', reason }
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2025-08-27.basil' })
  let transfer: any
  try {
    transfer = await stripe.transfers.create(
      {
        amount: available,
        currency: 'gbp',
        destination: trade.stripe_connect_account_id,
        description: `Milestone release — ${stage.stage_name}`.slice(0, 200),
        metadata: { job_id: wallet.job_id, wallet_stage_id: stage.id, inspection_report_id: report.id },
      },
      { idempotencyKey: `milestone-release-${stage.id}` },
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe transfer failed'
    await admin.from('project_wallet_stages')
      .update({ release_block_reason: `Transfer failed: ${message}` }).eq('id', stage.id)
    await logDrawdownEvent(admin, {
      walletId: wallet.id,
      eventType: 'milestone_release_transfer_failed',
      actorUserId: args.actorUserId ?? null,
      actorRole: args.actorRole ?? 'system',
      detail: { stage_id: stage.id, amount_pence: available, error: message },
    })
    return { released: false, blocked_by: 'transfer_failed', reason: message }
  }

  const nowIso = new Date().toISOString()
  await admin
    .from('project_wallet_stages')
    .update({
      released_amount_pence: released + available,
      funding_status: 'released',
      released_at: nowIso,
      awaiting_funds: false,
      release_block_reason: null,
      inspection_passed_at: stage.inspection_passed_at ?? nowIso,
    })
    .eq('id', stage.id)

  await logDrawdownEvent(admin, {
    walletId: wallet.id,
    eventType: 'milestone_released',
    actorUserId: args.actorUserId ?? null,
    actorRole: args.actorRole ?? 'system',
    detail: {
      stage_id: stage.id,
      stage_name: stage.stage_name,
      amount_pence: available,
      stripe_transfer_id: transfer.id,
      inspection_report_id: report.id,
      trigger: args.trigger,
    },
  })

  await releaseCertificates(admin, wallet.job_id, stage.id, Number(stage.stage_order ?? 0))

  if (trade) {
    await notifyTrade(admin, {
      tradeId: trade.id,
      userId: trade.user_id,
      type: 'general',
      title: 'Stage payment released',
      body: `£${penceToPounds(available)} released for ${stage.stage_name}.`,
      link: `/project/${wallet.job_id}/wallet`,
      jobId: wallet.job_id,
    })
  }

  // Sequential stage funding — the release event triggers the next deposit.
  const next = await callTriggerNextStageFunding(wallet.job_id, Number(stage.stage_order ?? 0))

  return {
    released: true,
    amount_pence: available,
    stripe_transfer_id: transfer.id,
    next_stage: next?.next_stage ?? null,
  }
}
