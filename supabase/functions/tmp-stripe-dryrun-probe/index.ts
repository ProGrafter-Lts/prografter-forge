// TEMPORARY harness for the mobilization drawdown / escrow dry run.
// Creates the three test auth users needed to execute the flow as real
// authenticated actors. Delete after the dry run.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.57.2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const url = new URL(req.url)
  const password = url.searchParams.get('pw') ?? ''
  if (password.length < 16) return json({ error: 'pw required' }, 400)

  const wanted = [
    { email: 'dryrun-homeowner@prografter.co.uk', role: 'homeowner' },
    { email: 'dryrun-trade@prografter.co.uk', role: 'trade' },
    { email: 'dryrun-admin@prografter.co.uk', role: 'admin' },
  ]

  const out: Record<string, unknown> = {}
  for (const w of wanted) {
    const { data, error } = await admin.auth.admin.createUser({
      email: w.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Dry Run ${w.role}` },
    })
    if (error) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
      const found = list?.users?.find((u) => u.email === w.email)
      if (found) {
        await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true })
        out[w.role] = { id: found.id, email: w.email, reused: true }
        continue
      }
      out[w.role] = { error: error.message }
      continue
    }
    out[w.role] = { id: data.user?.id, email: w.email }
  }

  return json(out)
})
