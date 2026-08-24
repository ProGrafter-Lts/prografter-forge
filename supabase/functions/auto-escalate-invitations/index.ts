// Scheduled job (pg_cron, hourly): finds job invitations that passed their
// 48h expires_at with NO genuine response, marks them "no_response", and
// automatically releases the next batch of trades — the same action as the
// manual admin "Release next batch" button.
//
// "No response"  = released invitation, expires_at in the past, status is
//                  'invited' or 'viewed', responded_at IS NULL and
//                  quote_submitted_at IS NULL.
// NOT escalated  = 'interested' (responded, just hasn't priced yet),
//                  'declined', 'quote_submitted', or anything with a
//                  responded_at / quote_submitted_at timestamp.
//
// Safety: single-flight DB lock, bounded work per run, idempotent progress
// marking (status flips to no_response in the same step).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { releaseNextBatch, logEscalation } from '../_shared/release-batch.ts'
import { notifyTrade } from '../_shared/trade-notify.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOCK_NAME = 'auto-escalate-invitations'
const LOCK_MINUTES = 10
const MAX_INVITATIONS = 200
const MAX_JOBS_PER_RUN = 25

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const nowIso = new Date().toISOString()
  const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()

  // Single-flight lock (atomic conditional update; insert seeds the row once).
  await supabase.from('scheduler_locks')
    .insert({ name: LOCK_NAME, locked_until: new Date(0).toISOString() })
  const { data: lockRows } = await supabase.from('scheduler_locks')
    .update({ locked_until: lockUntil, updated_at: nowIso })
    .eq('name', LOCK_NAME)
    .lt('locked_until', nowIso)
    .select('name')
  if (!lockRows || lockRows.length === 0) {
    return json({ ok: true, skipped: 'another run in progress' })
  }

  try {
    const { data: expired, error } = await supabase
      .from('job_trade_invitations')
      .select('id, job_id, brief_id, trade_id, status, expires_at')
      .eq('released', true)
      .lt('expires_at', nowIso)
      .in('status', ['invited', 'viewed'])
      .is('responded_at', null)
      .is('quote_submitted_at', null)
      .order('expires_at', { ascending: true })
      .limit(MAX_INVITATIONS)

    if (error) {
      console.error('[auto-escalate] query failed', error)
      return json({ error: error.message }, 500)
    }

    if (!expired || expired.length === 0) {
      return json({ ok: true, expired: 0, jobs_escalated: 0 })
    }

    // Group by job, bounded per run.
    const byJob = new Map<string, typeof expired>()
    for (const inv of expired) {
      if (!byJob.has(inv.job_id) && byJob.size >= MAX_JOBS_PER_RUN) continue
      const list = byJob.get(inv.job_id) || []
      list.push(inv)
      byJob.set(inv.job_id, list)
    }

    let jobsEscalated = 0
    let totalReleased = 0

    for (const [jobId, invites] of byJob) {
      const ids = invites.map((i: any) => i.id)
      // Idempotent progress marking — a re-run will not see these again.
      await supabase.from('job_trade_invitations')
        .update({ status: 'no_response' })
        .in('id', ids)

      // Tell each timed-out trade privately. Homeowners never see this.
      for (const inv of invites) {
        await notifyTrade(supabase, {
          tradeId: inv.trade_id,
          type: 'lead_expired',
          title: 'Lead expired',
          body: 'This opportunity passed to another trade after 48 hours with no response.',
          link: '/dashboard/trade?view=find-work',
          jobId: jobId,
          invitationId: inv.id,
        })
      }

      let result = { released: 0, batch_number: null as number | null, emailed: 0, message: '' as string | undefined }
      try {
        result = await releaseNextBatch(supabase, jobId) as any
      } catch (e) {
        console.error('[auto-escalate] release failed for job', jobId, e)
      }

      totalReleased += result.released
      if (result.released > 0) jobsEscalated++

      await logEscalation(supabase, {
        job_id: jobId,
        brief_id: invites[0].brief_id,
        source: 'auto_48h',
        expired_count: ids.length,
        released_count: result.released,
        expired_invitation_ids: ids,
        note: result.released > 0
          ? `Auto-escalated after 48h no response — ${ids.length} invitation(s) expired, ${result.released} new trade(s) notified (batch ${result.batch_number}).`
          : `Auto-escalated after 48h no response — ${ids.length} invitation(s) expired, but no trades left on the waiting list.`,
      })
    }

    return json({ ok: true, expired: expired.length, jobs_escalated: jobsEscalated, released: totalReleased })
  } finally {
    await supabase.from('scheduler_locks')
      .update({ locked_until: new Date().toISOString() })
      .eq('name', LOCK_NAME)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
