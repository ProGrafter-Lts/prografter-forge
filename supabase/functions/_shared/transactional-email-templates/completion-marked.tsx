/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  reference?: string
  projectTitle?: string
  tradeName?: string
  contractUrl?: string
}

const CompletionMarkedEmail = ({
  firstName,
  reference = 'PG-XXXX-XXXX',
  projectTitle = 'your project',
  tradeName,
  contractUrl,
}: Props) => (
  <ProGrafterShell
    preview="Your trade has marked the work complete — please review"
    heading="Time to inspect the work."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      {tradeName ? <strong>{tradeName}</strong> : 'Your trade'} has marked the work on{' '}
      <strong>{projectTitle}</strong> as complete.
    </Para>
    <RefCard
      reference={reference}
      projectTitle={projectTitle}
      otherParty={tradeName}
    />
    <Para>
      Please walk the project, check it against the agreed scope, and either accept
      practical completion or raise any snags. The final milestone payment is held
      until you accept.
    </Para>
    <CTA href={contractUrl || `${SITE_URL}/dashboard`} label="Review the work" />
  </ProGrafterShell>
)

export const template = {
  component: CompletionMarkedEmail,
  subject: 'Your trade has marked the work complete — please review',
  displayName: 'Completion marked',
  previewData: {
    firstName: 'Jane',
    reference: 'PG-2026-0042',
    projectTitle: 'Kitchen extension, Hackney',
    tradeName: 'Sam (BuildCo Ltd)',
  },
} satisfies TemplateEntry
