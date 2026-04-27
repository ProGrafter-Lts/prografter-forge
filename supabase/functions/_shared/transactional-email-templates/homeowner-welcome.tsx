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

interface HomeownerWelcomeProps {
  firstName?: string
}

const HomeownerWelcomeEmail = ({ firstName }: HomeownerWelcomeProps) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to {SITE_NAME} — post your first project today</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>
              Pro<span style={{ color: '#0D9488' }}>Grafter</span>
            </Text>
          </Section>
          <Heading style={h1}>
            {firstName ? `Welcome, ${firstName}.` : 'Welcome.'}
          </Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Welcome to {SITE_NAME}. You're set up and ready to post your first project.
            Verified trades will be able to quote within hours, not days.
          </Text>
          <Section style={ctaWrap}>
            <Button href={`${SITE_URL}/post-a-job`} style={ctaBtn}>
              Post your first project
            </Button>
          </Section>
          <Text style={text}>
            Every trade on {SITE_NAME} has been ID-checked, insurance-verified, and
            qualifications-checked before they can quote. No lead-fee chasers — just real
            tradespeople.
          </Text>
          <Hr style={hr} />
          <FooterBlock />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: HomeownerWelcomeEmail,
  subject: (data: Record<string, any>) =>
    data?.firstName
      ? `Welcome to ${SITE_NAME}, ${data.firstName}`
      : `Welcome to ${SITE_NAME}`,
  displayName: 'Homeowner welcome',
  previewData: { firstName: 'Jane' },
} satisfies TemplateEntry

// ---- shared brand styles + footer ----
const FooterBlock = () => (
  <Text style={footer}>
    ProGrafter Ltd · Company 17124130 · 66 Paul Street, London EC2A 4NA<br />
    ICO ZC114018 · hello@prografter.co.uk
  </Text>
)

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = {
  fontSize: '28px',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.02em',
  margin: '0',
  color: '#1B3B5F',
}
const h1 = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1B3B5F',
  margin: '0 0 20px',
  lineHeight: '1.2',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.02em',
}
const text = { fontSize: '15px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 18px' }
const ctaWrap = { textAlign: 'center' as const, margin: '28px 0' }
const ctaBtn = {
  backgroundColor: '#0D9488',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}
const hr = { borderColor: '#E5E7EB', margin: '32px 0 20px' }
const footer = {
  fontSize: '11px',
  color: '#6B7280',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
}
