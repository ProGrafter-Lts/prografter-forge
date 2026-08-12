// Windows & Doors V2 fixed-standard extraction schema (35 fields, 9 categories).
//
// Same Pass 0/1/2 architecture proven on Landscaping/Driveway, Boiler/Heating,
// Bathroom, Electrical/Rewire, Extension, Kitchen and Roofing. Where the
// subject genuinely overlaps with those categories (quote basics, making good,
// waste, price/VAT/payment, timescale) the criteria are deliberately carried
// across rather than re-derived, so the same evidence is adjudicated to the
// same standard everywhere.
//
// NO BRANCHING: unlike Roofing, this category has no not_applicable state. A
// single job can genuinely include both windows and doors at once, so the
// window fields and the door fields are all scored on every quote. Where a
// quote is genuinely windows-only or doors-only, silence on the other half is
// ABSENT — the homeowner is entitled to see that the quote does not cover it.
//
// Bug-class rules baked in from the start:
//   * NEAR-MISS = ABSENT — wording that gestures at a topic without naming the
//     actual subject is absent, never ambiguous.
//   * COLLECTIVE-NOUN / QUALITY-CLAIM KILL — "quality windows throughout",
//     "premium doors to match" carry zero specification: absent, never
//     ambiguous. Applied hardest on the four product-spec fields.
//   * COMPOUND FACTS — both halves required; one half alone is ambiguous.
//     item_schedule_and_quantities needs count AND location per item.
//     safety_glazing_where_required needs safety-critical LOCATIONS AND the
//     toughened/laminated spec AT those locations.
//   * PRECISION HEDGE vs COMMITMENT HEDGE — a hedge beside a figure keeps the
//     field present; a hedge replacing the figure is ambiguous.
//   * NO-REUSE stays narrow, and matters more here than anywhere else: windows
//     and doors share the words "frame", "glazing", "furniture", "locking".
//     Evidence about windows may NEVER be used to score a door field, and
//     evidence about doors may NEVER be used to score a window field.

import type { CategoryDef } from "./quote-checker-schemas.ts";

