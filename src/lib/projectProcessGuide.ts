// Descriptive, typical-case guidance for the free Project Cost Guide tool.
// This is education only — never a commitment, ruling or quotation.

export type PermissionLikelihood = "does" | "does not" | "may";

export interface ProcessGuide {
  stages: string[];
  trades: string[];
  timeline: string;
  permissions: {
    likelihood: PermissionLikelihood;
    requirement: string;
    reason: string;
  };
}

export const PERMISSIONS_DISCLAIMER =
  "This is a starting-point indication only. Confirm requirements with your Local Planning Authority and/or Building Control before proceeding — rules vary by property, area, and recent changes to permitted development rights.";

const GUIDES: Record<string, ProcessGuide> = {
  extension_building: {
    stages: [
      "Design and measured survey",
      "Planning and/or Building Regs application where needed",
      "Structural design and tender to builders",
      "Groundworks and foundations",
      "Shell — walls, steels, roof structure",
      "Weathertight — roof covering, windows and doors",
      "First fix — electrics, plumbing, carpentry",
      "Plastering and screed",
      "Second fix, decoration and snagging",
    ],
    trades: [
      "Architect / designer",
      "Structural engineer",
      "Groundworker",
      "Bricklayer",
      "Carpenter",
      "Roofer",
      "Window installer",
      "Electrician",
      "Plumber / heating engineer",
      "Plasterer",
      "Decorator",
    ],
    timeline:
      "Single-storey rear extensions commonly take 8–14 weeks on site, excluding any planning wait. Two-storey work commonly runs 14–22 weeks.",
    permissions: {
      likelihood: "may",
      requirement: "planning permission, and almost always Building Regs approval",
      reason:
        "Single-storey rear extensions within permitted development limits usually don't need planning permission, but yours may if it exceeds typical depth or height limits, or if the property is a flat, listed, or in a conservation area. Structural, insulation, drainage and fire safety work is normally covered by Building Regulations regardless.",
    },
  },
  boiler_heating: {
    stages: [
      "Heat loss / system survey",
      "System design and appliance selection",
      "Removal of old appliance",
      "Installation and pipework alterations",
      "Commissioning, flush and controls setup",
      "Registration of the installation and handover",
    ],
    trades: ["Gas Safe heating engineer", "Electrician (for controls or fused spurs)", "Plasterer or decorator for making good"],
    timeline:
      "Straight swaps commonly take 1–2 days. Boiler relocations or full system upgrades commonly take 3–5 days.",
    permissions: {
      likelihood: "does",
      requirement: "Building Regs approval (normally self-certified by the installer)",
      reason:
        "Heating appliance work is notifiable under Building Regulations, but a Gas Safe or MCS registered installer typically self-certifies it and issues the compliance certificate. Planning permission is rarely relevant unless an external flue or heat pump unit affects a listed or conservation-area property.",
    },
  },
  electrical_rewire: {
    stages: [
      "Condition survey and circuit design",
      "Chasing walls and first fix cabling",
      "Consumer unit / board change",
      "Second fix — accessories, lighting, testing",
      "Certification and making good",
    ],
    trades: ["Electrician (competent-person scheme registered)", "Plasterer", "Decorator"],
    timeline:
      "Full rewires commonly take 5–10 working days for a typical 3-bed home. Partial works and board changes are commonly 1–2 days.",
    permissions: {
      likelihood: "does",
      requirement: "Building Regs approval under Part P (normally self-certified)",
      reason:
        "Most domestic electrical work is notifiable under Part P, and a scheme-registered electrician typically self-certifies and issues the certificate. Planning permission is not usually relevant.",
    },
  },
  bathroom: {
    stages: [
      "Design and specification",
      "Strip-out and waste removal",
      "First fix plumbing and electrics",
      "Walls, floors and waterproofing",
      "Tiling",
      "Second fix — sanitaryware, screens, extract",
      "Decoration and snagging",
    ],
    trades: ["Plumber", "Electrician", "Tiler", "Plasterer", "Carpenter", "Decorator"],
    timeline: "Full bathroom refits commonly take 7–14 working days.",
    permissions: {
      likelihood: "may",
      requirement: "Building Regs approval (electrics and ventilation)",
      reason:
        "A like-for-like bathroom refit normally doesn't need planning permission. Electrical work and mechanical extract ventilation are covered by Building Regulations, and structural changes such as removing a wall or adding a new soil connection can bring further requirements.",
    },
  },
  kitchen: {
    stages: [
      "Design and survey",
      "Strip-out",
      "Any structural or layout alterations",
      "First fix plumbing, electrics and gas",
      "Plastering and flooring preparation",
      "Unit installation and worktop template",
      "Worktop fit, second fix and appliances",
      "Tiling, decoration and snagging",
    ],
    trades: ["Kitchen fitter / carpenter", "Electrician", "Plumber", "Gas engineer", "Plasterer", "Tiler", "Worktop fabricator", "Decorator"],
    timeline:
      "Kitchen refits commonly take 2–4 weeks, with a 1–3 week wait between worktop template and fit for stone or quartz.",
    permissions: {
      likelihood: "may",
      requirement: "Building Regs approval",
      reason:
        "A replacement kitchen in the same layout normally doesn't need planning permission. Electrics, gas, ventilation and any structural opening are covered by Building Regulations.",
    },
  },
  roofing: {
    stages: [
      "Roof survey and specification",
      "Scaffold erection",
      "Strip existing covering",
      "Timber repairs, membrane and battens",
      "New covering, flashings and leadwork",
      "Rainwater goods and finishing",
      "Scaffold removal and clean-down",
    ],
    trades: ["Roofer", "Scaffolder", "Carpenter", "Leadworker"],
    timeline:
      "Full pitched-roof recovers commonly take 1–2 weeks including scaffold. Flat roof replacements commonly take 3–7 days.",
    permissions: {
      likelihood: "may",
      requirement: "planning permission, with Building Regs approval likely",
      reason:
        "Like-for-like re-roofing usually falls under permitted development, but planning permission may apply to listed properties, conservation areas, or changes to roof shape and materials. Replacing more than a quarter of the roof area typically triggers Building Regulations for insulation and structure.",
    },
  },
  windows_doors: {
    stages: [
      "Survey and manufacture (lead time)",
      "Removal of existing units",
      "Installation and structural support checks",
      "Sealing, trims and making good",
      "Certification and handover",
    ],
    trades: ["Window / door installer (FENSA or Certass registered)", "Carpenter", "Plasterer", "Decorator"],
    timeline:
      "Manufacture commonly takes 3–8 weeks; installation of a full house of windows commonly takes 2–5 days.",
    permissions: {
      likelihood: "does",
      requirement: "Building Regs approval (normally self-certified by the installer)",
      reason:
        "Replacement windows and external doors are covered by Building Regulations for thermal performance, safety glazing and means of escape, and registered installers typically self-certify. Planning permission usually only applies to listed buildings, conservation areas or new openings.",
    },
  },
  plastering_rendering: {
    stages: [
      "Surface preparation and protection",
      "Any hacking-off or removal",
      "Beading, backing coats or basecoat",
      "Skim or top coat application",
      "Drying and decoration",
    ],
    trades: ["Plasterer / renderer", "Scaffolder (external work)", "Decorator"],
    timeline:
      "Internal room replastering commonly takes 2–5 days plus drying. Full external render commonly takes 1–3 weeks including scaffold and cure time.",
    permissions: {
      likelihood: "does not",
      requirement: "planning permission",
      reason:
        "Internal plastering and like-for-like render normally need neither planning permission nor Building Regs sign-off. External wall insulation systems, listed buildings and conservation areas are the common exceptions.",
    },
  },
  landscaping_driveway: {
    stages: [
      "Design and levels survey",
      "Excavation and muck-away",
      "Drainage and sub-base",
      "Edgings and retaining structures",
      "Surfacing — paving, resin or tarmac",
      "Planting, fencing and finishing",
    ],
    trades: ["Landscaper", "Groundworker", "Drainage contractor", "Bricklayer", "Fencer", "Electrician (for external lighting)"],
    timeline:
      "Driveways commonly take 1–2 weeks. Larger garden transformations commonly take 3–6 weeks.",
    permissions: {
      likelihood: "may",
      requirement: "planning permission",
      reason:
        "Permeable driveways and typical garden works usually fall under permitted development, but planning permission may be needed for impermeable surfacing over 5m² draining to the highway, a new dropped kerb, or high walls and decking near boundaries.",
    },
  },
  general_building: {
    stages: [
      "Scope definition and survey",
      "Design or specification where needed",
      "Any consents or notifications",
      "Enabling works and strip-out",
      "Main construction works",
      "Services first and second fix",
      "Finishes, decoration and snagging",
    ],
    trades: ["General builder", "Relevant specialist trades for the scope", "Electrician", "Plumber", "Plasterer", "Decorator"],
    timeline:
      "Timelines vary widely by scope — small works commonly take days, whole-house projects commonly take several months.",
    permissions: {
      likelihood: "may",
      requirement: "planning permission and/or Building Regs approval",
      reason:
        "Whether consents apply depends entirely on the scope. Structural alterations, drainage, insulation, electrics and heating are typically covered by Building Regulations, while extensions, outbuildings and external changes can trigger planning permission.",
    },
  },
};

export const getProcessGuide = (module?: string): ProcessGuide | null =>
  (module && GUIDES[module]) || null;
