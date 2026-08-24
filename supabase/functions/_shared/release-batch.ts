// Shared batch-release logic used by BOTH the manual admin button
// (release-next-batch) and the automatic 48h escalation job
// (auto-escalate-invitations). Single implementation = identical behaviour.

import { notifyTrade } from './trade-notify.ts'

const SITE_URL = 'https://prografter.co.uk'
export const MAX_BATCH = 3
export const RESPONSE_WINDOW_HOURS = 48

export interface ReleaseResult {
  released: number
  batch_number: number | null
  emailed: number
  message?: string
}

/** Releases the next (up to 3) waiting-list trades for a job. */
export async function releaseNextBatch(
  supabase: any,
  jobId: string,
): Promise<ReleaseResult> {
  const { data: pending } = await supabase
    .from('job_trade_invitations')
    .select('id, trade_id, brief_id, batch_number')
    .eq('job_id', jobId)
    .eq('released', false)
    .order('rank', { ascending: true, nullsFirst: false })
    .limit(MAX_BATCH)

  if (!pending || pending.length === 0) {
    return { released: 0, batch_number: null, emailed: 0, message: 'No further trades to release.' }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESPONSE_WINDOW_HOURS * 3600 * 1000)
  const batchNumber = Math.max(...pending.map((p: any) => p.batch_number || 2))

  const ids = pending.map((p: any) => p.id)
  await supabase.from('job_trade_invitations').update({
    released: true,
    status: 'invited',
    invited_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }).in('id', ids)

  const { data: brief } = await supabase
    .from('job_briefs')
    .select('id, ref, city, job_title, job_description, budget_band, trade_category_id')
    .eq('id', pending[0].brief_id)
    .maybeSingle()

  const { data: existingMatches } = await supabase
    .from('job_matches').select('trade_id').eq('job_id', jobId)
  const matchedIds = new Set((existingMatches || []).map((r: any) => r.trade_id))
  const matchRows = pending.filter((p: any) => !matchedIds.has(p.trade_id)).map((p: any) => ({
    job_id: jobId,
    trade_id: p.trade_id,
    status: 'notified',
    notified_at: now.toISOString(),
    estimated_value: brief?.budget_band || null,
    is_test: false,
  }))
  if (matchRows.length) {
    const { error } = await supabase.from('job_matches').insert(matchRows)
    if (error) console.error('[release-batch] job_matches insert failed', error)
  }

  const briefUrl = `${SITE_URL}/project/${jobId}`
  const sends: Promise<unknown>[] = []
  for (const p of pending) {
    const { data: trade } = await supabase.from('trades').select('name, user_id').eq('id', p.trade_id).maybeSingle()
    if (!trade?.user_id) continue
    await notifyTrade(supabase, {
      tradeId: p.trade_id,
      userId: trade.user_id,
      type: 'new_lead',
      title: 'New lead available',
      body: `${brief?.job_title || 'A new job'}${brief?.city ? ` — ${brief.city}` : ''}. You have 48 hours to accept or decline.`,
      link: briefUrl,
      jobId: jobId,
      invitationId: p.id,
    })
    const { data: tp } = await supabase.from('profiles').select('email').eq('user_id', trade.user_id).maybeSingle()
    if (!tp?.email) continue
    sends.push(supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'new-job-in-area',
        recipientEmail: tp.email,
        idempotencyKey: `new-job-${jobId}-${p.trade_id}-b${batchNumber}`,
        templateData: {
          tradeFirstName: trade.name?.split(' ')[0],
          reference: brief?.ref,
          jobTitle: brief?.job_title || 'A new job',
          summary: brief?.job_description?.slice(0, 277),
          trade: brief?.trade_category_id || undefined,
          valueBand: brief?.budget_band || undefined,
          location: brief?.city || 'your area',
          briefUrl,
        },
      },
    }))
  }
  await Promise.allSettled(sends)

  const { count } = await supabase
    .from('job_matches').select('id', { count: 'exact', head: true }).eq('job_id', jobId)
  if (brief?.id != null) {
    await supabase.from('job_briefs').update({ matched_trade_count: count ?? null }).eq('id', brief.id)
  }

  return { released: pending.length, batch_number: batchNumber, emailed: sends.length }
}

/** Writes a visible audit row so system escalations are distinguishable from Lee's. */
export async function logEscalation(
  supabase: any,
  row: {
    job_id: string
    brief_id?: string | null
    source: 'auto_48h' | 'manual'
    expired_count?: number
    released_count?: number
    expired_invitation_ids?: string[]
    note: string
    actor_user_id?: string | null
  },
) {
  const { error } = await supabase.from('job_escalation_events').insert({
    job_id: row.job_id,
    brief_id: row.brief_id ?? null,
    source: row.source,
    expired_count: row.expired_count ?? 0,
    released_count: row.released_count ?? 0,
    expired_invitation_ids: row.expired_invitation_ids ?? [],
    note: row.note,
    actor_user_id: row.actor_user_id ?? null,
  })
  if (error) console.error('[release-batch] escalation log failed', error)
}
