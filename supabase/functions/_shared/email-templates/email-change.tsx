/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://prografter.co.uk/__l5e/assets-v1/fb47262a-98d3-4c68-ad52-a5ddf87fc48a/prografter-email-dark.png" alt="ProGrafter" width="170" style={logo} />
        </Section>
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email address for {siteName} from{' '}
          <Link href={`mailto:${email}`} style={linkStyle}>
            {email}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={linkStyle}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Click the button below to confirm this change:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account
          immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3A4B' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1B3A4B', margin: '0 0 20px', fontFamily: "'DM Sans', Arial, sans-serif", letterSpacing: '-0.01em', lineHeight: '1.3' }
const text = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 20px' }
const linkStyle = { color: '#0D9488', textDecoration: 'underline' }
const button = { backgroundColor: '#0D9488', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#6B7280', margin: '30px 0 0', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }
