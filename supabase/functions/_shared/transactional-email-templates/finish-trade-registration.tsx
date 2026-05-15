import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, InfoCard, SITE_NAME, SITE_URL } from './_brand.tsx'

const REGISTER_URL = `${SITE_URL}/register/trade`

interface FinishTradeRegistrationProps {
  name?: string
}

const FinishTradeRegistrationEmail = ({ name }: FinishTradeRegistrationProps) => (
  <ProGrafterShell
    preview={`Finish setting up your ${SITE_NAME} trade account`}
    heading={name ? `${name}, ready to finish up?` : `Ready to finish up?`}
    signoff={`— The ${SITE_NAME} Team`}
  >
    <Para>
      You joined the {SITE_NAME} waitlist — thanks for that. To start receiving leads and
      getting verified, you'll need to complete the full trade registration. It only
      takes a couple of minutes.
    </Para>
    <CTA href={REGISTER_URL} label="Finish my registration" />
    <InfoCard title="What you'll need">
      • Your trade and service area<br />
      • Insurance details (if you have them to hand)<br />
      • A password for your account
    </InfoCard>
    <Para>Any issues, just reply to this email and we'll sort it.</Para>
  </ProGrafterShell>
)

export const template = {
  component: FinishTradeRegistrationEmail,
  subject: `Finish your ${SITE_NAME} trade registration`,
  displayName: 'Finish trade registration',
  previewData: { name: 'David' },
} satisfies TemplateEntry
