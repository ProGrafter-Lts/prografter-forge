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
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 16px' }
const detailsSection = { padding: '8px 0' }
const detailRow = { fontSize: '14px', color: '#333', margin: '8px 0' }
const label = { color: '#0a2540', minWidth: '90px', display: 'inline-block' }
const hr = { borderColor: '#e6e6e6', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
