import { createClient } from 'npm:@supabase/supabase-js@2'
import { enqueueTransactionalEmail } from '../_shared/enqueue-transactional-email.ts'

// Sends a registered app email through Lovable's managed email API.
// Auth note: verify_jwt = true in config.toml, so Supabase's gateway validates
// the caller's JWT before the request reaches this code.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  let templateName: string
  let recipientEmail: string | undefined
  let idempotencyKey: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    idempotencyKey =
      body.idempotencyKey || body.idempotency_key || crypto.randomUUID()
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON in request body' }, 400)
  }

  if (!templateName) {
    return jsonResponse({ error: 'templateName is required' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const result = await enqueueTransactionalEmail(supabase, {
      templateName,
      recipientEmail,
      idempotencyKey,
      templateData,
    })

    if (!result.success) {
      console.log('Email suppressed', { templateName })
      return jsonResponse({ success: false, reason: 'email_suppressed' })
    }

    console.log('App email sent', { templateName })
    return jsonResponse({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Failed to send app email', { templateName, message })
    const status = /not found|required/i.test(message) ? 400 : 500
    return jsonResponse({ error: message }, status)
  }
})
