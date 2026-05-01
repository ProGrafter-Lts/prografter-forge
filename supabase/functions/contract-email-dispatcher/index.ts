// supabase/functions/contract-email-dispatcher/index.ts
//
// Receives a contract_id + event_type from a Postgres trigger (via pg_net),
// fetches the contract context, formats data, and dispatches the appropriate
// transactional email(s) by invoking send-transactional-email. Also writes
// an `email_sent` audit row to contract_events for each successful enqueue.
//
// IMPORTANT: This function authenticates via a shared secret header
// (CONTRACT_DISPATCH_TOKEN) — it is called only from a SECURITY DEFINER
// trigger that knows the secret. JWT verification is OFF for this function.
//
// Supported event_type values:
//   'generated'            -> contract_generated           (both parties)
//   'signed_partial'       -> contract_awaiting_signature  (other party)
//   'activated'            -> contract_activated           (both parties)
//   'variation_proposed'   -> variation_proposed           (receiving party)
//   'variation_approved'   -> variation_approved           (both parties)
//   'completion_marked'    -> completion_marked            (homeowner)
//   'completion_accepted'  -> completion_accepted          (both parties)

import { createClient } from 'npm:@supabase/supabase-js@2.95.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2.95.0/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface DispatchPayload {
  contract_id: string
  event_type: string
  variation_id?: string
}

