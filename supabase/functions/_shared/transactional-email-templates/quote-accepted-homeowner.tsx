/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, RefCard, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  homeownerFirstName?: string
  reference?: string
  projectTitle?: string
  amount?: string
  tradeName?: string
  tradePhone?: string
  tradeEmail?: string
  workspaceUrl?: string
}

const QuoteAcceptedHomeownerEmail = ({
  homeownerFirstName,
  reference = '—',
  projectTitle = 'your project',
  amount = '£0.00',
  tradeName = 'your trade',
  tradePhone,
  tradeEmail,
  workspaceUrl = `${SITE_URL}/dashboard`,
}: Props) => (
  <ProGrafterShell
    preview={`You've accepted ${tradeName}'s quote`}
    heading={`You've accepted ${tradeName}'s quote.`}
    signoff="The ProGrafter Team"
  >
    <Para>{homeownerFirstName ? `Hi ${homeownerFirstName},` : 'Hi there,'}</Para>
    <Para>
      You've accepted <Strong>{tradeName}</Strong>'s quote of <Strong>{amount}</Strong> for{' '}
      <Strong>{projectTitle}</Strong>. Here's what's been agreed and what happens next.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} amount={amount} otherParty={tradeName} />
    <InfoCard title="What happens next">
      1. Both you and {tradeName} sign the contract in your workspace.<br />
      2. Your deposit is held securely in escrow — released only as milestones complete.<br />
      3. {tradeName} confirms and schedules the start date.
    </InfoCard>
    <InfoCard title="Your trade's contact">
      {tradeName}
      {tradePhone ? <><br />Phone: {tradePhone}</> : null}
      <br />Email: {tradeEmail || 'hello@prografter.co.uk'}
    </InfoCard>
    <CTA href={workspaceUrl} label="Review &amp; sign your contract" />
  </ProGrafterShell>
)

export const template = {
  component: QuoteAcceptedHomeownerEmail,
  subject: "You've accepted a quote",
  displayName: 'Quote accepted (homeowner)',
  previewData: {
    homeownerFirstName: 'Jane',
    reference: 'PG-AB12CD',
    projectTitle: 'Kitchen rewire',
    amount: '£4,800.00',
    tradeName: 'BrightSpark Electrical',
    tradePhone: '07700 900456',
    tradeEmail: 'sam@brightspark.example',
  },
} satisfies TemplateEntry
