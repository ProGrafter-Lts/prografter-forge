// -----------------------------------------------------------------------------
// Quote Checker Module Registry
// -----------------------------------------------------------------------------
// This is the single source of truth for the modular Quote Checker system.
//
// IMPORTANT DESIGN RULE:
//   Each module is fully self-contained. A module MUST declare its own
//   homeowner questions, scoring categories, relevance rules, report wording and
//   supporting-document logic. Modules must NEVER inherit another module's
//   scoring categories. The Extension module is the only ACTIVE module today and
//   its live logic lives in the existing working checker (SimpleQuoteChecker +
//   analyse-simple-quote). Do NOT route non-extension jobs through it.
// -----------------------------------------------------------------------------

export type ModuleStatus = "active" | "draft" | "coming_soon";

export interface QuoteCheckerModule {
  module_id: string;
  display_name: string;
  /** Short label used in the type-selection grid. */
  short_label: string;
  status: ModuleStatus;
  description: string;
  /** Route to send the user to when this module is selected & active. */
  route_or_component: string | null;
  supported_project_types: string[];
  /** High-level scoring categories owned by THIS module only. */
  scoring_categories: string[];
  /** Homeowner context questions owned by THIS module only. */
  homeowner_questions: string[];
  /** Identifier for the report template this module renders. */
  report_template: string;
}

export const QUOTE_CHECKER_MODULES: QuoteCheckerModule[] = [
  {
    module_id: "extension_building",
    display_name: "Extension Quote Checker Module",
    short_label: "Extension / structural building work",
    status: "active",
    description:
      "Extensions, structural building work, shell works, plastered-finish and full-finish extension quotes.",
    route_or_component: "/simple-quote-checker",
    supported_project_types: [
      "extension",
      "structural building work",
      "shell works",
      "plastered finish extension",
      "full finish extension",
    ],
    // Live scoring categories are owned by the analyse-simple-quote function.
    scoring_categories: [
      "scope & works included",
      "finish level",
      "groundworks & foundations",
      "building control",
      "structural / opening up",
      "electrics",
      "plumbing & heating",
      "plastering & joinery",
      "decoration / flooring / tiling",
      "payment stages",
      "timescale",
      "commercial terms",
    ],
    homeowner_questions: [
      "finish level expected",
      "demolition / removal",
      "test dig completed",
      "building control status",
      "opening up / knock-through",
      "electrics expected",
      "plumbing / heating expected",
      "plastering expected",
      "second-fix joinery expected",
      "decoration / flooring / tiling expected",
      "payment stages supplied separately",
      "timescale supplied separately",
      "verbal agreements",
    ],
    report_template: "extension_simple_report",
  },
  {
    module_id: "boiler_heating",
    display_name: "Boiler / heating quote checker",
    short_label: "Boiler / heating",
    status: "active",
    description:
      "Boiler replacements, new boilers, repairs and wider heating works. Checks product, installation scope, Gas Safe certification, warranty and exclusions.",
    route_or_component: "/boiler-quote-checker",
    supported_project_types: [
      "new boiler",
      "replacement boiler",
      "boiler repair",
      "heating works",
    ],
    // Boiler-specific scoring categories — NEVER reuse extension categories.
    scoring_categories: [
      "scope clarity",
      "product specification",
      "installation detail",
      "compliance and certification",
      "warranty and guarantee clarity",
      "price / vat / payment terms",
      "exclusions and risk clarity",
      "timescale and access assumptions",
      "handover paperwork",
      "overall homeowner confidence",
    ],
    homeowner_questions: [
      "work type (new / replacement / repair / wider heating)",
      "property occupied",
      "existing boiler being removed",
      "current boiler type",
      "boiler location changing",
      "radiator or pipework changes included",
      "disposal of old boiler expected",
      "thermostat / smart controls expected",
      "warranty expected",
      "gas safe certification / building regs expected",
    ],
    report_template: "boiler_report",
  },
  {
    module_id: "electrical_rewire",
    display_name: "Electrical / Rewire Quote Checker Module",
    short_label: "Electrical / rewire",
    status: "coming_soon",
    description: "Full and partial rewires, consumer units and electrical works.",
    route_or_component: null,
    supported_project_types: ["full rewire", "partial rewire", "electrical works"],
    scoring_categories: [],
    homeowner_questions: [],
    report_template: "electrical_report",
  },
  {
    module_id: "bathroom",
    display_name: "Bathroom Quote Checker Module",
    short_label: "Bathroom",
    status: "coming_soon",
    description: "Bathroom refits and renovations.",
    route_or_component: null,
    supported_project_types: ["bathroom refit", "bathroom renovation"],
    scoring_categories: [],
    homeowner_questions: [],
    report_template: "bathroom_report",
  },
  {
    module_id: "kitchen",
    display_name: "Kitchen Quote Checker Module",
    short_label: "Kitchen",
    status: "coming_soon",
    description: "Kitchen refits and renovations.",
    route_or_component: null,
    supported_project_types: ["kitchen refit", "kitchen renovation"],
    scoring_categories: [],
    homeowner_questions: [],
    report_template: "kitchen_report",
  },
  {
    module_id: "roofing",
    display_name: "Roofing Quote Checker Module",
    short_label: "Roofing",
    status: "coming_soon",
    description: "Re-roofs, repairs and flat-roof works.",
    route_or_component: null,
    supported_project_types: ["re-roof", "roof repair", "flat roof"],
    scoring_categories: [],
    homeowner_questions: [],
    report_template: "roofing_report",
  },
  {
    module_id: "windows_doors",
    display_name: "Windows & Doors Quote Checker Module",
    short_label: "Windows & doors",
    status: "coming_soon",
    description: "Window and door replacements and installations.",
    route_or_component: null,
    supported_project_types: ["windows", "doors"],
    scoring_categories: [],
    homeowner_questions: [],
    report_template: "windows_doors_report",
  },
  {
    module_id: "plastering",
    display_name: "Plastering Quote Checker Module",
    short_label: "Plastering",
    status: "coming_soon",
    description: "Plastering and rendering works.",
    route_or_component: null,
    supported_project_types: ["plastering", "rendering"],
    scoring_categories: [],
    homeowner_questions: [],
    report_template: "plastering_report",
  },
  {
    module_id: "landscaping_driveway",
    display_name: "Landscaping / Driveway Quote Checker Module",
    short_label: "Landscaping / driveway",
    status: "coming_soon",
    description: "Landscaping, patios, driveways and external works.",
    route_or_component: null,
    supported_project_types: ["landscaping", "driveway", "patio"],
    scoring_categories: [],
    homeowner_questions: [],
    report_template: "landscaping_report",
  },
  {
    module_id: "general_building",
    display_name: "General Building Quote Checker Module",
    short_label: "General building / not sure",
    status: "coming_soon",
    description: "General building work or when you're not sure which category fits.",
    route_or_component: null,
    supported_project_types: ["general building", "not sure"],
    scoring_categories: [],
    homeowner_questions: [],
    report_template: "general_report",
  },
];

export const getModule = (id: string): QuoteCheckerModule | undefined =>
  QUOTE_CHECKER_MODULES.find((m) => m.module_id === id);
