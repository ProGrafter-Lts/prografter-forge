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
  Link,
} from 'npm:@react-email/components@0.0.22'

// =====================================================================
// ProGrafter shared brand chrome for ALL transactional emails.
// Web-safe styling — does NOT rely on custom Google fonts loading.
// Navy #1B3A5C header banner + teal #0D9488 accent. White body.
// =====================================================================

export const SITE_NAME = 'ProGrafter'
export const SITE_URL = 'https://prografter.co.uk'

interface ShellProps {
  preview: string
  heading: string
  children: React.ReactNode
  signoff?: string
}

export const ProGrafterShell = ({ preview, heading, children, signoff }: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        {/* Branded navy header banner */}
        <Section style={headerBanner}>
          <Text style={logoMark}>
            PRO<span style={{ color: '#5EE3D4' }}>GRAFTER</span>
          </Text>
          <Text style={tagline}>VERIFIED UK TRADES · FAIR CONTRACTS</Text>
        </Section>

        {/* Teal accent bar */}
        <div style={accentBar} />

        <Container style={inner}>
          <Heading style={h1}>{heading}</Heading>
          {children}
          {signoff ? <Text style={signoffText}>{signoff}</Text> : null}
        </Container>

        {/* Footer */}
        <Section style={footerWrap}>
          <Text style={footerLogo}>
            PRO<span style={{ color: '#0D9488' }}>GRAFTER</span>
          </Text>
          <Text style={footerLinks}>
            <Link href={`${SITE_URL}`} style={footerLink}>prografter.co.uk</Link>
            {' · '}
            <Link href={`${SITE_URL}/about`} style={footerLink}>About</Link>
            {' · '}
            <Link href={`mailto:hello@prografter.co.uk`} style={footerLink}>hello@prografter.co.uk</Link>
          </Text>
          <Text style={footerLegal}>
            ProGrafter Ltd · Company 17124130<br />
            66 Paul Street, London EC2A 4NA · ICO ZC114018
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const Para = ({ children }: { children: React.ReactNode }) => (
  <Text style={text}>{children}</Text>
)

export const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ color: '#1B3A5C', fontWeight: 700 }}>{children}</strong>
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
    <Text style={cardHeading}>PROJECT DETAILS</Text>
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

export const InfoCard = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Section style={card}>
    <Text style={cardHeading}>{title.toUpperCase()}</Text>
    <Text style={cardText}>{children}</Text>
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
// Shared inline styles — web-safe fonts only
// =====================================================================
const SAFE_SANS = "Helvetica, Arial, sans-serif"
const SAFE_DISPLAY = "'Helvetica Neue', Helvetica, Arial, sans-serif"

const main = {
  backgroundColor: '#F5F0E8',
  fontFamily: SAFE_SANS,
  margin: '0',
  padding: '24px 0',
}
const outer = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 16px rgba(27,58,92,0.08)',
}
const headerBanner = {
  backgroundColor: '#1B3A5C',
  padding: '28px 32px 24px',
  textAlign: 'center' as const,
}
const logoMark = {
  fontSize: '32px',
  fontWeight: 900 as const,
  color: '#ffffff',
  letterSpacing: '0.12em',
  margin: '0',
  fontFamily: SAFE_DISPLAY,
  lineHeight: '1',
}
const tagline = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.7)',
  letterSpacing: '0.18em',
  margin: '8px 0 0',
  fontFamily: SAFE_SANS,
  fontWeight: 600 as const,
}
const accentBar = {
  height: '4px',
  backgroundColor: '#0D9488',
  width: '100%',
}
const inner = { padding: '32px 32px 8px', maxWidth: '100%' }
const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: '#1B3A5C',
  margin: '0 0 20px',
  lineHeight: '1.25',
  fontFamily: SAFE_DISPLAY,
  letterSpacing: '-0.01em',
}
const text = { fontSize: '15px', color: '#2E2E2E', lineHeight: '1.65', margin: '0 0 16px' }
const signoffText = {
  fontSize: '14px',
  color: '#1B3A5C',
  margin: '28px 0 8px',
  fontWeight: 600 as const,
}
const card = {
  backgroundColor: '#F5F0E8',
  borderLeft: '4px solid #0D9488',
  borderRadius: '6px',
  padding: '18px 22px',
  margin: '20px 0',
}
const cardHeading = {
  fontSize: '11px',
  fontWeight: 700 as const,
  color: '#1B3A5C',
  margin: '0 0 10px',
  letterSpacing: '0.12em',
  fontFamily: SAFE_DISPLAY,
}
const cardText = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.7', margin: '0' }
const cardLabel = { color: '#1B3A5C', fontWeight: 700 as const }
const ctaWrap = { textAlign: 'center' as const, margin: '28px 0 24px' }
const ctaBtn = {
  backgroundColor: '#0D9488',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 700 as const,
  textDecoration: 'none',
  fontFamily: SAFE_DISPLAY,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  display: 'inline-block',
}
const footerWrap = {
  backgroundColor: '#1B3A5C',
  padding: '24px 32px',
  textAlign: 'center' as const,
  marginTop: '24px',
}
const footerLogo = {
  fontSize: '16px',
  fontWeight: 900 as const,
  color: '#ffffff',
  letterSpacing: '0.1em',
  margin: '0 0 12px',
  fontFamily: SAFE_DISPLAY,
}
const footerLinks = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.85)',
  margin: '0 0 12px',
  fontFamily: SAFE_SANS,
}
const footerLink = {
  color: '#5EE3D4',
  textDecoration: 'none',
}
const footerLegal = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.6)',
  lineHeight: '1.6',
  margin: '0',
  fontFamily: SAFE_SANS,
}
