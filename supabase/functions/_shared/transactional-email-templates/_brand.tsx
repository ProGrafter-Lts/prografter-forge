/// <reference types="npm:@types/react@18.3.1" />
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
  Button,
} from 'npm:@react-email/components@0.0.22'

// =====================================================================
// ProGrafter shared brand chrome for transactional contract emails.
// Navy #1B3A5C + Teal #0D9488. White body. Footer locked per brand spec.
// =====================================================================

export const SITE_NAME = 'ProGrafter'
export const SITE_URL = 'https://prografter.co.uk'

interface ShellProps {
  preview: string
  heading: string
  children: React.ReactNode
}

export const ProGrafterShell = ({ preview, heading, children }: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>
            Pro<span style={{ color: '#0D9488' }}>Grafter</span>
          </Text>
        </Section>
        <Heading style={h1}>{heading}</Heading>
        {children}
        <Hr style={hr} />
        <Text style={footer}>
          ProGrafter Ltd · Company 17124130 · 66 Paul Street, London EC2A 4NA<br />
          ICO ZC114018 · hello@prografter.co.uk
        </Text>
      </Container>
    </Body>
  </Html>
)

export const Para = ({ children }: { children: React.ReactNode }) => (
  <Text style={text}>{children}</Text>
)

export const RefCard = ({
  reference,
  projectTitle,
  amount,
  startDate,
  otherParty,
}: {
  reference: string
  projectTitle: string
  amount?: string
  startDate?: string
  otherParty?: string
}) => (
  <Section style={card}>
    <Text style={cardHeading}>Project details</Text>
    <Text style={cardText}>
      <strong style={cardLabel}>Reference:</strong> {reference}<br />
      <strong style={cardLabel}>Project:</strong> {projectTitle}<br />
      {otherParty ? (
        <>
          <strong style={cardLabel}>Counterparty:</strong> {otherParty}<br />
        </>
      ) : null}
      {amount ? (
        <>
          <strong style={cardLabel}>Contract value:</strong> {amount}<br />
        </>
      ) : null}
      {startDate ? (
        <>
          <strong style={cardLabel}>Start date:</strong> {startDate}
        </>
      ) : null}
    </Text>
  </Section>
)

export const CTA = ({ href, label }: { href: string; label: string }) => (
  <Section style={ctaWrap}>
    <Button href={href} style={ctaBtn}>
      {label}
    </Button>
  </Section>
)

// =====================================================================
// Shared inline styles
// =====================================================================
const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = {
  fontSize: '28px',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.02em',
  margin: '0',
  color: '#1B3A5C',
}
const h1 = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1B3A5C',
  margin: '0 0 20px',
  lineHeight: '1.2',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
  letterSpacing: '0.02em',
}
const text = { fontSize: '15px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 18px' }
const card = {
  backgroundColor: '#F5F0E8',
  borderLeft: '3px solid #0D9488',
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '20px 0',
}
const cardHeading = {
  fontSize: '12px',
  fontWeight: 'bold' as const,
  color: '#1B3A5C',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  fontFamily: "'Bebas Neue', Arial, sans-serif",
}
const cardText = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.8', margin: '0' }
const cardLabel = { color: '#1B3A5C', fontWeight: 600 as const }
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
