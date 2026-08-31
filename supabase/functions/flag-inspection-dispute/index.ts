// Dispute freeze — either party may dispute a specific inspection report, but
// ONLY with documented building-control evidence:
//   * a follow-up inspection report,
//   * a formal complaint reference to the inspector's professional body, or
//   * the inspector's own written retraction / correction.
// An unstructured objection ("I don't accept this") does not qualify and cannot
// freeze a stage that already received CLEAR.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { z } from 'npm:zod@3.23.8'
import { logDrawdownEvent } from '../_shared/drawdown.ts'

const QUALIFYING = ['follow_up_inspection_report', 'professional_body_complaint', 'inspector_retraction'] as const

const BodySchema = z.object({
  inspection_report_id: z.string().uuid(),
  evidence_type: z.enum(QUALIFYING),
  // A reference the evidence can actually be traced by (report number,
  // complaint reference, retraction letter reference).
  evidence_reference: z.string().trim().min(4).max(300),
  evidence_path: z.string().max(500).optional(),
  evidence_notes: z.string().max(2000).optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const anon = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    const { data: userData } = await anon.auth.getUser(token)
    const user = userData?.user
    if (!user) return json({ error: 'Not authenticated' }, 401)

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return json(
        {
          error: parsed.error.flatten().fieldErrors,
          message:
            'A dispute must cite documented building-control evidence: a follow-up inspection report, a professional-body complaint reference, or the inspector\'s written retraction.',
        },
        400,
      )
    }
    const input = parsed.data

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: report } = await admin
      .from('stage_inspection_reports').select('*').eq('id', input.inspection_report_id).maybeSingle()
    if (!report) return json({ error: 'Inspection report not found' }, 404)

    const { data: wallet } = await admin
      .from('project_wallets').select('*').eq('id', report.wallet_id).maybeSingle()
    if (!wallet) return json({ error: 'No wallet for this project' }, 404)

    const [{ data: ho }, { data: tr }] = await Promise.all([
      admin.from('homeowners').select('id').eq('id', wallet.homeowner_id).eq('user_id', user.id).maybeSingle(),
      admin.from('trades').select('id').eq('id', wallet.trade_id).eq('user_id', user.id).maybeSingle(),
    ])
    if (!ho && !tr) return json({ error: 'Only the parties to this project can dispute an inspection' }, 403)
    const role = tr ? 'trade' : 'homeowner'

    // A follow-up report as evidence must actually exist on this project.
    if (input.evidence_type === 'follow_up_inspection_report' && !input.evidence_path) {
      const { count } = await admin
        .from('stage_inspection_reports')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', report.job_id)
        .gt('created_at', report.created_at)
      if (!count) {
        return json(
          { error: 'No follow-up inspection report exists on this project yet. Upload it first, then raise the dispute.' },
          400,
        )
      }
    }

    const { data: dispute, error } = await admin
      .from('inspection_disputes')
      .insert({
        inspection_report_id: report.id,
        job_id: report.job_id,
        wallet_id: wallet.id,
        raised_by_user_id: user.id,
        raised_by_role: role,
        evidence_type: input.evidence_type,
        evidence_reference: input.evidence_reference,
        evidence_path: input.evidence_path ?? null,
        evidence_notes: input.evidence_notes ?? null,
      })
      .select()
      .single()
    if (error) return json({ error: error.message }, 400)

    await admin.from('stage_inspection_reports').update({ status: 'disputed' }).eq('id', report.id)

    // Freeze the whole project: no releases, no next-stage funding requests,
    // until an admin manually unfreezes.
    const reason = `Frozen: inspection report disputed (${input.evidence_type.replace(/_/g, ' ')}, ref ${input.evidence_reference}). Awaiting admin review.`
    await admin
      .from('project_wallets')
      .update({ frozen: true, frozen_at: new Date().toISOString(), frozen_reason: reason, frozen_by_dispute_id: dispute.id })
      .eq('id', wallet.id)

    await logDrawdownEvent(admin, {
      walletId: wallet.id,
      eventType: 'project_frozen_inspection_dispute',
      actorUserId: user.id,
      actorRole: role,
      detail: {
        dispute_id: dispute.id,
        inspection_report_id: report.id,
        evidence_type: input.evidence_type,
        evidence_reference: input.evidence_reference,
      },
    })

    return json({ dispute, frozen: true, reason })
  } catch (e) {
    console.error('[flag-inspection-dispute]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
