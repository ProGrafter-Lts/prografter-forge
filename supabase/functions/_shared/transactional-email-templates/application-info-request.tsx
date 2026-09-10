import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, SITE_NAME } from './_brand.tsx'

interface ApplicationInfoRequestProps {
  firstName?: string
  /** Exact, named items still needed — never a generic "more info". */
  items?: string[]
  note?: string
}

const ApplicationInfoRequestEmail = ({ firstName, items = [], note }: ApplicationInfoRequestProps) => (
  <ProGrafterShell
    preview={`We need a few things to finish your ${SITE_NAME} application`}
    heading="We need a few things to finish your application."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Your {SITE_NAME} application is on hold until we receive the items below. Once they arrive
      we'll pick the review straight back up.
    </Para>
    <InfoCard title="What we still need">
      {items.length
        ? items.map((item, i) => (
            <Text key={i} style={itemStyle}>
              • {item}
            </Text>
          ))
        : <Text style={itemStyle}>• Outstanding verification documents</Text>}
    </InfoCard>
    {note ? <Para>{note}</Para> : null}
    <Para>
      Please reply to this email with the files attached. Photos taken on your phone are fine, as
      long as every detail is readable.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: ApplicationInfoRequestEmail,
  subject: `Action needed: information missing from your ${SITE_NAME} application`,
  displayName: 'Application — information requested',
  previewData: {
    firstName: 'Jordan',
    items: ['Photo ID (passport or driving licence)', 'Two trade references (name, role and phone number)'],
    note: 'Your insurance certificate is fine — we only need the two items above.',
  },
} satisfies TemplateEntry

const itemStyle = { margin: '0 0 6px', fontSize: '15px', lineHeight: '1.5', color: '#0F2238' }
