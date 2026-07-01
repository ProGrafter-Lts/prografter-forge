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

// Title-case a free-text address line.
function titleCase(v: string | null): string | null {
  if (!v) return v
  return v.trim().toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase())
}
// Remove a duplicated town/city accidentally appended to a line.
function dedupeLine(line: string | null, town: string | null): string | null {
  if (!line || !town) return line
  const t = town.trim().toLowerCase()
  const out = line.split(',').map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== t).join(', ')
  return out || null
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

function randomSessionPassword(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('') + 'Aa1!'
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
  // Dual-role: an existing trade (or any) account may ALSO post jobs as a
  // homeowner. We never overwrite an existing non-homeowner user_type — we just
  // ensure a homeowner record exists alongside it.
  let existingUserType: string | null = null
  // A one-use browser handoff password establishes day-one session access.
  // The homeowner never sees or chooses a password; returning homeowners use
  // the separate magic-link path.
  const sessionPassword = randomSessionPassword()
  const emailLower = email.toLowerCase()
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, user_type')
      .eq('email', emailLower)
      .maybeSingle()
    if (existingProfile?.user_id) {
      existingUserType = existingProfile.user_type ?? null
      homeownerUserId = existingProfile.user_id
      // Keep a trade account's type intact; only default new/plain accounts to homeowner.
      const metaUserType = existingUserType && existingUserType !== 'homeowner' ? existingUserType : 'homeowner'
      const { error: updateErr } = await supabase.auth.admin.updateUserById(homeownerUserId, {
        password: sessionPassword,
        email_confirm: true,
        user_metadata: { user_type: metaUserType, full_name, phone, postcode },
      })
      if (updateErr) console.error('[submit-job-brief] existing account password handoff failed', updateErr)
    }


    // Try to create if no existing profile was found. If the auth user already
    // exists without a profile, fall back to a return link rather than touching
    // an unknown/trade account.
    let createErr: unknown = null
    if (!homeownerUserId) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: emailLower,
        password: sessionPassword,
        email_confirm: true,
        user_metadata: { user_type: 'homeowner', full_name, phone, postcode },
      })
      createErr = error
      if (!error) homeownerUserId = created.user?.id ?? null
    }

    if (!homeownerUserId && createErr) {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: emailLower,
        options: { redirectTo: `${SITE_URL}${DASHBOARD_PATH}` },
      })
      if (linkErr) {
        console.error('[submit-job-brief] generateLink (existing user) failed', linkErr)
      } else {
        if (linkData?.user?.user_metadata?.user_type) {
          existingUserType = linkData.user.user_metadata.user_type
        }
        homeownerUserId = linkData?.user?.id ?? null
        if (homeownerUserId) {
          const metaUserType = existingUserType && existingUserType !== 'homeowner' ? existingUserType : 'homeowner'
          const { error: updateErr } = await supabase.auth.admin.updateUserById(homeownerUserId, {
            password: sessionPassword,
            email_confirm: true,
            user_metadata: { user_type: metaUserType, full_name, phone, postcode },
          })
          if (updateErr) console.error('[submit-job-brief] fallback account password handoff failed', updateErr)
        }
      }
    }

  } catch (e) {
    console.error('[submit-job-brief] account creation failed', e)
  }

  if (homeownerUserId) {
    // The handle_new_user trigger creates profile + homeowner for new users.
    // For pre-existing users (or trigger gaps) ensure rows exist.
    // Preserve an existing trade account's user_type — dual-role accounts keep
    // their trade profile while gaining a homeowner record.
    const profileType = existingUserType && existingUserType !== 'homeowner' ? existingUserType : 'homeowner'
    await supabase.from('profiles').upsert(
      { user_id: homeownerUserId, email, full_name, user_type: profileType, postcode, phone },
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
    address_line1: dedupeLine(titleCase(address_line1), titleCase(city)),
    address_line2: dedupeLine(titleCase(clean(body.address_line2)), titleCase(city)),
    city: titleCase(city),
    postcode: postcode.toUpperCase(),
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

  // The browser signs in immediately with the private one-use handoff above,
  // then sends the separate return-path magic-link email from the signed-in session.
  const loginUrl = `${SITE_URL}${DASHBOARD_PATH}`


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

  return new Response(JSON.stringify({
    ref,
    loginUrl,
    sessionEmail: homeownerUserId ? emailLower : null,
    sessionPassword: homeownerUserId ? sessionPassword : null,
    accountCreated: !!homeownerUserId,
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
