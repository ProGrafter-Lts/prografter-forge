import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://prografter.co.uk'

// Map homeowner-brief trade category slugs to trade_type labels used on trades.
const CATEGORY_TRADE_TYPES: Record<string, string[]> = {
  electrician: ['Electrician'],
  gas_engineer: ['Gas Engineer', 'Plumber'],
  plumber: ['Plumber'],
  general_builder: ['Builder', 'General Builder'],
  plasterer: ['Plasterer', 'Builder'],
  carpenter: ['Carpenter', 'Joiner'],
  tiler: ['Tiler'],
  decorator: ['Decorator', 'Painter'],
  roofer: ['Roofer'],
  landscaper: ['Landscaper'],
}

// Haversine distance in miles
function milesBetween(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0]); const lat2 = toRad(b[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

async function geocode(postcodes: string[]): Promise<Record<string, [number, number]>> {
  const out: Record<string, [number, number]> = {}
  const cleaned = [...new Set(postcodes.map((p) => p.trim()).filter(Boolean))]
  for (let i = 0; i < cleaned.length; i += 100) {
    const chunk = cleaned.slice(i, i + 100)
    try {
      const res = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: chunk }),
      })
      const json = await res.json()
      for (const r of json.result || []) {
        if (r.result?.latitude != null) {
          out[r.query.toUpperCase().replace(/\s+/g, '')] = [r.result.latitude, r.result.longitude]
        }
      }
    } catch (e) {
      console.error('[publish-job-brief] geocode chunk failed', e)
    }
  }
  return out
}

const key = (p: string) => p.toUpperCase().replace(/\s+/g, '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Verify caller is an admin
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

  let briefId: string
  let overrideReason: string | null = null
  try {
    const body = await req.json()
    briefId = String(body.brief_id || body.briefId || '')
    overrideReason = body.override_reason ? String(body.override_reason) : null
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
    .select('id, ref, city, postcode, trade_category_id, job_title, job_description, budget_band')
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

  // Candidate trades: verified, accepting jobs, matching category
  let q = supabase
    .from('trades')
    .select('id, name, company_name, postcode, user_id, service_radius_miles')
    .eq('verified', true)
    .eq('accepting_jobs', true)
  if (acceptedTypes.length) q = q.in('trade_type', acceptedTypes)
  const { data: candidates } = await q

  const briefGeo = brief.postcode ? await geocode([brief.postcode]) : {}
  const briefPoint = briefGeo[key(brief.postcode || '')]

  const tradePostcodes = (candidates || []).map((t) => t.postcode || '').filter(Boolean)
  const tradeGeo = await geocode(tradePostcodes)

  const matched: typeof candidates = []
  for (const t of candidates || []) {
    if (!t.postcode || !briefPoint) continue
    const pt = tradeGeo[key(t.postcode)]
    if (!pt) continue
    const dist = milesBetween(briefPoint, pt)
    if (dist <= (t.service_radius_miles ?? 25)) matched.push(t)
  }

  const reference = brief.ref
  const jobTitle = brief.job_title || 'A new job'
  const summary = brief.job_description
    ? (brief.job_description.length > 280 ? brief.job_description.slice(0, 277) + '…' : brief.job_description)
    : undefined
  const tradeLabel = acceptedTypes[0] || brief.trade_category_id || undefined
  const location = brief.city || 'your area'
  const valueBand = brief.budget_band || undefined
  const briefUrl = `${SITE_URL}/dashboard`

  const sends: Promise<unknown>[] = []
  for (const t of matched) {
    if (!t.user_id) continue
    const { data: tp } = await supabase
      .from('profiles').select('email').eq('user_id', t.user_id).maybeSingle()
    if (!tp?.email) continue
    sends.push(supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'new-job-in-area',
        recipientEmail: tp.email,
        idempotencyKey: `new-job-${brief.id}-${t.id}`,
        templateData: {
          tradeFirstName: t.name?.split(' ')[0],
          reference, jobTitle, summary,
          trade: tradeLabel, valueBand, location, briefUrl,
        },
      },
    }))
  }

  const results = await Promise.allSettled(sends)
  results.forEach((r) => {
    if (r.status === 'rejected') console.error('[publish-job-brief] send failed', r.reason)
  })

  await supabase.from('job_briefs')
    .update({
      status: 'published_to_trades',
      published_at: new Date().toISOString(),
      matched_trade_count: matched.length,
      published_by: userId,
      ...(overrideReason ? { override_reason: overrideReason } : {}),
    })
    .eq('id', brief.id)

  return new Response(JSON.stringify({ ok: true, matched: matched.length, emailed: sends.length }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
