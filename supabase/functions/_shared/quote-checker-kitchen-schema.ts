// Kitchen V2 fixed-standard extraction schema (38 fields, 11 categories).
//
// Built on the same Pass 0/1/2 architecture proven on Landscaping/Driveway,
// Boiler/Heating, Bathroom, Electrical/Rewire and Extension. Where the subject
// genuinely overlaps with Bathroom (rip-out and waste, making good, plumbing
// and electrical interfaces, price/VAT/payment, timescales) the criteria are
// deliberately carried across rather than re-derived, so a kitchen quote and a
// bathroom quote are adjudicated to the same standard.
//
// Bug-class rules baked in from the start:
//   * NEAR-MISS = ABSENT — conversational wording that gestures at a topic
//     without naming the actual subject is absent, never ambiguous.
//   * COLLECTIVE-NOUN / QUALITY-CLAIM KILL — "quality units throughout",
//     "premium finish", "top-end appliances" carry zero specification and are
//     absent, never ambiguous.
//   * COMPOUND FACTS — both halves required; one half alone is ambiguous.
//   * PRECISION HEDGE vs COMMITMENT HEDGE — a hedge word beside a figure keeps
//     the field present; a hedge word replacing the figure is ambiguous.
//   * NO-REUSE stays narrow — evidence may be shared between fields about the
//     same subject; it may not be transferred between different subjects.

import type { CategoryDef } from "./quote-checker-schemas.ts";

