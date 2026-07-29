# ProGrafter

A premium UK construction-trust platform that helps homeowners plan, budget, and hire verified tradespeople with confidence — while giving trade professionals a modern business OS for finding work, checking quotes, and running site surveys.

**Live URLs**

- Production: https://www.prografter.co.uk
- Lovable preview: https://id-preview--647914bf-2c04-498c-b2cb-c5a833f28f93.lovable.app

---

## What is ProGrafter?

ProGrafter is not a trades directory. It is a homeowner-and-trade platform built around trust, transparency, and construction intelligence:

- **Homeowners** can assess project readiness, get educational budget guidance, upload quotes for structured checking, and raise disputes if things go wrong.
- **Trades** get a business dashboard (Morning Briefing, Pipeline, Find Work, Business Health), a Trade Vault for compliance, and tools for project planning and site surveys.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript 5, Vite 5, React Router 6 |
| Styling | Tailwind CSS 3, shadcn/ui, Radix UI primitives |
| State / Data | TanStack Query (React Query), React Hook Form, Zod |
| Backend | Lovable Cloud (auth, database, storage, edge functions) |
| Payments | Stripe (checkout + webhooks) |
| Testing | Vitest (unit), Playwright (e2e/browser) |
| PWA | Vite PWA plugin, custom manifest, offline page |

---

## Key Modules

### Homeowner journey

- **Project Clarity** (`/project-clarity`) — 5-step readiness assessment that tells a homeowner where they are in their construction journey and what to do next.
- **Project Builder** (`/project-builder`) — 10-step data foundation for project type, property, dimensions, spec, finishes, services, external works and constraints.
- **Quote Checker** (`/quote-checker`) — modular quote-checking hub for trade-specific fixed-standard checks (Boiler, Electrical, Bathroom, Roofing, Kitchen, Windows & Doors, Landscaping, Plastering).
- **Simple Quote Checker** (`/simple-quote-checker`) — lightweight 13-question quote health check for early-stage budgeting conversations.
- **Project Cost Guide** (`/quote-checker-ai`) — educational construction intelligence report with package-level budget ranges and confidence indicators.
- **Homeowner Dashboard** (`/homeowner-dashboard`) — central place for quote checks, projects, and next steps.

### Trade / business journey

- **Trade Hub / Dashboard** (`/hub`) — V2 builder-first experience: Morning Briefing, Follow-ups, Pipeline, Find Work, and Business Health.
- **Business Health Dashboard** (`/business-health`) — 100-point business health score with AI briefing and actionable recommendations.
- **Atlas** (`/atlas`) — mobile-ready guided site-survey tool with observation capture, voice transcription, evidence uploads, and summary reports.
- **Trade Vault** (`/trade-vault`) — compliance and verification documents for trade accounts.
- **Admin area** (`/admin/*`) — review applications, quote standards, disputes, analytics, and email status.

### Platform

- **Auth** — email, Google OAuth, role-based access via `user_roles`.
- **Edge functions** — `supabase/functions/` for quote analysis, PDF generation, email dispatch, webhooks, planning-lead ingestion, and MCP server.
- **Email** — transactional and auth email templates via Lovable Cloud / custom domain.
- **Storage** — private buckets for quote documents, project evidence, and Atlas photos.

---

## Project Structure

```text
public/                  # PWA manifest, favicons, offline page, sitemap
src/
  App.tsx                # Router and top-level route definitions
  main.tsx               # Entry point
  index.css              # Tailwind entry + global tokens
  pages/                 # Route-level pages
  components/            # Shared UI components
  atlas/                 # Atlas site-survey module
  hub/                   # Trade Hub module
  lib/                   # Business logic, helpers, feature flags
  hooks/                 # Shared React hooks
  integrations/supabase/ # Supabase client + generated types
supabase/
  functions/             # Edge functions
  migrations/            # Database migrations
  config.toml            # Supabase local config
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A package manager: `npm`, `yarn`, `pnpm`, or `bun` (this project uses `bun` in Lovable)
- Lovable Cloud enabled for backend features

### Install dependencies

```bash
bun install
```

### Run the dev server

```bash
bun dev
```

The app is served at `http://localhost:8080` by default.

### Build for production

```bash
bun build
```

### Run tests

```bash
# Unit tests
bun test

# Browser / e2e tests
bunx playwright test
```

---

## Environment Variables

The frontend reads the following variables from `.env`:

```text
VITE_SUPABASE_URL=<your Lovable Cloud project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/public key>
VITE_SUPABASE_PROJECT_ID=<project id>
```

These are managed automatically by Lovable Cloud. Do not commit real secret keys or the service-role key to this repository.

Stripe and connector secrets live in Lovable Cloud Secrets / Edge Function environment variables and are never exposed to the browser.

---

## Backend / Edge Functions

The project relies on Lovable Cloud edge functions for heavy or secure work:

- Quote analysis and report generation
- Stripe checkout and webhook handling
- PDF generation and email dispatch
- Planning-lead ingestion and alerts
- Atlas voice transcription
- MCP server endpoint

To deploy edge functions from a local clone:

```bash
supabase functions deploy
```

(See Lovable Cloud docs for the exact CLI workflow.)

---

## Important Notes

- **No backend server is included in this repo.** The app is a client-side SPA that uses Lovable Cloud for auth, database, storage, and functions.
- **Row Level Security (RLS)** is enforced on all user-facing tables. New tables must include `GRANT` statements and policies in the same migration.
- **Roles are stored in a separate `user_roles` table.** Never store roles on the `profiles`/`users` table or check admin status via client-side storage.
- The project is synced to GitHub via Lovable’s built-in GitHub integration (two-way sync).

---

## License / Copyright

© ProGrafter. All rights reserved. This repository is private and intended for ProGrafter development.