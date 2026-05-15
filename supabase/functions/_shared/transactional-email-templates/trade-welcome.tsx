import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, InfoCard, SITE_NAME, SITE_URL } from './_brand.tsx'

interface TradeWelcomeProps {
  firstName?: string
}

const TradeWelcomeEmail = ({ firstName }: TradeWelcomeProps) => (
  <ProGrafterShell
    preview={`Application received — we'll be in touch within 1 working day`}
    heading={firstName ? `Thanks, ${firstName}.` : 'Application received.'}
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Thanks for applying to join {SITE_NAME}. We've received your details and documents
      and our team will review your application within 1 working day.
    </Para>
    <Para>
      You'll hear from us as soon as you're verified — at which point you can start
      quoting on homeowner jobs immediately.
    </Para>
    <InfoCard title="What happens next">
      • Our team reviews your application (within 1 working day)<br />
      • You'll get an email the moment you're verified<br />
      • Nothing else is needed from you right now
    </InfoCard>
    <CTA href={`${SITE_URL}/dashboard/trade`} label="View your dashboard" />
  </ProGrafterShell>
)

export const template = {
  component: TradeWelcomeEmail,
  subject: `Application received — we'll be in touch within 1 working day`,
  displayName: 'Trade welcome',
  previewData: { firstName: 'Sam' },
} satisfies TemplateEntry
