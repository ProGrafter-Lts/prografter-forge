import { createClient } from 'npm:@supabase/supabase-js@2'
import { enqueueTransactionalEmail } from '../_shared/enqueue-transactional-email.ts'

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
const SITE_URL = 'https://prografter.co.uk'
const DASHBOARD_PATH = '/dashboard/homeowner'
// TOGGLE: grant each homeowner ONE free Quote Check on their first job post.
// Set to false to charge £49 from the very first check.
const GRANT_FREE_FIRST_CHECK = true

// Parse a free-text "quotes received" answer (e.g. "0", "1-2", "3+") to an int.
function parseQuotesCount(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.trunc(v))
  if (typeof v !== 'string') return 0
  const m = v.match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

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

  // Use the reference generated on the client when the brief was first opened,
  // so preview / confirmation / emails / admin all share ONE identifier.
  // Only fall back to generating here if the client did not supply a valid ref.
  const providedRef = clean(body.ref)
  const ref = providedRef && /^PG-[A-HJ-NP-Z2-9]{6}$/.test(providedRef) ? providedRef : generateRef()
  const trade_category_id = clean(body.trade_category_id)
  const tradeName = (trade_category_id && TRADE_NAMES[trade_category_id]) || trade_category_id || '—'

  const marketingOptIn = body.marketing_opt_in === true
  const existing_quotes_count = parseQuotesCount(body.existing_quotes_count ?? body.quotes_received)

  // --- Passwordless account creation (brief submission IS the sign-up) ---
  // Find or create the auth user for this email, then ensure profile + homeowner.
  let homeownerUserId: string | null = null
  let homeownerId: string | null = null
  try {
    const emailLower = email.toLowerCase()
    // Try to create; if the user already exists we look them up instead.
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: emailLower,
      email_confirm: true,
      user_metadata: { user_type: 'homeowner', full_name, phone, postcode },
    })
    if (createErr) {
      // Likely already registered — find the existing user by paging the list.
      let page = 1
      while (page <= 20 && !homeownerUserId) {
        const { data: list } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
        const found = list?.users?.find((u) => (u.email ?? '').toLowerCase() === emailLower)
        if (found) homeownerUserId = found.id
        if (!list || list.users.length < 200) break
        page++
      }
    } else {
      homeownerUserId = created.user?.id ?? null
    }
  } catch (e) {
    console.error('[submit-job-brief] account creation failed', e)
  }

  if (homeownerUserId) {
    // The handle_new_user trigger creates profile + homeowner for new users.
    // For pre-existing users (or trigger gaps) ensure rows exist.
    await supabase.from('profiles').upsert(
      { user_id: homeownerUserId, email, full_name, user_type: 'homeowner', postcode, phone },
      { onConflict: 'user_id' },
    )
    const { data: ho } = await supabase
      .from('homeowners').select('id').eq('user_id', homeownerUserId).maybeSingle()
    if (ho?.id) {
      homeownerId = ho.id
    } else {
      const { data: newHo } = await supabase
        .from('homeowners').insert({ user_id: homeownerUserId, name: full_name, email, phone })
        .select('id').single()
      homeownerId = newHo?.id ?? null
    }

    // Consent log (terms always; marketing per opt-in)
    await supabase.from('consents_log').insert([
      { user_id: homeownerUserId, consent_type: 'terms', consented: true, user_agent: clean(body.user_agent) },
      { user_id: homeownerUserId, consent_type: 'marketing', consented: marketingOptIn, user_agent: clean(body.user_agent) },
    ])

    // Grant ONE free quote-check entitlement on first job post (if none yet).
    if (GRANT_FREE_FIRST_CHECK) {
      const { data: existingEnt } = await supabase
        .from('quote_check_entitlements').select('id').eq('user_id', homeownerUserId).limit(1)
      if (!existingEnt || existingEnt.length === 0) {
        await supabase.from('quote_check_entitlements').insert({ user_id: homeownerUserId, source: 'first_job_post' })
      }
    }
  }

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
    // Admin flags. needs_planning_guidance is recomputed server-side from the
    // answers ("I'm not sure — guide me") so it can't be spoofed/omitted.
    needs_scoping: body.needs_scoping === true,
    needs_planning_guidance:
      body.needs_planning_guidance === true ||
      /guide me/i.test(String(body.planning_permission ?? '')) ||
      /guide me/i.test(String(body.building_regs ?? '')),
    is_test: body.is_test === true,
    homeowner_user_id: homeownerUserId,
    homeowner_id: homeownerId,
    existing_quotes_count,
    status: 'under_review',
  }

  const { error: insertErr } = await supabase.from('job_briefs').insert(record)
  if (insertErr) {
    console.error('[submit-job-brief] insert failed', insertErr)
    return new Response(JSON.stringify({ error: 'Could not save brief' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const fullAddress = [address_line1, clean(body.address_line2), city].filter(Boolean).join(', ')

  // Generate a magic-link login that lands the homeowner on their dashboard.
  let loginUrl = `${SITE_URL}/login`
  if (homeownerUserId) {
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email.toLowerCase(),
        options: { redirectTo: `${SITE_URL}${DASHBOARD_PATH}` },
      })
      if (linkData?.properties?.action_link) loginUrl = linkData.properties.action_link
    } catch (e) {
      console.error('[submit-job-brief] magic link failed', e)
    }
  }


  // Send homeowner confirmation + admin notification. Failures here must not
  // lose the brief — it is already saved.
  const sends = [
    enqueueTransactionalEmail(supabase, {
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
        loginUrl,
      },
    }),
    enqueueTransactionalEmail(supabase, {
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
        needsScoping: record.needs_scoping,
        needsPlanningGuidance: record.needs_planning_guidance,
        adminUrl: ADMIN_URL,
      },
    }),
  ]

  const results = await Promise.allSettled(sends)
  results.forEach((r, i) => {
    const which = i === 0 ? 'homeowner' : 'admin'
    if (r.status === 'rejected') console.error(`[submit-job-brief] ${which} email failed`, r.reason)
    else if (r.value.error) console.error(`[submit-job-brief] ${which} email error`, r.value.error)
  })

  return new Response(JSON.stringify({ ref, loginUrl, accountCreated: !!homeownerUserId }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
