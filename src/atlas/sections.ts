/**
 * Atlas Alpha v0.1 — section templates and starter prompts.
 * Aligned with the alpha field-test checklist.
 */

export type SectionCategory = "outside" | "inside" | "customer" | "reference";

export interface SectionTemplate {
  key: string;
  title: string;
  category: SectionCategory;
  sequence: number;
  prompts: PromptTemplate[];
}

export interface PromptTemplate {
  title: string;
  is_required?: boolean;
  is_critical?: boolean;
  hint?: string;
}

export const ATLAS_SECTIONS: SectionTemplate[] = [
  // 1. Project details / customer intent
  {
    key: "customer_intent",
    title: "Project & customer",
    category: "customer",
    sequence: 5,
    prompts: [
      { title: "What the customer wants (in their words)", is_required: true },
      { title: "Objectives & intended use of new space", is_required: true },
      { title: "Planning reference (if applicable)" },
      { title: "Priorities & preferred finishes" },
      { title: "Known budget or ceiling" },
      { title: "Required completion date", is_critical: true },
      { title: "Customer-supplied items" },
      { title: "Customer's known concerns" },
    ],
  },

  // 2. External survey
  {
    key: "ext_access",
    title: "Access & parking",
    category: "outside",
    sequence: 10,
    prompts: [
      { title: "Vehicle access to property", is_required: true },
      { title: "Parking arrangements", is_required: true },
      { title: "Skip location", is_required: true },
      { title: "Material storage area", is_required: true, is_critical: true },
      { title: "Route from street to work area" },
      { title: "Overhead obstructions (cables, branches)" },
      { title: "Working hour or noise restrictions" },
    ],
  },
  {
    key: "ext_services",
    title: "External services",
    category: "outside",
    sequence: 20,
    prompts: [
      { title: "Electric meter location", is_required: true, is_critical: true },
      { title: "Gas meter location", is_required: true },
      { title: "Water supply / external stop tap", is_required: true },
      { title: "Drainage layout (foul & surface)", is_required: true },
      { title: "Manholes — location & condition", is_required: true },
      { title: "Soil stack & downpipes" },
      { title: "Telecoms / fibre entry" },
    ],
  },
  {
    key: "ext_fabric",
    title: "External fabric",
    category: "outside",
    sequence: 30,
    prompts: [
      { title: "Brick type, mortar colour & profile", is_required: true },
      { title: "Roof covering, pitch & condition", is_required: true },
      { title: "Gutters, fascias & soffits", is_required: true },
      { title: "Windows — style, material, condition", is_required: true },
      { title: "External doors" },
      { title: "Render / cladding / stonework" },
    ],
  },
  {
    key: "ext_site",
    title: "Boundaries & site",
    category: "outside",
    sequence: 40,
    prompts: [
      { title: "Boundaries — walls, fences, ownership", is_required: true },
      { title: "Trees — species & distance to works", is_required: true, is_critical: true },
      { title: "Neighbouring properties — Party Wall risk", is_critical: true },
      { title: "Ground levels & slopes" },
      { title: "Retaining walls or flooding evidence" },
    ],
  },

  // 3. Internal survey
  {
    key: "int_electrics",
    title: "Consumer unit & electrics",
    category: "inside",
    sequence: 60,
    prompts: [
      { title: "Consumer unit location & apparent spare capacity", is_required: true },
      { title: "Meter arrangement & earthing observations" },
      { title: "Existing certification available?" },
      { title: "Proposed new loads (kitchen, EV, heating)" },
    ],
  },
  {
    key: "int_heating",
    title: "Boiler & heating",
    category: "inside",
    sequence: 70,
    prompts: [
      { title: "Boiler location, type & apparent age", is_required: true },
      { title: "Hot water cylinder & pressure notes" },
      { title: "Radiator / UFH layout" },
      { title: "Additional demand from proposed works" },
    ],
  },
  {
    key: "int_structure",
    title: "Existing structure & knock-throughs",
    category: "inside",
    sequence: 80,
    prompts: [
      { title: "Walls to remove / new openings", is_required: true, is_critical: true },
      { title: "Load paths where known" },
      { title: "Visible cracking or previous alterations" },
      { title: "Structural drawings available?" },
      { title: "Engineer engaged?" },
    ],
  },
  {
    key: "int_services",
    title: "Internal services",
    category: "inside",
    sequence: 90,
    prompts: [
      { title: "Soil / waste routes to be affected", is_required: true },
      { title: "Water & heating pipe runs" },
      { title: "Existing ventilation & extract" },
      { title: "Smoke / heat alarms" },
    ],
  },
  {
    key: "int_loft",
    title: "Loft",
    category: "inside",
    sequence: 100,
    prompts: [
      { title: "Loft access & headroom", is_required: true },
      { title: "Roof structure — trussed / cut" },
      { title: "Insulation type & depth" },
      { title: "Water tanks or services in loft" },
    ],
  },
  {
    key: "int_floors_ceilings",
    title: "Floors & ceilings",
    category: "inside",
    sequence: 110,
    prompts: [
      { title: "Ground floor construction (suspended / solid)", is_required: true },
      { title: "Upper floor construction" },
      { title: "Ceiling type (plaster / lath / board)" },
      { title: "Signs of movement or damp" },
    ],
  },
  {
    key: "int_rooms",
    title: "Room-by-room record",
    category: "inside",
    sequence: 120,
    prompts: [
      { title: "Add one card per room", is_required: true, hint: "Duplicate this observation per room — dimensions, current + intended use, retained/removed items, defects." },
    ],
  },

  // 4. Unknowns register
  {
    key: "unknowns_register",
    title: "Unknowns register",
    category: "reference",
    sequence: 200,
    prompts: [
      {
        title: "Log each unknown — what, why unknown, action, who is responsible",
        hint: "Duplicate this observation per unknown. Use classification = Unknown or Further investigation.",
      },
    ],
  },

  // 5. Commercial risk register
  {
    key: "risk_register",
    title: "Commercial risk register",
    category: "reference",
    sequence: 210,
    prompts: [
      { title: "Restricted access impact", is_critical: true },
      { title: "Excavation concerns (services, trees, ground)", is_critical: true },
      { title: "Temporary works required" },
      { title: "Tree influence on foundations" },
      { title: "Occupied property — dust, welfare, security", is_critical: true },
      { title: "Service diversions required" },
      { title: "Party Wall Act risks", is_critical: true },
    ],
  },
];

