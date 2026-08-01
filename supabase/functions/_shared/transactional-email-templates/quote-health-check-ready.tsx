import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, SITE_NAME } from './_brand.tsx'

interface QuoteHealthCheckReadyProps {
  reportUrl?: string
  projectType?: string
}

const QuoteHealthCheckReadyEmail = ({ reportUrl, projectType }: QuoteHealthCheckReadyProps) => (
  <ProGrafterShell
    preview={`Your Quote Checker report${projectType ? ` for ${projectType}` : ''} is ready`}
    heading="Your Quote Checker report is ready"
  >
    <Para>Hi there,</Para>
    <Para>
      We've finished reviewing{projectType ? ` your ${projectType} quote` : ' your building quote'}.
      Your independent, plain-English Quote Checker report is now saved to your account.
    </Para>
    <CTA href={reportUrl || 'https://prografter.co.uk/dashboard/quote-checks'} label="View your report" />
    <Text style={note}>
      You can read and download a PDF of your report from your account.
    </Text>
  </ProGrafterShell>
)

const note = {
  fontSize: '13px',
  color: '#6B6B6B',
  lineHeight: '1.6',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

export const template = {
  component: QuoteHealthCheckReadyEmail,
  subject: (data: Record<string, any>) =>
    `Your Quote Checker report${data?.projectType ? ` for ${data.projectType}` : ''} is ready`,
  displayName: 'Quote Checker report ready',
  previewData: {
    reportUrl: 'https://prografter.co.uk/dashboard/quote-checks',
    projectType: 'single-storey rear extension',
  },
} satisfies TemplateEntry
