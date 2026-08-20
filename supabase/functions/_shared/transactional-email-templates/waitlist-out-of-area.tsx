import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, SITE_NAME } from './_brand.tsx'

interface WaitlistOutOfAreaProps {
  name?: string
}

const WaitlistOutOfAreaEmail = ({ name }: WaitlistOutOfAreaProps) => (
  <ProGrafterShell
    preview={`${SITE_NAME} is coming soon to your area`}
    heading={name ? `Hi ${name},` : `Great news`}
    signoff={`— The ${SITE_NAME} Team`}
  >
    <Para>
      Thanks so much for signing up to {SITE_NAME} — we'd genuinely love to have tradespeople
      like you on board.
    </Para>
    <Para>
      We're currently live across <strong>the East Midlands, Lincolnshire and South Yorkshire</strong> (NG, DE, LE, LN, S and DN postcodes), and your
      postcode is just outside that initial area. The good news: if things go well here (and we
      think they will), we'll be rolling out to more areas soon.
    </Para>
    <InfoCard title="May we keep your details?">
      • We'd like to hold your details on file so you're first in the queue.<br />
      • As soon as {SITE_NAME} goes live in your area, we'll get in touch.<br />
      • Happy with that? You don't need to do a thing — you're on the list.
    </InfoCard>
    <Para>
      If you'd rather we didn't keep your details, just reply to this email and we'll remove them.
      And if you believe you're already within an NG, DE, LE, LN, S or DN postcode, reply and
      we'll get you set up straight away.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: WaitlistOutOfAreaEmail,
  subject: `${SITE_NAME} is coming to your area soon`,
  displayName: 'Waitlist — coming soon (out of area)',
  previewData: { name: 'David' },
} satisfies TemplateEntry
