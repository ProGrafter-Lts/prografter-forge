import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, SITE_NAME } from './_brand.tsx'

interface WaitlistOutOfAreaProps {
  name?: string
}

const WaitlistOutOfAreaEmail = ({ name }: WaitlistOutOfAreaProps) => (
  <ProGrafterShell
    preview={`A quick update on your ${SITE_NAME} signup`}
    heading={name ? `Hi ${name},` : `A quick update`}
    signoff={`— The ${SITE_NAME} Team`}
  >
    <Para>
      Thanks so much for signing up to {SITE_NAME}. We really appreciate your interest.
    </Para>
    <Para>
      Right now we're operating in <strong>Nottinghamshire and the East Midlands only</strong>{' '}
      while we get established. Your postcode falls outside that launch area, so we're not
      able to send you verified job leads just yet.
    </Para>
    <InfoCard title="What happens next?">
      • We've kept your details on file.<br />
      • As soon as {SITE_NAME} expands to your area, we'll be in touch.<br />
      • No further action is needed from you for now.
    </InfoCard>
    <Para>
      If you believe you're within the Nottinghamshire / East Midlands area and have received
      this in error, just reply to this email and we'll sort it out.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: WaitlistOutOfAreaEmail,
  subject: `An update on your ${SITE_NAME} signup`,
  displayName: 'Waitlist — out of area',
  previewData: { name: 'David' },
} satisfies TemplateEntry
