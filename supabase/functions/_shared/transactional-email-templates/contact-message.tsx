import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ContactMessageProps {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const ContactMessageEmail = ({
  name,
  email,
  subject,
  message,
}: ContactMessageProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form message{name ? ` from ${name}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Contact Form Message</Heading>
        <Text style={text}>
          A new enquiry was submitted via the ProGrafter contact form.
        </Text>
        <Hr style={hr} />
        <Section style={detailsSection}>
          <Text style={detailRow}>
            <strong style={label}>Name:</strong> {name || '—'}
          </Text>
          <Text style={detailRow}>
            <strong style={label}>Email:</strong> {email || '—'}
          </Text>
          <Text style={detailRow}>
            <strong style={label}>Subject:</strong> {subject || '—'}
          </Text>
        </Section>
        <Hr style={hr} />
        <Heading as="h2" style={h2}>Message</Heading>
        <Text style={messageStyle}>{message || '—'}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Reply directly to {email || 'the sender'} to respond.
        </Text>
      </Container>
    </Body>
  </Html>
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

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0a2540',
  margin: '0 0 16px',
}
const h2 = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0a2540',
  margin: '0 0 8px',
}
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 16px' }
const messageStyle = {
  fontSize: '14px',
  color: '#333',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
  margin: '0 0 16px',
}
const detailsSection = { padding: '8px 0' }
const detailRow = { fontSize: '14px', color: '#333', margin: '8px 0' }
const label = { color: '#0a2540', minWidth: '90px', display: 'inline-block' }
const hr = { borderColor: '#e6e6e6', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
