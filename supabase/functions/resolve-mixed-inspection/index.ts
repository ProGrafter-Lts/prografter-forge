// Admin-only: close out a MIXED inspection from the manual review worklist.
// A MIXED classification is never resolved automatically — an admin decides
// whether the report reads CLEAR (release may proceed) or HOLD (it may not).
// The machine classification is preserved in original_classification.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { z } from 'npm:zod@3.23.8'
import { logDrawdownEvent } from '../_shared/drawdown.ts'
import { attemptStageRelease } from '../_shared/escrow.ts'

const BodySchema = z.object({
  inspection_report_id: z.string().uuid(),
  decision: z.enum(['CLEAR', 'HOLD']),
  review_note: z.string().min(4).max(2000),
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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    if (!isAdmin) return json({ error: 'Admin only' }, 403)

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
    const input = parsed.data

    const { data: report } = await admin
      .from('stage_inspection_reports').select('*').eq('id', input.inspection_report_id).maybeSingle()
    if (!report) return json({ error: 'Inspection report not found' }, 404)
    if (report.review_status !== 'pending') {
      return json({ error: 'This report is not awaiting manual review.' }, 409)
    }

    const nowIso = new Date().toISOString()
    const { data: updated } = await admin
      .from('stage_inspection_reports')
      .update({
        classification: input.decision,
        classification_reason:
          `Manual review by ProGrafter admin (machine classification ${report.original_classification ?? report.classification}): ${input.review_note}`,
        review_status: input.decision === 'CLEAR' ? 'cleared' : 'held',
        reviewed_by: user.id,
        reviewed_at: nowIso,
        review_note: input.review_note,
      })
      .eq('id', report.id)
      .select()
      .maybeSingle()

    if (report.wallet_stage_id) {
      await admin
        .from('project_wallet_stages')
        .update({
          inspection_status: input.decision,
          inspection_passed_at: input.decision === 'CLEAR' ? nowIso : null,
        })
        .eq('id', report.wallet_stage_id)
    }

    if (report.wallet_id) {
      await logDrawdownEvent(admin, {
        walletId: report.wallet_id,
        eventType: 'mixed_inspection_reviewed',
        actorUserId: user.id,
        actorRole: 'admin',
        detail: {
          inspection_report_id: report.id,
          wallet_stage_id: report.wallet_stage_id,
          decision: input.decision,
          note: input.review_note,
        },
      })
    }

    let release: unknown = { released: false, blocked_by: 'held', reason: 'Admin review concluded HOLD.' }
    if (input.decision === 'CLEAR' && report.wallet_stage_id) {
      release = await attemptStageRelease(admin, {
        walletStageId: report.wallet_stage_id,
        actorUserId: user.id,
        actorRole: 'admin',
        trigger: 'manual',
      })
    }

    return json({ report: updated, release })
  } catch (e) {
    console.error('[resolve-mixed-inspection]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
