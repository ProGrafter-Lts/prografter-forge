import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://prografter.co.uk'
const ADMIN_EMAIL = 'hello@prografter.co.uk'

const gbp = (pence?: number | null) =>
  pence == null ? undefined : `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Require an authenticated caller.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const { data: authData, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  if (authErr || !authData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let disputeId: string
  try {
    const body = await req.json()
    disputeId = String(body.dispute_id || body.disputeId || '')
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!disputeId) {
    return new Response(JSON.stringify({ error: 'dispute_id required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, ref, job_id, raised_by_user_id, raised_by_role, reason_label, claimant_statement, desired_outcome, amount_disputed_pence, frozen_amount_pence')
    .eq('id', disputeId)
    .maybeSingle()
  if (!dispute) {
    return new Response(JSON.stringify({ error: 'Dispute not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, ref, title, job_type, homeowner_id')
    .eq('id', dispute.job_id)
    .maybeSingle()

  const { data: homeowner } = await supabase
    .from('homeowners')
    .select('user_id, name, email')
    .eq('id', job?.homeowner_id)
    .maybeSingle()

  // Resolve the trade party — prefer contract, fall back to job_matches
  let tradeId: string | null = null
  const { data: contract } = await supabase
    .from('contracts').select('trade_id').eq('job_id', dispute.job_id).maybeSingle()
  tradeId = contract?.trade_id ?? null
  if (!tradeId) {
    const { data: match } = await supabase
      .from('job_matches').select('trade_id').eq('job_id', dispute.job_id).limit(1).maybeSingle()
    tradeId = match?.trade_id ?? null
  }

  let trade: { name: string | null; company_name: string | null; user_id: string | null } | null = null
  let tradeEmail: string | null = null
  if (tradeId) {
    const { data: t } = await supabase
      .from('trades').select('name, company_name, user_id').eq('id', tradeId).maybeSingle()
    trade = t
    if (t?.user_id) {
      const { data: tp } = await supabase
        .from('profiles').select('email').eq('user_id', t.user_id).maybeSingle()
      tradeEmail = tp?.email ?? null
    }
  }

  // Only a party to this dispute (or an admin) may trigger these notifications.
  const callerId = authData.user.id
  const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: callerId, _role: 'admin' })
  if (!isAdmin && callerId !== homeowner?.user_id && callerId !== trade?.user_id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const reference = job?.ref || dispute.ref || '—'
  const projectTitle = job?.title || job?.job_type || 'the project'
  const issue = dispute.reason_label || undefined
  const tradeName = trade?.company_name || trade?.name || 'the trade'
  const homeownerName = homeowner?.name || 'the homeowner'

  const raisedByRoleLabel = dispute.raised_by_role === 'homeowner' ? 'the homeowner' : 'the trade'

  // Identify claimant vs other party
  const claimantIsHomeowner = dispute.raised_by_user_id === homeowner?.user_id
  const claimant = claimantIsHomeowner
    ? { email: homeowner?.email, name: homeownerName }
    : { email: tradeEmail, name: tradeName }
  const otherParty = claimantIsHomeowner
    ? { email: tradeEmail, name: tradeName }
    : { email: homeowner?.email, name: homeownerName }

  const workspaceUrl = `${SITE_URL}/disputes/${dispute.id}`
  const sends: Promise<unknown>[] = []

  if (otherParty.email) {
    sends.push(supabase.functions.invoke('send-app-email', {
      body: {
        templateName: 'dispute-raised-other-party',
        recipientEmail: otherParty.email,
        idempotencyKey: `dispute-other-${dispute.id}`,
        templateData: {
          recipientFirstName: otherParty.name?.split(' ')[0],
          reference, projectTitle, issue,
          raisedByRole: raisedByRoleLabel, workspaceUrl,
        },
      },
    }))
  }

  if (claimant.email) {
    sends.push(supabase.functions.invoke('send-app-email', {
      body: {
        templateName: 'dispute-raised-claimant',
        recipientEmail: claimant.email,
        idempotencyKey: `dispute-claimant-${dispute.id}`,
        templateData: {
          recipientFirstName: claimant.name?.split(' ')[0],
          reference, projectTitle, issue, workspaceUrl,
        },
      },
    }))
  }

  sends.push(supabase.functions.invoke('send-app-email', {
    body: {
      templateName: 'dispute-raised-admin',
      recipientEmail: ADMIN_EMAIL,
      idempotencyKey: `dispute-admin-${dispute.id}`,
      templateData: {
        reference, projectTitle,
        raisedByName: claimant.name, raisedByRole: dispute.raised_by_role,
        otherPartyName: otherParty.name,
        issue, desiredOutcome: dispute.desired_outcome || undefined,
        amountDisputed: gbp(dispute.amount_disputed_pence),
        escrowFrozen: gbp(dispute.frozen_amount_pence),
        adminUrl: `${SITE_URL}/admin/disputes`,
      },
    },
  }))

  const results = await Promise.allSettled(sends)
  results.forEach((r) => {
    if (r.status === 'rejected') console.error('[notify-dispute-raised] send failed', r.reason)
  })

  return new Response(JSON.stringify({ ok: true, sent: results.length }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
