/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  projectTitle?: string
  projectAddress?: string
  plannedCompletion?: string
  jobId?: string
  reference?: string
}

const ProjectOverdueTradeEmail = ({
  firstName,
  projectTitle = 'your project',
  projectAddress,
  plannedCompletion,
  jobId,
  reference = 'PG-XXXX-XXXX',
}: Props) => (
  <ProGrafterShell
    preview="Your project has passed its planned completion date"
    heading="Project past its planned completion date."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Your project <strong>{projectTitle}</strong>
      {projectAddress ? <> at <strong>{projectAddress}</strong></> : null} has passed its
      planned completion date{plannedCompletion ? <> of <strong>{plannedCompletion}</strong></> : null}.
    </Para>
    <Para>
      Please submit a revised timeline using the variation flow so your homeowner knows
      what to expect.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} />
    <CTA
      href={jobId ? `${SITE_URL}/projects/${jobId}` : `${SITE_URL}/trade-dashboard`}
      label="Open project"
    />
  </ProGrafterShell>
)

export const template = {
  component: ProjectOverdueTradeEmail,
  subject: 'Project past its planned completion date',
  displayName: 'Project overdue (trade)',
  previewData: {
    firstName: 'Sam',
    projectTitle: 'Kitchen extension',
    projectAddress: 'Hackney, London',
    plannedCompletion: '12 May 2026',
    reference: 'PG-2026-0042',
  },
} satisfies TemplateEntry
