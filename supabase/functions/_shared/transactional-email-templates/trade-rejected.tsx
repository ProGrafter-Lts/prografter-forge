import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, SITE_NAME } from './_brand.tsx'

interface TradeRejectedProps {
  firstName?: string
  reason?: string
}

const TradeRejectedEmail = ({ firstName, reason }: TradeRejectedProps) => (
  <ProGrafterShell
    preview={`Update on your ${SITE_NAME} verification`}
    heading="Verification update."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Thanks for applying to {SITE_NAME}. After reviewing your application, we're unable
      to approve your account at this time.
    </Para>
    {reason ? <InfoCard title="Reviewer notes">{reason}</InfoCard> : null}
    <Para>
      If you believe this was a mistake or your circumstances change (new insurance,
      updated certifications, etc.), reply to this email and we'll take another look.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: TradeRejectedEmail,
  subject: `${SITE_NAME} — verification update`,
  displayName: 'Trade verification rejected',
  previewData: { firstName: 'Sam', reason: 'Insurance certificate had expired.' },
} satisfies TemplateEntry
