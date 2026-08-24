// Scheduled job (pg_cron, hourly): T+24h SMS warning for job invitations that
// have had no response. Sends a real SMS via the Twilio connector gateway plus
// an in-app notification, then stamps sms_reminder_sent_at so it never repeats.
//
// Guard rails: single-flight DB lock, bounded batch per run, idempotent
// progress marking, circuit breaker on gateway auth/billing failures.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { notifyTrade } from '../_shared/trade-notify.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://prografter.co.uk'
const LOCK_NAME = 'lead-sms-reminders'
const LOCK_MINUTES = 10
const MAX_PER_RUN = 50
const REMINDER_AFTER_HOURS = 24
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function toE164(raw?: string | null): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('44')) return `+${digits}`
  if (digits.startsWith('0')) return `+44${digits.slice(1)}`
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY')
  const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER')

  const nowIso = new Date().toISOString()
  const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()

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
    const cutoff = new Date(Date.now() - REMINDER_AFTER_HOURS * 3600 * 1000).toISOString()

    const { data: due, error } = await supabase
      .from('job_trade_invitations')
      .select('id, job_id, brief_id, trade_id, invited_at, expires_at')
      .eq('released', true)
      .lt('invited_at', cutoff)
      .gt('expires_at', nowIso)
      .in('status', ['invited', 'viewed'])
      .is('responded_at', null)
      .is('quote_submitted_at', null)
      .is('sms_reminder_sent_at', null)
      .order('invited_at', { ascending: true })
      .limit(MAX_PER_RUN)

    if (error) return json({ error: error.message }, 500)
    if (!due || due.length === 0) return json({ ok: true, due: 0, sms_sent: 0 })

    let smsSent = 0
    let notified = 0
    let breaker: string | null = null

    for (const inv of due) {
      if (breaker) break

      const { data: trade } = await supabase
        .from('trades').select('id, name, phone, user_id').eq('id', inv.trade_id).maybeSingle()
      const { data: brief } = await supabase
        .from('job_briefs').select('ref, job_title, city').eq('id', inv.brief_id).maybeSingle()

      const link = `${SITE_URL}/project/${inv.job_id}`
      const jobTitle = brief?.job_title || 'A new job'

      // In-app notification always (SMS is best-effort on top).
      const ok = await notifyTrade(supabase, {
        tradeId: inv.trade_id,
        userId: trade?.user_id,
        type: 'lead_reminder',
        title: 'Lead expires in 24 hours',
        body: `${jobTitle}${brief?.city ? ` — ${brief.city}` : ''}. Accept or decline before it passes to the next trade.`,
        link,
        jobId: inv.job_id,
        invitationId: inv.id,
      })
      if (ok) notified++

      const to = toE164(trade?.phone)
      if (to && LOVABLE_API_KEY && TWILIO_API_KEY && TWILIO_FROM) {
        const message =
          `ProGrafter: your lead "${jobTitle}"${brief?.ref ? ` (${brief.ref})` : ''} expires in 24 hours. ` +
          `Accept or decline: ${link}`
        try {
          const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'X-Connection-Api-Key': TWILIO_API_KEY,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: message }),
          })
          if (res.ok) {
            smsSent++
          } else {
            const detail = await res.text()
            console.error(`[lead-sms-reminders] Twilio failed [${res.status}]: ${detail}`)
            // Circuit breaker: auth / billing / policy failures stop the whole run.
            if ([401, 402, 403].includes(res.status)) breaker = `twilio_${res.status}`
            if (res.status === 429) breaker = 'twilio_429'
          }
        } catch (e) {
          console.error('[lead-sms-reminders] Twilio request threw', e)
        }
      }

      // Idempotent progress marking — one attempt per invitation, ever.
      await supabase.from('job_trade_invitations')
        .update({ sms_reminder_sent_at: new Date().toISOString() })
        .eq('id', inv.id)
    }

    return json({ ok: true, due: due.length, sms_sent: smsSent, notified, halted: breaker })
  } finally {
    await supabase.from('scheduler_locks')
      .update({ locked_until: new Date().toISOString() })
      .eq('name', LOCK_NAME)
  }
})
