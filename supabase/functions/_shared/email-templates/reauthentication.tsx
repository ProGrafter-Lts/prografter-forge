/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://prografter.co.uk/__l5e/assets-v1/fb47262a-98d3-4c68-ad52-a5ddf87fc48a/prografter-email-dark.png" alt="ProGrafter" width="170" style={logo} />
        </Section>
        <Heading style={h1}>Confirm reauthentication</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3A4B' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1B3A4B', margin: '0 0 20px', fontFamily: "'DM Sans', Arial, sans-serif", letterSpacing: '-0.01em', lineHeight: '1.3' }
const text = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: "'DM Mono', Courier, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: '#1B3A4B', backgroundColor: '#F5F0E8', padding: '12px 20px', borderRadius: '8px', letterSpacing: '0.15em', margin: '0 0 30px', display: 'inline-block' as const }
const footer = { fontSize: '12px', color: '#6B7280', margin: '30px 0 0', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }
