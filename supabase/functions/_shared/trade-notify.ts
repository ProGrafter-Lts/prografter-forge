// Shared in-app notification helper for trades.
// Writes a row into public.trade_notifications. Deduped by (invitation_id, type)
// via a unique partial index, so re-runs never double-notify.

export type TradeNotificationType =
  | 'new_lead'
  | 'lead_reminder'
  | 'lead_expired'
  | 'quote_accepted'
  | 'general'

export async function notifyTrade(
  supabase: any,
  input: {
    tradeId: string
    userId?: string | null
    type: TradeNotificationType
    title: string
    body?: string
    link?: string
    jobId?: string | null
    invitationId?: string | null
  },
): Promise<boolean> {
  let userId = input.userId
  if (!userId) {
    const { data: trade } = await supabase
      .from('trades').select('user_id').eq('id', input.tradeId).maybeSingle()
    userId = trade?.user_id
  }
  if (!userId) return false

  const { error } = await supabase.from('trade_notifications').insert({
    trade_id: input.tradeId,
    user_id: userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    job_id: input.jobId ?? null,
    invitation_id: input.invitationId ?? null,
  })

  // 23505 = duplicate (already notified) — treat as success, not an error.
  if (error && (error as any).code !== '23505') {
    console.error('[trade-notify] insert failed', error)
    return false
  }
  return true
}
