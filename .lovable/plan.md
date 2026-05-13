# Planning Pipeline — admin page wired to Supabase

A new admin-only page for managing planning application leads and the agent network behind them. The pasted component had some mangled JSX from the copy/paste — I'll reconstruct those bits as part of the build.

## What gets built

### 1. Two new database tables (admin-only)

**`planning_leads`** — one row per planning application
- application_ref, council_name, site_address, postcode
- application_type, status (submitted / pending_decision / approved)
- description, submitted_date
- applicant_name, applicant_address
- agent_id (FK → planning_agents)
- trades_likely (text[]), estimated_value_min/max
- priority_score, pipeline_status
- documents_available, form1app_extracted
- notes, next_action

**`planning_agents`** — one row per architect / planning consultant
- contact_name, company_name, email, phone, address
- relationship_status (identified/contacted/interested/partner/not_interested)
- intro_sent, meeting_held
- councils_active (text[])
- avg_job_value_estimate, notes

Both tables: **RLS = admin-only** (uses existing `has_role(auth.uid(), 'admin')`). Standard `created_at` / `updated_at` plus an updated-at trigger.

### 2. New page

`src/pages/PlanningPipeline.tsx` at route `/admin/planning-pipeline`, wrapped in `<AdminRoute>`. Three tabs (Leads / Agents / Kanban board) — same layout you pasted, but:
- Mock arrays replaced with live Supabase queries
- "Save changes" on a lead writes pipeline_status / notes / next_action
- Agent status buttons write `relationship_status`
- "Run scraper" button is left as a stub (no scraper backend yet) — flagged so we know to add it later
- Broken JSX in `SBadge`, `PriorityBar`, and `LeadCard` reconstructed properly
- Replaced inline `style={{}}` / hard-coded colour map with the project's design tokens where it touches semantic colours, but keeping the dark navy admin look intentionally distinct from the marketing site

### 3. Seed data

Insert the 5 sample leads and 3 agents you pasted as starter content so the page isn't empty on first open.

## What is *not* in scope

- No scraper / ingestion pipeline (the "Run scraper" button does nothing yet — separate job)
- No Form 1App extraction (button stays as a placeholder)
- No email / call integrations beyond `mailto:` and `tel:` links

## Order of operations

1. Run the migration (tables + RLS + trigger)
2. Insert seed data
3. Add the page + route + admin guard
4. Confirm the page loads at `/admin/planning-pipeline` while logged in as admin
