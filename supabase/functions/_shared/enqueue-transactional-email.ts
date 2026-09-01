import { sendTemplateEmail } from './transactional-email-templates/send-email.ts'
import { TEMPLATES } from './transactional-email-templates/registry.ts'

/**
 * Sends a registered app email through Lovable's managed email API and records
 * the outcome in `email_send_log`.
 *
 * The name is kept for call-site compatibility: sending is now synchronous —
 * delivery, retries, rate limiting and suppression are handled by Lovable.
 */
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

  const logSend = async (
    status: 'sent' | 'suppressed' | 'failed',
    errorMessage?: string,
  ) => {
    const { error } = await supabase.from('email_send_log').insert({
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status,
      error_message: errorMessage ?? null,
    })
    if (error) {
      console.error('Failed to write email_send_log', {
        code: error.code,
        message: error.message,
        status,
      })
    }
  }

  let result
  try {
    result = await sendTemplateEmail(templateName, effectiveRecipient, {
      templateData,
      idempotencyKey,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logSend('failed', message)
    throw error
  }

  if (!result.sent) {
    await logSend('suppressed')
    return { success: false, reason: 'email_suppressed' }
  }

  await logSend('sent')
  return { success: true, queued: false }
}
