# Pass 1 Mobile QA Correction

## Scope
Targeted corrections only. Preserve the current public-page structure, copy, routes, product screenshots, and visual direction. Do not touch authenticated areas, data, permissions, or product logic.

## Changes
1. **Shared contrast rules**
   - Strengthen semantic light-text handling for dark navy sections and dark-text handling for cream/light sections.
   - Cover inherited paragraph, heading, muted, body, and technical-label styles without overriding deliberately light cards nested inside dark sections.
   - Verify WCAG AA contrast for normal public-page copy.

2. **Compact mobile header on scroll**
   - Keep the current top-of-page header presentation.
   - After meaningful scrolling, reduce the mobile bar and logo height with a subtle transition.
   - Keep the menu control accessible, preserve the navy treatment, and avoid document layout shift.

3. **Mobile chat placement**
   - Reduce the closed chat control on mobile and move it nearer the safe lower-right edge.
   - Keep the existing larger desktop treatment and full chat functionality.
   - Check it against calls to action, accordions, and product content at the requested widths.

4. **Platform Tour screenshot readability**
   - Keep every real ProGrafter screenshot.
   - Add mobile-only viewport framing/cropping where needed so the relevant interface area remains legible while retaining product context.
   - Do not fabricate screens or alter surrounding content.

## Validation
- Test Platform Tour and Verification at 360, 390, 412, and 430px.
- Check readable text, overflow, compact header state, chat overlap, screenshot usefulness, calls to action, and accordion access.
- Spot-check desktop for regressions and confirm no route or functionality changes.
