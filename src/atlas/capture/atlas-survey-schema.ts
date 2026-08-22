/**
 * Atlas Phase 1 — versioned capture schema.
 *
 * Discipline mirrors supabase/functions/_shared/quote-checker-schemas.ts:
 * every field definition, branching rule and validation lives HERE, in one
 * versioned file — never scattered across database rows. Bump
 * ATLAS_SURVEY_SCHEMA_VERSION whenever field keys or branching change.
 */

export const ATLAS_SURVEY_SCHEMA_VERSION = "atlas-capture-v1";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "yes_no"
  | "yes_no_unsure"
  | "composite"
  | "tree_repeater"
  | "manhole_repeater"
  | "locked_flag";

export type BranchState = "active" | "not_applicable";

export interface SubField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  optional?: boolean;
}

export interface FieldDef {
  key: string;
  label: string;
  /** Shown under the label — explains WHY the field is asked. */
  description?: string;
  type: FieldType;
  options?: string[];
  subFields?: SubField[];
  /** Photo evidence: required = cannot complete section without one. */
  photo?: "required" | "optional" | "none";
  required?: boolean;
  /** Secondary yes/no/unsure flag captured alongside the value. */
  proximityFlag?: { key: string; label: string; warnOn: ("yes" | "unsure")[]; warning: string };
  /** Field is only active when this predicate passes; otherwise not_applicable. */
  branch?: { field: string; equals: string };
  /** Follow-up field required when parent answer matches. */
  requiredWhen?: { field: string; equals: string };
  locked?: { value: string; note: string };
}

export interface GroupDef {
  key: string;
  title: string;
  section: "external" | "shell" | "review";
  blurb?: string;
  fields: FieldDef[];
}

/* ------------------------------------------------------------------ *
 * EXTERNAL SURVEY
 * ------------------------------------------------------------------ */

