# Trade Signup, Admin Verification & Emails

This loop completes the signup/onboarding work started last loop. Three deliverables: a proper 4-step trade signup flow at `/signup/trade`, an admin panel to review trade verifications, and four branded transactional emails.

## 1. Trade signup flow at `/signup/trade`

Replace the temporary redirect with a real 4-step wizard. The existing `/register/trade` page becomes a redirect to `/signup/trade` (so old links keep working).

**Step 1 — Account & contact**
- Full name, email, password (min 8 chars), phone, business postcode
- Consent checkboxes: terms (required) + marketing (optional) → logged to `consents_log` after signup
- Calls `supabase.auth.signUp` with `user_type: 'trade'` in metadata so the existing `handle_new_user` trigger creates the `trades` row in `verification_status='pending'`

**Step 2 — Business & trade details**
- Trade type (dropdown: Electrician, Plumber, Gas Engineer, Builder, Roofer, Plasterer, Carpenter, Tiler, Decorator, Scaffolder, Landscaper, Other, plus the renewable types from `RENEWABLE_TRADE_TYPES`)
- Company name, years experience, website (optional), short bio
- Specialisms multi-select (re-uses `<SpecialismsPicker>`) with optional primary
- For green trades: surface MCS / TrustMark / PAS / OZEV / F-Gas / CIGA / INCA fields and cert expiry (existing logic from `TradeRegisterNew.tsx`)
- Saves into `trades` row + `trade_specialisms` via existing `saveTradeSpecialisms`

**Step 3 — Verification documents**
- Public liability insurance: PDF/image upload + expiry date (required)
- ID document: passport or driving licence upload (required)
- Trade qualification cert (optional but encouraged, e.g. Gas Safe, NICEIC card, MCS cert)
- All files go to the private `trade-verification-documents` bucket under `{user_id}/{doc_type}-{timestamp}.{ext}`
- File metadata recorded on the `trades` row (`insurance_cert_url`, `insurance_expiry`) plus a new `trade_verification_documents` row per file (see DB section)

**Step 4 — Review & submit**
- Summary of everything entered, edit-step buttons
- "Submit for review" sets `verification_status='pending'` (it already is) and routes to `/signup/trade/under-review`

**Under-review page (`/signup/trade/under-review`)**
- Friendly explainer: "We'll review within 1 business day. You'll get an email when approved."
- Shows current status pulled from `trades.verification_status`. If `info_requested`, shows `verification_notes` and a "Resubmit" CTA back to step 3. If `approved`, auto-redirect to `/dashboard/trade`. If `rejected`, shows `rejection_reason`.

**Trade dashboard gating**
- `/dashboard/trade` checks `verification_status`. If not `approved`, shows a slim banner with a link back to `/signup/trade/under-review` and hides job/lead surfaces (keeps profile + settings accessible so they can fix things).

## 2. Admin verification panel at `/admin/verifications`

- New protected route, gated by `has_role(auth.uid(), 'admin')` — hooks into the existing `user_roles` table and `has_role()` function
- List view: pending trades first, then info_requested, then recent decisions; columns = name, trade type, postcode, submitted_at, status
- Detail drawer: shows trade profile, all uploaded documents (signed URLs from the private bucket), specialisms, green certs
- Actions: **Approve** (sets `verification_status='approved'`, `verified=true`, fires `trade-verification-approved` email), **Request more info** (status → `info_requested`, captures note → `verification_notes`, fires `trade-verification-info-requested` email), **Reject** (status → `rejected`, captures reason → `rejection_reason`, `rejected_at=now()`, fires `trade-verification-rejected` email)
- New nav entry only visible to admins
- I'll insert one admin row for you on request — tell me your email after this loop and I'll add it to `user_roles`

## 3. Transactional email templates

Four new templates registered in `supabase/functions/_shared/transactional-email-templates/registry.ts`:

| Template key | Trigger | Recipient |
|---|---|---|
| `homeowner-welcome` | After homeowner signup confirms email | Homeowner |
| `trade-verification-submitted` | When trade completes step 4 | Trade |
| `trade-verification-approved` | Admin approves | Trade |
| `trade-verification-info-requested` | Admin requests info | Trade |
| `trade-verification-rejected` | Admin rejects | Trade |

