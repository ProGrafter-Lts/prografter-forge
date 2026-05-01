/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  reference?: string
  projectTitle?: string
  otherPartyName?: string
  amountFormatted?: string
  startDate?: string
  contractUrl?: string
}

const ContractActivatedEmail = ({
  firstName,
  reference = 'PG-XXXX-XXXX',
  projectTitle = 'your project',
  otherPartyName,
  amountFormatted,
  startDate,
  contractUrl,
}: Props) => (
  <ProGrafterShell
    preview={`Contract activated — work can begin on ${projectTitle}`}
    heading="Contract activated."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Both parties have signed. The contract for <strong>{projectTitle}</strong> is now
      active and work can begin.
    </Para>
    <RefCard
      reference={reference}
      projectTitle={projectTitle}
      otherParty={otherPartyName}
      amount={amountFormatted}
      startDate={startDate}
    />
    <Para>
      All site updates, variations, and milestone payments will run through ProGrafter
      from here. You'll receive notifications at each stage so nothing slips through.
    </Para>
    <CTA href={contractUrl || `${SITE_URL}/dashboard`} label="Open project" />
  </ProGrafterShell>
)

export const template = {
  component: ContractActivatedEmail,
  subject: (data: Record<string, any>) =>
    `Contract activated — work can begin on ${data?.projectTitle ?? 'your project'}`,
  displayName: 'Contract activated',
  previewData: {
    firstName: 'Jane',
    reference: 'PG-2026-0042',
    projectTitle: 'Kitchen extension, Hackney',
    otherPartyName: 'Sam (BuildCo Ltd)',
    amountFormatted: '£24,500',
    startDate: '12 Jun 2026',
  },
} satisfies TemplateEntry
