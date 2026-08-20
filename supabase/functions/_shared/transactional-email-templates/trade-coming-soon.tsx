import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, InfoCard, CTA, Strong, SITE_NAME, SITE_URL } from './_brand.tsx'

interface TradeComingSoonProps {
  name?: string
}

const TradeComingSoonEmail = ({ name }: TradeComingSoonProps) => (
  <ProGrafterShell
    preview={`${SITE_NAME} is coming to your area — here's how to get verified-ready`}
    heading={name ? `Hi ${name},` : 'Thanks for applying'}
    signoff={`— The ${SITE_NAME} Team`}
  >
    <Para>
      Thank you for applying to join {SITE_NAME}. We'd genuinely love to have skilled
      tradespeople like you on board.
    </Para>
    <Para>
      We're currently live across <Strong>the East Midlands, Lincolnshire and South Yorkshire</Strong>{' '}
      (NG, DE, LE, LN, S and DN postcodes), and your area is just outside that initial launch. The
      good news: if things go well here — and we think they will — we'll be rolling out to more
      areas soon.
    </Para>


    <InfoCard title="May we keep your details?">
      • We'd like to hold your application on file so you're first in the queue.<br />
      • As soon as {SITE_NAME} goes live in your area, we'll contact you to finish verification.<br />
      • Happy with that? You don't need to do a thing — you're on the list.<br />
      • If you'd rather we didn't, just reply to this email and we'll remove your details.
    </InfoCard>

    <Para>
      So you know exactly what to expect when we reach you, here's <Strong>everything we verify</Strong>.
      Every trade passes the same five checks:
    </Para>
    <InfoCard title="The five checks — every trade">
      <strong>1. ID verified</strong> — passport or driving licence confirmed.<br />
      <strong>2. Companies House</strong> — registration & director confirmed (if registered).<br />
      <strong>3. Insurance</strong> — public liability certificate and cover level checked.<br />
      <strong>4. Proven competence</strong> — verified qualifications OR assessed time-served experience.<br />
      <strong>5. References</strong> — recent customers called personally.
    </InfoCard>

    <Para>
      For <Strong>proven competence</Strong>, there are two routes in — you only need one:
    </Para>
    <InfoCard title="Route A — Qualified / Registered">
      You hold a recognised qualification or registration (NVQ, City &amp; Guilds, Gas Safe,
      NICEIC / NAPIT / ELECSA, MCS, OFTEC, FENSA / CERTASS, OZEV, etc.). We check it directly
      with the issuing body or on the public register.<br /><br />
      <em>Note: legally-gated trades — gas, electrical self-certification, MCS-funded renewables,
      OZEV-funded EV charge points and OFTEC oil — must always use this route, as the law requires
      registration.</em>
    </InfoCard>
    <InfoCard title="Route B — Time-served, assessed">
      No formal paper, but the work speaks for itself? You can still get in. We review your
      evidence of years worked, a portfolio of recent jobs, customer references over the phone,
      and have a short conversation about your trade. Approved time-served trades start with a
      3-job probation so the first homeowners are extra-protected.
    </InfoCard>

    <Para>
      Getting these ready now (insurance certificate, qualification numbers or photos of recent
      work, and a couple of customer contacts) means you'll be able to go live the moment we
      reach your area.
    </Para>

    <CTA href={`${SITE_URL}/verification`} label="See how we verify" />
  </ProGrafterShell>
)

export const template = {
  component: TradeComingSoonEmail,
  subject: `${SITE_NAME} is coming to your area — your verification checklist`,
  displayName: 'Trade — coming soon (out of area, full verification)',
  previewData: { name: 'David' },
} satisfies TemplateEntry
