import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Days-before-expiry thresholds we send reminders at. Once a document crosses
// into a tighter bucket a new reminder fires (dedup by idempotency key).
const THRESHOLDS = [30, 14, 7, 0] as const

const LABELS: Record<string, string> = {
  public_liability: 'Public liability insurance',
  proof_of_identity: 'Proof of identity',
  trade_qualifications: 'Trade qualifications / certificates',
  company_details: 'Company or sole trader details',
  professional_indemnity: 'Professional indemnity insurance',
  employers_liability: "Employer's liability insurance",
  tool_insurance: 'Tool insurance',
  van_insurance: 'Van insurance',
  cscs_card: 'CSCS card',
  gas_safe: 'Gas Safe registration',
  niceic_napit: 'NICEIC / NAPIT registration',
  mcs: 'MCS certification',
  trustmark: 'TrustMark registration',
  pas_accreditation: 'PAS 2030 / PAS 2035 accreditation',
  other_accreditation: 'Other accreditation',
}

const REQUIRED = new Set([
  'public_liability',
  'proof_of_identity',
  'trade_qualifications',
  'company_details',
])

const daysUntil = (dateStr: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

const fmtDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // Current docs that have both a file and an expiry date.
    const { data: docs, error } = await supabase
      .from('tradevault_documents')
      .select('id, trade_id, document_type, expiry_date, file_url, is_current')
      .eq('is_current', true)
      .not('file_url', 'is', null)
      .not('expiry_date', 'is', null)

    if (error) throw error

    let sent = 0
    const results: Array<{ id: string; status: string; error?: string }> = []

    for (const doc of docs ?? []) {
      const days = daysUntil(doc.expiry_date as string)

      // Determine which bucket this document is in.
      let stage: string | null = null
      if (days < 0) {
        stage = 'expired'
      } else {
        const hit = THRESHOLDS.find((t) => days <= t)
        if (hit !== undefined) stage = String(hit)
      }
      if (!stage) continue // not within any reminder window yet

      // Resolve the trade + recipient email.
      const { data: trade } = await supabase
        .from('trades')
        .select('user_id, name')
        .eq('id', doc.trade_id)
        .maybeSingle()

      if (!trade?.user_id) {
        results.push({ id: doc.id, status: 'skipped_no_trade' })
        continue
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', trade.user_id)
        .maybeSingle()

      if (!profile?.email) {
        results.push({ id: doc.id, status: 'skipped_no_email' })
        continue
      }

      const label = LABELS[doc.document_type as string] ?? 'A verification document'
      const expired = stage === 'expired'

      const { error: sendErr } = await supabase.functions.invoke('send-app-email', {
        body: {
          templateName: 'tradevault-doc-expiring',
          recipientEmail: profile.email,
          idempotencyKey: `tradevault-expiry-${doc.id}-${stage}`,
          templateData: {
            name: (profile.full_name ?? trade.name ?? '').split(' ')[0] || undefined,
            documentLabel: label,
            expiryDate: fmtDate(doc.expiry_date as string),
            daysUntil: Math.max(days, 0),
            expired,
            required: REQUIRED.has(doc.document_type as string),
          },
        },
      })

      if (sendErr) {
        results.push({ id: doc.id, status: 'send_error', error: sendErr.message })
        continue
      }

      sent++
      results.push({ id: doc.id, status: `sent_${stage}` })
    }

    return new Response(
      JSON.stringify({ ok: true, considered: docs?.length ?? 0, sent, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('send-tradevault-expiry-reminders error', err)
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
