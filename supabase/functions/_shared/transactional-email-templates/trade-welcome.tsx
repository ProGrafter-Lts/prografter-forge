import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, InfoCard, SITE_NAME, SITE_URL } from './_brand.tsx'

interface TradeWelcomeProps {
  firstName?: string
}

const TradeWelcomeEmail = ({ firstName }: TradeWelcomeProps) => (
  <ProGrafterShell
    preview={`Welcome to ${SITE_NAME} — your application is being reviewed`}
    heading={firstName ? `Thanks, ${firstName}.` : 'Thanks for applying.'}
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Thanks for applying to {SITE_NAME}. Your application is under review. Typical
      turnaround is 1–2 working days. We'll email you as soon as you're approved and
      ready to start quoting on jobs.
    </Para>
    <InfoCard title="What we're checking">
      • Your public liability insurance<br />
      • Your photo ID<br />
      • Your trade qualifications
    </InfoCard>
    <CTA href={`${SITE_URL}/dashboard/trade`} label="View your dashboard" />
  </ProGrafterShell>
)

export const template = {
  component: TradeWelcomeEmail,
  subject: `Welcome to ${SITE_NAME} — your application is being reviewed`,
  displayName: 'Trade welcome',
  previewData: { firstName: 'Sam' },
} satisfies TemplateEntry
