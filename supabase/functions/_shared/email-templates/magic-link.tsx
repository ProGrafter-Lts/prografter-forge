/// <reference types="npm:@types/react@18.3.1" />

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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>Pro<span style={{ color: '#0D9488' }}>Grafter</span></Text>
        </Section>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Click the button below to log in to {siteName}. This link will expire
          shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log In
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3A4B' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1B3A4B', margin: '0 0 20px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em' }
const text = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#0D9488', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#6B7280', margin: '30px 0 0', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }
