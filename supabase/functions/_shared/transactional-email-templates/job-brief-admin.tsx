import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, CTA } from './_brand.tsx'

interface Props {
  reference?: string
  name?: string
  email?: string
  phone?: string
  address?: string
  postcode?: string
  propertyType?: string
  jobTitle?: string
  trade?: string
  description?: string
  budget?: string
  timeline?: string
  access?: string
  planningPermission?: string
  buildingRegs?: string
  scopeItems?: string
  knownIssues?: string
  notes?: string
  adminUrl?: string
}

const JobBriefAdminEmail = (p: Props) => (
  <ProGrafterShell
    preview={`New job brief ${p.reference || ''} from ${p.name || 'a homeowner'}`}
    heading="New job brief submitted"
  >
    <Para>A homeowner has submitted a new job brief. Full details below.</Para>

    <InfoCard title="Reference">
      <strong>{p.reference || '—'}</strong>
    </InfoCard>

    <InfoCard title="Homeowner contact">
      <strong>Name:</strong> {p.name || '—'}<br />
      <strong>Email:</strong> {p.email || '—'}<br />
      <strong>Phone:</strong> {p.phone || '—'}<br />
      <strong>Address:</strong> {p.address || '—'}<br />
      <strong>Postcode:</strong> {p.postcode || '—'}<br />
      <strong>Property:</strong> {p.propertyType || '—'}
    </InfoCard>

    <InfoCard title="The job">
      <strong>Title:</strong> {p.jobTitle || '—'}<br />
      <strong>Trade:</strong> {p.trade || '—'}<br />
      <strong>Budget:</strong> {p.budget || '—'}<br />
      <strong>Timeline:</strong> {p.timeline || '—'}<br />
      <strong>Description:</strong> {p.description || '—'}
    </InfoCard>

    <InfoCard title="Scope, access & regs">
      <strong>Scope items:</strong> {p.scopeItems || '—'}<br />
      <strong>Known issues:</strong> {p.knownIssues || '—'}<br />
      <strong>Access:</strong> {p.access || '—'}<br />
      <strong>Planning permission:</strong> {p.planningPermission || '—'}<br />
      <strong>Building regs:</strong> {p.buildingRegs || '—'}<br />
      <strong>Notes:</strong> {p.notes || '—'}
    </InfoCard>

    <CTA href={p.adminUrl || 'https://prografter.co.uk/admin/job-briefs'} label="Open in admin dashboard" />
  </ProGrafterShell>
)

export const template = {
  component: JobBriefAdminEmail,
  subject: (data: Record<string, any>) =>
    `New job brief${data?.reference ? ` ${data.reference}` : ''}${data?.name ? ` — ${data.name}` : ''}`,
  to: 'hello@prografter.co.uk',
  displayName: 'Job brief — admin notification',
  previewData: {
    reference: 'PG-VF6TRI',
    name: 'Sarah Thompson',
    email: 'sarah@example.com',
    phone: '07700 900123',
    address: '12 Oak Lane',
    postcode: 'SW1A 1AA',
    propertyType: 'Semi-detached house',
    jobTitle: 'Rewire kitchen and add sockets',
    trade: 'Electrician',
    description: 'Full kitchen rewire with 6 new double sockets.',
    budget: '£2,500–£5,000',
    timeline: 'Within a month',
    access: "Owner occupied — I'll be home",
    adminUrl: 'https://prografter.co.uk/admin/job-briefs',
  },
} satisfies TemplateEntry
