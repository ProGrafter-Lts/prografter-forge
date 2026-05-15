import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, SITE_NAME } from './_brand.tsx'

interface TradeVerificationSubmittedProps {
  firstName?: string
}

const TradeVerificationSubmittedEmail = ({ firstName }: TradeVerificationSubmittedProps) => (
  <ProGrafterShell
    preview="Documents received — verification in progress"
    heading="Documents received."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Thanks — we've received the documents for your {SITE_NAME} verification. Our team
      will review them in 1–2 working days. We'll email you as soon as a decision has
      been made.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: TradeVerificationSubmittedEmail,
  subject: `${SITE_NAME} — verification documents received`,
  displayName: 'Trade verification submitted',
  previewData: { firstName: 'Sam' },
} satisfies TemplateEntry
