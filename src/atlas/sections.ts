/**
 * Default Atlas section templates + starter observation prompts.
 * Sections are seeded when a survey is first opened. Prompts appear as
 * suggested observations the surveyor can answer, skip or delete.
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
  // Customer intent
  {
    key: "customer_intent",
    title: "Customer intent",
    category: "customer",
    sequence: 5,
    prompts: [
      { title: "What the customer believes they want", is_required: true },
      { title: "Intended use of new / altered space" },
      { title: "Customer priorities and preferred finishes" },
      { title: "Known budget constraints or ceiling" },
      { title: "Required completion date", is_critical: true },
      { title: "Items the customer expects to supply themselves" },
      { title: "Items the customer assumes are included" },
      { title: "Customer's known concerns" },
    ],
  },

  // Outside
  {
    key: "site_access",
    title: "Site & access",
    category: "outside",
    sequence: 10,
    prompts: [
      { title: "Parking & delivery access", is_required: true },
      { title: "Materials route to work area", is_required: true, is_critical: true },
      { title: "Skip / storage location" },
      { title: "Scaffold space & overhead obstructions" },
      { title: "Neighbouring property constraints" },
      { title: "Working hour restrictions" },
    ],
  },
  {
    key: "property_overview",
    title: "Property overview",
    category: "outside",
    sequence: 20,
    prompts: [
      { title: "Property type, age & storeys", is_required: true },
      { title: "Visible construction type" },
      { title: "Existing extensions or outbuildings" },
      { title: "Boundaries & levels" },
      { title: "Signs of previous alterations" },
    ],
  },
  {
    key: "external_materials",
    title: "External materials",
    category: "outside",
    sequence: 30,
    prompts: [
      { title: "Brick type, mortar colour & profile", is_required: true },
      { title: "Render / stone / cladding" },
      { title: "Roof covering, pitch & condition" },
      { title: "Guttering, soffits, fascias" },
      { title: "Windows & external doors" },
    ],
  },
  {
    key: "utilities_external",
    title: "Utilities (external)",
    category: "outside",
    sequence: 40,
    prompts: [
      { title: "Electricity meter & incoming supply position", is_required: true, is_critical: true },
      { title: "Gas meter position" },
      { title: "Water entry & external stop tap", is_required: true },
      { title: "Telecoms entry" },
      { title: "Manholes, gullies, soil stacks, downpipes" },
    ],
  },
  {
    key: "ground_conditions",
    title: "Ground conditions",
    category: "outside",
    sequence: 50,
    prompts: [
      { title: "Visible soil type & slopes" },
      { title: "Nearby trees (species & distance)", is_critical: true },
      { title: "Retaining walls, drainage or flooding evidence" },
      { title: "Access for excavation equipment" },
      { title: "Trial holes completed or required" },
    ],
  },

  // Inside
  {
    key: "rooms",
    title: "Rooms & internal spaces",
    category: "inside",
    sequence: 60,
    prompts: [
      { title: "Room-by-room record — add one card per room", is_required: true, hint: "Duplicate this observation per room and note dimensions, current + intended use, defects, retained/removed items." },
    ],
  },
  {
    key: "existing_structure",
    title: "Existing structure",
    category: "inside",
    sequence: 70,
    prompts: [
      { title: "Walls proposed for removal / openings", is_required: true, is_critical: true },
      { title: "Visible cracking or previous alterations" },
      { title: "Load paths where known" },
      { title: "Structural drawings available?" },
      { title: "Engineer engaged?" },
    ],
  },
  {
    key: "electrical",
    title: "Electrical",
    category: "inside",
    sequence: 80,
    prompts: [
      { title: "Consumer unit location & apparent spare capacity", is_required: true },
      { title: "Meter arrangement & earthing observations" },
      { title: "Smoke / heat alarms present" },
      { title: "Proposed new loads (EV charger, electric heating, kitchen)" },
      { title: "Existing certification available?" },
    ],
  },
  {
    key: "plumbing_heating",
    title: "Plumbing & heating",
    category: "inside",
    sequence: 90,
    prompts: [
      { title: "Boiler location, type & apparent age", is_required: true },
      { title: "Cylinder & incoming main pressure concerns" },
      { title: "Drainage / soil / waste routes" },
      { title: "Radiator locations & underfloor heating" },
      { title: "Proposed additional demand from works" },
    ],
  },
  {
    key: "fire_safety",
    title: "Fire & safety",
    category: "inside",
    sequence: 100,
    prompts: [
      { title: "Escape routes & stair access" },
      { title: "Smoke / heat alarms" },
      { title: "Fire doors & glazing concerns" },
      { title: "Occupied-property risks (children / vulnerable occupants)", is_critical: true },
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
