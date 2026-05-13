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

interface TradeSignupAdminProps {
  name?: string
  email?: string
  phone?: string
  postcode?: string
  companyName?: string
  tradeType?: string
  stage?: string
}

const TradeSignupAdminEmail = ({
  name,
  email,
  phone,
  postcode,
  companyName,
  tradeType,
  stage,
}: TradeSignupAdminProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New ProGrafter trade signup{name ? ` — ${name}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>Pro<span style={{ color: '#0D9488' }}>Grafter</span></Text>
        </Section>
        <Heading style={h1}>New Trade Signup</Heading>
        <Text style={text}>
          A new tradesperson has started signing up on ProGrafter.
          {stage === 'submitted_for_review'
            ? ' They have completed all steps and submitted for verification review.'
            : ' They have created their account — verification documents may still be pending.'}
        </Text>
        <Hr style={hr} />
        <Section style={detailsSection}>
          <Text style={detailRow}><strong style={label}>Name:</strong> {name || '—'}</Text>
          <Text style={detailRow}><strong style={label}>Company:</strong> {companyName || '—'}</Text>
          <Text style={detailRow}><strong style={label}>Trade:</strong> {tradeType || '—'}</Text>
          <Text style={detailRow}><strong style={label}>Email:</strong> {email || '—'}</Text>
          <Text style={detailRow}><strong style={label}>Phone:</strong> {phone || '—'}</Text>
          <Text style={detailRow}><strong style={label}>Postcode:</strong> {postcode || '—'}</Text>
          <Text style={detailRow}><strong style={label}>Stage:</strong> {stage || 'account_created'}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Review in the admin dashboard at /admin/verifications.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TradeSignupAdminEmail,
  subject: (data: Record<string, any>) =>
    `New trade signup${data?.name ? ` — ${data.name}` : ''}${data?.stage === 'submitted_for_review' ? ' (submitted for review)' : ''}`,
  to: 'hello@prografter.co.uk',
  displayName: 'Trade signup — admin notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '07700 900000',
    postcode: 'SW1A 1AA',
    companyName: 'Doe Building Ltd',
    tradeType: 'Builder',
    stage: 'account_created',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const header = { borderBottom: '3px solid #0D9488', paddingBottom: '16px', marginBottom: '24px' }
const logo = { fontSize: '28px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em', margin: '0', color: '#1B3A4B' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1B3A4B', margin: '0 0 16px', fontFamily: "'Bebas Neue', Arial, sans-serif", letterSpacing: '0.02em' }
const text = { fontSize: '14px', color: '#2E2E2E', lineHeight: '1.6', margin: '0 0 16px' }
const detailsSection = { padding: '8px 0' }
const detailRow = { fontSize: '14px', color: '#2E2E2E', margin: '8px 0' }
const label = { color: '#1B3A4B', minWidth: '110px', display: 'inline-block' }
const hr = { borderColor: '#E5E7EB', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#6B7280', margin: '24px 0 0' }
