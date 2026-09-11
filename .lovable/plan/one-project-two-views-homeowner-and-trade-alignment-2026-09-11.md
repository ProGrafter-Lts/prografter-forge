# One project, two views — homeowner and trade alignment

Make the project the centre of both dashboards, using the records that already exist. Nothing working gets rebuilt: Post a Job, Quote Checker, Green Grants, contracts, variations, escrow, auth and routes stay exactly as they are.

## What the audit found

Everything needed already exists around one canonical project record (`jobs`), keyed by `job_id`:

- lifecycle: `job_briefs` → `jobs.status` / `jobs.stage` → `job_matches` → `quotes` → `contracts` → `project_stages` → completion. No new statuses needed.
- payment milestones: `project_stages` (with homeowner confirmation fields already present)
- variations: `contract_variations` (approved value flows through the existing commission logic)
- site record: `stage_updates` + `job_photos` + `job_photo_replies`
- conversation: `project_messages` (already has an optional stage link)
- documents: `project_certificates`, TradeVault, manual
- activity: existing event tables feeding `ProjectActivity`

Two real gaps:

1. A site diary entry is only free text plus photos — no structured "work completed / issue found / tomorrow's plan / delay" fields.
2. A message can be tied to a payment milestone but not to a variation or a day's site update, so decisions get buried in general chat.

## Phase 1 — Shared project spine (no visual change)

- Add one shared loader that returns, for a given project, everything both sides need: stage, programme position, latest site update, open variations, milestone sign-off state, contract value + approved variations, and payment position. Homeowner and trade views both read from it, so the two dashboards can never disagree.
- Add one shared "action required" builder producing typed items (approve variation, sign off milestone, review quote, reply to trade, upload document / homeowner side; homeowner replied, variation approved, milestone signed off, decision overdue / trade side). Each item carries the project and the object it links to, so every action deep-links to the right place.

## Phase 2 — Homeowner Overview becomes project-first

- No active project: keep today's onboarding dashboard exactly as-is.
- Active project: the project leads the page — title, address, current stage, on programme / attention required, today's update line, what's next, expected completion. Then Action Required (only when something is genuinely waiting), Latest Site Update, Upcoming, then the financial position (contract value, approved variations, paid to date, next milestone, remaining).
- Shrink "Welcome back" to a single line above the project; tone the light breadcrumb strip into the dark workspace. Hierarchy only, no restyle.
- Green Grants stays in the sidebar but drops below the project functions when a project is live.
- Every empty state states what happens next, and only shows a button where there's a real action.

## Phase 3 — Trade counterpart

The trade dashboard gains a project panel reading the same loader: today's work, programme position, customer actions waiting, financial position, and a one-tap site-update entry point. Existing trade dashboard cards, routes and calculations are untouched.

## Phase 4 — Site diary as a real project record

- Extend a site update with optional structured fields: work completed, issues found, delay reason, tomorrow's plan, programme impact in days. Existing entries keep working unchanged.
- Trade records the day from a phone in a few taps, with photos attached to the same entry.
- Homeowner sees the same day rendered plainly — photos, what was done, any issue, what happens next — and can reply against it.
- Entries stay historical: corrections are recorded as a follow-up, not a silent rewrite.

## Phase 5 — Context-aware messages

Allow a conversation to attach to a variation or a site update as well as a milestone, so "Variation #003 — additional drainage" reads as a decision thread rather than loose chat. Existing messages are unaffected.

## Phase 6 — Programme, documents, timeline

- Both sides read the same programme from the payment milestones plus a project-type-appropriate stage set; homeowner sees plain-language stages, trade sees operational detail. No extension-specific stages hard-coded globally.
- Homeowner Manual keeps everything it does today and gains the project documents view (accepted quote, contract, drawings, certificates, variations, warranties) once a project exists.
- Project timeline is generated from existing records — no rows created just to fill a feed.

## Phase 7 — Acceptance run

Walk the full loop on one test project (Sarah Thompson + a verified trade) through quote, acceptance, site update, reply, variation approval, milestone sign-off and completion, confirming both dashboards show the same project throughout and no duplicate project record is created.

## Technical notes

- Additive migrations only: nullable columns on `stage_updates` (structured diary fields) and `project_messages` (optional `variation_id`, `site_update_id`). Grants and RLS follow the existing patterns for those tables; no policy is loosened.
- No changes to auth, routes, schemas beyond the additive columns above, or to any existing calculation.
- Shared logic lives in one place per concern (project loader, action builder) so homeowner and trade can't drift.
- Mobile: homeowner leads with status → action → today's update; trade leads with today's work → post update → customer decisions.
