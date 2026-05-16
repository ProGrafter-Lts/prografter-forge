# Supplier Interest Capture — Phase A

A lightweight system for Lee to capture supplier interest (scaffolders, plant/skip hire, specialist services) ahead of the Phase B merchant aggregation build. Public form on the marketing site, admin queue mirroring the existing trade verifications UI. No supplier login, no public directory, no verification flow yet.

---

## 1. Database

New table `supplier_interest` with RLS:

| Field | Type | Notes |
|---|---|---|
| id | uuid | pk |
| business_name | text | required |
| contact_name | text | required |
| email | text | required |
| phone | text | required |
| category | text | enum: `scaffolding`, `plant_skip_hire`, `specialist_service` |
| specialist_type | text | nullable — only when category = `specialist_service` (e.g. `asbestos`, `roofing_access`, `crane_hire`) |
| postcode | text | required |
| service_area | text | free text — areas/radius they cover |
| years_trading | int | required |
| has_public_liability | boolean | required |
| public_liability_amount | text | nullable — e.g. "£5m" |
| website | text | nullable |
| notes | text | nullable — anything else they want Lee to know |
| status | text | enum: `new`, `contacted`, `qualified`, `phase_b_ready`, `declined`, `duplicate` — default `new` |
| admin_notes | text | nullable — internal notes (set via admin queue) |
| contacted_at | timestamptz | nullable |
| qualified_at | timestamptz | nullable |
| created_at, updated_at | timestamptz | |

**RLS:**
- Anonymous + authenticated can INSERT (validated lengths, email format, category enum)
- Only admins (via `has_role(auth.uid(), 'admin')`) can SELECT / UPDATE
- No DELETE for anyone

---

## 2. Public page — `/suppliers`

New route. Marketing intro + form. Brand styling matches existing public pages (navy `#1B3A5C`, teal `#0D9488`, Bebas Neue headers, DM Sans body, DM Mono metadata).

**Sections:**
- Hero: "Supply the trades on ProGrafter" — short pitch (Phase B aggregation, why we want them now)
- Form fields: business_name, contact_name, email, phone, category (radio), specialist_type (only shown when category = specialist_service), postcode, service_area, years_trading, has_public_liability (toggle), public_liability_amount (conditional), website, notes
- Submit → insert to `supplier_interest`
- Success state: honest message — "Thanks. Lee will be in touch personally as Phase B opens. We're keeping this list small and focused."
- Footer + Navbar reused

Form uses existing shadcn Input/Select/Textarea/Button, react-hook-form + zod for validation, clear inline errors.

Mobile-first: stacked single-column, tap targets ≥44px, tested at 375px width.

---

## 3. Admin queue — `/admin/suppliers`

Mirrors `/admin/verifications` layout/styling 1:1.

**Top bar:**
- Bebas Neue header "Supplier Interest"
- Stat row: total · new · contacted · qualified · phase_b_ready · declined
- Search box (business_name or postcode, case-insensitive)
- Category filter chips: All · Scaffolding · Plant/Skip Hire · Specialist Service

**Status tabs:** New · Contacted · Qualified · Phase B Ready · Declined · Duplicate

**Card per supplier (one column on mobile, grid on desktop):**
- business_name (large, Bebas Neue)
- contact_name + category badge + specialist_type pill
- postcode · service_area · years_trading
- Insurance badge (green "PL £5m" / amber "no PL")
- Email + phone (click to copy / tel:/mailto:)
- Action buttons: Mark contacted · Mark qualified · Mark Phase B ready · Mark declined · Mark duplicate · Add notes (opens dialog → updates `admin_notes`)

Action buttons update `status` + corresponding timestamp and refresh the list.

Wrapped in `AdminRoute` (existing). No new auth.

---

## 4. Admin metrics

Add a stat card to `AdminVerifications` page top section: "Supplier registrations: N (new: N · contacted: N · qualified: N)". Single aggregate query.

---

## 5. Navigation

- **Footer (`src/components/Footer.tsx`):** add small "For suppliers →" link in the link row, after Contact
- **Admin sidebar:** add "Suppliers" entry under Verifications (find existing admin nav and add the link)
- Do **not** add `/suppliers` to the public Navbar

---

## 6. Out of scope (explicitly NOT building)

- Supplier login / supplier dashboard
- RFQ flow trades→suppliers
- Public supplier directory
- Supplier verification flow (Phase B)
- Email automation (Lee contacts manually)
- Marketplace matching

---

## 7. Verification before shipping

- Test scaffolding registration → appears in admin queue under "New"
- Test specialist_service + specialist_type=asbestos → conditional field saved
- Non-admin authenticated user gets RLS denial on SELECT
- Mobile test at 375px
- Form validation errors render clearly
- Success message matches honest copy
- No supplier data leaks to homeowner/trade-facing pages

---

## Files to create / edit

**New:**
- `supabase/migrations/<ts>_supplier_interest.sql` (via migration tool)
- `src/pages/Suppliers.tsx` (public form)
- `src/pages/AdminSuppliers.tsx` (admin queue)

**Edited:**
- `src/App.tsx` — register `/suppliers` and `/admin/suppliers` routes
- `src/components/Footer.tsx` — add "For suppliers →"
- Admin sidebar component (locate during implementation) — add Suppliers link
- `src/pages/AdminVerifications.tsx` — add supplier registrations stat card
