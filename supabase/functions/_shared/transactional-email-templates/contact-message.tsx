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
        <Section style={brandHeader}>
          <Text style={logo}>Pro<span style={{ color: '#0D9488' }}>Grafter</span></Text>
        </Section>
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

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const brandHeader = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3A4B' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1B3A4B',
  margin: '0 0 16px',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.02em',
}
const h2 = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#1B3A4B',
  margin: '0 0 8px',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.02em',
}
const text = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 16px' }
const messageStyle = {
  fontSize: '14px',
  color: '#2E2E2E',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
  margin: '0 0 16px',
  backgroundColor: '#F5F0E8',
  padding: '16px',
  borderRadius: '8px',
  borderLeft: '3px solid #0D9488',
}
const detailsSection = { padding: '8px 0' }
const detailRow = { fontSize: '14px', color: '#2E2E2E', margin: '8px 0' }
const label = { color: '#1B3A4B', minWidth: '90px', display: 'inline-block' }
const hr = { borderColor: '#E5E7EB', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#6B7280', margin: '24px 0 0' }
