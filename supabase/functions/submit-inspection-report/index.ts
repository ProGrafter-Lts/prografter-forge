// Building Control inspection report upload + parse + three-state
// classification + escrow release attempt.
//
// The AI step ONLY transcribes/structures the report (required-actions table
// rows + narrative). The CLEAR / HOLD / MIXED decision is made by the
// deterministic classifier in _shared/inspection-classify.ts.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { z } from 'npm:zod@3.23.8'
import { classifyInspection } from '../_shared/inspection-classify.ts'
import { attemptStageRelease, assertNotFrozen } from '../_shared/escrow.ts'
import { logDrawdownEvent } from '../_shared/drawdown.ts'

const BUCKET = 'inspection-reports'
const MODEL = 'claude-sonnet-4-20250514'

const BodySchema = z.object({
  job_id: z.string().uuid(),
  wallet_stage_id: z.string().uuid(),
  file_path: z.string().max(500).optional(),
  file_name: z.string().max(300).optional(),
  inspector_name: z.string().max(200).optional(),
  report_date: z.string().max(20).optional(),
  // Manual / test entry path — bypasses the PDF read when supplied.
  raw_text: z.string().max(60_000).optional(),
  required_actions: z.array(z.string().max(1000)).max(100).optional(),
  previous_required_actions: z.array(z.string().max(1000)).max(100).optional(),
})

interface Extracted {
  requiredActions: string[]
  previousRequiredActions: string[]
  narrative: string
  inspectorName?: string
  reportDate?: string
}

