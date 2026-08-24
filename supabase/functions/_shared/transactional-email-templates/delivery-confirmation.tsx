import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, SITE_NAME, SITE_URL } from './_brand.tsx'

interface DeliveryConfirmationProps {
  firstName?: string
  audience?: 'trade' | 'homeowner'
}

const DeliveryConfirmationEmail = ({ firstName, audience }: DeliveryConfirmationProps) => (
  <ProGrafterShell
    preview={`Delivery check — ${SITE_NAME} emails are reaching you`}
    heading="Delivery check — this one matters"
    signoff={`— The ${SITE_NAME} Team`}
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      This is a one-off delivery check. If you're reading it, {SITE_NAME} emails are
      landing in your inbox correctly.
    </Para>
    <InfoCard title="Two things worth 30 seconds now">
      • Add <strong>hello@prografter.co.uk</strong> to your contacts<br />
      • If this landed in spam or promotions, drag it to your main inbox
    </InfoCard>
    <Para>
      {audience === 'trade'
        ? 'Job leads, reminders and verification updates all come from this address. Missing one costs you work.'
        : 'Quotes, contract updates and project alerts all come from this address.'}
    </Para>
    <Para>
      Nothing else to do. If you ever stop seeing our emails, check your spam folder first,
      then get in touch at {SITE_URL}/contact.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: DeliveryConfirmationEmail,
  subject: `Delivery check — ${SITE_NAME} emails are reaching you`,
  displayName: 'Signup delivery confirmation',
  previewData: { firstName: 'Sam', audience: 'trade' },
} satisfies TemplateEntry
