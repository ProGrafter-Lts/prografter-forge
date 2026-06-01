/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, RefCard, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  tradeFirstName?: string
  reference?: string
  projectTitle?: string
  summary?: string
  amount?: string
  homeownerName?: string
  homeownerPhone?: string
  homeownerEmail?: string
  timeline?: string
  workspaceUrl?: string
}

const QuoteAcceptedTradeEmail = ({
  tradeFirstName,
  reference = '—',
  projectTitle = 'the project',
  summary,
  amount = '£0.00',
  homeownerName = 'The homeowner',
  homeownerPhone,
  homeownerEmail,
  timeline,
  workspaceUrl = `${SITE_URL}/dashboard`,
}: Props) => (
  <ProGrafterShell
    preview={`Your quote for ${projectTitle} has been accepted`}
    heading="Your quote has been accepted."
    signoff="The ProGrafter Team"
  >
    <Para>{tradeFirstName ? `Hi ${tradeFirstName},` : 'Hi there,'}</Para>
    <Para>
      Great news — <Strong>{homeownerName}</Strong> has accepted your quote of{' '}
      <Strong>{amount}</Strong> for <Strong>{projectTitle}</Strong>.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} amount={amount} otherParty={homeownerName} startDate={timeline} />
    {summary ? <InfoCard title="Brief summary">{summary}</InfoCard> : null}
    <InfoCard title="Homeowner contact">
      {homeownerName}
      {homeownerPhone ? <><br />Phone: {homeownerPhone}</> : null}
      {homeownerEmail ? <><br />Email: {homeownerEmail}</> : null}
    </InfoCard>
    <InfoCard title="Next steps">
      1. Sign the contract in your project workspace.<br />
      2. Confirm and schedule the start date with the homeowner.<br />
      3. Work begins once both parties have signed.
    </InfoCard>
    <CTA href={workspaceUrl} label="Open project workspace" />
  </ProGrafterShell>
)

export const template = {
  component: QuoteAcceptedTradeEmail,
  subject: 'Your quote has been accepted',
  displayName: 'Quote accepted (trade)',
  previewData: {
    tradeFirstName: 'Sam',
    reference: 'PG-AB12CD',
    projectTitle: 'Kitchen rewire',
    summary: 'Full rewire of kitchen including consumer unit upgrade.',
    amount: '£4,800.00',
    homeownerName: 'Jane Smith',
    homeownerPhone: '07700 900123',
    homeownerEmail: 'jane@example.com',
    timeline: 'Within 2 weeks',
  },
} satisfies TemplateEntry
