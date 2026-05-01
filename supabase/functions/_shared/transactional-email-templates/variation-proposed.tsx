/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  reference?: string
  projectTitle?: string
  proposerName?: string
  variationTitle?: string
  variationDescription?: string
  costChangeFormatted?: string
  programmeImpactDays?: number
  contractUrl?: string
}

const VariationProposedEmail = ({
  firstName,
  reference = 'PG-XXXX-XXXX',
  projectTitle = 'your project',
  proposerName,
  variationTitle = 'A variation',
  variationDescription,
  costChangeFormatted,
  programmeImpactDays,
  contractUrl,
}: Props) => (
  <ProGrafterShell
    preview={`A variation has been proposed on ${projectTitle}`}
    heading="A variation needs your review."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      {proposerName ? <strong>{proposerName}</strong> : 'Your counterparty'} has proposed a
      variation on <strong>{projectTitle}</strong>. No work on the variation can start
      until you've signed it off.
    </Para>
    <RefCard
      reference={reference}
      projectTitle={projectTitle}
      otherParty={proposerName}
    />
    <Para>
      <strong style={{ color: '#1B3A5C' }}>{variationTitle}</strong>
      {variationDescription ? <><br />{variationDescription}</> : null}
      {costChangeFormatted ? <><br />Cost change: {costChangeFormatted}</> : null}
      {typeof programmeImpactDays === 'number' && programmeImpactDays !== 0 ? (
        <>
          <br />Programme impact: {programmeImpactDays > 0 ? '+' : ''}{programmeImpactDays} day{Math.abs(programmeImpactDays) === 1 ? '' : 's'}
        </>
      ) : null}
    </Para>
    <CTA href={contractUrl || `${SITE_URL}/dashboard`} label="Review variation" />
  </ProGrafterShell>
)

export const template = {
  component: VariationProposedEmail,
  subject: (data: Record<string, any>) =>
    `A variation has been proposed on ${data?.projectTitle ?? 'your project'}`,
  displayName: 'Variation proposed',
  previewData: {
    firstName: 'Jane',
    reference: 'PG-2026-0042',
    projectTitle: 'Kitchen extension, Hackney',
    proposerName: 'Sam (BuildCo Ltd)',
    variationTitle: 'Upgrade to oak flooring',
    variationDescription: 'Client requested oak in place of engineered laminate.',
    costChangeFormatted: '+£1,200',
    programmeImpactDays: 2,
  },
} satisfies TemplateEntry
