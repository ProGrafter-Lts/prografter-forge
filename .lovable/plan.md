# Authenticated shell consolidation

Items 3 (loading-gated redirect) and 4 (persistSession/autoRefreshToken) already pass and need no change. This plan fixes items 1, 2, and 5 and consolidates duplicate flows.

## 1. One shared AppLayout via nested routing
- Create `src/components/layout/AppLayout.tsx`: persistent top bar (logo + role-aware nav), a Back control (`useNavigate(-1)` with a sensible fallback), and a breadcrumb derived from the route. Renders `<Outlet />` for page content.
- Make it role-aware (trade vs homeowner vs admin) reusing existing `TradeSidebar`/`HomeownerSidebar`/`AdminNav` inside the single shell so chrome lives in exactly one place.
- Restructure `App.tsx` so all authenticated routes are children of a single parent `<Route element={<ProtectedRoute><AppLayout/></ProtectedRoute>}>` (and an admin parent for `/admin/*`). Pages drop their own `min-h-screen`/sidebar wrappers and render only their content.

## 2. Router-only in-app navigation
Replace in-app `<a href>` / `window.location` with `<Link>`/`useNavigate`:
- `ContractPage.tsx` logo, `PostJobBrief.tsx:918`, `QuoteCheckerAI.tsx` `/post-job-brief`, `GreenGrantsChecker.tsx` (×2), admin links in `Vetting.tsx`/`PlanningPipeline.tsx`.
- Leave legitimate external/non-nav uses: Stripe checkout redirect (`QuoteChecker.tsx`), `tel:` links, analytics, and public marketing chrome (Navbar/Footer/Hero) unless you want those converted too.

## 3. Detail-as-overlay (preserve list + scroll)
- Convert `/project/:id`, `/project/:id/compare`, `/project/:id/contract`, and `/dashboard/quote-checks/:id` to nested routes rendered in a slide-over `Drawer`/`Sheet` over the dashboard list, using the existing `ui/sheet.tsx`/`ui/drawer.tsx`.
- Keep the list mounted underneath; closing the drawer returns to the preserved scroll position. Direct deep-links still work (drawer opens over the relevant list).

## 4. Consolidate duplicate flows (separate, reviewable commits)
- Job posting: retire `PostAJob` standalone in favour of `PostJobBrief`.
- Quote checker: merge `QuoteChecker` + `QuoteCheckerAI` into one entry.
- Trade registration: collapse `TradeRegister`/`TradeRegisterNew`/`SignupTrade` behind `SignupTradeRedirect`.
- Report UI: share one component between `QuoteCheckDetail` and `QuoteReport`.

## Verification
- Typecheck + build after each phase.
- Playwright pass per authenticated route: confirm single shell, back/breadcrumb present, no full-page reloads on in-app nav, drawer preserves underlying list scroll, and deep-link + refresh still resolve session without a redirect flash.

## Risk / sequencing
Live app on a custom domain, so I'll land this in phases (layout shell → nav cleanup → drawers → de-dup), verifying after each, rather than one large change.
