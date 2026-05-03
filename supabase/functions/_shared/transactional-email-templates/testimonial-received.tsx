/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { ProGrafterShell, Para, CTA, SITE_URL } from './_brand.tsx'

interface Props {
  firstName?: string
  town?: string
  rating?: number | null
  quote?: string
  contractId?: string | null
}

const TestimonialReceivedEmail = ({ firstName, town, rating, quote, contractId }: Props) => (
  <ProGrafterShell
    preview="A new testimonial is awaiting review."
    heading="New testimonial."
  >
    <Para>A new testimonial has been submitted and is awaiting review.</Para>
    <Para>
      <strong>From:</strong> {firstName || '—'}{town ? `, ${town}` : ''}
      <br />
      <strong>Rating:</strong> {rating ? `${rating} / 5` : '—'}
      {contractId ? <><br /><strong>Contract:</strong> {contractId}</> : null}
    </Para>
    <Para>“{quote || ''}”</Para>
    <CTA href={`${SITE_URL}/admin/testimonials`} label="Review in admin" />
  </ProGrafterShell>
)

export const template = {
  component: TestimonialReceivedEmail,
  subject: (data: Record<string, any>) =>
    `New testimonial — ${data?.firstName ?? 'unknown'}${data?.town ? `, ${data.town}` : ''}`,
  to: 'hello@prografter.co.uk',
  displayName: 'Testimonial received — admin notification',
  previewData: {
    firstName: 'Sam',
    town: 'Nottingham',
    rating: 5,
    quote: 'Lee was great — kept us informed throughout the kitchen extension.',
    contractId: 'abc-123',
  },
} satisfies TemplateEntry
