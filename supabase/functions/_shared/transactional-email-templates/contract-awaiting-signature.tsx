/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, RefCard, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  reference?: string
  projectTitle?: string
  otherPartyName?: string
  otherPartyRole?: 'homeowner' | 'trade'
  amountFormatted?: string
  contractUrl?: string
}

const ContractAwaitingSignatureEmail = ({
  firstName,
  reference = 'PG-XXXX-XXXX',
  projectTitle = 'your project',
  otherPartyName,
  otherPartyRole,
  amountFormatted,
  contractUrl,
}: Props) => {
  const otherLabel = otherPartyRole === 'trade' ? 'trade' : 'homeowner'
  return (
    <ProGrafterShell
      preview={`Your ${otherLabel} has signed — ${projectTitle} is awaiting your signature`}
      heading="Your turn to sign."
    >
      <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
      <Para>
        {otherPartyName ? <strong>{otherPartyName}</strong> : `Your ${otherLabel}`} has signed
        the contract for <strong>{projectTitle}</strong>. The contract is now waiting for
        your signature — work cannot begin until both parties have signed.
      </Para>
      <RefCard
        reference={reference}
        projectTitle={projectTitle}
        otherParty={otherPartyName}
        amount={amountFormatted}
      />
      <CTA href={contractUrl || `${SITE_URL}/dashboard`} label="Review and sign" />
      <Para>
        If anything in the contract needs changing, raise it before you sign. Once
        both signatures are in, variations are the only way to amend scope.
      </Para>
    </ProGrafterShell>
  )
}

export const template = {
  component: ContractAwaitingSignatureEmail,
  subject: (data: Record<string, any>) => {
    const role = data?.otherPartyRole === 'trade' ? 'trade' : 'homeowner'
    return `Your ${role} has signed — ${data?.projectTitle ?? 'your project'} is awaiting your signature`
  },
  displayName: 'Contract awaiting signature',
  previewData: {
    firstName: 'Sam',
    reference: 'PG-2026-0042',
    projectTitle: 'Kitchen extension, Hackney',
    otherPartyName: 'Jane Mitchell',
    otherPartyRole: 'homeowner',
    amountFormatted: '£24,500',
  },
} satisfies TemplateEntry
