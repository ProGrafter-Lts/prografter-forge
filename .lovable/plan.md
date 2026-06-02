## STEP 0 — Audit findings (current state)

**Where homeowner records / briefs can be created today**
- `/post-job-brief` (`PostJobBrief.tsx`) — the live brief form. Calls the `submit-job-brief` edge function. **Plain text address fields** (Address line 1/2, Town/City, Postcode) — there is **no postcode autocomplete anywhere in the codebase**.
- `/post-a-job` (`PostAJob.tsx`) — **dead route**: `App.tsx` redirects `/post-a-job` → `/post-job-brief`. Component is effectively unused.
- `/signup/homeowner` (`SignupHomeowner.tsx`) — a **separate** email + **password** signup → `supabase.auth.signUp` → writes `consents_log` + sends `homeowner-welcome` → `/dashboard/homeowner`.

**What brief submission writes today**
- Inserts **one** row into `job_briefs` only. **No `auth.users`, no `homeowners` row, no link.** Then enqueues `job-brief-homeowner` + `job-brief-admin` emails. So a homeowner who posts a job gets **no account** — exactly the gap you flagged.

**Tables (existing)**
- `job_briefs`: has `status` (default `'new'`, **no CHECK constraint**), `is_test`, `needs_scoping`, `needs_planning_guidance`, `quotes_received`. **No `user_id`/`homeowner_id`.**
- `homeowners` (id, user_id, name, email, phone, is_test), `consents_log` (user_id, consent_type, consented, ip_address, user_agent), `profiles` (user_type default 'trade'), `quote_checks`, `user_roles`. No entitlements table.

**Admin brief actions today** (`AdminJobBriefs.tsx`)
- Only one action: **Approve & publish to trades** (`publish-job-brief`). Flags `NEEDS SCOPING` / `PLANNING GUIDANCE` are shown but publish only does a `confirm()` warning — no real gate, no scoping/planning recording, no status lifecycle.

**Address bug (PG-J2N4XW)**
- Stored as `line1 = "22 COWPASTURE LANE, SUTTON-IN-ASHFIELD"`, `line2 = "Sutton-in-Ashfield"`, `city = "Sutton-in-Ashfield"` — town tripled, line1 all-caps. Since there is no autocomplete, this came from manual/test entry. Fix = clean the record + add Title-Case normalisation + de-duplication on submit.

**Address/wordmark in emails & site**
- A prior global replace mangled the footer address: `Contact.tsx`, `seoSchemas.ts`, and email `_brand.tsx` now literally read `"66 ln, London ln"`. Needs a correct address.
- `job-brief-homeowner.tsx` CTA: `Visit ProGrafter` → `https://prografter.co.uk` (homepage dead-end). Brand header uses a text wordmark, not the logo image.

---

## Decisions needed before I build
1. **Correct company address** to replace the broken `66 ln, London ln` everywhere (emails, footer, Contact, legal/schema). I cannot guess this.
2. **Free Quote Check entitlement**: prompt default = grant **one free** on first job post. I'll implement that with a toggle constant to switch to "charge £49 from first check".

---

## Implementation plan

### 1. Database (one migration)
- `job_briefs`: add `homeowner_user_id uuid`, `homeowner_id uuid`, `existing_quotes_count int`, plus lifecycle columns: `scoping_notes text`, `scoped_by uuid`, `scoped_at timestamptz`, `planning_notes text`, `planning_guidance_by uuid`, `planning_guidance_at timestamptz`, `published_by uuid`, `override_reason text`. Add a `status` CHECK for `new | under_review | awaiting_scoping | scoped | approved | published_to_trades`.
- New `quote_check_entitlements` (user_id, source, granted_at, consumed_at, quote_check_id) with RLS (owner read) + service_role full; admins read.
- Add homeowner-owned RLS to `job_briefs` (a homeowner can read their own briefs via `homeowner_user_id = auth.uid()`), keep admin policies.
- `consents_log`: allow service_role insert (used by edge fn).

