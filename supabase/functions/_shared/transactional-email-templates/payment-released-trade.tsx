/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  amount?: string
  stageName?: string
  projectTitle?: string
  reference?: string
}

const PaymentReleasedTradeEmail = ({
  firstName,
  amount = '£0.00',
  stageName = 'a project stage',
  projectTitle = 'your project',
  reference = 'PG-XXXX-XXXX',
}: Props) => (
  <ProGrafterShell
    preview={`Payment of ${amount} released to you`}
    heading="Payment released to you."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Your payment of <strong>{amount}</strong> for <strong>{stageName}</strong> on{' '}
      <strong>{projectTitle}</strong> has been released. It will appear in your Stripe
      account within 2–5 working days.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} />
    <CTA href={`${SITE_URL}/trade-dashboard`} label="View earnings" />
  </ProGrafterShell>
)

export const template = {
  component: PaymentReleasedTradeEmail,
  subject: 'Payment released to you',
  displayName: 'Payment released (trade)',
  previewData: {
    firstName: 'Sam',
    amount: '£2,400.00',
    stageName: 'First fix',
    projectTitle: 'Kitchen extension, Hackney',
    reference: 'PG-2026-0042',
  },
} satisfies TemplateEntry
