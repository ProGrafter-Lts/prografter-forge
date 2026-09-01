import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Reminder schedule (days since previous step):
// reminder #1 — sent 2 days after signup
// reminder #2 — sent 5 days after reminder #1 (~7 days after signup)
// reminder #3 — sent 7 days after reminder #2 (~14 days after signup)
const SCHEDULE_DAYS = [2, 5, 7] as const
const MAX_REMINDERS = 3

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const { data: pendingTrades, error } = await supabase
      .from('trades')
      .select('id, name, user_id, created_at, verification_reminder_count, last_verification_reminder_at')
      .is('submitted_for_review_at', null)
      .eq('verification_status', 'pending')
      .eq('is_test', false)
      .lt('verification_reminder_count', MAX_REMINDERS)

    if (error) throw error

    const now = Date.now()
    const due = (pendingTrades ?? []).filter((t) => {
      const count = t.verification_reminder_count ?? 0
      const intervalDays = SCHEDULE_DAYS[count]
      const since = count === 0
        ? new Date(t.created_at).getTime()
        : new Date(t.last_verification_reminder_at ?? t.created_at).getTime()
      return now - since >= intervalDays * 24 * 60 * 60 * 1000
    })

    let sent = 0
    const results: Array<{ id: string; status: string; error?: string }> = []

    for (const trade of due) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', trade.user_id)
        .maybeSingle()

      if (!profile?.email) {
        results.push({ id: trade.id, status: 'skipped_no_email' })
        continue
      }

      const reminderNumber = (trade.verification_reminder_count ?? 0) + 1

      const { error: sendErr } = await supabase.functions.invoke('send-app-email', {
        body: {
          templateName: 'trade-finish-verification',
          recipientEmail: profile.email,
          idempotencyKey: `trade-finish-verif-${trade.id}-${reminderNumber}`,
          templateData: {
            name: profile.full_name?.split(' ')[0] ?? trade.name?.split(' ')[0],
            reminderNumber,
          },
        },
      })

      if (sendErr) {
        results.push({ id: trade.id, status: 'send_error', error: sendErr.message })
        continue
      }

      const { error: updErr } = await supabase
        .from('trades')
        .update({
          verification_reminder_count: reminderNumber,
          last_verification_reminder_at: new Date().toISOString(),
        })
        .eq('id', trade.id)

      if (updErr) {
        results.push({ id: trade.id, status: 'update_error', error: updErr.message })
        continue
      }

      sent++
      results.push({ id: trade.id, status: `sent_reminder_${reminderNumber}` })
    }

    return new Response(
      JSON.stringify({ ok: true, considered: pendingTrades?.length ?? 0, due: due.length, sent, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('send-trade-verification-reminders error', err)
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
