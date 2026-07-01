
# Homeowner Dashboard — Functionality Upgrade

Goal: improve information architecture and homeowner confidence **without** touching the visual design, colour palette, typography, branding, or the homepage. All new UI reuses existing tokens (`bg-card`, `text-primary`, `text-secondary`, `border-border`, `font-heading`, `font-mono`, rounded-2xl) so it feels like a native extension.

## 1. "Your Next Steps" priority centre
- New component `src/components/homeowner/NextSteps.tsx`, rendered on the Overview tab directly beneath the welcome section.
- A pure helper `src/lib/homeownerNextSteps.ts` derives an ordered task list from existing data already loaded in `HomeownerDashboard` (jobs, quotes, variations, briefs, freeChecks, siteUpdates, password status).
- Each task = `{ priority, title, description, estTime, ctaLabel, action }`. Priority drives colour (amber = action required, teal = recommended, blue = informational) and sort order; highest priority first.
- Task rules generated from real state, e.g.: new unaccepted quote → "Review Quote"; quote present + free check available → "Run Quote Health Check"; pending variation → "Review payment/variation request"; new site update → "View latest progress photos"; `has_password !== true` → "Set account password"; incomplete profile → "Complete profile". Empty state: a calm "You're all caught up" card.
- CTAs route via existing patterns (`setActiveNav`, `useDrawerNavigate`, `/quote-checker`).

## 2. Richer active project cards
- Upgrade `ActiveProjectsSection.tsx` cards to show: name, current status badge, trades matched, quotes received, accepted quote value (if any), latest update, next action, budget/value, posted date, location.
- Add `matched_trade_count`, accepted-quote amount, and latest-update text into the data passed from `HomeownerDashboard` (values already available from `briefs`, `quoteCounts`, `quotes`, `siteUpdates`; wire them through props).
- Buttons: View Project, View/Compare Quote, Run Quote Check (shown when quotes exist), and a disabled "Post Update" placeholder.

## 3 & 4. Project Control Centre tab framework
- `ProjectDetail.tsx` already renders panels (timeline, messaging, payments, variations, contract). Add a consistent tab bar: **Overview · Quotes · Timeline · Payments · Documents · Photos · Messages**.
- Reuse existing panels where they exist; add informative empty-state placeholder cards for the modules that have no data yet (Documents, Photos, and any empty Payments/Timeline/Messages), each with the explanatory copy from the brief. New small component `src/components/project/ControlCentreTabs.tsx` + `EmptyModule.tsx`. No backend/business-logic changes — placeholders only.

## 5. Safer quote acceptance flow
- In `QuotesReceived.tsx`, replace the direct Accept action with a confirmation checklist dialog (reusing the existing `AlertDialog`): the 6 confirmation checkboxes from the brief. "Accept Quote" stays disabled until all are ticked.
- Add secondary actions "Ask Builder a Question" (opens project messages) and "Request Revised Quote" (opens messages prefilled / marks intent). These route through existing project navigation; no new tables.

## 6. Quote Health Check wording
- Update copy in the Overview prompt and the Quotes tab card in `HomeownerDashboard.tsx` (and matching hero on `QuoteChecker.tsx`): remove "check it's fair"; use the clarity-focused wording (missing items, unclear wording, exclusions, risk areas, questions worth asking). Primary button "Run Quote Health Check", support line "We help you understand your quote before you commit."

## 7. Green Grants entry
- Add a hero to the top of `GreenGrants.tsx` (and the embedded grants tab): headline "Check Which Funding Routes May Apply", supporting text, primary CTA "Start Funding Check" (scrolls to / starts existing checker), secondary "Browse Funding Routes" (scrolls to existing cards). No grant content removed. Ensure every "View Official Scheme Details" link uses high-contrast tokens.

## 8. Contrast & accessibility pass
- Standardise status badges across dashboard components to one shared map (`src/lib/statusBadge.ts`): Awaiting Quotes = blue, Quote Received = teal, Action Required = amber, Completed = green, Closed = grey — using existing palette tokens with AA-contrast foreground.
- Replace low-contrast links/secondary buttons on the dark dashboard with token-based styles; add `aria-label`s to icon-only buttons.

## Technical notes
- Data already fetched in `HomeownerDashboard.loadData` is sufficient; I'll thread it into the new components rather than adding queries where possible (one small addition: accepted-quote amount + latest update text per job, both derivable from existing `quotes`/`siteUpdates`).
- No schema/RLS/edge-function changes. No new routes/pages. Purely presentation + client-side derivation.
- Files touched: `HomeownerDashboard.tsx`, `ActiveProjectsSection.tsx`, `QuotesReceived.tsx`, `GreenGrants.tsx`, `QuoteChecker.tsx`, plus new `NextSteps.tsx`, `homeownerNextSteps.ts`, `statusBadge.ts`, `ControlCentreTabs.tsx`, `EmptyModule.tsx`.
