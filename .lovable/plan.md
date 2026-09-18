# Integrate the Batch Letter Printer into the Planning Pipeline

Port the letter and envelope print engine from your standalone Batch Printer into the existing Planning Pipeline. No redesign of the pipeline, no new letter layout — the supplied HTML is the source of truth for the printed page.

## What already exists (reused, not rebuilt)

- "Add to letter batch" on each planning lead, already saving to the lead record: batch status, date added, chosen template, letter-sent date.
- A Batch tab listing queued leads with template selector, remove, mark-sent, CSV export.
- Duplicate protection warning when a letter has already gone out.

What is missing is the professional printed layout, envelopes, preview, print ordering, and editable templates stored in the database.

## 1. Letter rendering engine (shared by preview and print)

New module holding the exact layout from your HTML:

- A4 210x297mm, padding 18/22/16/22mm, Calibri/Arial 10.5pt, line-height 1.32.
- Table header: ProGrafter logo left (48mm wide, real logo asset), sender block right-aligned.
- Recipient block (name bold, one line per address line), then auto date, then body, then sign-off, then smaller italic P.S.
- Same paragraph spacing (8pt), sign-off spacing, 8.5pt footer lines via the `[FOOTER]` marker.
- Placeholders `{{name}} {{address}} {{ref}} {{type}} {{date}}`, `**bold**`, `*italic*`, and the same paragraph-splitting rules.
- Date generated at print time in UK long form ("18th September 2026").

One component renders both the on-screen preview overlay and the print sheet — there is no second layout.

## 2. Add to Batch — no re-typing

Clicking Add to Batch captures automatically from the lead: id, applicant name, postal address lines, postcode, application type (from the lead's type/description), application reference, template (defaults to A), and date added. Nothing is typed.

- Missing name, address lines or postcode marks the batch row INCOMPLETE; it is not printed.
- Already-in-batch leads show "In Batch ✓" and cannot be added twice.
- Already-posted leads still show the existing duplicate-contact warning.

## 3. Batch page

Header counts: total / ready / incomplete. Each row: recipient and address, application type, template, reference, status, remove. Type and reference arrive pre-filled and stay editable only as an emergency correction.

Actions: "Preview first letter", "① Print all envelopes", "② Print all letters", plus the existing mark-as-sent and CSV export.

## 4. Envelopes

C5 landscape 229x162mm default, address at 70mm top / 95mm left, 13pt. Editable size (C5 landscape/portrait, A5 landscape/portrait, DL landscape), top, left, font size. One ready recipient per envelope.

## 5. Print ordering

Envelopes and letters are generated from the same ordered list of READY rows, so envelope 1 = letter 1 throughout. Each letter forces its own A4 page.

## 6. Status and persistence

- Statuses progress Reviewed → In Batch → Printed → Sent/Posted using the pipeline's existing letter fields; printing stamps "printed", it does not mark the lead as sent.
- Templates A/B/C, sender block, sign-off and P.S. are stored in the database (a small admin-only settings table), not browser storage, so the batch and templates survive a refresh and are shared across devices.
- Lead detail shows clearly when a letter has already been sent.

## 7. Template A, sign-off and P.S.

Template A body replaced with your supplied text exactly. Sign-off kept as Kind regards / Lee Palfreeman / Founder · ProGrafter Ltd / Company 17124130 · ICO ZC114018. The trade-offer P.S. is removed and replaced with the cheapest-quote P.S. Templates change text only, never layout.

## 8. Acceptance testing

Run the 18-point workflow against three real planning leads in the running app: add to batch, verify auto-populated data, preview, check logo/date/type/reference, print-preview envelopes and letters, confirm matching order and one page per letter, refresh the browser to confirm persistence, and confirm no duplicates and no change to the underlying lead data.

## Technical notes

- New `src/lib/planningLetterEngine.ts` (placeholder fill, markdown-inline, block/body rendering, envelope geometry) and `src/components/admin/planning/LetterSheet.tsx` (letterPage markup + scoped print CSS, dynamic `@page` rule for envelope vs A4).
- New table `planning_letter_settings` (single row: templates JSON, sender, sign-off, ps, envelope settings) with RLS + GRANTs restricted to admins.
- `letter_batch_status` gains a `printed` value; existing `queued`/`sent` behaviour unchanged.
- Existing `src/lib/planningLetterTemplates.ts` stays as the seed/default text source; the old plain `PrintSheet` and its `pp-*` print CSS are removed in favour of the ported engine.
