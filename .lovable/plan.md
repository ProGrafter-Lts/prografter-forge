# Final public-site acceptance and correction pass

## Scope
Finish the public-site baseline without redesigning working pages or touching authenticated functionality, data, permissions, pricing logic, Quote Checker, verification logic, projects, admin, or payments.

## Audit findings
- The newer Homeowner, For Trades, Platform Tour, Our Checks, Advice, About and Planning Intelligence pages already establish the approved visual direction and will receive corrections only where browser checks prove a problem.
- Trust Centre, Pricing and FAQ still rely on the older shared content-page presentation; Contact uses a separate older light-page treatment.
- All audited pages currently avoid horizontal overflow and broken imagery at 1280px, 768px and 390px.
- Shared content-page heroes and sections use desktop-sized spacing on mobile. A few bespoke pages also use fixed mobile heights that require visual verification before adjustment.
- The compact cookie bar and chat control are separated at normal mobile sizing, but their offset is fixed rather than based on the banner’s real height.
- Primary uppercase statements and handwritten notes both exist; their roles need to be made explicit through consistent usage, not by removing either style.

## Corrections
1. **Trust Centre — evidence-led identity**
   - Preserve all current trust content and links.
   - Add restrained record/check-line composition and the architectural statement “PROVE IT. RECORD IT. SHARE IT.”
   - Keep Our Checks as the detailed verification authority; do not duplicate it.

2. **Pricing — commercial clarity**
   - Preserve the current centrally sourced rate and cap with no new pricing source.
   - Present the core sequence clearly: JOIN / VERIFY / MATCH / QUOTE without lead fees, then commission after completed paid work.
   - Improve hierarchy and comparison readability without introducing SaaS pricing tiers or cards.

3. **FAQ — compact reference treatment**
   - Preserve every question, answer, link and accordion behavior.
   - Strengthen category separation and question scanning with compact technical details and no decorative dead space.

4. **Contact — clearer visual rhythm**
   - Preserve every category, address, subject, form behavior, and the two-working-day statement.
   - Introduce a restrained dark architectural transition around the message area while keeping contacting ProGrafter immediate and simple.

5. **Shared mobile rhythm and typography rules**
   - Reduce only the mobile top/bottom spacing that exceeds header clearance or separates related content unnecessarily.
   - Keep desktop spacing essentially unchanged.
   - Use bold architectural uppercase for primary brand statements and system principles.
   - Keep handwriting only as short human observations attached to imagery, founder context, or project records.

6. **Floating controls**
   - Make chat clearance respond to the actual cookie-banner height and safe area, without adding page-wide bottom space.
   - Verify the closed and open chat states do not obstruct navigation, accordions, forms, or calls to action.

## Acceptance review
- Recheck every public destination at desktop, tablet and mobile, with mobile spot checks at 360px, 390px, 412px and 430px.
- Confirm no unexplained whitespace, hidden content, broken images, overflow, widget obstruction, contradictory pricing, incorrect destinations, or accidental private-screen entry.
- Confirm shared pages retain public navigation for logged-out visitors and signed-in homeowner/trade accounts.
- Stop after the acceptance pass and report only corrected inconsistencies plus any factual issue that genuinely needs founder confirmation.