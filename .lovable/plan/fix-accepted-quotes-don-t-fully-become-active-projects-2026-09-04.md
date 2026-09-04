# Fix: accepted quotes don't fully become active projects

## What's broken today

Accepting a quote only nudges the job's stage/status. The trigger
`on_quote_accepted_advance_job` fires on `status = 'accepted'` only, and does
nothing else. The offline path (`status = 'agreed_offline'`, set by the
admin-only record-agreed-quote function) isn't covered at all.

So on acceptance today: no `contracts` row, other quotes on the job stay
`pending` (hence "chase up overdue"), and `job_matches` stays `notified`.

`generate_contract_for_quote` today refuses to run unless `auth.uid()` is the
homeowner. That check is correct for the button on the homeowner's screen, but
it means a database trigger or an admin recording an offline agreement can
never call it — which is exactly why the contract is missing.

## Proposed fix

### 1. Split the contract generator in two
- New internal function `create_contract_for_quote_internal(_quote_id)` —
  everything the current function does *after* the caller check (template
  lookup, pricing, milestones, insert, event log). Idempotent: if a contract
  already exists for that quote it returns the existing id.
- `generate_contract_for_quote` keeps its homeowner-only check and then calls
  the internal one. No change for the existing homeowner "Accept Quote" button.

### 2. Widen the acceptance trigger
Rename/extend `on_quote_accepted_advance_job` to fire when a quote moves into
either `accepted` or `agreed_offline`, and to do all four steps in one
transaction:

a. Advance the job — as now, but also allow `quoting -> scheduled` for the
   offline path (Smedley Close is stuck on `quoting`).
b. Call `create_contract_for_quote_internal(NEW.id)`.
c. Mark sibling quotes on the same job that are still `pending` as
   `superseded` (new status value, distinct from a trade-side `declined`), and
   close their `job_trade_invitations` rows so the chase/escalation job stops
   picking them up.
d. Move that job's `job_matches` rows off `notified` — the winning trade's row
   to `won`, the rest to `closed` — so the job stops looking open for matching.
   `guard_job_match_update` needs to permit these system transitions.

### 3. Failure behaviour
If contract generation can't complete (e.g. no active contract template), the
trigger should log the reason to `contract_events`/`job_escalation_events` and
still let the acceptance stand, rather than blocking the accept. A job with a
missing contract then shows up in an admin report instead of failing silently.

## Effect on existing data

The trigger only fires on future status changes, so **nothing is repaired
retroactively**. Smedley Close (PG-GEMANN) needs a one-time correction
alongside the fix.

Currently stuck (live, no contract row):

| Job | Quote | Quote status | Job stage | Pending siblings | job_matches |
|---|---|---|---|---|---|
| PG-GEMANN (7 Smedley Close, £48,500) | QPG-2026-0018 | agreed_offline | quoting | 1 | notified |
| PG-WVERBR | QPG-2026-0015 | accepted | scheduled | 0 | notified |
| PG-V5GNZ6 | QPG-2026-0007 | accepted | enquiry (job still `awaiting_quotes`) | 0 | notified |

Also: 8 older `completed` jobs have accepted quotes with no contract row. These
are historic/seed records — recommendation is to leave them alone rather than
back-generate contracts for finished work.

One-time backfill (run once, after the fix, on those three jobs only):
generate the contract, supersede PG-GEMANN's one leftover pending quote, set
PG-GEMANN stage to `in_progress` (work is physically underway), set PG-V5GNZ6's
job to `in_progress`/`scheduled`, and settle the three `job_matches` rows.

## Technical notes
- All of the above is one database migration plus a small backfill script; no
  frontend changes are required — the trade dashboard's Active Projects list
  already reads from `contracts`, so a contract row is what makes these jobs
  appear.
- `superseded` needs adding wherever quote statuses are labelled in the UI so
  it doesn't render as a raw string.

Nothing will be run until you confirm.
