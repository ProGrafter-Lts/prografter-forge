import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const TOKEN_TTL_DAYS = 7

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const isExpired = (createdAt: string) =>
  Date.now() - new Date(createdAt).getTime() > TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000

async function lookup(token: string) {
  if (!token || token.length < 8 || token.length > 512) return null
  const { data, error } = await supabase
    .from('email_unsubscribe_tokens')
    .select('email, created_at, used_at')
    .eq('token', token)
    .maybeSingle()
  if (error || !data) return null
  if (isExpired(data.created_at)) return null
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (req.method === 'GET') {
      const token = new URL(req.url).searchParams.get('token') ?? ''
      const row = await lookup(token)
      return json({ valid: Boolean(row) })
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const token = typeof body?.token === 'string' ? body.token : ''
      const row = await lookup(token)
      if (!row) return json({ error: 'invalid_token' }, 400)

      if (row.used_at) return json({ success: true, reason: 'already_unsubscribed' })

      const email = row.email.toLowerCase()

      const { error: suppressError } = await supabase
        .from('suppressed_emails')
        .upsert({ email, reason: 'unsubscribe', metadata: null }, { onConflict: 'email' })
      if (suppressError) {
        console.error('suppression upsert failed', suppressError.code, suppressError.message)
        return json({ error: 'unsubscribe_failed' }, 500)
      }

      const { error: tokenError } = await supabase
        .from('email_unsubscribe_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token)
        .is('used_at', null)
      if (tokenError) {
        console.error('token stamp failed', tokenError.code, tokenError.message)
      }

      await supabase.from('email_send_log').insert({
        message_id: null,
        template_name: 'system',
        recipient_email: email,
        status: 'suppressed',
        error_message: 'Recipient unsubscribed via preferences page',
        metadata: null,
      })

      return json({ success: true })
    }

    return json({ error: 'method_not_allowed' }, 405)
  } catch (e) {
    console.error('handle-email-unsubscribe error', e instanceof Error ? e.message : String(e))
    return json({ error: 'unexpected_error' }, 500)
  }
})
