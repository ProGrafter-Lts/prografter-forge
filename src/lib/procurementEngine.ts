/**
 * Tier 2 — Amy's Retail Benchmark BoQ, Merchant RFQ Tender Packs (A–E) and the
 * Procurement Arbitrage / Trade Margin Gap calculator.
 *
 * The BoQ is priced at RETAIL BENCHMARK (public merchant shelf price). The
 * contractor then feeds back the negotiated trade price per pack; the delta is
 * the Trade Gap, which can be retained as net profit or passed to the customer
 * to win the tender.
 *
 * Sandbox-only: drives /sitescout-sandbox.
 */

import type { BoqLine } from "./groundworksEngine";
import type { AgentId } from "./agentRegistry";

export type PackId = "A" | "B" | "C" | "D" | "E";

export interface RfqPack {
  id: PackId;
  name: string;
  merchantHint: string;
  /** Typical negotiated trade discount off the retail benchmark. */
  typicalDiscountPct: number;
}

export const RFQ_PACKS: RfqPack[] = [
  {
    id: "A",
    name: "Pack A — Heavy Civils & Muck-Away",
    merchantHint: "Ready-mix plant, local haulage & skip hire",
    typicalDiscountPct: 15,
  },
  {
    id: "B",
    name: "Pack B — Bricks, Blocks & Insulation",
    merchantHint: "Builders merchant (Travis Perkins / Jewson)",
    typicalDiscountPct: 22,
  },
  {
    id: "C",
    name: "Pack C — Timber & Roofing",
    merchantHint: "Timber yard / roofing specialist",
    typicalDiscountPct: 20,
  },
  {
    id: "D",
    name: "Pack D — Drylining & Plastering",
    merchantHint: "Plaster & board specialist",
    typicalDiscountPct: 18,
  },
  {
    id: "E",
    name: "Pack E — Electrical & Plumbing",
    merchantHint: "Electrical wholesaler (CEF / Edmundson)",
    typicalDiscountPct: 21,
  },
];

export const PACK_BY_ID = Object.fromEntries(RFQ_PACKS.map((p) => [p.id, p])) as Record<
  PackId,
  RfqPack
>;

export const AGENT_BY_PHASE: Record<string, AgentId> = {
  Substructure: "ian",
  Superstructure: "caleb",
  MEP: "megan",
  Finishes: "ruby",
  Prelims: "sharon",
};

/** Keyword → RFQ pack routing. First match wins; falls back to the phase. */
const PACK_RULES: [RegExp, PackId][] = [
  // Order matters — most specific trade wording first.
  [/bi-fold|casement|rooflight|velux|glaz/i, "B"],
  [/mot type 1|sub-base|blinding|dpm|radon|floor slab|floor pir|a252|mesh/i, "A"],
  [
    /digger|dumper|portaloo|heras|site setup|plant hire|acrow|strongboy|prop|scaffold|building control|overhead/i,
    "A",
  ],
  [/fascia|soffit|gutter|downpipe|hopper|rainwater|lead flashing|soaker|roofline/i, "C"],
  [/universal beam|\bub\b|padstone|structural steel/i, "B"],
  [
    /plasterboard|boarding|drylining|skim|thistle|plaster|bonding|bead|render|skirting|architrave|door set|decorat|emulsion/i,
    "D",
  ],
  [/excavat|muck|grab|skip|clayboard|drainage|shingle|hardcore|ready-mix|trench block/i, "A"],
  [/brick|block|pir|insulation|wall tie|lintel|cavity/i, "B"],
  [/timber|joist|rafter|membrane|batten|tile|slate|verge|ridge|roof|fascia|felt/i, "C"],
  [
    /consumer unit|cable|socket|light|switch|first fix|second fix|radiator|pipe|ev charge|underfloor|heating|certif|electric/i,
    "E",
  ],
];