async function extractFromPdf(admin: any, path: string): Promise<Extracted | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return null
  const { data, error } = await admin.storage.from(BUCKET).download(path)
  if (error || !data) {
    console.error('[submit-inspection-report] download failed', error?.message)
    return null
  }
  const bytes = new Uint8Array(await data.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  const base64 = btoa(bin)

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 3000,
      temperature: 0,
      system:
        'You transcribe UK Building Control site inspection reports. Return ONLY JSON: ' +
        '{"inspectorName":string|null,"reportDate":"YYYY-MM-DD"|null,' +
        '"requiredActions":string[],"previousRequiredActions":string[],"narrative":string}. ' +
        'requiredActions = rows of the structured "Required actions" table for THIS inspection. ' +
        'previousRequiredActions = rows carried over from previous inspections. ' +
        'narrative = the inspector\'s free-text notes, verbatim, one item per line. ' +
        'Never summarise, never soften, never invent items. If a table is empty return [].',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: 'Transcribe this inspection report as JSON.' },
          ],
        },
      ],
    }),
  })
  if (!resp.ok) {
    console.error('[submit-inspection-report] anthropic error', resp.status, await resp.text())
    return null
  }
  const out = await resp.json()
  const text = (out?.content?.[0]?.text as string) ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0])
    return {
      requiredActions: Array.isArray(parsed.requiredActions) ? parsed.requiredActions.map(String) : [],
      previousRequiredActions: Array.isArray(parsed.previousRequiredActions)
        ? parsed.previousRequiredActions.map(String)
        : [],
      narrative: typeof parsed.narrative === 'string' ? parsed.narrative : '',
      inspectorName: parsed.inspectorName ?? undefined,
      reportDate: parsed.reportDate ?? undefined,
    }
  } catch (e) {
    console.error('[submit-inspection-report] JSON parse failed', e)
    return null
  }
}

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
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
    const input = parsed.data

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: wallet } = await admin
      .from('project_wallets').select('*').eq('job_id', input.job_id).maybeSingle()
    if (!wallet) return json({ error: 'No wallet for this project' }, 404)

    const [{ data: ho }, { data: tr }, { data: isAdmin }] = await Promise.all([
      admin.from('homeowners').select('id').eq('id', wallet.homeowner_id).eq('user_id', user.id).maybeSingle(),
      admin.from('trades').select('id').eq('id', wallet.trade_id).eq('user_id', user.id).maybeSingle(),
      admin.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
    ])
    if (!ho && !tr && !isAdmin) return json({ error: 'Not a party to this project' }, 403)
    const actorRole = tr ? 'trade' : ho ? 'homeowner' : 'admin'

    const frozen = await assertNotFrozen(admin, wallet.id)

    const { data: stage } = await admin
      .from('project_wallet_stages')
      .select('*')
      .eq('id', input.wallet_stage_id)
      .eq('wallet_id', wallet.id)
      .maybeSingle()
    if (!stage) return json({ error: 'Wallet stage not found on this project' }, 404)

    // 1. Extract
    let extracted: Extracted = {
      requiredActions: input.required_actions ?? [],
      previousRequiredActions: input.previous_required_actions ?? [],
      narrative: input.raw_text ?? '',
      inspectorName: input.inspector_name,
      reportDate: input.report_date,
    }
    if (!input.raw_text && input.file_path) {
      const fromPdf = await extractFromPdf(admin, input.file_path)
      if (!fromPdf) {
        return json({ error: 'Could not read the inspection report. Upload a text-based PDF or enter the details manually.' }, 422)
      }
      extracted = {
        requiredActions: input.required_actions?.length ? input.required_actions : fromPdf.requiredActions,
        previousRequiredActions: input.previous_required_actions?.length
          ? input.previous_required_actions
          : fromPdf.previousRequiredActions,
        narrative: fromPdf.narrative,
        inspectorName: input.inspector_name ?? fromPdf.inspectorName,
        reportDate: input.report_date ?? fromPdf.reportDate,
      }
    }
    if (!extracted.narrative && extracted.requiredActions.length === 0) {
      return json({ error: 'No inspection content found to classify.' }, 422)
    }

    // 2. Classify (deterministic, three-state)
    const result = classifyInspection(extracted)

    // 3. Store — supersede any earlier active report for this stage.
    await admin
      .from('stage_inspection_reports')
      .update({ status: 'superseded' })
      .eq('wallet_stage_id', stage.id)
      .eq('status', 'active')

    const { data: report, error: insertErr } = await admin
      .from('stage_inspection_reports')
      .insert({
        job_id: input.job_id,
        wallet_id: wallet.id,
        wallet_stage_id: stage.id,
        uploaded_by: user.id,
        uploader_role: actorRole,
        file_path: input.file_path ?? null,
        file_name: input.file_name ?? null,
        inspector_name: extracted.inspectorName ?? null,
        report_date: /^\d{4}-\d{2}-\d{2}$/.test(extracted.reportDate ?? '') ? extracted.reportDate : null,
        raw_text: extracted.narrative,
        classification: result.classification,
        classification_reason: result.reason,
        required_actions: [...result.requiredActions, ...result.previousRequiredActions],
        open_items: result.openItems,
        resolved_items: result.resolvedItems,
        clear_phrases: result.clearPhrases,
        unable_to_assess: result.unableToAssess,
      })
      .select()
      .single()
    if (insertErr) return json({ error: insertErr.message }, 400)

    await admin
      .from('project_wallet_stages')
      .update({
        inspection_status: result.classification,
        inspection_report_id: report.id,
        inspection_passed_at: result.classification === 'CLEAR' ? new Date().toISOString() : null,
      })
      .eq('id', stage.id)

    await logDrawdownEvent(admin, {
      walletId: wallet.id,
      eventType: 'inspection_report_classified',
      actorUserId: user.id,
      actorRole,
      detail: {
        stage_id: stage.id,
        stage_name: stage.stage_name,
        inspection_report_id: report.id,
        classification: result.classification,
        reason: result.reason,
        outstanding: result.outstanding,
      },
    })

    // 4. Attempt release (frozen projects never reach the money path).
    let release: unknown = { released: false, blocked_by: 'project_frozen', reason: frozen }
    if (!frozen) {
      release = await attemptStageRelease(admin, {
        walletStageId: stage.id,
        actorUserId: user.id,
        actorRole,
        trigger: 'inspection_uploaded',
      })
    }

    return json({ report, classification: result, release })
  } catch (e) {
    console.error('[submit-inspection-report]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
