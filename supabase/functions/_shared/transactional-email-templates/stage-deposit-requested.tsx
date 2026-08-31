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
  jobId?: string
  isReminder?: boolean
}

const StageDepositRequestedEmail = ({
  firstName,
  amount = '£0.00',
  stageName = 'the next stage',
  projectTitle = 'your project',
  tradeName,
  reference = 'PG-XXXX-XXXX',
  jobId = '',
  isReminder = false,
}: Props) => (
  <ProGrafterShell
    preview={`${isReminder ? 'Reminder: ' : ''}Deposit due for ${stageName}`}
    heading={isReminder ? 'Reminder: next stage deposit.' : 'Time to fund the next stage.'}
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      {isReminder
        ? 'This is a one-off reminder — we still need the deposit for the next stage on '
        : 'The previous stage payment has just been released, so the next stage is now due for funding on '}
      <strong>{projectTitle}</strong>.
    </Para>
    <Para>
      <strong>{stageName}</strong> — <strong>{amount}</strong>
    </Para>
    <Para>
      Work on this stage can't be released until it's funded. If an inspection passes first,
      your project will simply show "inspection passed — awaiting funds" until the deposit lands.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} otherParty={tradeName} />
    <CTA href={`${SITE_URL}/project/${jobId}/wallet`} label="Fund this stage" />
  </ProGrafterShell>
)

export const template = {
  component: StageDepositRequestedEmail,
  subject: (data: Record<string, any>) =>
    data?.isReminder ? 'Reminder: next stage deposit due' : 'Next stage deposit due',
  displayName: 'Stage deposit requested (homeowner)',
  previewData: {
    firstName: 'Jane',
    amount: '£4,000.00',
    stageName: 'First fix',
    projectTitle: 'Kitchen extension, Hackney',
    tradeName: 'Sam (BuildCo Ltd)',
    reference: 'PG-2026-0042',
    jobId: '00000000-0000-0000-0000-000000000000',
    isReminder: false,
  },
} satisfies TemplateEntry
