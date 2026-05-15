import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard } from './_brand.tsx'

interface TradeSignupAdminProps {
  name?: string
  email?: string
  phone?: string
  postcode?: string
  companyName?: string
  tradeType?: string
  stage?: string
}

const TradeSignupAdminEmail = ({
  name, email, phone, postcode, companyName, tradeType, stage,
}: TradeSignupAdminProps) => (
  <ProGrafterShell
    preview={`New ProGrafter trade signup${name ? ` — ${name}` : ''}`}
    heading="New trade signup"
  >
    <Para>
      A new tradesperson has started signing up on ProGrafter.
      {stage === 'submitted_for_review'
        ? ' They have completed all steps and submitted for verification review.'
        : ' They have created their account — verification documents may still be pending.'}
    </Para>
    <InfoCard title="Applicant details">
      <strong>Name:</strong> {name || '—'}<br />
      <strong>Company:</strong> {companyName || '—'}<br />
      <strong>Trade:</strong> {tradeType || '—'}<br />
      <strong>Email:</strong> {email || '—'}<br />
      <strong>Phone:</strong> {phone || '—'}<br />
      <strong>Postcode:</strong> {postcode || '—'}<br />
      <strong>Stage:</strong> {stage || 'account_created'}
    </InfoCard>
    <Para>Review in the admin dashboard at /admin/verifications.</Para>
  </ProGrafterShell>
)

export const template = {
  component: TradeSignupAdminEmail,
  subject: (data: Record<string, any>) =>
    `New trade signup${data?.name ? ` — ${data.name}` : ''}${data?.stage === 'submitted_for_review' ? ' (submitted for review)' : ''}`,
  to: 'hello@prografter.co.uk',
  displayName: 'Trade signup — admin notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '07700 900000',
    postcode: 'SW1A 1AA',
    companyName: 'Doe Building Ltd',
    tradeType: 'Builder',
    stage: 'account_created',
  },
} satisfies TemplateEntry
