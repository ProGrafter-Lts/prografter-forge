import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, SITE_NAME } from './_brand.tsx'

interface QuoteHealthCheckReadyProps {
  reportUrl?: string
  projectType?: string
}

const QuoteHealthCheckReadyEmail = ({ reportUrl, projectType }: QuoteHealthCheckReadyProps) => (
  <ProGrafterShell
    preview={`Your Quote Health Check is ready`}
    heading="Your Quote Health Check is ready"
  >
    <Para>Hi there,</Para>
    <Para>
      We've finished reviewing{projectType ? ` your ${projectType} quote` : ' your building quote'}.
      Your independent, plain-English Quote Health Check is ready to view — including what the
      quote does well, the questions worth asking your builder, and an indicative cost picture.
    </Para>
    <CTA href={reportUrl || '#'} label="View your Quote Health Check" />
    <Para>
      This is budgeting guidance to help you ask the right questions — not a survey, valuation,
      or quotation. Always confirm details directly with your builder before committing to any work.
    </Para>
    <Para>
      Keep this email — the link above is your secure, private access to the report.
    </Para>
  </ProGrafterShell>
)

export const template = {
  component: QuoteHealthCheckReadyEmail,
  subject: () => `Your ${SITE_NAME} Quote Health Check is ready`,
  displayName: 'Quote Health Check ready',
  previewData: {
    reportUrl: 'https://prografter.co.uk/report/00000000-0000-0000-0000-000000000000?t=token',
    projectType: 'single-storey rear extension',
  },
} satisfies TemplateEntry
