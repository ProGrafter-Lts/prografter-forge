# QuickBuild MVP v0.5 — Implementation Plan

Following the established pattern (Quote PDF), this ships **fully built but hidden behind a `quickBuild` feature flag** so nothing is user-visible until you flip it on.

## Scope

A 3-stage flow (Input → Review → Accept) at `/quote-builder/quickbuild` that turns voice + photos + structured fields into an editable AI-drafted Schedule of Works, ready to hand off to the existing quote builder.

## AI provider

Spec says "Anthropic API". This project already standardises on **Lovable AI Gateway** (no API key needed, already wired). I'll use `google/gemini-2.5-pro` (strong reasoning + multimodal for photos) via the gateway with the exact UK-construction-estimator system prompt from the spec. If you specifically want Anthropic Claude, that needs a separate `ANTHROPIC_API_KEY` secret — flag this and I'll switch.

## Database (1 migration)

- `quickbuild_generations` — one row per AI call. Columns: `id`, `trade_user_id`, `quote_id` (nullable, set when accepted), `transcript`, `photo_paths` (text[]), `structured_input` (jsonb: trade_type, property_type, age_band, postcode, hourly_rate, day_rate), `ai_output` (jsonb: full response), `final_output` (jsonb, nullable, set on accept), `was_sent` (bool), `won_lost` (text, nullable), `actual_labour_days` (int, nullable), `actual_materials_pence` (int, nullable), `created_at`. RLS: trade can read/write own rows; admins read all.
- `quickbuild-photos` storage bucket (private, RLS: trade can upload/read own folder).
- Rate limit enforced via SQL: count rows in last 24h per `trade_user_id`, cap 5.

## Edge function: `quickbuild-generate`

- Auth required (verify JWT in code).
- Validates input with zod.
- Checks 24h rate limit (returns 429 with remaining count if exceeded).
- Calls Lovable AI Gateway with system prompt + transcript + photo URLs (signed) + structured fields, requesting JSON via tool-calling for guaranteed schema (`line_items`, `methodology`, `timeline_days`, `risk_flags`, `variation_buffer_recommended_pence`, `confidence_score`, `notes_to_trade`).
- Inserts row into `quickbuild_generations`, returns generation id + parsed output + remaining quota.
- Graceful degradation: 402/429/invalid-JSON → typed error codes the UI can branch on.

## Frontend

New route `/quote-builder/quickbuild` (gated by `isFeatureEnabled("quickBuild")`; redirects to `/dashboard/trade` when off). Components:

- `QuickBuildPage.tsx` — stage state machine (input → review → accept).
- `QuickBuildVoiceRecorder.tsx` — Web Speech API live transcription, 60s cap, re-record, manual text fallback.
- `QuickBuildPhotoUploader.tsx` — 1–8 photos, client-side compression to ≤2MB, optional captions, uploads to `quickbuild-photos` bucket.
- `QuickBuildStructuredForm.tsx` — trade/property/age/postcode/rates, prefilled from trade profile.
- `QuickBuildReview.tsx` — editable line items (reuse styling from existing quote builder), methodology textarea, timeline, risk flag chips, variation buffer slider. Yellow `AI-draft` accent on untouched fields, switches to neutral once edited (tracks per-field `aiOriginated` bool).
- `QuickBuildBetaBadge.tsx` — "Beta" pill + tooltip copy from spec.
- "Use this quote" → writes `final_output` to row + redirects to existing quote builder with state pre-populated (URL state or sessionStorage hand-off).

Entry point: hidden "Generate with QuickBuild" button at top of existing quote-builder, behind same flag.

## Logging for Phase 2

Every generation logs transcript, photo refs, raw AI JSON, final edited JSON, sent status. Hooks for `won_lost` + actuals are added on the row but populated by existing quote/contract/completion flows in a follow-up (out of scope here — schema is ready).

## Feature flag

`featureFlags.ts` gets `quickBuild: false`. Route, entry button, and any cross-links all gated. Flip to `true` when ready.

## Out of scope (explicitly)

- Wiring `won_lost` + actuals from contract/completion (schema ready, wiring deferred).
- Anthropic-specific provider (using Lovable AI unless you say otherwise).
- Phase 2 platform-benchmarked retraining.

Approve and I'll build it end-to-end behind the flag.