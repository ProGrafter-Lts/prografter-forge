import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, FileWarning, ScanLine, Upload, X } from "lucide-react";

import {
  CONFIDENCE_META,
  EXTRACTION_STREAMS,
  analyseDrawings,
  buildInjection,
  isAcceptedDrawing,
  isImageDrawing,
  saveInjection,
  type Confidence,
  type DataPoint,
  type DrawingAnalysis,
} from "@/lib/drawingDelta";

type Zone = "existing" | "proposed";

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const m = CONFIDENCE_META[confidence];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
      style={{ backgroundColor: m.bg, color: m.fg, borderColor: m.border }}
    >
      [{m.label}]
    </span>
  );
}

function UploadZone({
  title,
  subtitle,
  files,
  onFiles,
  onRemove,
}: {
  title: string;
  subtitle: string;
  files: string[];
  onFiles: (list: FileList | null) => void;
  onRemove: (name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-0.5 text-[11px] text-white/45">{subtitle}</p>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${title}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`mt-3 cursor-pointer rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
          dragging ? "border-teal-400/70 bg-teal-400/[0.08]" : "border-white/20 bg-white/[0.02]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.dwg,.dxf,.rvt,.ifc,.png,.jpg,.jpeg,.tif,.tiff"
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Upload className="mx-auto h-5 w-5 text-white/50" />
        <p className="mt-2 text-sm font-medium text-white">Drop files or browse</p>
        <p className="mt-1 font-mono text-[10px] text-white/45">PDF · DWG / DXF · RVT / IFC · flat scans only</p>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f) => (
            <li
              key={f}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
            >
              <span className="truncate font-mono text-[11px] text-white/75">{f}</span>
              <button
                type="button"
                aria-label={`Remove ${f}`}
                onClick={() => onRemove(f)}
                className="text-white/40 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DataTable({ title, rows }: { title: string; rows: DataPoint[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-white">{r.label}</span>
              <ConfidenceBadge confidence={r.confidence} />
            </div>
            <p className="mt-1 font-mono text-[12px] text-teal-200">{r.value}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/50">{r.basis}</p>
            <p className="mt-1 font-mono text-[10px] text-white/35">{r.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DrawingIntelligence() {
  const navigate = useNavigate();
  const [existing, setExisting] = useState<string[]>([]);
  const [proposed, setProposed] = useState<string[]>([]);
  const [pendingScan, setPendingScan] = useState<{ zone: Zone; names: string[] } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [streamIndex, setStreamIndex] = useState(0);
  const [analysis, setAnalysis] = useState<DrawingAnalysis | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const addFiles = (zone: Zone, names: string[]) => {
    const setter = zone === "existing" ? setExisting : setProposed;
    setter((prev) => Array.from(new Set([...prev, ...names])));
  };

  const handleFiles = (zone: Zone, list: FileList | null) => {
    const names = Array.from(list ?? []).map((f) => f.name);
    if (!names.length) return;

    const rejected = names.filter((n) => !isAcceptedDrawing(n));
    if (rejected.length) {
      toast.error(`Rejected: ${rejected.join(", ")} — only PDF, CAD or verified flat scans are accepted.`);
    }

    const accepted = names.filter(isAcceptedDrawing);
    const images = accepted.filter(isImageDrawing);
    const safe = accepted.filter((n) => !isImageDrawing(n));

    if (safe.length) addFiles(zone, safe);
    if (images.length) setPendingScan({ zone, names: images });
  };

  const runEngine = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setAnalysis(null);
    setProcessing(true);
    setStreamIndex(0);

    let elapsed = 0;
    EXTRACTION_STREAMS.forEach((s, i) => {
      elapsed += s.duration;
      timers.current.push(window.setTimeout(() => setStreamIndex(i + 1), elapsed));
    });
    timers.current.push(
      window.setTimeout(() => {
        setProcessing(false);
        setAnalysis(analyseDrawings(existing, proposed));
      }, elapsed + 400),
    );
  };

  const generateSurvey = () => {
    if (!analysis) return;
    const injection = buildInjection(analysis);
    saveInjection(injection);
    toast.success(
      `Delta Engine has added ${injection.checks.length} mandatory structural verification checks to your ${analysis.projectName} SiteScout route.`,
    );
    window.setTimeout(() => navigate("/sitescout-v2"), 900);
  };

  const canRun = existing.length > 0 && proposed.length > 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-teal-300">Tier 0 · Pre-survey</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Drawing Intelligence &amp; Delta Module</h1>
          <p className="mt-1 text-sm text-white/50">
            Strict ingestion filter that reads the drawing set, calibrates scale, isolates Existing vs Proposed
            changes and pre-populates the on-site SiteScout visit.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="flex items-start gap-2 rounded-xl border border-orange-400/40 bg-orange-400/[0.08] p-3">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
          <p className="text-[12px] leading-relaxed text-orange-100/90">
            Photographs of drawings (including phone photos) are rejected due to perspective distortion. Upload the
            original PDF, a CAD file, or a verified flat scan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <UploadZone
            title="Existing Layouts"
            subtitle="As-built plans, elevations and existing drainage layouts"
            files={existing}
            onFiles={(l) => handleFiles("existing", l)}
            onRemove={(n) => setExisting((p) => p.filter((x) => x !== n))}
          />
          <UploadZone
            title="Proposed Drawings & Structural Calcs"
            subtitle="Proposed GA plans, elevations, beam schedules and calcs"
            files={proposed}
            onFiles={(l) => handleFiles("proposed", l)}
            onRemove={(n) => setProposed((p) => p.filter((x) => x !== n))}
          />
        </div>

        <button
          type="button"
          onClick={runEngine}
          disabled={!canRun || processing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-4 text-base font-semibold text-[#0f172a] transition hover:bg-teal-300 disabled:opacity-40"
        >
          <ScanLine className="h-4 w-4" />
          {processing ? "Running Extraction & Delta Engine…" : "Run Extraction & Delta Engine"}
        </button>
        {!canRun && (
          <p className="text-center text-[11px] text-white/40">
            Upload at least one Existing layout and one Proposed drawing to run the delta comparison.
          </p>
        )}

        {(processing || analysis) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Extraction streams</h3>
            <div className="space-y-2">
              {EXTRACTION_STREAMS.map((s, i) => {
                const done = analysis !== null || i < streamIndex;
                const active = processing && i === streamIndex;
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: done
                        ? "rgba(45,212,191,0.45)"
                        : active
                          ? "rgba(255,255,255,0.25)"
                          : "rgba(255,255,255,0.1)",
                      backgroundColor: done ? "rgba(45,212,191,0.06)" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <p className="text-sm font-medium text-white">
                      {done ? "✓" : active ? "▸" : "·"} {s.title}
                    </p>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/50">{s.blurb}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {analysis && (
          <>
            <div className="rounded-2xl border border-sky-400/35 bg-sky-400/[0.07] p-4">
              <p className="text-sm font-semibold text-white">Scale calibration</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-sky-100/80">
                {analysis.scaleCalibration}
              </p>
            </div>

            <DataTable title="Stated facts" rows={analysis.stated} />
            <DataTable title="Derived measurements" rows={analysis.derived} />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Delta clashes — Existing vs Proposed</h3>
              <div className="space-y-2">
                {analysis.clashes.map((c) => (
                  <div key={c.id} className="rounded-xl border border-orange-400/35 bg-orange-400/[0.07] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">{c.title}</span>
                      <ConfidenceBadge confidence="SITE_VERIFICATION_REQUIRED" />
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/55">{c.detail}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-orange-100/90">
                      On-site question: {c.verificationQuestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <DataTable title="Outstanding — site verification required" rows={analysis.unverified} />

            <button
              type="button"
              onClick={generateSurvey}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-4 text-base font-semibold text-[#0f172a] transition hover:bg-teal-300"
            >
              Generate Dynamic SiteScout Survey <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </main>

      {pendingScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-orange-400/40 bg-[#0f172a] p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-300" />
              <h2 className="text-base font-semibold text-white">Verify this is a flat scan</h2>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-white/60">
              {pendingScan.names.join(", ")} — image files are only accepted as verified flat scans. Photographs of
              drawings (including phone photos) are rejected due to perspective distortion, which corrupts scale
              calibration.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  toast.error("Upload rejected — supply the original PDF, CAD file or a flat scan.");
                  setPendingScan(null);
                }}
                className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/80"
              >
                It's a photograph
              </button>
              <button
                type="button"
                onClick={() => {
                  addFiles(pendingScan.zone, pendingScan.names);
                  setPendingScan(null);
                }}
                className="rounded-xl bg-teal-400 px-4 py-3 text-sm font-semibold text-[#0f172a]"
              >
                Confirm flat scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
