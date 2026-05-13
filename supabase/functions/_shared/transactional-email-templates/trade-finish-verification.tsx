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
const RESUME_URL = 'https://www.prografter.co.uk/register/trade'

interface TradeFinishVerificationProps {
  name?: string
  reminderNumber?: number
}

const subjectLines: Record<number, string> = {
  1: `Finish your ${SITE_NAME} verification — it only takes a few minutes`,
  2: `Reminder: your ${SITE_NAME} trade profile is still pending`,
  3: `Last reminder — complete your ${SITE_NAME} verification`,
}

const TradeFinishVerificationEmail = ({ name, reminderNumber = 1 }: TradeFinishVerificationProps) => {
  const isLast = reminderNumber >= 3
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Finish verifying your {SITE_NAME} trade account to start receiving leads</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Pro<span style={{ color: '#0D9488' }}>Grafter</span></Text>
          </Section>
          <Heading style={h1}>
            {name ? `${name}, you're nearly there` : `You're nearly there`}
          </Heading>
          <Text style={text}>
            Thanks for starting your {SITE_NAME} trade signup. We noticed you
            haven't yet uploaded your insurance and ID documents — without
            those we can't verify your account or send you leads.
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
            <Button href={RESUME_URL} style={button}>
              Finish verification
            </Button>
          </Section>
          <Section style={card}>
            <Text style={cardHeading}>What you still need to do</Text>
            <Text style={cardText}>
              • Upload public liability insurance certificate<br />
              • Add a photo of your ID<br />
              • Submit your profile for review
            </Text>
          </Section>
          <Text style={text}>
            Reviews are usually completed within one working day once your
            documents are in.
          </Text>
          {isLast && (
            <Text style={text}>
              This is the last reminder we'll send. If you've changed your
              mind, no worries — just ignore this email and we won't chase
              you again.
            </Text>
          )}
          <Text style={text}>
            Stuck or need a hand? Just reply to this email.
          </Text>
          <Text style={signoff}>— The {SITE_NAME} Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TradeFinishVerificationEmail,
  subject: (data: Record<string, any>) =>
    subjectLines[data?.reminderNumber as number] ?? subjectLines[1],
  displayName: 'Trade — finish verification reminder',
  previewData: { name: 'David', reminderNumber: 1 },
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
