import { useEffect, useRef, useState } from "react";

import {
  SAMPLE_DRAWING_PACK,
  SCAN_STEPS,
  extractFromFile,
  type ExtractedDrawing,
} from "@/lib/drawingIngestion";

const ACCENT = "#38bdf8";

interface Props {
  extracted: ExtractedDrawing | null;
  previewUrl: string | null;
  onIngest: (data: ExtractedDrawing, previewUrl: string | null) => void;
  onOpenViewer: () => void;
}

/**
 * Drag-and-drop drawing ingestion zone with a staged scanning modal.
 * On completion it hands the parsed geometry back so every agent input
 * can be auto-populated without manual typing.
 */
const DrawingIngestZone = ({ extracted, previewUrl, onIngest, onOpenViewer }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const pending = useRef<{ data: ExtractedDrawing; url: string | null } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const startScan = (data: ExtractedDrawing, url: string | null) => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    pending.current = { data, url };
    setScanning(true);
    setStepIndex(0);
    setProgress(0);

    let elapsed = 0;
    SCAN_STEPS.forEach((s, i) => {
      elapsed += s.duration;
      timers.current.push(
        window.setTimeout(() => {
          setStepIndex(i + 1);
          setProgress(Math.round(((i + 1) / SCAN_STEPS.length) * 100));
        }, elapsed),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setScanning(false);
        if (pending.current) onIngest(pending.current.data, pending.current.url);
      }, elapsed + 450),
    );
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    startScan(extractFromFile(file), url);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-base font-bold text-white">
          Drawing &amp; PDF Ingestion Zone
        </h3>
        <span
          className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "rgba(56,189,248,0.15)", color: ACCENT }}
        >
          Tier 0
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        aria-label="Drop architectural drawings or click to browse"
        className="rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? ACCENT : "rgba(255,255,255,0.2)",
          backgroundColor: dragging ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.02)",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="font-heading text-sm font-bold text-white">📐 Drop drawings here</p>
        <p className="font-mono text-[11px] text-white/50 mt-1.5 leading-relaxed">
          Architectural PDFs, structural schedules and elevations — .pdf, .png, .jpg
        </p>
      </div>

      <button
        onClick={() => startScan(SAMPLE_DRAWING_PACK, null)}
        className="mt-3 w-full rounded-lg px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider font-bold"
        style={{ backgroundColor: ACCENT, color: "#04233a" }}
      >
        Load Sample Drawing Pack: Smedley Close Extension
      </button>

      {extracted && !scanning && (
        <div
          className="mt-3 rounded-xl border p-3"
          style={{ borderColor: `${ACCENT}66`, backgroundColor: "rgba(56,189,248,0.07)" }}
        >
          <p className="font-mono text-[11px] font-bold" style={{ color: ACCENT }}>
            ✓ Drawings successfully parsed and verified by Lee &amp; Amy.
          </p>
          <p className="font-mono text-[10px] text-white/60 mt-1.5 leading-relaxed">
            {extracted.sheetName} · {extracted.sheetRef} · {extracted.scale} ·{" "}
            {extracted.regions.length} measurements extracted at {extracted.confidence}% confidence.
          </p>
          <button
            onClick={onOpenViewer}
            className="mt-2 rounded-lg px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider border border-white/25 text-white/80"
          >
            Open drawings &amp; markup
          </button>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Uploaded drawing thumbnail"
              className="mt-2 w-full rounded-lg border border-white/10"
            />
          )}
        </div>
      )}

      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            className="w-full max-w-lg rounded-2xl border p-6"
            style={{ borderColor: `${ACCENT}55`, backgroundColor: "#0f172a" }}
          >
            <p className="font-heading text-lg font-bold text-white">
              Scanning drawing pack — agents reading the sheet
            </p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden my-4">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${Math.max(progress, 6)}%`, backgroundColor: ACCENT }}
              />
            </div>
            <div className="space-y-2">
              {SCAN_STEPS.map((s, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <p
                    key={s.id}
                    className="font-mono text-[11px] leading-relaxed"
                    style={{
                      color: done ? ACCENT : active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {done ? "✓" : active ? "▸" : "·"} Step {s.id}: {s.label}
                  </p>
                );
              })}
            </div>
            <p className="font-mono text-[10px] text-white/40 mt-4">{progress}% complete</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingIngestZone;
