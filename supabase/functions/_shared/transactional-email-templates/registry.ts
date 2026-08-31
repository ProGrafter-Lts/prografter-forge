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
import { template as waitlistOutOfArea } from './waitlist-out-of-area.tsx'
import { template as waitlistWelcome } from './waitlist-welcome.tsx'
import { template as contactMessage } from './contact-message.tsx'
import { template as homeownerWelcome } from './homeowner-welcome.tsx'
import { template as tradeWelcome } from './trade-welcome.tsx'
import { template as tradeVerificationSubmitted } from './trade-verification-submitted.tsx'
import { template as tradeSignupAdminNotification } from './trade-signup-admin-notification.tsx'
import { template as tradeVerified } from './trade-verified.tsx'
import { template as tradeRejected } from './trade-rejected.tsx'
import { template as tradeVerificationQuery } from './trade-verification-query.tsx'
import { template as tradeComingSoon } from './trade-coming-soon.tsx'
import { template as finishTradeRegistration } from './finish-trade-registration.tsx'
import { template as tradeFinishVerification } from './trade-finish-verification.tsx'
import { template as contractGenerated } from './contract-generated.tsx'
import { template as contractAwaitingSignature } from './contract-awaiting-signature.tsx'
import { template as contractActivated } from './contract-activated.tsx'
import { template as variationProposed } from './variation-proposed.tsx'
import { template as variationApproved } from './variation-approved.tsx'
import { template as completionMarked } from './completion-marked.tsx'
import { template as completionAccepted } from './completion-accepted.tsx'
import { template as testimonialRequest } from './testimonial-request.tsx'
import { template as testimonialReceived } from './testimonial-received.tsx'
import { template as paymentReleasedTrade } from './payment-released-trade.tsx'
import { template as paymentReleasedHomeowner } from './payment-released-homeowner.tsx'
import { template as drawdownApprovalNeeded } from './drawdown-approval-needed.tsx'
import { template as stageDepositRequested } from './stage-deposit-requested.tsx'
import { template as mobilizationAtRisk } from './mobilization-at-risk.tsx'
import { template as quoteReceived } from './quote-received.tsx'
import { template as projectOverdueTrade } from './project-overdue-trade.tsx'
import { template as projectOverdueHomeowner } from './project-overdue-homeowner.tsx'
import { template as jobBriefHomeowner } from './job-brief-homeowner.tsx'
import { template as jobBriefAdmin } from './job-brief-admin.tsx'
import { template as quoteAcceptedTrade } from './quote-accepted-trade.tsx'
import { template as quoteAcceptedHomeowner } from './quote-accepted-homeowner.tsx'
import { template as quoteAcceptedAdmin } from './quote-accepted-admin.tsx'
import { template as newJobInArea } from './new-job-in-area.tsx'
import { template as newQuoteAdmin } from './new-quote-admin.tsx'
import { template as disputeRaisedOtherParty } from './dispute-raised-other-party.tsx'
import { template as disputeRaisedClaimant } from './dispute-raised-claimant.tsx'
import { template as disputeRaisedAdmin } from './dispute-raised-admin.tsx'
import { template as quoteHealthCheckReady } from './quote-health-check-ready.tsx'
import { template as tradevaultDocExpiring } from './tradevault-doc-expiring.tsx'
import { template as agreedQuoteOnFile } from './agreed-quote-on-file.tsx'
import { template as deliveryConfirmation } from './delivery-confirmation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'waitlist-admin-notification': waitlistAdminNotification,
  'waitlist-welcome': waitlistWelcome,
  'waitlist-out-of-area': waitlistOutOfArea,
  'contact-message': contactMessage,
  'homeowner-welcome': homeownerWelcome,
  'trade-welcome': tradeWelcome,
  'trade-verification-submitted': tradeVerificationSubmitted,
  'trade-signup-admin-notification': tradeSignupAdminNotification,
  'trade-verified': tradeVerified,
  'trade-rejected': tradeRejected,
  'trade-verification-query': tradeVerificationQuery,
  'trade-coming-soon': tradeComingSoon,
  'finish-trade-registration': finishTradeRegistration,
  'trade-finish-verification': tradeFinishVerification,
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
  'payment-released-trade': paymentReleasedTrade,
  'payment-released-homeowner': paymentReleasedHomeowner,
  'quote-received': quoteReceived,
  'project-overdue-trade': projectOverdueTrade,
  'project-overdue-homeowner': projectOverdueHomeowner,
  'job-brief-homeowner': jobBriefHomeowner,
  'job-brief-admin': jobBriefAdmin,
  // Quote accepted (3)
  'quote-accepted-trade': quoteAcceptedTrade,
  'quote-accepted-homeowner': quoteAcceptedHomeowner,
  'quote-accepted-admin': quoteAcceptedAdmin,
  // New job in area + new quote admin
  'new-job-in-area': newJobInArea,
  'new-quote-admin': newQuoteAdmin,
  // Dispute raised (3)
  'dispute-raised-other-party': disputeRaisedOtherParty,
  'dispute-raised-claimant': disputeRaisedClaimant,
  'dispute-raised-admin': disputeRaisedAdmin,
  'quote-health-check-ready': quoteHealthCheckReady,
  'tradevault-doc-expiring': tradevaultDocExpiring,
  'agreed-quote-on-file': agreedQuoteOnFile,
  'delivery-confirmation': deliveryConfirmation,
}
