import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard } from './_brand.tsx'

interface ContactMessageProps {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const ContactMessageEmail = ({ name, email, subject, message }: ContactMessageProps) => (
  <ProGrafterShell
    preview={`New contact form message${name ? ` from ${name}` : ''}`}
    heading="New contact form message"
  >
    <Para>A new enquiry was submitted via the ProGrafter contact form.</Para>
    <InfoCard title="Sender details">
      <strong>Name:</strong> {name || '—'}<br />
      <strong>Email:</strong> {email || '—'}<br />
      <strong>Subject:</strong> {subject || '—'}
    </InfoCard>
    <InfoCard title="Message">{message || '—'}</InfoCard>
    <Para>Reply directly to {email || 'the sender'} to respond.</Para>
  </ProGrafterShell>
)

export const template = {
  component: ContactMessageEmail,
  subject: (data: Record<string, any>) =>
    `Contact form: ${data?.subject || 'New enquiry'}${data?.name ? ` — ${data.name}` : ''}`,
  to: 'hello@prografter.co.uk',
  displayName: 'Contact form message',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'General',
    message: 'Hello, I would like to know more about ProGrafter.',
  },
} satisfies TemplateEntry
