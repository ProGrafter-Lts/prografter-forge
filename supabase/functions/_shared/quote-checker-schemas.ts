// Fixed extraction schemas for the Pass 0/1/2 Quote Checker rebuild.
//
// One schema per module-checker category. Landscaping/Driveway is the pilot
// (see the build spec). Adding a new category later means adding a new
// CategoryDef[] here and a lookup entry in SCHEMAS — extract-quote's
// orchestration logic does not need to change.
//
// Lives under _shared/ (not inside extract-quote/) because both extract-quote
// and score-quote need it, and Supabase Edge Functions deploy independently —
// this repo's convention is that only _shared/ is importable across function
// directories.

import { EXTENSION_SCHEMA } from "./quote-checker-extension-schema.ts";
export { EXTENSION_SCHEMA };

export type FieldStatus = "present" | "absent" | "ambiguous";
export type EvidenceSource = "in_quote" | "supplied_in_supporting" | "not_found";

export interface FieldDef {
  key: string;
  label: string;
  /** Explicit present/ambiguous/absent adjudication rule for this field.
   *  Fields whose evidence is commonly inferential (a site visit implied by
   *  measurements, plant implied by an excavation line, etc.) MUST define
   *  criteria — without them the model re-adjudicates borderline evidence
   *  freshly on each run, which is what caused Pass 1 field flapping. */
  criteria?: string;
}

export interface CategoryDef {
  key: string;
  name: string;
  fields: FieldDef[];
}

export interface ExtractedField {
  status: FieldStatus;
  quote: string | null;
  evidence_source: EvidenceSource;
  /** true if a "present" field's quote was independently confirmed as a
   *  verbatim substring of extracted source text. false if no independent
   *  source text was available to check against (e.g. image-only upload). */
  verified: boolean;
}

export type ExtractionRecord = Record<string, Record<string, ExtractedField>>;

// ---- Landscaping / Driveway (39 fields across 10 categories) ---------------
export const LANDSCAPING_SCHEMA: CategoryDef[] = [
  {
    key: "quote_basics",
    name: "Quote Basics",
    fields: [
      { key: "contractor_name", label: "Contractor / landscaper name", criteria: "present if any business or trading name identifying the contractor appears (letterhead, header, sign-off). A trading name without a legal suffix such as Ltd/Limited still counts as present. Only a first name with no business name, or no name at all, is ambiguous/absent respectively." },
      { key: "contractor_contact", label: "Contractor contact details (phone, email or address)" },
      { key: "customer_name_address", label: "Customer name and site address", criteria: "COMPOUND FACT — this field requires BOTH a customer name AND a site address. Both present (address may be a full address, street + town, or postcode) = \"present\". Only one of the two (e.g. a name in a greeting such as \"Hi Dave,\" with no address, or an address with no named customer) = \"ambiguous\". Neither = \"absent\"." },
      { key: "quote_date", label: "Quote date" },
      { key: "quote_validity_period", label: "Quote validity period", criteria: "present only if a validity period or expiry for the price is stated." },
      { key: "vat_status", label: "VAT status (inclusive, exclusive, exempt, or VAT number given)" },
      { key: "price_fixed_or_estimate", label: "Whether the price is fixed or an estimate", criteria: "present only if the document explicitly uses wording such as \"fixed price\", \"estimate\", \"subject to survey\" or equivalent. Do NOT infer \"fixed\" merely because a single total is given." },
    ],
  },
  {
    key: "scope_area_measurements",
    name: "Scope / Area / Measurements",
    fields: [
      { key: "work_type", label: "Type of work (patio, driveway, fencing, turfing, landscaping, drainage, mixed)", criteria: "present if the document names the actual type of work (driveway, patio, fencing, turfing, drainage, or a named combination). COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that refers to the job collectively or makes a quality claim without naming a work type — 'landscaping works', 'the garden project', 'a first-class job', 'transform your outside space', 'full external works' — is ABSENT, NEVER ambiguous, however confident or repeated. Only a named work type moves this field off absent. Silence is absent." },
      { key: "area_m2", label: "Area in square metres", criteria: "present only if an area figure in m2 (or dimensions that are explicitly the works area) is stated." },
      { key: "site_visit_or_survey", label: "Confirmation of a site visit or measured survey", criteria: "present only if the document explicitly states a site visit, site survey or measured survey took place or is included. Detailed measurements, areas or levels alone are NOT evidence of a visit — absent. NEAR-MISS = ABSENT: social or passing pleasantries about having attended — 'thanks for having us round', 'good to meet you', 'as discussed at yours' — state no visit, survey or measurement activity and are ABSENT, never ambiguous. Silence is absent." },
    ],
  },
  {
    key: "excavation_ground_prep",
    name: "Excavation / Ground Preparation",
    fields: [
      { key: "excavation_depth", label: "Excavation / dig depth", criteria: "present only if a dig/excavation depth figure is given." },
      { key: "existing_surface_removal", label: "Removal of existing surface", criteria: "present only if removal or breaking out of the existing surface is stated." },
      { key: "ground_conditions_flagged", label: "Ground conditions or unknowns flagged as a risk", criteria: "present only if the document names ground conditions/subsoil/unknowns as a risk or caveat. A generic exclusions list that does not mention ground is absent." },
    ],
  },
  {
    key: "sub_base_drainage_falls",
    name: "Sub-Base / Drainage / Falls",
    fields: [
      { key: "sub_base_material_depth", label: "Sub-base material and depth", criteria: "COMPOUND FACT — needs BOTH a named sub-base material (MOT Type 1, hardcore, scalpings, concrete) AND a depth figure. Both = present. One of the two only = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that asserts a sub-base was done well without naming material or depth — 'proper sub-base laid', 'solid foundation', 'prepared to a high standard', 'correct base put down' — is ABSENT, NEVER ambiguous, because it carries no specification. Silence is absent." },
      { key: "compaction_method", label: "Compaction method", criteria: "present only if a compaction action or plant is named (e.g. \"whacker plate\", \"vibrating roller\", \"compacted in layers\"). \"Sub-base laid to depth\" alone is absent." },
      { key: "falls_gradient", label: "Falls / gradient for water run-off", criteria: "present only if a fall, gradient, crossfall or drainage slope is explicitly stated. Mentioning drainage alone is absent." },
      { key: "drainage_provision", label: "Drainage provision (channel drains, ACO, soakaway etc.)", criteria: "present only if a drainage device or measure is named (channel drain, ACO, linear drain, gully, soakaway, permeable build-up). COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that claims drainage is handled without naming any device or measure — 'proper drainage throughout', 'water will run away fine', 'drainage all taken care of', 'fully draining surface' — is ABSENT, NEVER ambiguous. Silence is absent." },
      { key: "drainage_discharge_point", label: "Drainage discharge point", criteria: "present only if the destination of water is named (soakaway, existing gully, surface water drain, etc.). Naming only the collection device is absent." },
    ],
  },
  {
    key: "materials_finish_spec",
    name: "Materials / Finish Specification",
    fields: [
      { key: "material_type_brand", label: "Material type / brand", criteria: "present if a specific material product, range or brand is named (e.g. 'Marshalls Drivesett Tegula', 'Indian sandstone', 'tumbled concrete block paving'). A bare generic category with no product, range or brand ('block paving', 'slabs') = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): a quality or collective claim about the materials with no product, range or brand named — 'quality block paving throughout', 'top-grade materials', 'premium slabs', 'best materials used' — is ABSENT, NEVER ambiguous, however confident the wording. Silence is absent." },
      { key: "thickness_colour_pattern", label: "Thickness, colour and laying pattern", criteria: "present if at least two of thickness, colour and laying pattern are stated with actual values (e.g. '50mm, charcoal, herringbone'). One of the three only = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that praises or generalises the finish without stating a thickness, colour or named pattern — 'laid to a lovely finish', 'attractive pattern', 'nice colour to suit the house', 'laid neatly throughout' — is ABSENT, NEVER ambiguous. Silence is absent." },
      { key: "jointing_method", label: "Jointing method", criteria: "present if the jointing/pointing material or method is named (kiln-dried sand, resin, mortar)." },
      { key: "sealing_finishing", label: "Sealing / finishing", criteria: "present only if a sealant, sealing coat or surface finishing treatment of the laid surface is stated. Jointing sand, brushing-in, jet washing or site clean-down are NOT sealing — mark absent." },
    ],
  },
  {
    key: "edging_steps_retaining",
    name: "Edging / Steps / Retaining Details",
    fields: [
      { key: "edging_type_included", label: "Edging type / whether included", criteria: "present only if an edging type or edge restraint is named, or edging is explicitly excluded/included." },
      { key: "steps_retaining_walls", label: "Steps / retaining walls", criteria: "present only if steps or retaining walls are explicitly described, priced, or explicitly excluded. Silence is absent." },
    ],
  },
  {
    key: "waste_removal_access_plant",
    name: "Waste Removal / Access / Plant",
    fields: [
      { key: "waste_spoil_removal", label: "Waste / spoil removal", criteria: "present only if removal/disposal of spoil or waste is explicitly stated (or explicitly excluded). A skip line item counts." },
      { key: "access_route", label: "Access route", criteria: "present only if the access route, access constraints or access width is described. Silence is absent." },
      { key: "plant_hire", label: "Plant hire (mini digger, dumper, breaker)", criteria: "present only if specific plant or machinery is named (mini digger, dumper, breaker, roller) or a plant/machine hire cost line appears. Words like \"excavate\", \"dig out\" or \"machine excavation\" WITHOUT a named machine are absent, not ambiguous." },
      { key: "protection_of_existing_surfaces", label: "Protection of existing surfaces", criteria: "present only if protecting existing surfaces/property (boards, sheeting, covering) is explicitly stated. Site tidiness or jet washing is absent." },
    ],
  },
  {
    key: "exclusions_extras_risk",
    name: "Exclusions / Extras / Risk Items",
    fields: [
      { key: "exclusions_list", label: "Exclusions list", criteria: "present only if the document has an explicit exclusions/not-included statement." },
      { key: "risk_items_flagged", label: "Risk items flagged (buried services, unknown ground etc.)", criteria: "present only if a specific risk (buried services, unknown ground, asbestos, tree roots) is named as a risk or caveat." },
      { key: "variation_process", label: "Variation process for changes on site", criteria: "present only if the document states how changes/extras are agreed or priced. A day rate alone is ambiguous." },
    ],
  },
  {
    key: "price_vat_payment",
    name: "Price / VAT / Payment Terms",
    fields: [
      { key: "total_price", label: "Total price" },
      { key: "deposit_amount", label: "Deposit amount", criteria: "present if a deposit or up-front payment is stated as a determinate figure — a cash sum ('£2,000 deposit') OR a percentage where a total price is also stated ('50% up front' alongside a £8,500 total), since the amount is then calculable. ambiguous if a deposit is mentioned with no figure and no calculable percentage ('a deposit will be required', 'small payment up front'). NEAR-MISS = ABSENT: payment wording that names no deposit or up-front element at all. Silence is absent. NOTE: shared evidence is allowed — the same sentence may also evidence staged_payment_schedule." },
      { key: "staged_payment_schedule", label: "Staged payment schedule", criteria: "present if the document states TWO OR MORE distinct payment points, or a stage-by-stage schedule. A deposit counts as one payment point, and the SAME sentence used for deposit_amount may also be used here — evidence is not consumed by another field. Examples of present: 'deposit on acceptance, balance on completion'; 'deposit, interim payment at sub-base, final balance'. absent only if a single payment point (or none) is stated. ambiguous if payment points are mentioned but the timing or split is vague or non-committal (e.g. 'stage payments as work progresses')." },
    ],
  },
  {
    key: "timescale_guarantees_handover",
    name: "Timescale / Guarantees / Handover",
    fields: [
      { key: "start_date", label: "Start date", criteria: "present only if a start date, start window or lead time is stated. \"Subject to availability\" alone is ambiguous." },
      { key: "duration", label: "Duration", criteria: "present if a specific number of days or weeks on site is stated, even where a reasonable real-world qualifier is attached ('8 working days, subject to weather', 'estimated at 10 days' — the figure is still actionable). Ambiguous only where the hedge REPLACES the figure ('about a week or so', 'a few weeks', 'depends how it goes')." },
      { key: "workmanship_guarantee", label: "Workmanship guarantee", criteria: "present only if a workmanship guarantee/warranty with or without a period is stated." },
      { key: "material_warranty", label: "Material / manufacturer warranty", criteria: "present only if a manufacturer or material warranty is stated. A workmanship guarantee alone is absent." },
      { key: "aftercare_guidance", label: "Aftercare guidance", criteria: "present only if aftercare, maintenance or curing guidance is given. Silence is absent." },
    ],
  },
];

