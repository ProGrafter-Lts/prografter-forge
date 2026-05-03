// Public endpoint: accepts a testimonial submission, inserts it as
// approved=false, and notifies the admin. No auth required.

import { createClient } from 'npm:@supabase/supabase-js@2.95.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2.95.0/cors'
import { z } from 'npm:zod@3.23.8'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const Body = z.object({
  first_name: z.string().trim().min(1).max(80),
  town: z.string().trim().min(1).max(80),
  quote: z.string().trim().min(10).max(280),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  contract_id: z.string().uuid().nullable().optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let parsed
  try {
    parsed = Body.safeParse(await req.json())
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'validation', detail: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { first_name, town, quote, rating, contract_id } = parsed.data
  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data, error } = await sb
    .from('testimonials')
    .insert({
      quote,
      author_first_name: first_name,
      author_trade_or_role: `Homeowner, ${town}`,
      rating: rating ?? null,
      approved: false,
      source: 'post_completion',
      contract_id: contract_id ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: 'insert_failed', detail: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fire-and-forget admin notification — don't block the response if email fails.
  try {
    await sb.functions.invoke('send-transactional-email', {
      body: {
        template: 'testimonial-received',
        purpose: 'transactional',
        idempotency_key: `testimonial-${data.id}`,
        data: {
          firstName: first_name,
          town,
          rating: rating ?? null,
          quote,
          contractId: contract_id ?? null,
        },
      },
    })
  } catch (_) {
    // Logged via email queue infra — non-fatal.
  }

  return new Response(JSON.stringify({ ok: true, id: data.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