const formatGBP = (pence: number | null | undefined): string | undefined => {
  if (pence == null) return undefined
  const pounds = pence / 100
  return `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatGBPSigned = (pence: number | null | undefined): string | undefined => {
  if (pence == null) return undefined
  const sign = pence >= 0 ? '+' : '−'
  const abs = Math.abs(pence) / 100
  return `${sign}£${abs.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatDate = (iso: string | null | undefined): string | undefined => {
  if (!iso) return undefined
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const firstName = (full: string | null | undefined): string | undefined => {
  if (!full) return undefined
  return full.trim().split(/\s+/)[0]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Auth: only the service role (used by the DB trigger via pg_net) may call this.
  // verify_jwt is off; we authenticate the bearer token in code against the
  // service-role key.
  const authHeader = req.headers.get('authorization') ?? ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '')
  if (!SERVICE_KEY || bearer !== SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: DispatchPayload
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { contract_id, event_type, variation_id } = body
  if (!contract_id || !event_type) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  // Fetch contract + parties + job
  const { data: contract, error: cErr } = await sb
    .from('contracts')
    .select(`
      id, reference, status, total_value_incl_vat_pence, estimated_start_date,
      completed_at, defects_period_ends_at, homeowner_id, trade_id, job_id,
      homeowner_snapshot, trade_snapshot, homeowner_signed_at, trade_signed_at
    `)
    .eq('id', contract_id)
    .single()

  if (cErr || !contract) {
    return new Response(JSON.stringify({ error: 'contract_not_found', detail: cErr?.message }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: job } = await sb.from('jobs').select('title, job_type').eq('id', contract.job_id).single()
  const { data: homeowner } = await sb.from('homeowners').select('email, name').eq('id', contract.homeowner_id).single()
  const { data: trade } = await sb.from('trades').select('email, name, company_name').eq('id', contract.trade_id).single()

  if (!homeowner?.email || !trade?.email) {
    return new Response(JSON.stringify({ error: 'parties_missing_email' }), {
      status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const projectTitle = job?.title || job?.job_type || 'your project'
  const reference = contract.reference || 'PG-XXXX-XXXX'
  const amountFormatted = formatGBP(contract.total_value_incl_vat_pence)
  const startDate = formatDate(contract.estimated_start_date)
  const tradeDisplay = trade.company_name ? `${trade.name} (${trade.company_name})` : (trade.name ?? 'your trade')

  const sendEmail = async (templateName: string, recipientEmail: string, recipientRole: string, templateData: Record<string, any>) => {
    const idem = `${templateName}-${contract_id}-${recipientRole}-${variation_id ?? ''}`
      .replace(/[^a-zA-Z0-9_-]/g, '-')
    const { error } = await sb.functions.invoke('send-transactional-email', {
      body: {
        templateName,
        recipientEmail,
        idempotencyKey: idem,
        templateData,
      },
    })
    if (error) {
      console.error('[contract-email-dispatcher] send failed', templateName, recipientEmail, error)
      return { ok: false, error: String(error.message ?? error) }
    }
    // Audit row in contract_events
    await sb.from('contract_events').insert({
      contract_id,
      event_type: 'email_sent',
      payload: {
        email_type: templateName,
        recipient_email: recipientEmail,
        recipient_role: recipientRole,
        variation_id: variation_id ?? null,
        sent_at: new Date().toISOString(),
      },
    })
    return { ok: true }
  }

  const results: any[] = []

  switch (event_type) {
    case 'generated': {
      // Both parties
      results.push({
        target: 'homeowner',
        ...(await sendEmail('contract-generated', homeowner.email, 'homeowner', {
          firstName: firstName(homeowner.name),
          reference,
          projectTitle,
          otherPartyName: tradeDisplay,
          amountFormatted,
          startDate,
        })),
      })
      results.push({
        target: 'trade',
        ...(await sendEmail('contract-generated', trade.email, 'trade', {
          firstName: firstName(trade.name),
          reference,
          projectTitle,
          otherPartyName: homeowner.name ?? undefined,
          amountFormatted,
          startDate,
        })),
      })
      break
    }
    case 'signed_partial': {
      // The OTHER party (the one who hasn't signed yet) gets the awaiting-signature email
      const homeownerSigned = !!contract.homeowner_signed_at
      const tradeSigned = !!contract.trade_signed_at
      if (homeownerSigned && !tradeSigned) {
        results.push({
          target: 'trade',
          ...(await sendEmail('contract-awaiting-signature', trade.email, 'trade', {
            firstName: firstName(trade.name),
            reference,
            projectTitle,
            otherPartyName: homeowner.name ?? undefined,
            otherPartyRole: 'homeowner',
            amountFormatted,
          })),
        })
      } else if (tradeSigned && !homeownerSigned) {
        results.push({
          target: 'homeowner',
          ...(await sendEmail('contract-awaiting-signature', homeowner.email, 'homeowner', {
            firstName: firstName(homeowner.name),
            reference,
            projectTitle,
            otherPartyName: tradeDisplay,
            otherPartyRole: 'trade',
            amountFormatted,
          })),
        })
      }
      break
    }
    case 'activated': {
      results.push({
        target: 'homeowner',
        ...(await sendEmail('contract-activated', homeowner.email, 'homeowner', {
          firstName: firstName(homeowner.name),
          reference,
          projectTitle,
          otherPartyName: tradeDisplay,
          amountFormatted,
          startDate,
        })),
      })
      results.push({
        target: 'trade',
        ...(await sendEmail('contract-activated', trade.email, 'trade', {
          firstName: firstName(trade.name),
          reference,
          projectTitle,
          otherPartyName: homeowner.name ?? undefined,
          amountFormatted,
          startDate,
        })),
      })
      break
    }
    case 'variation_proposed': {
      if (!variation_id) break
      const { data: v } = await sb.from('contract_variations').select('*').eq('id', variation_id).single()
      if (!v) break
      // Receiving party = the OTHER side from proposed_by
      const receivingIsHomeowner = v.proposed_by === 'trade'
      const recipient = receivingIsHomeowner ? homeowner : trade
      const recipientRole = receivingIsHomeowner ? 'homeowner' : 'trade'
      const proposerName = receivingIsHomeowner ? tradeDisplay : (homeowner.name ?? 'your homeowner')
      results.push({
        target: recipientRole,
        ...(await sendEmail('variation-proposed', recipient.email, recipientRole, {
          firstName: firstName(recipient.name),
          reference,
          projectTitle,
          proposerName,
          variationTitle: v.title,
          variationDescription: v.description,
          costChangeFormatted: formatGBPSigned(v.cost_change_pence),
          programmeImpactDays: v.programme_impact_days,
        })),
      })
      break
    }
    case 'variation_approved': {
      if (!variation_id) break
      const { data: v } = await sb.from('contract_variations').select('*').eq('id', variation_id).single()
      if (!v) break
      results.push({
        target: 'homeowner',
        ...(await sendEmail('variation-approved', homeowner.email, 'homeowner', {
          firstName: firstName(homeowner.name),
          reference,
          projectTitle,
          otherPartyName: tradeDisplay,
          variationTitle: v.title,
          costChangeFormatted: formatGBPSigned(v.cost_change_pence),
          programmeImpactDays: v.programme_impact_days,
        })),
      })
      results.push({
        target: 'trade',
        ...(await sendEmail('variation-approved', trade.email, 'trade', {
          firstName: firstName(trade.name),
          reference,
          projectTitle,
          otherPartyName: homeowner.name ?? undefined,
          variationTitle: v.title,
          costChangeFormatted: formatGBPSigned(v.cost_change_pence),
          programmeImpactDays: v.programme_impact_days,
        })),
      })
      break
    }
    case 'completion_marked': {
      results.push({
        target: 'homeowner',
        ...(await sendEmail('completion-marked', homeowner.email, 'homeowner', {
          firstName: firstName(homeowner.name),
          reference,
          projectTitle,
          tradeName: tradeDisplay,
        })),
      })
      break
    }
    case 'completion_accepted': {
      const completedDate = formatDate(contract.completed_at)
      const defectsUntil = formatDate(contract.defects_period_ends_at)
      results.push({
        target: 'homeowner',
        ...(await sendEmail('completion-accepted', homeowner.email, 'homeowner', {
          firstName: firstName(homeowner.name),
          reference,
          projectTitle,
          otherPartyName: tradeDisplay,
          amountFormatted,
          completedDate,
          defectsUntil,
        })),
      })
      results.push({
        target: 'trade',
        ...(await sendEmail('completion-accepted', trade.email, 'trade', {
          firstName: firstName(trade.name),
          reference,
          projectTitle,
          otherPartyName: homeowner.name ?? undefined,
          amountFormatted,
          completedDate,
          defectsUntil,
        })),
      })
      break
    }
    default:
      return new Response(JSON.stringify({ error: 'unknown_event_type', event_type }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
