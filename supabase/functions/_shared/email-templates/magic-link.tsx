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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
  token,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://prografter.co.uk/__l5e/assets-v1/fb47262a-98d3-4c68-ad52-a5ddf87fc48a/prografter-email-dark.png" alt="ProGrafter" width="170" style={logo} />
        </Section>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Click the button below to log in to {siteName}. This link will expire
          shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log In
        </Button>
        {token ? (
          <>
            <Text style={text}>
              Or, if the button doesn't sign you in, enter this 6-digit code on the
              sign-in screen:
            </Text>
            <Text style={code}>{token}</Text>
          </>
        ) : null}
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
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1B3A4B', margin: '0 0 20px', fontFamily: "'DM Sans', Arial, sans-serif", letterSpacing: '-0.01em', lineHeight: '1.3' }
const text = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#0D9488', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const code = { fontSize: '30px', fontWeight: '700' as const, letterSpacing: '0.3em', color: '#1B3A4B', margin: '0 0 20px', fontFamily: "'DM Sans', Arial, sans-serif" }
const footer = { fontSize: '12px', color: '#6B7280', margin: '30px 0 0', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }

