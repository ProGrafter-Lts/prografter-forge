// Roofing V2 fixed-standard extraction schema (42 fields, 14 categories).
//
// Same Pass 0/1/2 architecture proven on Landscaping/Driveway, Boiler/Heating,
// Bathroom, Electrical/Rewire, Extension and Kitchen. Shared subjects
// (quote basics, price/VAT/payment, timescale, making good) are deliberately
// carried across word-for-word rather than re-derived, so a roofing quote is
// adjudicated to the same standard as every other category.
//
// ROOFING-SPECIFIC ADDITION — the fourth extraction state "not_applicable":
//   scope.roof_type_and_pitch decides which branch of the covering/structure
//   fields is in play. On a FLAT roof quote the pitched-only fields
//   (roof_structure_type, timber_treatment_or_replacement, ventilation_provision,
//   tile_or_slate_type_and_matching, underlay_specification, batten_specification,
//   ridge_hip_valley_detail) are "not_applicable", NOT absent. On a PITCHED roof
//   quote the flat-only fields (flat_roof_membrane_type, falls_and_drainage_strategy,
//   insulation_specification_flat, parapet_or_upstand_detail) are "not_applicable".
//   Fields marked not_applicable are excluded from the completeness score
//   entirely (see score-quote), so neither branch is penalised for the other's
//   subject matter.
//
// Bug-class rules baked in from the start:
//   * NEAR-MISS = ABSENT — wording that gestures at a topic without naming the
//     field's own subject is absent, never ambiguous.
//   * COLLECTIVE-NOUN / QUALITY-CLAIM KILL — "quality tiles to match",
//     "premium membrane", "new guttering throughout", "properly leaded" carry
//     zero specification and are ABSENT, never ambiguous.
//   * COMPOUND FACTS — both halves required; one half alone is ambiguous.
//   * PRECISION HEDGE vs COMMITMENT HEDGE — a hedge beside a figure keeps the
//     field present; a hedge replacing the figure is ambiguous.
//   * NO-REUSE stays narrow, and is especially important here: pitched and
//     flat fields share vocabulary ("covering", "insulation", "drainage").
//     Evidence about the flat roof section of a job must never be used to score
//     a pitched-branch field, and vice versa.

import type { CategoryDef } from "./quote-checker-schemas.ts";

const NA_PITCHED_ONLY =
  "BRANCH FIELD (pitched roofs only). FIRST read scope.roof_type_and_pitch. If the quote is for a FLAT roof only, mark this field \"not_applicable\" with quote null — NOT absent. If the quote covers a pitched roof (or a mixed pitched-and-flat job), adjudicate it normally using the rule below. NO-REUSE: evidence that plainly describes the FLAT roof element of a mixed job must NOT be used to satisfy this pitched-branch field.";

const NA_FLAT_ONLY =
  "BRANCH FIELD (flat roofs only). FIRST read scope.roof_type_and_pitch. If the quote is for a PITCHED roof only, mark this field \"not_applicable\" with quote null — NOT absent. If the quote covers a flat roof (or a mixed pitched-and-flat job), adjudicate it normally using the rule below. NO-REUSE: evidence that plainly describes the PITCHED roof element of a mixed job must NOT be used to satisfy this flat-branch field.";

