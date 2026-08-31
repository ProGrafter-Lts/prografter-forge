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
