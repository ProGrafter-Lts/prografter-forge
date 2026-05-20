// Daily scan: find projects past their planned completion date and notify
// both trade and homeowner. Re-notify suppression: 14 days per recipient/job.
// Invoked by pg_cron (no auth required — gated by internal idempotency).

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const today = new Date().toISOString().slice(0, 10)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // Pull contracts with an estimated completion in the past, where the job
  // isn't yet complete. Use contracts.estimated_completion_date as the source
  // of truth for planned completion.
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('id, job_id, trade_id, estimated_completion_date')
    .lt('estimated_completion_date', today)
    .not('estimated_completion_date', 'is', null)
    .limit(500)

  if (error) {
    console.error('overdue scan: contract query failed', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let skipped = 0

  for (const c of contracts ?? []) {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('id, title, job_type, address, postcode, status, stage, homeowner_id, ref')
        .eq('id', c.job_id)
        .maybeSingle()

      // Skip if project is complete / closed
      if (!job) { skipped++; continue }
      const closedStates = ['complete', 'completed', 'closed', 'cancelled']
      if (closedStates.includes((job.status || '').toLowerCase()) ||
          closedStates.includes((job.stage || '').toLowerCase())) {
        skipped++; continue
      }

      // Suppression check: any project-overdue-* row for this job in last 14 days?
      const { data: recent } = await supabase
        .from('email_send_log')
        .select('id')
        .in('template_name', ['project-overdue-trade', 'project-overdue-homeowner'])
        .gte('created_at', fourteenDaysAgo)
        .ilike('error_message', `%${job.id}%`)
        .limit(1)
      // We can't easily attribute log rows to a job without a column, so use
      // a deterministic idempotency window: a per-14-day bucket key embedded
      // in the idempotency key on the send invocation below.

      const bucketStart = new Date()
      bucketStart.setUTCHours(0, 0, 0, 0)
      // Round down to a 14-day window starting from epoch — gives a stable bucket id
      const bucketId = Math.floor(bucketStart.getTime() / (14 * 24 * 60 * 60 * 1000))

      const projectTitle = job.title || job.job_type || 'your project'
      const projectAddress = [job.address, job.postcode].filter(Boolean).join(', ') || undefined
      const plannedCompletion = c.estimated_completion_date
        ? new Date(c.estimated_completion_date).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          })
        : undefined
      const reference = (job as any).ref || ''

      // Homeowner notification
      if (job.homeowner_id) {
        const { data: owner } = await supabase
          .from('homeowners')
          .select('email, name')
          .eq('id', job.homeowner_id)
          .maybeSingle()
        if (owner?.email) {
          const { data: trade } = await supabase
            .from('trades')
            .select('name, company_name')
            .eq('id', c.trade_id)
            .maybeSingle()
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'project-overdue-homeowner',
              recipientEmail: owner.email,
              idempotencyKey: `project-overdue-ho-${job.id}-${bucketId}`,
              templateData: {
                firstName: owner.name?.split(' ')[0],
                projectTitle,
                tradeName: trade?.company_name || trade?.name,
                plannedCompletion,
                jobId: job.id,
                reference,
              },
            },
          })
          sent++
        }
      }

      // Trade notification
      if (c.trade_id) {
        const { data: trade } = await supabase
          .from('trades')
          .select('name, company_name, user_id')
          .eq('id', c.trade_id)
          .maybeSingle()
        if (trade?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', trade.user_id)
            .maybeSingle()
          if (profile?.email) {
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'project-overdue-trade',
                recipientEmail: profile.email,
                idempotencyKey: `project-overdue-trade-${job.id}-${bucketId}`,
                templateData: {
                  firstName: profile.full_name?.split(' ')[0],
                  projectTitle,
                  projectAddress,
                  plannedCompletion,
                  jobId: job.id,
                  reference,
                },
              },
            })
            sent++
          }
        }
      }
    } catch (e) {
      console.error('overdue scan: per-contract error', e)
    }
  }

  return new Response(
    JSON.stringify({ ok: true, scanned: contracts?.length ?? 0, sent, skipped }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
