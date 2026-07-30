// -----------------------------------------------------------------------------
// Plan My Project — deterministic cost-band rulesets
// -----------------------------------------------------------------------------
// RULES:
//  * No AI. Every band is rule-based arithmetic on the homeowner's answers.
//  * Output is ALWAYS a range, never a single figure.
//  * Bands exclude: structural engineer, architect/planning fees, party wall,
//    remedial works elsewhere, VAT treatment, and site-specific surprises.
//  * Categories without a calibrated ruleset stay "coming_soon".
// -----------------------------------------------------------------------------

export type PlanQuestionType = "select" | "number" | "flags";

export interface PlanQuestion {
  id: string;
  label: string;
  help?: string;
  type: PlanQuestionType;
  options?: { value: string; label: string }[];
  /** For flags questions. */
  flags?: { value: string; label: string }[];
  optional?: boolean;
  unit?: string;
}

export interface PlanAnswers {
  [key: string]: string | number | string[] | undefined;
}

export interface PlanEstimate {
  low: number;
  high: number;
  drivers: string[];
  considerations: string[];
  /** True when we couldn't size the job (e.g. no area given). */
  indicativeOnly: boolean;
}

export interface PlanCategory {
  id: string;
  label: string;
  blurb: string;
  status: "available" | "coming_soon";
  /** Quote Checker module to pre-select on the Step 5 upsell. */
  checkerModuleId: string | null;
  questions: PlanQuestion[];
  estimate: (a: PlanAnswers) => PlanEstimate;
}

// ---- helpers ---------------------------------------------------------------

