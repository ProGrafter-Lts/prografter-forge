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

const SITE_NAME = 'ProGrafter'

interface TradeVerificationSubmittedProps {
  firstName?: string
}

const TradeVerificationSubmittedEmail = ({ firstName }: TradeVerificationSubmittedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Documents received — verification in progress</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>
            Pro<span style={{ color: '#0D9488' }}>Grafter</span>
          </Text>
        </Section>
        <Heading style={h1}>Documents received.</Heading>
        <Text style={text}>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Text>
        <Text style={text}>
          Thanks — we've received the documents for your {SITE_NAME} verification. Our team
          will review them in 1–2 working days. We'll email you as soon as a decision has
          been made.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          ProGrafter Ltd · Company 17124130 · 66 Paul Street, London EC2A 4NA<br />
          ICO ZC114018 · hello@prografter.co.uk
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TradeVerificationSubmittedEmail,
  subject: `${SITE_NAME} — verification documents received`,
  displayName: 'Trade verification submitted',
  previewData: { firstName: 'Sam' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3B5F' }
const h1 = { fontSize: '28px', fontWeight: 'bold' as const, color: '#1B3B5F', margin: '0 0 20px', lineHeight: '1.2', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em' }
const text = { fontSize: '15px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 18px' }
const hr = { borderColor: '#E5E7EB', margin: '32px 0 20px' }
const footer = { fontSize: '11px', color: '#6B7280', lineHeight: '1.6', margin: '0', textAlign: 'center' as const }
