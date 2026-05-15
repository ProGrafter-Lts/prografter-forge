import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, SITE_NAME } from './_brand.tsx'

interface WaitlistWelcomeProps {
  name?: string
}

const WaitlistWelcomeEmail = ({ name }: WaitlistWelcomeProps) => (
  <ProGrafterShell
    preview={`You're on the ${SITE_NAME} waitlist`}
    heading={name ? `Welcome, ${name}.` : `You're in.`}
    signoff={`— The ${SITE_NAME} Team`}
  >
    <Para>
      Thanks for joining the {SITE_NAME} early access waitlist. You're now on the list —
      we'll be in touch as soon as we launch in your area.
    </Para>
    <InfoCard title="What happens next?">
      • We'll email you the moment {SITE_NAME} goes live near you.<br />
      • You'll get first access to verified trades and homeowners.<br />
      • No spam. No noise. Just the updates that matter.
    </InfoCard>
    <Para>
      If you have any questions in the meantime, just reply to this email — we read
      every message.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: WaitlistWelcomeEmail,
  subject: `You're on the ${SITE_NAME} waitlist`,
  displayName: 'Waitlist welcome',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry
