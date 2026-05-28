# Trade Verification Rebuild — Banding + Dual Routes

Big scope. Splitting into 4 phases so you can review/approve as we go. Phase 1 (DB + classification) lands first because everything else depends on it.

## Phase 1 — Data model & trade classification

**Migration** (`supabase/migrations/<ts>_trade_banding.sql`):

- Enums:
  - `trade_band`: `legally_gated | scheme_preferred | competence_assessed`
  - `verification_route`: `registered | qualified | time_served`
  - Extend `verification_status` to include `pending_docs | pending_verification | pending_assessment | verified | rejected` (migrate existing `pending`/`approved` → `pending_verification`/`verified`).
- New columns on `trades`: `band`, `verification_route`, `assessment_evidence_complete bool`, `references_called bool`, `site_assessment_done bool`, `competence_interview_done bool`, `on_probation bool`, `probation_jobs_remaining int default 0`, `assessor_name text`, `assessment_notes text`, `years_in_trade int`.
- Trigger `enforce_trade_admin_only_columns`: blocks non-admin / non-service updates to the 4 checklist booleans, `on_probation`, `probation_jobs_remaining`, `assessor_name`, `assessment_notes`, `verification_status`, `verification_route`, `band`. Trade can only set these via signup INSERT or admin RPC.
- Storage bucket `trade_verification_documents` (private) — RLS: trade owns folder `<user_id>/*`, admins read all. (Bucket may already exist; will use `INSERT ... ON CONFLICT`.)
- `public.trade_band_for_type(text)` SQL helper returning band + required scheme(s), used by client + server.

**Frontend lib** `src/lib/tradeBanding.ts`: canonical map of trade type → band, required registrations, scheme options (Gas Safe / NICEIC|NAPIT|ELECSA / MCS / OZEV / OFTEC / FENSA|CERTASS), and the public-register URLs for admin links.

## Phase 2 — Signup flow rewrite (`src/pages/SignupTrade.tsx`)

Insert after trade-type step:

1. **Band 1 (gated)** — show registration-number field(s) inline. Validation rules per scheme (Gas Safe 7 digits, MCS pattern, etc.). No route-choice screen, no time-served option ever reachable.
2. **Band 2 (windows/doors)** — FENSA/CERTASS number OR checkbox "I notify building control per job" with attestation text.
3. **Band 3** — new **Route Choice screen**: two large cards (qualified vs time-served) + honest sub-line.
4. Plumber overlays: if "gas work" toggle → also collect Gas Safe; if "unvented hot water" → require G3 qualification upload.

**Qualified path**: existing cert/qualification uploads.

**Time-Served path** (`src/pages/SignupTradeTimeServed.tsx` or step inside SignupTrade):
- Years in trade (number) + evidence upload (multi-file) — stored to `trade_verification_documents` doc_type `years_evidence`.
- Portfolio: min 5 photos, each with address/area + approx date (stored as JSONB on `trade_portfolio_items` — new small table).
- References: existing `trade_references` table reused, min 2 customer + optional contractor (extend `relationship` enum if needed).
- PL insurance upload (mandatory).
- Photo ID upload (mandatory).
- On submit: `verification_status='pending_assessment'`, `verification_route='time_served'`, redirect to Pending Assessment page.

All other routes submit → `pending_verification` (existing under-review page).

## Phase 3 — Pending Assessment page + admin dashboard

**`src/pages/SignupTradeAssessmentPending.tsx`**: distinct from existing under-review. Honest copy, "log in & browse, can't quote until verified", typical 3–7 working days.

**TradeDashboard banner**: if `verification_status='pending_assessment'`, show "Your experience is being assessed — we'll be in touch shortly." (mutually exclusive with verified badge — already enforced via single source of truth, keep that.)

**`src/pages/AdminVerifications.tsx`** route-aware drawer:
- Show **band** + **route** badges at top.
- Registered/Qualified: registration number + "View on register ↗" link (Gas Safe / NICEIC / NAPIT / ELECSA / MCS / OFTEC / FENSA register URLs). Approve / Request info / Reject buttons.
- Time-served: 4-item checklist (`assessment_evidence_complete`, `references_called`, `site_assessment_done`, `competence_interview_done`) + assessor name + notes textarea. **Approve button disabled until all 4 ticked.** On approve: `verification_status='verified'`, `verified=true`, `on_probation=true`, `probation_jobs_remaining=3`.
- Approve calls new RPC `admin_approve_trade(trade_id)` (SECURITY DEFINER, `has_role(auth.uid(),'admin')` check) — same RPC triggers existing `trade_verified` email path.
- For registered/qualified: probation defaults to `false`, `0`.

## Phase 4 — Probation + copy fixes

**Probation decrement** — trigger on `jobs.stage` transition to `completed`: for each trade on the job's contracts with `on_probation=true`, decrement `probation_jobs_remaining`; when it hits 0, set `on_probation=false` and enqueue "fully-established" email via existing email queue.

**Internal admin flag**: `ActiveProjectsList` / admin job views show small "Probation" pill when trade is on probation. Public profile never shows it.

**Homepage copy** (`src/components/VerificationStandards.tsx` or wherever "Five checks. Every trade." lives — will grep):
- Replace 5th check with: "Proven competence — verified qualifications, or assessed time-served experience".
- Add line below the five: "Where the law requires registration — gas, electrical self-certification — we require it. Everywhere else, a great trade with genuine experience has a real route in."

**`/verification`** (`src/pages/Vetting.tsx` likely) — add "Two routes to verified" section: Route A (qualified/registered) + Route B (time-served, assessed), plain language.

## Constraints enforced
- Band 1 trades cannot reach time-served path (frontend gate + DB trigger rejects `verification_route='time_served'` when band='legally_gated').
- DB trigger blocks `verification_status='verified'` if band='legally_gated' AND required registration number is null.
- Checklist booleans + probation fields admin-only via trigger.
- Homeowner flow untouched.

## Out of scope (won't do unless asked)
- Live API calls to Gas Safe / NICEIC / MCS registers (one-click link only, same pattern as Companies House).
- Automated reference phone calls — admin records outcome manually via existing `trade_references.status`.

---

**Approve to start with Phase 1 (migration).** I'll pause after the migration runs so you can sanity-check the schema, then proceed through Phase 2 → 4. Total estimate: ~4 migrations, ~8 new/edited files per phase.
