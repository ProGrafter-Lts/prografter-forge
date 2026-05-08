
# Professional Quote PDF — Schedule of Works

This is a sizeable feature. To keep each step shippable and reviewable I'll deliver it in **four phases**. You can stop after any phase and the app stays functional.

---

## Phase 1 — Data foundations

Add the missing fields to the quote model and a place to store generated PDFs.

**Database (single migration)**
- `quotes` — add `methodology` (text, max 600), `valid_until` (date, default `now() + 30 days`), `materials_spec` (jsonb — array of `{description, brand_model, sourced_by: 'trade'|'client'}`), `pdf_path` (text), `pdf_generated_at` (timestamptz), `view_count` (int, default 0), `last_viewed_at` (timestamptz), `accept_token` (uuid, default `gen_random_uuid()`, unique).
- `trades` — add `business_logo_path`, `vat_registered` (bool), `vat_number`, `professional_indemnity_*` (insurer, policy, cover_pence, expiry).
- New table `quote_pdf_events` — `quote_id`, `event_type` (`generated` | `downloaded` | `viewed` | `accept_clicked`), `actor_user_id` (nullable for anon homeowners), `ip`, `user_agent`, `created_at`. RLS: trade who owns the quote can read; insert via security-definer RPC only.
- New storage bucket `quote-pdfs` (private) with RLS: trade owner + matched homeowner + valid `accept_token` (via signed URL) can read.
- RPC `record_quote_pdf_event(_quote_id, _event_type)` — security definer, validates caller is party or token-holder.

## Phase 2 — PDF renderer edge function

Server-side `@react-pdf/renderer` keeps fonts/layout consistent across browsers and avoids client bundle bloat.

**Edge function** `generate-quote-pdf`
- Input: `{ quote_id }`. Auth required; verifies caller owns the quote (trade) or holds a valid `accept_token`.
- Pulls quote + trade + homeowner + line items + materials + milestones in one query.
- Renders 7 pages (Cover, Schedule, Methodology & Timeline, Materials, Credentials, Terms & Payment, Acceptance) using `@react-pdf/renderer` with registered fonts: Bebas Neue (headings), DM Sans (body), DM Mono (numbers).
- Brand: Navy `#1B3A5C`, Teal `#0D9488`. Page numbers, "Generated on prografter.co.uk" footer.
- Uploads to `quote-pdfs/{quote_id}/ProGrafter_Quote_{ref}_{slug(business)}.pdf`, updates `quotes.pdf_path` + `pdf_generated_at`, logs `generated` event.
- Returns signed URL (1h) for trade preview, plus a long-lived public-view URL gated by `accept_token`.

**Public view route** `/quote/:quoteId?token=…`
- Edge function `view-quote-pdf` validates token, logs `viewed`, streams the PDF (or 302 to signed URL).

## Phase 3 — Quote builder UI

Additions to the existing quote-builder page (no rewrite):
- New collapsible **"Methodology"** section (textarea, 600-char counter).
- New **"Materials & Specifications"** repeater (description / brand-model / sourced-by toggle).
- Logo upload to `trade-logos` bucket on the trade settings page (one-off; not per quote).
- Two new actions next to existing **Send Quote**: **Generate PDF** (preview) and **Send as PDF** (sends email with PDF attached + accept link).
- "Pending verification — see ProGrafter profile" placeholders render automatically on Page 5 if insurance fields are blank.

## Phase 4 — Email, analytics, polish

- Wire `quote-sent` transactional email to attach the PDF and include the accept link.
- Trade dashboard: small stat on each quote card — *"Viewed N times · last viewed {relative}"*, plus an "Accepted" badge when `accept_clicked` fires.
- QA checklist: render a real test quote; verify in Chrome PDF viewer, Adobe Reader, iOS Safari; confirm file < 2 MB and text is selectable; print preview at A4.

---

## Technical notes

- `@react-pdf/renderer` works in Deno edge functions via `npm:` import; fonts loaded from a public `quote-pdf-assets` bucket (one-time upload of Bebas Neue / DM Sans / DM Mono).
- All pricing rendered from pence integers to avoid float drift.
- Acceptance signatures stay on-platform — the PDF's "Accept" link routes to the existing contract-signing flow; the PDF itself is not a contract.
- Re-generation on quote edit: bump a `version` int and regenerate; old PDFs remain in storage for audit.

---

## What I need from you before starting

1. **Confirm phasing** — start with Phase 1 (DB migration) now, or change the order?
2. **Insurance fields** — you already have `insurance_reference` on `trades`. Do you want me to expand it into structured fields (insurer / policy / cover / expiry) as part of Phase 1, or keep the single field and just print whatever's there?
3. **Logo upload** — OK to add a `trade-logos` public bucket and a small uploader on the Trade Settings page?
4. **Email attachment size** — happy with attaching the PDF directly (most quotes will be < 500 KB), or prefer a "Download your quote" link only?

Reply with answers (or just "go ahead with all defaults") and I'll start Phase 1.