export const WINDOWS_DOORS_SCHEMA: CategoryDef[] = [
  {
    key: "quote_basics",
    name: "Quote Basics",
    fields: [
      {
        key: "customer_name_and_address",
        label: "Customer name and address",
        criteria:
          "COMPOUND FACT — needs BOTH a customer name AND a customer address (full address, street + town, or postcode). Both = present. Only one (a greeting such as 'Hi Dave,' with no address, or an address with no named customer) = ambiguous. Neither = absent. NEAR-MISS = ABSENT: 'as discussed with yourselves', 'for your property' name no customer and no address — absent, not ambiguous.",
      },
      {
        key: "property_address_worked",
        label: "Address of the property where the windows/doors are being installed",
        criteria:
          "present if the document states where the work happens — a site/installation/survey address, or an explicit statement that the work address is the customer's address above ('works at the above address'). NO-REUSE (narrow): a customer correspondence address that is explicitly a DIFFERENT address from the work address does NOT evidence this field. AMBIGUOUS: a property named with no address at all ('your house', 'the bungalow'). Silence is absent.",
      },
      {
        key: "quote_date_and_validity",
        label: "Quote date and how long the price is held",
        criteria:
          "COMPOUND FACT — needs BOTH a quote/issue date AND a validity or expiry period. SEARCH THE WHOLE DOCUMENT FOR BOTH HALVES: the date is usually in the header and validity is very often the closing line ('valid for 30 days'). Both anywhere in the document, however far apart = present. Only one half = ambiguous. Neither = absent. 'Prices subject to change' with no period is NOT a validity period. HEDGING: 'valid for approximately 30 days' = present (figure survives); 'valid for a short while' = ambiguous (figure replaced).",
      },
      {
        key: "trade_business_details",
        label: "Installer / company name and contact details",
        criteria:
          "COMPOUND FACT — needs BOTH a business or trading name AND at least one contact route (phone, email, address, website). Both = present (a trading name without Ltd/Limited still counts). Only one — a company name with no contact route, or a bare mobile number with no business name — = ambiguous. A first name only with no business name and no contact = absent. Silence is absent.",
      },
      {
        key: "quote_reference_number",
        label: "Quote or job reference number",
        criteria:
          "present only if an identifiable quote, estimate, job, survey or invoice reference/number is given (e.g. 'Quote ref: WD-3312', 'Survey No. 8841'). A date alone is NOT a reference. NEAR-MISS = ABSENT: 'quotation' as a heading with no number, 'our usual reference' — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "scope",
    name: "Scope",
    fields: [
      {
        key: "scope_type",
        label: "What kind of job this is (full house window replacement, partial replacement, doors only, single unit, new-build supply and fit)",
        criteria:
          "present if the document names the actual type of job — full-house window replacement, partial replacement (named rooms/elevations), doors only, a single named unit, bifold/patio door installation, or new-build supply and fit. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that refers to the job collectively or makes a quality claim without naming the type of job — 'your new windows project', 'transform your home', 'a first-class installation', 'full window works', 'the glazing package' — is ABSENT, NEVER ambiguous, however confident or repeated. Only a named job type moves this field off absent. Silence is absent.",
      },
      {
        key: "item_schedule_and_quantities",
        label: "Itemised schedule of units — how many, and where each one goes",
        criteria:
          "COMPOUND FACT — needs BOTH a count/quantity AND the location of the items. A bare total with no locations ('10 windows', 'supply and fit 8 units', 'windows throughout the property') is AMBIGUOUS, not present — a homeowner cannot check a bare total. Present requires the units to be tied to locations, either as a per-item schedule ('10 windows: 4 bedroom, 3 living room, 2 bathroom, 1 landing') or a room/elevation-by-room list with counts. Locations named with no counts at all ('windows to the bedrooms and lounge') = ambiguous. Sizes are NOT required for this field. HEDGING: '10 windows (approx. sizes to be confirmed on survey): 4 bedroom, 3 lounge, 2 bathroom, 1 landing' is present — the counts and locations survive the hedge. COLLECTIVE-NOUN RULE: 'all the windows in the house', 'the full set' state neither a count nor per-item locations — ABSENT, never ambiguous. Silence is absent.",
      },
      {
        key: "existing_removal_and_disposal",
        label: "Removal of the existing windows/doors and disposal of the old frames and glass",
        criteria:
          "EITHER/OR FIELD — present if the document states EITHER removal/taking out of the existing frames and glass OR disposal/removal from site of the old units. One clear statement makes this present. Explicit exclusion ('old frames to be removed by others', 'customer to provide skip') is ALSO present — it is a stated scope decision. NEAR-MISS = ABSENT: 'we leave the place tidy', 'clean and respectful fitters', 'we'll sort the mess out' name neither removal nor disposal — absent, not ambiguous. NO-REUSE: general building waste wording elsewhere may evidence disposal_and_waste_removal without also evidencing removal of the existing units here, unless removal itself is stated. Silence is absent.",
      },
    ],
  },
  {
    key: "windows",
    name: "Windows",
    fields: [
      {
        key: "window_type_and_style",
        label: "Window type and opening style (casement, tilt-and-turn, sash, bay, fixed lights, opener configuration)",
        criteria:
          "present if the document names the window type or opening style — casement, tilt-and-turn, vertical/sliding sash, bay, bow, flush casement, top-hung openers, fixed lights, or a stated opener configuration per unit. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'quality windows throughout', 'premium windows', 'top-of-the-range windows', 'A-rated windows all round', 'the best windows for the money', 'modern stylish windows' name NO type and NO opening style — ABSENT, NEVER ambiguous, however confident or repeated. AMBIGUOUS: a type named for only part of the job with the rest unstated ('casements to the front, the rest as existing'). NO-REUSE: a DOOR style (bifold, French, composite front door) does NOT evidence this window field. Silence is absent.",
      },
      {
        key: "frame_material_and_colour",
        label: "Window frame material and colour/finish",
        criteria:
          "COMPOUND FACT — needs BOTH the window frame material (uPVC, aluminium, timber, aluminium-clad timber, composite) AND a colour or finish (white, anthracite grey RAL 7016, Irish oak foil, dual-colour white inside/grey outside). Both = present. Only one half — 'uPVC frames' with no colour, or 'anthracite frames' with no material — = ambiguous. HEDGING: 'anthracite grey (RAL to be confirmed)' keeps material and colour — present. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'quality frames', 'premium frames to match', 'a nice modern finish', 'colour of your choice' state no material AND no colour — ABSENT, never ambiguous. NO-REUSE: a DOOR frame/colour statement does NOT evidence this window field. Silence is absent.",
      },
      {
        key: "glazing_specification",
        label: "Window glazing specification (double/triple, unit make-up, coatings, gas fill, spacer)",
        criteria:
          "present if the document specifies the window glazing beyond the bare word 'glazed' — double or triple glazed WITH at least one further specification detail (unit make-up such as 4-20-4, low-E/soft-coat glass, argon fill, warm-edge spacer, obscure/Pilkington pattern where used, acoustic laminate). AMBIGUOUS: 'double glazed' or 'A-rated glass' alone, with no make-up, coating, fill or spacer detail. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'quality glass', 'the best glazing available', 'energy-saving glass throughout' with no specification — ABSENT, never ambiguous. NO-REUSE: door glazing detail does NOT evidence this field. Silence is absent.",
      },
      {
        key: "window_furniture_and_locking",
        label: "Window handles, hinges and locking specification",
        criteria:
          "present if the document specifies window hardware — handle type/finish, hinge type (friction stays, egress/fire-escape hinges, restrictors), locking (espagnolette multipoint locks, shootbolts, key-locking handles), or a named hardware brand/range. AMBIGUOUS: hardware named as a subject with only a quality claim ('good quality handles', 'secure locking'). NEAR-MISS = ABSENT: 'handles fitted', 'lockable windows' in a bare scope list state no type, finish, brand or locking mechanism — absent, not ambiguous. NO-REUSE: a door lock/cylinder specification does NOT evidence this window field. Silence is absent.",
      },
      {
        key: "trickle_vents_and_ventilation_compliance",
        label: "Trickle vents / background ventilation and Part F compliance",
        criteria:
          "present if the document states whether trickle vents (or equivalent background ventilation) are fitted, to which units, or that the existing background ventilation is being maintained/increased to meet Building Regulations Part F — including an explicit statement that vents are NOT included and why. AMBIGUOUS: ventilation named with no position taken ('vents can be added if you want them', 'we'll discuss trickle vents on survey'). NEAR-MISS = ABSENT: 'windows are fully weathertight', 'no more draughts', 'condensation will improve' say nothing about background ventilation — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "doors",
    name: "Doors",
    fields: [
      {
        key: "door_type_and_style",
        label: "Door type and style (front/back entrance, French, patio sliding, bifold, stable, with panel/style named)",
        criteria:
          "present if the document names the door type or style — front/entrance door, back door, French doors, sliding patio, bifold (with leaf configuration), stable door, or a named door style/panel design. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'premium doors to match', 'quality doors throughout', 'a stunning new front door', 'high-security doors', 'top-of-the-range doorset' name NO type and NO style — ABSENT, NEVER ambiguous, however confident. AMBIGUOUS: 'new doors' with a count but no type at all, or a type named for one door with other doors in scope left unnamed. NO-REUSE: a WINDOW type (casement, sash) does NOT evidence this door field. If the quote genuinely includes no doors, this is ABSENT — there is no not_applicable state in this category. Silence is absent.",
      },
      {
        key: "door_material_and_colour",
        label: "Door material and colour/finish",
        criteria:
          "COMPOUND FACT — needs BOTH the door material (composite, uPVC, aluminium, timber/hardwood) AND a colour or finish. Both = present. Only one half — 'composite door' with no colour, or 'a grey door' with no material — = ambiguous. HEDGING: 'composite in Chartwell Green (final RAL on survey)' = present. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'premium doors to match', 'quality door in a colour to suit', 'a lovely finish' state no material AND no colour — ABSENT, never ambiguous. NO-REUSE: a WINDOW frame material/colour statement does NOT evidence this door field, even where the quote says frames are 'matching' — 'to match the windows' without naming the door's own material and colour is ambiguous at best. Silence is absent.",
      },
      {
        key: "door_glazing_specification_where_applicable",
        label: "Door glazing specification where the doors are glazed",
        criteria:
          "present if the document specifies the glazing in the doors — glazed panel/apron design, obscure or decorative glass, double/triple glazed unit make-up, toughened or laminated glass in the door leaf or side panels — OR explicitly states the doors are solid/unglazed. AMBIGUOUS: 'glazed door' or 'with glass panel' with no further specification. NEAR-MISS = ABSENT: 'lets in lots of light', 'a bright new doorway' specify nothing — absent, not ambiguous. NO-REUSE: the WINDOW glazing make-up does NOT evidence this door field. If the quote includes no doors at all, this is ABSENT. Silence is absent.",
      },
      {
        key: "door_furniture_and_locking",
        label: "Door handles, cylinder and multipoint locking specification",
        criteria:
          "present if the document specifies door hardware — handle/knocker/letterplate set and finish, hinge type, cylinder specification (TS007 3-star, anti-snap, Ultion/Brisant or similar named cylinder), multipoint locking, or a named hardware suite. AMBIGUOUS: hardware named as a subject with only a quality claim ('secure locking', 'high-security lock', 'good quality handles') with no named mechanism, standard or brand. NEAR-MISS = ABSENT: 'lockable', 'keys supplied' state no hardware specification — absent, not ambiguous. NO-REUSE: window espagnolette/handle detail does NOT evidence this door field. Silence is absent.",
      },
      {
        key: "threshold_and_weatherproofing",
        label: "Door threshold type and weatherproofing / draught sealing",
        criteria:
          "present if the document states the threshold detail (low/level-access threshold, standard upstand, aluminium cill threshold, part-M compliant threshold) OR the weatherproofing at the door (weather bar, drip bar, brush seals, silicone weather sealing at the frame). One clear statement = present. AMBIGUOUS: 'the door will be weathertight', 'sealed against the weather' name no threshold and no sealing detail but do name weatherproofing as a subject. NEAR-MISS = ABSENT: 'no more draughts through the hall' is a benefit claim, not a threshold or sealing specification — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "performance_and_compliance",
    name: "Performance and Compliance",
    fields: [
      {
        key: "u_value_or_energy_rating",
        label: "U-value or window energy rating for the units supplied",
        criteria:
          "present if the document gives a U-value figure (e.g. '1.2 W/m²K whole-window U-value') or a Window Energy Rating band (WER A+, 'A-rated to BFRC'). HEDGING: 'U-value of approximately 1.4 W/m²K' = present (figure survives); 'a very low U-value' = ambiguous (figure replaced). NEAR-MISS = ABSENT: 'energy efficient', 'will cut your heating bills', 'thermally efficient frames' give neither a figure nor a rating band — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "fensa_or_certass_certification",
        label: "FENSA or CERTASS (or equivalent named competent-person scheme) certification",
        criteria:
          "present only if a NAMED competent-person scheme is stated — FENSA, CERTASS, Assure, or Building Control notification by a named route — together with the fact a certificate will be issued or the work registered. A named scheme with a registration number counts. AMBIGUOUS: the certificate is promised with no scheme named ('you'll get your certificate in the post', 'registered installer'). NEAR-MISS = ABSENT: 'all work to current regulations', 'fully compliant installation', 'we're fully qualified' make a compliance claim with NO named scheme — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "building_regs_compliance_part_l",
        label: "Building Regulations compliance for replacement windows/doors (Part L thermal standard)",
        criteria:
          "present if the document states the units meet the Building Regulations thermal standard for replacement glazing — e.g. 'meets Part L1B for replacement windows', 'compliant with the current Part L U-value limit of 1.4 W/m²K', 'Building Regulations compliant replacement glazing under Part L'. NO-REUSE (narrow): the FENSA/CERTASS registration statement is scored in its own field and does NOT by itself evidence Part L compliance here; a bare U-value figure with no compliance statement does NOT either. AMBIGUOUS: 'meets Building Regulations' with no reference to the thermal/Part L standard or a figure tied to it. NEAR-MISS = ABSENT: 'all work to current regulations', 'fully compliant' — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "safety_glazing_where_required",
        label: "Safety glazing (toughened/laminated) identified at the safety-critical locations",
        criteria:
          "HIGHEST-STAKES COMPOUND FACT in this schema — Building Regulations Part K/N. Needs BOTH (a) the safety-critical locations identified — low-level glazing (below 800mm, or below 1500mm in and beside doors), glass within or adjacent to a door, full-height/floor-level panes, bath/shower-adjacent glazing — AND (b) toughened or laminated glass confirmed specifically AT those locations. Both = present ('toughened glass to the two full-height lounge panes and to all glazing within 300mm of the door leaves'). ONE HALF ONLY = AMBIGUOUS: safety-critical locations flagged with no glass type at them, OR 'toughened glass where required' / 'safety glass fitted as necessary' with no location identified. THOROUGH GENERAL GLAZING IS NOT A SUBSTITUTE: a full, detailed 'double glazing throughout, 4-20-4 argon-filled low-E units' specification that never mentions safety-critical panes is AMBIGUOUS, NOT present, however complete the rest of the glazing spec is. NEAR-MISS = ABSENT: 'all glass is safe', 'the glass is very strong', 'meets all safety standards' identify neither a location nor toughened/laminated glass — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "installation",
    name: "Installation",
    fields: [
      {
        key: "fitting_method",
        label: "How the units are fixed and sealed into the opening",
        criteria:
          "present if the document states the fitting method — frame fixings/screws into the reveal, packers, expanding foam or insulated cavity closer, internal and external silicone sealing, damp-proof course/cavity tray detail, or a stated fit type ('fitted into the existing openings, no structural alteration'). One clear statement = present. AMBIGUOUS: fitting named as a subject with no method ('professionally fitted', 'fitted correctly to the manufacturer's instructions' with nothing further). NEAR-MISS = ABSENT: 'supply and fit', 'installation included' state that fitting is in scope but no method — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "cill_and_trim_detail",
        label: "Cills, add-on cills and internal/external trims",
        criteria:
          "present if the document states the cill arrangement (new add-on uPVC cills, existing stone cills retained, cill end caps) or the trims/beads used (internal architrave/trim, external cover trim, colour-matched). One clear statement = present. AMBIGUOUS: cills or trims named with no position taken ('cills as required', 'we'll sort the trims'). NEAR-MISS = ABSENT: 'a neat finish around the windows' names no cill and no trim — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "making_good_internal",
        label: "Making good internally around the new units (plaster reveals, trims, decoration prep)",
        criteria:
          "present if the document states what happens to the internal reveals — plaster patching/re-skim of reveals, internal trim fitted to cover, silicone finish internally, or an explicit exclusion ('internal plastering not included, by others'). An explicit exclusion is present — it is a stated scope decision. AMBIGUOUS: making good named with no extent ('we'll make good inside', 'left tidy internally'). NEAR-MISS = ABSENT: 'we clean up after ourselves', 'dust sheets used throughout' — absent, not ambiguous. NO-REUSE: an EXTERNAL making-good statement does not evidence this field. Silence is absent.",
      },
      {
        key: "making_good_external",
        label: "Making good externally around the new units (pointing, render, brickwork, sealant)",
        criteria:
          "present if the document states what happens externally — re-pointing or mortar repair to the reveals, render patching, brickwork made good, external silicone/mastic seal, or an explicit exclusion ('external render repairs not included'). An explicit exclusion is present. AMBIGUOUS: external making good named with no extent ('we'll tidy the outside up'). NEAR-MISS = ABSENT: 'the outside will look smart', 'all rubbish taken away' — absent, not ambiguous. NO-REUSE: an INTERNAL making-good statement does not evidence this field. Silence is absent.",
      },
    ],
  },
  {
    key: "finishes_and_waste",
    name: "Finishes and Waste",
    fields: [
      {
        key: "internal_decoration_scope",
        label: "Whether internal decoration (painting/redecoration of reveals) is included",
        criteria:
          "present if the document takes a position on internal decoration — included (with extent: 'reveals painted in emulsion, one coat mist and two top coats'), excluded ('decoration not included, walls left ready for your decorator'), or priced as an option. AMBIGUOUS: decoration named with no position ('we can paint it if you want', 'decorating can be discussed'). NEAR-MISS = ABSENT: 'left ready for use', 'a clean finish' state nothing about decoration — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "external_pointing_or_render_repair",
        label: "External pointing or render repair as a priced item, including any exclusion",
        criteria:
          "present if the document states whether pointing/render repair around the openings is priced in, excluded, or provisional with a figure ('£250 provisional sum for render repairs to the two rear openings'). An explicit exclusion is present. NO-REUSE (narrow): a general external sealant/making-good line already scored under making_good_external does NOT by itself evidence a pointing or render REPAIR position here unless pointing, mortar or render is actually named. AMBIGUOUS: pointing/render named with no position or figure ('any pointing needed will be sorted'). Silence is absent.",
      },
      {
        key: "disposal_and_waste_removal",
        label: "Removal of waste from site and how it is disposed of",
        criteria:
          "EITHER/OR FIELD — present if the document states EITHER that waste/old frames and glass are removed from site by the installer OR the disposal arrangement (skip included, licensed transfer station, recycling of uPVC/glass), OR an explicit exclusion ('skip to be provided by the customer'). One clear statement = present. NEAR-MISS = ABSENT: 'we leave the site clean', 'no mess left behind' name no removal from site and no disposal route — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "price_vat_payment",
    name: "Price, VAT and Payment",
    fields: [
      {
        key: "total_price_and_breakdown",
        label: "Total price, and whether it is broken down",
        criteria:
          "present if a specific total price figure is given (a single total is enough — a per-item breakdown strengthens it but is NOT required). HEDGING: 'approximately £8,450' = present (figure survives); 'around eight grand-ish, we'll firm it up' = ambiguous (figure replaced by a hedge). AMBIGUOUS: a price range with no committed total ('£8,000 to £11,000 depending'). NEAR-MISS = ABSENT: 'all costs covered', 'no hidden extras', 'a fair price' state no figure — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "vat_treatment",
        label: "VAT treatment — inclusive, exclusive, a VAT figure, or a VAT registration number",
        criteria:
          "present if the document states VAT-inclusive or VAT-exclusive pricing, shows a VAT line/figure, gives a VAT registration number, or states the business is not VAT registered. AMBIGUOUS: VAT mentioned with no position ('VAT to be confirmed', 'plus any VAT that may apply'). NEAR-MISS = ABSENT: 'all-in price', 'nothing more to pay' do not address VAT — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "payment_schedule_and_stage_payments",
        label: "Payment schedule / stage payments and when the balance falls due",
        criteria:
          "present if the document sets out when payments are due — stage payments tied to events or dates, or a stated balance term ('balance due on completion', 'payment within 14 days of the invoice'). NO-REUSE (narrow): the deposit alone is scored in deposit_amount and does NOT by itself evidence a payment schedule here; a deposit PLUS a stated balance term does. AMBIGUOUS: payment named with no timing ('payment terms as discussed', 'we'll sort payment out'). NEAR-MISS = ABSENT: 'easy payment options available' — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "deposit_amount",
        label: "Deposit amount or percentage",
        criteria:
          "present if a deposit figure or percentage is stated ('£1,000 deposit', '25% deposit on order'), or the document explicitly states no deposit is required. HEDGING: 'a deposit of around 25%' = present (figure survives). AMBIGUOUS: 'a small deposit up front', 'the usual deposit' — a deposit is named but no figure or percentage is given. Silence is absent.",
      },
    ],
  },
  {
    key: "timescale",
    name: "Timescale",
    fields: [
      {
        key: "start_date",
        label: "Start date or lead time to installation",
        criteria:
          "present if the document gives a start date, a start window, or a lead time from order ('installation week commencing 9 March 2026', 'fitting approximately 8-10 weeks from survey'). HEDGING: 'approximately 8 weeks from order' = present (figure survives). AMBIGUOUS: a start named with no date or lead time figure ('we can start fairly soon', 'a start date will be agreed once the units arrive'). NEAR-MISS = ABSENT: 'we're keen to get going', 'we'll start as soon as we can', 'subject to availability' state no date, window or lead time — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "duration_or_completion_date",
        label: "How long the installation takes on site, or the completion date",
        criteria:
          "present if the document gives an on-site duration or a completion date ('3 days on site', 'two fitters for two days', 'complete by 20 March 2026'). HEDGING: 'around 3 days on site' = present. AMBIGUOUS: duration named with no figure ('a short job', 'in and out quickly, depending on the weather'). NEAR-MISS = ABSENT: 'we don't hang about', 'we work efficiently', 'it won't take long' state no duration and no completion date — absent, not ambiguous. NO-REUSE: the start date/lead time does NOT evidence duration. Silence is absent.",
      },
    ],
  },
];
