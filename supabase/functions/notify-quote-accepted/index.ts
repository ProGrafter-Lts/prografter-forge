import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://prografter.co.uk'
const ADMIN_EMAIL = 'hello@prografter.co.uk'

const gbp = (n: number) =>
  `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Parse the body first: public quote links authenticate with the quote's
  // accept token rather than a user session.
  let quoteId: string
  let token = ''
  try {
    const body = await req.json()
    quoteId = String(body.quote_id || body.quoteId || '')
    token = String(body.token || '')
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!quoteId) {
    return new Response(JSON.stringify({ error: 'quote_id required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // An authenticated caller is optional when a valid accept token is supplied.
  const authHeader = req.headers.get('Authorization')
  let callerId: string | null = null
  if (authHeader?.startsWith('Bearer ')) {
    const { data: authData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    callerId = authData?.user?.id ?? null
  }
  if (!callerId && !token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }


  const { data: quote } = await supabase
    .from('quotes')
    .select('id, reference, amount, job_id, trade_id, accept_token, tier_enabled, selected_tier, budget_price, standard_price, premium_price')
    .eq('id', quoteId)
    .maybeSingle()
  if (!quote) {
    return new Response(JSON.stringify({ error: 'Quote not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const acceptedAmount = quote.tier_enabled
    ? (quote.selected_tier === 'budget' ? quote.budget_price
      : quote.selected_tier === 'premium' ? quote.premium_price
      : quote.standard_price) ?? quote.amount
    : quote.amount

  const { data: job } = await supabase
    .from('jobs')
    .select('id, ref, title, job_type, description, estimated_start_date, homeowner_id')
    .eq('id', quote.job_id)
    .maybeSingle()

  const { data: homeowner } = await supabase
    .from('homeowners')
    .select('name, email, phone, user_id')
    .eq('id', job?.homeowner_id)
    .maybeSingle()

  const { data: trade } = await supabase
    .from('trades')
    .select('name, company_name, phone, user_id')
    .eq('id', quote.trade_id)
    .maybeSingle()

  // A party to this quote, an admin, or the holder of the quote's accept token
  // (the homeowner following the emailed public link) may trigger these emails.
  const tokenValid = !!token && !!quote.accept_token && token === quote.accept_token
  if (!tokenValid) {
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: callerId, _role: 'admin' })
    if (!isAdmin && callerId !== homeowner?.user_id && callerId !== trade?.user_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  let tradeEmail: string | null = null
  if (trade?.user_id) {
    const { data: tp } = await supabase
      .from('profiles').select('email').eq('user_id', trade.user_id).maybeSingle()
    tradeEmail = tp?.email ?? null
  }


  const reference = job?.ref || quote.reference || '—'
  const projectTitle = job?.title || job?.job_type || 'the project'
  const summary = job?.description || undefined
  const amountStr = gbp(acceptedAmount)
  const homeownerName = homeowner?.name || 'The homeowner'
  const tradeName = trade?.company_name || trade?.name || 'the trade'
  const timeline = job?.estimated_start_date
    ? new Date(job.estimated_start_date).toLocaleDateString('en-GB')
    : undefined
  const workspaceUrl = `${SITE_URL}/project/${quote.job_id}`
  const contractUrl = `${SITE_URL}/project/${quote.job_id}/contract`

  const sends: Promise<unknown>[] = []

  if (tradeEmail) {
    sends.push(supabase.functions.invoke('send-app-email', {
      body: {
        templateName: 'quote-accepted-trade',
        recipientEmail: tradeEmail,
        idempotencyKey: `quote-accepted-trade-${quote.id}`,
        templateData: {
          tradeFirstName: trade?.name?.split(' ')[0],
          reference, projectTitle, summary, amount: amountStr,
          homeownerName, homeownerPhone: homeowner?.phone || undefined,
          homeownerEmail: homeowner?.email || undefined,
          timeline, workspaceUrl,
        },
      },
    }))
  }

  if (homeowner?.email) {
    sends.push(supabase.functions.invoke('send-app-email', {
      body: {
        templateName: 'quote-accepted-homeowner',
        recipientEmail: homeowner.email,
        idempotencyKey: `quote-accepted-homeowner-${quote.id}`,
        templateData: {
          homeownerFirstName: homeowner.name?.split(' ')[0],
          reference, projectTitle, amount: amountStr,
          tradeName, tradePhone: trade?.phone || undefined,
          // Homeowner-facing contact is always the ProGrafter address —
          // never a trade's personal inbox.
          tradeEmail: 'hello@prografter.co.uk',
          workspaceUrl: contractUrl,
        },
      },
    }))
  }

  sends.push(supabase.functions.invoke('send-app-email', {
    body: {
      templateName: 'quote-accepted-admin',
      recipientEmail: ADMIN_EMAIL,
      idempotencyKey: `quote-accepted-admin-${quote.id}`,
      templateData: {
        reference, projectTitle, amount: amountStr,
        homeownerName, tradeName,
        adminUrl: `${SITE_URL}/admin/job-briefs`,
      },
    },
  }))

  const results = await Promise.allSettled(sends)
  results.forEach((r) => {
    if (r.status === 'rejected') console.error('[notify-quote-accepted] send failed', r.reason)
  })

  return new Response(JSON.stringify({ ok: true, sent: results.length }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
