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
      { key: "quote_validity_period", label: "Quote validity period" },
      { key: "vat_status", label: "VAT status (inclusive, exclusive, exempt, or VAT number given)" },
      { key: "price_fixed_or_estimate", label: "Whether the price is fixed or an estimate" },
    ],
  },
  {
    key: "scope_area_measurements",
    name: "Scope / Area / Measurements",
    fields: [
      { key: "work_type", label: "Type of work (patio, driveway, fencing, turfing, landscaping, drainage, mixed)" },
      { key: "area_m2", label: "Area in square metres" },
      { key: "site_visit_or_survey", label: "Confirmation of a site visit or measured survey" },
    ],
  },
  {
    key: "excavation_ground_prep",
    name: "Excavation / Ground Preparation",
    fields: [
      { key: "excavation_depth", label: "Excavation / dig depth" },
      { key: "existing_surface_removal", label: "Removal of existing surface" },
      { key: "ground_conditions_flagged", label: "Ground conditions or unknowns flagged as a risk" },
    ],
  },
  {
    key: "sub_base_drainage_falls",
    name: "Sub-Base / Drainage / Falls",
    fields: [
      { key: "sub_base_material_depth", label: "Sub-base material and depth" },
      { key: "compaction_method", label: "Compaction method" },
      { key: "falls_gradient", label: "Falls / gradient for water run-off" },
      { key: "drainage_provision", label: "Drainage provision (channel drains, ACO, soakaway etc.)" },
      { key: "drainage_discharge_point", label: "Drainage discharge point" },
    ],
  },
  {
    key: "materials_finish_spec",
    name: "Materials / Finish Specification",
    fields: [
      { key: "material_type_brand", label: "Material type / brand" },
      { key: "thickness_colour_pattern", label: "Thickness, colour and laying pattern" },
      { key: "jointing_method", label: "Jointing method" },
      { key: "sealing_finishing", label: "Sealing / finishing" },
    ],
  },
  {
    key: "edging_steps_retaining",
    name: "Edging / Steps / Retaining Details",
    fields: [
      { key: "edging_type_included", label: "Edging type / whether included" },
      { key: "steps_retaining_walls", label: "Steps / retaining walls" },
    ],
  },
  {
    key: "waste_removal_access_plant",
    name: "Waste Removal / Access / Plant",
    fields: [
      { key: "waste_spoil_removal", label: "Waste / spoil removal" },
      { key: "access_route", label: "Access route" },
      { key: "plant_hire", label: "Plant hire (mini digger, dumper, breaker)" },
      { key: "protection_of_existing_surfaces", label: "Protection of existing surfaces" },
    ],
  },
  {
    key: "exclusions_extras_risk",
    name: "Exclusions / Extras / Risk Items",
    fields: [
      { key: "exclusions_list", label: "Exclusions list" },
      { key: "risk_items_flagged", label: "Risk items flagged (buried services, unknown ground etc.)" },
      { key: "variation_process", label: "Variation process for changes on site" },
    ],
  },
  {
    key: "price_vat_payment",
    name: "Price / VAT / Payment Terms",
    fields: [
      { key: "total_price", label: "Total price" },
      { key: "deposit_amount", label: "Deposit amount" },
      { key: "staged_payment_schedule", label: "Staged payment schedule" },
    ],
  },
  {
    key: "timescale_guarantees_handover",
    name: "Timescale / Guarantees / Handover",
    fields: [
      { key: "start_date", label: "Start date" },
      { key: "duration", label: "Duration" },
      { key: "workmanship_guarantee", label: "Workmanship guarantee" },
      { key: "material_warranty", label: "Material / manufacturer warranty" },
      { key: "aftercare_guidance", label: "Aftercare guidance" },
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
