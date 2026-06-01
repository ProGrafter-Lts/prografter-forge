/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, RefCard, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  recipientFirstName?: string
  reference?: string
  projectTitle?: string
  issue?: string
  raisedByRole?: string
  workspaceUrl?: string
}

const DisputeRaisedOtherPartyEmail = ({
  recipientFirstName,
  reference = '—',
  projectTitle = 'your project',
  issue,
  raisedByRole = 'the other party',
  workspaceUrl = `${SITE_URL}/dashboard`,
}: Props) => (
  <ProGrafterShell
    preview={`A dispute has been raised on ${projectTitle}`}
    heading="A dispute has been raised."
    signoff="The ProGrafter Resolution Team"
  >
    <Para>{recipientFirstName ? `Hi ${recipientFirstName},` : 'Hi there,'}</Para>
    <Para>
      A dispute has been raised by <Strong>{raisedByRole}</Strong> on{' '}
      <Strong>{projectTitle}</Strong>. Pending escrow payments are now frozen while we review.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} />
    {issue ? <InfoCard title="What was raised">{issue}</InfoCard> : null}
    <InfoCard title="What happens next">
      Our team will review within <Strong>5 working days</Strong> and contact you for your side of the
      story. Please <Strong>do not contact the other party directly</Strong> until ProGrafter has reviewed
      — it protects you and keeps the process fair.
    </InfoCard>
    <CTA href={workspaceUrl} label="View the dispute" />
  </ProGrafterShell>
)

export const template = {
  component: DisputeRaisedOtherPartyEmail,
  subject: 'A dispute has been raised on your project',
  displayName: 'Dispute raised (other party)',
  previewData: {
    recipientFirstName: 'Sam',
    reference: 'PG-AB12CD',
    projectTitle: 'Kitchen rewire',
    issue: 'Quality of work — does not meet agreed standard.',
    raisedByRole: 'the homeowner',
  },
} satisfies TemplateEntry