const PHASE_FALLBACK: Record<string, PackId> = {
  Substructure: "A",
  Superstructure: "B",
  MEP: "E",
  Finishes: "D",
  Prelims: "A",
};

export function packForLine(line: BoqLine): PackId {
  for (const [re, id] of PACK_RULES) if (re.test(line.description)) return id;
  return PHASE_FALLBACK[line.phase] ?? "A";
}

/** Human-readable BoQ category derived from the line description. */
export function categoryForLine(line: BoqLine): string {
  const d = line.description.toLowerCase();
  if (/lintel/.test(d)) return "Structural Steel";
  if (/overhead|oh&p|supervision/.test(d)) return "Overheads, Supervision & Profit";
  if (/scaffold/.test(d)) return "Access & Scaffolding";
  if (/building control|structural engineer/.test(d)) return "Statutory Fees & Design";
  if (/bi-fold|casement|rooflight|velux/.test(d)) return "Glazing & External Openings";
  if (/mot type 1|sub-base|blinding|dpm|radon|floor slab|a252/.test(d))
    return "Ground-Floor Slab & Oversite";
  if (/floor pir/.test(d)) return "Ground-Floor Slab & Oversite";
  if (/digger|dumper|portaloo|heras|site setup|acrow|strongboy/.test(d))
    return "Plant Hire & Site Prelims";
  if (/skip/.test(d)) return "Waste Management";
  if (/fascia|soffit|gutter|downpipe|hopper|rainwater/.test(d)) return "Roofline & Rainwater Goods";
  if (/lead flashing|soaker/.test(d)) return "Leadwork";
  if (/universal beam|padstone|structural steel/.test(d)) return "Structural Steel";
  if (/excavat|muck|grab/.test(d)) return "Excavation & Muck-Away";
  if (/clayboard/.test(d)) return "Ground Movement Protection";
  if (/drainage/.test(d)) return "Below-Ground Drainage";
  if (/trench block/.test(d)) return "Substructure Masonry";
  if (/ready-mix|foundation pour/.test(d)) return "Concrete";
  if (/plasterboard|boarding labour/.test(d)) return "Drylining";
  if (/skirting|architrave|door/.test(d)) return "Second-Fix Joinery";
  if (/skim|render|plaster/.test(d)) return "Plastering & Render";
  if (/decorat|emulsion/.test(d)) return "Decoration";
  if (/tile|slate|pantile/.test(d)) return "Roof Covering";
  if (/roof|rafter|batten|membrane|verge|joist|timber/.test(d)) return "Roof Carcass";
  if (/lintel|steel/.test(d)) return "Structural Steel";
  if (/insulation|pir/.test(d)) return "Thermal Insulation";
  if (/brick/.test(d)) return "Facing Masonry";
  if (/block/.test(d)) return "Blockwork";
  if (/consumer unit/.test(d)) return "Distribution & Protection";
  if (/certif|notif/.test(d)) return "Certification";
  if (/radiator|heating|underfloor|pipe|boiler/.test(d)) return "Mechanical & Heating";
  if (/first fix|second fix|socket|light|switch/.test(d)) return "Power & Lighting";
  return line.phase;
}


export interface MasterBoqLine extends BoqLine {
  key: string;
  agent: AgentId;
  category: string;
  pack: PackId;
}

export function buildMasterBoq(lines: BoqLine[]): MasterBoqLine[] {
  return lines.map((line, i) => ({
    ...line,
    key: `${line.phase}-${i}`,
    agent: AGENT_BY_PHASE[line.phase] ?? "amy",
    category: categoryForLine(line),
    pack: packForLine(line),
  }));
}

const round2 = (n: number) => Number(n.toFixed(2));

export interface PackResult {
  pack: RfqPack;
  lines: MasterBoqLine[];
  retailTotal: number;
  negotiatedTotal: number;
  gap: number;
  gapPct: number;
}

