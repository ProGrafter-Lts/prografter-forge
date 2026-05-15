import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, InfoCard, SITE_NAME, SITE_URL } from './_brand.tsx'

interface TradeVerificationQueryProps {
  firstName?: string
  message?: string
}

const TradeVerificationQueryEmail = ({ firstName, message }: TradeVerificationQueryProps) => (
  <ProGrafterShell
    preview={`Quick question about your ${SITE_NAME} application`}
    heading="One quick question."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>We need a bit more information to complete your verification.</Para>
    {message ? <InfoCard title={`From the ${SITE_NAME} team`}>{message}</InfoCard> : null}
    <Para>
      You can reply to this email directly, or update your profile to provide the info.
    </Para>
    <CTA href={`${SITE_URL}/dashboard/trade/settings`} label="Update your profile" />
  </ProGrafterShell>
)

export const template = {
  component: TradeVerificationQueryEmail,
  subject: `Quick question about your ${SITE_NAME} application`,
  displayName: 'Trade verification query',
  previewData: { firstName: 'Sam', message: 'Could you upload a clearer photo of your insurance certificate? The expiry date is unreadable.' },
} satisfies TemplateEntry
