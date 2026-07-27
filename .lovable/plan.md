# Project Clarity — Homeowner Onboarding Journey

A guided, multi-step discovery flow that captures a homeowner's project details, uploads, description, budget and current stage, then analyses readiness and shows a results dashboard. All data is stored in a new "Project Intelligence Record" so the flow is fully resumable and editable, and the components are reusable across the wider ProGrafter OS.

## Route & entry points

- New route: `/project-clarity` (main flow) and `/project-clarity/:recordId` (resume/edit)
- Homepage: link the existing "I'm planning a project" card to `/project-clarity` (currently points to `/project-cost-guide`, which stays available)

## Data model (Lovable Cloud)

New table `project_intelligence_records`:

- `id uuid pk`, `user_id uuid` (nullable — supports pre-auth guest capture with localStorage handoff)
- `status text` — `draft` | `analysing` | `complete`
- `current_step smallint` (0–9)
- `project_type text`, `address jsonb`, `property_type text`, `property_age text`
- `current_stage text`, `description text`, `budget_band text`
- `documents jsonb` (array of `{path, name, size, kind}`)
- `analysis jsonb` — readiness score, budget guidance, status assessment, next action
- `created_at`, `updated_at`

RLS: owner-only read/write when `user_id` matches; anon can insert + read/update rows they created via localStorage-stored record id (guarded by a per-row `edit_token`). Grants added per project convention.

Storage: reuse existing `job-brief-files` bucket for uploads under `project-clarity/<recordId>/…`, or add a new `project-clarity` private bucket if the bucket doesn't fit — decided at implementation time based on current bucket policies.

## Screens

Single-page shell (`ProjectClarity.tsx`) with an animated step router and sticky progress bar (segmented, 9 steps). Each step is its own component under `src/project-clarity/steps/` so they can be embedded elsewhere later.

1. **Welcome** — Editorial hero, single CTA "Start Project Clarity".
2. **Project Type** — Grid of large tactile cards (11 options listed in the brief).
3. **Property Information** — Address (with simple UK postcode helper), property type select, approx age select.
4. **Current Stage** — 7 selectable pill cards.
5. **Document Upload** — Drag-and-drop zone with categorised buckets (Drawings, Structural, Quotes, Images), per-file progress, remove/replace.
6. **Project Description** — Rich textarea + voice-input button that uses the existing Lovable AI transcription pattern (calls a small edge function `transcribe-clarity-voice` wrapping the gateway STT endpoint).
7. **Budget Expectations** — Segmented slider with 5 bands.
8. **Review** — Grouped summary cards, each with an Edit button that jumps back to that step without losing data.
9. **Analysis** — Animated multi-line status ticker ("Reading uploads…", "Assessing readiness…", "Benchmarking budget…") while a new edge function `analyse-project-clarity` returns the results.
10. **Results Dashboard** — Four hero cards (Readiness Score ring, Budget Guidance, Project Status, Recommended Next Action) + CTA row: View Detailed Report, Run AI Quote Checker, Find Trades, Save Project.

## Analysis logic (`analyse-project-clarity`)

Deterministic scoring first (project type + stage + docs presence + description length + budget band) that produces a 0–100 readiness score, a budget-vs-typical-range verdict, a stage summary and a single recommended next action. Optional Lovable AI polish pass generates the human-readable copy for each of the four dashboard cards. Result written back to `project_intelligence_records.analysis`.

## UX & design

- Palette: existing navy / teal / cream tokens only, no hardcoded colours.
- Typography: existing `font-heading` and `font-mono` system.
- Motion: framer-motion-free — use existing Tailwind `animate-fade-in`, `animate-scale-in`, and a small custom transition wrapper for step changes.
- One primary CTA per step, generous whitespace, mobile-first with `md:` refinements.
- Progress bar visible on every step from 2 onward; back button on every step (never destructive).

## Reusability

- `useProjectIntelligenceRecord(recordId?)` hook — load/create/update/patch, plus autosave-on-change (debounced).
- Step components accept `{ record, onPatch, onNext, onBack }` props so they can be reused inside the trade dashboard's brief-builder later.
- `ReadinessScoreCard`, `BudgetGuidanceCard`, `ProjectStatusCard`, `NextActionCard` exported from `src/project-clarity/components/` for reuse elsewhere in the OS.

## Files to create / change

Created:
- `supabase/migrations/<ts>_project_intelligence_records.sql`
- `supabase/functions/analyse-project-clarity/index.ts`
- `supabase/functions/transcribe-clarity-voice/index.ts`
- `src/pages/ProjectClarity.tsx`
- `src/project-clarity/hooks/useProjectIntelligenceRecord.ts`
- `src/project-clarity/components/*` (progress bar, step shell, upload zone, voice input, result cards)
- `src/project-clarity/steps/*` (10 step components)

Changed:
- `src/App.tsx` — register `/project-clarity` and `/project-clarity/:recordId` routes
- `src/components/WhereAreYouSection.tsx` — repoint "I'm planning a project" CTA to `/project-clarity`

## Out of scope for this pass

- Deep integration into the trade-facing Job Brief flow (kept for a follow-up so we don't destabilise existing brief tables).
- Payments / paid analysis tiers.

Once the plan is approved I'll implement everything above in one pass, run typecheck, and verify the flow renders end-to-end in the preview.
