/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, RefCard, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  tradeFirstName?: string
  reference?: string
  jobTitle?: string
  summary?: string
  trade?: string
  valueBand?: string
  location?: string
  briefUrl?: string
}

const NewJobInAreaEmail = ({
  tradeFirstName,
  reference = '—',
  jobTitle = 'A new job',
  summary,
  trade,
  valueBand,
  location = 'your area',
  briefUrl = `${SITE_URL}/dashboard/trade`,
}: Props) => (
  <ProGrafterShell
    preview={`New ${trade || 'job'} brief in ${location}`}
    heading="New job in your area."
    signoff="The ProGrafter Team"
  >
    <Para>{tradeFirstName ? `Hi ${tradeFirstName},` : 'Hi there,'}</Para>
    <Para>
      A new <Strong>{jobTitle}</Strong> brief has been published in <Strong>{location}</Strong> and
      matches your trade and service area.
    </Para>
    <RefCard reference={reference} projectTitle={jobTitle} amount={valueBand} />
    {summary ? <InfoCard title="Brief summary">{summary}</InfoCard> : null}
    <Para>
      Homeowner contact details stay private until they invite you to quote. Review the full brief and
      submit your quote to be considered.
    </Para>
    <CTA href={briefUrl} label="View brief &amp; submit a quote" />
  </ProGrafterShell>
)

export const template = {
  component: NewJobInAreaEmail,
  subject: 'New job in your area',
  displayName: 'New job in your area (trade)',
  previewData: {
    tradeFirstName: 'Sam',
    reference: 'PG-AB12CD',
    jobTitle: 'Kitchen rewire',
    summary: 'Full rewire of a 3-bed semi kitchen including consumer unit upgrade.',
    trade: 'Electrician',
    valueBand: '£3,000 – £5,000',
    location: 'Leeds',
  },
} satisfies TemplateEntry
