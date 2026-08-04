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
      { key: "work_type", label: "Type of work (patio, driveway, fencing, turfing, landscaping, drainage, mixed)" },
      { key: "area_m2", label: "Area in square metres", criteria: "present only if an area figure in m2 (or dimensions that are explicitly the works area) is stated." },
      { key: "site_visit_or_survey", label: "Confirmation of a site visit or measured survey", criteria: "present only if the document explicitly states a site visit, site survey or measured survey took place or is included. Detailed measurements, areas or levels alone are NOT evidence of a visit — mark absent. A passing or social reference to having attended (e.g. 'thanks for having us round', 'good to meet you') is NOT a stated survey — mark ambiguous, not present." },
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
      { key: "sub_base_material_depth", label: "Sub-base material and depth" },
      { key: "compaction_method", label: "Compaction method", criteria: "present only if a compaction action or plant is named (e.g. \"whacker plate\", \"vibrating roller\", \"compacted in layers\"). \"Sub-base laid to depth\" alone is absent." },
      { key: "falls_gradient", label: "Falls / gradient for water run-off", criteria: "present only if a fall, gradient, crossfall or drainage slope is explicitly stated. Mentioning drainage alone is absent." },
      { key: "drainage_provision", label: "Drainage provision (channel drains, ACO, soakaway etc.)" },
      { key: "drainage_discharge_point", label: "Drainage discharge point", criteria: "present only if the destination of water is named (soakaway, existing gully, surface water drain, etc.). Naming only the collection device is absent." },
    ],
  },
  {
    key: "materials_finish_spec",
    name: "Materials / Finish Specification",
    fields: [
      { key: "material_type_brand", label: "Material type / brand" },
      { key: "thickness_colour_pattern", label: "Thickness, colour and laying pattern" },
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
      { key: "deposit_amount", label: "Deposit amount" },
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
    ],
  },
];

export const SCHEMAS: Record<string, CategoryDef[]> = {
  landscaping_driveway: LANDSCAPING_SCHEMA,
  boiler_heating: BOILER_SCHEMA,
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
    schemaVersion: "boiler-extraction-v1",
    reportVersion: "boiler-v2",
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
