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

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#0a2540',
  margin: '0 0 20px',
  lineHeight: '1.2',
}
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 20px' }
const card = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
}
const cardHeading = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#0a2540',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const cardText = { fontSize: '14px', color: '#333', lineHeight: '1.8', margin: '0' }
const signoff = { fontSize: '15px', color: '#0a2540', margin: '32px 0 0', fontWeight: 600 }
