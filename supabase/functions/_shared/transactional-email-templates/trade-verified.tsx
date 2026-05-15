import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, InfoCard, SITE_NAME, SITE_URL } from './_brand.tsx'

interface TradeVerifiedProps {
  firstName?: string
}

const TradeVerifiedEmail = ({ firstName }: TradeVerifiedProps) => (
  <ProGrafterShell
    preview={`You're verified — start quoting on ${SITE_NAME}`}
    heading={firstName ? `You're in, ${firstName}.` : `You're in.`}
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Good news. Your {SITE_NAME} account has been verified. You can now see and quote
      on homeowner jobs in your area.
    </Para>
    <InfoCard title="Your terms">
      • No subscription<br />
      • No lead fees<br />
      • 7.5% commission (capped at £900) only when you complete a project
    </InfoCard>
    <CTA href={`${SITE_URL}/dashboard/trade`} label="Browse available jobs" />
  </ProGrafterShell>
)

export const template = {
  component: TradeVerifiedEmail,
  subject: `You're verified — start quoting on ${SITE_NAME}`,
  displayName: 'Trade verified',
  previewData: { firstName: 'Sam' },
} satisfies TemplateEntry
