/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  amount?: string
  stageName?: string
  projectTitle?: string
  tradeName?: string
  reference?: string
}

const PaymentReleasedHomeownerEmail = ({
  firstName,
  amount = '£0.00',
  stageName = 'a project stage',
  projectTitle = 'your project',
  tradeName,
  reference = 'PG-XXXX-XXXX',
}: Props) => (
  <ProGrafterShell
    preview={`Payment of ${amount} released to your trade`}
    heading="Payment released."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Your payment of <strong>{amount}</strong> for <strong>{stageName}</strong> on{' '}
      <strong>{projectTitle}</strong> has been released
      {tradeName ? <> to <strong>{tradeName}</strong></> : ' to your trade'}.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} otherParty={tradeName} />
    <CTA href={`${SITE_URL}/dashboard`} label="View project" />
  </ProGrafterShell>
)

export const template = {
  component: PaymentReleasedHomeownerEmail,
  subject: 'Payment released to your trade',
  displayName: 'Payment released (homeowner)',
  previewData: {
    firstName: 'Jane',
    amount: '£2,400.00',
    stageName: 'First fix',
    projectTitle: 'Kitchen extension, Hackney',
    tradeName: 'Sam (BuildCo Ltd)',
    reference: 'PG-2026-0042',
  },
} satisfies TemplateEntry
