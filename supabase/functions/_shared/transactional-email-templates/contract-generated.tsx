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

const ContractGeneratedEmail = ({
  firstName,
  reference = 'PG-XXXX-XXXX',
  projectTitle = 'your project',
  otherPartyName,
  amountFormatted,
  startDate,
  contractUrl,
}: Props) => (
  <ProGrafterShell
    preview={`Your ProGrafter contract is ready to review — ${projectTitle}`}
    heading="Your contract is ready."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      A new ProGrafter contract has been generated for <strong>{projectTitle}</strong>.
      Please review it carefully — both parties need to sign before any work begins.
    </Para>
    <RefCard
      reference={reference}
      projectTitle={projectTitle}
      otherParty={otherPartyName}
      amount={amountFormatted}
      startDate={startDate}
    />
    <Para>
      Read the plain-English summary, the full legal text, and the guidance notes
      before you sign. You can ask for changes at any point — bespoke clauses
      reset the other party's signature so they re-confirm the new wording.
    </Para>
    <CTA href={contractUrl || `${SITE_URL}/dashboard`} label="Review and sign" />
  </ProGrafterShell>
)

export const template = {
  component: ContractGeneratedEmail,
  subject: (data: Record<string, any>) =>
    `Your ProGrafter contract is ready to review — ${data?.projectTitle ?? 'your project'}`,
  displayName: 'Contract generated',
  previewData: {
    firstName: 'Jane',
    reference: 'PG-2026-0042',
    projectTitle: 'Kitchen extension, Hackney',
    otherPartyName: 'Sam (BuildCo Ltd)',
    amountFormatted: '£24,500',
    startDate: '12 Jun 2026',
  },
} satisfies TemplateEntry