const EXTERNAL_GROUPS: GroupDef[] = [
  {
    key: "ext_services",
    title: "Incoming services",
    section: "external",
    blurb: "Meter and supply positions relative to any proposed dig.",
    fields: [
      {
        key: "meter_position_electric",
        label: "Electric meter position",
        description: "Where the electric meter/supply enters the property.",
        type: "text",
        photo: "required",
        required: true,
        proximityFlag: {
          key: "within_3m_of_dig",
          label: "Within 3m of the proposed dig / groundworks area?",
          warnOn: ["yes", "unsure"],
          warning:
            "Electric supply within 3m of proposed groundworks — service location must be confirmed (CAT scan / DNO enquiry) before excavation.",
        },
      },
      {
        key: "meter_position_gas",
        label: "Gas meter position",
        description: "Where the gas meter/supply enters the property.",
        type: "text",
        photo: "required",
        required: true,
        proximityFlag: {
          key: "within_3m_of_dig",
          label: "Within 3m of the proposed dig / groundworks area?",
          warnOn: ["yes", "unsure"],
          warning:
            "Gas supply within 3m of proposed groundworks — service location must be confirmed (CAT scan / supplier enquiry) before excavation.",
        },
      },
      {
        key: "stop_tap_location",
        label: "Stop tap location",
        description: "Internal and/or external stop tap position.",
        type: "text",
        photo: "optional",
        required: true,
      },
    ],
  },
  {
    key: "ext_trees",
    title: "Trees",
    section: "external",
    blurb: "Log every tree that could influence foundations. Unknown species never blocks progress.",
    fields: [
      {
        key: "tree_survey",
        label: "Trees on or near the site",
        description:
          "Species (or 'Unknown'), estimated distance from the proposed structure, and estimated height band.",
        type: "tree_repeater",
        photo: "optional",
      },
    ],
  },
  {
    key: "ext_drainage",
    title: "Drainage",
    section: "external",
    blurb: "Manhole positions and how foul and surface water are arranged.",
    fields: [
      {
        key: "drainage_survey",
        label: "Manhole positions",
        description: "One entry per manhole — photo plus a rough location description.",
        type: "manhole_repeater",
        photo: "optional",
      },
      {
        key: "foul_surface_water_arrangement",
        label: "Foul / surface water arrangement",
        description: "Defaults to combined unless the site clearly shows otherwise.",
        type: "select",
        options: ["Combined", "Separate", "Unknown — to be confirmed"],
        required: true,
        photo: "optional",
      },
    ],
  },
  {
    key: "ext_material_match",
    title: "Soffit, fascia & guttering",
    section: "external",
    blurb: "Captured for material matching — a new build-out must visually tie into the existing.",
    fields: [
      {
        key: "soffit_fascia_guttering",
        label: "Soffit, fascia & guttering (for material matching)",
        description:
          "Recorded so replacement/extension materials can be matched to the existing property, not guessed at pricing stage.",
        type: "composite",
        photo: "required",
        required: true,
        subFields: [
          { key: "covering_type", label: "Covering type", type: "text", placeholder: "e.g. uPVC fascia, ventilated soffit" },
          { key: "colour", label: "Colour", type: "text", placeholder: "e.g. White / Anthracite grey" },
          { key: "downpipe_type", label: "Downpipe type", type: "text", placeholder: "e.g. 68mm round uPVC, black" },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * SHELL / ALTERATION SURVEY
 * ------------------------------------------------------------------ */

const SHELL_GROUPS: GroupDef[] = [
  {
    key: "shell_alteration",
    title: "Alteration area",
    section: "shell",
    fields: [
      {
        key: "alteration_area_description",
        label: "Alteration area description",
        description: "What is being altered, opened up or built onto — with photo evidence.",
        type: "textarea",
        photo: "required",
        required: true,
      },
    ],
  },
  {
    key: "shell_sequencing",
    title: "Sequencing",
    section: "shell",
    blurb: "Anything that must happen before the shell closes up becomes a hard flag on the summary.",
    fields: [
      {
        key: "sequencing_flag",
        label:
          "Does any structural work here need to happen before the shell/structure closes up (e.g. steel beam installation)?",
        type: "yes_no",
        required: true,
        photo: "optional",
      },
      {
        key: "sequencing_detail",
        label: "What must happen first, and why?",
        description: "Required when sequencing-critical work exists. This appears as a hard flag on the summary.",
        type: "textarea",
        requiredWhen: { field: "sequencing_flag", equals: "yes" },
        photo: "optional",
      },
    ],
  },
  {
    key: "shell_roof",
    title: "Roof",
    section: "shell",
    blurb: "Answering roof type switches the irrelevant branch to Not applicable — it is never just left blank.",
    fields: [
      {
        key: "roof_type_and_pitch",
        label: "Roof type",
        description: "Determines which roof detail fields apply.",
        type: "select",
        options: ["Pitched", "Flat"],
        required: true,
        photo: "required",
      },
      {
        key: "tile_slate_type_colour_profile",
        label: "Tile / slate type, colour & profile",
        description: "Captured for material matching on pitched roofs.",
        type: "text",
        branch: { field: "roof_type_and_pitch", equals: "Pitched" },
        photo: "required",
        required: true,
      },
      {
        key: "ridge_hip_valley_notes",
        label: "Ridge, hip & valley notes",
        type: "textarea",
        branch: { field: "roof_type_and_pitch", equals: "Pitched" },
        photo: "optional",
        required: true,
      },
      {
        key: "parapet_or_upstand",
        label: "Parapet or upstand present?",
        type: "yes_no",
        branch: { field: "roof_type_and_pitch", equals: "Flat" },
        photo: "optional",
        required: true,
      },
      {
        key: "coping_stone_requirement",
        label: "Coping stone requirement",
        type: "textarea",
        branch: { field: "roof_type_and_pitch", equals: "Flat" },
        photo: "optional",
        required: true,
      },
      {
        key: "outlet_drainage_strategy",
        label: "Outlet / drainage strategy",
        type: "textarea",
        branch: { field: "roof_type_and_pitch", equals: "Flat" },
        photo: "optional",
        required: true,
      },
    ],
  },
  {
    key: "shell_ground",
    title: "Ground conditions",
    section: "shell",
    blurb: "SiteScout never confirms ground conditions. This flag cannot be cleared during capture.",
    fields: [
      {
        key: "ground_conditions_flag",
        label: "Ground conditions",
        description:
          "Attach photos and notes as observations only. Confirming suitability requires an actual test result, which is out of scope for Phase 1 capture.",
        type: "locked_flag",
        photo: "optional",
        locked: {
          value: "unverified",
          note: "Ground conditions unverified — recommend trial hole / site investigation before final pricing.",
        },
      },
    ],
  },
  {
    key: "shell_light_services",
    title: "Existing services (lightweight)",
    section: "shell",
    blurb:
      "Captured so other trades quoting a shell-only job aren't blocked. No compliance logic — a dedicated module comes later.",
    fields: [
      {
        key: "boiler_capacity_check",
        label: "Existing boiler",
        description: "Photo of the existing boiler plus a short note (make/model/position if visible).",
        type: "textarea",
        photo: "required",
      },
      {
        key: "consumer_unit_spare_ways_check",
        label: "Consumer unit / spare ways",
        description: "Photo of the consumer unit plus a short note on apparent spare ways.",
        type: "textarea",
        photo: "required",
      },
    ],
  },
];

export const ATLAS_CAPTURE_GROUPS: GroupDef[] = [...EXTERNAL_GROUPS, ...SHELL_GROUPS];

export const ATLAS_SECTION_LABELS: Record<string, string> = {
  external: "External survey",
  shell: "Shell / alteration survey",
  review: "Review",
};

export const ATLAS_DISCLAIMER =
  "SiteScout captures site observations to guide quotations. It does not replace structural, geotechnical, or other professional assessment. Ground conditions, in particular, are never confirmed safe by this tool — only flagged for further investigation where relevant.";

export const GROUND_CONDITIONS_STATEMENT =
  "Ground conditions unverified — recommend trial hole / site investigation before final pricing.";

export const NHBC_TREE_GUIDANCE =
  "Trees present — soil type and precaution category should be assessed before foundation design is finalised (NHBC Standards Chapter 4.2).";

export const TREE_HEIGHT_BANDS = ["Under 5m", "5–10m", "10–15m", "Over 15m", "Unknown"];

export const ALL_FIELDS: FieldDef[] = ATLAS_CAPTURE_GROUPS.flatMap((g) => g.fields);

export function getField(key: string): FieldDef | undefined {
  return ALL_FIELDS.find((f) => f.key === key);
}

/* ------------------------------------------------------------------ *
 * Deterministic roof branch guard
 *
 * Same pattern as applyRoofingBranchGuard in the Roofing Quote Checker:
 * the branch outcome is computed from the answer, never inferred by a
 * prompt or left to the UI. Both branches can never end up
 * not_applicable while roof_type_and_pitch itself is answered — if the
 * answer is missing or unrecognised we default to Pitched, exactly as
 * the Roofing category does.
 * ------------------------------------------------------------------ */

export const PITCHED_ONLY_FIELDS = [
  "tile_slate_type_colour_profile",
  "ridge_hip_valley_notes",
] as const;

export const FLAT_ONLY_FIELDS = [
  "parapet_or_upstand",
  "coping_stone_requirement",
  "outlet_drainage_strategy",
] as const;

export interface RoofBranchResult {
  resolvedRoofType: "Pitched" | "Flat";
  defaulted: boolean;
  branchStates: Record<string, BranchState>;
}

export function applyRoofBranchGuard(values: Record<string, any>): RoofBranchResult {
  const raw = String(values?.roof_type_and_pitch?.value ?? values?.roof_type_and_pitch ?? "").trim();
  const normalised = raw.toLowerCase();
  const recognised = normalised === "pitched" || normalised === "flat";
  const resolvedRoofType: "Pitched" | "Flat" = normalised === "flat" ? "Flat" : "Pitched";

  const branchStates: Record<string, BranchState> = {};
  for (const k of PITCHED_ONLY_FIELDS) {
    branchStates[k] = resolvedRoofType === "Pitched" ? "active" : "not_applicable";
  }
  for (const k of FLAT_ONLY_FIELDS) {
    branchStates[k] = resolvedRoofType === "Flat" ? "active" : "not_applicable";
  }

  // Invariant: exactly one branch is active. Never both not_applicable.
  const anyActive = Object.values(branchStates).some((s) => s === "active");
  if (!anyActive) {
    for (const k of PITCHED_ONLY_FIELDS) branchStates[k] = "active";
  }

  return { resolvedRoofType, defaulted: !recognised, branchStates };
}

/** Is a field active (i.e. should be shown / scored) for these values? */
export function isFieldActive(field: FieldDef, values: Record<string, any>): boolean {
  if (!field.branch) return true;
  if (field.branch.field === "roof_type_and_pitch") {
    const { branchStates } = applyRoofBranchGuard(values);
    return branchStates[field.key] !== "not_applicable";
  }
  const v = values?.[field.branch.field]?.value ?? values?.[field.branch.field];
  return String(v ?? "") === field.branch.equals;
}

export function isFieldRequired(field: FieldDef, values: Record<string, any>): boolean {
  if (field.requiredWhen) {
    const v = values?.[field.requiredWhen.field]?.value ?? values?.[field.requiredWhen.field];
    return String(v ?? "") === field.requiredWhen.equals;
  }
  return !!field.required;
}

export function isFieldAnswered(field: FieldDef, values: Record<string, any>): boolean {
  const raw = values?.[field.key];
  const v = raw?.value ?? raw;
  if (field.type === "locked_flag") return true;
  if (field.type === "tree_repeater" || field.type === "manhole_repeater") {
    return Array.isArray(v) && v.length > 0;
  }
  if (field.type === "composite") {
    if (!v || typeof v !== "object") return false;
    return (field.subFields || []).every((s) => s.optional || String((v as any)[s.key] ?? "").trim().length > 0);
  }
  return String(v ?? "").trim().length > 0;
}

/* ------------------------------------------------------------------ *
 * Summary / flag derivation
 * ------------------------------------------------------------------ */

export type FlagLevel = "hard" | "guidance" | "warning";

export interface SurveyFlag {
  level: FlagLevel;
  title: string;
  detail: string;
  fieldKey?: string;
}

export function deriveFlags(values: Record<string, any>): SurveyFlag[] {
  const flags: SurveyFlag[] = [];
  const get = (k: string) => values?.[k]?.value ?? values?.[k];

  // Proximity warnings on services
  for (const key of ["meter_position_electric", "meter_position_gas"]) {
    const field = getField(key);
    const flag = field?.proximityFlag;
    if (!flag) continue;
    const answer = String(values?.[key]?.[flag.key] ?? "").toLowerCase();
    if (flag.warnOn.includes(answer as any)) {
      flags.push({
        level: "warning",
        title: `${field!.label} — proximity to groundworks (${answer})`,
        detail: flag.warning,
        fieldKey: key,
      });
    }
  }

  // NHBC 4.2 tree guidance
  const trees = get("tree_survey");
  if (Array.isArray(trees) && trees.length > 0) {
    flags.push({
      level: "guidance",
      title: "NHBC Chapter 4.2 — trees recorded",
      detail: NHBC_TREE_GUIDANCE,
      fieldKey: "tree_survey",
    });
  }

  // Sequencing hard flag
  if (String(get("sequencing_flag") ?? "").toLowerCase() === "yes") {
    const detail = String(get("sequencing_detail") ?? "").trim();
    flags.push({
      level: "hard",
      title: "Sequencing-critical structural work",
      detail: detail || "Sequencing-critical work flagged but not yet described — this must be completed.",
      fieldKey: "sequencing_detail",
    });
  }

  // Ground conditions — always present, never clearable
  flags.push({
    level: "hard",
    title: "Ground conditions unverified",
    detail: GROUND_CONDITIONS_STATEMENT,
    fieldKey: "ground_conditions_flag",
  });

  return flags;
}

/** Text block auto-fed into the quote wizard's assumptions field. */
export function quoteAssumptionsFromSurvey(values: Record<string, any>): string {
  const lines = [GROUND_CONDITIONS_STATEMENT];
  const trees = values?.tree_survey?.value ?? values?.tree_survey;
  if (Array.isArray(trees) && trees.length > 0) lines.push(NHBC_TREE_GUIDANCE);
  for (const f of deriveFlags(values)) {
    if (f.level === "warning" && !lines.includes(f.detail)) lines.push(f.detail);
  }
  return lines.map((l) => `• ${l}`).join("\n");
}

/** Text block auto-fed into the quote wizard's provisional sums flag. */
export function quoteProvisionalSumsFromSurvey(values: Record<string, any>): string {
  return [
    "Groundworks / foundation depth carried as a provisional sum — ground conditions unverified at survey stage (trial hole / site investigation recommended before final pricing).",
  ].join("\n");
}