### 2. Account-on-submit (passwordless) — `submit-job-brief`
- On submit: create/find `auth.users` by email via admin API with `user_metadata.user_type='homeowner'` (email auto-treated as confirmed for magic-link), insert `homeowners` + `profiles(user_type='homeowner')` if missing, insert `consents_log` (terms + marketing) with IP + user agent, insert `job_briefs` linked to the user with `status='under_review'`, grant one `quote_check_entitlements` row (free, toggle constant).
- Generate a **magic-link / OTP** action link to `/dashboard/homeowner` and return enough for the client to continue. Homeowner email CTA links to this magic link (item E), not the homepage.

### 3. Frontend brief form (`PostJobBrief.tsx`)
- Remove the password concept entirely (there isn't one here already). Add a **marketing opt-in** checkbox alongside the existing terms consent. Add Title-Case + de-dupe normalisation of address fields before submit (fixes F going forward).
- Fold the green-energy questions in as **conditional fields** within the one form (single spine).
- After submit: redirect signed-in homeowner to `/dashboard/homeowner` with an "Under review" banner; keep the confirmation/reference visible. (The dead-end buttons I already added stay as fallback for not-yet-authed.)
- Keep `existing_quotes_count` ("have you received quotes / how many") as a **stored segmentation field** — no payment/branching in the brief.

### 4. Unify sign-up
- Redirect `/signup/homeowner` → `/post-job-brief` (brief submission becomes the single account-creation event). Keep `/login` + magic-link for returning users.

### 5. Admin lifecycle gate (`AdminJobBriefs.tsx` + edge support)
- Show new status pill. Add **"Record scoping call"** (editable Scope items / Known issues + notes → clears `needs_scoping`, sets `status='scoped'`, logs `scoped_by`/`scoped_at`).
- Add **"Record planning guidance given"** (notes → clears `needs_planning_guidance`, logs admin + timestamp).
- **"Approve & publish to trades"** runs clean only when no blocking flags remain; otherwise a deliberate **"Publish anyway"** override that **requires a reason** (stored in `override_reason`) and is logged. `publish-job-brief` updated to set `status='published_to_trades'` and accept/record the override reason.

### 6. Dashboard Quote Checker card (`HomeownerDashboard`)
- If the homeowner's brief has `existing_quotes_count > 0`, show a Quote Checker card → `/quote-checker` with `project_type` pre-filled.
- If they hold an unconsumed free entitlement, the `/quote-checker` flow **skips Stripe** and consumes the entitlement; standalone/repeat checks stay £49. Standalone `/quote-checker` page left as-is.

### 7. Email content (`_brand.tsx`, `job-brief-homeowner.tsx`)
- Replace text wordmark with the uploaded **logo image asset** in the email shell.
- Homeowner CTA → magic-link login landing on `/dashboard/homeowner`.
- Replace `66 ln, London ln` with the confirmed address (emails + `Contact.tsx` + `seoSchemas.ts` + footer). Admin "Open in Admin Dashboard" left untouched.
- Redeploy all touched edge functions.

### 8. Data hygiene
- Tag/clean PG-J2N4XW: set `is_test=true`, fix the address to clean line1/line2/town/county Title-Case. Keep `is_test` enforced as default false on real submits.

### Reporting back after build
Tables written on submit; magic-link end-to-end; admin scoping action clearing the flag + moving state; the dashboard Quote Checker card; and a screenshot of the homeowner dashboard after a fresh test brief.

---

### Technical notes
- Magic-link uses Supabase admin `generateLink({ type: 'magiclink' })` inside the edge function (service role); the link target is `/dashboard/homeowner`.
- `existing_quotes_count` parsed from the existing "quotes received" answer.
- Entitlement consumption is transactional in the quote-checkout/verify path with a toggle constant `GRANT_FREE_FIRST_CHECK = true`.
- All new public tables get GRANTs + RLS in the same migration.