export const ROOFING_SCHEMA: CategoryDef[] = [
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
        label: "Address of the property whose roof is being worked on",
        criteria:
          "present if the document states where the work happens — a site/works address, or an explicit statement that the work address is the customer's address above ('works at the above address'). NO-REUSE (narrow): a customer correspondence address that is explicitly a DIFFERENT address from the work address does NOT evidence this field. NEAR-MISS = ABSENT: a building element referred to with no address anywhere in the document — 'your roof at home', 'the property in question' — is ABSENT, never ambiguous. AMBIGUOUS is reserved for a partial address that does not identify the property (e.g. a town or postcode district only, 'the works in Beeston'). Silence is absent.",
      },
      {
        key: "quote_date_and_validity",
        label: "Quote date and how long the price is held",
        criteria:
          "COMPOUND FACT — needs BOTH a quote/issue date AND a validity or expiry period. SEARCH THE WHOLE DOCUMENT FOR BOTH HALVES: the date is usually in the header and validity is very often the closing line ('valid for 30 days'). Both anywhere in the document, however far apart = present. Only one half = ambiguous. Neither = absent. 'Prices subject to change' with no period is NOT a validity period. HEDGING: 'valid for approximately 30 days' = present (figure survives); 'valid for a short while' = ambiguous (figure replaced).",
      },
      {
        key: "trade_business_details",
        label: "Roofer / company name and contact details",
        criteria:
          "COMPOUND FACT — needs BOTH a business or trading name AND at least one contact route (phone, email, address, website). Both = present (a trading name without Ltd/Limited still counts). Only one — a company name with no contact route, or a bare mobile number with no business name — = ambiguous. A first name only with no business name and no contact = absent. Silence is absent.",
      },
      {
        key: "quote_reference_number",
        label: "Quote or job reference number",
        criteria:
          "present only if an identifiable quote, estimate, job or invoice reference/number is given (e.g. 'Quote ref: R-2291', 'Job No. 4471'). A date alone is NOT a reference. NEAR-MISS = ABSENT: 'quotation' as a heading with no number, 'our usual reference' — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "scope",
    name: "Scope",
    fields: [
      {
        key: "roof_scope_type",
        label: "What kind of roofing job this is (full re-roof, partial strip and recover, repair, new roof, overlay)",
        criteria:
          "present if the document names the actual type of roofing job — full re-roof / strip and re-cover, partial re-roof to one elevation, localised repair, new roof to an extension, overlay of an existing flat roof. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that refers to the job collectively or makes a quality claim without naming the type of job — 'roofing works', 'the roof project', 'sort your roof out', 'a first-class job', 'full roofing package' — is ABSENT, NEVER ambiguous, however confident or repeated. Only a named job type moves this field off absent. Silence is absent.",
      },
      {
        key: "roof_type_and_pitch",
        label: "Roof type (pitched or flat) and, for pitched roofs, the pitch or roof form",
        criteria:
          "EXTRACT THIS FIELD FIRST — it decides which branch fields are not_applicable. present if the document states the roof type in a way that identifies pitched or flat — 'pitched gable roof', 'hipped tiled roof', 'flat roof to the rear extension', 'mono-pitch', 'a pitch of 35 degrees' — or names a covering that is unambiguously one or the other (concrete tiles, natural slate = pitched; EPDM, GRP, felt, single-ply = flat). A stated pitch angle or roof form on a pitched roof is a bonus, not a requirement: naming 'pitched' or 'flat' clearly is enough for present. AMBIGUOUS: the roof is discussed with neither type nor an identifying covering named ('the main roof', 'the roof over the back'). Silence is absent — and if this field is absent or ambiguous, treat the job as PITCHED (the majority case) for branch purposes and adjudicate the flat-only fields as not_applicable.",
      },
      {
        key: "existing_roof_removal_and_disposal",
        label: "Stripping the existing roof covering and disposing of the waste",
        criteria:
          "EITHER/OR FIELD — present if the document states EITHER stripping/removal of the existing covering, battens, felt or membrane, OR removal/disposal of the resulting waste (skip, tip runs, 'all waste taken away'). One clear statement makes this present. Explicit exclusion ('skip supplied by customer', 'strip-out by others') is ALSO present — it is a stated scope decision. NEAR-MISS = ABSENT: 'we leave the site tidy', 'clean and respectful workers', 'we'll clear up after ourselves' name neither stripping nor disposal — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "structure_pitched",
    name: "Structure (Pitched Roofs)",
    fields: [
      {
        key: "roof_structure_type",
        label: "Roof structure — cut roof, trussed rafters, or existing structure retained",
        criteria: `${NA_PITCHED_ONLY} RULE: present if the document names the structural form — 'existing cut roof retained', 'new trussed rafters at 600mm centres', 'rafters and purlins', 'attic trusses'. AMBIGUOUS is reserved for a named structural form that is hedged or conditional — 'trusses or a cut roof depending on what we find'. NEAR-MISS = ABSENT: wording that names no structural form at all — 'we'll check the timbers', 'structure as required', 'strip and re-cover', 'new roof' — is ABSENT, never ambiguous. Silence is absent.`,
      },
      {
        key: "timber_treatment_or_replacement",
        label: "Treatment or replacement of defective roof timbers",
        criteria: `${NA_PITCHED_ONLY} RULE: present if the document states EITHER treatment of the timbers (named treatment or spray) OR replacement of defective rafters/purlins/wall plates, INCLUDING a priced or itemised provisional allowance ('allow for replacing up to 6 rafters at £45 each'). An open-ended 'any rotten timbers replaced at extra cost, price TBC' with no rate or allowance = ambiguous. NEAR-MISS = ABSENT: 'we'll take a look once we're up there', 'we'll let you know if there are any problems' commit to nothing about treatment or replacement — absent, not ambiguous. Silence is absent.`,
      },
      {
        key: "ventilation_provision",
        label: "Roof void ventilation provision (ridge, eaves or tile vents)",
        criteria: `${NA_PITCHED_ONLY} RULE: present if the document names an actual ventilation method or product — 'dry ridge vent system', '10mm continuous eaves vents', 'four tile vents to the rear slope', 'breathable underlay providing ventilation to BS 5250'. AMBIGUOUS is reserved for a named method that is hedged or conditional — 'tile vents fitted where needed', 'dry ridge vent if required'. NEAR-MISS = ABSENT: wording that names no method at all — 'the roof will be ventilated', 'adequate ventilation provided', 'the roof will breathe', 'no condensation issues' — is ABSENT, never ambiguous. NO-REUSE: eaves ventilation evidence may legitimately serve both this field and eaves_ventilation (same subject); it may not be transferred to insulation fields. Silence is absent.`,
      },
    ],
  },
  {
    key: "covering_pitched",
    name: "Covering (Pitched Roofs)",
    fields: [
      {
        key: "tile_or_slate_type_and_matching",
        label: "Tile or slate type and how it matches the existing roof",
        criteria: `${NA_PITCHED_ONLY} RULE: COMPOUND-LEANING FIELD — present if the document names a SPECIFIC covering product: a manufacturer and/or model ('Marley Modern concrete interlocking tiles', 'Spanish natural slate 500x250mm', 'Redland Cambrian slate'), or a named material with a size/format. A matching statement ('to match existing') alongside a named product strengthens it but is not required. Naming ONLY the generic material with nothing else ('concrete tiles', 'slates') = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'quality tiles to match', 'premium slates', 'best tiles for the job', 'top-grade covering', 'new tiles throughout' name no manufacturer, model, size or format — ABSENT, NEVER ambiguous, however confident or repeated. Silence is absent.`,
      },
      {
        key: "underlay_specification",
        label: "Roofing underlay / breather membrane specification",
        criteria: `${NA_PITCHED_ONLY} RULE: present if the document names an underlay product or type — 'Klober Permo Air breathable membrane', 'Type 1F reinforced bitumen felt', 'breathable membrane to BS 5534'. AMBIGUOUS: underlay named as a subject with no type — 'new underlay throughout', 'felt replaced'. NEAR-MISS = ABSENT: 'the roof will be watertight', 'fully waterproofed' name no underlay — absent, not ambiguous. Silence is absent.`,
      },
      {
        key: "batten_specification",
        label: "Batten specification (size, grade or standard)",
        criteria: `${NA_PITCHED_ONLY} RULE: present if the document states a batten size, grade or standard — '25x50mm treated graded battens to BS 5534', 'BS 5534 graded battens', '38x25 tanalised battens'. AMBIGUOUS: battens named with no size, grade or standard — 'new battens', 'battens replaced as needed'. NEAR-MISS = ABSENT: 'all new timber where required' names no battens — absent, not ambiguous. Silence is absent.`,
      },
      {
        key: "ridge_hip_valley_detail",
        label: "Ridge, hip and valley detailing (dry-fix or bedded/mortar)",
        criteria: `${NA_PITCHED_ONLY} RULE: present if the document states how ridges, hips or valleys are finished — 'dry ridge and dry hip system', 'ridge tiles bedded in 3:1 sand/cement with mechanical fixing', 'GRP valley troughs'. One named method for any of ridge, hip or valley = present (EITHER/OR). AMBIGUOUS: 'ridge tiles re-bedded as required', 'hips and ridges attended to' name the subject with no method. NEAR-MISS = ABSENT: 'all finished neatly', 'a proper job at the top' — absent, not ambiguous. Silence is absent.`,
      },
    ],
  },
  {
    key: "covering_flat",
    name: "Covering (Flat Roofs)",
    fields: [
      {
        key: "flat_roof_membrane_type",
        label: "Flat roof membrane / covering type and system",
        criteria: `${NA_FLAT_ONLY} RULE: present if the document names a SPECIFIC flat roof system — 'Firestone RubberCover EPDM 1.14mm', 'three-layer torch-on felt (IKO Permaphalt)', 'GRP fibreglass with 450g chopped strand mat', 'Sika Sarnafil single-ply'. A named system type with a named manufacturer or thickness/build-up = present. Naming ONLY the generic material ('EPDM', 'felt roof') = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'premium membrane', 'high-quality flat roof covering', 'the best rubber roof on the market', 'a proper long-life covering' name no system, manufacturer or build-up — ABSENT, NEVER ambiguous. Silence is absent.`,
      },
      {
        key: "falls_and_drainage_strategy",
        label: "Falls to the flat roof and where the water discharges",
        criteria: `${NA_FLAT_ONLY} RULE: present if the document states a fall/gradient (e.g. '1:80 firring pieces to fall', 'tapered insulation to achieve 1:60') OR names the discharge route for the flat roof ('discharging to a new outlet and downpipe at the rear corner'). One of the two clearly stated = present (EITHER/OR); both is stronger but not required. AMBIGUOUS: falls or drainage named with no gradient and no route — 'laid to falls', 'water will run off properly'. NEAR-MISS = ABSENT: 'no more ponding', 'it won't leak again' — absent, not ambiguous. NO-REUSE: pitched-roof guttering or downpipe evidence does NOT satisfy this flat-branch field.`,
      },
      {
        key: "insulation_specification_flat",
        label: "Flat roof insulation specification (warm or cold deck, product and thickness)",
        criteria: `${NA_FLAT_ONLY} RULE: COMPOUND FACT — needs BOTH an insulation product or deck type ('warm deck PIR', 'Kingspan Thermaroof TR27', 'cold deck mineral wool between joists') AND a thickness or U-value figure ('120mm', 'achieving 0.18 W/m²K'). Both = present. Only one half = ambiguous. HEDGING: 'approximately 120mm PIR' keeps the figure — present. NEAR-MISS = ABSENT: 'fully insulated', 'insulated to current standards' name no product and no figure — absent, not ambiguous. NO-REUSE: loft insulation evidence in the pitched branch does NOT satisfy this field.`,
      },
      {
        key: "parapet_or_upstand_detail",
        label: "Parapet, upstand and abutment detailing at the flat roof edges",
        criteria: `${NA_FLAT_ONLY} RULE: present if the document states how the edges are detailed — 'membrane dressed 150mm up the abutment and terminated under a new lead cover flashing', 'GRP trims to all edges', 'new parapet capping'. AMBIGUOUS: edges/upstands named with no detail — 'all edges finished', 'upstands as required'. NEAR-MISS = ABSENT: 'sealed all round', 'watertight junctions' — absent, not ambiguous. Silence is absent.`,
      },
    ],
  },
  {
    key: "insulation_and_ventilation",
    name: "Insulation and Ventilation",
    fields: [
      {
        key: "loft_insulation_upgrade_where_applicable",
        label: "Loft insulation upgrade, or an explicit statement that it is not included",
        criteria:
          "EITHER/OR FIELD — present if the document states an insulation upgrade with a product or depth ('300mm mineral wool laid in the loft'), OR explicitly excludes it ('loft insulation not included in this price'). A stated exclusion is present — it is a scope decision. AMBIGUOUS: insulation named with neither depth/product nor exclusion — 'we'll top up the loft insulation'. NEAR-MISS = ABSENT: 'the house will be warmer' names no insulation work — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "roof_insulation_u_value",
        label: "Roof insulation U-value and confirmation it meets the current Building Regulations target",
        criteria:
          "COMPOUND FACT — needs BOTH (1) a U-value figure (e.g. '0.15 W/m²K', 'U-value of 0.18') AND (2) confirmation it meets the current Building Regulations / Part L target for the roof. Both = present. A U-value figure with no regs confirmation, OR 'insulated to current Building Regulations' with no figure, = ambiguous — 'insulated to regs' alone is NOT present. Neither = absent. NEAR-MISS = ABSENT: 'fully insulated', 'thermally efficient', 'a warm roof' state neither figure nor standard — absent, not ambiguous.",
      },
      {
        key: "eaves_ventilation",
        label: "Ventilation at the eaves",
        criteria:
          "present if the document names an eaves ventilation provision — '10mm continuous eaves vent strip', 'over-fascia vents to all eaves', 'eaves ventilation trays fitted between rafters'. AMBIGUOUS: eaves ventilation named as a subject with no product or size — 'eaves will be vented'. NEAR-MISS = ABSENT: 'the roof will breathe', 'good airflow' name no eaves provision — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "guttering_and_rainwater",
    name: "Guttering and Rainwater",
    fields: [
      {
        key: "guttering_specification",
        label: "Guttering specification (profile, material, size or make)",
        criteria:
          "present if the document specifies the guttering by profile, material, size or make — '112mm half-round black uPVC guttering', 'Brett Martin Deepflow', 'cast aluminium ogee gutters'. AMBIGUOUS: guttering named with a partial spec only — 'black guttering', 'uPVC gutters' with no profile or size. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'new guttering throughout', 'quality guttering', 'premium rainwater goods', 'all new gutters and downpipes as needed' name no profile, material spec, size or make — ABSENT, NEVER ambiguous. Silence is absent.",
      },
      {
        key: "downpipe_specification",
        label: "Downpipe specification (size, material or positions)",
        criteria:
          "present if the document specifies downpipes by size, material or stated positions — '68mm round black uPVC downpipes to two rear corners'. AMBIGUOUS: downpipes named with none of size, material or position — 'downpipes replaced'. NEAR-MISS = ABSENT: 'rainwater dealt with', 'water taken away from the building' name no downpipe — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "fascia_soffit_specification",
        label: "Fascia and soffit specification, or an explicit statement they are not included",
        criteria:
          "COMPOUND-LEANING FIELD — present if the document specifies fascias AND soffits by material/finish ('new 16mm white uPVC fascia boards and vented soffits'), or explicitly excludes them ('fascias and soffits not included'). Only one of the two named with a spec = ambiguous. AMBIGUOUS also: 'new fascias and soffits' with no material or finish. NEAR-MISS = ABSENT: 'the roof edge will be tidied up' — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "flashings_and_weatherproofing",
    name: "Flashings and Weatherproofing",
    fields: [
      {
        key: "lead_flashing_specification",
        label: "Lead (or alternative) flashing specification — code/thickness and where it is used",
        criteria:
          "COMPOUND FACT — needs BOTH (1) the flashing material with its code or thickness ('Code 4 lead', 'Code 5 milled lead', 'a Code 4-equivalent lead substitute') AND (2) where it is applied ('to the front abutment', 'all abutments and the chimney'). Both = present. Material with no code and no location, or a location with no material spec, = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'properly leaded', 'quality lead work', 'all lead renewed', 'new leadwork throughout' name no code, thickness or location — ABSENT, NEVER ambiguous. Silence is absent.",
      },
      {
        key: "chimney_flashing_where_applicable",
        label: "Chimney flashing — material and method",
        criteria:
          "COMPOUND FACT — needs BOTH the flashing material AND the method at the chimney ('Code 4 lead front apron, stepped soakers and chased-in cover flashing, pointed in sand/cement'). Both = present. 'Chimney flashed' or 'chimney re-leaded' names the subject with no material AND no method — ambiguous, not present. An explicit statement that the property has no chimney, or that chimney work is excluded, is ALSO present (a stated scope decision). NEAR-MISS = ABSENT: 'the chimney will be made good', 'no more leaks around the stack' — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "valley_flashing_where_applicable",
        label: "Valley flashing — material and method",
        criteria:
          "COMPOUND FACT — needs BOTH the valley material AND the method ('new GRP valley troughs bedded on treated valley boards', 'Code 5 lead valley laid in 1.5m lengths with 150mm laps'). Both = present. 'Valleys renewed' or 'new valleys' names the subject with no material AND no method — ambiguous, not present. An explicit statement that the roof has no valleys, or that valley work is excluded, is ALSO present. NEAR-MISS = ABSENT: 'the roof junctions will be sorted' — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "roof_lights_and_penetrations",
    name: "Roof Lights and Penetrations",
    fields: [
      {
        key: "roof_light_or_skylight_provision",
        label: "Roof lights / skylights — make, size and number, or an explicit statement none are included",
        criteria:
          "present if the document names roof light provision with make, size or quantity ('2no. Velux GGL MK04 fitted to the rear slope'), or explicitly excludes roof lights ('no roof lights included'). AMBIGUOUS: roof lights named with none of make, size or quantity — 'a skylight fitted'. NEAR-MISS = ABSENT: 'more natural light' names no roof light — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "vent_pipe_and_penetration_detail",
        label: "How soil vent pipes, flues and other penetrations are weathered",
        criteria:
          "present if the document states how penetrations are weathered — 'new lead slates to the SVP', 'Ubbink flashing collars to all pipe penetrations'. AMBIGUOUS: penetrations named with no detail — 'pipes re-flashed', 'vents sorted'. NEAR-MISS = ABSENT: 'all made watertight' names no penetration detail — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "scaffold_and_access",
    name: "Scaffold and Access",
    fields: [
      {
        key: "scaffold_provision",
        label: "Scaffolding — included, excluded, or by whom, with duration or cost where stated",
        criteria:
          "EITHER/OR FIELD — present if the document states scaffolding is included in the price, priced separately with a figure, or explicitly excluded / by others. One clear statement = present. AMBIGUOUS: scaffold named with no position — 'scaffolding as required', 'scaffold may be needed'. NEAR-MISS = ABSENT: 'we'll get access sorted', 'we work safely at height' name no scaffold position — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "access_and_safety_arrangements",
        label: "Site access and safety arrangements",
        criteria:
          "present if the document states an access or safety arrangement — 'edge protection and debris netting to the scaffold', 'access via the side gate, driveway to be kept clear', 'RAMS supplied before start'. AMBIGUOUS: access or safety named with no arrangement — 'access to be agreed'. NEAR-MISS = ABSENT: 'we're fully insured', 'safety is our priority', 'experienced roofers' name no arrangement — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "making_good",
    name: "Making Good",
    fields: [
      {
        key: "internal_ceiling_making_good_where_applicable",
        label: "Internal making good to ceilings and decoration, or an explicit statement it is excluded",
        criteria:
          "EITHER/OR FIELD — present if the document states internal making good ('any plasterboard disturbed will be re-boarded, skimmed and left ready for decoration') OR explicitly excludes it ('internal decoration not included'). One clear statement = present. AMBIGUOUS: making good named with no position — 'we'll make good inside where needed'. NEAR-MISS = ABSENT: 'we leave the house clean' names no making good — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "external_making_good",
        label: "External making good — pointing, render, brickwork and grounds left as found",
        criteria:
          "EITHER/OR FIELD — present if the document states external making good ('chimney re-pointed where flashings are chased in', 'driveway and lawn cleared of all debris and left as found'). AMBIGUOUS: making good named with no position — 'we'll make good outside'. NEAR-MISS = ABSENT: 'we leave the site tidy' on its own names no making good of the building fabric or grounds — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "certifications",
    name: "Certifications and Guarantees",
    fields: [
      {
        key: "building_control_notification_where_applicable",
        label: "Building Control notification route and confirmation it will be submitted",
        criteria:
          "COMPOUND FACT — needs BOTH (1) a named notification route (local authority Building Control full plans/building notice, or a competent person scheme such as CompetentRoofer) AND (2) confirmation it will actually be submitted/registered and by whom, or a certificate issued. Both = present. A route named with no confirmation of submission ('this is notifiable under Building Regulations'), or 'we'll notify Building Control' with no route, = ambiguous. An explicit, reasoned statement that the work is NOT notifiable (e.g. a repair under 25% of the roof area) is ALSO present. NEAR-MISS = ABSENT: 'all work to Building Regulations standard', 'fully compliant' name no notification route and no submission — absent, not ambiguous.",
      },
      {
        key: "warranty_or_insurance_backed_guarantee",
        label: "Workmanship guarantee or insurance-backed guarantee, with a period",
        criteria:
          "COMPOUND-LEANING FIELD — present if the document states a guarantee/warranty WITH a period ('10-year workmanship guarantee', '20-year insurance-backed guarantee via the manufacturer'). AMBIGUOUS: a guarantee named with no period — 'fully guaranteed', 'guaranteed workmanship'. NEAR-MISS = ABSENT: 'we stand by our work', 'you're in safe hands', 'we've never had a callback' name no guarantee — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "price_vat_payment",
    name: "Price, VAT and Payment",
    fields: [
      {
        key: "total_price_and_breakdown",
        label: "Total price for the works",
        criteria:
          "present if a total price figure for the works is stated. A FIGURE IN WORDS OR COLLOQUIAL FORM COUNTS AS A FIGURE: 'fifteen grand', 'eight thousand pounds', 'ten K' are all specific amounts — present. A line-by-line breakdown is NOT required. HEDGING: 'approximately £9,400' keeps the figure — present; 'somewhere in the region of ten to fifteen grand' with no single committed figure = ambiguous. NEAR-MISS = ABSENT: 'a fair price', 'competitive rates', 'cheaper than the others' state no amount — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "vat_treatment",
        label: "VAT treatment — inclusive, exclusive, exempt, not registered, or a VAT number given",
        criteria:
          "present if the document states VAT is included, excluded, zero-rated/exempt, that the business is not VAT registered, or gives a VAT registration number. AMBIGUOUS: VAT named with no position — 'VAT to be confirmed'. Silence is absent — do NOT infer VAT status from a round total.",
      },
      {
        key: "payment_schedule_and_stage_payments",
        label: "Payment schedule / stage payments",
        criteria:
          "present if the document sets out when payments fall due — 'deposit on order, 50% on completion of stripping, balance within 7 days of completion', 'payment on completion'. AMBIGUOUS: payment terms named with no timing — 'payment terms as usual', 'stage payments to be agreed'. Silence is absent.",
      },
      {
        key: "deposit_amount",
        label: "Deposit amount or percentage",
        criteria:
          "present if a deposit amount or percentage is stated ('£1,500 deposit', '25% on order'), or the document explicitly states no deposit is required. AMBIGUOUS: a deposit named with no figure — 'a deposit will be required'. Silence is absent.",
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
          "present if a start date or a specific committed start window is stated ('starting 16 March 2026', 'week commencing 4 May'). HEDGING: 'anticipated start 16 March' keeps the date — present. AMBIGUOUS is reserved for a named but imprecise TIME REFERENCE — 'start in the spring', 'sometime in May', 'after Easter'. NEAR-MISS = ABSENT: availability talk that names no time reference at all — 'as soon as we can fit you in', 'we'll get you booked in', 'once the current job finishes' — is ABSENT, never ambiguous. Silence is absent.",
      },
      {
        key: "duration_or_completion_date",
        label: "Duration on site or completion date",
        criteria:
          "present if a duration or completion date is stated ('5 working days', 'complete by 30 March'). HEDGING: 'approximately 5 working days' and 'about a week' both keep a usable figure — present. AMBIGUOUS is reserved for a named but imprecise period — 'a couple of weeks or so', 'in and out inside the month'. NEAR-MISS = ABSENT: wording that names no period at all — 'we'll be as quick as we can', 'shouldn't take long', 'we won't hang about' — is ABSENT, never ambiguous. Weather caveats beside a stated duration do NOT downgrade it. Silence is absent.",
      },
    ],
  },
];
