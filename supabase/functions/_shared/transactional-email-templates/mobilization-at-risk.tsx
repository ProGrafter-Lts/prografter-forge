/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  amount?: string
  projectTitle?: string
  startDate?: string
  reference?: string
  jobId?: string
  audience?: 'trade' | 'homeowner'
}

const MobilizationAtRiskEmail = ({
  firstName,
  amount = '£0.00',
  projectTitle = 'the project',
  startDate = 'the booked start date',
  reference = 'PG-XXXX-XXXX',
  jobId = '',
  audience = 'trade',
}: Props) => (
  <ProGrafterShell
    preview={`Start date at risk on ${projectTitle}`}
    heading="Start date flagged at risk."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      The mobilization deposit of <strong>{amount}</strong> on <strong>{projectTitle}</strong> is
      still unfunded, and the funding deadline (one week before the booked start of{' '}
      <strong>{startDate}</strong>) has now passed.
    </Para>
    <Para>
      {audience === 'trade'
        ? "We've flagged the start date as at risk. Nothing has been rebooked or forfeited — it's your call whether to push the date back, and by how much."
        : "We've flagged the start date as at risk and let your trade know. Funding the mobilization deposit is the fastest way to keep the date."}
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} />
    <CTA href={`${SITE_URL}/project/${jobId}/wallet`} label="View project wallet" />
  </ProGrafterShell>
)

export const template = {
  component: MobilizationAtRiskEmail,
  subject: 'Start date at risk — mobilization unfunded',
  displayName: 'Mobilization at risk',
  previewData: {
    firstName: 'Sam',
    amount: '£3,500.00',
    projectTitle: 'Kitchen extension, Hackney',
    startDate: '12 October 2026',
    reference: 'PG-2026-0042',
    jobId: '00000000-0000-0000-0000-000000000000',
    audience: 'trade',
  },
} satisfies TemplateEntry
