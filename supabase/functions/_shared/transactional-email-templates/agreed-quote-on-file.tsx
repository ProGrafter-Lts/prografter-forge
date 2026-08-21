/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  tradeName?: string
  amount?: string
  projectTitle?: string
  projectAddress?: string
  jobId?: string
}

const AgreedQuoteOnFileEmail = ({
  firstName,
  tradeName = 'your trade',
  amount = '£0.00',
  projectTitle = 'your project',
  projectAddress,
  jobId,
}: Props) => (
  <ProGrafterShell
    preview="Your agreed quote and contract are now on file"
    heading="Your agreed quote and contract are now on file."
    signoff="The ProGrafter Team"
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      This isn't a new quote — nothing has changed. We've simply added the terms you already
      agreed with <Strong>{tradeName}</Strong> to your ProGrafter project file so everything
      lives in one place.
    </Para>
    <InfoCard title="On file">
      {projectTitle}
      {projectAddress ? <><br />{projectAddress}</> : null}
      <br />Agreed value: {amount}
      <br />Documents: agreed quote and contract
    </InfoCard>
    <Para>
      No action is needed. You can open your project file at any time to view or download
      the documents.
    </Para>
    <CTA
      href={jobId ? `${SITE_URL}/project/${jobId}` : `${SITE_URL}/dashboard`}
      label="View your project file"
    />
  </ProGrafterShell>
)

export const template = {
  component: AgreedQuoteOnFileEmail,
  subject: 'Your agreed quote and contract are now on file',
  displayName: 'Agreed quote & contract on file (homeowner)',
  previewData: {
    firstName: 'Jane',
    tradeName: 'Draftline Construction',
    amount: '£42,000.00',
    projectTitle: 'Single Storey Extension',
    projectAddress: '7 Smedley Close',
  },
} satisfies TemplateEntry
