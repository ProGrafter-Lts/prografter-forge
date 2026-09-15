# Final Public Brand & Navigation Consolidation

## Goal
Make the existing public ProGrafter website feel like one brand, using the current homeowner homepage as the master reference. Preserve all copy, routes, commercial figures, tools, screenshots, and working journeys. Authenticated dashboards and product logic remain untouched.

## 1. Canonical public shell
- Replace the three competing public headers with one `PublicHeader`, visually based on the homepage navigation.
- Use one shared navigation source for desktop and mobile: Homeowners, How It Works, Platform Tour, Our Checks, Advice, and About.
- Preserve intelligent access to For Trades, Pricing, Trust Centre, Resources, Log In, sign-up, and relevant primary actions without creating a second top-level menu.
- Derive active-page styling from the current route instead of page-specific hardcoding.
- Convert internal navigation to seamless in-site links so public pages do not reload unnecessarily.
- Keep one canonical `PublicFooter`, preserving all Intelligence, legal, privacy, cookie, complaints, contact, supplier, company-registration, and consent links.
- Retain the existing signed-in page treatment in `AppShell`; only its public branch will adopt the canonical public shell.

## 2. Shared public design primitives
- Consolidate the existing homepage and content-block language into reusable public components: section label, blueprint overlay, dark/light hero treatments, CTA variants, content cards, and FAQ/accordion styling.
- Keep the established navy, teal, cream, Bebas Neue, DM Sans, and DM Mono system; no new visual identity or page-specific font system.
- Move duplicated raw colours, gradients, shadows, radii, and public spacing into semantic tokens and shared variants where needed.
- Keep blueprint grids, dimensions, wireframes, and annotation phrases subtle, responsive, and non-interactive.

## 3. Core page alignment
- **Homepage and How It Works:** protect the existing compositions; change only shared header/footer, CTA, typography, and consistency details.
- **For Trades:** retain its current photography, message, sections, commission figures, and trade journey while switching to the canonical public header/footer.
- **Platform Tour:** preserve every live demo, screenshot, comparison, verification, and roadmap section; strengthen the architectural hero and dark/cream transitions around the real product evidence.
- **Our Checks:** preserve all five checks, “Why it matters,” and FAQs; present them with the shared technical verification treatment rather than generic white-card styling.
- **Advice:** preserve every guide, category, destination, and CTA; align the hero and guide cards with the architectural knowledge-centre treatment.
- **About:** preserve the founder voice, £625.32 / 18 leads / 0 jobs facts, pricing figures, tables, and feature explanation; improve editorial hierarchy and shared brand detailing only.
- **Pricing and Trust:** keep content and calculations unchanged while adopting the same shell, typography, CTA, card, and accordion system.
- Apply the same shell to related public information pages already using the legacy header, without redesigning their content.

## 4. Responsive and interaction QA
- Test the visitor journey Home → Homeowners → How It Works → Platform Tour → Our Checks → Advice → About, plus For Trades, Pricing, and Trust.
- Exercise desktop navigation, secondary access, mobile menu, active states, CTA links, dropdowns/menus, footer links, and consent preferences.
- Validate desktop, tablet, and mobile layouts for headline wrapping, screenshots, comparison/verification cards, guide cards, tables, annotations, footer, and horizontal overflow.
- Check for lost content, route changes, broken links, console/page errors, and signed-in public-page flicker regressions.
- Repair only defects introduced or exposed by this consolidation, then stop.

## Technical boundaries
- Frontend presentation and public-shell files only.
- No database, authentication, permissions, pricing, commission, verification logic, Quote Checker logic, dashboard, project workflow, or product-development changes.
- Existing real imagery and product screenshots remain primary evidence; no decorative replacement of product proof.