export const KITCHEN_SCHEMA: CategoryDef[] = [
  {
    key: "quote_basics",
    name: "Quote Basics",
    fields: [
      {
        key: "customer_name_and_address",
        label: "Customer name and address",
        criteria:
          "COMPOUND FACT — needs BOTH a customer name AND a customer address (full address, street + town, or postcode). Both = present. Only one (a greeting such as 'Hi Sarah,' with no address, or an address with no named customer) = ambiguous. Neither = absent. NEAR-MISS = ABSENT: 'as discussed with yourselves', 'for your property' name no customer and no address — absent, not ambiguous.",
      },
      {
        key: "property_address_worked",
        label: "Address of the property where the kitchen is being installed",
        criteria:
          "present if the document states where the work happens — a site/installation address, or an explicit statement that the work address is the customer's address above ('works at the above address'). NO-REUSE (narrow): a customer correspondence address that is explicitly a different address from the work address does NOT evidence this field. AMBIGUOUS: a room named with no address at all ('your kitchen at home'). Silence is absent.",
      },
      {
        key: "quote_date_and_validity",
        label: "Quote date and how long the price is held",
        criteria:
          "COMPOUND FACT — needs BOTH a quote/issue date AND a validity or expiry period. SEARCH THE WHOLE DOCUMENT FOR BOTH HALVES: the date is usually in the header and validity is very often the closing line ('valid for 30 days'). Both anywhere in the document, however far apart = present. Only one half = ambiguous. Neither = absent. 'Prices subject to change' with no period is NOT a validity period. HEDGING: 'valid for approximately 30 days' = present (figure survives); 'valid for a short while' = ambiguous (figure replaced).",
      },
      {
        key: "trade_business_details",
        label: "Kitchen fitter / company name and contact details",
        criteria:
          "COMPOUND FACT — needs BOTH a business or trading name AND at least one contact route (phone, email, address, website). Both = present (a trading name without Ltd/Limited still counts). Only one — a company name with no contact route, or a bare mobile number with no business name — = ambiguous. A first name only with no business name and no contact = absent. Silence is absent.",
      },
      {
        key: "quote_reference_number",
        label: "Quote or job reference number",
        criteria:
          "present only if an identifiable quote, estimate, job or invoice reference/number is given (e.g. 'Quote ref: K-2291', 'Job No. 4471'). A date alone is NOT a reference. NEAR-MISS = ABSENT: 'quotation' as a heading with no number, 'our usual reference' — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "scope",
    name: "Scope",
    fields: [
      {
        key: "kitchen_scope_type",
        label: "What kind of kitchen job this is (full replacement, partial refit, doors/worktops only, new-build fit)",
        criteria:
          "present if the document names the actual type of kitchen job — full kitchen replacement, partial refit, doors-and-worktops-only refresh, new-build first fit, extension kitchen. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that refers to the job collectively or makes a quality claim without naming the type of job — 'your dream kitchen', 'the kitchen project', 'a first-class job', 'transform your space', 'full kitchen works' — is ABSENT, NEVER ambiguous, however confident or repeated. Only a named job type moves this field off absent. Silence is absent.",
      },
      {
        key: "existing_kitchen_removal_and_disposal",
        label: "Removal of the existing kitchen and disposal of the waste",
        criteria:
          "EITHER/OR FIELD — present if the document states EITHER strip-out/removal of the existing units, worktops, appliances or flooring, OR removal/disposal of the resulting waste (skip, tip runs, 'we take it all away'). One clear statement makes this present. Explicit exclusion ('skip to be provided by the customer', 'strip-out by others') is ALSO present — it is a stated scope decision. NEAR-MISS = ABSENT: 'we leave the place tidy', 'clean and respectful workers', 'we'll sort the mess out' name neither removal nor disposal — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "layout_change_or_like_for_like",
        label: "Whether the layout changes or the kitchen is replaced like-for-like",
        criteria:
          "present if the document states EITHER that the kitchen is going back in the same positions ('like-for-like', 'units in the existing layout', 'sink stays where it is') OR a specific layout change ('sink moves to the window wall', 'new island added', 'run extended along the back wall'). One qualifying statement = present. AMBIGUOUS: the layout is named as a subject but with no position stated — 'we'll sort the layout out with you', 'the new layout as discussed'. NEAR-MISS = ABSENT: 'full new kitchen', 'complete kitchen refurbishment' describe the job, not the layout — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "units_and_worktop",
    name: "Units and Worktop",
    fields: [
      {
        key: "unit_range_make_model",
        label: "Unit range — manufacturer and range/model name",
        criteria:
          "COMPOUND FACT — needs BOTH a manufacturer/supplier brand AND a specific range or door style name (e.g. 'Howdens Greenwich Shaker', 'Symphony Linear Gloss'). Both = present. Brand only ('Howdens units'), or a range name with no brand, = ambiguous. HEDGING: 'Howdens Greenwich or equivalent' still names a base spec — present; 'Howdens or similar' names no range — ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'quality units throughout', 'premium kitchen units', 'top-quality German units', 'branded units', 'the best units for the money' name no manufacturer AND no range — ABSENT, NEVER ambiguous, however confident. Silence is absent.",
      },
      {
        key: "unit_carcass_and_door_material",
        label: "Carcass and door construction / material",
        criteria:
          "COMPOUND FACT — needs BOTH the carcass construction (e.g. '18mm MFC carcasses', 'plywood carcasses') AND the door material or finish (e.g. 'painted solid oak doors', 'vinyl-wrapped MDF', 'gloss acrylic'). Both = present. Only one half = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'solidly built units', 'quality carcasses', 'hard-wearing doors', 'built to last' state no thickness, board type or door material — ABSENT, never ambiguous. Silence is absent.",
      },
      {
        key: "worktop_material_and_thickness",
        label: "Worktop material and thickness",
        criteria:
          "COMPOUND FACT — needs EXACTLY TWO THINGS AND NO MORE: (1) a named worktop material (laminate, solid oak, quartz, granite, Dekton, compact laminate) AND (2) a thickness figure (e.g. '38mm', '20mm quartz'). Both = present. BRAND, RANGE, COLOUR AND FINISH ARE NOT REQUIRED (this is the field's most common misread): '38mm laminate' is fully present — do NOT downgrade to ambiguous because no brand, range, colour, edge profile or supplier is named. Material with no thickness, or a thickness with no material, = ambiguous. HEDGING: 'approximately 30mm quartz' keeps the figure — present; 'a chunky worktop in a nice stone-effect' replaces both — see kill rule. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'quality worktops throughout', 'premium stone worktop', 'a lovely solid worktop', 'high-end surfaces' name neither material spec nor thickness — ABSENT, NEVER ambiguous. Silence is absent.",
      },
      {
        key: "handles_and_ironmongery",
        label: "Handles and ironmongery specified",
        criteria:
          "present if handles/knobs/ironmongery are specified by type, finish, range or a stated allowance ('brushed steel bar handles', 'handleless J-pull profile', '£150 handle allowance'), or explicitly excluded/customer-supplied. AMBIGUOUS: handles named as a subject with only a quality claim — 'nice handles', 'good quality ironmongery'. NEAR-MISS = ABSENT: 'handles fitted' in a bare scope list states only that they are in scope, with no type, finish, range or allowance — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "soft_close_hinges_drawers",
        label: "Soft-close hinges and drawer runners",
        criteria:
          "present if the document states soft-close (or a named drawer system such as 'Blum Tandembox', 'Blumotion hinges'), or explicitly states soft-close is NOT included / is an optional extra with a price. AMBIGUOUS: drawers/hinges named with a quality claim only — 'smooth-running drawers', 'good hinges'. NEAR-MISS = ABSENT: 'drawers fitted', 'hinges included' state scope only — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "appliances",
    name: "Appliances",
    fields: [
      {
        key: "appliance_list_and_models",
        label: "Which appliances are included, with makes/models",
        criteria:
          "COMPOUND FACT — needs BOTH the appliances named individually (oven, hob, extractor, fridge-freezer, dishwasher, washing machine) AND at least a make or model for them (e.g. 'Bosch Serie 4 HBS534BS0 single oven'). Both = present. Appliances named but with no make/model at all = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'all appliances included', 'quality branded appliances', 'top-end appliances throughout', 'a full appliance package', 'the appliances you need' name no individual appliance — ABSENT, NEVER ambiguous, whatever verb sits next to it. An explicit exclusion with the appliance named ('customer supplying the fridge-freezer') counts towards present. Silence is absent.",
      },
      {
        key: "integrated_vs_freestanding",
        label: "Whether appliances are integrated or freestanding",
        criteria:
          "THRESHOLD FIELD, NOT A COMPOUND FACT — present if the document states integrated/built-in/built-under or freestanding for AT LEAST ONE named appliance ('integrated dishwasher', 'freestanding range cooker', 'built-under double oven'). PARTIAL COVERAGE DOES NOT DOWNGRADE (this is the field's most common misread): once one appliance carries a designation, other appliances in the list left undesignated — an extractor hood, a hob, anything — are irrelevant to this field and NEVER make it ambiguous. Do NOT import the per-item completeness logic used by appliance_connection_gas_electric_water; that is a different field with a different rule. FORMAT IS IRRELEVANT: a bracketed or parenthetical designation ('Bosch SMV4HVX38G dishwasher (integrated)'), a table column, or a hyphenated suffix counts exactly the same as prose. AMBIGUOUS is reserved for one case only: the distinction is raised but left unanswered for every appliance — 'we'll confirm integrated or freestanding later', 'appliance type TBC'. NEAR-MISS = ABSENT: an appliance list with no integrated/freestanding wording anywhere — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "appliance_installation_included",
        label: "Whether fitting/installation of the appliances is included in the price",
        criteria:
          "present if the document states that appliance installation is included, excluded, chargeable, or by others ('all appliances fitted by us', 'appliance installation not included — by supplier'). AMBIGUOUS: 'appliances installed where possible', 'we'll fit what we can'. NEAR-MISS = ABSENT: naming or supplying appliances says nothing about who fits them — supply-only wording with no fitting statement is absent, not ambiguous. Silence is absent. NO-REUSE (narrow): evidence about connecting services (gas/electric/water) belongs to appliance_connection_gas_electric_water and does not by itself evidence this field.",
      },
      {
        key: "appliance_connection_gas_electric_water",
        label: "Gas, electrical and water connections for the appliances",
        criteria:
          "COMPOUND FACT, PER SERVICE — assess gas, electrical and water independently, but ONLY for services that the appliance list actually requires (a gas hob makes gas relevant; an all-electric kitchen does not). Every relevant service addressed = present. At least one relevant service addressed but another relevant one silent — e.g. electrical connections covered but nothing said about gas where a gas hob is listed — = AMBIGUOUS, not present, and not absent. No relevant service addressed = absent. Explicit exclusion of a service ('gas connection by a Gas Safe engineer arranged by the customer') counts as that service being addressed. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'everything connected up', 'all services sorted', 'we'll make it all work' name no service — ABSENT, never ambiguous.",
      },
    ],
  },
  {
    key: "plumbing",
    name: "Plumbing",
    fields: [
      {
        key: "sink_tap_specification",
        label: "Sink and tap specification",
        criteria:
          "COMPOUND FACT — needs BOTH the sink specified (type/material/bowl configuration or make and model) AND the tap specified (type, finish, or make and model). Both = present. Only one half = ambiguous. HEDGING: 'Franke Sirius 1.5 bowl or equivalent' = present. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'quality sink and tap', 'a nice modern tap', 'good sink included' specify neither — ABSENT, never ambiguous. NEAR-MISS = ABSENT: 'sink and tap fitted' in a bare scope list states scope only. Silence is absent.",
      },
      {
        key: "plumbing_first_and_second_fix",
        label: "Plumbing works — first fix pipework and second fix connections",
        criteria:
          "present if the document states specific plumbing work: pipework re-runs or first fix, moving or extending waste/supply, new isolation valves, second-fix connection of the sink/tap, or an explicit statement that no pipework moves ('all services stay in their current positions'). Any ONE of these = present — this is not a compound field. AMBIGUOUS: 'any pipework required', 'plumbing as needed'. NEAR-MISS = ABSENT: 'plumbing included', 'we do all the plumbing' name no work, re-run or position — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "dishwasher_washing_machine_connections",
        label: "Dishwasher / washing machine supply and waste connections",
        criteria:
          "present if the document states the supply and/or waste connection provision for a dishwasher or washing machine ('new appliance valve and standpipe for the dishwasher', 'washing machine waste tee'), or explicitly states none is required/included because no such appliance is in the kitchen. AMBIGUOUS: the appliance named with only a vague connection claim — 'dishwasher plumbed in as needed'. NEAR-MISS = ABSENT: an appliance list containing a dishwasher with no connection wording at all — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "electrical",
    name: "Electrical",
    fields: [
      {
        key: "socket_and_switch_positions",
        label: "Socket and switch quantities or positions",
        criteria:
          "present if the document states quantities or positions for sockets/switches ('6 new double sockets above the worktop', 'two switched fused spurs to the left of the sink'). A quantity alone or a position alone is enough — present. AMBIGUOUS: sockets named with no quantity and no position — 'new sockets where needed', 'sockets moved as required'. NEAR-MISS = ABSENT: 'electrics included', 'all electrical work carried out' name no socket or switch — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "under_cabinet_lighting",
        label: "Under-cabinet / plinth lighting",
        criteria:
          "present if under-cabinet, plinth or cabinet lighting is specified (type, quantity, or explicitly included/excluded/optional with a price). AMBIGUOUS: lighting named with a quality claim only — 'nice lighting under the units'. NEAR-MISS = ABSENT: ceiling or general room lighting wording does NOT evidence under-cabinet lighting (NO-REUSE — different subject) — absent. Silence is absent.",
      },
      {
        key: "consumer_unit_capacity_check",
        label: "Consumer unit capacity checked for the new circuits",
        criteria:
          "COMPOUND FACT — needs BOTH a spare-ways/capacity figure or explicit capacity statement (e.g. 'three spare ways available', 'board is full — upgrade required') AND confirmation of whether the existing consumer unit can take the new circuits. Both = present. Only one half — 'consumer unit checked', 'we've looked at the board', 'two spare ways' with no verdict on whether it will take the new circuits — = AMBIGUOUS, never present. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'your electrics are fine', 'no problems with the board' state neither capacity nor verdict against the new circuits — ABSENT. Silence is absent.",
      },
      {
        key: "appliance_circuit_provision",
        label: "Dedicated circuits provided for the appliances (cooker/oven/hob circuits)",
        criteria:
          "present if the document states circuit provision for appliances — a new cooker circuit, a dedicated radial for the oven, a 32A hob supply, or an explicit statement that existing circuits are being reused. AMBIGUOUS: circuits named with no appliance and no rating — 'new circuits as required'. NEAR-MISS = ABSENT: 'oven wired in', 'appliances connected' name no circuit — absent, not ambiguous (that evidence belongs to appliance_connection_gas_electric_water; NO-REUSE, different subject). Silence is absent.",
      },
    ],
  },
  {
    key: "flooring_and_finishes",
    name: "Flooring and Finishes",
    fields: [
      {
        key: "flooring_specification",
        label: "Floor covering specification",
        criteria:
          "present if the floor covering is specified by material/product ('Karndean Van Gogh LVT', 'porcelain floor tiles 600x600', 'engineered oak'), or explicitly excluded/by others/customer-supplied. AMBIGUOUS: material category named with nothing else and a vague qualifier — 'a good vinyl floor', 'tiled floor of your choosing'. NEAR-MISS = ABSENT: 'flooring included', 'new floor' state scope only, and 'we leave the floor spotless' names no covering — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "splashback_specification",
        label: "Splashback specification",
        criteria:
          "present if the splashback is specified by material/product or area ('6mm toughened glass splashback behind the hob', 'quartz upstand to match the worktop'), or explicitly excluded. AMBIGUOUS: splashback named with a quality claim only — 'a smart splashback'. NEAR-MISS = ABSENT: no mention of the splashback, or only general tiling wording (NO-REUSE — tiling_scope is a different subject unless the sentence names the splashback) — absent. Silence is absent.",
      },
      {
        key: "tiling_scope",
        label: "Wall tiling scope — which surfaces and how much",
        criteria:
          "COMPOUND FACT — needs BOTH which surfaces are tiled (walls, between worktop and wall units, full height) AND an extent (m2, linear metres, number of runs, 'the whole of the back wall'). Both = present. Only one — 'tiling included', 'walls tiled' with no extent — = ambiguous. HEDGING: 'approximately 8 m2 of wall tiling' keeps the figure — present. Explicit exclusion with the surfaces named ('no wall tiling — glass splashback only') = present. Neither part = absent.",
      },
    ],
  },
  {
    key: "making_good",
    name: "Making Good",
    fields: [
      {
        key: "wall_and_ceiling_making_good",
        label: "Making good to walls and ceilings after strip-out",
        criteria:
          "present if the document states specific making-good work to walls or ceilings — patching where old units came off, filling chases, repairing plasterboard, making good around new socket positions — or explicitly excludes it ('making good not included'). COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'we leave everything as we found it', 'finished to a high standard throughout', 'all made good', 'a tidy job all round', 'you won't know we've been' name no surface and no work — ABSENT, NEVER ambiguous, however confident. Silence is absent.",
      },
      {
        key: "plastering_scope",
        label: "Plastering / skimming scope",
        criteria:
          "present if the document states plastering or skimming work with a surface or extent ('skim the two run walls', 'patch plaster where the old units were', 'full re-skim of the kitchen ceiling'), or explicitly excludes plastering. AMBIGUOUS: plastering named as a subject with no surface or extent — 'plastering as required', 'any plastering needed'. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'walls left ready for decoration', 'a smooth finish throughout', 'proper plastering standard' name no plastering work or surface — ABSENT, never ambiguous. Silence is absent.",
      },
      {
        key: "decoration_scope",
        label: "Decoration — whether painting is included and to what extent",
        criteria:
          "present if the document states decoration included with an extent ('mist coat and two topcoats to the kitchen walls and ceiling'), or explicitly excludes decoration ('painting by others'). AMBIGUOUS: decoration named with no extent and no in/out answer — 'we can paint it if you want'. NEAR-MISS = ABSENT: 'left ready for your decorator' — that is a handover statement, not a decoration scope, unless it explicitly excludes decoration from the price. Silence is absent.",
      },
    ],
  },
  {
    key: "certifications",
    name: "Certifications",
    fields: [
      {
        key: "part_p_electrical_notification",
        label: "Part P notification / electrical certification",
        criteria:
          "COMPOUND FACT — needs a NAMED scheme or certificate, not a compliance claim: a competent-person scheme (NICEIC, NAPIT, ELECSA, STROMA), a Building Control notification route, or a named certificate to be issued (Electrical Installation Certificate, Minor Works Certificate, Part P certificate). Named scheme/certificate = present. AMBIGUOUS: 'all electrical work will be certified', 'notified to Building Control where required' — a certification promise with no scheme, certificate or route named. NEAR-MISS = ABSENT: 'all work to current regulations', 'fully compliant electrics', 'our electrician is qualified' — a compliance or competence claim with no scheme and no certificate — ABSENT, never ambiguous. Silence is absent.",
      },
      {
        key: "gas_safe_certification_where_applicable",
        label: "Gas Safe certification where gas work is involved",
        criteria:
          "APPLICABILITY FIRST — if the quote involves gas work (gas hob, gas cooker point, boiler or pipework alteration): needs a Gas Safe registration number, a named Gas Safe engineer/company, or a named certificate to be issued (Gas Safety Record / CP12). Named registration or certificate = present. AMBIGUOUS: 'gas work by a Gas Safe engineer' with no registration number or certificate named. NEAR-MISS = ABSENT: 'gas work done properly', 'fully qualified for gas' — ABSENT, never ambiguous. If the quote is explicitly all-electric with no gas appliance or gas work anywhere, an explicit statement to that effect ('no gas work — all-electric kitchen') = present; total silence in an all-electric quote = absent.",
      },
    ],
  },
  {
    key: "price_vat_payment",
    name: "Price, VAT and Payment",
    fields: [
      {
        key: "total_price_and_breakdown",
        label: "Total price and how it breaks down",
        criteria:
          "COMPOUND FACT — needs BOTH a total price figure AND a breakdown (line items, labour vs materials, per-element costs, or a units/worktop/appliances split). Both = present. A total with no breakdown, or line items with no total, = ambiguous. WHAT COUNTS AS A FIGURE (this is the field's most common misread): a money amount written in words or slang counts exactly the same as digits — 'fifteen grand', 'fifteen grand-ish', 'fifteen thousand pounds', 'circa 15k', '£15,000' are ALL figures. Do NOT treat a colloquial or spelled-out amount as 'no price given'. HEDGING: 'around £14,500 in total' keeps the figure — present; 'in the region of fifteen grand-ish, we'll firm it up' IS a stated figure with no line items = AMBIGUOUS, never absent. ABSENT is only for a document that states no monetary amount at all ('price on application', 'we'll cost it up later', silence). Neither = absent.",
      },
      {
        key: "vat_treatment",
        label: "VAT treatment",
        criteria:
          "present if the document states whether the price includes or excludes VAT, gives a VAT amount or rate, states the business is not VAT registered, or gives a VAT registration number. NEAR-MISS = ABSENT: 'all costs covered', 'no hidden extras' say nothing about VAT — absent, not ambiguous. AMBIGUOUS: VAT named without an answer — 'VAT to be confirmed'. Silence is absent.",
      },
      {
        key: "payment_schedule_and_stage_payments",
        label: "Payment schedule / stage payments",
        criteria:
          "COMPOUND FACT — needs BOTH the stages/timing named (on order, on delivery of units, on completion, weekly) AND an amount or percentage against them. Both = present. Stages with no amounts, or amounts with no timing, = ambiguous. HEDGING: 'roughly 40% on delivery' keeps the figure — present; 'staged payments as we go' has neither = ambiguous only if payment staging is named at all. NEAR-MISS = ABSENT: 'payment on the usual terms', 'we'll sort payment out' name no stage and no amount — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "deposit_amount",
        label: "Deposit amount",
        criteria:
          "present if a deposit figure or percentage is stated, or the document explicitly states no deposit is required. HEDGING: 'a deposit of about £2,000' keeps the figure — present; 'a small deposit up front' replaces the figure — ambiguous. NEAR-MISS = ABSENT: 'payment terms as agreed' names no deposit — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "timescale",
    name: "Timescale",
    fields: [
      {
        key: "start_date",
        label: "Start date",
        criteria:
          "present if a start date or a datable start window is given ('starting 14 April', 'week commencing 6 May', 'start in the first week of June'). HEDGING: 'we should be able to start around 14 April' keeps the date — present; 'we'll start as soon as we can', 'start in the next few weeks' replace the date — ambiguous. NEAR-MISS = ABSENT: 'we're keen to get going' names no start at all — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "duration_or_completion_date",
        label: "Duration or completion date",
        criteria:
          "present if a duration figure ('10 working days', '3 weeks on site') or a completion date is given. HEDGING: 'approximately 3 weeks' keeps the figure — present; 'it won't take long', 'a few weeks' replace it — ambiguous. NEAR-MISS = ABSENT: 'we work efficiently', 'we don't hang about' name no duration — absent, not ambiguous. NO-REUSE (narrow): a start date alone does not evidence duration. Silence is absent.",
      },
    ],
  },
];
