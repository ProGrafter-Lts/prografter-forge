import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ProGrafter'

interface WaitlistWelcomeProps {
  name?: string
}

const WaitlistWelcomeEmail = ({ name }: WaitlistWelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're on the {SITE_NAME} waitlist</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>Pro<span style={{ color: '#0D9488' }}>Grafter</span></Text>
        </Section>
        <Heading style={h1}>
          {name ? `Welcome, ${name}.` : `You're in.`}
        </Heading>
        <Text style={text}>
          Thanks for joining the {SITE_NAME} early access waitlist. You're now
          on the list — we'll be in touch as soon as we launch in your area.
        </Text>
        <Section style={card}>
          <Text style={cardHeading}>What happens next?</Text>
          <Text style={cardText}>
            • We'll email you the moment {SITE_NAME} goes live near you.<br />
            • You'll get first access to verified trades and homeowners.<br />
            • No spam. No noise. Just the updates that matter.
          </Text>
        </Section>
        <Text style={text}>
          If you have any questions in the meantime, just reply to this email —
          we read every message.
        </Text>
        <Text style={signoff}>
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistWelcomeEmail,
  subject: `You're on the ${SITE_NAME} waitlist`,
  displayName: 'Waitlist welcome',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3A4B' }
const h1 = {
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#1B3A4B',
  margin: '0 0 20px',
  lineHeight: '1.2',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.02em',
}
const text = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 20px' }
const card = {
  backgroundColor: '#F5F0E8',
  borderLeft: '3px solid #0D9488',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
}
const cardHeading = {
  fontSize: '13px',
  fontWeight: 'bold' as const,
  color: '#1B3A4B',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
}
const cardText = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.8', margin: '0' }
const signoff = { fontSize: '14px', color: '#1B3A4B', margin: '32px 0 0 0', fontWeight: 600, borderTop: '1px solid #E5E7EB', paddingTop: '16px' }
