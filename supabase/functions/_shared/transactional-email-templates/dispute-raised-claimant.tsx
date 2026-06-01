/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, RefCard, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  recipientFirstName?: string
  reference?: string
  projectTitle?: string
  issue?: string
  workspaceUrl?: string
}

const DisputeRaisedClaimantEmail = ({
  recipientFirstName,
  reference = '—',
  projectTitle = 'your project',
  issue,
  workspaceUrl = `${SITE_URL}/dashboard`,
}: Props) => (
  <ProGrafterShell
    preview={`We've received your dispute for ${projectTitle}`}
    heading="We've received your dispute."
    signoff="The ProGrafter Resolution Team"
  >
    <Para>{recipientFirstName ? `Hi ${recipientFirstName},` : 'Hi there,'}</Para>
    <Para>
      Thank you — your dispute for <Strong>{projectTitle}</Strong> has been received and pending escrow
      payments are now frozen for your protection.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} />
    {issue ? <InfoCard title="What you raised">{issue}</InfoCard> : null}
    <InfoCard title="What happens next">
      Our team will review within <Strong>5 working days</Strong> and may ask you for further evidence.
      Please don't contact the other party directly while we review — we'll handle communication.
    </InfoCard>
    <CTA href={workspaceUrl} label="View your dispute" />
  </ProGrafterShell>
)

export const template = {
  component: DisputeRaisedClaimantEmail,
  subject: "We've received your dispute",
  displayName: 'Dispute raised (claimant)',
  previewData: {
    recipientFirstName: 'Jane',
    reference: 'PG-AB12CD',
    projectTitle: 'Kitchen rewire',
    issue: 'Quality of work — does not meet agreed standard.',
  },
} satisfies TemplateEntry
