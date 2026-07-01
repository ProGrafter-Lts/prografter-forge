import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, InfoCard, SITE_NAME, SITE_URL } from './_brand.tsx'

const VAULT_URL = `${SITE_URL}/trade/dashboard`

interface TradeVaultDocExpiringProps {
  name?: string
  documentLabel?: string
  expiryDate?: string
  daysUntil?: number
  expired?: boolean
  required?: boolean
}

const TradeVaultDocExpiringEmail = ({
  name,
  documentLabel = 'A verification document',
  expiryDate,
  daysUntil = 0,
  expired = false,
  required = false,
}: TradeVaultDocExpiringProps) => {
  const heading = expired
    ? `${documentLabel} has expired`
    : `${documentLabel} expires soon`

  return (
    <ProGrafterShell
      preview={
        expired
          ? `${documentLabel} on your ${SITE_NAME} profile has expired`
          : `${documentLabel} on your ${SITE_NAME} profile expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
      }
      heading={name ? `${name}, ${heading.toLowerCase()}` : heading}
      signoff={`— The ${SITE_NAME} Team`}
    >
      <Para>
        {expired
          ? `Your ${documentLabel.toLowerCase()} in your ${SITE_NAME} TradeVault has now expired.`
          : `Your ${documentLabel.toLowerCase()} in your ${SITE_NAME} TradeVault is due to expire${
              expiryDate ? ` on ${expiryDate}` : ''
            }${daysUntil > 0 ? ` — that's ${daysUntil} day${daysUntil === 1 ? '' : 's'} away` : ''}.`}
      </Para>
      {required && (
        <Para>
          This is one of the documents required to keep your profile verified.
          {expired
            ? ' Your verification is now paused until you upload a current version.'
            : ' Please upload a renewed version before it expires to avoid any pause to your verification.'}
        </Para>
      )}
      <CTA href={VAULT_URL} label="Update your documents" />
      <InfoCard title="What to do next">
        • Open TradeVault from your trade dashboard<br />
        • Upload the renewed document<br />
        • We'll re-check it and keep your profile verified
      </InfoCard>
      <Para>Need a hand? Just reply to this email.</Para>
    </ProGrafterShell>
  )
}

export const template = {
  component: TradeVaultDocExpiringEmail,
  subject: (data: Record<string, any>) => {
    const label = data?.documentLabel ?? 'A document'
    if (data?.expired) return `${SITE_NAME} — ${label} has expired`
    const days = data?.daysUntil as number
    return `${SITE_NAME} — ${label} expires in ${days} day${days === 1 ? '' : 's'}`
  },
  displayName: 'TradeVault — document expiring',
  previewData: {
    name: 'David',
    documentLabel: 'Public liability insurance',
    expiryDate: '15 August 2026',
    daysUntil: 30,
    expired: false,
    required: true,
  },
} satisfies TemplateEntry
