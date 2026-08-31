/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  amount?: string
  description?: string
  projectTitle?: string
  tradeName?: string
  reference?: string
  jobId?: string
}

const DrawdownApprovalNeededEmail = ({
  firstName,
  amount = '£0.00',
  description = 'Mobilization drawdown',
  projectTitle = 'your project',
  tradeName,
  reference = 'PG-XXXX-XXXX',
  jobId = '',
}: Props) => (
  <ProGrafterShell
    preview={`Approval needed: ${amount} mobilization drawdown`}
    heading="A drawdown needs your approval."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      {tradeName ? <strong>{tradeName}</strong> : 'Your trade'} has requested{' '}
      <strong>{amount}</strong> from your mobilization funds on{' '}
      <strong>{projectTitle}</strong>.
    </Para>
    <Para>
      <strong>What it's for:</strong> {description}
    </Para>
    <Para>
      Nothing moves until you approve it. Review and approve or decline in your project wallet.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} otherParty={tradeName} />
    <CTA href={`${SITE_URL}/project/${jobId}/wallet`} label="Review request" />
  </ProGrafterShell>
)

export const template = {
  component: DrawdownApprovalNeededEmail,
  subject: 'Approval needed: mobilization drawdown',
  displayName: 'Drawdown approval needed (homeowner)',
  previewData: {
    firstName: 'Jane',
    amount: '£1,800.00',
    description: 'Steel order deposit and site set-up',
    projectTitle: 'Kitchen extension, Hackney',
    tradeName: 'Sam (BuildCo Ltd)',
    reference: 'PG-2026-0042',
    jobId: '00000000-0000-0000-0000-000000000000',
  },
} satisfies TemplateEntry
