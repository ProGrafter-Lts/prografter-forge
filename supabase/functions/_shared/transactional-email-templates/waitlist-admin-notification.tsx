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

interface WaitlistAdminNotificationProps {
  name?: string
  email?: string
  postcode?: string
  userType?: string
}

const WaitlistAdminNotificationEmail = ({
  name,
  email,
  postcode,
  userType,
}: WaitlistAdminNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New ProGrafter waitlist signup{name ? ` — ${name}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>Pro<span style={{ color: '#0D9488' }}>Grafter</span></Text>
        </Section>
        <Heading style={h1}>New Waitlist Signup</Heading>
        <Text style={text}>
          Someone just joined the ProGrafter early access waitlist.
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
            <strong style={label}>Postcode:</strong> {postcode || '—'}
          </Text>
          <Text style={detailRow}>
            <strong style={label}>User type:</strong> {userType || '—'}
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Sent automatically by ProGrafter.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistAdminNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New waitlist signup${data?.name ? ` — ${data.name}` : ''} (${data?.userType || 'unknown'})`,
  to: 'hello@prografter.co.uk',
  displayName: 'Waitlist signup — admin notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    postcode: 'SW1A 1AA',
    userType: 'tradesperson',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3A4B' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1B3A4B',
  margin: '0 0 16px',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.02em',
}
const text = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 16px' }
const detailsSection = { padding: '8px 0' }
const detailRow = { fontSize: '14px', color: '#2E2E2E', margin: '8px 0' }
const label = { color: '#1B3A4B', minWidth: '90px', display: 'inline-block' }
const hr = { borderColor: '#E5E7EB', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#6B7280', margin: '24px 0 0' }
