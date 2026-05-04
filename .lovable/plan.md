# Contract Data Model & Signing Flow — Reconciliation Plan

_Plan-only. No code or migrations applied yet. Awaiting approval._

## TL;DR

About **70% of the spec is already implemented** in this project. The remaining work is focused on: tamper-evidence (`full_text_hash`), the 4-tab contract page UI with 3-checkbox signing, PDF export to storage, the `CONTRACT_TEMPLATE_APPROVED` feature flag, and reconciling a few naming gaps. **Replacing the existing tables would destroy a working dispatcher, RLS model, and SECURITY DEFINER functions.**

Decisions confirmed by user:
- **Project entity:** keep `contracts.job_id → jobs(id)`. Routes stay `/project/:id`.
- **Template linkage:** keep `template_id UUID → contract_templates(id)`. Add `template_version` snapshot column for display/audit.
- **Migration strategy:** ALTER existing tables; do not drop and recreate.

---

## Audit of current state vs spec

### Tables (all 4 exist, RLS enabled)

| Spec column | Current state | Action |
|---|---|---|
| `contract_templates.version/status/legal_text/plain_english_summary/guidance_notes` | ✅ exists, has 1 active row `2026.04-placeholder` | none |
| `contracts.project_id` | ❌ uses `job_id` (decision: keep) | none — frontend & spec language updated |
| `contracts.template_version TEXT FK` | ❌ uses `template_id UUID FK` (decision: keep) | add `template_version TEXT` snapshot column (nullable, populated at generation) |
| `contracts.contract_value_pence` | ❌ uses `total_value_incl_vat_pence` (+ excl + VAT bps) | none — current is richer, keep |
| `contracts.scope_summary` | ❌ named `scope_of_works` | none — same field, different name |
| `contracts.start_date_estimate` / `completion_date_estimate` | ❌ named `estimated_start_date` / `estimated_completion_date` | none — same fields |
| `contracts.rendered_legal_text` | ❌ **MISSING** | **ADD** column (TEXT) |
| `contracts.full_text_hash` | ❌ **MISSING** | **ADD** column (TEXT) |
| `contracts` status check constraint | currently: `draft, pending_signatures, active, completed, terminated, closed` | spec also lists `awaiting_signatures` (rename `pending_signatures`) and `pending_completion_acceptance`. **Update CHECK constraint.** |
| `contract_variations` columns | ✅ matches (uses `programme_impact_days` vs spec's `time_impact_days`) | minor — keep current name, document |
| `contract_events` | ✅ matches spec, append-only RLS already in place | none |

### RLS policies

- ✅ `contracts` SELECT: parties only (correct)
- ⚠️ `contracts` UPDATE: currently allows any party — spec wants SECURITY DEFINER only. **Tighten** by removing the broad UPDATE policy and routing all writes through `sign_contract`, `mark_completed`, etc.
- ✅ `contracts` INSERT/DELETE: already denied to clients (good)
- ✅ `contract_events` INSERT/UPDATE/DELETE: already denied to clients
- ✅ `contract_templates` policies match spec

### Functions (already deployed)

| Spec | Current | Status |
|---|---|---|
| `generate_contract_for_quote(quote_id)` | ✅ exists | needs update: render `legal_text` with placeholders → store in new `rendered_legal_text`; populate `template_version` snapshot |
| `sign_contract` | ✅ exists | needs update: compute & verify `full_text_hash`; on second signature, set status=`active`, set `activated_at`, write `activated` event |
| `propose_variation` | ✅ exists | none |
| `sign_variation` | ✅ exists | none |
| `log_contract_event` | ✅ exists | none |
| `dispatch_contract_event_email` (trigger) | ✅ exists | none |
| Tamper verification function | ❌ **MISSING** | **ADD** `verify_contract_integrity(contract_id)` RPC that recomputes hash and writes a `tamper_detected` event on mismatch |
| `mark_completion` / `accept_completion` lifecycle SECURITY DEFINER fns | ⚠️ unclear — `ContractPanel.tsx` may write directly | **ADD** if missing, then tighten UPDATE RLS |

### Edge functions

- ✅ `contract-email-dispatcher` exists and handles all 7 email events listed in the spec
- ✅ All 7 email templates exist: `contract-generated`, `contract-awaiting-signature`, `contract-activated`, `variation-proposed`, `variation-approved`, `completion-marked`, `completion-accepted`
- ❌ **No PDF export function.** Need new edge function `contract-pdf-snapshot` that renders contract → PDF → uploads to storage. Triggered by DB on state changes.
- ❌ **No `contracts` storage bucket.** Need to create private bucket with RLS allowing parties to read their own contract PDFs.

### Frontend

- ⚠️ `src/components/project/ContractPanel.tsx` exists but uses **old shape** (legacy `contract_text`, `agreed_price`, `payment_schedule`) — likely points at `contracts_legacy`. Needs full rewrite as the 4-tab page.
- ❌ No `/project/:id/contract` standalone route — currently embedded in ProjectDetail. Spec wants dedicated page. **Add route.**
- ❌ No 3-checkbox signing UI
- ❌ No `CONTRACT_TEMPLATE_APPROVED` feature flag

---

## Phase plan (approval gates between phases)

### Phase 1 — Schema reconciliation & tamper-evidence (1 migration)

1. `ALTER TABLE contracts` — add `rendered_legal_text TEXT`, `full_text_hash TEXT`, `template_version TEXT`.
2. Update `contracts_status_check` to add `awaiting_signatures`, `pending_completion_acceptance`; map old `pending_signatures` → `awaiting_signatures` for any existing rows.
3. Update `generate_contract_for_quote()`:
   - Substitute all 16 placeholders into `legal_text` → write to `rendered_legal_text`
   - Compute `full_text_hash = encode(digest(rendered_legal_text || layer2_json, 'sha256'), 'hex')`
   - Snapshot `template_version` from the active template
4. Update `sign_contract()`:
   - Verify current `full_text_hash` matches recomputed hash before allowing signature; on mismatch, write `tamper_detected` event and raise.
   - On second signature: set status=`active`, set `activated_at`, set jobs.stage='in_progress', write `activated` event (already present — just verify).
5. Add `verify_contract_integrity(contract_id UUID)` RPC for the frontend to call on every contract page load.
6. Tighten `contracts` UPDATE RLS: drop "Parties can update own contract" policy; all updates must go through SECURITY DEFINER functions (`sign_contract`, `mark_completion`, `accept_completion`, `update_bespoke_terms`).
7. Add `update_bespoke_terms(contract_id, side, text)` SECURITY DEFINER fn — reverts contract to `draft` and clears any signatures (per spec: "saving causes contract to revert to draft").
8. Add `mark_completion(contract_id)` and `accept_completion(contract_id)` SECURITY DEFINER fns if not already present, with permitted lifecycle transition checks.
9. Seed/upgrade the placeholder template with the 7 section headings + Lorem Ipsum, version `placeholder-pre-launch`, status `active`, drafted_by `pre-launch-placeholder`.

### Phase 2 — Feature flag + 4-tab contract page + signing UI

10. Add `CONTRACT_TEMPLATE_APPROVED` flag. Implementation: a row in a new tiny `feature_flags` table, or simpler: a column on the active `contract_templates` row called `signing_enabled BOOLEAN DEFAULT FALSE`. Recommend the latter — keeps it tied to the template.
11. New page `src/pages/ContractPage.tsx` at route `/project/:id/contract` with 4 tabs:
    - **Plain English** — renders `contract_templates.plain_english_summary`
    - **This Project** — renders Layer-2 snapshot data
    - **Special Conditions** — own-side editable textarea, save calls `update_bespoke_terms`
    - **Full Legal Terms** — renders `contracts.rendered_legal_text`
12. On page load: call `verify_contract_integrity` RPC; if mismatch, render a red "tamper detected" banner, hide signing UI.
13. Signing card (per party): 3 required checkboxes + Sign button.
    - Button disabled while `signing_enabled=false`, tooltip: "Contract template under final legal review — signing will activate when approved."
    - On click: client computes its part of the hash; calls `sign_contract` RPC with the 3 checkbox attestations and IP captured server-side.
14. Update "Accept quote" CTA in `ContractPanel.tsx` (or its successor) to call `generate_contract_for_quote(quote_id)` and redirect to `/project/:id/contract`.
15. Migrate `ContractPanel.tsx` away from the legacy `contracts_legacy` shape — it should either be deleted (replaced by the new page) or reduced to a "View contract" button that links to the new route.

### Phase 3 — PDF export

16. New edge function `contract-pdf-snapshot` (uses `@react-pdf/renderer` or HTML→PDF via Puppeteer-lite alternative; recommend `@react-pdf/renderer` for Deno compatibility). Renders all 4 tabs into one PDF.
17. New private storage bucket `contracts` with RLS: parties to a contract can SELECT objects under `contracts/{contract_id}/`.
18. DB trigger on `contract_events` insert: when `event_type IN ('generated','activated','variation_approved','completion_accepted','closed')`, `pg_net` calls the new edge function with `contract_id` + `event_type`. Function uploads to `contracts/{contract_id}/{event_type}_{timestamp}.pdf`.

### Phase 4 — Variation flow polish & verification

19. Confirm variations UI exists and is wired to `propose_variation` / `sign_variation` (it's already in `VariationsPanel.tsx`). Verify event emission on approve.
20. Run all four verification scripts from the spec (E2E, tamper, RLS, feature flag) and capture screenshots/logs.

---

## Files that will change

**New:**
- `supabase/migrations/<ts>_contracts_phase1_hash_and_lifecycle.sql`
- `supabase/migrations/<ts>_contracts_phase2_signing_enabled_flag.sql`
- `supabase/migrations/<ts>_contracts_phase3_pdf_storage_and_trigger.sql`
- `src/pages/ContractPage.tsx`
- `src/components/contract/PlainEnglishTab.tsx`
- `src/components/contract/ProjectTab.tsx`
- `src/components/contract/SpecialConditionsTab.tsx`
- `src/components/contract/FullLegalTermsTab.tsx`
- `src/components/contract/SigningCard.tsx`
- `src/components/contract/TamperBanner.tsx`
- `supabase/functions/contract-pdf-snapshot/index.ts`

**Edited:**
- `src/App.tsx` — add `/project/:id/contract` route
- `src/components/project/ContractPanel.tsx` — replace inline contract UI with link to new page; rewire "Accept quote" to `generate_contract_for_quote`
- `src/pages/ProjectDetail.tsx` — link to new contract route
- `supabase/config.toml` — register `contract-pdf-snapshot` (verify_jwt = false; called by DB trigger with shared secret like the dispatcher)

**Untouched (verified working):**
- All 7 transactional email templates
- `contract-email-dispatcher`
- `contract_events` table & RLS
- `contract_variations` table, RLS, and `propose_variation` / `sign_variation` functions
- `dispatch_contract_event_email` trigger

---

## Risks called out

1. **Legacy `contracts_legacy` table still has data and a SELECT-for-admins policy.** Anything pointing at it must be migrated or deleted. `ContractPanel.tsx` references the legacy shape — confirm before deleting.
2. **Tightening UPDATE RLS could break any code that currently writes to `contracts` directly.** I'll grep for direct writes before applying that policy change.
3. **The placeholder template is currently `status='active'`.** The feature flag (`signing_enabled=false`) is what protects users — not template status. Need to be explicit about this in the migration.
4. **PDF generation in Deno edge functions is non-trivial.** `@react-pdf/renderer` works but adds bundle size; alternatives include calling a hosted HTML→PDF service. Will confirm approach before Phase 3.

---

## Awaiting your approval to proceed with Phase 1.
