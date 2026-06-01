/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, RefCard, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  reference?: string
  projectTitle?: string
  amount?: string
  homeownerName?: string
  tradeName?: string
  adminUrl?: string
}

const QuoteAcceptedAdminEmail = ({
  reference = '—',
  projectTitle = 'a project',
  amount = '£0.00',
  homeownerName = '—',
  tradeName = '—',
  adminUrl = `${SITE_URL}/admin/job-briefs`,
}: Props) => (
  <ProGrafterShell
    preview={`New accepted job — ${projectTitle} (${amount})`}
    heading="New accepted job to monitor."
    signoff="ProGrafter system"
  >
    <Para>A homeowner has just accepted a quote. Contract generation is underway.</Para>
    <RefCard reference={reference} projectTitle={projectTitle} amount={amount} />
    <InfoCard title="Parties">
      <Strong>Homeowner:</Strong> {homeownerName}<br />
      <Strong>Trade:</Strong> {tradeName}<br />
      <Strong>Project value:</Strong> {amount}
    </InfoCard>
    <CTA href={adminUrl} label="Open admin dashboard" />
  </ProGrafterShell>
)

export const template = {
  component: QuoteAcceptedAdminEmail,
  subject: 'New accepted job — monitor required',
  displayName: 'Quote accepted (admin)',
  previewData: {
    reference: 'PG-AB12CD',
    projectTitle: 'Kitchen rewire',
    amount: '£4,800.00',
    homeownerName: 'Jane Smith',
    tradeName: 'BrightSpark Electrical',
  },
} satisfies TemplateEntry
