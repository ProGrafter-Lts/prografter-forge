import { useState } from "react";

import { AGENT_BY_ID } from "@/lib/agentRegistry";
import type { ExtractedDrawing, MarkupRegion } from "@/lib/drawingIngestion";

const ACCENT = "#38bdf8";

interface Props {
  extracted: ExtractedDrawing | null;
  previewUrl: string | null;
}

/** Synthetic proposed-plan sheet used when the source is a PDF we cannot raster in-browser. */
const PlanSheet = () => (
  <svg viewBox="0 0 800 600" className="w-full h-auto block" role="img" aria-label="Proposed plan sheet">
    <rect width="800" height="600" fill="#0b1220" />
    <g stroke="rgba(255,255,255,0.06)">
      {Array.from({ length: 16 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} />
      ))}
    </g>
    {/* existing dwelling */}
    <rect x="90" y="120" width="380" height="90" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3" />
    <text x="100" y="112" fill="rgba(255,255,255,0.45)" fontSize="13" fontFamily="monospace">
      EXISTING DWELLING
    </text>
    {/* proposed extension */}
    <rect x="110" y="210" width="350" height="200" fill="rgba(56,189,248,0.07)" stroke={ACCENT} strokeWidth="3" />
    <text x="122" y="236" fill={ACCENT} fontSize="14" fontFamily="monospace">
      PROPOSED EXTENSION 6.0m × 4.0m
    </text>
    {/* internal partition */}
    <line x1="300" y1="210" x2="300" y2="410" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="6 5" />
    {/* bi-fold opening */}
    <line x1="170" y1="410" x2="420" y2="410" stroke="#facc15" strokeWidth="6" />
    <text x="176" y="432" fill="#facc15" fontSize="12" fontFamily="monospace">
      3.0m × 2.1m BI-FOLD
    </text>
    {/* windows */}
    <line x1="500" y1="250" x2="500" y2="320" stroke="#a3e635" strokeWidth="6" />
    <text x="512" y="292" fill="#a3e635" fontSize="12" fontFamily="monospace">
      W1 / W2
    </text>
    {/* utility point */}
    <circle cx="620" cy="430" r="16" fill="none" stroke="#f472b6" strokeWidth="3" />
    <text x="590" y="470" fill="#f472b6" fontSize="12" fontFamily="monospace">
      UTILITY / CU
    </text>
    {/* dimension line */}
    <line x1="90" y1="470" x2="560" y2="470" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <text x="270" y="490" fill="rgba(255,255,255,0.6)" fontSize="12" fontFamily="monospace">
      PERIMETER 24.5 lm
    </text>
  </svg>
);

/**
 * Drawing viewer with interactive agent markup. Each highlighted zone maps to
 * the measurement an agent lifted off the sheet and its calculation formula.
 */
const DrawingMarkupViewer = ({ extracted, previewUrl }: Props) => {
  const [selected, setSelected] = useState<MarkupRegion | null>(null);

  if (!extracted) {
    return (
      <p className="font-mono text-xs text-white/45">
        No drawings ingested yet — drop a sheet or load the Smedley Close sample pack in the
        ingestion zone.
      </p>
    );
  }

  const active = selected ?? extracted.regions[0];
  const agent = AGENT_BY_ID[active.agent];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <div className="relative rounded-xl border border-white/10 overflow-hidden bg-black/40">
          {previewUrl ? (
            <img src={previewUrl} alt="Ingested drawing sheet" className="w-full block" />
          ) : (
            <PlanSheet />
          )}
          {extracted.regions.map((r) => {
            const on = r.id === active.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                aria-pressed={on}
                title={`${r.label} — ${r.value}`}
                className="absolute rounded-md transition-colors"
                style={{
                  left: `${r.x * 100}%`,
                  top: `${r.y * 100}%`,
                  width: `${r.w * 100}%`,
                  height: `${r.h * 100}%`,
                  border: `2px solid ${on ? ACCENT : "rgba(56,189,248,0.45)"}`,
                  backgroundColor: on ? "rgba(56,189,248,0.18)" : "rgba(56,189,248,0.05)",
                }}
              >
                <span
                  className="absolute -top-2 left-1 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: on ? ACCENT : "#0f172a", color: on ? "#04233a" : ACCENT }}
                >
                  {r.value}
                </span>
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[10px] text-white/40 mt-2">
          {extracted.sheetRef} · {extracted.scale} · click any highlighted zone to read the agent
          calculation behind it.
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border p-3" style={{ borderColor: `${ACCENT}55` }}>
          <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: ACCENT }}>
            {agent ? `${agent.name} · ${agent.roleBadge}` : active.agent}
          </p>
          <p className="font-heading text-sm font-bold text-white mt-1">{active.label}</p>
          <p className="font-heading text-lg mt-1" style={{ color: ACCENT }}>
            {active.value}
          </p>
          <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-2.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/45 mb-1">
              Agent formula
            </p>
            <p className="font-mono text-[11px] text-white/85 leading-relaxed">{active.formula}</p>
          </div>
          <p className="font-mono text-[11px] text-white/55 mt-2 leading-relaxed">{active.note}</p>
        </div>

        <div className="space-y-1.5">
          {extracted.regions.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full text-left rounded-lg border px-2.5 py-1.5 transition-colors"
              style={{
                borderColor: r.id === active.id ? `${ACCENT}66` : "rgba(255,255,255,0.10)",
                backgroundColor: r.id === active.id ? "rgba(56,189,248,0.08)" : "transparent",
              }}
            >
              <span className="font-mono text-[11px] text-white/80">{r.label}</span>
              <span className="block font-mono text-[10px] text-white/40">
                {r.agent} · {r.value}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrawingMarkupViewer;
