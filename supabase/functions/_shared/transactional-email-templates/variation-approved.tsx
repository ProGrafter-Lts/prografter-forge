/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  reference?: string
  projectTitle?: string
  otherPartyName?: string
  variationTitle?: string
  costChangeFormatted?: string
  programmeImpactDays?: number
  contractUrl?: string
}

const VariationApprovedEmail = ({
  firstName,
  reference = 'PG-XXXX-XXXX',
  projectTitle = 'your project',
  otherPartyName,
  variationTitle = 'The variation',
  costChangeFormatted,
  programmeImpactDays,
  contractUrl,
}: Props) => (
  <ProGrafterShell
    preview={`Variation approved on ${projectTitle}`}
    heading="Variation approved."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Both parties have signed off the variation on <strong>{projectTitle}</strong>.
      It's now part of the contract and work can proceed.
    </Para>
    <RefCard
      reference={reference}
      projectTitle={projectTitle}
      otherParty={otherPartyName}
    />
    <Para>
      <strong style={{ color: '#1B3A5C' }}>{variationTitle}</strong>
      {costChangeFormatted ? <><br />Cost change: {costChangeFormatted}</> : null}
      {typeof programmeImpactDays === 'number' && programmeImpactDays !== 0 ? (
        <>
          <br />Programme impact: {programmeImpactDays > 0 ? '+' : ''}{programmeImpactDays} day{Math.abs(programmeImpactDays) === 1 ? '' : 's'}
        </>
      ) : null}
    </Para>
    <CTA href={contractUrl || `${SITE_URL}/dashboard`} label="Open project" />
  </ProGrafterShell>
)

export const template = {
  component: VariationApprovedEmail,
  subject: (data: Record<string, any>) =>
    `Variation approved on ${data?.projectTitle ?? 'your project'}`,
  displayName: 'Variation approved',
  previewData: {
    firstName: 'Sam',
    reference: 'PG-2026-0042',
    projectTitle: 'Kitchen extension, Hackney',
    otherPartyName: 'Jane Mitchell',
    variationTitle: 'Upgrade to oak flooring',
    costChangeFormatted: '+£1,200',
    programmeImpactDays: 2,
  },
} satisfies TemplateEntry
