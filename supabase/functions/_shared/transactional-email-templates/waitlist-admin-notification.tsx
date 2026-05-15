import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard } from './_brand.tsx'

interface WaitlistAdminNotificationProps {
  name?: string
  email?: string
  postcode?: string
  userType?: string
}

const WaitlistAdminNotificationEmail = ({
  name, email, postcode, userType,
}: WaitlistAdminNotificationProps) => (
  <ProGrafterShell
    preview={`New ProGrafter waitlist signup${name ? ` — ${name}` : ''}`}
    heading="New waitlist signup"
  >
    <Para>Someone just joined the ProGrafter early access waitlist.</Para>
    <InfoCard title="Signup details">
      <strong>Name:</strong> {name || '—'}<br />
      <strong>Email:</strong> {email || '—'}<br />
      <strong>Postcode:</strong> {postcode || '—'}<br />
      <strong>User type:</strong> {userType || '—'}
    </InfoCard>
  </ProGrafterShell>
)

export const template = {
  component: WaitlistAdminNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New waitlist signup${data?.name ? ` — ${data.name}` : ''} (${data?.userType || 'unknown'})`,
  to: 'hello@prografter.co.uk',
  displayName: 'Waitlist signup — admin notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    postcode: 'SW1A 1AA',
    userType: 'tradesperson',
  },
} satisfies TemplateEntry
