/**
 * Amy — Commercial Lead & Principal QS.
 * Merchant tender splitting (Packs A–E), retail-vs-trade arbitrage and
 * margin protection. Sandbox-only.
 */

import type { BoqLine } from "./groundworksEngine";

export type PackId = "A" | "B" | "C" | "D" | "E";

export interface TenderPack {
  id: PackId;
  name: string;
  merchantHint: string;
  phases: string[];
  /** Typical retail (public list price) uplift over the trade rate used in the BoQ. */
  retailUplift: number;
}

export const TENDER_PACKS: TenderPack[] = [
  {
    id: "A",
    name: "Pack A — Muckaway, Aggregates & Concrete",
    merchantHint: "Local haulage + ready-mix plant",
    phases: ["Substructure"],
    retailUplift: 1.18,
  },
  {
    id: "B",
    name: "Pack B — Masonry, Lintels & Insulation",
    merchantHint: "Builders merchant (Travis Perkins / Jewson)",
    phases: ["Superstructure"],
    retailUplift: 1.32,
  },
  {
    id: "C",
    name: "Pack C — Timber, Roofing & Coverings",
    merchantHint: "Roofing specialist / timber yard",
    phases: ["Superstructure"],
    retailUplift: 1.26,
  },
  {
    id: "D",
    name: "Pack D — Electrical & Mechanical Services",
    merchantHint: "Electrical wholesaler (CEF / Edmundson)",
    phases: ["MEP"],
    retailUplift: 1.4,
  },
  {
    id: "E",
    name: "Pack E — Drylining, Joinery & Decoration",
    merchantHint: "Plaster & board specialist",
    phases: ["Finishes"],
    retailUplift: 1.22,
  },
];

export interface PackSummary {
  pack: TenderPack;
  lineCount: number;
  tradeCost: number;
  retailBenchmark: number;
  arbitrage: number;
  arbitragePct: number;
}

export interface CommercialResult {
  netCost: number;
  overheadAmount: number;
  marginAmount: number;
  sellPrice: number;
  marginPct: number;
  vatAmount: number;
  clientTotalIncVat: number;
  packs: PackSummary[];
  totalRetailBenchmark: number;
  totalArbitrage: number;
  auditNotes: string[];
}

export interface CommercialSettings {
  /** Preliminaries / overhead recovery as a % of net cost. */
  overheadPct: number;
  /** Target gross margin as a % of the sell price. */
  targetMarginPct: number;
  vatRate: number;
  contingencyPct: number;
}

export const DEFAULT_COMMERCIAL_SETTINGS: CommercialSettings = {
  overheadPct: 8,
  targetMarginPct: 20,
  vatRate: 20,
  contingencyPct: 5,
};

const round2 = (n: number) => Number(n.toFixed(2));

/** Pack C takes the roof lines out of Superstructure; Pack B keeps the rest. */
const isRoofLine = (line: BoqLine) =>
  /roof|tile|slate|rafter|batten|membrane|ridge/i.test(line.description);

function linesForPack(pack: TenderPack, boq: BoqLine[]): BoqLine[] {
  const inPhase = boq.filter((l) => pack.phases.includes(l.phase));
  if (pack.id === "B") return inPhase.filter((l) => !isRoofLine(l));
  if (pack.id === "C") return inPhase.filter(isRoofLine);
  return inPhase;
}

export function runCommercialAnalysis(
  boq: BoqLine[],
  settings: CommercialSettings = DEFAULT_COMMERCIAL_SETTINGS,
): CommercialResult {
  const netCost = round2(boq.reduce((s, l) => s + l.total, 0));
  const contingency = round2(netCost * (settings.contingencyPct / 100));
  const overheadAmount = round2(netCost * (settings.overheadPct / 100));
  const costBase = round2(netCost + contingency + overheadAmount);
  const marginDivisor = Math.max(0.01, 1 - settings.targetMarginPct / 100);
  const sellPrice = round2(costBase / marginDivisor);
  const marginAmount = round2(sellPrice - costBase);
  const marginPct = sellPrice > 0 ? Number(((marginAmount / sellPrice) * 100).toFixed(1)) : 0;
  const vatAmount = round2(sellPrice * (settings.vatRate / 100));

  const packs: PackSummary[] = TENDER_PACKS.map((pack) => {
    const lines = linesForPack(pack, boq);
    const tradeCost = round2(lines.reduce((s, l) => s + l.total, 0));
    const retailBenchmark = round2(tradeCost * pack.retailUplift);
    const arbitrage = round2(retailBenchmark - tradeCost);
    return {
      pack,
      lineCount: lines.length,
      tradeCost,
      retailBenchmark,
      arbitrage,
      arbitragePct: tradeCost > 0 ? Number(((arbitrage / tradeCost) * 100).toFixed(1)) : 0,
    };
  });

  const totalRetailBenchmark = round2(packs.reduce((s, p) => s + p.retailBenchmark, 0));
  const totalArbitrage = round2(totalRetailBenchmark - netCost);

  const auditNotes: string[] = [
    `Net trade cost ${netCost.toLocaleString()} + ${settings.contingencyPct}% contingency + ${settings.overheadPct}% overhead recovery = cost base ${costBase.toLocaleString()}.`,
    `Sell price derived on margin (÷ ${marginDivisor.toFixed(2)}), not mark-up — a ${settings.targetMarginPct}% mark-up would under-recover by roughly ${round2(costBase * (settings.targetMarginPct / 100) * -1 + marginAmount).toLocaleString()}.`,
    `Retail benchmark across Packs A–E is ${totalRetailBenchmark.toLocaleString()} — ${totalArbitrage.toLocaleString()} of buying advantage sits with the trade account.`,
    "Issue each pack as a separate RFQ with a 7-day validity and a fixed delivery window; do not let merchants see the client sell price.",
  ];
  if (settings.targetMarginPct < 15) {
    auditNotes.push(
      "⚠️ Target margin below 15% leaves no room for a single material price movement on a fixed-price contract.",
    );
  }

  return {
    netCost,
    overheadAmount,
    marginAmount,
    sellPrice,
    marginPct,
    vatAmount,
    clientTotalIncVat: round2(sellPrice + vatAmount),
    packs,
    totalRetailBenchmark,
    totalArbitrage,
    auditNotes,
  };
}
