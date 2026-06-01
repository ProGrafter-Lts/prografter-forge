import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TRADE_NAMES: Record<string, string> = {
  electrician: 'Electrician',
  gas_engineer: 'Gas Engineer',
  general_builder: 'General Builder',
  plasterer: 'Plasterer',
  carpenter: 'Carpenter / Joiner',
  tiler: 'Tiler',
  decorator: 'Decorator / Painter',
  roofer: 'Roofer',
  plumber: 'Plumber',
  landscaper: 'Landscaper',
}

const ADMIN_EMAIL = 'hello@prografter.co.uk'
const ADMIN_URL = 'https://prografter.co.uk/admin/job-briefs'

function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = 'PG-'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < 6; i++) r += chars[bytes[i] % chars.length]
  return r
}

function clean(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length ? t : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Validate the minimum required fields
  const full_name = clean(body.full_name)
  const email = clean(body.email)
  const phone = clean(body.phone)
  const address_line1 = clean(body.address_line1)
  const city = clean(body.city)
  const postcode = clean(body.postcode)

  if (!full_name || !email || !/\S+@\S+\.\S+/.test(email) || !phone || !address_line1 || !city || !postcode) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const ref = generateRef()
  const trade_category_id = clean(body.trade_category_id)
  const tradeName = (trade_category_id && TRADE_NAMES[trade_category_id]) || trade_category_id || '—'

  const record = {
    ref,
    full_name,
    email,
    phone,
    address_line1,
    address_line2: clean(body.address_line2),
    city,
    postcode,
    property_type: clean(body.property_type),
    trade_category_id,
    job_title: clean(body.job_title),
    job_description: clean(body.job_description),
    planning_permission: clean(body.planning_permission),
    building_regs: clean(body.building_regs),
    scope_items: clean(body.scope_items),
    known_issues: clean(body.known_issues),
    access_arrangement: clean(body.access_arrangement),
    parking_available: clean(body.parking_available),
    preferred_days: clean(body.preferred_days),
    additional_notes: clean(body.additional_notes),
    budget_band: clean(body.budget_band),
    timeline: clean(body.timeline),
    quotes_received: clean(body.quotes_received),
    decision_criteria: clean(body.decision_criteria),
    is_test: body.is_test === true,
  }

  const { error: insertErr } = await supabase.from('job_briefs').insert(record)
  if (insertErr) {
    console.error('[submit-job-brief] insert failed', insertErr)
    return new Response(JSON.stringify({ error: 'Could not save brief' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const fullAddress = [address_line1, clean(body.address_line2), city].filter(Boolean).join(', ')

  // Send homeowner confirmation + admin notification. Failures here must not
  // lose the brief — it is already saved.
  const sends = [
    supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'job-brief-homeowner',
        recipientEmail: email,
        idempotencyKey: `job-brief-homeowner-${ref}`,
        templateData: {
          name: full_name,
          reference: ref,
          jobTitle: record.job_title,
          trade: tradeName,
          budget: record.budget_band,
          timeline: record.timeline,
          description: record.job_description,
        },
      },
    }),
    supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'job-brief-admin',
        recipientEmail: ADMIN_EMAIL,
        idempotencyKey: `job-brief-admin-${ref}`,
        templateData: {
          reference: ref,
          name: full_name,
          email,
          phone,
          address: fullAddress,
          postcode,
          propertyType: record.property_type,
          jobTitle: record.job_title,
          trade: tradeName,
          description: record.job_description,
          budget: record.budget_band,
          timeline: record.timeline,
          access: record.access_arrangement,
          planningPermission: record.planning_permission,
          buildingRegs: record.building_regs,
          scopeItems: record.scope_items,
          knownIssues: record.known_issues,
          notes: record.additional_notes,
          adminUrl: ADMIN_URL,
        },
      },
    }),
  ]

  const results = await Promise.allSettled(sends)
  results.forEach((r, i) => {
    const which = i === 0 ? 'homeowner' : 'admin'
    if (r.status === 'rejected') console.error(`[submit-job-brief] ${which} email failed`, r.reason)
    else if (r.value.error) console.error(`[submit-job-brief] ${which} email error`, r.value.error)
  })

  return new Response(JSON.stringify({ ref }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
