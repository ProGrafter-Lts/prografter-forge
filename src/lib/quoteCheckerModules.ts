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
    route_or_component: "/quote-checker?module=extension_building",
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
    route_or_component: "/quote-checker?module=boiler_heating",
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
    status: "active",
    description:
      "Full and partial rewires, consumer units and electrical works. Checks scope, quantities, certification, Part P, making good, exclusions and payment terms.",
    route_or_component: "/quote-checker?module=electrical_rewire",
    supported_project_types: [
      "full rewire",
      "partial rewire",
      "consumer unit replacement",
      "new circuit / alteration",
      "electrical works",
      "ev charger",
    ],
    // Electrical-specific scoring categories — NEVER reuse extension or boiler categories.
    scoring_categories: [
      "quote basics",
      "electrical scope & quantities",
      "consumer unit / distribution board",
      "cabling, circuits & accessories",
      "safety devices & compliance",
      "certification / testing / part p",
      "making good / access / occupied property",
      "exclusions / extras / risk items",
      "price / vat / payment terms",
      "timescale / programme / handover",
    ],
    homeowner_questions: [
      "type of electrical work",
      "property occupied",
      "part of a larger building project",
      "property empty or furnished",
      "chasing / lifting expected",
      "making good / decoration expected",
      "new consumer unit expected",
      "smoke / heat / CO alarms expected",
      "outdoor / garage / EV supply expected",
      "certification / Part P expected",
    ],
    report_template: "electrical_report",
  },
  {
    module_id: "bathroom",
    display_name: "Bathroom Quote Checker Module",
    short_label: "Bathroom",
    status: "active",
    description:
      "Full bathroom refits, ensuites, shower rooms, cloakrooms and repairs. Checks strip-out, plumbing, sanitaryware, tiling, waterproofing, bathroom electrics, finishes, exclusions and guarantees.",
    route_or_component: "/quote-checker?module=bathroom",
    supported_project_types: [
      "full bathroom refit",
      "ensuite",
      "shower room",
      "cloakroom",
      "bathroom repair",
    ],
    // Bathroom-specific scoring categories — NEVER reuse extension, boiler or electrical categories.
    scoring_categories: [
      "quote basics",
      "strip-out & waste removal",
      "plumbing scope",
      "sanitaryware & fixtures",
      "tiling / waterproofing / tanking",
      "electrical & ventilation",
      "flooring / plastering / making good",
      "exclusions / extras / risk items",
      "price / vat / payment terms",
      "timescale / handover / guarantees",
    ],
    homeowner_questions: [
      "full refit / ensuite / shower room / cloakroom / repair",
      "same layout",
      "who supplies sanitaryware",
      "tiles included",
      "waterproofing / tanking expected",
      "electrics included (lights, fan, shaver socket, underfloor heating)",
      "flooring included",
      "plastering / making good included",
      "waste removal included",
      "guarantees / certificates expected",
    ],
    report_template: "bathroom_report",
  },
  {
    module_id: "kitchen",
    display_name: "Kitchen Quote Checker Module",
    short_label: "Kitchen",
    status: "coming_soon",
    description:
      "Kitchen refits, supply-and-fit, fit-only and labour-only installs. Checks scope, units, worktops, appliances, plumbing/gas/electrical, tiling, flooring, rip-out, making good, exclusions and guarantees.",
    route_or_component: null,
    // RETIRED 2026-08-11: legacy V1 single-pass analyser. Not on the Pass 0/1/2
    // fixed-standard pipeline, so scoring is non-deterministic. Off sale until
    // rebuilt on the V2 standard.,
    supported_project_types: [
      "kitchen refit",
      "kitchen renovation",
      "supply and fit kitchen",
      "fit only kitchen",
      "labour only kitchen",
    ],
    // Kitchen-specific scoring categories — NEVER reuse other modules' categories.
    scoring_categories: [
      "quote basics",
      "kitchen supply / install scope",
      "units / worktops / appliances",
      "plumbing / gas / electrical interfaces",
      "tiling / splashback / flooring",
      "rip-out / waste removal",
      "making good / decoration / finishes",
      "exclusions / extras / risk items",
      "price / vat / payment terms",
      "timescale / handover / guarantees",
    ],
    homeowner_questions: [
      "supply and fit / fit only / labour only",
      "units included",
      "worktops included",
      "appliances included",
      "plumbing included",
      "electrical included",
      "tiling / splashback included",
      "flooring included",
      "waste removal included",
      "decoration / making good included",
    ],
    report_template: "kitchen_report",
  },
  {
    module_id: "roofing",
    display_name: "Roofing Quote Checker Module",
    short_label: "Roofing",
    status: "coming_soon",
    description:
      "Repairs, re-roofs, flat roofs, chimney work and fascia/soffit/gutter/roofline works. Checks scope, materials, access/scaffold, leadwork, insulation, waste, guarantees and exclusions.",
    route_or_component: null,
    // RETIRED 2026-08-11: legacy V1 single-pass analyser. Not on the Pass 0/1/2
    // fixed-standard pipeline, so scoring is non-deterministic. Off sale until
    // rebuilt on the V2 standard.,
    supported_project_types: [
      "re-roof",
      "roof repair",
      "flat roof",
      "chimney work",
      "fascia / soffit / gutter",
      "roofline",
    ],
    // Roofing-specific scoring categories — NEVER reuse other modules' categories.
    scoring_categories: [
      "quote basics",
      "roofing scope",
      "materials specification",
      "access / scaffold / safety",
      "roof details / leadwork / junctions",
      "insulation / ventilation / building regulations",
      "waste removal / protection",
      "exclusions / extras / risk items",
      "price / vat / payment terms",
      "timescale / guarantees / handover",
    ],
    homeowner_questions: [
      "repair / re-roof / flat roof / chimney / fascia-gutter / roofline",
      "scaffold expected",
      "tiles / slates replaced or repaired",
      "insulation included",
      "leadwork included",
      "fascias / soffits / gutters included",
      "waste removal included",
      "emergency repair",
      "guarantees expected",
      "building regulations involved",
    ],
    report_template: "roofing_report",
  },
  {
    module_id: "windows_doors",
    display_name: "Windows & Doors Quote Checker Module",
    short_label: "Windows & doors",
    status: "coming_soon",
    description:
      "uPVC, aluminium, timber or composite windows and doors — front doors, back doors, patio doors, bifolds and mixed packages. Checks product spec, sizes, glazing, security, trickle vents, making good, disposal, FENSA/CERTASS certification and guarantees.",
    route_or_component: null,
    // RETIRED 2026-08-11: legacy V1 single-pass analyser. Not on the Pass 0/1/2
    // fixed-standard pipeline, so scoring is non-deterministic. Off sale until
    // rebuilt on the V2 standard.,
    supported_project_types: [
      "windows",
      "doors",
      "bifold doors",
      "patio doors",
      "composite door",
      "front door",
    ],
    // Windows & doors-specific scoring categories — NEVER reuse other modules' categories.
    scoring_categories: [
      "quote basics",
      "product specification",
      "sizes / openings / measurements",
      "glazing / security / ventilation",
      "installation / making good",
      "disposal / access",
      "certification / guarantees",
      "exclusions / extras / risk items",
      "price / vat / payment terms",
      "timescale / handover",
    ],
    homeowner_questions: [
      "windows / doors / bifolds / patio / composite door",
      "number of openings replaced",
      "sizes stated",
      "structural alterations involved",
      "trickle vents expected",
      "making good included",
      "disposal included",
      "guarantees / certificates expected",
    ],
    report_template: "windows_doors_report",
  },
  {
    module_id: "plastering_rendering",
    display_name: "Plastering / Rendering Quote Checker Module",
    short_label: "Plastering / rendering",
    status: "coming_soon",
    description:
      "Plastering, skimming, boarding, rendering and patch repairs. Checks areas, preparation, materials, finish, waste, access, exclusions and guarantees.",
    route_or_component: null,
    // RETIRED 2026-08-11: legacy V1 single-pass analyser. Not on the Pass 0/1/2
    // fixed-standard pipeline, so scoring is non-deterministic. Off sale until
    // rebuilt on the V2 standard.,
    supported_project_types: [
      "plastering",
      "skimming",
      "boarding",
      "rendering",
      "patch repair",
    ],
    // Plastering-specific scoring categories — NEVER reuse other modules' categories.
    scoring_categories: [
      "quote basics",
      "areas / measurements / rooms",
      "preparation / removal / protection",
      "boards / materials / beads",
      "finish specification",
      "access / scaffold / waste",
      "drying / aftercare / decoration",
      "exclusions / extras / risk items",
      "price / vat / payment terms",
      "timescale / handover",
    ],
    homeowner_questions: [
      "plastering / skimming / boarding / rendering / patch repair",
      "rooms / areas included",
      "ceilings included",
      "plasterboard included",
      "old plaster removed",
      "making good included",
      "waste removal included",
      "painting / decorating expected",
      "access / scaffold needed",
      "guarantee expected",
    ],
    report_template: "plastering_report",
  },
  {
    module_id: "landscaping_driveway",
    display_name: "Landscaping / Driveway Quote Checker Module",
    short_label: "Landscaping / driveway",
    status: "active",
    description:
      "Patios, driveways, fencing, turfing, drainage and mixed external works. Checks excavation, sub-base, drainage, materials, edging/steps/retaining, waste, access, exclusions and guarantees.",
    route_or_component: "/quote-checker?module=landscaping_driveway",
    supported_project_types: [
      "patio",
      "driveway",
      "fencing",
      "turfing",
      "landscaping",
      "drainage",
      "mixed external works",
    ],
    // Landscaping-specific scoring categories — NEVER reuse other modules' categories.
    scoring_categories: [
      "quote basics",
      "scope / area / measurements",
      "excavation / ground preparation",
      "sub-base / drainage / falls",
      "materials / finish specification",
      "edging / steps / retaining details",
      "waste removal / access / plant",
      "exclusions / extras / risk items",
      "price / vat / payment terms",
      "timescale / guarantees / handover",
    ],
    homeowner_questions: [
      "patio / driveway / fencing / turfing / landscaping / drainage / mixed",
      "approximate area in m²",
      "materials specified",
      "excavation included",
      "waste removal included",
      "drainage needed",
      "access restricted",
      "edgings / steps / retaining walls included",
      "sealing / finishing included",
      "guarantees expected",
    ],
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
