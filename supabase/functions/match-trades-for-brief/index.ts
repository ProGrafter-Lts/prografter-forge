import { createClient } from 'npm:@supabase/supabase-js@2'
import { CATEGORY_TRADE_TYPES, rankTrades, type TradeCandidate } from '../_shared/trade-matching.ts'

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

  let briefId = ''
  try {
    const body = await req.json()
    briefId = String(body.brief_id || body.briefId || '')
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
    .select('id, postcode, trade_category_id, job_id')
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

  let q = supabase
    .from('trades')
    .select('id, name, company_name, postcode, user_id, service_radius_miles, trade_type, verified, accepting_jobs, avg_rating, review_count')
    .eq('verified', true)
    .eq('accepting_jobs', true)
    .eq('is_test', false)
  if (acceptedTypes.length) q = q.in('trade_type', acceptedTypes)
  const { data: candidates } = await q

  const ranked = await rankTrades((candidates || []) as TradeCandidate[], brief.postcode || '')

  // Which candidates already have an invitation for this job?
  let invited: Record<string, { status: string; released: boolean; batch_number: number }> = {}
  if (brief.job_id) {
    const { data: invs } = await supabase
      .from('job_trade_invitations')
      .select('trade_id, status, released, batch_number')
      .eq('job_id', brief.job_id)
    for (const iv of invs || []) {
      invited[iv.trade_id] = { status: iv.status, released: iv.released, batch_number: iv.batch_number }
    }
  }

  const result = ranked.map((t) => ({
    id: t.id,
    name: t.name,
    company_name: t.company_name,
    trade_type: t.trade_type,
    postcode: t.postcode,
    distance_miles: t.distance_miles,
    avg_rating: t.avg_rating,
    review_count: t.review_count,
    rank: t.rank,
    invitation: invited[t.id] || null,
  }))

  return new Response(JSON.stringify({ ok: true, trades: result }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
