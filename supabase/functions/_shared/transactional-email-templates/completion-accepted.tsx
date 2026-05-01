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
  completedDate?: string
  defectsUntil?: string
  contractUrl?: string
}

const CompletionAcceptedEmail = ({
  firstName,
  reference = 'PG-XXXX-XXXX',
  projectTitle = 'your project',
  otherPartyName,
  amountFormatted,
  completedDate,
  defectsUntil,
  contractUrl,
}: Props) => (
  <ProGrafterShell
    preview={`Project completed — payment released for ${projectTitle}`}
    heading="Project complete."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      The homeowner has accepted practical completion of <strong>{projectTitle}</strong>.
      The final milestone payment has been released and the project is closed out.
    </Para>
    <RefCard
      reference={reference}
      projectTitle={projectTitle}
      otherParty={otherPartyName}
      amount={amountFormatted}
      startDate={completedDate ? `Completed ${completedDate}` : undefined}
    />
    {defectsUntil ? (
      <Para>
        The 12-month defects period runs until <strong>{defectsUntil}</strong>. Either
        party can raise a defect through ProGrafter during that window.
      </Para>
    ) : null}
    <CTA href={contractUrl || `${SITE_URL}/dashboard`} label="Open project" />
  </ProGrafterShell>
)

export const template = {
  component: CompletionAcceptedEmail,
  subject: (data: Record<string, any>) =>
    `Project completed — payment released for ${data?.projectTitle ?? 'your project'}`,
  displayName: 'Completion accepted',
  previewData: {
    firstName: 'Sam',
    reference: 'PG-2026-0042',
    projectTitle: 'Kitchen extension, Hackney',
    otherPartyName: 'Jane Mitchell',
    amountFormatted: '£24,500',
    completedDate: '28 Jul 2026',
    defectsUntil: '28 Jul 2027',
  },
} satisfies TemplateEntry
