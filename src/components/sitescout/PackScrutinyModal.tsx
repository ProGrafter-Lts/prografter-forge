import { useEffect, useState } from "react";
import { Pencil, X, AlertTriangle } from "lucide-react";
import AgentAvatar from "@/components/sitescout/AgentAvatar";
import { AGENT_BY_ID } from "@/lib/agentRegistry";
import type { MasterBoqLine } from "@/lib/procurementEngine";

const ACCENT = "#38bdf8";

const money = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface ScrutinyLine extends MasterBoqLine {
  tradeRate: number;
  tradeTotal: number;
  quantityOverridden: boolean;
  tradeRateOverridden: boolean;
}

/**
 * Granular Scrutiny Modal — deep-dive slide-out panel over a single RFQ pack or
 * BoQ phase. Shows agent attribution, the raw formula, retail vs trade rate and
 * the line variance, with inline overrides on quantity and trade rate.
 */
const PackScrutinyModal = ({
  title,
  subtitle,
  lines,
  onClose,
  onQuantityChange,
  onTradeRateChange,
  onResetLine,
  tradeGap,
  tradeGapPct,
}: {
  title: string;
  subtitle?: string;
  lines: ScrutinyLine[];
  onClose: () => void;
  onQuantityChange: (key: string, value: number) => void;
  onTradeRateChange: (key: string, value: number) => void;
  onResetLine: (key: string) => void;
  tradeGap: number;
  tradeGapPct: number;
}) => {
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const retailTotal = lines.reduce((s, l) => s + l.total, 0);
  const tradeTotal = lines.reduce((s, l) => s + l.tradeTotal, 0);
  const variance = retailTotal - tradeTotal;

  const inputCls =
    "w-[92px] rounded-md bg-white/[0.06] border border-white/20 px-2 py-1 font-mono text-[11px] text-white outline-none focus:border-[#38bdf8]";

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true">
      <button
        aria-label="Close scrutiny panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <aside
        className="relative h-full w-full max-w-[1080px] overflow-y-auto animate-in slide-in-from-right duration-300"
        style={{ backgroundColor: "#0f172a", borderLeft: "1px solid rgba(255,255,255,0.12)" }}
      >
        <header
          className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 py-4"
          style={{
            backgroundColor: "#0f172a",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div className="min-w-0">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Granular scrutiny
            </p>
            <h2 className="font-heading text-lg text-white truncate">{title}</h2>
            {subtitle && (
              <p className="font-mono text-[11px] text-white/45 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/20 p-2 text-white/70 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-5 py-4">
          {!lines.length ? (
            <p className="font-mono text-xs text-white/45">No priced lines in this group.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left border-collapse">
                <thead>
                  <tr>
                    {[
                      "Agent",
                      "Item description",
                      "Calculation formula",
                      "Qty",
                      "Unit",
                      "Retail rate (£)",
                      "Trade rate (£)",
                      "Line variance (£)",
                    ].map((h) => (
                      <th
                        key={h}
                        className="font-mono text-[9px] uppercase tracking-wider text-white/45 border-b border-white/10 pb-2 pr-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const agent = AGENT_BY_ID[l.agent];
                    const lineVariance = l.total - l.tradeTotal;
                    const overridden = l.quantityOverridden || l.tradeRateOverridden;
                    return (
                      <tr key={l.key} className="border-b border-white/5 align-top">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            {agent && (
                              <AgentAvatar agent={agent} state="clean" size={28} />
                            )}
                            <span className="font-mono text-[10px] uppercase tracking-wider text-white/70">
                              {agent?.name ?? l.agent}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 min-w-[230px]">
                          <p className="font-mono text-[11px] text-white/85 leading-snug">
                            {l.description}
                          </p>
                          <p className="font-mono text-[9px] text-white/35 mt-1">{l.category}</p>
                          {overridden && (
                            <span
                              className="inline-flex items-center gap-1 mt-1 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
                            >
                              <AlertTriangle className="h-3 w-3" /> Manual override
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[10px] text-white/45 min-w-[170px]">
                          {l.formula}
                        </td>
                        <td className="py-2.5 pr-3">
                          {editing === `${l.key}:q` ? (
                            <input
                              autoFocus
                              type="number"
                              step="0.01"
                              className={inputCls}
                              defaultValue={l.quantity}
                              onBlur={(e) => {
                                onQuantityChange(l.key, Number(e.target.value));
                                setEditing(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => setEditing(`${l.key}:q`)}
                              className="group inline-flex items-center gap-1.5 font-mono text-[11px] text-white/85"
                              aria-label={`Edit quantity for ${l.description}`}
                            >
                              {l.quantity}
                              <Pencil className="h-3 w-3 text-white/30 group-hover:text-[#38bdf8]" />
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[11px] text-white/60">
                          {l.unit}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[11px] text-white/70">
                          {l.rate.toFixed(2)}
                        </td>
                        <td className="py-2.5 pr-3">
                          {editing === `${l.key}:t` ? (
                            <input
                              autoFocus
                              type="number"
                              step="0.01"
                              className={inputCls}
                              defaultValue={l.tradeRate}
                              onBlur={(e) => {
                                onTradeRateChange(l.key, Number(e.target.value));
                                setEditing(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => setEditing(`${l.key}:t`)}
                              className="group inline-flex items-center gap-1.5 font-mono text-[11px] text-white/85"
                              aria-label={`Edit trade rate for ${l.description}`}
                            >
                              {l.tradeRate.toFixed(2)}
                              <Pencil className="h-3 w-3 text-white/30 group-hover:text-[#38bdf8]" />
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 whitespace-nowrap">
                          <span
                            className="font-heading text-sm"
                            style={{ color: lineVariance >= 0 ? ACCENT : "#f87171" }}
                          >
                            {money(lineVariance)}
                          </span>
                          {overridden && (
                            <button
                              onClick={() => onResetLine(l.key)}
                              className="block font-mono text-[9px] uppercase tracking-wider text-white/40 hover:text-white/80 mt-1"
                            >
                              Reset to formula
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer
          className="sticky bottom-0 grid grid-cols-2 md:grid-cols-5 gap-3 px-5 py-4"
          style={{
            backgroundColor: "#0f172a",
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {[
            ["Package retail total", money(retailTotal), false],
            ["Package trade cost", money(tradeTotal), false],
            ["Package variance", money(variance), true],
            ["Project trade gap", money(tradeGap), true],
            ["Trade gap %", `${tradeGapPct}%`, false],
          ].map(([k, v, hl]) => (
            <div
              key={k as string}
              className="rounded-lg border p-2.5"
              style={{ borderColor: hl ? `${ACCENT}66` : "rgba(255,255,255,0.10)" }}
            >
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                {k as string}
              </p>
              <p
                className="font-heading text-sm"
                style={{ color: hl ? ACCENT : "#fff" }}
              >
                {v as string}
              </p>
            </div>
          ))}
        </footer>
      </aside>
    </div>
  );
};

export default PackScrutinyModal;