(Five templates total — four trade lifecycle + one homeowner welcome. Spec asked for "four"; I'm adding the homeowner welcome as the obvious fifth since you'll want it.)

All templates re-use the same brand wrapper as the existing `waitlist-welcome` template (cream background, mono font, brand green accent). Plain English copy, single CTA button per email.

Triggering:
- Homeowner welcome: enqueued from `SignupHomeowner.tsx` immediately after `signUp` resolves
- Trade submitted: enqueued from step 4 of the signup wizard
- Approve / info_requested / rejected: enqueued from the admin panel actions

## 4. Database & storage changes

One migration:

1. **`trade_verification_documents` table**
   - `id uuid pk`, `trade_id uuid fk → trades.id on delete cascade`, `doc_type text check in ('insurance','id','qualification','other')`, `file_path text`, `original_filename text`, `expiry_date date null`, `uploaded_at timestamptz default now()`
   - RLS: trade can insert/select own rows; admin can select all

2. **`trades` column additions** (only if missing — most already exist)
   - `insurance_expiry date` (already implied via `insurance_cert_url`; add if missing)
   - `submitted_for_review_at timestamptz` so admin list can sort by submission time

3. **Storage RLS for `trade-verification-documents` bucket**
   - Already created last loop; add policy: admins can read all objects in this bucket via `has_role(auth.uid(),'admin')`

No changes to the `handle_new_user` trigger — it already handles `user_type='trade'` correctly.

## 5. Routing additions in `src/App.tsx`

- `/signup/trade` → new `SignupTrade.tsx` (wizard host)
- `/signup/trade/under-review` → new `SignupTradeUnderReview.tsx`
- `/admin/verifications` → new `AdminVerifications.tsx` (wrapped in `ProtectedRoute` + admin role check)
- `/register/trade` → flip from current page to a redirect → `/signup/trade` (preserves any query params)

## 6. Files I'll create / edit

**New**
- `src/pages/SignupTrade.tsx` (wizard host)
- `src/pages/SignupTradeUnderReview.tsx`
- `src/pages/AdminVerifications.tsx`
- `src/components/signup/trade/Step1Account.tsx`
- `src/components/signup/trade/Step2Business.tsx`
- `src/components/signup/trade/Step3Documents.tsx`
- `src/components/signup/trade/Step4Review.tsx`
- `src/components/admin/AdminLayout.tsx` + `AdminRoute.tsx` (role-gate wrapper)
- `supabase/functions/_shared/transactional-email-templates/homeowner-welcome.tsx`
- `supabase/functions/_shared/transactional-email-templates/trade-verification-submitted.tsx`
- `supabase/functions/_shared/transactional-email-templates/trade-verification-approved.tsx`
- `supabase/functions/_shared/transactional-email-templates/trade-verification-info-requested.tsx`
- `supabase/functions/_shared/transactional-email-templates/trade-verification-rejected.tsx`
- One Supabase migration for the new table + storage policy

**Edited**
- `src/App.tsx` (routes)
- `src/pages/SignupTradeRedirect.tsx` → repurposed or removed (replaced by real page)
- `src/pages/TradeRegisterNew.tsx` → becomes a thin redirect to `/signup/trade`
- `src/pages/TradeDashboard.tsx` (verification gate banner)
- `src/pages/SignupHomeowner.tsx` (enqueue welcome email after signup)
- `src/components/Navbar.tsx` (admin nav link, only when role=admin)
- `supabase/functions/_shared/transactional-email-templates/registry.ts` (register 5 new templates)

## 7. After build — manual QA I'll run

End-to-end smoke through both flows:
1. Homeowner: sign up → confirm email → land on `/signup/homeowner/next` → dashboard with welcome banner
2. Trade: sign up → all 4 steps → under-review page → admin approves from `/admin/verifications` → trade refreshes → lands on `/dashboard/trade` unblocked
3. Trade: try the "info requested" path end-to-end
4. Confirm verification banner blocks job surfaces while pending

Screenshots of every distinct screen will be attached at the end.

## What I'm explicitly **not** doing this loop
- Phone/SMS verification (not in spec)
- Payment / subscription gating for trades
- Background-check integrations (Companies House, Gas Safe API lookups) — manual admin review only
- Pre-filling MCS/TrustMark verification automatically — that's a separate integration

If any of the above should be in scope, tell me before I start and I'll fold it in.
