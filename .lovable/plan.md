# Fix trade application confirmation + login

## Problem (confirmed from the email log and code)

Two separate, real gaps — both reproduced for `prografter.test@gmail.com`:

1. **No confirmation email on submit.** The application form (`src/pages/Apply.tsx`) only fires the internal admin alert (`trade-signup-admin-notification`). It never sends the applicant the `trade-welcome` email. The email log confirms it: today's submission produced only the `trade-verified` (approval) email; the last `trade-welcome` was 19 June. The template exists and is registered — it's just never called.

2. **Approval creates no login.** The application flow writes only to the `trade_applications` table. It never creates an auth account or a `trades` record. So "approving" in admin sends the verified email but provisions nothing to log into — there are genuinely no credentials. (The `trades` row + `has_role` that the trade dashboard needs are only created by the signup trigger when an auth user signs up as a trade.)

## What we'll build

### 1. Application confirmation email (immediate fix)
In `Apply.tsx` `submit()`, after the record is saved, also invoke `send-transactional-email` with `templateName: "trade-welcome"`, `recipientEmail: applicantEmail`, idempotency key `trade-application-welcome-<applicationId>`, and `templateData: { firstName }`. Non-blocking, like the existing admin notification, so the confirmation screen still shows on email delay. (`trade-welcome` already says "5–7 working days", matching the on-screen message.)

### 2. Provision a real login on approval (magic link + optional password)
Mirror the homeowner pattern. Add a new edge function `provision-trade-account` (admin-only, validates the caller is an admin via the service role + `has_role`) that, given an application id:
- Creates the auth user if one doesn't exist for that email (with `user_type: 'trade'` and name/company/phone/postcode/trade metadata, so the existing `handle_new_user` trigger creates the `trades` row), or fetches the existing user.
- Links the trade record (sets `verified = true`, `verification_status = 'approved'`) so the dashboard works on first login.
- Generates and sends a **magic link** to the applicant's email so they can log in with one click.

Wire it into the admin approve action in `src/pages/AdminApplicationDetail.tsx` `decide("approved")`: after the existing `trade-verified` email, call `provision-trade-account`. The verified email link to `/dashboard/trade` then lands on a working, authenticated account.

### 3. Trade login + optional password
- Ensure `src/pages/Login.tsx` supports a trade magic-link / OTP path (it already has a homeowner magic-link path; extend it to trades) so the emailed link and manual code both resolve via `/auth/callback`.
- Add an optional "Set a password" section to the trade dashboard (`src/pages/TradeDashboard.tsx`), reusing the same pattern as `HomeownerProfileSection.tsx`, so the trade can set a password for future direct logins instead of relying on magic links.

### 4. Recover the existing account
After the fix is in, re-run approval/provisioning for `prografter.test@gmail.com` so the already-approved test account gets a working login and a magic link, without needing a brand-new submission.

## Technical notes
- New edge function uses the service role and an explicit admin check; it is the only place auth users are created from applications.
- `handle_new_user` already maps `user_type: 'trade'` metadata to a `trades` row — no trigger changes needed.
- Magic-link redirect uses `${window.location.origin}/auth/callback` then routes to `/dashboard/trade`.
- Deploy `send-transactional-email` is unaffected (template already registered); deploy the new `provision-trade-account` function.

## Out of scope
- No change to the application form fields or the 5–7 working day messaging (already correct).
- No bulk/marketing email.
