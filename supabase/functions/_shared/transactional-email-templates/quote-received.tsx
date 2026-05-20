/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  tradeName?: string
  amount?: string
  projectTitle?: string
  projectAddress?: string
  jobId?: string
}

const QuoteReceivedEmail = ({
  firstName,
  tradeName = 'A trade',
  amount = '£0.00',
  projectTitle = 'your project',
  projectAddress,
  jobId,
}: Props) => (
  <ProGrafterShell
    preview={`You've received a quote for ${projectTitle}`}
    heading="You've received a quote."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      <strong>{tradeName}</strong> has submitted a quote of <strong>{amount}</strong> for
      your <strong>{projectTitle}</strong>
      {projectAddress ? <> at <strong>{projectAddress}</strong></> : null}.
    </Para>
    <Para>Log in to review the breakdown, ask questions, or accept the quote.</Para>
    <CTA
      href={jobId ? `${SITE_URL}/compare-quotes?job=${jobId}` : `${SITE_URL}/dashboard`}
      label="Review the quote"
    />
  </ProGrafterShell>
)

export const template = {
  component: QuoteReceivedEmail,
  subject: "You've received a quote",
  displayName: 'Quote received (homeowner)',
  previewData: {
    firstName: 'Jane',
    tradeName: 'BuildCo Ltd',
    amount: '£18,500.00',
    projectTitle: 'Kitchen extension',
    projectAddress: 'Hackney, London',
  },
} satisfies TemplateEntry
