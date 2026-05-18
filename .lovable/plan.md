# Replace homepage mockups with real platform screenshots

The homepage currently uses hand-coded HTML mockups in `PlatformPreview.tsx` (and supporting copy in `SeeHowItWorks.tsx`). You asked for actual screenshots of the live platform. Plan below covers seeding two demo accounts so the screenshots show realistic data, capturing each dashboard view, and wiring the images into the homepage.

## 1. Seed demo data (migration + edge function)

Create one migration that:
- Inserts a `demo_trade@prografter.co.uk` and `demo_homeowner@prografter.co.uk` auth user via SQL (using `auth.admin_create_user` through an edge function — auth users can't be inserted via migration).
- Marks the trade as `verified`, with company "Northgate Plumbing & Heating", SE15, plumbing specialism, sample insurance + qualification doc rows.
- Seeds 3 open jobs visible to the trade (kitchen reno, bathroom retile, loft) and 3 quotes from the trade.
- Seeds 1 active project for the homeowner (Kitchen Renovation, stage 3/5) with 3 quotes received and a completed Project Manual record with materials/certs/photos rows.
- Seeds earnings rows so the Earnings page shows YTD £42k with 3 stage payments.

Because auth.users requires service role, the actual user creation runs in a one-shot edge function `seed-demo-accounts` that uses the service role key and is idempotent (skips if users already exist). Data inserts attach to those user IDs.

## 2. Capture screenshots

Using the browser tool, log into each demo account in the preview and capture six PNGs at 1440x900:

| File | Route | Account |
|---|---|---|
| `trade-dashboard.png` | `/dashboard/trade` | demo trade |
| `trade-jobs.png` | `/dashboard/trade` (Jobs tab) | demo trade |
| `trade-earnings.png` | `/dashboard/trade` (Earnings tab) | demo trade |
| `homeowner-overview.png` | `/dashboard/homeowner` | demo homeowner |
| `homeowner-quotes.png` | `/project/:id/compare` | demo homeowner |
| `homeowner-manual.png` | `/manual/:id` | demo homeowner |

Save into `src/assets/platform/`.

## 3. Rewire the homepage

- `PlatformPreview.tsx`: replace each `BrowserFrame` body with an `<img>` of the corresponding screenshot, keep the macOS title bar + caption + tab structure.
- `SeeHowItWorks.tsx`: check whether it also uses mockups; if so, swap to the same screenshot set (no new captures).
- Delete now-unused mockup subcomponents (`TradeDashboardMockup`, `StatTile`, etc.) to keep the file lean.

## Technical notes

- The seed function must be re-runnable safely. Use `ON CONFLICT DO NOTHING` for data rows and an `if user exists` short-circuit for auth creation.
- Demo accounts get `is_demo = true` flag (new column on `profiles` / `trades`) so we can exclude them from admin lists later.
- Screenshots use `loading="lazy"` and explicit `width`/`height` to avoid CLS.
- No changes to backend RLS — demo accounts behave like normal users.
- Estimated 1 migration, 1 new edge function, 6 image assets, edits to 2 components.

## Out of scope

- No changes to other homepage sections (Hero, Features, etc.) — only the platform screenshot panels.
- No changes to copy/captions unless required to match what the screenshot actually shows.