// Trade-side: create a mobilization drawdown request.
// The proforma invoice is stored privately and is NEVER exposed to the homeowner.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'
import { z } from 'npm:zod@3.23.8'
import { logDrawdownEvent, penceToPounds } from '../_shared/drawdown.ts'
import { assertNotFrozen } from '../_shared/escrow.ts'
import { enqueueTransactionalEmail } from '../_shared/enqueue-transactional-email.ts'

const BodySchema = z.object({
  wallet_stage_id: z.string().uuid(),
  amount_pence: z.number().int().positive().max(100_000_000),
  description: z.string().min(3).max(1000),
  proforma_path: z.string().min(3).max(500),
  proforma_filename: z.string().max(300).optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

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

    const { data: stage } = await admin
      .from('project_wallet_stages')
      .select('*, project_wallets(*)')
      .eq('id', input.wallet_stage_id)
      .maybeSingle()

    if (!stage) return json({ error: 'Wallet stage not found' }, 404)
    const wallet: any = stage.project_wallets
    if (!wallet) return json({ error: 'Wallet not found' }, 404)

    const frozen = await assertNotFrozen(admin, wallet.id)
    if (frozen) return json({ error: frozen }, 409)

    const { data: trade } = await admin
      .from('trades')
      .select('id, name, company_name, user_id')
      .eq('id', wallet.trade_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!trade) return json({ error: 'Only the appointed trade can request a drawdown' }, 403)

    if (!stage.is_mobilization) {
      return json({ error: 'Drawdown requests are only supported against the mobilization stage' }, 400)
    }

    // Funded balance check: funded minus already released minus anything pending.
    const { data: pending } = await admin
      .from('drawdown_requests')
      .select('amount_pence')
      .eq('wallet_stage_id', stage.id)
      .eq('status', 'pending_approval')

    const pendingTotal = (pending ?? []).reduce((s: number, r: any) => s + Number(r.amount_pence), 0)
    const available = Number(stage.funded_amount_pence) - Number(stage.released_amount_pence) - pendingTotal

    if (input.amount_pence > available) {
      return json(
        {
          error: 'Amount exceeds the funded wallet balance for this stage',
          available_pence: Math.max(available, 0),
        },
        400,
      )
    }

    // The proforma must live under the trade's own folder in the private bucket.
    if (!input.proforma_path.startsWith(`${trade.id}/`)) {
      return json({ error: 'Invalid proforma path' }, 400)
    }

    // And it must actually exist — no drawdown against a phantom document.
    {
      const slash = input.proforma_path.lastIndexOf('/')
      const folder = input.proforma_path.slice(0, slash)
      const filename = input.proforma_path.slice(slash + 1)
      const { data: listed, error: listError } = await admin.storage
        .from('drawdown-proformas')
        .list(folder, { search: filename, limit: 100 })
      if (listError) return json({ error: `Could not verify proforma: ${listError.message}` }, 400)
      if (!(listed ?? []).some((o) => o.name === filename)) {
        return json({ error: 'Proforma file was not found in storage — upload it before requesting a drawdown' }, 400)
      }
    }

    const { data: request, error } = await admin
      .from('drawdown_requests')
      .insert({
        wallet_id: wallet.id,
        wallet_stage_id: stage.id,
        job_id: wallet.job_id,
        trade_id: wallet.trade_id,
        homeowner_id: wallet.homeowner_id,
        amount_pence: input.amount_pence,
        description: input.description,
        proforma_path: input.proforma_path,
        proforma_filename: input.proforma_filename ?? null,
        status: 'pending_approval',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return json({ error: error.message }, 400)

    await logDrawdownEvent(admin, {
      walletId: wallet.id,
      requestId: request.id,
      eventType: 'drawdown_requested',
      actorUserId: user.id,
      actorRole: 'trade',
      detail: {
        amount_pence: request.amount_pence,
        description: request.description,
        proforma_path: request.proforma_path,
        proforma_filename: request.proforma_filename,
        stage_name: stage.stage_name,
      },
    })

    // Notify the homeowner — approval is their authenticated action only.
    const [{ data: homeowner }, { data: job }] = await Promise.all([
      admin.from('homeowners').select('name, email').eq('id', wallet.homeowner_id).maybeSingle(),
      admin.from('jobs').select('title').eq('id', wallet.job_id).maybeSingle(),
    ])

    if (homeowner?.email) {
      try {
        await enqueueTransactionalEmail(admin, {
          templateName: 'drawdown-approval-needed',
          recipientEmail: homeowner.email,
          idempotencyKey: `drawdown-approval-${request.id}`,
          templateData: {
            firstName: homeowner.name?.split(' ')[0],
            amount: `£${penceToPounds(request.amount_pence)}`,
            description: request.description,
            projectTitle: job?.title ?? 'your project',
            tradeName: trade.company_name || trade.name,
            jobId: wallet.job_id,
          },
        })
      } catch (e) {
        console.error('[create-drawdown-request] email failed', e)
      }
    }

    return json({ request })
  } catch (e) {
    console.error('[create-drawdown-request]', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