// ---- Boiler / Heating (18 fields across 5 categories) ----------------------
//
// Written after the Landscaping pilot, so the three bug classes that pilot
// surfaced are designed in rather than discovered again:
//   1. NO-REUSE: a single sentence may legitimately evidence several fields
//      (a price line can evidence total price AND VAT; a payment sentence can
//      evidence deposit AND schedule). Criteria below say so explicitly where
//      the overlap is predictable. The prohibition is only on transferring
//      evidence about a DIFFERENT subject.
//   2. COMPOUND FACTS: every field that needs two or more things together is
//      labelled COMPOUND FACT and spells out "one part only = ambiguous".
//   3. VAGUENESS / HEDGING: fields where hedged wording is common in real
//      boiler quotes state what counts as a genuine figure vs a vague one,
//      applying the precision-hedge (figure survives) vs commitment-hedge
//      (figure replaced) distinction.
export const BOILER_SCHEMA: CategoryDef[] = [
  {
    key: "quote_basics",
    name: "Quote Basics",
    fields: [
      {
        key: "installer_name",
        label: "Installer / heating company name",
        criteria: "present if any business or trading name identifying the installer appears (letterhead, header, sign-off). A trading name without Ltd/Limited still counts. A first name only with no business name is ambiguous; no name at all is absent.",
      },
      {
        key: "gas_safe_registration",
        label: "Gas Safe registration (registered business and registration number)",
        criteria: "COMPOUND FACT — needs BOTH a claim of Gas Safe registration AND a registration number. Both = present. Only one part (e.g. 'we are Gas Safe registered' with no number, or a bare number with no context) = ambiguous. NEAR-MISS = ABSENT: 'fully qualified', 'certified engineers', 'time served', '20 years experience', 'Corgi registered' do NOT name Gas Safe registration and are absent, not ambiguous. Neither part mentioned = absent. NOTE: the same header block may also evidence installer_name and installer_contact — shared evidence is allowed.",
      },
      {
        key: "customer_name_address",
        label: "Customer name and installation address",
        criteria: "COMPOUND FACT — needs BOTH a customer name AND an installation/site address. Both = present (address may be full, street + town, or postcode). Only one (a greeting such as 'Hi Dave,' with no address, or an address with no named customer) = ambiguous. Neither = absent.",
      },
      {
        key: "quote_date_and_validity",
        label: "Quote date and how long the price is held",
        criteria: "COMPOUND FACT — needs BOTH a quote/issue date AND a validity or expiry period for the price. Both = present. Only one = ambiguous. Neither = absent. 'Prices subject to change' with no period is not a validity period — treat as the missing half. HEDGING: 'valid for approximately 30 days' is still present (figure survives the hedge); 'valid for a short while' is ambiguous (hedge replaced the figure).",
      },
    ],
  },
  {
    key: "appliance_system_spec",
    name: "Appliance / System Specification",
    fields: [
      {
        key: "boiler_make_and_model",
        label: "Boiler make and model",
        criteria: "COMPOUND FACT — needs BOTH manufacturer AND a specific model/range name or number (e.g. 'Worcester Bosch Greenstar 4000 30kW'). Both = present. Make only ('a Worcester boiler'), or model with no make, = ambiguous. 'A quality A-rated combi' with neither = absent. HEDGING: 'Vaillant ecoTEC Plus 832 or equivalent' still names a base spec — present. 'A Worcester or similar' names no model — ambiguous.",
      },
      {
        key: "boiler_output_kw",
        label: "Boiler output rating in kW",
        criteria: "present if a specific kW output figure for the boiler is stated (e.g. '30kW', '24 kW output', or a model name whose number IS the stated output such as 'Greenstar 4000 30kW'). HEDGING (precision vs commitment): 'approximately 30kW' keeps a usable figure — present; 'a bigger boiler', 'the right size for you', 'sufficient output' replace the figure — ambiguous. NEAR-MISS = ABSENT: a model/range name with no kW figure anywhere (e.g. 'Vaillant ecoTEC Plus') does not state output — absent, not ambiguous. NOTE: shared evidence is allowed — the same spec line may also evidence boiler_make_and_model.",
      },

      {
        key: "system_type",
        label: "System type (combi, system, regular / heat-only) and any conversion",
        criteria: "present if the system type is named, or if a conversion is described (e.g. 'convert from regular to combi', 'remove cylinder and tanks'). Naming the boiler model alone is NOT evidence of system type — that is absent, not ambiguous. Mentioning 'new boiler' with no type is absent. Contradictory or unclear type wording is ambiguous.",
      },
      {
        key: "sizing_basis_or_survey",
        label: "Basis for sizing — heat loss calculation or site survey",
        criteria: "present only if the document explicitly states a heat loss calculation, radiator sizing exercise, or a site survey/visit that took place or is included. NEAR-MISS = ABSENT: detailed measurements or a room list alone, a claim that the boiler is 'correctly sized' or 'we'll size it properly' with no named calculation, and passing social references ('thanks for the call the other day', 'good to meet you', 'thanks for having us round') are all ABSENT, not ambiguous — none of them name a heat loss calculation or survey. 'Survey to be carried out before works' names the subject but is only promised = ambiguous.",
      },
    ],
  },
  {
    key: "installation_works",
    name: "Installation Works",
    fields: [
      {
        key: "flue_route_and_termination",
        label: "Flue route and termination point",
        criteria: "COMPOUND FACT — needs BOTH the flue run/route AND where it terminates (wall, roof, rear, vertical, above a specified height). Both = present. Only one, e.g. 'new flue supplied' or 'horizontal flue' with no location, = ambiguous. No flue mention = absent.",
      },
      {
        key: "system_flush_and_filter",
        label: "System cleanse / power flush and magnetic filter",
        criteria: "COMPOUND FACT — needs BOTH a cleanse of the system (chemical flush, power flush, hot flush) AND a magnetic system filter fitted. Both = present. Only one = ambiguous. Neither = absent. Inhibitor dosing alone is NOT a flush and NOT a filter — absent unless one of the two is separately stated. Note the flush and filter often appear in one sentence that also evidences nothing else; if the same sentence also names controls, it may evidence controls_and_thermostat too.",
      },
      {
        key: "controls_and_thermostat",
        label: "Heating controls and thermostat supplied",
        criteria: "present only if a control or thermostat is named or specified (room thermostat, programmer, smart control, TRVs, brand named). 'Existing controls reused' is also present — it is a stated decision. 'Controls as required' or 'we can look at controls' is ambiguous. No mention is absent.",
      },
      {
        key: "gas_supply_and_pipework",
        label: "Gas supply / pipework — upgrade, re-run or condensate route",
        criteria: "present if the document states gas pipe sizing/upgrade, pipework re-runs, or the condensate discharge route. Any ONE of these three is enough — this is NOT a compound field. 'Any pipework needed' or 'pipe upgrade may be required at extra cost' is ambiguous. Silence is absent.",
      },
      {
        key: "making_good_and_waste_removal",
        label: "Making good, protection of the property and removal of old appliance / waste",
        criteria: "EITHER/OR FIELD — present if the document states ANY ONE of: removal/disposal of the old boiler or waste, OR making good / protecting the property (dust sheets, boarding, decoration limits). One clear qualifying statement (e.g. 'we'll take the old one away') makes this PRESENT even if other wording in the same quote is vague — vague wording elsewhere does not downgrade solid evidence. Explicit exclusion ('making good not included') is also present. NEAR-MISS = ABSENT: 'we leave things tidy' / 'we're clean workers' on their own do not name waste removal or making good and are absent. Silence is absent.",
      },
      {
        key: "radiators_and_cylinder_scope",
        label: "Radiators, valves and hot water cylinder — what is and is not included",
        criteria: "EITHER/OR FIELD — present if the document states the position on ANY ONE of: radiators (number supplied/replaced/reused, or radiators explicitly excluded), TRVs/valves, or the hot water cylinder (new cylinder, cylinder retained, or cylinder removed). A clear exclusion counts as present — 'radiators not included in this price' is a stated scope decision. One solid statement makes this present even if other wording nearby is vague. NEAR-MISS = ABSENT: 'full central heating system', 'everything you need', 'boiler swap' do not state radiator, valve or cylinder scope — absent, not ambiguous. 'We can look at radiators if needed' or 'some radiators may need replacing' is ambiguous. Silence is absent.",
      },

    ],
  },
  {
    key: "compliance_certification",
    name: "Compliance / Certification",
    fields: [
      {
        key: "building_regs_notification",
        label: "Building Regulations notification (Gas Safe / local authority)",
        criteria: "present only if the document states the installation will be notified to Building Control or Gas Safe, or that a Building Regulations compliance certificate will be issued. A Gas Safe registration number alone is NOT notification — absent (different subject: registration vs notification). 'All certificates provided' with no named certificate is ambiguous.",
      },
      {
        key: "commissioning_and_benchmark",
        label: "Commissioning and Benchmark checklist / handover documentation",
        criteria: "present only if commissioning of the appliance, completion of the Benchmark checklist, or issue of the manufacturer's commissioning record is stated. 'We will test it works' is ambiguous. Silence is absent. A warranty registration promise alone belongs to the warranty field, not here.",
      },
    ],
  },
  {
    key: "price_terms_guarantees",
    name: "Price / Terms / Guarantees",
    fields: [
      {
        key: "total_price_and_vat",
        label: "Total price and VAT position",
        criteria: "COMPOUND FACT — needs BOTH a total price figure AND its VAT position (inclusive, exclusive, a VAT line, a VAT number, or a stated 0%/5% rate). Both = present. A total with no VAT position stated, or a VAT statement with no total, = ambiguous. Neither = absent. The SAME price line may evidence both halves (e.g. 'Total £3,450 including VAT') and may also be reused by payment_terms — evidence is not consumed by another field.",
      },
      {
        key: "payment_terms",
        label: "Payment terms — deposit and/or staged payments",
        criteria: "present if the document states when money is due: a deposit with a balance point, two or more payment points, or a stage schedule. A deposit alone with no stated balance point is ambiguous. The SAME sentence may also have been used for total_price_and_vat — that is allowed. 'Payment on completion' alone IS a stated single term — present. 'Terms to be agreed' or 'usual terms' is ambiguous. No mention is absent.",
      },
      {
        key: "installation_date_and_duration",
        label: "Installation date and how long the job takes",
        criteria: "Either a start date/window OR an on-site duration qualifies — this is NOT a compound field. HEDGING (precision vs commitment): 'usually a one-day install', 'estimated 2 days', 'anticipated start 16 March' all keep a concrete figure or date — present. 'We'll fit you in soon', 'about a day or so', 'as soon as we can' leave nothing concrete — ambiguous. No mention is absent.",
      },
      {
        key: "warranty_manufacturer_and_workmanship",
        label: "Manufacturer warranty and workmanship guarantee",
        criteria: "COMPOUND FACT — needs BOTH a manufacturer/appliance warranty (with or without a period) AND an installer workmanship guarantee. Both = present. Only one (e.g. '10 year Worcester warranty' with nothing on the installer's own work) = ambiguous. Neither = absent. HEDGING: 'up to 10 years subject to registration and annual servicing' still names a period — that half counts as stated.",
      },
      {
        key: "price_fixed_or_estimate",
        label: "Whether the price is fixed or an estimate",
        criteria: "present if the document states the status of the price: 'fixed price', 'no hidden extras', 'this price is guaranteed', or equally clearly that it is an 'estimate', 'guide price', or 'subject to survey'. Either direction counts — the homeowner needs to know which. NEAR-MISS = ABSENT: a bare total with no status wording does not state fixed-or-estimate — absent, not ambiguous (a price alone is a different subject and is already covered by total_price_and_vat). Contradictory wording ('fixed price, subject to change on the day') is ambiguous. NOTE: shared evidence is allowed — the same price line may also evidence total_price_and_vat.",
      },
      {
        key: "exclusions_and_variations",
        label: "Exclusions and how extra work / variations are handled",
        criteria: "EITHER/OR FIELD — present if the document states ANY ONE of: a named exclusion (e.g. 'electrical work not included', 'asbestos removal excluded'), or how variations/extras are priced and agreed ('any additional work agreed in writing before starting', 'day rate £x for extras'). One clear qualifying statement makes this present. 'Extra costs may apply' or 'anything else will be chargeable' with no named exclusion and no process is ambiguous — it flags cost but sets no terms. NEAR-MISS = ABSENT: 'price includes everything listed above' merely restates the scope and names no exclusion or variation process — absent. Silence is absent.",
      },

    ],
  },
];

