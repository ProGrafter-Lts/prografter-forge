import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, CTA } from './_brand.tsx'

interface Props {
  name?: string
  reference?: string
  jobTitle?: string
  trade?: string
  budget?: string
  timeline?: string
  description?: string
  loginUrl?: string
}

const JobBriefHomeownerEmail = ({
  name,
  reference,
  jobTitle,
  trade,
  budget,
  timeline,
  description,
  loginUrl,
}: Props) => (
  <ProGrafterShell
    preview={`Your job brief ${reference || ''} has been received`}
    heading={name ? `Thanks, ${name} — your brief is in` : 'Your brief is in'}
    signoff="— The ProGrafter Team"
  >
    <Para>
      We've received your job brief. Our team reviews every brief before sharing
      it with vetted, insured trades in your area. You'll hear from us within 24 hours.
    </Para>

    <InfoCard title="Your reference">
      <strong>{reference || '—'}</strong> — quote this in any correspondence.
    </InfoCard>

    <InfoCard title="Brief summary">
      <strong>Job:</strong> {jobTitle || '—'}<br />
      <strong>Trade:</strong> {trade || '—'}<br />
      <strong>Budget:</strong> {budget || '—'}<br />
      <strong>Timeline:</strong> {timeline || '—'}<br />
      {description ? (
        <>
          <strong>Details:</strong> {description}
        </>
      ) : null}
    </InfoCard>

    <Para>
      <strong>What happens next?</strong> ProGrafter reviews your brief, matches it to
      verified trades, and notifies you for each quote received. Every trade is
      verified and insured before they go live. You stay in control — you choose
      who to work with.
    </Para>

    <Para>
      We've set up your free homeowner account so you can track your brief and
      quotes. Tap below to sign in securely — no password needed.
    </Para>

    <CTA href={loginUrl || 'https://prografter.co.uk/login'} label="View my dashboard" />
  </ProGrafterShell>
)

export const template = {
  component: JobBriefHomeownerEmail,
  subject: (data: Record<string, any>) =>
    `Job brief received${data?.reference ? ` — ${data.reference}` : ''}`,
  displayName: 'Job brief — homeowner confirmation',
  previewData: {
    name: 'Sarah Thompson',
    reference: 'PG-VF6TRI',
    jobTitle: 'Rewire kitchen and add sockets',
    trade: 'Electrician',
    budget: '£2,500–£5,000',
    timeline: 'Within a month',
    description: 'Full kitchen rewire with 6 new double sockets and under-cabinet lighting.',
    loginUrl: 'https://prografter.co.uk/login',
  },
} satisfies TemplateEntry
