import { createClient } from 'npm:@supabase/supabase-js@2'
import { notifyTrade } from '../_shared/trade-notify.ts'
import { CATEGORY_TRADE_TYPES, rankTrades, type TradeCandidate } from '../_shared/trade-matching.ts'

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

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
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

  let briefId = ''
  let overrideReason: string | null = null
  let blockingFlags: unknown[] = []
  let selectedTradeIds: string[] | null = null
  let waitingListIds: string[] = []
  try {
    const body = await req.json()
    briefId = String(body.brief_id || body.briefId || '')
    overrideReason = body.override_reason ? String(body.override_reason) : null
    blockingFlags = Array.isArray(body.blocking_flags) ? body.blocking_flags : []
    if (Array.isArray(body.trade_ids)) selectedTradeIds = body.trade_ids.map((x: unknown) => String(x))
    if (Array.isArray(body.waiting_list_ids)) waitingListIds = body.waiting_list_ids.map((x: unknown) => String(x))
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!briefId) {
    return new Response(JSON.stringify({ error: 'brief_id required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: brief } = await supabase
    .from('job_briefs')
    .select('id, ref, city, postcode, address_line1, address_line2, trade_category_id, job_title, job_description, budget_band, homeowner_id, job_id')
    .eq('id', briefId)
    .maybeSingle()
  if (!brief) {
    return new Response(JSON.stringify({ error: 'Brief not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const acceptedTypes = brief.trade_category_id
    ? (CATEGORY_TRADE_TYPES[brief.trade_category_id] || [])
    : []

  // Candidate trades: verified, accepting jobs, matching category.
  let q = supabase
    .from('trades')
    .select('id, name, company_name, postcode, user_id, service_radius_miles, trade_type, verified, accepting_jobs, avg_rating, review_count')
    .eq('verified', true)
    .eq('accepting_jobs', true)
    .eq('is_test', false)
  if (acceptedTypes.length) q = q.in('trade_type', acceptedTypes)
  const { data: candidates } = await q

  const ranked = await rankTrades((candidates || []) as TradeCandidate[], brief.postcode || '')

  // Determine batch-1 (released now) and waiting-list trades.
  // If admin supplied an explicit selection, honour it; otherwise auto top 3.
  let batch1 = selectedTradeIds && selectedTradeIds.length
    ? ranked.filter((t) => selectedTradeIds!.includes(t.id)).slice(0, MAX_BATCH)
    : ranked.slice(0, MAX_BATCH)

  const batch1Ids = new Set(batch1.map((t) => t.id))
  // Waiting list = admin-chosen extras OR the remaining ranked trades.
  const waiting = (waitingListIds.length
    ? ranked.filter((t) => waitingListIds.includes(t.id) && !batch1Ids.has(t.id))
    : ranked.filter((t) => !batch1Ids.has(t.id)))

  // Ensure a live `jobs` row exists so matched trades can see it on dashboards.
  let jobId = brief.job_id as string | null
  if (!jobId && brief.homeowner_id) {
    const address = [brief.address_line1, brief.address_line2, brief.city]
      .filter(Boolean).join(', ') || brief.city || brief.postcode || 'Address on file'
    const { data: createdJob, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        homeowner_id: brief.homeowner_id,
        // Canonical reference: the job inherits the brief's ref (one ref per project).
        ref: brief.ref,
        title: brief.job_title || 'Home project',
        job_type: acceptedTypes[0] || brief.trade_category_id || 'General',
        description: brief.job_description || brief.job_title || 'See brief for details.',
        address,
        postcode: brief.postcode || '',
        budget: brief.budget_band || null,
        status: 'awaiting_quotes',
        stage: 'quoting',
        is_test: false,
      })
      .select('id')
      .maybeSingle()
    if (jobErr) console.error('[publish-job-brief] failed to create job', jobErr)
    else {
      jobId = createdJob?.id ?? null
      if (jobId) {
        await supabase.from('job_briefs').update({ job_id: jobId }).eq('id', brief.id)
        // Backfill file links now that a job exists.
        await supabase.from('job_brief_files').update({ job_id: jobId }).eq('job_brief_id', brief.id)
      }
    }
  }

  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Could not resolve job for brief' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESPONSE_WINDOW_HOURS * 3600 * 1000)

  // Existing invitations (idempotent re-publish).
  const { data: existingInvs } = await supabase
    .from('job_trade_invitations')
    .select('trade_id, released')
    .eq('job_id', jobId)
  const existingByTrade = new Map((existingInvs || []).map((r: any) => [r.trade_id, r]))

  // Upsert released batch-1 invitations.
  const releasedRows = batch1.filter((t) => !existingByTrade.get(t.id)?.released).map((t) => ({
    job_id: jobId,
    brief_id: brief.id,
    trade_id: t.id,
    batch_number: 1,
    status: 'invited',
    released: true,
    rank: t.rank,
    distance_miles: t.distance_miles,
    invited_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }))
  if (releasedRows.length) {
    const { error } = await supabase.from('job_trade_invitations')
      .upsert(releasedRows, { onConflict: 'job_id,trade_id' })
    if (error) console.error('[publish-job-brief] invitation upsert failed', error)
  }

  // Waiting-list invitations (unreleased, batch >= 2, grouped in threes).
  const waitingRows = waiting
    .filter((t) => !existingByTrade.has(t.id))
    .map((t, i) => ({
      job_id: jobId,
      brief_id: brief.id,
      trade_id: t.id,
      batch_number: 2 + Math.floor(i / MAX_BATCH),
      status: 'invited',
      released: false,
      rank: t.rank,
      distance_miles: t.distance_miles,
    }))
  if (waitingRows.length) {
    const { error } = await supabase.from('job_trade_invitations')
      .upsert(waitingRows, { onConflict: 'job_id,trade_id' })
    if (error) console.error('[publish-job-brief] waiting-list upsert failed', error)
  }

  // Create job_matches for released trades (drives trade dashboard visibility + RLS).
  const { data: existingMatches } = await supabase
    .from('job_matches').select('trade_id').eq('job_id', jobId)
  const matchedIds = new Set((existingMatches || []).map((r: any) => r.trade_id))
  const matchRows = batch1.filter((t) => t.id && !matchedIds.has(t.id)).map((t) => ({
    job_id: jobId,
    trade_id: t.id,
    status: 'notified',
    notified_at: now.toISOString(),
    estimated_value: brief.budget_band || null,
    is_test: false,
  }))
  if (matchRows.length) {
    const { error } = await supabase.from('job_matches').insert(matchRows)
    if (error) console.error('[publish-job-brief] job_matches insert failed', error)
  }

  // Emails to newly released trades.
  const reference = brief.ref
  const jobTitle = brief.job_title || 'A new job'
  const summary = brief.job_description
    ? (brief.job_description.length > 280 ? brief.job_description.slice(0, 277) + '…' : brief.job_description)
    : undefined
  const tradeLabel = acceptedTypes[0] || brief.trade_category_id || undefined
  const location = brief.city || 'your area'
  const valueBand = brief.budget_band || undefined
  const briefUrl = `${SITE_URL}/project/${jobId}`

  // Invitation ids (post-upsert) so in-app notifications dedupe per invitation.
  const { data: invRows } = await supabase
    .from('job_trade_invitations').select('id, trade_id').eq('job_id', jobId)
  const invIdByTrade = new Map((invRows || []).map((r: any) => [r.trade_id, r.id]))

  const sends: Promise<unknown>[] = []
  for (const t of batch1) {
    if (!t.user_id || existingByTrade.get(t.id)?.released) continue
    await notifyTrade(supabase, {
      tradeId: t.id,
      userId: t.user_id,
      type: 'new_lead',
      title: 'New lead available',
      body: `${jobTitle}${brief.city ? ` — ${brief.city}` : ''}. You have 48 hours to accept or decline.`,
      link: briefUrl,
      jobId: jobId,
      invitationId: invIdByTrade.get(t.id) ?? null,
    })
    const { data: tp } = await supabase.from('profiles').select('email').eq('user_id', t.user_id).maybeSingle()
    if (!tp?.email) continue
    sends.push(supabase.functions.invoke('send-app-email', {
      body: {
        templateName: 'new-job-in-area',
        recipientEmail: tp.email,
        idempotencyKey: `new-job-${brief.id}-${t.id}`,
        templateData: {
          tradeFirstName: t.name?.split(' ')[0],
          reference, jobTitle, summary, trade: tradeLabel, valueBand, location, briefUrl,
        },
      },
    }))
  }
  const results = await Promise.allSettled(sends)
  results.forEach((r) => { if (r.status === 'rejected') console.error('[publish-job-brief] send failed', r.reason) })

  // Count total invited across all batches for homeowner-facing number.
  const totalReleased = new Set([...batch1.map((t) => t.id), ...matchedIds]).size

  await supabase.from('job_briefs').update({
    status: 'published_to_trades',
    published_at: now.toISOString(),
    matched_trade_count: totalReleased,
    published_by: userId,
    ...(overrideReason ? { override_reason: overrideReason } : {}),
  }).eq('id', brief.id)

  // Log override if this was a flagged publish.
  if (overrideReason) {
    await supabase.from('job_publish_overrides').insert({
      job_id: jobId,
      brief_id: brief.id,
      admin_id: userId,
      override_reason: overrideReason,
      blocking_flags: blockingFlags,
    })
  }

  return new Response(JSON.stringify({
    ok: true,
    matched: batch1.length,
    released: releasedRows.length,
    waiting: waitingRows.length,
    emailed: sends.length,
    job_id: jobId,
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