// ---- Bathroom (21 fields across 6 categories) ------------------------------
//
// Written after the Landscaping pilot and the Boiler build, so all four rule
// classes those two surfaced are designed in from the start:
//   1. NO-REUSE is scoped: shared evidence between fields is explicitly
//      allowed where the overlap is predictable (a price line evidencing both
//      total and VAT; a strip-out line evidencing both scope and waste).
//   2. COMPOUND FACTS: fields needing two things together are labelled and
//      spell out "one part only = ambiguous".
//   3. HEDGING: precision hedge (figure survives) = present; commitment hedge
//      (figure replaced) = ambiguous.
//   4. NEAR-MISS: wording gesturing at an adjacent subject without naming this
//      field's actual subject is ABSENT, not ambiguous.
//   5. EITHER/OR: one solid qualifying fact is enough; vague wording nearby
//      does not downgrade it.
export const BATHROOM_SCHEMA: CategoryDef[] = [
  {
    key: "quote_basics",
    name: "Quote Basics",
    fields: [
      {
        key: "installer_name",
        label: "Installer / bathroom fitting company name",
        criteria: "present if any business or trading name identifying the installer appears (letterhead, header, sign-off). A trading name without Ltd/Limited still counts. A first name only with no business name is ambiguous. No name at all is absent. NOTE: the same header block may also evidence customer_name_address and quote_date_and_validity — shared evidence is allowed.",
      },
      {
        key: "customer_name_address",
        label: "Customer name and installation address",
        criteria: "COMPOUND FACT — needs BOTH a customer name AND an installation/site address. Both = present (address may be full, street + town, or postcode). Only one (a greeting such as 'Hi Sarah,' with no address, or an address with no named customer) = ambiguous. Neither = absent.",
      },
      {
        key: "quote_date_and_validity",
        label: "Quote date and how long the price is held",
        criteria: "COMPOUND FACT — needs BOTH a quote/issue date AND a validity or expiry period for the price. SEARCH THE WHOLE DOCUMENT FOR BOTH HALVES BEFORE GRADING: the date is usually in the header and the validity clause is very often in a closing line at the very bottom ('this quotation is valid for 30 days from the date above'). If both halves appear anywhere in the document, however far apart, the answer is PRESENT — do not grade ambiguous merely because they are not in the same sentence or section. Only one half found anywhere = ambiguous. Neither = absent. 'Prices subject to change' with no period is NOT a validity period — treat it as the missing half. HEDGING: 'valid for approximately 30 days' is present (figure survives the hedge); 'valid for a short while' is ambiguous (hedge replaced the figure).",
      },
    ],
  },
  {
    key: "scope_and_layout",
    name: "Scope and Layout",
    fields: [
      {
        key: "room_size_or_layout",
        label: "Bathroom size or layout — dimensions, or a stated layout change",
        criteria: "EITHER/OR FIELD — present if the document states EITHER room dimensions/floor area (e.g. '2.4m x 1.8m', '4.3 m2') OR a specific layout position/change ('bath moves to the window wall', 'WC stays in the existing position', 'basin relocated to the left-hand wall'). One solid qualifying fact makes this present even if other wording nearby is vague. HEDGING: 'approximately 2.4m x 1.8m' keeps the figures — present; 'a small bathroom', 'standard size', 'a decent sized room' replace the figures and name no layout position — ambiguous. NEAR-MISS = ABSENT: 'full bathroom refurbishment', 'complete new bathroom' describe the job, not the room's size or layout — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "strip_out_and_waste_removal",
        label: "Strip-out of the existing bathroom and removal of waste",
        criteria: "EITHER/OR FIELD — present if the document states EITHER removal/strip-out of the existing suite, tiles or floor, OR removal/disposal of the resulting waste (skip, tip runs, 'we take it all away'). One clear statement makes this present even if other wording is vague. Explicit exclusion ('skip to be provided by the customer', 'strip-out not included') is ALSO present — it is a stated scope decision. NEAR-MISS = ABSENT: 'we leave the place tidy', 'clean and respectful workers' name neither strip-out nor waste removal — absent, not ambiguous. Silence is absent. NOTE: one strip-out sentence may evidence this field and also making_good_and_decoration where it names both.",
      },
      {
        key: "suite_items_scope",
        label: "Which sanitaryware items are included (bath, shower, WC, basin, screen, furniture)",
        criteria: "present if the document lists the specific items being supplied or fitted (bath, shower enclosure/tray, WC, basin, vanity unit, screen). At least two named items, or an itemised list, = present. A single named item with nothing else and no list = ambiguous. COLLECTIVE-NOUN RULE (overrides everything else in this field): any wording that refers to the suite, the sanitaryware or the bathroom COLLECTIVELY without naming individual fixtures — 'new bathroom suite', 'full bathroom refurbishment', 'fit your new suite', 'all sanitaryware included', 'quality branded sanitaryware', 'the whole bathroom', 'everything you need' — is ABSENT, NEVER ambiguous, no matter how confident, branded, quality-claiming or repeated the wording is, and no matter what verb ('supply', 'fit', 'install', 'rip out and replace') sits next to it. Such wording carries zero item-level information, so there is nothing to be ambiguous about. Only individually named fixtures can move this field off absent. An explicit exclusion of a named item ('shower screen supplied by customer') counts towards present. Silence is absent.",
      },
      {
        key: "tiling_scope_and_area",
        label: "Tiling scope — which surfaces are tiled and how much",
        criteria: "COMPOUND FACT — needs BOTH which surfaces are tiled (walls, floor, full-height, splashback, shower area only) AND an extent (m2, number of walls, 'full height to ceiling', 'floor to ceiling in the shower enclosure only'). Both = present. Only one, e.g. 'tiling included' or 'walls and floor tiled' with no extent, = ambiguous. HEDGING: 'approximately 18 m2 of wall tiling' keeps the figure — present; 'a fair bit of tiling' is ambiguous. Neither part = absent. Explicit exclusion of tiling with the surfaces named ('floor tiling not included, walls only') = present.",
      },
    ],
  },
  {
    key: "materials_and_specification",
    name: "Materials and Specification",
    fields: [
      {
        key: "sanitaryware_make_and_model",
        label: "Sanitaryware make and model / range",
        criteria: "COMPOUND FACT — needs BOTH a manufacturer/brand AND a specific range or model name for at least one main item (e.g. 'Roca The Gap close-coupled WC', 'Ideal Standard Tesi basin'). Both = present. Brand only ('Roca sanitaryware'), or a range name with no brand, = ambiguous. HEDGING: 'Roca The Gap or equivalent' still names a base spec — present; 'Roca or similar' names no range — ambiguous. NEAR-MISS = ABSENT: 'quality branded sanitaryware', 'white ceramic suite', 'premium fittings' name no manufacturer or range — absent, not ambiguous.",
      },
      {
        key: "brassware_and_shower_spec",
        label: "Taps, shower valve and shower type specified",
        criteria: "EITHER/OR FIELD — present if the document specifies EITHER the shower type/valve (thermostatic mixer, electric shower with kW rating, digital, bar valve) OR the brassware/taps by brand, model or type. One solid specification makes this present even if other brassware wording is vague. HEDGING: 'a 8.5kW electric shower' or 'thermostatic bar mixer' are concrete — present. AMBIGUOUS (not absent): wording that names the shower or the taps and makes a QUALITY CLAIM about them without any type, brand or rating — 'you'll get a good shower out of it', 'nice modern taps', 'a decent shower' — the subject is named but nothing is specified. NEAR-MISS = ABSENT: a bare scope listing with no claim and no specification, e.g. 'shower fitted', 'taps included', 'new shower' in an items list — that states only that the item is in scope (which belongs to suite_items_scope). Silence is absent.",
      },
      {
        key: "material_allowances_and_supply_responsibility",
        label: "Material allowances (PC / budget sums) and who supplies the materials",
        criteria: "EITHER/OR FIELD — present if the document states EITHER a money allowance/PC sum for materials ('£1,200 allowance for tiles and sanitaryware', 'tiles budgeted at £35/m2') OR who is supplying the materials ('all materials supplied by us', 'customer to supply tiles and sanitaryware'). One clear statement makes this present. HEDGING: 'an allowance of around £1,200' keeps the figure — present; 'a sensible allowance for tiles' replaces the figure and names no supplier — ambiguous. NEAR-MISS = ABSENT: 'materials included' alone states neither an allowance figure nor who chooses/buys them at what budget — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "installation_works",
    name: "Installation Works",
    fields: [
      {
        key: "plumbing_alterations_and_pipework",
        label: "Plumbing alterations — pipework re-runs, soil/waste moves, isolation valves",
        criteria: "present if the document states specific plumbing work: pipework re-runs or first-fix, moving or extending soil/waste connections, new isolation valves, or a stated position that no pipework moves ('all services stay in their current positions'). Any ONE of these is enough — NOT a compound field. 'Any pipework required' or 'plumbing as needed' is ambiguous. NEAR-MISS = ABSENT: 'plumbing included', 'we do all the plumbing' name no alteration, re-run or position — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "electrical_works_and_extractor",
        label: "Electrical works and extractor fan / ventilation installation",
        criteria: "EITHER/OR FIELD — present if the document states EITHER specific electrical work (new spur, shower circuit, downlights, IP-rated fittings, lighting alteration) OR supply/fitting of an extractor fan or mechanical ventilation. One clear statement makes this present even if other electrical wording is vague. Explicit exclusion ('electrical works by others') is also present. 'Electrics may need upgrading' with nothing named is ambiguous. NEAR-MISS = ABSENT: 'we'll sort the lights out', 'electrician available if needed' name no works and commit to nothing — absent. Silence is absent. NOTE: this is the WORKS field; the certificate for those works is a different subject and belongs to electrical_certification_part_p.",
      },
      {
        key: "waterproofing_and_substrate_prep",
        label: "Waterproofing / tanking and preparation of walls and floor before tiling",
        criteria: "EITHER/OR FIELD — present if the document states EITHER waterproofing/tanking of wet areas (tanking kit, wet-room membrane, waterproof boarding to the shower area) OR substrate preparation before tiling (over-boarding, cement board, plasterboarding, plywood/floor overlay, levelling compound). One solid statement makes this present. 'Walls prepared as necessary' or 'we'll make sure it's ready for tiling' is ambiguous. NEAR-MISS = ABSENT: 'sealed around the bath', 'silicone applied' name a finishing seal, not tanking or substrate prep — absent, not ambiguous. Silence is absent.",
      },
      {
        key: "making_good_and_decoration",
        label: "Making good and decoration after the works",
        criteria: "EITHER/OR FIELD — present if the document states EITHER making good (plastering, patching, filling, reinstating skirting/architrave) OR the decoration position (painting included, ceiling painted, or explicitly 'decoration not included'). One clear statement, including a clear exclusion, makes this present even if other wording is vague. 'We'll leave it ready for decorating' IS a stated position — present. NEAR-MISS = ABSENT: 'we clean up after ourselves', 'dust sheets used' name protection/cleaning, not making good or decoration — absent, not ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "compliance_certification",
    name: "Compliance and Certification",
    fields: [
      {
        key: "electrical_certification_part_p",
        label: "Electrical certification — Part P / minor works certificate by a registered electrician",
        criteria: "present only if the document states that an electrical certificate will be issued, or that the electrical work is notified under Part P, or names a registered electrician's scheme (NICEIC, NAPIT, ELECSA) in connection with the work. NEAR-MISS = ABSENT: 'our electrician is fully qualified', 'time served spark', 'all work to regulations' do not name a certificate, Part P or a scheme — absent, not ambiguous. 'All certificates provided' with no named certificate is ambiguous. Doing the electrical work (electrical_works_and_extractor) is a DIFFERENT subject and does not evidence certification. Silence is absent.",
      },
      {
        key: "building_regs_and_ventilation_compliance",
        label: "Building Regulations compliance — ventilation rate, zoning, or notification",
        criteria: "present only if the document names a Building Regulations requirement being met: a ventilation/extract rate (e.g. '15 l/s intermittent extract', 'Part F compliant fan'), bathroom electrical zoning/IP ratings, or notification to Building Control. NEAR-MISS = ABSENT: fitting an extractor fan with no rate or regulation named (that is electrical_works_and_extractor), and generic 'all work meets current regulations', are absent, not ambiguous — they name no requirement. 'Building Control to be notified if required' is ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "price_terms_guarantees",
    name: "Price, Terms and Guarantees",
    fields: [
      {
        key: "total_price_and_vat",
        label: "Total price and VAT position",
        criteria: "COMPOUND FACT — needs BOTH a total price figure AND its VAT position (inclusive, exclusive, a VAT line, a VAT number, or a stated rate). Both = present. A total with no VAT position, or a VAT statement with no total, = ambiguous. Neither = absent. The SAME price line may evidence both halves ('Total £8,450 including VAT') and may also be reused by payment_terms and price status wording — evidence is not consumed by another field.",
      },
      {
        key: "payment_terms",
        label: "Payment terms — deposit and/or staged payments",
        criteria: "present if the document states when money is due: a deposit with a balance point, two or more payment points, or a stage schedule. A deposit alone with no stated balance point is ambiguous. 'Payment on completion' alone IS a stated single term — present. 'Terms to be agreed' or 'usual terms' is ambiguous. The same sentence may also have been used for total_price_and_vat — that is allowed and does not weaken this field. No mention is absent.",
      },
      {
        key: "programme_dates_and_duration",
        label: "Start date and how long the bathroom will be out of use",
        criteria: "EITHER/OR FIELD — a start date/window OR an on-site duration qualifies; NOT a compound field. HEDGING (precision vs commitment): 'estimated 8 working days', 'usually 7-10 days', 'anticipated start 3 March, subject to material lead times' all keep a concrete figure or date — present. 'We'll fit you in soon', 'about a week or so', 'as soon as we can' leave nothing concrete — ambiguous. No mention is absent.",
      },
      {
        key: "warranty_and_workmanship_guarantee",
        label: "Workmanship guarantee and product/manufacturer warranty",
        criteria: "COMPOUND FACT — needs BOTH an installer workmanship guarantee AND a product/manufacturer warranty on the goods supplied. Both = present. Only one (e.g. '10 year guarantee on the shower valve' with nothing on the installer's own work, or '2 year workmanship guarantee' with nothing on the products) = ambiguous. Neither = absent. HEDGING: 'up to 10 years subject to registration' still names a period — that half counts as stated. NEAR-MISS = ABSENT for a bare 'we stand by our work' with no guarantee named on either side.",
      },
      {
        key: "exclusions_and_variations",
        label: "Exclusions and how extra work / variations are handled",
        criteria: "EITHER/OR FIELD — present if the document states ANY ONE of: a named exclusion ('asbestos removal excluded', 'no allowance for replacing rotten floor joists'), or how variations are priced and agreed ('any additional work agreed in writing before starting', 'extras charged at £250/day'). One clear qualifying statement makes this present. 'Extra costs may apply' or 'anything unforeseen will be chargeable' with no named exclusion and no process is ambiguous — it flags cost but sets no terms. NEAR-MISS = ABSENT: 'price includes everything listed above' merely restates scope and names no exclusion or process — absent. Silence is absent.",
      },
    ],
  },
];

// ---- Electrical / Rewire (42 fields across the module's 10 categories) -----
//
// Structure mirrors the 10 scoring categories already defined for the
// electrical_rewire module in src/lib/quoteCheckerModules.ts. Every bug class
// surfaced by Landscaping, Boiler and Bathroom is designed in from the start:
//   1. NEAR-MISS = ABSENT (corrected Boiler wording, never the original
//      Landscaping "pleasantries are ambiguous" wording).
//   2. COLLECTIVE-NOUN / QUALITY-CLAIM KILL on every field that invites a
//      "fully rewired throughout to a high standard" dodge.
//   3. COMPOUND FACT fields spell out "one half only = ambiguous".
//   4. HEDGING: precision hedge (figure survives) = present; commitment hedge
//      (figure replaced) = ambiguous.
//   5. NO-REUSE stays narrow — shared evidence between two fields legitimately
//      evidenced by the same sentence is explicitly allowed.
export const ELECTRICAL_SCHEMA: CategoryDef[] = [
  {
    key: "quote_basics",
    name: "Quote Basics",
    fields: [
      {
        key: "customer_name_and_address",
        label: "Customer name and address",
        criteria: "COMPOUND FACT — needs BOTH a customer name AND a customer address (full address, street + town, or postcode). Both = present. Only one (a greeting such as 'Hi Mark,' with no address, or an address with no named customer) = ambiguous. Neither = absent. NOTE: the same header block may also evidence property_address_worked and trade_business_details — shared evidence is allowed.",
      },
      {
        key: "property_address_worked",
        label: "Address of the property being rewired",
        criteria: "present if the document names the property where the work will be carried out (a site/installation address line, or a customer address the document clearly treats as the work address). Only one address in the document, given as the customer's address, counts as present for this field too — shared evidence is allowed. NEAR-MISS = ABSENT: 'at your property', 'at yours', 'the house' name no address — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "quote_date_and_validity",
        label: "Quote date and how long the price is held",
        criteria: "COMPOUND FACT — needs BOTH a quote/issue date AND a validity or expiry period for the price. SEARCH THE WHOLE DOCUMENT FOR BOTH HALVES BEFORE GRADING: the date is usually in the header and the validity clause is very often a closing line at the very bottom. If both halves appear anywhere in the document, however far apart, the answer is PRESENT. Only one half found anywhere = ambiguous. Neither = absent. 'Prices subject to change' with no period is NOT a validity period — treat it as the missing half. HEDGING: 'valid for approximately 30 days' is present (figure survives); 'valid for a short while' is ambiguous (figure replaced).",
      },
      {
        key: "trade_business_details",
        label: "Electrician / business name and contact details",
        criteria: "COMPOUND FACT — needs BOTH a business or trading name AND at least one contact route (phone, email, or business address). Both = present. Only one (a letterhead name with no contact route, or a mobile number signed with a first name only) = ambiguous. Neither = absent. A trading name without Ltd/Limited still counts as a business name.",
      },
      {
        key: "quote_reference_number",
        label: "Quote or job reference number",
        criteria: "COMPOUND FACT / IDENTITY RULE — present only if an actual reference identifier is given (e.g. 'Quote ref: Q-2291', 'Job no. 4471', 'Estimate 2026-118'). A DATE IS NOT A REFERENCE: a quote date, however precise, does not make this field present or ambiguous — if a date is the only candidate, this field is ABSENT. A label with no value ('Quote ref:' followed by nothing) is ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "electrical_scope_quantities",
    name: "Electrical Scope & Quantities",
    fields: [
      {
        key: "rewire_scope_type",
        label: "Whether this is a full rewire, partial rewire or specific works",
        criteria: "present only if the document states the extent of the works in a way a homeowner could check: 'full rewire of the whole property', 'partial rewire — ground floor only', 'kitchen and bathroom circuits only', or a named room/floor list. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that describes the job collectively or makes a quality claim without stating extent — 'fully rewired throughout', 'complete electrical works', 'sort the wiring out', 'all done to a high standard', 'first-class rewire' — is ABSENT, NEVER ambiguous, however confident or repeated, because it carries no extent information. 'Rewire, possibly partial' names the subject vaguely = ambiguous. Silence is absent.",
      },
      {
        key: "socket_outlet_count_and_type",
        label: "Number and type of socket outlets",
        criteria: "COMPOUND FACT — needs BOTH a count AND a type/spec (single/double, USB, switched, metal-clad, brand or range). Both = present ('22 no. double sockets, brushed steel'). Count with no type, or type with no count, = ambiguous. HEDGING: 'approximately 22 double sockets' keeps the figure — present; 'plenty of sockets', 'as many sockets as you need' replace the figure and name no type — ABSENT (collective/quality claim, not ambiguous). Silence is absent.",
      },
      {
        key: "lighting_points_count_and_type",
        label: "Number and type of lighting points",
        criteria: "COMPOUND FACT — needs BOTH a count of lighting points/fittings AND a type (pendant, LED downlight, batten, external, or a named product). Both = present. One half only = ambiguous. NEAR-MISS = ABSENT: 'we'll sort the lights out', 'lighting included', 'lovely new lighting throughout' name neither count nor type — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "switch_count_and_type",
        label: "Number and type of light switches",
        criteria: "COMPOUND FACT — needs BOTH a switch count AND a type (1-gang/2-gang, 2-way, dimmer, finish or brand). Both = present. One half only = ambiguous. NEAR-MISS = ABSENT: 'new switches throughout', 'matching switches and sockets' with no count and no type — absent. Silence is absent. NOTE: an accessories schedule line may evidence this field and socket_outlet_count_and_type — shared evidence is allowed.",
      },
      {
        key: "outdoor_external_circuits",
        label: "Outdoor / external circuits (garden, garage, outbuilding, external lighting)",
        criteria: "EITHER/OR FIELD — present if the document states ANY ONE of: an external circuit included (garage supply, garden sockets, external lighting, outbuilding SWA feed) or an explicit exclusion of external works ('no external or garage circuits included'). A stated exclusion IS present — it is a scope decision. 'We can look at the garage if you want' is ambiguous. NEAR-MISS = ABSENT: mentioning the garden or a garage without stating any electrical work or exclusion for it — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "consumer_unit",
    name: "Consumer Unit",
    fields: [
      {
        key: "consumer_unit_make_model",
        label: "Consumer unit make and model",
        criteria: "COMPOUND FACT — needs BOTH manufacturer AND a model/range (e.g. 'Hager Design 10 VML', 'Wylex NM dual RCD board'). Both = present. Make only ('a Hager board') or model only = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that praises or generalises the board without naming a manufacturer or model — 'quality consumer unit fitted', 'new fuse board of a good brand', 'top-spec board', 'modern consumer unit' — is ABSENT, NEVER ambiguous. Silence is absent.",
      },
      {
        key: "consumer_unit_ways_and_type",
        label: "Consumer unit way count and protection type",
        criteria: "COMPOUND FACT — needs BOTH a way/module count (e.g. '10-way', '18 module') AND the protection arrangement of the board (dual RCD, high-integrity, all-RCBO, main switch). Both = present. Only one half (e.g. '10-way board' with no protection type, or 'all-RCBO board' with no way count) = ambiguous. NEAR-MISS = ABSENT: 'metal consumer unit to the current regs' states neither ways nor protection type — absent. Silence is absent.",
      },
      {
        key: "consumer_unit_location",
        label: "Where the consumer unit will be located",
        criteria: "present only if a physical position is named (under the stairs, hallway, garage wall, existing position retained, relocated to the utility). 'Relocation to be agreed on site' is ambiguous. NEAR-MISS = ABSENT: naming the board or its spec without stating where it goes — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "surge_protection_spd",
        label: "Surge protection device (SPD)",
        criteria: "present if the document states an SPD/surge protection device is included, or explicitly excluded/declined by risk assessment ('SPD omitted following risk assessment as permitted by BS 7671'). Either direction counts. 'SPD can be added if you want it' with no decision is ambiguous. NEAR-MISS = ABSENT: 'board fully protected', 'all the latest protection' name no surge device — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "cabling_circuits",
    name: "Cabling / Circuits",
    fields: [
      {
        key: "cable_type_and_rating",
        label: "Cable type and size/rating",
        criteria: "COMPOUND FACT — needs BOTH a cable type (twin & earth / 6242Y, SWA, FP200, flex) AND a size or rating (2.5mm2, 6mm2, 1.5mm2). Both = present. Type with no size, or size with no type, = ambiguous. NEAR-MISS = ABSENT: 'new cable throughout', 'proper cable', 'all new wiring' name neither type nor size — absent. Silence is absent.",
      },
      {
        key: "circuit_count_and_schedule",
        label: "Number of circuits and what each one serves",
        criteria: "present only if the document gives a circuit count together with what the circuits serve, or an itemised circuit schedule (ring finals, lighting circuits, cooker, shower, immersion). A count with no indication of what they serve, or a list of two or more named circuits with no total, = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that refers to the circuits collectively or claims quality without any count or named circuit — 'all circuits renewed', 'every circuit done properly', 'full set of new circuits', 'wired throughout to a high standard' — is ABSENT, NEVER ambiguous. HEDGING: 'approximately 12 circuits — ring finals, lighting, cooker and shower' keeps the figure — present; 'we'll work out roughly how many circuits are needed' replaces the figure — ambiguous. Silence is absent.",
      },
      {
        key: "cable_containment_method",
        label: "How cables are run and contained (chased, capping, conduit, trunking, clipped, floor voids)",
        criteria: "present only if a routing or containment method is named (chased into walls with capping, oval conduit, surface trunking, clipped in the loft, run in floor voids). NEAR-MISS = ABSENT: 'cables run neatly', 'tidy installation', 'hidden away' name no method — absent, never ambiguous. 'Containment method to be confirmed on site' is ambiguous. Silence is absent.",
      },
      {
        key: "circuit_labelling",
        label: "Circuit identification / labelling of the board",
        criteria: "present only if labelling, circuit identification, or a circuit chart/schedule fixed at the board is stated. NEAR-MISS = ABSENT: issuing a certificate, or providing 'all paperwork', is a different subject and does not evidence labelling — absent. Silence is absent.",
      },
      {
        key: "ev_charger_or_special_circuits",
        label: "EV charger or other special circuits (shower, cooker, immersion, solar, hot tub)",
        criteria: "EITHER/OR FIELD — present if the document states ANY ONE of: a named special circuit included (EV charge point, electric shower, cooker circuit, immersion, PV/battery, hot tub supply), or an explicit exclusion of one ('no EV charger included in this price'). One qualifying statement makes this present. 'We could add an EV point later' is ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "safety_devices",
    name: "Safety Devices",
    fields: [
      {
        key: "rcd_rcbo_protection_type",
        label: "RCD / RCBO protection arrangement",
        criteria: "present only if the protection arrangement is specified: 'all circuits on individual RCBOs', 'dual RCD board, 2 x 63A 30mA', 'high-integrity board with RCBOs on the sockets'. COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that claims safety without naming RCD or RCBO protection — 'fully protected board', 'all the safety devices fitted', 'safe and to the latest standard', 'trip switches all included' — is ABSENT, NEVER ambiguous. Naming RCD/RCBO with no indication of arrangement ('RCD protection included') is ambiguous. Silence is absent. NOTE: a board spec line may evidence this field and consumer_unit_ways_and_type — shared evidence is allowed.",
      },
      {
        key: "earthing_and_bonding_arrangement",
        label: "Earthing arrangement and main protective bonding",
        criteria: "EITHER/OR FIELD — present if the document states EITHER the earthing arrangement (TN-S, TN-C-S/PME, TT with earth rod) OR main protective bonding of services (10mm2 bonding to gas and water). One qualifying statement makes this present. 'Earthing checked and upgraded if needed' is ambiguous. NEAR-MISS = ABSENT: 'everything properly earthed', 'safe earthing throughout' name no arrangement or bonding work — absent. Silence is absent.",
      },
      {
        key: "smoke_heat_co_alarm_provision",
        label: "Smoke, heat and CO alarm provision",
        criteria: "present if the document states alarms are included with either a count, a location, or a grade/type (mains-interlinked Grade D, heat alarm in the kitchen, CO alarm by the boiler), or explicitly excludes them. Naming alarms with no count, location, grade or exclusion ('smoke alarms included') is ambiguous. NEAR-MISS = ABSENT: 'fire safety taken care of', 'all to current safety standards' name no alarms — absent. Silence is absent.",
      },
      {
        key: "afdd_arc_fault_protection",
        label: "AFDD (arc fault detection) provision",
        criteria: "present if the document states AFDDs are included, or explicitly states they are not required/not included for this installation. Either direction counts. 'AFDDs can be added at extra cost' with no decision is ambiguous. NEAR-MISS = ABSENT: RCD/RCBO protection is a different device and does not evidence AFDD — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "certification_part_p",
    name: "Certification / Part P",
    fields: [
      {
        key: "part_p_building_regs_notification",
        label: "Part P / Building Regulations notification",
        criteria: "COMPOUND FACT — needs BOTH the notification route named (self-certification via a competent person scheme, or notification to Building Control / local authority) AND a commitment that it will be done for this job (issued, notified, registered, certificate provided). Both = present. Only one half — a bare 'Part P compliant', 'meets Part P', or 'Building Regs where applicable' with no commitment — is ambiguous. NEAR-MISS = ABSENT: 'all work to current regulations' / 'to BS 7671' names testing standards, not notification — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "eic_electrical_installation_certificate",
        label: "Electrical Installation Certificate (EIC) on completion",
        criteria: "COMPOUND FACT — needs BOTH the certificate named (EIC / Electrical Installation Certificate) AND a commitment to issue it on completion. Both = present. Naming the certificate with no commitment, or promising 'all certificates' with none named, = ambiguous. NEAR-MISS = ABSENT: 'fully certified work', 'certified electrician', 'you'll get the paperwork' name no certificate type — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "eicr_or_minor_works_cert_where_applicable",
        label: "EICR or Minor Works certificate where applicable",
        criteria: "COMPOUND FACT — needs BOTH the document named (EICR / condition report / Minor Electrical Installation Works Certificate) AND a commitment to carry it out or issue it, or a clear statement that it does not apply to this job. Both = present. Named with no commitment ('an EICR may be needed') = ambiguous. NEAR-MISS = ABSENT: an EIC promise alone is a different document and does not evidence this field — absent. Silence is absent.",
      },
      {
        key: "competent_person_scheme_membership",
        label: "Competent person scheme membership (NICEIC, NAPIT, ELECSA, STROMA)",
        criteria: "COMPOUND FACT — needs BOTH a named scheme (NICEIC, NAPIT, ELECSA, STROMA, SELECT) AND a registration/enrolment number or an explicit statement of current registration. Both = present. Scheme named with no number and no registration statement ('NICEIC approved') = ambiguous. COLLECTIVE-NOUN / QUALITY-CLAIM RULE: 'fully qualified electrician', '18th edition qualified', 'registered and insured', '25 years in the trade' name no scheme — ABSENT, never ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "making_good_access",
    name: "Making Good / Access",
    fields: [
      {
        key: "chasing_and_making_good_walls",
        label: "Chasing walls and making good the plasterwork",
        criteria: "present only if the document states what happens to chased walls: 'chases filled and bonded ready for decoration', 'walls made good in bonding and skimmed', or an explicit exclusion ('plaster repairs by others'). COLLECTIVE-NOUN / QUALITY-CLAIM RULE (overrides everything else in this field): wording that claims a standard without stating the making-good work — 'all left to a high standard', 'we make good as we go', 'tidy finish throughout', 'you'd never know we'd been' — is ABSENT, NEVER ambiguous. 'Making good where required' names the subject but sets no scope = ambiguous. Silence is absent.",
      },
      {
        key: "flooring_lifting_and_reinstatement",
        label: "Lifting and reinstating floors, carpets and floorboards",
        criteria: "EITHER/OR FIELD — present if the document states EITHER that floors/boards/carpets will be lifted and relaid/reinstated, OR an explicit exclusion ('customer to lift and refit carpets', 'no allowance for lifting laminate'). One qualifying statement makes this present. 'Some floorboards may need lifting' is ambiguous. NEAR-MISS = ABSENT: running cables in floor voids without stating who lifts or reinstates the covering — absent. Silence is absent.",
      },
      {
        key: "decorating_or_redecoration_scope",
        label: "Decorating / redecoration after the works",
        criteria: "present if the document states the decorating position either way: decoration included (with what is painted), or explicitly excluded ('redecoration is not included'). Either direction counts. 'We'll touch things up where we can' is ambiguous. NEAR-MISS = ABSENT: making good plaster is a different subject and does not state a decorating position — absent. Silence is absent.",
      },
      {
        key: "access_and_dust_debris_containment",
        label: "Access arrangements and dust / debris containment",
        criteria: "EITHER/OR FIELD — present if the document states EITHER an access arrangement (rooms cleared by the customer, working room by room, keys/occupancy, power off windows) OR a dust/debris measure (dust sheets, floor protection, dust extraction, daily clearance of debris, waste removed from site). One qualifying statement makes this present. NEAR-MISS = ABSENT: 'we're clean and tidy workers', 'we respect your home' name no measure or arrangement — absent, never ambiguous. Silence is absent.",
      },
    ],
  },
  {
    key: "exclusions",
    name: "Exclusions",
    fields: [
      {
        key: "explicit_exclusions_listed",
        label: "Explicit list of what is excluded",
        criteria: "present only if at least one specific item is named as excluded or not included ('light fittings not supplied', 'no allowance for structural alterations'). A single named exclusion is enough. 'Anything else will be chargeable' with nothing named is ambiguous. NEAR-MISS = ABSENT: 'price includes everything listed above' restates scope and names no exclusion — absent. Silence is absent.",
      },
      {
        key: "plastering_decorating_exclusion_clarity",
        label: "Whether plastering and decorating are included or excluded",
        criteria: "present only if the document states the position on plastering AND/OR decorating clearly in one direction — included with scope, or excluded. 'Plastering by others' is present. Mentioning making good without saying whether plastering/decorating is in or out is ambiguous. NEAR-MISS = ABSENT: silence, or a generic exclusions list that names neither plastering nor decorating — absent. NOTE: the same sentence may also evidence explicit_exclusions_listed or decorating_or_redecoration_scope — shared evidence is allowed.",
      },
      {
        key: "asbestos_hazardous_material_clause",
        label: "Asbestos / hazardous material clause",
        criteria: "present only if asbestos or another named hazardous material (lead paint, artex containing asbestos) is addressed — excluded, surveyed, or priced separately. 'Anything unforeseen is extra' does not name a hazardous material — ambiguous only if it explicitly references hazards; otherwise absent. Silence is absent.",
      },
      {
        key: "unforeseen_works_variation_clause",
        label: "How unforeseen works and variations are handled",
        criteria: "present only if the document states a process or rate for extras: 'any additional work quoted and agreed in writing before it is carried out', 'extras charged at £45/hour'. 'Anything unforeseen will be chargeable' flags cost but sets no process or rate — ambiguous. NEAR-MISS = ABSENT: a named exclusion alone is a different subject (that is explicit_exclusions_listed) and does not state a variation process — absent. Silence is absent.",
      },
    ],
  },
  {
    key: "price_vat_payment",
    name: "Price / VAT / Payment",
    fields: [
      {
        key: "total_price_and_breakdown",
        label: "Total price and whether it is broken down",
        criteria: "present if a total price figure is stated AND either a breakdown by item/stage is given or the document explicitly states the price is a single all-in figure for the listed scope. A bare total with no breakdown and no such statement = ambiguous. HEDGING: 'approximately £7,400' keeps a figure — the total half is satisfied; 'a few thousand', 'we'll be competitive' replace the figure — absent. Silence is absent. NOTE: the same price line may also evidence vat_treatment and payment_schedule_and_stage_payments — shared evidence is allowed.",
      },
      {
        key: "vat_treatment",
        label: "VAT treatment (inclusive, exclusive, rate, VAT number, or not VAT registered)",
        criteria: "present if the VAT position is stated in any clear form: 'including VAT at 20%', 'plus VAT', a VAT line in the total, a VAT registration number, or 'we are not VAT registered'. Any one of these = present. 'VAT may apply' is ambiguous. NEAR-MISS = ABSENT: a bare total with no VAT wording anywhere — absent, never ambiguous. Silence is absent.",
      },
      {
        key: "payment_schedule_and_stage_payments",
        label: "Payment schedule / stage payments",
        criteria: "present if the document states when money is due: two or more payment points, or a deposit with a stated balance point, or 'payment in full on completion' as a single stated term. A deposit alone with no balance point is ambiguous (the balance half belongs here too). 'Terms as usual' / 'we'll sort payment out' is ambiguous. Silence is absent.",
      },
      {
        key: "deposit_amount",
        label: "Deposit amount",
        criteria: "present if a deposit is stated as a specific figure, or as a percentage alongside a stated total price so the figure is calculable ('50% up front' with a total of £8,500 = present). A deposit mentioned with no figure and no percentage ('a deposit is required before we start') = ambiguous. NEAR-MISS = ABSENT: 'payment on completion' states no deposit — absent. Silence is absent.",
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
        criteria: "present if a date or a dated window is stated. HEDGING (precision vs commitment): 'anticipated start Monday 13 April, subject to material lead times' keeps a real date — present; 'we can start in about 3 weeks' keeps a real window — present; 'as soon as we can', 'we'll fit you in', 'start shortly' replace the figure — ambiguous. Silence is absent.",
      },
      {
        key: "duration_or_completion_date",
        label: "Duration on site or completion date",
        criteria: "present if an on-site duration or a completion date is stated. HEDGING: 'approximately 8 working days', 'estimated 2 weeks' keep a figure — present; 'about a week or so', 'not long', 'we'll be as quick as we can' replace the figure — ambiguous. NEAR-MISS = ABSENT: a start date alone states no duration or completion — absent, never ambiguous (that is start_date's subject). Silence is absent.",
      },
      {
        key: "working_hours_and_power_off_arrangement",
        label: "Working hours and how long the power will be off",
        criteria: "EITHER/OR FIELD — present if the document states EITHER working hours/days on site ('8am to 4.30pm, Monday to Friday') OR the power-off arrangement ('power off between 9am and 4pm on the changeover day', 'temporary supply maintained to the fridge and one socket per floor'). One qualifying statement makes this present. 'We'll try not to leave you without power' is ambiguous. NEAR-MISS = ABSENT: a duration in days states no working hours and no power-off arrangement — absent. Silence is absent.",
      },
    ],
  },
];

export const SCHEMAS: Record<string, CategoryDef[]> = {
  landscaping_driveway: LANDSCAPING_SCHEMA,
  boiler_heating: BOILER_SCHEMA,
  bathroom: BATHROOM_SCHEMA,
  electrical_rewire: ELECTRICAL_SCHEMA,
  extension_building: EXTENSION_SCHEMA,
};


/** Per-category wording + versioning so Pass 1 and Pass 2 are not hardcoded
 *  to the Landscaping pilot. */
export interface CategoryMeta {
  /** Uppercase name used in the Pass 1 / Pass 2 prompt headers. */
  title: string;
  /** How the report refers to the tradesperson. */
  tradeNoun: string;
  /** Stored on quote_check_extractions.schema_version. */
  schemaVersion: string;
  /** report_json.version. */
  reportVersion: string;
  /** intake sub-key holding the homeowner context for this module. */
  contextKey: string;
  /** Default project_type label. */
  projectType: string;
  /** Frontend report route prefix. */
  reportRoute: string;
  verdictStrong: string;
  verdictModerate: string;
  verdictLow: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  landscaping_driveway: {
    title: "LANDSCAPING / DRIVEWAY",
    tradeNoun: "landscaper",
    schemaVersion: "landscaping-extraction-v1",
    reportVersion: "landscaping-v2",
    contextKey: "landscaping_context",
    projectType: "Landscaping / Driveway",
    reportRoute: "landscaping-quote-report",
    verdictStrong:
      "This is a strong landscaping quote with clear area, ground preparation, materials, drainage and access. A few final confirmation points should be agreed before accepting.",
    verdictModerate:
      "This quote covers the basics of the landscaping work and includes useful scope, but sub-base depth, drainage/falls, waste handling and commercial points should be confirmed before accepting.",
    verdictLow:
      "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about area, ground preparation, sub-base, drainage, materials and waste handling.",
  },
  boiler_heating: {
    title: "BOILER / HEATING",
    tradeNoun: "heating engineer",
    schemaVersion: "boiler-extraction-v2",
    reportVersion: "boiler-v3",
    contextKey: "boiler_context",
    projectType: "Boiler / Heating",
    reportRoute: "boiler-quote-report",
    verdictStrong:
      "This is a strong heating quote — the appliance, system works, compliance paperwork and commercial terms are all clearly set out. A few final confirmation points are worth agreeing before accepting.",
    verdictModerate:
      "This quote covers the main boiler works, but points such as flue route, system cleanse, controls, certification and payment terms should be confirmed in writing before accepting.",
    verdictLow:
      "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about the appliance specification, installation works, Gas Safe certification and guarantees.",
  },
  bathroom: {
    title: "BATHROOM",
    tradeNoun: "bathroom fitter",
    schemaVersion: "bathroom-extraction-v1",
    reportVersion: "bathroom-v2",
    contextKey: "bathroom_context",
    projectType: "Bathroom",
    reportRoute: "bathroom-quote-report",
    verdictStrong:
      "This is a strong bathroom quote — the room scope, sanitaryware specification, installation works, certification and commercial terms are all clearly set out. A few final confirmation points are worth agreeing before accepting.",
    verdictModerate:
      "This quote covers the main bathroom works, but points such as tiling extent, material allowances, waterproofing, electrical certification and payment terms should be confirmed in writing before accepting.",
    verdictLow:
      "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about the room scope, sanitaryware specification, tiling, waterproofing, electrical certification and guarantees.",
  },
  electrical_rewire: {
    title: "ELECTRICAL / REWIRE",
    tradeNoun: "electrician",
    schemaVersion: "electrical-extraction-v1",
    reportVersion: "electrical-v2",
    contextKey: "electrical_context",
    projectType: "Electrical / Rewire",
    reportRoute: "electrical-quote-report",
    verdictStrong:
      "This is a strong electrical quote — the rewire extent, accessory quantities, consumer unit, circuits, protection, certification and commercial terms are all clearly set out. A few final confirmation points are worth agreeing before accepting.",
    verdictModerate:
      "This quote covers the main electrical works, but points such as circuit schedule, consumer unit specification, Part P notification, making good and payment terms should be confirmed in writing before accepting.",
    verdictLow:
      "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about the extent of the rewire, quantities, consumer unit and circuit specification, certification and making good.",
  },
  extension_building: {
    title: "EXTENSION / BUILDING WORKS",
    tradeNoun: "builder",
    schemaVersion: "extension-extraction-v1",
    reportVersion: "extension-v2",
    contextKey: "extension_context",
    projectType: "Extension / Building Works",
    reportRoute: "simple-quote-report",
    verdictStrong:
      "This is a strong extension quote — the scope, drawings, foundations, structure, fabric, services, Building Control route, party wall position and commercial terms are all clearly set out. A few final confirmation points are worth agreeing before accepting.",
    verdictModerate:
      "This quote covers the main extension works, but points such as foundation specification, steelwork sizes, insulation values, Building Control notification, party wall status and stage payments should be confirmed in writing before accepting.",
    verdictLow:
      "This quote is too vague to accept safely yet. It gives a price, but leaves out key details about the scope and drawings, foundations, structure, insulation, drainage, Building Regulations, party wall position and payment terms.",
  },
};


export function metaFor(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? CATEGORY_META.landscaping_driveway;
}

export function fieldCount(schema: CategoryDef[]): number {
  return schema.reduce((n, c) => n + c.fields.length, 0);
}

/** Every "category.field" key in a schema, in fixed order. */
export function allFieldPaths(schema: CategoryDef[]): Array<{ category: string; field: string }> {
  const out: Array<{ category: string; field: string }> = [];
  for (const c of schema) for (const f of c.fields) out.push({ category: c.key, field: f.key });
  return out;
}

/** A fully-populated "not found" extraction — the baseline every real
 *  extraction is merged onto, so a field the model omits is never silently
 *  dropped (it just stays "absent"/"not_found" instead of missing entirely). */
export function emptyExtraction(schema: CategoryDef[]): ExtractionRecord {
  const record: ExtractionRecord = {};
  for (const c of schema) {
    record[c.key] = {};
    for (const f of c.fields) {
      record[c.key][f.key] = { status: "absent", quote: null, evidence_source: "not_found", verified: false };
    }
  }
  return record;
}