export interface ArbitrageResult {
  packs: PackResult[];
  retailTotal: number;
  negotiatedTotal: number;
  tradeGap: number;
  tradeGapPct: number;
  /** 0–100: share of the gap retained by the contractor. */
  retainPct: number;
  retainedProfit: number;
  passedToCustomer: number;
  customerQuoteTotal: number;
  customerQuoteIncVat: number;
}

export function runArbitrage(
  boq: MasterBoqLine[],
  negotiatedByPack: Record<PackId, number | undefined>,
  retainPct: number,
  vatRate = 20,
): ArbitrageResult {
  const packs: PackResult[] = RFQ_PACKS.map((pack) => {
    const lines = boq.filter((l) => l.pack === pack.id);
    const retailTotal = round2(lines.reduce((s, l) => s + l.total, 0));
    const fallback = round2(retailTotal * (1 - pack.typicalDiscountPct / 100));
    const negotiatedTotal = negotiatedByPack[pack.id] ?? fallback;
    const gap = round2(retailTotal - negotiatedTotal);
    return {
      pack,
      lines,
      retailTotal,
      negotiatedTotal: round2(negotiatedTotal),
      gap,
      gapPct: retailTotal > 0 ? Number(((gap / retailTotal) * 100).toFixed(1)) : 0,
    };
  });

  const retailTotal = round2(packs.reduce((s, p) => s + p.retailTotal, 0));
  const negotiatedTotal = round2(packs.reduce((s, p) => s + p.negotiatedTotal, 0));
  const tradeGap = round2(retailTotal - negotiatedTotal);
  const retainedProfit = round2(tradeGap * (retainPct / 100));
  const passedToCustomer = round2(tradeGap - retainedProfit);
  const customerQuoteTotal = round2(retailTotal - passedToCustomer);

  return {
    packs,
    retailTotal,
    negotiatedTotal,
    tradeGap,
    tradeGapPct: retailTotal > 0 ? Number(((tradeGap / retailTotal) * 100).toFixed(1)) : 0,
    retainPct,
    retainedProfit,
    passedToCustomer,
    customerQuoteTotal,
    customerQuoteIncVat: round2(customerQuoteTotal * (1 + vatRate / 100)),
  };
}

// ---------------------------------------------------------------- exporters

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export function packToCsv(result: PackResult, projectRef: string): string {
  const rows: string[] = [
    `ProGrafter RFQ Tender ${result.pack.name} — ${projectRef}`,
    `Suggested merchant: ${result.pack.merchantHint}`,
    "",
    "Trade Agent,Category,Item Description,Formula / Metric,Quantity,Unit,Retail Benchmark Rate,Retail Total,Your Trade Price",
    ...result.lines.map((l) =>
      [
        esc(l.agent),
        esc(l.category),
        esc(l.description),
        esc(l.formula),
        l.quantity,
        esc(l.unit),
        l.rate,
        l.total,
        "",
      ].join(","),
    ),
    `,,,,,,Retail benchmark total,${result.retailTotal},`,
    "",
    "Please return your best trade price against each line. Validity required: 7 days. Fixed delivery window required.",
  ];
  return rows.join("\n");
}

export function allPacksToCsv(packs: PackResult[], projectRef: string): string {
  return packs.map((p) => packToCsv(p, projectRef)).join("\n\n\n");
}

export function masterBoqToCsv(boq: MasterBoqLine[], projectRef: string): string {
  return [
    `ProGrafter Master Bill of Quantities (Retail Benchmark) — ${projectRef}`,
    "",
    "Trade Agent,Category,Item Description,Formula / Metric,Quantity,Unit,Retail Benchmark Rate (£),Retail Total (£),RFQ Pack",
    ...boq.map((l) =>
      [
        esc(l.agent),
        esc(l.category),
        esc(l.description),
        esc(l.formula),
        l.quantity,
        esc(l.unit),
        l.rate,
        l.total,
        l.pack,
      ].join(","),
    ),
  ].join("\n");
}

export function downloadText(filename: string, text: string, mime = "text/csv") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
