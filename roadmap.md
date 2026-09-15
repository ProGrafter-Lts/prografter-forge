# Roadmap

## Mobilization Drawdown (in progress)
- [x] Project wallet + per-stage expected/funded tracking
- [x] Mobilization timeline (target date T-14, hard deadline T-7, at-risk flag + trade notification)
- [x] Trade drawdown request (amount, description, private proforma upload, balance check)
- [x] Homeowner approve/decline (own authenticated action only)
- [x] Release via Stripe Transfer to trade Connect account on approval
- [x] Immutable audit trail visible to both parties
- [x] Sequential stage funding: on stage release, immediately request deposit for next stage
- [x] Single 48h follow-up reminder if next-stage deposit unfunded
- [x] "Inspection passed — awaiting funds" status (not a dispute state)

## Open decisions (blocked on Lee)
- Trade Stripe Connect onboarding flow (column added, no onboarding UI yet)
- Partial approvals / disputed amounts / refund-after-release: intentionally unbuilt

## Homeowner landing page rebuild
- [x] Rebuilt homepage to approved homeowner mock-up (hero, three ways, five checks, four steps, differentiation, final CTA)

## Platform subscription messaging
- [x] Clarify that joining, matching, quoting and getting paid never require a subscription
- [x] Distinguish optional paid tools such as Planning Hub as separate opt-in add-ons

## Planning Pipeline exact visual rebuild
- [x] Match the supplied Planning Pipeline mock-up exactly while preserving every existing workflow and data action

## How It Works approved visual rebuild
- [x] Rebuild `/how-it-works` with mirrored homeowner/trade journeys, approved visual language, accurate platform claims, responsive navigation, and existing routes

## Targeted public website clarity pass
- [x] Clarify first-screen homeowner and trade value propositions
- [x] Reduce repeated subscription, matching, verification, and “clearer way” claims
- [x] Add honest focused-launch and early-traction messaging
- [x] Add a public Platform Tour with live/development/planned labels
- [x] Streamline Pricing and About detail with expandable breakdowns

## Final public brand and navigation consolidation
- [x] Consolidate all public pages onto one canonical header and footer
- [x] Extend the homeowner homepage typography, CTA, card and blueprint language across core public pages
- [x] Preserve Platform Tour, verification, advice, founder story and pricing content while aligning presentation
- [x] Validate the complete public journey, menus, links, responsiveness and console health
- [ ] Corrective public visual pass: audit canonical Homeowner/Trades/How It Works compositions
- [ ] Establish shared composition primitives from existing implementation
- [ ] Rework Platform Tour, Our Checks, Advice, and About without changing functionality
- [ ] Keep public navigation on public routes and add signed-in dashboard return action
- [ ] Verify seven public pages across desktop and mobile
- [ ] Keep corrective pass styling-only: preserve existing page structures and content; apply uploaded mobile visual grammar without redesigning layouts
