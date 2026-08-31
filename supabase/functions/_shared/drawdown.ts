// Shared helpers for the Mobilization Drawdown flow.
// Self-contained: does not touch existing payment/commission logic.

export const MOBILIZATION_TARGET_DAYS_BEFORE_START = 14
export const MOBILIZATION_DEADLINE_DAYS_BEFORE_START = 7
export const NEXT_STAGE_REMINDER_HOURS = 48

export function toPence(amount: number | string | null | undefined): number {
  const n = Number(amount ?? 0)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

export function penceToPounds(pence: number): string {
  return (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Append-only audit write. Never throws the caller off course. */
export async function logDrawdownEvent(
  supabase: any,
  input: {
    walletId: string
    requestId?: string | null
    eventType: string
    actorUserId?: string | null
    actorRole?: string | null
    detail?: Record<string, unknown>
  },
) {
  const { error } = await supabase.from('drawdown_audit_events').insert({
    wallet_id: input.walletId,
    request_id: input.requestId ?? null,
    event_type: input.eventType,
    actor_user_id: input.actorUserId ?? null,
    actor_role: input.actorRole ?? null,
    detail: input.detail ?? {},
  })
  if (error) console.error('[drawdown] audit insert failed', error)
}

/**
 * Sequential stage funding: mark the next expected stage as deposit_requested.
 * Triggered by a release event, never by calendar prediction.
 * Returns the stage row it flagged, or null when there is no next stage.
 */
export async function requestNextStageDeposit(
  supabase: any,
  walletId: string,
  releasedStageOrder: number,
) {
  const { data: next } = await supabase
    .from('project_wallet_stages')
    .select('*')
    .eq('wallet_id', walletId)
    .gt('stage_order', releasedStageOrder)
    .eq('funding_status', 'expected')
    .order('stage_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!next) return null

  const { data: updated, error } = await supabase
    .from('project_wallet_stages')
    .update({
      funding_status: 'deposit_requested',
      deposit_requested_at: new Date().toISOString(),
      deposit_reminder_sent_at: null,
    })
    .eq('id', next.id)
    .eq('funding_status', 'expected')
    .select()
    .maybeSingle()

  if (error) {
    console.error('[drawdown] next stage request failed', error)
    return null
  }

  if (updated) {
    await logDrawdownEvent(supabase, {
      walletId,
      eventType: 'next_stage_deposit_requested',
      actorRole: 'system',
      detail: {
        stage_id: updated.id,
        stage_name: updated.stage_name,
        expected_amount_pence: updated.expected_amount_pence,
        triggered_by_stage_order: releasedStageOrder,
      },
    })
  }
  return updated
}