const num = (a: PlanAnswers, k: string): number | null => {
  const v = a[k];
  if (v === undefined || v === "" || v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const str = (a: PlanAnswers, k: string): string => (typeof a[k] === "string" ? (a[k] as string) : "");

const flags = (a: PlanAnswers, k: string): string[] => (Array.isArray(a[k]) ? (a[k] as string[]) : []);

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

/** Round a band outwards to sensible marketing-safe increments. */
export const roundBand = (low: number, high: number): [number, number] => {
  const step = high > 40000 ? 1000 : high > 8000 ? 500 : high > 2000 ? 100 : 50;
  return [Math.max(0, Math.floor(low / step) * step), Math.ceil(high / step) * step];
};

export const formatGBP = (n: number) =>
  `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

export const formatBand = (low: number, high: number) => `${formatGBP(low)} – ${formatGBP(high)}`;

// ---- categories ------------------------------------------------------------

const extension: PlanCategory = {
  id: "extension",
  label: "Extension / structural building work",
  blurb: "Single or double-storey extensions, knock-throughs and structural building work.",
  status: "available",
  checkerModuleId: "extension_building",
  questions: [
    {
      id: "work_type",
      label: "What type of work is it?",
      type: "select",
      options: [
        { value: "single_rear", label: "Single-storey rear extension" },
        { value: "single_side", label: "Single-storey side / wrap-around" },
        { value: "double", label: "Two-storey extension" },
        { value: "garage_conversion", label: "Garage conversion" },
        { value: "knock_through", label: "Internal knock-through / structural opening" },
      ],
    },
    {
      id: "area",
      label: "Approximate floor area in m²",
      help: "If known — a rough figure is fine. Leave blank if you're not sure.",
      type: "number",
      unit: "m²",
      optional: true,
    },
    {
      id: "finish",
      label: "What finish level are you expecting?",
      type: "select",
      options: [
        { value: "shell", label: "Shell only (weathertight, no internal finishes)" },
        { value: "plastered", label: "Plastered finish (ready to decorate)" },
        { value: "full", label: "Full finish (decorated, flooring, fitted out)" },
      ],
    },
    {
      id: "extras",
      label: "Do any of these apply?",
      type: "flags",
      flags: [
        { value: "kitchen", label: "New kitchen inside the extension" },
        { value: "bathroom", label: "New bathroom / WC inside the extension" },
        { value: "bifolds", label: "Bi-folds or large glazed doors" },
        { value: "rooflights", label: "Rooflights / lantern" },
        { value: "access", label: "Restricted access (no side access, terraced, tight street)" },
        { value: "demolition", label: "Demolition of an existing structure first" },
      ],
    },
  ],
  estimate: (a) => {
    const type = str(a, "work_type");
    const finish = str(a, "finish");
    const f = flags(a, "extras");
    const drivers: string[] = [];
    const considerations: string[] = [];

    if (type === "knock_through") {
      let low = 3200;
      let high = 7500;
      drivers.push("Structural opening rather than a full extension");
      if (f.includes("access")) {
        low *= 1.1;
        high *= 1.15;
        drivers.push("Restricted access adds labour and plant time");
      }
      considerations.push(
        "A structural engineer's beam design and calculations are a separate cost, not included here.",
      );
      considerations.push("Building Control notification and sign-off will be needed for a load-bearing opening.");
      const [l, h] = roundBand(low, high);
      return { low: l, high: h, drivers, considerations, indicativeOnly: false };
    }

    let perM2Low = 1850;
    let perM2High = 2500;
    if (type === "double") {
      perM2Low = 1650;
      perM2High = 2300;
      drivers.push("Two-storey work spreads roof and foundation costs over more floor area");
    } else if (type === "garage_conversion") {
      perM2Low = 950;
      perM2High = 1500;
      drivers.push("Garage conversion reuses existing structure, so costs sit well below a new build extension");
    } else if (type === "single_side") {
      perM2Low = 1900;
      perM2High = 2600;
      drivers.push("Side and wrap-around extensions usually mean more external wall per m²");
    } else {
      drivers.push("Single-storey rear extension, standard construction");
    }

    if (finish === "shell") {
      perM2Low *= 0.62;
      perM2High *= 0.68;
      drivers.push("Shell-only finish — no internal finishes priced");
    } else if (finish === "full") {
      perM2Low *= 1.12;
      perM2High *= 1.2;
      drivers.push("Full finish including decoration and flooring");
    } else if (finish === "plastered") {
      drivers.push("Plastered finish, ready for you to decorate");
    }

    const area = num(a, "area");
    const usedArea = area ?? (type === "double" ? 40 : type === "garage_conversion" ? 15 : 20);
    let low = perM2Low * usedArea;
    let high = perM2High * usedArea;

    if (f.includes("kitchen")) {
      low += 7000;
      high += 20000;
      drivers.push("New kitchen included");
      considerations.push("Kitchen units and appliances are often supplied by you — check whether the quote includes supply or fit only.");
    }
    if (f.includes("bathroom")) {
      low += 4500;
      high += 11000;
      drivers.push("New bathroom / WC included");
    }
    if (f.includes("bifolds")) {
      low += 3000;
      high += 9000;
      drivers.push("Bi-folds or large glazed doors");
      considerations.push("Glazing prices vary hugely by frame material and span — get the exact product spec in writing.");
    }
    if (f.includes("rooflights")) {
      low += 1200;
      high += 4500;
      drivers.push("Rooflights / lantern");
    }
    if (f.includes("access")) {
      low *= 1.1;
      high *= 1.15;
      drivers.push("Restricted access (+10–15% for labour and muck-away)");
      considerations.push("With no side access, spoil removal and material handling go through the house — confirm protection and disposal are priced.");
    }
    if (f.includes("demolition")) {
      low += 1800;
      high += 6000;
      drivers.push("Demolition of an existing structure");
      considerations.push("Demolition can uncover unknown drainage or foundations — ask how those would be handled and priced.");
    }

    considerations.push("Foundation depth is unknown until a trial hole is dug. Deep or stepped foundations are one of the biggest single variables on an extension.");
    considerations.push("Structural engineer, architect and planning fees are not included in this band.");

    const [l, h] = roundBand(low, high);
    return { low: l, high: h, drivers, considerations, indicativeOnly: !area };
  },
};

const electrical: PlanCategory = {
  id: "electrical",
  label: "Full rewire / electrical",
  blurb: "Full and partial rewires, consumer unit changes and additional circuits.",
  status: "available",
  checkerModuleId: "electrical_rewire",
  questions: [
    {
      id: "work_type",
      label: "What type of work is it?",
      type: "select",
      options: [
        { value: "full", label: "Full rewire" },
        { value: "partial", label: "Partial rewire" },
        { value: "consumer_unit", label: "Consumer unit change only" },
        { value: "extra_circuits", label: "Extra circuits / additional sockets" },
      ],
    },
    {
      id: "bedrooms",
      label: "How many bedrooms does the property have?",
      type: "select",
      options: [
        { value: "1", label: "1 bedroom / flat" },
        { value: "2", label: "2 bedrooms" },
        { value: "3", label: "3 bedrooms" },
        { value: "4", label: "4 bedrooms" },
        { value: "5", label: "5+ bedrooms" },
      ],
    },
    {
      id: "occupied",
      label: "Will the property be lived in during the work?",
      type: "select",
      options: YES_NO,
    },
    {
      id: "extras",
      label: "Do any of these apply?",
      type: "flags",
      flags: [
        { value: "making_good", label: "Plastering / making good expected afterwards" },
        { value: "period", label: "Period property (lath and plaster, solid walls)" },
        { value: "ev", label: "EV charger included" },
        { value: "outdoor", label: "Outdoor / garden or garage supply" },
        { value: "smart", label: "Smart lighting or extra lighting circuits" },
      ],
    },
  ],
  estimate: (a) => {
    const type = str(a, "work_type");
    const beds = Number(str(a, "bedrooms") || 3);
    const f = flags(a, "extras");
    const drivers: string[] = [];
    const considerations: string[] = [];

    let low: number;
    let high: number;
    if (type === "consumer_unit") {
      low = 550;
      high = 950;
      drivers.push("Consumer unit change only");
    } else if (type === "extra_circuits") {
      low = 350;
      high = 1400;
      drivers.push("Additional circuits / sockets rather than a rewire");
    } else if (type === "partial") {
      low = 1800 + beds * 350;
      high = 3000 + beds * 650;
      drivers.push(`Partial rewire, ${beds} bedroom property`);
    } else {
      low = 2600 + beds * 700;
      high = 4200 + beds * 1150;
      drivers.push(`Full rewire, ${beds} bedroom property`);
    }

    if (str(a, "occupied") === "yes" && (type === "full" || type === "partial")) {
      low *= 1.08;
      high *= 1.15;
      drivers.push("Property occupied during works — staged working adds time");
    }
    if (f.includes("period")) {
      low *= 1.1;
      high *= 1.2;
      drivers.push("Period construction is slower to chase and route cables in");
    }
    if (f.includes("making_good")) {
      low += 600;
      high += 2200;
      drivers.push("Plastering / making good included");
    } else if (type === "full" || type === "partial") {
      considerations.push("Most rewire quotes are 'chase and patch' only — check whether plastering and decoration afterwards are included or your responsibility.");
    }
    if (f.includes("ev")) {
      low += 800;
      high += 1500;
      drivers.push("EV charger included");
    }
    if (f.includes("outdoor")) {
      low += 350;
      high += 1200;
      drivers.push("Outdoor / garage supply");
    }
    if (f.includes("smart")) {
      low += 500;
      high += 2500;
      drivers.push("Smart or additional lighting circuits");
    }

    considerations.push("An electrical installation certificate and Part P Building Control notification should be included — confirm this in writing.");
    considerations.push("If the existing wiring turns out to be in worse condition than expected, scope can grow once walls are opened up.");

    const [l, h] = roundBand(low, high);
    return { low: l, high: h, drivers, considerations, indicativeOnly: false };
  },
};

const bathroom: PlanCategory = {
  id: "bathroom",
  label: "Bathroom",
  blurb: "Full bathroom refits, ensuites, shower rooms and cloakrooms.",
  status: "available",
  checkerModuleId: "bathroom",
  questions: [
    {
      id: "work_type",
      label: "What type of bathroom is it?",
      type: "select",
      options: [
        { value: "full", label: "Full bathroom refit" },
        { value: "ensuite", label: "Ensuite" },
        { value: "shower_room", label: "Shower room" },
        { value: "cloakroom", label: "Cloakroom / WC" },
      ],
    },
    {
      id: "layout",
      label: "Is the layout staying the same?",
      help: "Moving the toilet, bath or shower means new drainage runs.",
      type: "select",
      options: YES_NO,
    },
    {
      id: "spec",
      label: "What spec are you expecting?",
      type: "select",
      options: [
        { value: "budget", label: "Budget / high-street" },
        { value: "mid", label: "Mid-range" },
        { value: "premium", label: "Premium" },
      ],
    },
    {
      id: "extras",
      label: "Do any of these apply?",
      type: "flags",
      flags: [
        { value: "full_tiling", label: "Full height tiling throughout" },
        { value: "ufh", label: "Underfloor heating" },
        { value: "electrics", label: "New lighting, extractor or shaver socket" },
        { value: "wetroom", label: "Wet room / fully tanked shower area" },
        { value: "supply", label: "Contractor supplying the sanitaryware and tiles" },
      ],
    },
  ],
  estimate: (a) => {
    const type = str(a, "work_type");
    const spec = str(a, "spec");
    const f = flags(a, "extras");
    const drivers: string[] = [];
    const considerations: string[] = [];

    let low = 4200;
    let high = 7000;
    if (type === "ensuite" || type === "shower_room") {
      low = 3200;
      high = 5800;
      drivers.push("Ensuite / shower room — smaller footprint than a main bathroom");
    } else if (type === "cloakroom") {
      low = 1400;
      high = 3000;
      drivers.push("Cloakroom / WC only");
    } else {
      drivers.push("Full bathroom refit");
    }

    if (spec === "budget") {
      low *= 0.8;
      high *= 0.85;
      drivers.push("Budget spec fittings");
    } else if (spec === "premium") {
      low *= 1.35;
      high *= 1.7;
      drivers.push("Premium spec fittings and tiling");
    } else {
      drivers.push("Mid-range spec fittings");
    }

    if (str(a, "layout") === "no") {
      low += 600;
      high += 1800;
      drivers.push("Layout changing — new drainage and pipework runs");
      considerations.push("Moving a toilet or shower means new soil and waste runs, which can only be fully priced once the floor is up.");
    }
    if (f.includes("full_tiling")) {
      low += 700;
      high += 2400;
      drivers.push("Full height tiling");
    }
    if (f.includes("ufh")) {
      low += 450;
      high += 1200;
      drivers.push("Underfloor heating");
    }
    if (f.includes("electrics")) {
      low += 350;
      high += 1100;
      drivers.push("Bathroom electrics");
    }
    if (f.includes("wetroom")) {
      low += 800;
      high += 2500;
      drivers.push("Wet room / full tanking");
      considerations.push("Tanking and waterproofing detail is where bathrooms fail long term — make sure the system used is named in the quote.");
    }
    if (f.includes("supply")) {
      low += 900;
      high += 3500;
      drivers.push("Contractor supplying sanitaryware and tiles");
    } else {
      considerations.push("If you're supplying the sanitaryware and tiles, that cost sits on top of this band.");
    }

    considerations.push("Removing an old bathroom often reveals rot, failed tanking or poor pipework — ask how the contractor prices unforeseen repairs.");

    const [l, h] = roundBand(low, high);
    return { low: l, high: h, drivers, considerations, indicativeOnly: false };
  },
};

const boiler: PlanCategory = {
  id: "boiler",
  label: "Boiler / heating",
  blurb: "Boiler replacements, system changes and heating upgrades.",
  status: "available",
  checkerModuleId: "boiler_heating",
  questions: [
    {
      id: "work_type",
      label: "What type of work is it?",
      type: "select",
      options: [
        { value: "like_for_like", label: "Like-for-like boiler replacement" },
        { value: "system_change", label: "Change of system (e.g. conventional to combi)" },
        { value: "new_install", label: "New boiler where there wasn't one" },
        { value: "heating_upgrade", label: "Wider heating upgrade / radiators" },
      ],
    },
    {
      id: "bedrooms",
      label: "How many bedrooms does the property have?",
      type: "select",
      options: [
        { value: "1", label: "1 bedroom / flat" },
        { value: "2", label: "2 bedrooms" },
        { value: "3", label: "3 bedrooms" },
        { value: "4", label: "4+ bedrooms" },
      ],
    },
    {
      id: "extras",
      label: "Do any of these apply?",
      type: "flags",
      flags: [
        { value: "relocate", label: "Boiler moving to a different location" },
        { value: "radiators", label: "New or additional radiators" },
        { value: "controls", label: "Smart thermostat / new controls" },
        { value: "flush", label: "Power flush or system clean expected" },
        { value: "cylinder_removal", label: "Removing an old tank / cylinder" },
      ],
    },
  ],
  estimate: (a) => {
    const type = str(a, "work_type");
    const beds = Number(str(a, "bedrooms") || 3);
    const f = flags(a, "extras");
    const drivers: string[] = [];
    const considerations: string[] = [];

    let low = 2000;
    let high = 3200;
    if (type === "system_change") {
      low = 3000;
      high = 4800;
      drivers.push("System change — more pipework alteration than a straight swap");
    } else if (type === "new_install") {
      low = 3400;
      high = 5800;
      drivers.push("New installation including gas run and flue");
    } else if (type === "heating_upgrade") {
      low = 3800;
      high = 8000;
      drivers.push("Wider heating upgrade");
    } else {
      drivers.push("Like-for-like replacement");
    }

    if (beds >= 4) {
      low *= 1.12;
      high *= 1.2;
      drivers.push("Larger property — higher output boiler and more pipework");
    }

    if (f.includes("relocate")) {
      low += 400;
      high += 1200;
      drivers.push("Boiler relocation");
    }
    if (f.includes("radiators")) {
      low += 350;
      high += 2200;
      drivers.push("New / additional radiators");
    }
    if (f.includes("controls")) {
      low += 150;
      high += 500;
      drivers.push("Smart controls");
    }
    if (f.includes("flush")) {
      low += 300;
      high += 700;
      drivers.push("Power flush / system clean");
    }
    if (f.includes("cylinder_removal")) {
      low += 250;
      high += 900;
      drivers.push("Old tank / cylinder removal");
    }

    considerations.push("Gas Safe registration, a Building Regulations notification and the benchmark warranty paperwork should all be included — confirm this before you accept.");
    considerations.push("Warranty length varies from 2 to 12 years depending on the brand and installer accreditation, and it changes the real value of a quote.");

    const [l, h] = roundBand(low, high);
    return { low: l, high: h, drivers, considerations, indicativeOnly: false };
  },
};

const landscaping: PlanCategory = {
  id: "landscaping",
  label: "Landscaping / driveway",
  blurb: "Patios, driveways, fencing, turfing and mixed garden works.",
  status: "available",
  checkerModuleId: "landscaping_driveway",
  questions: [
    {
      id: "work_type",
      label: "What type of work is it?",
      type: "select",
      options: [
        { value: "patio", label: "Patio" },
        { value: "driveway", label: "Driveway" },
        { value: "fencing", label: "Fencing" },
        { value: "turfing", label: "Turfing / lawn" },
        { value: "mixed", label: "Mixed garden works" },
      ],
    },
    {
      id: "area",
      label: "Approximate area in m² (or metres of fencing)",
      help: "If known — a rough figure is fine. Leave blank if you're not sure.",
      type: "number",
      unit: "m²",
      optional: true,
    },
    {
      id: "spec",
      label: "What material / spec are you expecting?",
      type: "select",
      options: [
        { value: "budget", label: "Budget (concrete slabs, standard panels, tarmac)" },
        { value: "mid", label: "Mid-range (porcelain, block paving, feather-edge)" },
        { value: "premium", label: "Premium (natural stone, resin, bespoke)" },
      ],
    },
    {
      id: "extras",
      label: "Do any of these apply?",
      type: "flags",
      flags: [
        { value: "excavation", label: "Excavation / dig out needed" },
        { value: "drainage", label: "Drainage needed" },
        { value: "access", label: "Restricted access (no rear access, tight street)" },
        { value: "removal", label: "Existing surface needs removing" },
        { value: "levels", label: "Sloping site / retaining or steps needed" },
      ],
    },
  ],
  estimate: (a) => {
    const type = str(a, "work_type");
    const spec = str(a, "spec");
    const f = flags(a, "extras");
    const drivers: string[] = [];
    const considerations: string[] = [];

    // Base per-unit rates (materials + labour, standard build-up).
    let perLow = 70;
    let perHigh = 110;
    let defaultArea = 25;
    if (type === "driveway") {
      perLow = 85;
      perHigh = 140;
      defaultArea = 40;
      drivers.push("Driveway — heavier sub-base than a patio");
    } else if (type === "fencing") {
      perLow = 55;
      perHigh = 110;
      defaultArea = 20;
      drivers.push("Fencing, priced per linear metre");
    } else if (type === "turfing") {
      perLow = 18;
      perHigh = 40;
      defaultArea = 60;
      drivers.push("Turfing / lawn");
    } else if (type === "mixed") {
      perLow = 80;
      perHigh = 160;
      defaultArea = 40;
      drivers.push("Mixed garden works");
    } else {
      drivers.push("Patio, standard build-up");
    }

    if (spec === "budget") {
      perLow *= 0.8;
      perHigh *= 0.85;
      drivers.push("Budget materials");
    } else if (spec === "premium") {
      perLow *= 1.45;
      perHigh *= 1.8;
      drivers.push("Premium materials");
    } else {
      drivers.push("Mid-range materials");
    }

    const area = num(a, "area");
    const usedArea = area ?? defaultArea;

    let low = perLow * usedArea;
    let high = perHigh * usedArea;

    if (f.includes("drainage") && type !== "fencing" && type !== "turfing") {
      low += 15 * usedArea;
      high += 25 * usedArea;
      drivers.push("Drainage (+£15–25/m²)");
      considerations.push("A new driveway usually needs to be permeable or drain to a soakaway — ask how surface water is being dealt with.");
    }
    if (f.includes("removal")) {
      low += 8 * usedArea;
      high += 15 * usedArea;
      drivers.push("Existing surface removal (+£8–15/m²)");
      considerations.push("Spoil disposal cost varies a lot by access and tip charges — check whether muck-away is included or a provisional sum.");
    }
    if (f.includes("excavation")) {
      drivers.push("Excavation included in the base build-up");
      considerations.push("If the dig hits made-ground, old concrete or services, the depth of sub-base needed can change on site.");
    }
    if (f.includes("levels")) {
      low += 900;
      high += 4500;
      drivers.push("Sloping site — retaining or steps");
    }
    if (f.includes("access")) {
      low *= 1.1;
      high *= 1.15;
      drivers.push("Restricted access (+10–15%)");
      considerations.push("With no rear or vehicle access, materials and spoil are barrowed by hand, which adds labour days.");
    }

    considerations.push("Ask what sub-base depth and edging detail is being priced — that's where cheap landscaping quotes cut corners.");

    const [l, h] = roundBand(low, high);
    return { low: l, high: h, drivers, considerations, indicativeOnly: !area };
  },
};

const comingSoon = (id: string, label: string, blurb: string, checkerModuleId: string | null): PlanCategory => ({
  id,
  label,
  blurb,
  status: "coming_soon",
  checkerModuleId,
  questions: [],
  estimate: () => ({ low: 0, high: 0, drivers: [], considerations: [], indicativeOnly: true }),
});

export const PLAN_CATEGORIES: PlanCategory[] = [
  extension,
  electrical,
  bathroom,
  boiler,
  landscaping,
  comingSoon("kitchen", "Kitchen", "Kitchen refits and installations.", "kitchen"),
  comingSoon("roofing", "Roofing", "Re-roofs, flat roofs and repairs.", "roofing"),
  comingSoon("windows_doors", "Windows & doors", "Replacement windows, doors and glazing.", "windows_doors"),
  comingSoon("plastering", "Plastering / rendering", "Re-plastering, skimming and external render.", "plastering_rendering"),
  comingSoon("general", "General building / not sure", "Everything else.", null),
];

export const getPlanCategory = (id: string) => PLAN_CATEGORIES.find((c) => c.id === id) ?? null;

export const PLAN_EXCLUSIONS: { title: string; detail: string }[] = [
  { title: "Structural engineer fees", detail: "Beam design, calculations and site visits are charged separately by the engineer." },
  { title: "Architect and planning fees", detail: "Drawings, planning applications and Building Control fees are not included." },
  { title: "Party wall costs", detail: "Party wall awards and surveyor fees where a neighbour is affected." },
  { title: "Remedial or structural work elsewhere", detail: "Damp, subsidence, rot or repairs found in the rest of the property." },
  { title: "VAT treatment", detail: "Some trades are VAT registered and some are not — the same job can differ by 20%." },
  { title: "Site-specific surprises", detail: "Ground conditions, hidden services, access restrictions and asbestos can only be priced on site." },
];
