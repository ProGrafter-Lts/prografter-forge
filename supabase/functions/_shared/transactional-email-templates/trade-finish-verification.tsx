import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, InfoCard, SITE_NAME, SITE_URL } from './_brand.tsx'

const RESUME_URL = `${SITE_URL}/register/trade`

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
    <ProGrafterShell
      preview={`Finish verifying your ${SITE_NAME} trade account to start receiving leads`}
      heading={name ? `${name}, you're nearly there` : `You're nearly there`}
      signoff={`— The ${SITE_NAME} Team`}
    >
      <Para>
        Thanks for starting your {SITE_NAME} trade signup. We noticed you haven't yet
        uploaded your insurance and ID documents — without those we can't verify your
        account or send you leads.
      </Para>
      <CTA href={RESUME_URL} label="Finish verification" />
      <InfoCard title="What you still need to do">
        • Upload public liability insurance certificate<br />
        • Add a photo of your ID<br />
        • Submit your profile for review
      </InfoCard>
      <Para>
        Reviews are usually completed within one working day once your documents are in.
      </Para>
      {isLast && (
        <Para>
          This is the last reminder we'll send. If you've changed your mind, no worries —
          just ignore this email and we won't chase you again.
        </Para>
      )}
      <Para>Stuck or need a hand? Just reply to this email.</Para>
    </ProGrafterShell>
  )
}

export const template = {
  component: TradeFinishVerificationEmail,
  subject: (data: Record<string, any>) =>
    subjectLines[data?.reminderNumber as number] ?? subjectLines[1],
  displayName: 'Trade — finish verification reminder',
  previewData: { name: 'David', reminderNumber: 1 },
} satisfies TemplateEntry
