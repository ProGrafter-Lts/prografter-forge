// Extension / Building Works V2 fixed-standard extraction schema.
//
// 116 fields across 24 categories. Split into its own module purely for file
// size — it is registered in quote-checker-schemas.ts's SCHEMAS map exactly
// like the other categories and uses the same CategoryDef/FieldDef shape.
//
// Every bug class learned on Landscaping (39), Boiler (22), Bathroom (21) and
// Rewire (42) is baked in from the start:
//   NEAR-MISS = ABSENT (never ambiguous)
//   COLLECTIVE-NOUN / QUALITY-CLAIM KILL (a quality adjective is not a spec)
//   COMPOUND FACT (one half present = ambiguous, never present)
//   PRECISION HEDGE vs COMMITMENT HEDGE (figure survives = present)
//   NO-REUSE stays narrow (shared evidence allowed between related subjects)

import type { CategoryDef } from "./quote-checker-schemas.ts";

export const EXTENSION_SCHEMA: CategoryDef[] = [
  {
    key: "quote_basics",
    name: "Quote Basics",
    fields: [
      {
        key: "customer_name_and_address",
        label: "Customer name and address",
        criteria: "COMPOUND FACT — needs BOTH a customer name AND a customer address (full address, street + town, or postcode). Both = present. Only one (a greeting such as 'Hi Sarah,' with no address, or an address with no named customer) = ambiguous. Neither = absent. Shared evidence with property_address_worked and trade_business_details is allowed.",
      },
      {
        key: "property_address_worked",
        label: "Address of the property being extended",
        criteria: "present if the document names the property where the work will be carried out (a site/installation address line, or a customer address the document clearly treats as the work address). A single address given as the customer's address counts as present here too — shared evidence is allowed. NEAR-MISS = ABSENT: 'at your property', 'at the house', 'on site' name no address — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "quote_date_and_validity",
        label: "Quote date and how long the price is held",
        criteria: "COMPOUND FACT — needs BOTH a quote/issue date AND a validity or expiry period. SEARCH THE WHOLE DOCUMENT FOR BOTH HALVES BEFORE GRADING — the date is usually in the header and the validity clause is very often a closing line at the bottom; if both halves appear anywhere, however far apart, the answer is PRESENT. One half anywhere = ambiguous. Neither = absent. 'Prices subject to change' with no period is NOT a validity period. HEDGING: 'valid for approximately 30 days' is present (figure survives); 'valid for a short while' is ambiguous (figure replaced).",
      },
      {
        key: "trade_business_details",
        label: "Builder / business name and contact details",
        criteria: "COMPOUND FACT — needs BOTH a business or trading name AND at least one contact route (phone, email, or business address). Both = present. Only one (a letterhead name with no contact route, or a mobile number signed with a first name only) = ambiguous. Neither = absent. A trading name without Ltd/Limited still counts as a business name.",
      },
      {
        key: "quote_reference_number",
        label: "Quote or job reference number",
        criteria: "IDENTITY RULE — present only if an actual reference identifier is given ('Quote ref: EXT-4412', 'Job no. 118'). A DATE IS NOT A REFERENCE: if a date is the only candidate this field is ABSENT, not ambiguous. A label with no value ('Quote ref:' followed by nothing) is ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "scope_and_drawings",
    name: "Scope & Drawings",
    fields: [
      {
        key: "drawing_reference_and_revision",
        label: "Drawing reference and revision the quote is priced against",
        criteria: "COMPOUND FACT — needs BOTH a drawing reference/number AND a revision or drawing date ('Drawing 2291/03 Rev C', 'plans dated 14/03/2026 ref A-101'). Both = present. A drawing number with no revision or date, or 'as per the latest drawings' with no reference, = ambiguous. NEAR-MISS = ABSENT: 'priced from your plans', 'as per architect's drawings' name no reference at all — absent. Silence is absent.",
      },
      {
        key: "extension_type_and_footprint",
        label: "Extension type and footprint",
        criteria: "present only if the document states the type (single-storey rear, two-storey side, wrap-around, garage conversion, orangery) AND a footprint figure or room-level description a homeowner could check. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'a lovely new extension', 'the extension works throughout', 'full build to a high standard', 'complete extension package' carry no type and no footprint — ABSENT, NEVER ambiguous, however confident or repeated. Type stated with no footprint, or footprint with no type, = ambiguous. Silence is absent.",
      },
      {
        key: "extension_dimensions",
        label: "Extension dimensions (length x width or floor area)",
        criteria: "present if actual dimensions or a floor area figure are given ('6.0m x 4.2m', '25 m2'). HEDGING: 'approximately 6m x 4m' keeps the figures — present. 'a decent size', 'good-sized extension' replace the figure — ABSENT (quality claim), not ambiguous. A single dimension with the other missing ('6m deep') = ambiguous. Silence is absent.",
      },
      {
        key: "storey_height_and_eaves",
        label: "Number of storeys and eaves/ridge height",
        criteria: "EITHER/OR FIELD — present if the document states EITHER the number of storeys ('single-storey', 'two-storey') with a height figure, OR an explicit eaves/ridge height figure. Storeys stated with no height figure = ambiguous. NEAR-MISS = ABSENT: 'to match the existing roofline' states no storey count and no height — absent. Silence is absent.",
      },
      {
        key: "planning_permission_or_pd_reference",
        label: "Planning permission or permitted development reference for the scope",
        criteria: "COMPOUND FACT — needs BOTH the route (full planning permission, permitted development, prior approval, lawful development certificate) AND a reference number or approval date. Both = present. Route named with no reference ('it's permitted development', 'planning has been granted') = ambiguous. NEAR-MISS = ABSENT: 'no planning issues', 'all above board' name no route — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "preliminaries",
    name: "Preliminaries",
    fields: [
      {
        key: "site_setup_and_welfare",
        label: "Site set-up and welfare facilities",
        criteria: "present if the document states a site set-up or welfare provision (site toilet/portaloo, welfare unit, storage container, temporary hoarding) or explicitly states the homeowner's facilities will be used by agreement. NEAR-MISS = ABSENT: 'we'll get set up and crack on', 'we look after our sites' — absent. 'Welfare to be discussed' = ambiguous. Silence is absent.",
      },
      {
        key: "scaffolding_erect_hire_dismantle",
        label: "Scaffolding — erection, hire period and dismantling",
        criteria: "EITHER/OR FIELD — present if the document states scaffolding is included (with erection/hire/dismantle covered or priced) OR explicitly excludes it. A stated exclusion IS present — it is a scope decision. 'Scaffold may be required' = ambiguous. NEAR-MISS = ABSENT: mentioning working at height or roof works without stating any scaffolding position — absent. Silence is absent.",
      },
      {
        key: "skip_hire_and_waste_disposal",
        label: "Skip hire and waste disposal",
        criteria: "EITHER/OR FIELD — present if skips/waste disposal are stated as included (or a number/frequency of skips given) OR explicitly excluded. 'Skips may be needed' = ambiguous. NEAR-MISS = ABSENT: 'we'll keep it tidy', 'rubbish taken away as we go' with no disposal arrangement stated — absent. Silence is absent.",
      },
      {
        key: "protection_of_existing_building",
        label: "Protection of the existing building during works",
        criteria: "present if the document states protection measures (dust sheets, temporary dust screens, floor protection, temporary weatherproofing to the opening, boarding). NEAR-MISS = ABSENT: 'we'll be careful', 'we treat your home like our own', 'to a high standard of care' — absent, never ambiguous. 'Some protection where needed' = ambiguous. Silence is absent.",
      },
      {
        key: "site_security_if_unoccupied",
        label: "Site security where the property is unoccupied",
        criteria: "EITHER/OR FIELD — present if the document states a security arrangement (locked container, temporary fencing/heras, boarded openings, alarm, keyholding) OR states the property will remain occupied so no separate security is required. 'We'll secure it as best we can' = ambiguous. NEAR-MISS = ABSENT: 'nothing to worry about' — absent. Silence is absent.",
      },
      {
        key: "access_route_and_parking_arrangements",
        label: "Access route to the works and parking arrangements",
        criteria: "EITHER/OR FIELD — present if the document states the access route (side gate, through the house, rear alley, crane/hoist position) OR the parking arrangement (driveway use, permits, on-street). One qualifying statement makes this present. 'Access to be agreed' = ambiguous. NEAR-MISS = ABSENT: 'we'll need to get to the back' with no route or parking stated — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "groundworks_and_foundations",
    name: "Groundworks & Foundations",
    fields: [
      {
        key: "excavation_and_spoil_removal",
        label: "Excavation and removal of spoil",
        criteria: "COMPOUND FACT — needs BOTH excavation stated AND what happens to the spoil (removed from site, retained, used for levelling). Both = present. Excavation with no spoil arrangement, or spoil removal with no excavation scope, = ambiguous. NEAR-MISS = ABSENT: 'dig out and get going' — absent. Silence is absent.",
      },
      {
        key: "foundation_type_specified",
        label: "Foundation type",
        criteria: "present only if a foundation type is named (trench fill, strip, raft, piled, mini-pile with ground beam). COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'proper foundations', 'solid foundations', 'foundations to building regs standard' name no type — ABSENT, never ambiguous. 'Foundations as required by Building Control' names no type = ambiguous only if it also states the type will be determined by an identified party on site; otherwise absent. Silence is absent.",
      },
      {
        key: "foundation_depth_and_concrete_spec",
        label: "Foundation depth and concrete specification",
        criteria: "COMPOUND FACT — needs BOTH a depth figure AND a concrete specification (mix, grade e.g. C25/30 or GEN3). Both = present. Depth with no mix, or mix with no depth, = ambiguous. HEDGING: 'approximately 1.0m deep, C25/30' keeps both figures — present; 'as deep as needed' replaces the figure — absent. Silence is absent.",
      },
      {
        key: "trial_holes_or_site_investigation",
        label: "Trial holes or site investigation",
        criteria: "EITHER/OR FIELD — present if the document states trial holes / a soil or site investigation are included, have already been carried out, or are explicitly excluded. 'We may dig a trial hole' = ambiguous. NEAR-MISS = ABSENT: 'we'll see what we find when we dig' — absent. Silence is absent.",
      },
      {
        key: "tree_root_and_nhbc_precautions",
        label: "Tree root / NHBC foundation precautions",
        criteria: "EITHER/OR FIELD — present if the document states tree-influenced foundation measures (NHBC Chapter 4.2 zone, heave precautions, compressible fill/Clayboard, root barrier, deepened founds near trees) OR explicitly states no trees influence the foundations. 'There's a tree nearby' with no measure stated is NEAR-MISS = ABSENT. 'We may need to go deeper because of the tree' = ambiguous. Silence is absent.",
      },
      {
        key: "existing_drain_diversion",
        label: "Diversion or protection of existing drains",
        criteria: "EITHER/OR FIELD — present if the document states drains will be diverted/rerouted/built over with a lintel or protected, OR explicitly states no drains are affected. 'There might be a drain in the way' = ambiguous. NEAR-MISS = ABSENT: mentioning a manhole or drain run without stating any action or exclusion — absent. Silence is absent.",
      },
      {
        key: "ground_conditions_contingency",
        label: "How unexpected ground conditions are priced",
        criteria: "present if the document states how unforeseen ground conditions are handled (a provisional sum, a rate per extra metre of dig, a stated contingency, or an explicit statement that extra depth is chargeable as a variation). NEAR-MISS = ABSENT: 'we'll let you know if we hit anything' with no pricing mechanism — absent. 'Extra costs may apply' with no mechanism = ambiguous. Silence is absent.",
      },
      {
        key: "oversite_and_hardcore_fill",
        label: "Oversite preparation and hardcore fill",
        criteria: "COMPOUND FACT — needs BOTH the material (MOT Type 1, crushed concrete, sand blinding) AND a depth or compaction statement. Both = present. Material with no depth, or depth with no material, = ambiguous. NEAR-MISS = ABSENT: 'prepare the base', 'fill and level' — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "structural_steelwork",
    name: "Structural / Steelwork",
    fields: [
      {
        key: "structural_engineer_calculations",
        label: "Structural engineer's calculations",
        criteria: "COMPOUND FACT — needs BOTH an engineer named or referenced (practice name, engineer's name) AND an actual calculation reference (calc pack number, report reference, or calculation date). Both = present. Only one half — 'our structural engineer has been involved', 'calcs to be provided', 'engineer appointed' — is AMBIGUOUS, never present. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'all structural work fully engineered', 'designed to the highest standard', 'structurally sound throughout' name neither engineer nor calculation — ABSENT, never ambiguous. Silence is absent.",
      },
      {
        key: "steel_beam_sizes_and_specification",
        label: "Steel beam sizes and specification",
        criteria: "present only if at least one beam is specified by size/section ('203x133 UB25', '2 no. 254x146 UB31'). COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'steels as required', 'all necessary steelwork', 'heavy-duty steels' name no section — ABSENT, never ambiguous. 'Steel beam to engineer's size' names the subject but no size = ambiguous. Silence is absent.",
      },
      {
        key: "padstones_and_bearings",
        label: "Padstones and bearing details",
        criteria: "present if padstones or bearing details are stated (padstone size/type, bearing length, spreader plate). NEAR-MISS = ABSENT: mentioning steels without any bearing or padstone statement — absent. 'Padstones where needed' = ambiguous. Silence is absent.",
      },
      {
        key: "temporary_propping_and_support",
        label: "Temporary propping and support during structural works",
        criteria: "present if temporary support is stated (acrow props, strongboys, needling, temporary works design). NEAR-MISS = ABSENT: 'we'll take the wall out carefully' with no support stated — absent. 'Propping as required' = ambiguous. Silence is absent.",
      },
      {
        key: "party_wall_structural_interface",
        label: "Structural interface with the party wall or neighbouring structure",
        criteria: "EITHER/OR FIELD — present if the document states how the new structure meets the party/neighbouring wall (bearing into the party wall, independent foundation clear of it, cavity tray and flashing detail at the junction) OR explicitly states no party wall is affected. 'We'll tie into next door's wall somehow' = ambiguous. NEAR-MISS = ABSENT: mentioning the neighbour or boundary without a structural statement — absent. Silence is absent.",
      },
      {
        key: "existing_wall_opening_and_lintels",
        label: "Opening up the existing wall and lintels to remaining openings",
        criteria: "COMPOUND FACT — needs BOTH the opening in the existing wall described (position and approximate width, or 'full width of the existing rear wall') AND the lintel/beam supporting it identified WITH its size or specification stated. Both = present. PRECISION HEDGE: a beam or lintel whose size is deferred to a third party or a later date ('steel to engineer's size', 'beam size TBC', 'lintel to be confirmed') does NOT count as identified — with the opening described this is ambiguous, never present. Opening with no support named, or a lintel with no opening described, = ambiguous. NEAR-MISS = ABSENT: 'knock through' with no width and no support — absent. Silence is absent.",
      },
      {
        key: "structural_warranty_or_sign_off",
        label: "Structural sign-off on completion",
        criteria: "present if the document states who signs off the structural work and what is issued (engineer's site inspection and sign-off letter, Building Control structural sign-off, completion certificate covering structure). NEAR-MISS = ABSENT: 'it'll all be signed off' names no party and no document — absent. 'Sign-off arranged' = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "damp_below_ground",
    name: "Damp / Below-Ground Protection",
    fields: [
      {
        key: "dpc_installation_and_level",
        label: "DPC installation and level",
        criteria: "COMPOUND FACT — needs BOTH DPC installation stated AND its level related to something (150mm above finished ground level, linked to the existing DPC). Both = present. DPC mentioned with no level = ambiguous. NEAR-MISS = ABSENT: 'damp proofing included' with no DPC and no level — absent. Silence is absent.",
      },
      {
        key: "cavity_tray_provision",
        label: "Cavity trays at abutments and openings",
        criteria: "present if cavity trays (or stepped trays/lead flashing to the abutment) are stated. NEAR-MISS = ABSENT: 'flashings as required', 'weatherproofed where it meets the house' with no tray stated — absent. 'Cavity trays where needed' = ambiguous. Silence is absent.",
      },
      {
        key: "tanking_or_waterproofing_where_below_ground",
        label: "Tanking / waterproofing where any part is below ground",
        criteria: "EITHER/OR FIELD — present if a waterproofing system is stated (Type A tanking, Type C cavity drain membrane, named product) OR the document explicitly states no part of the works is below ground so tanking is not required. 'Tanking may be needed' = ambiguous. NEAR-MISS = ABSENT: 'kept dry' — absent. Silence is absent.",
      },
      {
        key: "radon_membrane_where_applicable",
        label: "Radon membrane where applicable",
        criteria: "EITHER/OR FIELD — present if a radon barrier/membrane is stated as included, or the document explicitly states the property is not in a radon-affected area. 'Radon may apply' = ambiguous. NEAR-MISS = ABSENT: a DPM/damp proof membrane stated with no radon reference does NOT evidence this field — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "superstructure",
    name: "Superstructure",
    fields: [
      {
        key: "external_leaf_brick_specification",
        label: "External leaf brick specification",
        criteria: "present only if the outer leaf material is specified by type/range/manufacturer ('Ibstock Leicester Multi Red facing brick', 'reclaimed London stock'). COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'quality facing bricks', 'best-match bricks' name no brick — ABSENT. 'Facing brick to be selected' names the subject but no spec = ambiguous. Silence is absent.",
      },
      {
        key: "internal_leaf_block_specification",
        label: "Internal leaf block specification",
        criteria: "present only if the inner leaf blockwork is specified (100mm aircrete/dense concrete block, a named product, or a stated strength). NEAR-MISS = ABSENT: 'blockwork inner skin' with no thickness and no type — absent. 'Blocks as required' = ambiguous. Silence is absent.",
      },
      {
        key: "cavity_width_and_wall_ties",
        label: "Cavity width and wall ties",
        criteria: "COMPOUND FACT — needs BOTH a cavity width figure AND wall ties stated (type, spacing, or a named product). Both = present. One half only = ambiguous. NEAR-MISS = ABSENT: 'cavity wall construction' alone — absent. Silence is absent.",
      },
      {
        key: "cavity_insulation_type_and_thickness",
        label: "Cavity insulation type and thickness",
        criteria: "COMPOUND FACT — needs BOTH insulation type/product (full-fill mineral wool, PIR partial fill, named brand) AND a thickness figure. Both = present. One half only = ambiguous. HEDGING: 'approximately 100mm PIR' keeps the figure — present. NEAR-MISS = ABSENT: 'fully insulated', 'insulated to modern standards' name neither — absent. Silence is absent.",
      },
      {
        key: "brick_matching_to_existing",
        label: "How new brickwork will be matched to the existing house",
        criteria: "present only if the document states a matching approach a homeowner could check (a named matching brick, a brick-matching service/sample approval process, reclaimed bricks from the demolished wall, or a stated agreed mortar mix/colour). COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'matching finish throughout', 'bricks to match', 'blended to a high standard', 'you won't see the join' carry no method and no product — ABSENT, NEVER ambiguous. 'We'll try to find a close match' = ambiguous. Silence is absent.",
      },
      {
        key: "movement_joints_where_required",
        label: "Movement joints where required",
        criteria: "EITHER/OR FIELD — present if movement joints are stated (position, spacing, or a stated sealed joint at the junction with the existing house) OR the document explicitly states none are required for this length of wall. 'Movement joints if needed' = ambiguous. NEAR-MISS = ABSENT: 'tied into the existing wall' does not evidence a movement joint — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "roof",
    name: "Roof",
    fields: [
      {
        key: "roof_type_and_pitch",
        label: "Roof type and pitch",
        criteria: "COMPOUND FACT — needs BOTH the roof type (pitched, flat, mono-pitch, hipped, lean-to) AND a pitch/fall figure. Both = present. Type with no pitch, or a pitch with no type, = ambiguous. NEAR-MISS = ABSENT: 'new roof to the extension' — absent. Silence is absent.",
      },
      {
        key: "roof_structure_spec",
        label: "Roof structure specification",
        criteria: "present if the structure is specified (timber sizes and centres, 'attic trusses at 600 centres', joist size, glulam/steel ridge). NEAR-MISS = ABSENT: 'timber roof structure' with no sizes or centres — absent. 'Roof timbers to engineer's design' names a source but no spec = ambiguous. Silence is absent.",
      },
      {
        key: "roof_covering_material_and_matching",
        label: "Roof covering material and matching to the existing roof",
        criteria: "present only if the covering is specified by type/product ('Marley Modern concrete interlocking tiles', 'natural Welsh slate 500x250') OR a checkable matching method is stated (salvaged tiles from the existing roof, sample approval). COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'tiles to match existing', 'matching roof finish throughout', 'best-quality covering' carry no product and no method — ABSENT, NEVER ambiguous. 'Tiles to be confirmed' = ambiguous. Silence is absent.",
      },
      {
        key: "flat_roof_covering_and_falls_where_applicable",
        label: "Flat roof covering and falls, where applicable",
        criteria: "EITHER/OR FIELD — present if a flat roof system is named (GRP, single-ply EPDM/Sarnafil, 3-layer felt) with a fall stated or a firring/fall arrangement described, OR the document explicitly states there is no flat roof element. A system named with no fall = ambiguous. NEAR-MISS = ABSENT: 'flat roof section included' — absent. Silence is absent.",
      },
      {
        key: "guttering_and_downpipes",
        label: "Guttering and downpipes",
        criteria: "present if guttering/downpipes are stated with a type, profile or colour, or explicitly stated as matched to the existing and connected to a named discharge. NEAR-MISS = ABSENT: 'rainwater goods included' with no spec and no discharge — absent. 'Guttering to match' alone = ambiguous. Silence is absent.",
      },
      {
        key: "roof_insulation_and_u_value",
        label: "Roof insulation and U-value",
        criteria: "COMPOUND FACT — needs BOTH insulation type/thickness AND a U-value figure. Both = present. One half only = ambiguous. HEDGING: 'around 0.15 W/m2K' keeps the figure — present. NEAR-MISS = ABSENT: 'insulated to current regs' names neither — absent. Silence is absent.",
      },
      {
        key: "roof_lights_or_velux_provision",
        label: "Roof lights / rooflantern provision",
        criteria: "EITHER/OR FIELD — present if roof lights are stated with a count and type/size or a named product, OR explicitly excluded. A count with no type, or a type with no count, = ambiguous. NEAR-MISS = ABSENT: 'plenty of natural light' — absent. Silence is absent.",
      },
      {
        key: "fascias_soffits_and_verges",
        label: "Fascias, soffits and verges",
        criteria: "present if fascias/soffits/verges are stated with a material or finish (uPVC white, painted timber, dry verge system). NEAR-MISS = ABSENT: 'finished off at the eaves' — absent. 'Fascias included' with no material = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "windows_external_doors",
    name: "Windows & External Doors",
    fields: [
      {
        key: "window_specification_and_glazing",
        label: "Window specification and glazing",
        criteria: "COMPOUND FACT — needs BOTH a frame specification (material, colour, or named system) AND the glazing (double/triple, low-E, toughened where required). Both = present. One half only = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'high-quality windows throughout' names neither — ABSENT. Silence is absent.",
      },
      {
        key: "external_door_specification",
        label: "External door specification",
        criteria: "present if the external door(s) are specified by type/material/product ('composite rear door, anthracite grey', 'aluminium single door, named system'). NEAR-MISS = ABSENT: 'new back door' with no spec — absent. 'Door to be chosen' = ambiguous. Silence is absent.",
      },
      {
        key: "bifold_or_sliding_door_provision",
        label: "Bifold or sliding door provision",
        criteria: "EITHER/OR FIELD — present if bifold/sliding doors are specified (panel count, overall width, or a named system) OR explicitly excluded / stated as supplied by the client. A mention with no spec ('bifolds included') = ambiguous. NEAR-MISS = ABSENT: 'lots of glass to the garden' — absent. Silence is absent.",
      },
      {
        key: "window_and_door_u_values",
        label: "Window and door U-values",
        criteria: "present if a U-value figure (or a WER/energy rating) is stated for the glazing units. HEDGING: 'around 1.4 W/m2K' keeps the figure — present. NEAR-MISS = ABSENT: 'energy-efficient glazing', 'A-rated quality' with no figure or rating band — absent. 'U-values to meet regs' = ambiguous. Silence is absent.",
      },
      {
        key: "trickle_vents_and_ventilation_compliance",
        label: "Trickle vents and ventilation compliance",
        criteria: "present if trickle vents / background ventilation or Part F compliance with a stated provision (extract fan rates, vents to each habitable room) is described. NEAR-MISS = ABSENT: 'well ventilated' — absent. 'Ventilation to regs' with no provision = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "insulation_and_fabric",
    name: "Insulation & Fabric",
    fields: [
      {
        key: "wall_insulation_u_value_target",
        label: "Wall insulation U-value target",
        criteria: "present if a wall U-value figure is stated. HEDGING: 'approximately 0.18 W/m2K' keeps the figure — present. NEAR-MISS = ABSENT: 'built to current Building Regulations standards' with no figure — absent, never ambiguous. 'U-value to be confirmed' = ambiguous. Silence is absent.",
      },
      {
        key: "floor_insulation_specification",
        label: "Floor insulation specification",
        criteria: "COMPOUND FACT — needs BOTH type/product AND a thickness or U-value. Both = present. One half only = ambiguous. NEAR-MISS = ABSENT: 'insulated floor' — absent. Silence is absent.",
      },
      {
        key: "air_tightness_and_vapour_control",
        label: "Air tightness and vapour control",
        criteria: "present if an air-tightness measure or vapour control layer is stated (VCL/foil-backed plasterboard, taped membrane, air test target figure). NEAR-MISS = ABSENT: 'draught-free', 'sealed up properly' — absent. 'Air test if required' = ambiguous. Silence is absent.",
      },
      {
        key: "thermal_bridging_details",
        label: "Thermal bridging details",
        criteria: "present if thermal bridging is addressed with a stated measure (insulated cavity closers, accredited construction details, named psi-value approach). NEAR-MISS = ABSENT: 'no cold spots', 'warm and cosy' — absent. 'Cold bridging to be considered' = ambiguous. Silence is absent.",
      },
      {
        key: "sap_calculation_or_energy_compliance",
        label: "SAP calculation or energy compliance evidence",
        criteria: "EITHER/OR FIELD — present if a SAP/energy calculation is stated as included (with who provides it) or the document explicitly states the extension is exempt / compliance is by elemental U-values with the figures given. 'SAP may be needed' = ambiguous. NEAR-MISS = ABSENT: 'energy efficient build' — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "first_fix_electrical",
    name: "First Fix Electrical",
    fields: [
      {
        key: "first_fix_wiring_scope",
        label: "First fix wiring scope",
        criteria: "present if the first fix wiring scope is stated with checkable extent (number of circuits, rooms covered, or a list of points). COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'all electrics included', 'full electrical package' carry no extent — ABSENT. 'Electrical first fix' with no extent = ambiguous. Silence is absent.",
      },
      {
        key: "consumer_unit_capacity_for_new_circuits",
        label: "Whether the existing consumer unit can take the new circuits",
        criteria: "EITHER/OR FIELD — present if the document states the existing board has been checked and has spare ways, OR that a new/upgraded board or sub-board is included, OR that a board upgrade is excluded and chargeable. 'Board may need upgrading' = ambiguous. NEAR-MISS = ABSENT: 'connected to the existing supply' — absent. Silence is absent.",
      },
      {
        key: "socket_and_switch_positions_agreed",
        label: "Socket and switch positions agreed",
        criteria: "present if positions are stated as set out on a drawing, marked out on site with the client before first fix, or listed per room. NEAR-MISS = ABSENT: 'sockets where you want them' with no agreement process — absent. 'Positions to be discussed' = ambiguous. Silence is absent.",
      },
      {
        key: "smoke_heat_alarm_provision",
        label: "Smoke / heat alarm provision",
        criteria: "present if mains-linked smoke/heat alarms are stated with a location or count, or explicitly stated as interlinked with the existing system. 'Smoke alarms as required' names the subject but no location or count = ambiguous. NEAR-MISS = ABSENT: 'all safety kit included', 'alarms sorted' name no alarm type, location or count — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "part_p_notification",
        label: "Part P notification of the electrical work",
        criteria: "COMPOUND FACT — needs BOTH the route (self-certification under a named competent person scheme, or notification to Building Control) AND confirmation it will be done with a certificate issued. Both = present. Route named with no certificate, or 'it'll be certified' with no route, = ambiguous. NEAR-MISS = ABSENT: 'our electrician is fully qualified' names no scheme and no notification — absent, never ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "first_fix_plumbing_heating",
    name: "First Fix Plumbing & Heating",
    fields: [
      {
        key: "radiator_or_underfloor_heating_provision",
        label: "Radiators or underfloor heating provision",
        criteria: "COMPOUND FACT — needs BOTH the heat emitter type (radiators or UFH) AND a count or coverage (number of radiators, rooms/area of UFH). Both = present. One half only = ambiguous. NEAR-MISS = ABSENT: 'heating included' — absent. Silence is absent.",
      },
      {
        key: "pipework_first_fix_scope",
        label: "Pipework first fix scope",
        criteria: "present if first fix pipework is stated with extent or route (pipe runs to named positions, material and size, buried/floor-void route). NEAR-MISS = ABSENT: 'plumbing first fix' with no extent — absent. 'Pipework as needed' = ambiguous. Silence is absent.",
      },
      {
        key: "boiler_capacity_check_for_extension",
        label: "Whether the existing boiler can serve the extension",
        criteria: "EITHER/OR FIELD — present if the document states the existing boiler/system has been checked as adequate, OR that an upgrade is included, OR that any boiler upgrade is excluded and chargeable. 'The boiler might struggle' = ambiguous. NEAR-MISS = ABSENT: 'connected to the existing heating' — absent. Silence is absent.",
      },
      {
        key: "gas_safe_registration",
        label: "Gas Safe registration for any gas work",
        criteria: "EITHER/OR FIELD — present if a Gas Safe registration number or 'Gas Safe registered engineer' is stated for the gas work, OR the document explicitly states no gas work is involved. NEAR-MISS = ABSENT: 'fully qualified heating engineer', 'certified plumber' do NOT name Gas Safe — absent, never ambiguous. 'Gas work will be certified' with no scheme = ambiguous. Silence is absent.",
      },
      {
        key: "water_supply_extension_provision",
        label: "Extending the cold/hot water supply into the extension",
        criteria: "EITHER/OR FIELD — present if water supply extension is stated (new feeds to named outlets, stopcock/isolation position) OR explicitly excluded / stated as not required. 'Water where needed' = ambiguous. NEAR-MISS = ABSENT: 'plumbing included' — absent. Silence is absent.",
      },
      {
        key: "waste_pipe_first_fix_scope",
        label: "Waste pipe first fix scope",
        criteria: "present if waste pipework is stated with the appliances served or the connection point to the existing/new drainage. NEAR-MISS = ABSENT: 'wastes run as required' — absent. 'Waste pipes included' with no appliances and no connection = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "drainage",
    name: "Drainage",
    fields: [
      {
        key: "foul_drainage_connection",
        label: "Foul drainage connection",
        criteria: "COMPOUND FACT — needs BOTH the foul connection stated AND the point it connects to (existing manhole, existing soil stack, new chamber). Both = present. One half only = ambiguous. NEAR-MISS = ABSENT: 'drainage included' — absent. Silence is absent.",
      },
      {
        key: "surface_water_drainage_and_soakaway",
        label: "Surface water drainage and soakaway",
        criteria: "COMPOUND FACT — needs BOTH the surface water route (soakaway, connection to existing surface water drain, attenuation) AND a position or size/discharge point. One half only = ambiguous. NEAR-MISS = ABSENT: 'rainwater dealt with' — absent. Silence is absent.",
      },
      {
        key: "drainage_survey_or_cctv_where_required",
        label: "Drainage survey / CCTV survey where required",
        criteria: "EITHER/OR FIELD — present if a drainage or CCTV survey is stated as included, already carried out, or explicitly excluded. 'A survey may be needed' = ambiguous. NEAR-MISS = ABSENT: 'we'll check the drains as we go' — absent. Silence is absent.",
      },
      {
        key: "manhole_or_inspection_chamber_relocation",
        label: "Manhole or inspection chamber relocation / raising",
        criteria: "EITHER/OR FIELD — present if the document states a chamber will be relocated, raised, sealed with a double-sealed cover, or explicitly states no chamber is affected. 'The manhole may need moving' = ambiguous. NEAR-MISS = ABSENT: mentioning a manhole without stating any action — absent. Silence is absent.",
      },
      {
        key: "building_control_drainage_approval",
        label: "Building Control drainage inspection / approval",
        criteria: "present if the document states drainage will be inspected/air-tested and signed off by Building Control or the approved inspector. NEAR-MISS = ABSENT: 'all to regs' — absent. 'Inspections arranged' with no reference to drainage = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "plastering_and_finishes",
    name: "Plastering & Finishes",
    fields: [
      {
        key: "plastering_scope_walls_and_ceilings",
        label: "Plastering scope — walls and ceilings",
        criteria: "present only if the plastering extent is checkable (rooms/areas listed, walls and ceilings named, board-and-skim to the whole extension stated). COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'plastered to a high standard', 'a first-class finish throughout', 'all plastering included' carry no extent — ABSENT, NEVER ambiguous. 'Plastering, extent TBC' = ambiguous. Silence is absent.",
      },
      {
        key: "skimming_or_textured_finish_specified",
        label: "Skim or textured finish specified",
        criteria: "present if the finish is named (2-coat skim to plasterboard, wet plaster, textured/tyrolean). NEAR-MISS = ABSENT: 'smooth finish throughout' with no system — absent. 'Finish to be agreed' = ambiguous. Silence is absent.",
      },
      {
        key: "internal_wall_making_good",
        label: "Making good to internal walls where the opening is formed",
        criteria: "present if making good to the existing internal walls (reveals, patching around the new opening, re-plastering the affected wall) is stated. NEAR-MISS = ABSENT: 'left clean and tidy' — absent. 'Some making good included' = ambiguous. Silence is absent.",
      },
      {
        key: "existing_ceiling_interface_making_good",
        label: "Making good where the new ceiling meets the existing",
        criteria: "present if the ceiling junction with the existing house is addressed (new ceiling boarded and skimmed to meet the existing, shadow gap or bulkhead detail, patch and skim of the existing ceiling). NEAR-MISS = ABSENT: 'blended in nicely' — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "second_fix_electrical",
    name: "Second Fix Electrical",
    fields: [
      {
        key: "second_fix_sockets_switches_and_fittings",
        label: "Second fix sockets, switches and accessories",
        criteria: "COMPOUND FACT — needs BOTH a count of accessories AND a type/finish (white moulded, brushed steel, named range). Both = present. One half only = ambiguous. NEAR-MISS = ABSENT: 'sockets and switches fitted' — absent. Silence is absent.",
      },
      {
        key: "lighting_design_and_fittings",
        label: "Lighting design and fittings",
        criteria: "COMPOUND FACT — needs BOTH a count/layout of lighting points AND the fitting type or a supply arrangement (fittings supplied by client / PC sum stated). One half only = ambiguous. NEAR-MISS = ABSENT: 'lovely lighting throughout' — absent. Silence is absent.",
      },
      {
        key: "eic_electrical_installation_certificate",
        label: "Electrical Installation Certificate on completion",
        criteria: "present only if an EIC / electrical installation certificate (or minor works certificate where appropriate) is stated as issued on completion. NEAR-MISS = ABSENT: 'tested and safe', 'signed off by our sparky' name no certificate — absent, never ambiguous. 'Certification provided' with no document named = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "second_fix_plumbing_heating",
    name: "Second Fix Plumbing & Heating",
    fields: [
      {
        key: "radiator_or_ufh_second_fix",
        label: "Radiator / UFH second fix",
        criteria: "present if second fix of the heat emitters is stated (radiators hung and connected with valves, UFH manifold connected and floor circuits tested). NEAR-MISS = ABSENT: 'heating finished off' — absent. Silence is absent.",
      },
      {
        key: "sanitary_ware_second_fix_where_applicable",
        label: "Sanitary ware second fix, where applicable",
        criteria: "EITHER/OR FIELD — present if sanitary ware fitting is stated (items listed, or a supply/PC sum arrangement) OR the document explicitly states there is no sanitary ware in this extension. 'WC possibly included' = ambiguous. NEAR-MISS = ABSENT: 'plumbing finished' — absent. Silence is absent.",
      },
      {
        key: "heating_system_commissioning",
        label: "Heating system commissioning and balancing",
        criteria: "present if commissioning is stated (system balanced, pressure tested, inhibitor added, commissioning record/benchmark completed). NEAR-MISS = ABSENT: 'we'll fire it up and check it works' — absent. 'Commissioning included' with nothing further = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "flooring",
    name: "Flooring",
    fields: [
      {
        key: "floor_finish_specification",
        label: "Floor finish specification",
        criteria: "EITHER/OR FIELD — present if the floor finish is specified (material and product/range) OR explicitly excluded / stated as a PC sum with the sum given. NEAR-MISS = ABSENT: 'quality flooring throughout' — absent. 'Flooring to be chosen' with no allowance = ambiguous. Silence is absent.",
      },
      {
        key: "screed_or_subfloor_preparation",
        label: "Screed or subfloor preparation",
        criteria: "COMPOUND FACT — needs BOTH the subfloor build-up (screed, beam and block, insulated slab, ply overlay) AND a thickness figure or the finished floor level it achieves. One half only = ambiguous. NEAR-MISS = ABSENT: 'floor prepared ready for finishes' — absent. Silence is absent.",
      },
      {
        key: "threshold_and_level_transition_to_existing",
        label: "Threshold and level transition to the existing floor",
        criteria: "present if the transition to the existing floor level is addressed (level threshold, ramp, step, matched finished floor level, threshold strip). NEAR-MISS = ABSENT: 'it'll all flow nicely' — absent. 'Levels to be worked out on site' = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "decoration",
    name: "Decoration",
    fields: [
      {
        key: "internal_decoration_scope",
        label: "Internal decoration scope",
        criteria: "EITHER/OR FIELD — present if internal decoration is included with a checkable extent (mist coat plus two coats to walls and ceilings, rooms listed) OR explicitly excluded. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'decorated to a high standard' carries no extent — ABSENT. 'Some decorating included' = ambiguous. Silence is absent.",
      },
      {
        key: "external_decoration_or_render_finish",
        label: "External decoration or render finish",
        criteria: "present only if the external finish is specified (render system and finish coat with a named product or colour, painted finish with coats stated) or explicitly excluded. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): 'rendered and finished to a high standard', 'external finish to match throughout', 'smart modern finish' carry no system and no product — ABSENT, NEVER ambiguous. 'Render colour to be agreed' = ambiguous. Silence is absent.",
      },
      {
        key: "decoration_exclusion_clarity",
        label: "Clarity over what decoration is NOT included",
        criteria: "present only if the document explicitly states decoration items that are excluded ('final decoration excluded', 'no decoration to existing rooms'). This field is about a stated exclusion — an inclusion statement alone does NOT make it present; that is ambiguous only where the inclusion is worded so as to bound the scope ('decoration limited to the new extension only'). Silence is absent.",
      },
    ],
  },
  {
    key: "external_works",
    name: "External Works",
    fields: [
      {
        key: "patio_or_external_ground_making_good",
        label: "Patio / external ground making good",
        criteria: "EITHER/OR FIELD — present if external ground making good is stated (patio relaid/new with a material, path reinstated, area figure) OR explicitly excluded. NEAR-MISS = ABSENT: 'garden left tidy' — absent. 'Some making good outside' = ambiguous. Silence is absent.",
      },
      {
        key: "boundary_and_fence_reinstatement",
        label: "Boundary and fence reinstatement",
        criteria: "EITHER/OR FIELD — present if fence/boundary removal and reinstatement is stated (panels removed and refitted, new fence with type) OR explicitly excluded / stated as unaffected. 'Fence may need moving' = ambiguous. NEAR-MISS = ABSENT: mentioning the boundary with no action — absent. Silence is absent.",
      },
      {
        key: "external_lighting_provision",
        label: "External lighting provision",
        criteria: "EITHER/OR FIELD — present if external lighting is stated with a count/position or named fitting, OR explicitly excluded. 'Outside light included' with no position or type = ambiguous. NEAR-MISS = ABSENT: 'well lit outside' — absent. Silence is absent.",
      },
      {
        key: "garden_reinstatement_scope",
        label: "Garden reinstatement scope",
        criteria: "EITHER/OR FIELD — present if garden reinstatement is stated with extent (turf to the disturbed area with an approximate area, topsoil and seed, planting replaced) OR explicitly excluded. NEAR-MISS = ABSENT: 'garden put back nicely' — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "party_wall",
    name: "Party Wall",
    fields: [
      {
        key: "party_wall_award_status",
        label: "Party wall award status",
        criteria: "COMPOUND FACT — needs BOTH a status (award agreed / notices served / dissent received / not required because no notifiable work) AND evidence identifying it (surveyor name or practice, award reference, or the date notices were served). Both = present. Status with no evidence — 'party wall award in place', 'party wall sorted', 'notices served' with no surveyor, reference or date — is AMBIGUOUS, never present. NEAR-MISS = ABSENT: 'we've spoken to the neighbours', 'the neighbours are fine with it' state no status under the Act — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "neighbour_notification_evidence",
        label: "Evidence that neighbours have been notified",
        criteria: "COMPOUND FACT — needs BOTH notification stated AND evidence of it (date served, acknowledgement/consent received in writing, notice reference, or named adjoining owner). Both = present. 'Neighbours notified' with no date and no evidence = ambiguous. NEAR-MISS = ABSENT: 'we'll have a word with next door' — absent. Silence is absent.",
      },
      {
        key: "boundary_line_confirmation",
        label: "Boundary line confirmation",
        criteria: "present if the boundary position is confirmed by a checkable means (title plan reference, boundary agreed in writing with the adjoining owner, surveyor's setting-out, or a stated dimension from the boundary). NEAR-MISS = ABSENT: 'built up to the boundary', 'right on the line' with no confirmation — absent. 'Boundary to be checked' = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "building_regs_planning_certification",
    name: "Building Regs, Planning & Certification",
    fields: [
      {
        key: "building_control_notification_type",
        label: "Building Control notification route and submission status",
        criteria: "COMPOUND FACT — needs BOTH the route specified (full plans application, building notice, or a named approved inspector) AND confirmation it has been submitted or will be submitted with who submits it and when. Both = present. Route named with no submission confirmation, or 'we will notify Building Control' with no route, is AMBIGUOUS, never present. NEAR-MISS = ABSENT: 'everything to Building Regulations', 'fully compliant build' state no route and no submission — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "building_regs_completion_certificate",
        label: "Building Regulations completion certificate",
        criteria: "present only if a completion certificate is stated as issued to the homeowner on completion (and by whom). NEAR-MISS = ABSENT: 'signed off at the end', 'passed by the inspector' name no certificate — absent, never ambiguous. 'Certificates provided' with no document named = ambiguous. Silence is absent.",
      },
      {
        key: "planning_permission_or_lawful_development_cert",
        label: "Planning permission or lawful development certificate",
        criteria: "COMPOUND FACT — needs BOTH the permission type (full planning permission, prior approval, lawful development certificate, permitted development) AND a reference number or decision date. Both = present. 'It has planning permission', 'it's permitted development' with no reference is AMBIGUOUS, never present. NEAR-MISS = ABSENT: 'no planning problems', 'all approved' name no route — absent. Silence is absent. Shared evidence with planning_permission_or_pd_reference is allowed.",
      },
      {
        key: "warranty_or_insurance_backed_guarantee",
        label: "Workmanship warranty or insurance-backed guarantee",
        criteria: "COMPOUND FACT — needs BOTH a guarantee period AND what it covers or who backs it (workmanship, insurance-backed by a named scheme). Both = present. A period with no cover, or cover with no period, = ambiguous. NEAR-MISS = ABSENT: 'fully guaranteed', 'we stand by our work' — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "structural_warranty_provision",
        label: "Structural warranty provision",
        criteria: "EITHER/OR FIELD — present if a structural warranty is named (a 10-year structural warranty provider, architect's certificate) OR explicitly stated as not provided/not required for this work. 'Warranty available if you want one' = ambiguous. NEAR-MISS = ABSENT: a workmanship guarantee alone does NOT evidence a structural warranty — absent. Silence is absent.",
      },
      {
        key: "completion_and_handover_pack",
        label: "Completion and handover pack",
        criteria: "present if a handover pack is stated with at least one named contents item (certificates, warranties, product guarantees, as-built drawings, O&M information). NEAR-MISS = ABSENT: 'we'll give you everything at the end' names nothing — absent. 'Handover pack provided' with no contents = ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "waste_and_site_management",
    name: "Waste & Site Management",
    fields: [
      {
        key: "waste_transfer_note_provision",
        label: "Waste transfer note provision",
        criteria: "present only if waste transfer notes / licensed carrier documentation are stated as provided. NEAR-MISS = ABSENT: 'all waste removed', 'skips included' do NOT evidence waste transfer notes — absent, never ambiguous. 'Paperwork provided' with no document named = ambiguous. Silence is absent.",
      },
      {
        key: "daily_site_clean_and_debris_removal",
        label: "Daily site clean and debris removal",
        criteria: "present if a cleaning routine is stated (site swept and cleared daily/at the end of each day, weekly clear-down, final builder's clean). NEAR-MISS = ABSENT: 'we're a tidy firm', 'left clean to a high standard' — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "working_hours_and_noise_consideration",
        label: "Working hours and noise consideration",
        criteria: "EITHER/OR FIELD — present if working hours/days are stated ('8am to 5pm Monday to Friday, no weekend working') OR a noise arrangement is stated (no breaking out before 9am, neighbours informed of noisy phases). 'We start early most days' = ambiguous. NEAR-MISS = ABSENT: a build duration in weeks states no hours — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "price_vat_payment",
    name: "Price, VAT & Payment",
    fields: [
      {
        key: "total_price_and_breakdown",
        label: "Total price and how it breaks down",
        criteria: "COMPOUND FACT — needs BOTH a total price figure AND a breakdown (sectional/stage costs, labour and materials split, itemised trades). Both = present. A total with no breakdown, or line items with no total, = ambiguous. NEAR-MISS = ABSENT: 'competitive price', 'best price we can do' with no figure — absent. Silence is absent.",
      },
      {
        key: "vat_treatment",
        label: "VAT treatment",
        criteria: "present if VAT status is stated (inclusive, exclusive with the rate, zero-rated/exempt with the reason, or a VAT registration number given). NEAR-MISS = ABSENT: a total figure alone does not state VAT treatment — absent. 'VAT to be confirmed' = ambiguous. Silence is absent.",
      },
      {
        key: "payment_schedule_and_stage_payments",
        label: "Payment schedule and stage payments",
        criteria: "present if payments are tied to identifiable stages or dates, with amounts or percentages ('30% at DPC, 30% at roof watertight, 30% at plaster, 10% on completion'). Stages named with no amounts, or amounts with no stages, = ambiguous. NEAR-MISS = ABSENT: 'payments as we go', 'staged payments' with neither stage nor amount — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "deposit_amount",
        label: "Deposit amount",
        criteria: "present if a deposit figure or percentage is stated, OR the document explicitly states no deposit is required. 'A deposit will be required' with no figure = ambiguous. NEAR-MISS = ABSENT: a first stage payment described without being called a deposit still counts as present only if it is payable before works start with a stated figure; otherwise this field is absent. Silence is absent.",
      },
      {
        key: "provisional_sums_clearly_flagged",
        label: "Provisional sums and allowances clearly flagged",
        criteria: "EITHER/OR FIELD — present if provisional sums / PC sums / allowances are labelled as such with their values, OR the document explicitly states the price contains no provisional sums. An allowance figure given without being flagged as provisional = ambiguous. NEAR-MISS = ABSENT: 'some costs may change' — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "timescale_and_access",
    name: "Timescale & Access",
    fields: [
      {
        key: "start_date",
        label: "Start date",
        criteria: "present if a start date or start window is given. HEDGING: 'starting week commencing 4 May, subject to weather' keeps the date — present (precision hedge). 'We'll start as soon as we can', 'in the spring sometime' replace the date — ambiguous (commitment hedge). Silence is absent.",
      },
      {
        key: "duration_or_completion_date",
        label: "Duration or completion date",
        criteria: "present if a duration figure or completion date is given ('14 weeks on site', 'complete by 12 September'). HEDGING: 'approximately 14 weeks' keeps the figure — present. 'A few months', 'as long as it takes' replace the figure — ambiguous. NEAR-MISS = ABSENT: a start date alone does not state duration — absent. Silence is absent.",
      },
      {
        key: "access_and_welfare_during_works",
        label: "Access to the home and welfare during the works",
        criteria: "present if the document states how the household's access and facilities are maintained (which door is usable, kitchen/bathroom availability, temporary partition, dust-tight screen with access retained). NEAR-MISS = ABSENT: 'we'll work around you' — absent. 'Access to be managed' = ambiguous. Silence is absent.",
      },
      {
        key: "power_water_continuity_during_works",
        label: "Continuity of power and water during the works",
        criteria: "EITHER/OR FIELD — present if the document states how power and water are maintained or when they will be interrupted (with durations/dates), OR explicitly states no interruption is expected. 'There may be the odd outage' = ambiguous. NEAR-MISS = ABSENT: 'we'll keep disruption to a minimum' — absent, never ambiguous. Silence is absent.",
      },
    ],
  },
];
