import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
const SITE_URL = 'https://prografter.co.uk'

interface TradeVerifiedProps {
  firstName?: string
}

const TradeVerifiedEmail = ({ firstName }: TradeVerifiedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're verified — start quoting on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>
            Pro<span style={{ color: '#0D9488' }}>Grafter</span>
          </Text>
        </Section>
        <Heading style={h1}>
          {firstName ? `You're in, ${firstName}.` : `You're in.`}
        </Heading>
        <Text style={text}>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Text>
        <Text style={text}>
          Good news. Your {SITE_NAME} account has been verified. You can now see and quote
          on homeowner jobs in your area.
        </Text>
        <Section style={card}>
          <Text style={cardHeading}>Your terms</Text>
          <Text style={cardText}>
            • No subscription<br />
            • No lead fees<br />
            • 7.5% commission (capped at £900) only when you complete a project
          </Text>
        </Section>
        <Section style={ctaWrap}>
          <Button href={`${SITE_URL}/dashboard/trade`} style={ctaBtn}>
            Browse available jobs
          </Button>
        </Section>
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
  component: TradeVerifiedEmail,
  subject: `You're verified — start quoting on ${SITE_NAME}`,
  displayName: 'Trade verified',
  previewData: { firstName: 'Sam' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3B5F' }
const h1 = { fontSize: '28px', fontWeight: 'bold' as const, color: '#1B3B5F', margin: '0 0 20px', lineHeight: '1.2', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em' }
const text = { fontSize: '15px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 18px' }
const card = { backgroundColor: '#F5F0E8', borderLeft: '3px solid #0D9488', borderRadius: '8px', padding: '18px 20px', margin: '20px 0' }
const cardHeading = { fontSize: '12px', fontWeight: 'bold' as const, color: '#1B3B5F', margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: "'Bebas Neue', Arial, sans-serif" }
const cardText = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.8', margin: '0' }
const ctaWrap = { textAlign: 'center' as const, margin: '28px 0' }
const ctaBtn = { backgroundColor: '#0D9488', color: '#ffffff', padding: '14px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' as const }
const hr = { borderColor: '#E5E7EB', margin: '32px 0 20px' }
const footer = { fontSize: '11px', color: '#6B7280', lineHeight: '1.6', margin: '0', textAlign: 'center' as const }
