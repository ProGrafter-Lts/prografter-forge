// Plastering / Rendering V2 fixed-standard extraction schema (30 fields, 8 categories).
//
// Same Pass 0/1/2 architecture proven on Landscaping/Driveway, Boiler/Heating,
// Bathroom, Electrical/Rewire, Extension, Kitchen, Roofing and Windows & Doors.
// Where the subject genuinely overlaps with those categories (quote basics,
// making good, price/VAT/payment, timescale) the criteria are deliberately
// carried across rather than re-derived, so the same evidence is adjudicated to
// the same standard everywhere.
//
// NO BRANCHING: unlike Roofing, this category has no not_applicable state.
// Internal plastering and external rendering can genuinely coexist on the same
// job, so the internal fields and the external fields are all scored on every
// quote. Where a quote is genuinely internal-only or external-only, silence on
// the other half is ABSENT — the homeowner is entitled to see that the quote
// does not cover it.
//
// Bug-class rules baked in from the start:
//   * NEAR-MISS = ABSENT — wording that gestures at a topic without naming the
//     actual subject is absent, never ambiguous.
//   * COLLECTIVE-NOUN / QUALITY-CLAIM KILL — "quality plastering throughout",
//     "premium render finish", "a beautiful smooth finish" carry zero
//     specification: ABSENT, never ambiguous. Applied hardest on
//     plaster_system_and_coats, render_system_and_product and
//     colour_and_finish_texture.
//   * COMPOUND FACTS — both halves required; one half alone is ambiguous.
//     render_system_and_product needs a NAMED MANUFACTURER AND SPECIFIC PRODUCT
//     LINE (not a generic render category) AND coat count/thickness.
//     plaster_system_and_coats needs the system type AND the coat count.
//     manufacturer_system_warranty_where_applicable needs the named system AND
//     the warranty term.
//   * PRECISION HEDGE vs COMMITMENT HEDGE — a hedge beside a figure keeps the
//     field present ("approx. 12mm"); a hedge replacing the figure is
//     ambiguous ("thickness as required").
//   * NO-REUSE stays narrow, and matters more here than anywhere else: the
//     internal and external sections share the words "coats", "finish",
//     "preparation", "beading". Evidence about INTERNAL plastering may NEVER be
//     used to score an EXTERNAL rendering field, and evidence about EXTERNAL
//     rendering may NEVER be used to score an INTERNAL plastering field.

import type { CategoryDef } from "./quote-checker-schemas.ts";

