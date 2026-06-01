# GA4 Tracking + In-App Analytics Dashboard

GA4 is already embedded in `index.html` (measurement ID `G-G8KF4CMYVT`), but because this is a single-page React app it currently only records the very first page load. Navigating between routes and key actions (job posts, signups, quote checker, etc.) are not tracked. This plan fixes tracking and adds a private dashboard inside the app to review traffic and conversions.

## Part 1 — Fix SPA page-view tracking

- Add a small analytics helper `src/lib/analytics.ts` that safely calls `window.gtag(...)` (typed, no-ops if gtag/consent is absent so it respects the existing Termly cookie banner).
- Add a `usePageTracking` hook (or inline effect) inside `<BrowserRouter>` in `App.tsx` that fires a `page_view` event on every route change using `useLocation()`.

## Part 2 — Conversion event tracking (all key actions)

Fire named GA4 events (and mark them as conversions in the GA4 UI) at each key success point:

```text
generate_lead        → job brief submitted (PostJobBrief success)
sign_up (homeowner)  → homeowner signup completed
sign_up (trade)      → trade application submitted
quote_check          → Quote Checker / Quote Checker AI run
contact_submit       → contact form sent
review_submit        → review submitted
dispute_raise        → dispute raised
```

Each call goes through the analytics helper at the existing success handlers in the relevant page components — no business-logic changes, only an added tracking call.

## Part 3 — In-app analytics dashboard

A new admin-only page at `/admin/analytics` (guarded by the existing `AdminRoute`) showing traffic + conversion metrics: users, sessions, page views, top pages, and conversion counts over a selectable date range (7/28/90 days).

Because GA4 reporting data lives in Google's servers, the dashboard reads it through the **GA4 Data API** via a new backend (Edge) function `ga4-report` so credentials never touch the browser:

```text
Dashboard page → supabase.functions.invoke("ga4-report") → GA4 Data API → metrics
```

### Credential needed
The GA4 Data API requires a Google Cloud **service account** (JSON key) that has Viewer access on the GA4 property, plus the GA4 **property ID** (numeric, different from the `G-` measurement ID). I will request these as backend secrets (`GA4_SERVICE_ACCOUNT_JSON`, `GA4_PROPERTY_ID`) before building the function. I'll give step-by-step instructions for creating the service account and granting it property access.

If you'd rather not set up the Data API, the alternative is a dashboard page that simply deep-links to the relevant GA4 reports — but it won't show live numbers inside the app. The plan above assumes the full Data API dashboard.

## Technical notes / files touched
- New: `src/lib/analytics.ts`, `src/hooks/usePageTracking.ts`, `src/pages/AdminAnalytics.tsx`, `supabase/functions/ga4-report/index.ts`.
- Edited: `src/App.tsx` (page tracking hook + `/admin/analytics` route), and success handlers in `PostJobBrief.tsx`, `SignupHomeowner*`, `SignupTrade*`/`Apply.tsx`, `QuoteChecker.tsx`, `QuoteCheckerAI.tsx`, `Contact.tsx`, `ReviewSubmit.tsx`, `DisputeRaise.tsx` for conversion events.
- All events respect the existing Termly consent banner (gtag no-ops if consent/gtag unavailable).
- After deploy, mark the events as Key Events/Conversions in the GA4 interface (one-time, in Google's UI).
