/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  projectTitle?: string
  tradeName?: string
  plannedCompletion?: string
  jobId?: string
  reference?: string
}

const ProjectOverdueHomeownerEmail = ({
  firstName,
  projectTitle = 'your project',
  tradeName,
  plannedCompletion,
  jobId,
  reference = 'PG-XXXX-XXXX',
}: Props) => (
  <ProGrafterShell
    preview="Your project is running past its planned completion date"
    heading="Project running past schedule."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Your project <strong>{projectTitle}</strong> is running past its planned completion
      date{plannedCompletion ? <> of <strong>{plannedCompletion}</strong></> : null}.
    </Para>
    <Para>
      {tradeName ? <strong>{tradeName}</strong> : 'Your trade'} will be in touch with a
      revised timeline shortly. If you don't hear within 48 hours, you can message them
      directly from your dashboard.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} otherParty={tradeName} />
    <CTA
      href={jobId ? `${SITE_URL}/projects/${jobId}` : `${SITE_URL}/dashboard`}
      label="View project"
    />
  </ProGrafterShell>
)

export const template = {
  component: ProjectOverdueHomeownerEmail,
  subject: 'Your project is running past its planned completion date',
  displayName: 'Project overdue (homeowner)',
  previewData: {
    firstName: 'Jane',
    projectTitle: 'Kitchen extension',
    tradeName: 'Sam (BuildCo Ltd)',
    plannedCompletion: '12 May 2026',
    reference: 'PG-2026-0042',
  },
} satisfies TemplateEntry