export const PROJECT_TYPES = [
  "Single-storey extension",
  "Two-storey extension",
  "Side extension",
  "Rear extension",
  "Loft conversion",
  "Garage conversion",
  "Full renovation",
  "Kitchen renovation",
  "Bathroom renovation",
  "Rewire",
  "Heating or plumbing",
  "Roofing",
  "Landscaping",
  "New build",
  "Repairs and maintenance",
  "Other",
] as const;

export const TRADE_CATEGORIES = [
  "General building",
  "Groundworks",
  "Brickwork",
  "Structural works",
  "Roofing",
  "Joinery",
  "Electrical",
  "Plumbing",
  "Heating",
  "Plastering",
  "Kitchens",
  "Bathrooms",
  "Decoration",
  "Flooring",
  "Landscaping",
] as const;

export const CLASSIFICATIONS: Record<string, { label: string; tone: string }> = {
  known_fact: { label: "Known fact", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  customer_statement: { label: "Customer statement", tone: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  document_statement: { label: "Document statement", tone: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
  assumption: { label: "Assumption", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  unknown: { label: "Unknown", tone: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  risk: { label: "Risk", tone: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  recommendation: { label: "Recommendation", tone: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  further_investigation: { label: "Further investigation", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
};

export const RESPONSE_STATUSES: Record<string, string> = {
  answered: "Answered",
  unknown: "Unknown",
  unable_to_access: "Unable to access",
  not_applicable: "Not applicable",
  specialist_required: "Specialist required",
  customer_to_confirm: "Customer to confirm",
  return_visit_required: "Return visit required",
};

export const CONFIDENCE_LEVELS: Record<string, string> = {
  confirmed: "Confirmed",
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Low confidence",
  unverified: "Unverified",
};
