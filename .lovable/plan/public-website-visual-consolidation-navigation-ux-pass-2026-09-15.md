# Public website visual consolidation + navigation UX pass

Presentation only. No changes to the logged-in platform, data, permissions, pricing, quote/project/payment logic, or any new modules.

## 1. Navigation

- Keep the single public header as the only public menu, restyled so it merges into dark hero pages (transparent over the hero, solid navy once scrolled) instead of sitting as a separate strip.
- Same menu structure on desktop and mobile; logo and branding unchanged.
- Signed-in visitors browsing public pages keep the app navigation they already have — the public menu will not double up on top of it.

## 2. Shared visual language (from the homepage)

Reuse the homepage's proven ingredients as shared pieces rather than a single repeated template:
- deep navy atmosphere with graded photography
- large condensed headings, clean body text, small technical labels
- teal accent rules and restrained CTA hierarchy
- cream contrast sections between navy sections
- selective blueprint/technical linework, never on every page
- occasional oversized low-opacity editorial statements

## 3. Page-by-page treatment (content preserved)

**Platform Tour** — becomes a product showcase. Keep "SEE HOW THE WORK STAYS CLEAR.", "ONE PROJECT. TWO USEFUL VIEWS.", "NOT JUST THE CHEAPEST. THE CLEAREST.", "VERIFICATION IS EARNED, NEVER BOUGHT." Current interface imagery presented in device/browser framing, grouped so the visitor sees quotes, shared project, progress, variations, payments and evidence without being flooded.

**Our Checks** — keep "EVERY TRADE, VERIFIED FIVE WAYS." and all five checks. Restyle around evidence: certificates, insurance documents, ID, references, site records. No padlocks, shields or cybersecurity imagery.

**Advice** — keep "BUILD WITH CONFIDENCE." and all guides. Light, content-led, with drawing/measurement/specification detailing and highly readable guide cards.

**About** — keep the founder story exactly, with £625.32 / 18 leads / 0 jobs turned into a bold editorial number treatment. Flow stays problem → experience → realisation → why ProGrafter → the alternative. No biography expansion.

**Home / How It Works** — reference pages; only touched for header, spacing, CTA and mobile consistency.

## 4. Editorial statements

Short ProGrafter statements (e.g. "FIVE CHECKS. NOT FIVE STARS.", "IF IT CHANGES, RECORD IT.") used sparingly as graphic devices between sections — never as extra paragraphs, never in every gap.

## 5. Reduce text fatigue

Long text blocks broken up with hierarchy, imagery, numbers, cards and progressive disclosure. Nothing important is deleted.

## 6. Technical notes

- Shared primitives: PublicHeader (scroll-aware), Hero variants, SectionLabel, EditorialStatement, DeviceFrame, ContentCard, blueprint/photographic background utilities, all on existing semantic tokens in `index.css`.
- No new routes; all existing links preserved.
- Any new imagery generated into `src/assets` and imported directly.

## 7. QA

Walk Home → How It Works → Platform Tour → Our Checks → Advice → About plus dropdowns and footer at desktop, tablet and mobile: one header, no overflow, no broken links, no console errors.

## Note

Your brief was cut off at "DO NOT delete important…" — I have assumed "do not delete important content". Tell me if anything else was in that last section.
