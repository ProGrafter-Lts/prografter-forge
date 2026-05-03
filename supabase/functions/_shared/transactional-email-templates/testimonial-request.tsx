/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  projectTitle?: string
  submitUrl?: string
}

const TestimonialRequestEmail = ({ firstName, projectTitle, submitUrl }: Props) => (
  <ProGrafterShell
    preview="Quick favour — would you say a few words about your experience?"
    heading="Quick favour."
  >
    <Para>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Para>
    <Para>
      Now your{projectTitle ? ` ${projectTitle}` : ''} project is wrapped up — would you mind
      sharing a few words about your experience using ProGrafter? It really helps the next
      homeowner trust the platform.
    </Para>
    <Para>
      It takes under a minute. Just a star rating (1–5), a short quote (max 280 characters),
      your first name and town. Nothing is published until I’ve reviewed it.
    </Para>
    <CTA
      href={submitUrl || `${SITE_URL}/share-your-experience`}
      label="Share your experience"
    />
    <Para>Thank you — Lee</Para>
  </ProGrafterShell>
)

export const template = {
  component: TestimonialRequestEmail,
  subject: 'Quick favour — would you say a few words about your experience?',
  displayName: 'Testimonial request',
  previewData: {
    firstName: 'Sam',
    projectTitle: 'kitchen extension',
    submitUrl: 'https://prografter.co.uk/share-your-experience?first=Sam',
  },
} satisfies TemplateEntry
