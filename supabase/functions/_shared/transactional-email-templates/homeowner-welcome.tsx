import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, SITE_NAME, SITE_URL } from './_brand.tsx'

interface HomeownerWelcomeProps {
  firstName?: string
}

const HomeownerWelcomeEmail = ({ firstName }: HomeownerWelcomeProps) => (
  <ProGrafterShell
    preview={`Welcome to ${SITE_NAME} — post your first project today`}
    heading={firstName ? `Welcome, ${firstName}.` : 'Welcome.'}
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Welcome to {SITE_NAME}. You're set up and ready to post your first project.
      Verified trades will be able to quote within hours, not days.
    </Para>
    <CTA href={`${SITE_URL}/post-a-job`} label="Post your first project" />
    <Para>
      Every trade on {SITE_NAME} has been ID-checked, insurance-verified, and
      qualifications-checked before they can quote. No lead-fee chasers — just real
      tradespeople.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: HomeownerWelcomeEmail,
  subject: (data: Record<string, any>) =>
    data?.firstName
      ? `Welcome to ${SITE_NAME}, ${data.firstName}`
      : `Welcome to ${SITE_NAME}`,
  displayName: 'Homeowner welcome',
  previewData: { firstName: 'Jane' },
} satisfies TemplateEntry
