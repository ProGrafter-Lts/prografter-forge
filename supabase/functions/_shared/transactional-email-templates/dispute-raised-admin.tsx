/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, Strong, RefCard, InfoCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  reference?: string
  projectTitle?: string
  raisedByName?: string
  raisedByRole?: string
  otherPartyName?: string
  issue?: string
  desiredOutcome?: string
  amountDisputed?: string
  escrowFrozen?: string
  adminUrl?: string
}

const DisputeRaisedAdminEmail = ({
  reference = '—',
  projectTitle = 'a project',
  raisedByName = '—',
  raisedByRole = '—',
  otherPartyName = '—',
  issue,
  desiredOutcome,
  amountDisputed,
  escrowFrozen,
  adminUrl = `${SITE_URL}/admin/disputes`,
}: Props) => (
  <ProGrafterShell
    preview={`URGENT: Dispute raised on ${projectTitle}`}
    heading="⚠️ URGENT — Dispute raised."
    signoff="ProGrafter system"
  >
    <Para>
      <Strong>Priority action required.</Strong> A dispute has been raised and escrow is frozen.
    </Para>
    <RefCard reference={reference} projectTitle={projectTitle} amount={amountDisputed} />
    <InfoCard title="Parties">
      <Strong>Raised by:</Strong> {raisedByName} ({raisedByRole})<br />
      <Strong>Other party:</Strong> {otherPartyName}<br />
      {escrowFrozen ? <><Strong>Escrow frozen:</Strong> {escrowFrozen}<br /></> : null}
      {amountDisputed ? <><Strong>Amount disputed:</Strong> {amountDisputed}</> : null}
    </InfoCard>
    {issue ? <InfoCard title="Issue">{issue}</InfoCard> : null}
    {desiredOutcome ? <InfoCard title="Desired outcome">{desiredOutcome}</InfoCard> : null}
    <CTA href={adminUrl} label="Open dispute dashboard" />
  </ProGrafterShell>
)

export const template = {
  component: DisputeRaisedAdminEmail,
  subject: '⚠️ URGENT — Dispute raised',
  displayName: 'Dispute raised (admin)',
  previewData: {
    reference: 'PG-AB12CD',
    projectTitle: 'Kitchen rewire',
    raisedByName: 'Jane Smith',
    raisedByRole: 'homeowner',
    otherPartyName: 'BrightSpark Electrical',
    issue: 'Quality of work — does not meet agreed standard.',
    desiredOutcome: 'Remedial work completed or partial refund.',
    amountDisputed: '£1,200.00',
    escrowFrozen: '£2,400.00',
  },
} satisfies TemplateEntry
