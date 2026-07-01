import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://prografter.co.uk'
const MAX_BATCH = 3
const RESPONSE_WINDOW_HOURS = 48

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

  // Next unreleased invitations by rank, capped at MAX_BATCH.
  const { data: pending } = await supabase
    .from('job_trade_invitations')
    .select('id, trade_id, brief_id, batch_number')
    .eq('job_id', jobId)
    .eq('released', false)
    .order('rank', { ascending: true, nullsFirst: false })
    .limit(MAX_BATCH)

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ ok: true, released: 0, message: 'No further trades to release.' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESPONSE_WINDOW_HOURS * 3600 * 1000)
  const batchNumber = Math.max(...pending.map((p) => p.batch_number || 2))

  // Release: mark invitations, create job_matches.
  const ids = pending.map((p) => p.id)
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
  const matchRows = pending.filter((p) => !matchedIds.has(p.trade_id)).map((p) => ({
    job_id: jobId,
    trade_id: p.trade_id,
    status: 'notified',
    notified_at: now.toISOString(),
    estimated_value: brief?.budget_band || null,
    is_test: false,
  }))
  if (matchRows.length) {
    const { error } = await supabase.from('job_matches').insert(matchRows)
    if (error) console.error('[release-next-batch] job_matches insert failed', error)
  }

  // Emails to the newly released trades.
  const briefUrl = `${SITE_URL}/project/${jobId}`
  const sends: Promise<unknown>[] = []
  for (const p of pending) {
    const { data: trade } = await supabase.from('trades').select('name, user_id').eq('id', p.trade_id).maybeSingle()
    if (!trade?.user_id) continue
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

  // Bump homeowner-facing matched count.
  const { count } = await supabase
    .from('job_matches').select('id', { count: 'exact', head: true }).eq('job_id', jobId)
  if (brief?.id != null) {
    await supabase.from('job_briefs').update({ matched_trade_count: count ?? null }).eq('id', brief.id)
  }

  return new Response(JSON.stringify({ ok: true, released: pending.length, batch_number: batchNumber, emailed: sends.length }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
