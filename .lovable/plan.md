
# ProGrafter — Trust & Distribution Upgrade

Improves operational logic, quote quality, and controlled job distribution. No redesign, no subscriptions/payments/insurance/accounting, no removal of working features, magic-link auth and admin scoping preserved.

Because this is large, I'll build it in the phases below and verify each in the live preview before moving on.

---

## Phase A — Data model (one migration)

New tables + columns (all with GRANTs + RLS):

```text
job_trade_invitations
  id, job_id, trade_id, batch_number, status, invited_at, viewed_at,
  responded_at, quote_submitted_at, expires_at (default now()+48h),
  decline_reason, created_at, updated_at
  status enum-as-text: invited|viewed|interested|declined|quote_submitted|no_response|expired|replaced

job_publish_overrides
  id, job_id, admin_id, override_reason, blocking_flags (jsonb), created_at

job_brief_files
  id, job_brief_id, job_id, file_name, file_type, file_size, category,
  storage_path, uploaded_by, created_at

quotes (add columns)
  scope_of_works, assumptions, deposit_required (bool), deposit_amount,
  payment_schedule (jsonb), line_items (jsonb), certifications (jsonb),
  terms (jsonb), vat_status (text), vat_amount, estimated_duration_text
```

RLS: trades see/update only their own invitations; homeowners read invitations for their jobs; admins full access via `has_role`. Files readable by owner homeowner, admins, and invited trades once published. Storage bucket `job-brief-files` (private) with scoped policies.

---

## Phase B — Controlled 3-trade release (Issue 1)

- `publish-job-brief` edge function: rank matching trades (verified → accepting → category → within radius → closest → cap 3), create `job_trade_invitations` for batch 1 only, plus a waiting list of remaining matches (not invited).
- New edge function `release-next-batch`: admin-triggered, invites next ≤3.
- Trade `AvailableJobsView`: show only jobs where the trade has an active invitation; mark `viewed`/`interested`/`declined`; 48h countdown wording.
- Admin `AdminJobBriefs`: "Matched Trades" panel (auto-select top 3 / manual choose / publish selected / add to waiting list / release next batch) with per-batch counts (viewed/interested/quotes/declined/no-response).
- Homeowner wording: "Shared with N matched trades. Quotes will appear here as they come in."

## Phase C — Admin publish checklist + override log (Issue 6)

- Pre-publish checklist component in `AdminJobBriefs` computing blocking flags (missing contact/postcode/type, vague description, profanity, needs scoping/planning).
- Blocking flags disable normal publish; "Publish anyway (override)" opens modal requiring a non-blank reason → writes `job_publish_overrides` (admin id, flags, timestamp).

## Phase D — Bad-brief validation / profanity / nonsense filter (Issue 7)

- Shared helper `src/lib/briefValidation.ts` (min lengths, profanity list, repeated-char/nonsense/spam heuristics, vagueness) reused by `PostJobBrief` (homeowner-facing gentle messages) and admin checklist flags.
- Example "its a house with a door and window its full of shit" is blocked homeowner-side and flagged admin-side.

## Phase E — Optional file upload in post-a-job (Issue 8)

- Upload block in `PostJobBrief` Step 3 (Scope & Access): multi-file (PDF/JPG/PNG/HEIC/DOC/DOCX), optional category dropdown, reassurance copy. Store to bucket + `job_brief_files`.
- Final review shows "Files uploaded: N". Admin brief view + invited-trade job view list files.

## Phase F — Structured trade quote builder (Issue 3)

- Rebuild `QuoteSubmitForm` into sections 1–11 (Summary, Scope, Line Items, Materials, Exclusions, Assumptions, Payment Schedule, Certifications & Handover, Terms, Generate PDF, Submit) with Simple vs Detailed mode. Reworded materials toggle. Payment-schedule builder with % + due triggers and total reconciliation warning. Persists to new quote columns. PDF generation kept.

## Phase G — Quote quality gate (Issue 4)

- `src/lib/quoteQuality.ts` computes critical vs warning issues. Pre-submit modal "Quote Quality Check": critical (total, VAT, scope, exclusions, assumptions) block; warnings allow "Submit Anyway" / "Improve Quote".

## Phase H — Homeowner quote review (Issue 5)

- Enhance `QuotesReceived` / quote detail into structured review (trade + verification, price/VAT/validity/start/duration, payment schedule, scope, exclusions, assumptions, certifications, warranty, PDF). "Quote Clarity" status area. Actions: Run Quote Health Check / Ask Builder / Request Revised Quote / Accept. Keeps existing pre-accept confirmation checklist, adds "Continue without Quote Health Check".

## Phase I — Sticky header overlay fix (Issue 2)

- Audit shared `AppLayout`/`AppShell` header + affected pages; correct top padding/offset and z-index so no content sits under the navy bar (post-a-job steps, dashboards, admin brief pages, quote screens) on mobile + desktop.

---

## Technical notes
- Reuse existing `override_reason`/`published_by`/`needs_scoping`/`needs_planning_guidance` columns already on `job_briefs`.
- All new edge functions validate JWT + admin role in code; CORS included.
- No changes to magic-link/session creation in `submit-job-brief`.
- Verify each phase via Playwright against localhost with the injected admin session.
