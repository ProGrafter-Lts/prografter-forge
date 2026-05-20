# Email pipeline review — pre-launch hardening

This is a sizeable change (4 separate items, 3 new templates, 3+ new trigger sites, 1 cron job, plus an investigation). Plan first so we don't half-wire anything before money flows.

## 1. Auth email logging — investigate the "0 sends" rows

The 4 auth rows in the panel all read from `email_send_log` rows where `template_name = 'auth_emails'`. If Lee fired real signup/reset emails and they aren't showing, one of three things is true:

1. `auth-email-hook` is using the **old direct-send pattern** (`@lovable.dev/email-js`) instead of `enqueue_email` — bypassing the log entirely.
2. The hook is enqueuing under a different `template_name` (e.g. `signup`, `recovery`) so it never matches the `auth_emails` filter.
3. The hook isn't being invoked at all (Supabase Auth webhook not pointed at it).

**Action:** Read `supabase/functions/auth-email-hook/index.ts`, query `email_send_log` for the last 7 days grouped by `template_name`, and check `auth_logs` for actual send events. Fix whichever of the three is broken. If pattern (1), re-scaffold the hook so it queues properly.

## 2. New template + trigger: `payment-milestone-released`

Two recipients, two distinct emails, one trigger.

- Create `supabase/functions/_shared/transactional-email-templates/payment-released-trade.tsx`
- Create `supabase/functions/_shared/transactional-email-templates/payment-released-homeowner.tsx`
- Register both in `registry.ts`
- Add to `REGISTERED_TEMPLATES` + `EMAIL_CATALOG` (new category: `payments`) in `AdminEmailStatus.tsx`
- **Trigger site:** wherever a stage's `payment_status` flips to `paid`. Current code reads `payment_status === "paid"` in `EarningsView` and `TradeDashboard` but I haven't located the write site yet — likely admin action or a Stripe webhook that doesn't exist yet. **Need to confirm with you where this flip happens today** (manual admin toggle? Stripe webhook? Not implemented?).

## 3. New template + trigger: `quote-received` (homeowner)

- Create `quote-received.tsx` template + register
- **Trigger site:** `src/components/trade/QuoteSubmitForm.tsx` line ~108 (`from("quotes").insert(...)`) — after successful insert, fetch the job's homeowner email and invoke `send-transactional-email` with `idempotencyKey: quote-received-${quoteId}`.
- Also wire the QuickBuild quote submission path.
- Add to catalog under new `quotes` category.

## 4. New template + trigger: `project-overdue` (both parties)

Two emails, one cron-triggered scan.

- Create `project-overdue-trade.tsx` + `project-overdue-homeowner.tsx` templates
- Create new edge function `scan-overdue-projects` (verify_jwt = false, cron-invoked)
- Logic: select projects where `planned_completion_date < now()` AND status != complete AND no `project-overdue` row in `email_send_log` for that project in the last 14 days (dedupe so we don't spam daily)
- Schedule via `pg_cron` daily at 09:00 UTC
- Add to catalog under `project` category

## 5. Contract email triggers — confirm timeline

The 7 contract templates exist in the registry but are not invoked anywhere. I'll add a `// TODO: wire to contract signing flow (target June 2026)` comment in `ContractPanel.tsx` and a banner note in the admin panel so this stays visible. No new code wired until the signing feature ships — agreed.

## Database changes

- No new tables required.
- New cron job (pg_cron) for the overdue scan — added via `insert` tool (not migration) since it embeds the function URL + anon key per the cron guide.

## Open questions before I build

1. **Payment release trigger:** Where does `payment_status` flip to `paid` today — manual admin, Stripe webhook, or not yet implemented? This determines whether item 2 is a code change in an existing flow or needs a placeholder for a future Stripe webhook.
2. **Overdue cadence:** Daily scan with a 14-day re-notify suppression — does that match your intent, or do you want a one-shot notification only?
3. Confirm category labels: I'm proposing `payments`, `quotes`, `project` as three new chips alongside `auth`, `onboarding`, `contract`.

Once you confirm those three, I'll build everything in one pass.
