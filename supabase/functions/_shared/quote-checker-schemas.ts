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
      { key: "contractor_name", label: "Contractor / landscaper name" },
      { key: "contractor_contact", label: "Contractor contact details (phone, email or address)" },
      { key: "customer_name_address", label: "Customer name and site address" },
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
      { key: "site_visit_or_survey", label: "Confirmation of a site visit or measured survey", criteria: "present only if the document explicitly states a site visit, site survey or measured survey took place or is included. Detailed measurements, areas or levels alone are NOT evidence of a visit — mark absent." },
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
      { key: "staged_payment_schedule", label: "Staged payment schedule", criteria: "present only if two or more payment points, or a stage-by-stage schedule, are stated. A deposit alone is absent." },
    ],
  },
  {
    key: "timescale_guarantees_handover",
    name: "Timescale / Guarantees / Handover",
    fields: [
      { key: "start_date", label: "Start date", criteria: "present only if a start date, start window or lead time is stated. \"Subject to availability\" alone is ambiguous." },
      { key: "duration", label: "Duration", criteria: "present only if a duration or number of days/weeks on site is stated." },
      { key: "workmanship_guarantee", label: "Workmanship guarantee", criteria: "present only if a workmanship guarantee/warranty with or without a period is stated." },
      { key: "material_warranty", label: "Material / manufacturer warranty", criteria: "present only if a manufacturer or material warranty is stated. A workmanship guarantee alone is absent." },
      { key: "aftercare_guidance", label: "Aftercare guidance", criteria: "present only if aftercare, maintenance or curing guidance is given. Silence is absent." },
    ],
  },
];

export const SCHEMAS: Record<string, CategoryDef[]> = {
  landscaping_driveway: LANDSCAPING_SCHEMA,
};

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
