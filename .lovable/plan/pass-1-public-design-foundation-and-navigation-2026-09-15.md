# Pass 1 — Public design foundation and navigation

This pass will standardise the existing ProGrafter system without redesigning any public content page. The Homeowner homepage, For Trades, and How It Works remain the visual source of truth.

## 1. Preserve and extract the current system

- Keep the three reference pages’ content, imagery, section compositions, and journeys intact.
- Consolidate their established navy, cream, teal, typography, spacing, image grading, technical labels, annotations, and focus treatment into shared semantic styles.
- Remove only demonstrably redundant foundation styles; retain page-specific compositions where consolidation could alter their appearance.

## 2. Shared public primitives

- Refine the existing shared primitives rather than create parallel systems: technical eyebrow, controlled editorial statement, evidence/media panel, product-interface frame, technical annotation, and light/dark section environments.
- Extract the successful numbered journey pattern into a reusable primitive while leaving the current How It Works implementation visually unchanged.
- Ensure decorative text and linework are hidden from assistive technology and that content never depends on animation.

## 3. Header, footer, and navigation context

- Keep one canonical public header and one canonical public footer across public routes.
- Preserve the transparent-over-dark-hero header treatment and solid scrolled/light-page state.
- Public routes always keep public navigation, including for signed-in visitors; signed-in trade and homeowner visitors receive the correct dashboard return action.
- Authenticated workspace routes retain role-specific application navigation and never gain the public footer.
- Add subtle labelled grouping to the existing trade application menu for scanability without changing routes, visibility, permissions, or behavior. Keep the homeowner menu homeowner-only.

## 4. CTA foundation

- Align shared primary, secondary, and text-action variants with the exact treatments already used on the reference pages.
- Migrate only shared/navigation/foundation controls in this pass; do not restyle individual content-page actions.

## 5. Mobile utilities

- Make the floating chat launcher smaller and safe-area aware on mobile, and keep the opened panel within the usable viewport.
- Make the cookie notice compact, safe-area aware, keyboard accessible, and non-overflowing while preserving all consent choices and logging behavior.

## 6. QA and stopping point

- Verify Homeowner, For Trades, and How It Works on desktop, tablet, and mobile, confirming no visual regression, overflow, hidden text, or broken interactions.
- Check one unchanged weaker public page only for shared header/footer behavior.
- Test public navigation logged out and, where test sessions are available, as trade and homeowner; verify application routes retain their correct role-specific navigation.
- Check mobile menu, chat, cookie controls, keyboard focus, links, console errors, and route behavior.
- Report the requested fourteen Pass 1 outcomes, identify anything intentionally retained, and stop without redesigning Platform Tour, Our Checks, Trust Centre, Advice, About, or ProGrafter Intelligence.

## Technical boundaries

Frontend presentation only. No database, permissions, authentication rules, pricing, commissions, quote/project/payment workflows, or product-module changes.
