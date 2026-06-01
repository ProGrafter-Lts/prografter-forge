/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, RefCard, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  reference?: string
  projectTitle?: string
  amount?: string
  tradeName?: string
  homeownerName?: string
  adminUrl?: string
}

const NewQuoteAdminEmail = ({
  reference = '—',
  projectTitle = 'a project',
  amount = '£0.00',
  tradeName = '—',
  homeownerName,
  adminUrl = `${SITE_URL}/admin/job-briefs`,
}: Props) => (
  <ProGrafterShell
    preview={`New quote submitted — ${amount} for ${projectTitle}`}
    heading="New quote submitted."
    signoff="ProGrafter system"
  >
    <Para>A trade has submitted a new quote. Spot-check for quality below.</Para>
    <RefCard reference={reference} projectTitle={projectTitle} amount={amount} otherParty={tradeName} />
    <InfoCard title="Quote details">
      <Strong>Trade:</Strong> {tradeName}<br />
      <Strong>Quoted amount:</Strong> {amount}
      {homeownerName ? <><br /><Strong>Homeowner:</Strong> {homeownerName}</> : null}
    </InfoCard>
    <CTA href={adminUrl} label="Open admin dashboard" />
  </ProGrafterShell>
)

export const template = {
  component: NewQuoteAdminEmail,
  subject: 'New quote submitted — spot-check',
  displayName: 'New quote (admin)',
  previewData: {
    reference: 'QPG-2026-0042',
    projectTitle: 'Kitchen rewire',
    amount: '£4,800.00',
    tradeName: 'BrightSpark Electrical',
    homeownerName: 'Jane Smith',
  },
} satisfies TemplateEntry
