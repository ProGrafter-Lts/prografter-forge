// Manual admin escalation: releases the next batch of trades for a job.
// Shares its implementation with the automatic 48h escalation job so both
// paths behave identically; every release is logged to job_escalation_events
// with source 'manual' vs 'auto_48h'.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { releaseNextBatch, logEscalation } from '../_shared/release-batch.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: userData } = await supabase.auth.getUser(token)
  const userId = userData?.user?.id
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Admin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let jobId = ''
  try {
    const body = await req.json()
    jobId = String(body.job_id || body.jobId || '')
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'job_id required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const result = await releaseNextBatch(supabase, jobId)

  if (result.released > 0) {
    const { data: anyInv } = await supabase
      .from('job_trade_invitations')
      .select('brief_id').eq('job_id', jobId).limit(1).maybeSingle()
    await logEscalation(supabase, {
      job_id: jobId,
      brief_id: anyInv?.brief_id ?? null,
      source: 'manual',
      released_count: result.released,
      note: `Manually escalated by admin — ${result.released} trade(s) released (batch ${result.batch_number}).`,
      actor_user_id: userId,
    })
  }

  return new Response(JSON.stringify({ ok: true, ...result }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
