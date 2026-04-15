import { Leaf } from "lucide-react";

export const RENEWABLE_TRADE_TYPES = [
  "Solar PV Installer",
  "Air Source Heat Pump",
  "Ground Source Heat Pump",
  "External Wall Insulation (EWI)",
  "Cavity Wall Insulation",
  "Loft Insulation",
  "EV Charger Installer",
  "Battery Storage",
  "MVHR Installer",
  "Underfloor Heating",
  "Draught Proofing Specialist",
  "Green Roof",
  "Rainwater Harvesting",
  "EPC Assessor",
  "Retrofit Coordinator",
] as const;

export const HEAT_PUMP_TYPES = ["Air Source Heat Pump", "Ground Source Heat Pump"];

export function isGreenTrade(tradeType: string): boolean {
  return RENEWABLE_TRADE_TYPES.includes(tradeType as any);
}

export function showOzev(tradeType: string): boolean {
  return tradeType === "EV Charger Installer";
}

export function showFgas(tradeType: string): boolean {
  return HEAT_PUMP_TYPES.includes(tradeType);
}

export function showCiga(tradeType: string): boolean {
  return tradeType === "Cavity Wall Insulation";
}

export function showInca(tradeType: string): boolean {
  return tradeType === "External Wall Insulation (EWI)";
}

export const GreenLeafBadge = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex items-center gap-1 text-green-500 ${className}`} title="Renewable & Energy Efficiency">
    <Leaf className="w-3.5 h-3.5" />
  </span>
);

export const GreenLeafBadgeLarge = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex items-center gap-1.5 text-green-500 font-mono text-[10px] uppercase tracking-wider ${className}`} title="Renewable & Energy Efficiency">
    <Leaf className="w-4 h-4" />
    <span>Green Trade</span>
  </span>
);