export const PLASTERING_SCHEMA: CategoryDef[] = [
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
        label: "Address of the property where the plastering/rendering is being carried out",
        criteria:
          "present if the document states where the work happens — a site/works address, or an explicit statement that the work address is the customer's address above ('works at the above address'). NO-REUSE (narrow): a customer correspondence address that is explicitly a DIFFERENT address from the work address does NOT evidence this field. AMBIGUOUS: a property named with no address at all ('your house', 'the bungalow'). Silence is absent.",
      },
      {
        key: "quote_date_and_validity",
        label: "Quote date and how long the price is held",
        criteria:
          "COMPOUND FACT — needs BOTH a quote/issue date AND a validity or expiry period. SEARCH THE WHOLE DOCUMENT FOR BOTH HALVES: the date is usually in the header and validity is very often the closing line ('valid for 30 days'). Both anywhere in the document, however far apart = present. Only one half = ambiguous. Neither = absent. 'Prices subject to change' with no period is NOT a validity period. HEDGING: 'valid for approximately 30 days' = present (figure survives); 'valid for a short while' = ambiguous (figure replaced).",
      },
      {
        key: "trade_business_details",
        label: "Plasterer / rendering contractor name and contact details",
        criteria:
          "COMPOUND FACT — needs BOTH a business or trading name AND at least one contact route (phone, email, address, website). Both = present (a trading name without Ltd/Limited still counts). Only one — a company name with no contact route, or a bare mobile number with no business name — = ambiguous. A first name only with no business name and no contact = absent. A personal-style trading name that carries a trade descriptor ('M. HALLAM PLASTERING & RENDERING', 'Dave Smith Rendering') IS a business name — with a phone number beneath it that is PRESENT, never ambiguous. Silence is absent.",
      },
      {
        key: "quote_reference_number",
        label: "Quote or job reference number",
        criteria:
          "present only if an identifiable quote, estimate, job or invoice reference/number is given (e.g. 'Quote ref: PL-2214', 'Job No. 8841'). A date alone is NOT a reference. NEAR-MISS = ABSENT: 'quotation' as a heading with no number, 'our usual reference' — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "scope",
    name: "Scope",
    fields: [
      {
        key: "scope_type",
        label: "What kind of job this is (internal skim, internal re-plaster, board and skim, external render, external re-render, EWI render finish, patch repairs)",
        criteria:
          "present if the document names the actual type of job — internal skim over existing, internal re-plaster after hack-off, board and skim, dot-and-dab dry lining, external rendering, external re-render, render finish over EWI, or patch/localised repairs. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that refers to the job collectively or makes a quality claim without naming the type of work — 'your plastering project', 'we'll transform the place', 'a first-class job', 'full plastering works', 'the render package' — is ABSENT, NEVER ambiguous, however confident or repeated. Only a named job type moves this field off absent. Silence is absent.",
      },
      {
        key: "area_or_room_schedule",
        label: "Schedule of areas — which rooms/elevations, and how much area or how many walls/ceilings",
        criteria:
          "COMPOUND FACT — needs BOTH a quantity (m2, number of walls/ceilings, or number of rooms) AND the locations those quantities apply to. A bare total with no locations ('approx. 180m2 of plastering', 'walls and ceilings throughout') is AMBIGUOUS, not present — a homeowner cannot check a bare total. Present requires the quantities to be tied to locations, either as a room/elevation schedule ('lounge 4 walls + ceiling 26m2, hall/stairs/landing 31m2, rear elevation render 42m2') or a room-by-room list with areas or wall/ceiling counts. Locations named with no quantities at all ('lounge, hall and two bedrooms') = ambiguous. COLLECTIVE-NOUN RULE: 'the whole house', 'everywhere that needs doing', 'the full set of walls' state neither quantity nor per-location detail — ABSENT, never ambiguous. Silence is absent.",
      },
      {
        key: "existing_surface_removal_where_applicable",
        label: "Removal of existing surfaces — hacking off blown plaster or render, removing wallpaper, taking off old coatings, and disposal",
        criteria:
          "EITHER/OR FIELD — present if the document states EITHER removal/hacking off of existing plaster, render, wallpaper or coatings, OR an explicit statement that the existing surface is being left in place and worked over ('skim direct over existing sound plaster'). Explicit exclusion ('wallpaper to be stripped by customer before we start') is ALSO present — it is a stated scope decision. AMBIGUOUS: removal mentioned with no indication of what or where ('some hacking off may be needed'). NEAR-MISS = ABSENT: 'we leave the place tidy', 'clean and respectful tradesmen', 'we'll sort the mess out' name neither removal nor a leave-in-place decision — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "internal_plastering",
    name: "Internal Plastering",
    fields: [
      {
        key: "plaster_system_and_coats",
        label: "Internal plaster system and number of coats (skim, two-coat float and set, board and skim) with the coat count",
        criteria:
          "COMPOUND FACT — needs BOTH the system type (skim only, two-coat float and set, bonding + skim, hardwall + skim, board and skim, dot-and-dab + skim) AND the number of coats. Both = present ('two-coat work: Thistle Hardwall backing coat then two-coat skim finish' = present; 'board and skim, 3mm two-coat skim' = present). Only one half — a system with no coat count ('hardwall and skim') or a coat count with no system ('two coats applied') — = AMBIGUOUS. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'quality plastering throughout', 'a beautiful smooth finish', 'plastered to a high standard', 'skimmed out lovely', 'first-class plastering' name NO system and NO coat count — ABSENT, NEVER ambiguous, however confident or repeated. NO-REUSE: EXTERNAL render coats may NEVER evidence this internal field. Silence is absent.",
      },
      {
        key: "plasterboard_specification_where_applicable",
        label: "Plasterboard specification where boarding is included (board type, thickness, fixing method)",
        criteria:
          "present if the document specifies the board being used — type (standard wallboard, moisture-resistant, fire-rated/Fireline, acoustic, insulated/thermal laminate) AND/OR thickness (9.5mm, 12.5mm, 15mm) AND/OR fixing method (dot-and-dab adhesive, screwed to battens/studs at stated centres). Any TWO of type / thickness / fixing = present. Exactly ONE of the three ('12.5mm board' alone, 'boards dot-and-dabbed' alone) = AMBIGUOUS. An explicit statement that no boarding is included ('no boarding required — skim over existing plaster') = present, it is a stated scope decision. NEAR-MISS = ABSENT: 'boards supplied', 'we'll board it out', 'plasterboard as needed' name no type, thickness or fixing — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "surface_preparation_internal",
        label: "Internal surface preparation (PVA/bonding agent, sealing, scratching back, dubbing out, treating suction, repairing cracks before skimming)",
        criteria:
          "present if the document names an actual internal preparation activity — PVA/bonding agent applied, sealing high-suction backgrounds, dubbing out hollows, raking out and filling cracks, removing loose material, applying a bonding primer such as Thistle Bond-it, or scrim taping joints. NEAR-MISS = ABSENT (the near-miss rule wins — do NOT mark these ambiguous): preparation merely asserted with no activity named — 'walls will be properly prepared', 'prep included', 'we do a proper job', 'we never cut corners', 'everything done right' — is ABSENT, never ambiguous. AMBIGUOUS is reserved for a real named activity applied to only part of the work ('PVA to the lounge walls only, the rest as needed'). NO-REUSE: EXTERNAL background preparation (washing down brickwork, fungicidal wash, applying a render key coat) may NEVER evidence this internal field. Silence is absent.",
      },
      {
        key: "corner_and_edge_detail",
        label: "Internal corner and edge detail (angle beads, stop beads, arch beads, scrim tape to joints, reveals and window returns)",
        criteria:
          "present if the document names the actual corner/edge treatment — galvanised or stainless angle beads, thin-coat beads, stop beads, arch beads, plasterboard scrim tape to joints, or a stated treatment of reveals and window returns. NEAR-MISS = ABSENT (the near-miss rule wins — do NOT mark these ambiguous): edges referenced with no treatment named — 'corners will be neat and square', 'sharp edges throughout', 'a tidy finish', 'straight walls', 'no wonky corners' — is ABSENT, never ambiguous. AMBIGUOUS is reserved for a real named bead/tape applied to only part of the work ('angle beads to the hall corners, the rest as needed'). NO-REUSE: EXTERNAL beading (render stop beads, bellcast drip beads) may NEVER evidence this internal field — that belongs to movement_joints_and_beading_external. Silence is absent.",
      },
      {
        key: "drying_time_and_conditions",
        label: "Drying time and conditions before decorating (how long to dry, ventilation/heating guidance, when it can be painted, mist coat advice)",
        criteria:
          "present if the document states a drying period, a decorating wait, or the conditions required — 'allow 5-7 days before decorating', 'do not force dry with heaters', 'ventilate the rooms and keep heating low for the first week', 'mist coat only once the plaster is fully dry (pale pink throughout)'. HEDGING: 'approximately 4-7 days depending on conditions' = present (the figure survives). AMBIGUOUS: a drying requirement with no period and no conditions ('leave it to dry before you paint'). NEAR-MISS = ABSENT: 'it'll be ready in no time', 'dries quickly', 'you can crack on straight after' state no period and no conditions — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "external_rendering",
    name: "External Rendering",
    fields: [
      {
        key: "render_system_and_product",
        label: "External render system — named manufacturer AND specific product line — together with coat count or thickness",
        criteria:
          "CRITICAL COMPOUND FIELD. PRESENT requires BOTH of the following, together: (A) a NAMED MANUFACTURER AND SPECIFIC PRODUCT LINE — e.g. 'K-Rend K1 Scraped Texture', 'Weber weberpral M monocouche', 'Parex Monorex GM', 'Sto Silco K1.5' — AND (B) a coat count or a total/coat thickness (e.g. 'applied in two coats to 20mm total', '2 x 8mm coats'). A GENERIC RENDER CATEGORY IS NOT A PRODUCT LINE: 'silicone render', 'monocouche render', 'sand and cement render', 'thin-coat acrylic render', and a bare manufacturer name with no product line ('K-rend', 'Weber render') all FAIL half (A). This is the single most expensive gap in this category: a generic system name gives no verifiable coverage rate, so quantities cannot be checked against the product actually specified. AMBIGUOUS: a generic render category WITH coats/thickness but no manufacturer + product line ('silicone render, three coats, colour to be agreed') — however complete it otherwise sounds, this is AMBIGUOUS, never present. AMBIGUOUS also: a full manufacturer + product line with no coat count or thickness ('K-Rend K1 Scraped Texture applied to the rear elevation'). COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'premium render finish', 'top-quality render', 'the best render system on the market', 'a lovely rendered finish' name no manufacturer, no product line and no coats — ABSENT, NEVER ambiguous. NO-REUSE: INTERNAL plaster system/coat evidence may NEVER be used here. Silence is absent.",
      },
      {
        key: "render_coats_and_thickness",
        label: "Number of render coats and the thickness of each coat / total build-up",
        criteria:
          "COMPOUND FACT — needs BOTH the number of coats AND a thickness (per coat or total). Both = present ('base coat 6mm plus topcoat 9mm, 15mm total', '2 coats at 8mm each'). Only one half — coats with no thickness ('three coats of render') or a thickness with no coat count ('20mm render build-up') — = AMBIGUOUS. HEDGING: 'two coats, approx. 16mm total' = present (precision hedge beside a figure); 'coats and thickness as required by the substrate' = ambiguous (commitment hedge replacing the figure). NEAR-MISS = ABSENT: 'rendered properly', 'built up in layers', 'a good thick coat' state no count and no thickness — absent, not ambiguous. NO-REUSE: INTERNAL skim coat counts may NEVER evidence this external field. Silence is absent.",
      },
      {
        key: "background_preparation_external",
        label: "External background preparation (washing down, fungicidal wash, removing defective render, stabilising/priming, key or bonding coat, mesh/beads to substrate)",
        criteria:
          "present if the document names an actual external preparation activity — jet/wash down of the substrate, fungicidal or biocidal wash, hacking off defective render, raking out and repointing, applying a primer/stabiliser or a base/key coat, or fixing reinforcing mesh to the background. NEAR-MISS = ABSENT (the near-miss rule wins — do NOT mark these ambiguous): preparation merely asserted with no activity named — 'walls prepared before rendering', 'prep included', 'we do it properly', 'no shortcuts on the outside' — is ABSENT, never ambiguous. AMBIGUOUS is reserved for a real named activity applied to only part of the elevations ('rear elevation washed down, the side elevation as needed'). NO-REUSE: INTERNAL preparation (PVA, scrim tape, dubbing out) may NEVER evidence this external field. Silence is absent.",
      },
      {
        key: "insulation_or_ewi_integration_where_applicable",
        label: "Insulation / EWI integration where applicable (insulation board type and thickness, fixings, mesh basecoat, or an explicit statement that no insulation is included)",
        criteria:
          "present if the document either specifies the insulation build-up — board type (EPS, mineral wool, phenolic) AND/OR thickness (90mm, 100mm) AND/OR the fixing and mesh basecoat arrangement (at least TWO of these three) — OR explicitly states no insulation is included ('render direct to masonry, no EWI in this quote'). Exactly ONE of type / thickness / fixing-and-mesh = AMBIGUOUS. NEAR-MISS = ABSENT: 'it'll make the house warmer', 'thermally efficient render', 'insulating properties' name no board, no thickness, no fixing and make no exclusion — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "colour_and_finish_texture",
        label: "Render colour and finish texture (named colour or reference, and the texture — scraped, dashed, float, smooth, brushed)",
        criteria:
          "COMPOUND FACT — needs BOTH a colour (a named colour or manufacturer colour reference, e.g. 'Ivory', 'RAL 9010', 'K-Rend Bath Stone') AND a finish texture (scraped/scratched, dry dash/pebble dash, float, sponge float, smooth, brushed, tyrolean). Both = present. Only one half — 'scraped texture finish' with no colour, or 'Ivory' with no texture — = AMBIGUOUS. HEDGING: 'Bath Stone (final shade to be confirmed from the sample board), scraped texture' = present (both facts survive the hedge); 'colour to be agreed, finish as preferred' = ambiguous (both figures replaced). COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'a beautiful finish', 'premium render finish', 'a lovely smooth modern look', 'colour of your choice', 'finished to the highest standard' name NO colour and NO texture — ABSENT, NEVER ambiguous, however confident or repeated. Silence is absent.",
      },
      {
        key: "movement_joints_and_beading_external",
        label: "External movement joints and beading (movement/expansion joints, bellcast and drip beads, stop beads, corner beads, mesh reinforcement at openings)",
        criteria:
          "present if the document names the actual external detailing — movement/expansion joints at stated locations or centres, bellcast beads, drip beads, render stop beads, external corner/angle beads, or diagonal mesh reinforcement at window and door corners. NEAR-MISS = ABSENT (the near-miss rule wins — do NOT mark these ambiguous): beading referenced with nothing actually named — 'all necessary beads fitted', 'beading included', 'neat edges around the windows', 'crisp lines', 'a tidy job around the openings' — is ABSENT, never ambiguous. AMBIGUOUS is reserved for a real named bead or joint covering only part of the work ('bellcast beads to the rear only'). NO-REUSE: INTERNAL angle beads and scrim tape may NEVER evidence this external field. Silence is absent.",
      },
    ],
  },
  {
    key: "making_good",
    name: "Making Good",
    fields: [
      {
        key: "surrounding_area_protection",
        label: "Protection of surrounding areas (dust sheets, floor protection, masking, sheeting to windows/doors, covering paths, planting and driveways)",
        criteria:
          "present if the document names the actual protection measures — dust sheets, correx or hardboard floor protection, masking of windows and frames, polythene sheeting to doorways, dust barriers, or covering paths, patios, planting and vehicles outside. NEAR-MISS = ABSENT (the near-miss rule wins — do NOT mark these ambiguous): protection merely asserted with nothing named — 'everything will be protected', 'we take care of your property', 'clean and tidy workers', 'we respect your home', 'you won't know we've been' — is ABSENT, never ambiguous. AMBIGUOUS is reserved for a real named measure covering only part of the work ('dust sheets to the lounge, other rooms as needed'). Silence is absent.",
      },
      {
        key: "existing_feature_preservation_where_applicable",
        label: "Preservation of existing features where applicable (coving, cornice, ceiling roses, picture rails, skirtings, architraves, sockets and switches, external sills, vents and pipework)",
        criteria:
          "present if the document states how existing features are handled — coving/cornice retained and worked around, ceiling roses protected, skirtings and architraves left in place or removed and refitted, sockets and switches loosened and plastered around, external sills, air bricks, vents, meter boxes and downpipes removed and refitted or rendered around. An explicit statement that features are being removed and NOT reinstated is ALSO present — it is a stated scope decision. AMBIGUOUS: a specific existing feature NAMED but with no handling stated ('there is coving in the lounge'). NEAR-MISS = ABSENT (the near-miss rule wins): 'we'll be careful', 'nothing will get damaged', 'we work around everything' name no feature and no handling — ABSENT, never ambiguous. Silence is absent.",
      },
      {
        key: "post_work_cleanup",
        label: "Post-work cleanup and waste removal (clearing debris, removing bagged waste and old plaster/render from site, sweeping/vacuuming, skip provision)",
        criteria:
          "EITHER/OR FIELD — present if the document states EITHER that waste/debris is removed from site (skip provided, waste taken away, rubble removed) OR that the areas are cleaned down on completion (swept, vacuumed, floors washed off). Explicit exclusion ('customer to provide skip', 'waste left in the garden for your disposal') is ALSO present — it is a stated scope decision. NEAR-MISS = ABSENT (the near-miss rule wins — do NOT mark these ambiguous): cleanup implied with nothing stated about waste or cleaning — 'we finish up at the end of each day', 'we leave the place tidy', 'we'll sort the mess out', 'clean and respectful tradesmen' — is ABSENT, never ambiguous. AMBIGUOUS is reserved for waste or cleaning named for only part of the job. Silence is absent.",
      },
    ],
  },
  {
    key: "certifications_standards",
    name: "Certifications & Standards",
    fields: [
      {
        key: "building_regs_compliance_where_applicable",
        label: "Building Regulations / British Standard compliance where applicable (Part L thermal for EWI render, Part B fire for render systems above 11m or on flats, BS 8000-10 / BS EN 13914 workmanship standards)",
        criteria:
          "present only if the document names the actual standard or regulation part it is working to — 'Part L thermal upgrade, U-value 0.28 W/m2K achieved', 'Part B compliant A2-s1,d0 mineral wool system', 'plastering to BS 8000-10', 'rendering to BS EN 13914-1', or a stated building control notification/exemption. NEAR-MISS = ABSENT (the near-miss rule wins here): a bare compliance claim with no named part, standard or performance figure — 'all work meets Building Regulations', 'fully compliant', 'to current standards', 'we're fully qualified' — is ABSENT, not ambiguous. AMBIGUOUS: a named regulation or standard with no indication of which element of the work it applies to ('Part L applies to this work'). Silence is absent.",
      },
      {
        key: "manufacturer_system_warranty_where_applicable",
        label: "Manufacturer / system warranty where applicable (named system AND the warranty term), separate from any workmanship guarantee",
        criteria:
          "COMPOUND FACT — needs BOTH the named system or manufacturer the warranty attaches to AND the warranty term in years. Both = present ('K-Rend system, 15-year manufacturer warranty registered on completion', 'Weber 10-year system guarantee'). Only one half — a term with no named system ('10-year guarantee on the render'), or a named system with no term ('K-Rend approved applicator') — = AMBIGUOUS. NEAR-MISS = ABSENT: 'warranty included', 'fully guaranteed', 'all our work is guaranteed', 'peace of mind' name neither a system nor a term — absent, not ambiguous. NO-REUSE: a pure WORKMANSHIP guarantee with no manufacturer/system named does not satisfy the named-system half. Silence is absent.",
      },
    ],
  },
  {
    key: "price_vat_payment",
    name: "Price / VAT / Payment",
    fields: [
      {
        key: "total_price_and_breakdown",
        label: "Total price and how it breaks down",
        criteria:
          "present if the document gives a clear total price figure. A total alone IS present for this field — the breakdown strengthens it but is not required. AMBIGUOUS: a price range with no committed total ('somewhere between £4,000 and £6,000'), a day rate with no total, or a price stated only as 'from £X'. HEDGING: '£5,450 (subject to final measure on site)' = present (precision hedge beside a figure); 'price to be confirmed once we've seen it' = ambiguous. NEAR-MISS = ABSENT: 'very competitive rates', 'we won't be beaten on price', 'cheapest around' state no figure — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "vat_treatment",
        label: "VAT treatment — whether the price includes VAT, excludes VAT, or the trader is not VAT registered",
        criteria:
          "present if the document states the VAT position — 'price includes VAT at 20%', 'plus VAT', 'VAT no. 123 4567 89' shown with the total, or 'we are not VAT registered'. AMBIGUOUS: VAT mentioned with no position stated ('VAT may apply', 'VAT as applicable'). NEAR-MISS = ABSENT: 'all in', 'no hidden costs', 'the price is the price' state no VAT position — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "payment_schedule_and_stage_payments",
        label: "Payment schedule and stage payments (when money is due and against what)",
        criteria:
          "present if the document states when payments fall due — stage payments tied to milestones ('50% on completion of the boarding, balance on completion'), payment on completion, or stated payment terms ('payment within 7 days of invoice'). AMBIGUOUS: payment referenced with no timing ('staged payments apply', 'payment terms as discussed'). NEAR-MISS = ABSENT: 'we're flexible on payment', 'sort us out at the end' state no schedule and no term — absent, not ambiguous. NO-REUSE: a deposit alone does not evidence this field unless the remaining payments are also timed. Silence is absent.",
      },
      {
        key: "deposit_amount",
        label: "Deposit amount",
        criteria:
          "present if the document states a deposit as a figure or a percentage ('£500 deposit', '25% deposit on booking'), OR explicitly states no deposit is required ('no deposit taken'). AMBIGUOUS: a deposit required with no amount ('a deposit will be needed to book you in'). NEAR-MISS = ABSENT: 'a small amount up front helps us buy materials' states no figure and no percentage — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "timescale",
    name: "Timescale",
    fields: [
      {
        key: "start_date",
        label: "Start date or start window",
        criteria:
          "present if the document gives a start date or a dated start window ('starting 8 September', 'w/c 15 September', 'first two weeks of October'). HEDGING: 'approximately w/c 15 September, subject to the previous job' = present (the date survives). AMBIGUOUS: a start referenced with no date ('we can start soon', 'as soon as you give us the go-ahead', 'a few weeks out'). NEAR-MISS = ABSENT: 'we're keen to get going', 'we've got availability' state no date and no window — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "duration_or_completion_date",
        label: "Duration of the works or a completion date",
        criteria:
          "present if the document gives a duration ('4-5 working days', 'approximately 2 weeks on site') or a completion date. HEDGING: 'around 5 days depending on drying' = present (the figure survives). AMBIGUOUS: duration referenced with no figure ('it won't take long', 'we'll be in and out quickly', 'as long as it takes to do it right'). NEAR-MISS = ABSENT: 'we work fast', 'we don't hang about' state no duration and no date — absent, not ambiguous. NO-REUSE: drying/decorating wait times evidence drying_time_and_conditions, NOT this field, unless stated as the works duration. Silence is absent.",
      },
    ],
  },
];
