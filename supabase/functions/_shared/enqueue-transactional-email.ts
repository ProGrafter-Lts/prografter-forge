import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { TEMPLATES } from './transactional-email-templates/registry.ts'

const SITE_NAME = 'ProGrafter'
const SENDER_DOMAIN = 'notify.prografter.co.uk'
const FROM_DOMAIN = 'prografter.co.uk'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function enqueueTransactionalEmail(
  supabase: any,
  {
    templateName,
    recipientEmail,
    idempotencyKey,
    templateData = {},
  }: {
    templateName: string
    recipientEmail?: string
    idempotencyKey: string
    templateData?: Record<string, any>
  },
) {
  const template = TEMPLATES[templateName]
  if (!template) throw new Error(`Template '${templateName}' not found`)

  const effectiveRecipient = template.to || recipientEmail
  if (!effectiveRecipient) throw new Error('recipientEmail is required')

  const messageId = crypto.randomUUID()
  const normalizedEmail = effectiveRecipient.toLowerCase()

  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (suppressionError) throw new Error(`Suppression check failed: ${suppressionError.message}`)

  if (suppressed) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })
    return { success: false, reason: 'email_suppressed' }
  }

  let unsubscribeToken: string
  const { data: existingToken, error: tokenLookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) throw new Error(`Token lookup failed: ${tokenLookupError.message}`)

  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token
  } else if (!existingToken) {
    unsubscribeToken = generateToken()
    const { error: tokenError } = await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true },
      )

    if (tokenError) throw new Error(`Failed to create unsubscribe token: ${tokenError.message}`)

    const { data: storedToken, error: reReadError } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (reReadError || !storedToken) {
      throw new Error(`Failed to confirm unsubscribe token storage: ${reReadError?.message || 'missing token'}`)
    }
    unsubscribeToken = storedToken.token
  } else {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
      error_message: 'Unsubscribe token used but email missing from suppressed list',
    })
    return { success: false, reason: 'email_suppressed' }
  }

  const html = await renderAsync(React.createElement(template.component, templateData))
  const plainText = await renderAsync(
    React.createElement(template.component, templateData),
    { plainText: true },
  )
  const resolvedSubject = typeof template.subject === 'function'
    ? template.subject(templateData)
    : template.subject

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <hello@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) throw new Error(`Failed to enqueue email: ${enqueueError.message}`)
  return { success: true, queued: true }
}