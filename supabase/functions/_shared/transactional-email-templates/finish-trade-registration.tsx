import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
const REGISTER_URL = 'https://www.prografter.co.uk/register/trade'

interface FinishTradeRegistrationProps {
  name?: string
}

const FinishTradeRegistrationEmail = ({ name }: FinishTradeRegistrationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Finish setting up your {SITE_NAME} trade account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>Pro<span style={{ color: '#0D9488' }}>Grafter</span></Text>
        </Section>
        <Heading style={h1}>
          {name ? `${name}, ready to finish up?` : `Ready to finish up?`}
        </Heading>
        <Text style={text}>
          You joined the {SITE_NAME} waitlist — thanks for that. To start
          receiving leads and getting verified, you'll need to complete the
          full trade registration. It only takes a couple of minutes.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
          <Button href={REGISTER_URL} style={button}>
            Finish my registration
          </Button>
        </Section>
        <Section style={card}>
          <Text style={cardHeading}>What you'll need</Text>
          <Text style={cardText}>
            • Your trade and service area<br />
            • Insurance details (if you have them to hand)<br />
            • A password for your account
          </Text>
        </Section>
        <Text style={text}>
          Any issues, just reply to this email and we'll sort it.
        </Text>
        <Text style={signoff}>
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FinishTradeRegistrationEmail,
  subject: `Finish your ${SITE_NAME} trade registration`,
  displayName: 'Finish trade registration',
  previewData: { name: 'David' },
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
const button = {
  backgroundColor: '#0D9488',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.04em',
}
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
