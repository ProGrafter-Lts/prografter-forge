/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as waitlistAdminNotification } from './waitlist-admin-notification.tsx'
import { template as waitlistWelcome } from './waitlist-welcome.tsx'
import { template as contactMessage } from './contact-message.tsx'
import { template as homeownerWelcome } from './homeowner-welcome.tsx'
import { template as tradeWelcome } from './trade-welcome.tsx'
import { template as tradeVerificationSubmitted } from './trade-verification-submitted.tsx'
import { template as tradeVerified } from './trade-verified.tsx'
import { template as tradeVerificationQuery } from './trade-verification-query.tsx'
import { template as finishTradeRegistration } from './finish-trade-registration.tsx'
import { template as contractGenerated } from './contract-generated.tsx'
import { template as contractAwaitingSignature } from './contract-awaiting-signature.tsx'
import { template as contractActivated } from './contract-activated.tsx'
import { template as variationProposed } from './variation-proposed.tsx'
import { template as variationApproved } from './variation-approved.tsx'
import { template as completionMarked } from './completion-marked.tsx'
import { template as completionAccepted } from './completion-accepted.tsx'
import { template as testimonialRequest } from './testimonial-request.tsx'
import { template as testimonialReceived } from './testimonial-received.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'waitlist-admin-notification': waitlistAdminNotification,
  'waitlist-welcome': waitlistWelcome,
  'contact-message': contactMessage,
  'homeowner-welcome': homeownerWelcome,
  'trade-welcome': tradeWelcome,
  'trade-verification-submitted': tradeVerificationSubmitted,
  'trade-verified': tradeVerified,
  'trade-verification-query': tradeVerificationQuery,
  'finish-trade-registration': finishTradeRegistration,
  // Contract lifecycle (7)
  'contract-generated': contractGenerated,
  'contract-awaiting-signature': contractAwaitingSignature,
  'contract-activated': contractActivated,
  'variation-proposed': variationProposed,
  'variation-approved': variationApproved,
  'completion-marked': completionMarked,
  'completion-accepted': completionAccepted,
  'testimonial-request': testimonialRequest,
  'testimonial-received': testimonialReceived,
}
