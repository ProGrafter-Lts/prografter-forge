import { useRef, useState } from "react";

import {
  MIN_REGION_SIZE,
  type DrawingSheet,
  type SheetRegion,
} from "@/lib/drawingDelta";

interface Props {
  sheet: DrawingSheet;
  onChange: (regions: SheetRegion[]) => void;
}

interface Draft {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const norm = (d: Draft) => ({
  x: Math.min(d.x0, d.x1),
  y: Math.min(d.y0, d.y1),
  w: Math.abs(d.x1 - d.x0),
  h: Math.abs(d.y1 - d.y0),
});

const TONE: Record<SheetRegion["classification"], { border: string; bg: string; fg: string }> = {
  EXISTING: { border: "rgba(74,222,128,0.7)", bg: "rgba(34,197,94,0.14)", fg: "#4ade80" },
  PROPOSED: { border: "rgba(56,189,248,0.7)", bg: "rgba(56,189,248,0.14)", fg: "#38bdf8" },
  UNCLASSIFIED: { border: "rgba(251,146,60,0.75)", bg: "rgba(249,115,22,0.16)", fg: "#fb923c" },
};

/**
 * Drag-to-box region splitter for a single sheet that contains both an
 * existing and a proposed plan. Coordinates are normalised 0-1 against the
 * page frame so they remain valid at any render size.
 *
 * The page image itself is not rendered here — the extraction backend does not
 * yet return page rasters — so the frame is a proportional placeholder the user
 * boxes against using the plan positions they can see in their own PDF viewer.
 */
export default function SheetRegionSplitter({ sheet, onChange }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const regions = sheet.regions ?? [];

  const point = (e: React.PointerEvent) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  const commit = () => {
    if (!draft) return;
    const r = norm(draft);
    setDraft(null);
    if (r.w < MIN_REGION_SIZE || r.h < MIN_REGION_SIZE) return;
    onChange([
      ...regions,
      {
        id: `${sheet.id}::r${regions.length + 1}-${Date.now()}`,
        label: `Region ${regions.length + 1}`,
        ...r,
        classification: "UNCLASSIFIED",
      },
    ]);
  };

  const setRegion = (id: string, patch: Partial<SheetRegion>) =>
    onChange(regions.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRegion = (id: string) => onChange(regions.filter((r) => r.id !== id));

  const live = draft ? norm(draft) : null;

  return (
    <div className="mt-3">
      <p className="text-[11px] text-white/70">
        Draw a box around each plan on this sheet, then tag it Existing or Proposed.
      </p>

      <div
        ref={frameRef}
        role="application"
        aria-label={`Draw regions on ${sheet.label}`}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          const p = point(e);
          setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
        }}
        onPointerMove={(e) => {
          if (!draft) return;
          const p = point(e);
          setDraft({ ...draft, x1: p.x, y1: p.y });
        }}
        onPointerUp={commit}
        onPointerCancel={() => setDraft(null)}
        className="relative mt-2 w-full touch-none select-none overflow-hidden rounded-xl border border-white/15 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0_10px,transparent_10px_20px)]"
        style={{ aspectRatio: "297 / 210" }}
      >
        <span className="pointer-events-none absolute inset-x-0 top-2 text-center font-mono text-[10px] uppercase tracking-wider text-white/30">
          Sheet page — drag to box a plan
        </span>

        {regions.map((r) => {
          const t = TONE[r.classification];
          return (
            <div
              key={r.id}
              className="pointer-events-none absolute rounded-md border-2"
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
                borderColor: t.border,
                backgroundColor: t.bg,
              }}
            >
              <span
                className="absolute left-1 top-1 rounded px-1 font-mono text-[9px] uppercase tracking-wider"
                style={{ color: t.fg, backgroundColor: "rgba(15,23,42,0.75)" }}
              >
                {r.label} · {r.classification}
              </span>
            </div>
          );
        })}

        {live && (
          <div
            className="pointer-events-none absolute rounded-md border-2 border-dashed border-teal-300/80 bg-teal-300/10"
            style={{
              left: `${live.x * 100}%`,
              top: `${live.y * 100}%`,
              width: `${live.w * 100}%`,
              height: `${live.h * 100}%`,
            }}
          />
        )}
      </div>

      {regions.length === 0 && (
        <p className="mt-2 rounded-lg border border-orange-400/40 bg-orange-400/[0.08] px-3 py-2 text-[11px] text-orange-100/90">
          No regions drawn yet — a split sheet needs at least two.
        </p>
      )}

      <div className="mt-2 space-y-2">
        {regions.map((r) => (
          <div key={r.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <input
                value={r.label}
                onChange={(e) => setRegion(r.id, { label: e.target.value })}
                aria-label="Region label"
                className="min-w-0 flex-1 rounded bg-transparent font-mono text-[11px] text-white/80 outline-none focus:bg-white/5"
              />
              <button
                type="button"
                onClick={() => removeRegion(r.id)}
                className="font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-white"
              >
                Remove
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["EXISTING", "PROPOSED"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setRegion(r.id, { classification: c })}
                  className="rounded-lg border px-3 py-1.5 text-[12px]"
                  style={
                    r.classification === c
                      ? { borderColor: TONE[c].border, backgroundColor: TONE[c].bg, color: TONE[c].fg }
                      : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }
                  }
                >
                  {c === "EXISTING" ? "Existing" : "Proposed"}
                </button>
              ))}
            </div>
            <p className="mt-1 font-mono text-[9px] text-white/30">
              x {r.x.toFixed(3)} · y {r.y.toFixed(3)} · w {r.w.toFixed(3)} · h {r.h.toFixed(3)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
