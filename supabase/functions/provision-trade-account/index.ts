import { createClient } from 'npm:@supabase/supabase-js@2'
import { enqueueTransactionalEmail } from '../_shared/enqueue-transactional-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://prografter.co.uk'
const CALLBACK_PATH = '/auth/callback'

const TRADE_NAMES: Record<string, string> = {
  electrician: 'Electrician',
  gas_engineer: 'Gas Engineer',
  solar_pv: 'Solar PV Installer',
  heat_pump: 'Heat Pump Installer',
  ev_charger: 'EV Charger Installer',
  oil_boiler: 'Oil Boiler Engineer',
  plumber: 'Plumber',
  general_builder: 'General Builder',
  plasterer: 'Plasterer',
  carpenter: 'Carpenter / Joiner',
  tiler: 'Tiler',
  decorator: 'Decorator / Painter',
  roofer: 'Roofer',
  kitchen_bathroom_fitter: 'Kitchen / Bathroom Fitter',
  landscaper: 'Landscaper',
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // --- Verify the caller is an authenticated admin ---
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: caller.id, _role: 'admin' })
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Admin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // --- Parse input ---
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const applicationId = clean(body.applicationId)
  if (!applicationId) {
    return new Response(JSON.stringify({ error: 'applicationId is required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // --- Load the application ---
  const { data: app, error: appErr } = await supabase
    .from('trade_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle()

  if (appErr || !app) {
    return new Response(JSON.stringify({ error: 'Application not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const email = clean(app.applicant_email)
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return new Response(JSON.stringify({ error: 'Application has no valid email' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const emailLower = email.toLowerCase()

  const fd = (app.form_data ?? {}) as Record<string, unknown>
  const fullName = clean(app.full_name) || clean(fd.full_name) || ''
  const firstName = fullName.trim().split(/\s+/)[0] || ''
  const company = clean(app.business_name) || clean(fd.business_name) || fullName
  const phone = clean(fd.phone) || ''
  const postcode = (clean(fd.postcode) || '').toUpperCase()
  const tradeCategoryId = clean(app.trade_category_id) || clean(fd.trade_category_id) || ''
  const tradeType = TRADE_NAMES[tradeCategoryId] || tradeCategoryId || 'Other'

  const userMetadata = {
    user_type: 'trade',
    full_name: fullName,
    company_name: company,
    phone,
    postcode,
    trade_type: tradeType,
  }

  // --- Find or create the auth user ---
  let tradeUserId: string | null = null

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id, user_type')
    .eq('email', emailLower)
    .maybeSingle()

  // An account already used as a homeowner can ALSO be a trade (dual-role).
  // We never clobber an existing homeowner's primary type — we just attach a
  // verified trades row and route their login link to the trade dashboard.
  const existingType = existingProfile?.user_type ?? null
  const isDualHomeowner = existingType === 'homeowner'

  if (existingProfile?.user_id) {
    tradeUserId = existingProfile.user_id
    await supabase.auth.admin.updateUserById(tradeUserId, {
      email_confirm: true,
      // Preserve a homeowner's metadata; only set trade metadata for new/trade users.
      ...(isDualHomeowner ? {} : { user_metadata: userMetadata }),
    })
  }

  if (!tradeUserId) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: emailLower,
      email_confirm: true,
      user_metadata: userMetadata,
    })
    if (!createErr) {
      tradeUserId = created.user?.id ?? null
    } else {
      // User may already exist in auth without a profile — fall back to generateLink lookup.
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: emailLower,
        options: { redirectTo: `${SITE_URL}${CALLBACK_PATH}` },
      })
      tradeUserId = linkData?.user?.id ?? null
      if (tradeUserId) {
        await supabase.auth.admin.updateUserById(tradeUserId, {
          email_confirm: true,
          user_metadata: userMetadata,
        })
      }
    }
  }

  if (!tradeUserId) {
    return new Response(JSON.stringify({ error: 'Could not create or locate the trade account' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // --- Ensure profile + trades rows exist and are verified ---
  // Don't downgrade a dual homeowner's primary type.
  await supabase.from('profiles').upsert(
    {
      user_id: tradeUserId,
      email: emailLower,
      full_name: fullName,
      user_type: isDualHomeowner ? 'homeowner' : 'trade',
      postcode,
      phone,
    },
    { onConflict: 'user_id' },
  )

  const { data: existingTrade } = await supabase
    .from('trades')
    .select('id')
    .eq('user_id', tradeUserId)
    .maybeSingle()

  if (existingTrade?.id) {
    await supabase.from('trades').update({
      verified: true,
      verification_status: 'approved',
      verified_on_prografter_at: new Date().toISOString(),
    }).eq('id', existingTrade.id)
  } else {
    await supabase.from('trades').insert({
      user_id: tradeUserId,
      name: fullName,
      company_name: company,
      phone,
      postcode,
      trade_type: tradeType,
      verified: true,
      verification_status: 'approved',
      verified_on_prografter_at: new Date().toISOString(),
    })
  }

  // --- Generate a one-click magic login link ---
  let loginUrl = `${SITE_URL}/dashboard/trade`
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: emailLower,
    options: { redirectTo: `${SITE_URL}${CALLBACK_PATH}` },
  })
  if (!linkErr && linkData?.properties?.action_link) {
    loginUrl = linkData.properties.action_link
  } else if (linkErr) {
    console.error('[provision-trade-account] generateLink failed', linkErr)
  }

  // --- Send the verified + login email ---
  try {
    await enqueueTransactionalEmail(supabase, {
      templateName: 'trade-verified',
      recipientEmail: emailLower,
      idempotencyKey: `trade-verified-login-${applicationId}`,
      templateData: { firstName, loginUrl },
    })
  } catch (e) {
    console.error('[provision-trade-account] verified email failed', e)
  }

  return new Response(JSON.stringify({ ok: true, userId: tradeUserId }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
