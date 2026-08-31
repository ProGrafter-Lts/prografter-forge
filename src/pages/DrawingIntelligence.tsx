import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, FileWarning, FlaskConical, Hourglass, Upload, X } from "lucide-react";

import SheetRegionSplitter from "@/components/drawings/SheetRegionSplitter";
import {
  CONFIDENCE_META,
  EXTRACTION_STREAMS,
  THORSBY_TEST_PAYLOAD,
  buildInjection,
  isAcceptedDrawing,
  isImageDrawing,
  isSheetResolved,
  saveInjection,
  sheetsFromFileName,
  unresolvedReason,
  unresolvedSheets,
  withFiles,
  type Confidence,
  type DataPoint,
  type DrawingAnalysis,
  type DrawingSheet,
  type IngestionState,
  type SheetClassification,
  type SheetRegion,
} from "@/lib/drawingDelta";

type Zone = "drawings" | "calcs";

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
  if (!rows.length) return null;
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
  const [drawings, setDrawings] = useState<string[]>([]);
  const [calcs, setCalcs] = useState<string[]>([]);
  const [sheets, setSheets] = useState<DrawingSheet[]>([]);
  const [pendingScan, setPendingScan] = useState<{ zone: Zone; names: string[] } | null>(null);
  const [state, setState] = useState<IngestionState>("IDLE");
  const [analysis, setAnalysis] = useState<DrawingAnalysis | null>(null);

  // A SPLIT sheet contributes to both sides — its regions carry the classification.
  const existing = sheets
    .filter((s) => s.classification === "EXISTING" || (s.regions ?? []).some((r) => r.classification === "EXISTING"))
    .map((s) => s.fileName);
  const proposed = sheets
    .filter((s) => s.classification === "PROPOSED" || (s.regions ?? []).some((r) => r.classification === "PROPOSED"))
    .map((s) => s.fileName);
  const unresolved = unresolvedSheets(sheets);

  const setSheetClass = (id: string, classification: SheetClassification) =>
    setSheets((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              classification,
              manual: true,
              regions: classification === "SPLIT" ? (s.regions ?? []) : [],
              reason:
                classification === "SPLIT"
                  ? "Marked as a combined sheet — each plan region is tagged separately."
                  : "Manually classified by the user.",
            }
          : s,
      ),
    );

  const setSheetRegions = (id: string, regions: SheetRegion[]) =>
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, regions } : s)));

  const addFiles = (zone: Zone, names: string[]) => {
    const setter = zone === "drawings" ? setDrawings : setCalcs;
    setter((prev) => Array.from(new Set([...prev, ...names])));
    if (zone === "drawings") {
      // Classification is read from each sheet's own title block, never the zone.
      setSheets((prev) => {
        const known = new Set(prev.map((s) => s.fileName));
        const added = names.filter((n) => !known.has(n)).flatMap(sheetsFromFileName);
        return [...prev, ...added];
      });
    }
    // Uploading NEVER fabricates data — we simply wait for the backend.
    setAnalysis(null);
    setState("AWAITING_BACKEND_EXTRACTION");
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

  const loadTestPayload = () => {
    setAnalysis(withFiles(THORSBY_TEST_PAYLOAD, existing, proposed));
    setState("TEST_PAYLOAD_LOADED");
    toast.success("Test Mode payload loaded — 48 Thorsby Road (width 6.903 m, rear opening 3.400 m).");
  };

  const generateSurvey = () => {
    if (!analysis) return;
    if (unclassified.length) {
      toast.error(
        `${unclassified.length} sheet(s) still need manual Existing/Proposed classification before delta comparison.`,
      );
      return;
    }
    const injection = buildInjection(analysis);
    saveInjection(injection);
    toast.success(
      `Delta Engine has injected ${injection.checks.length} verification checks into their SiteScout categories for ${analysis.projectName}.`,
    );
    window.setTimeout(() => navigate("/sitescout-v2"), 900);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-teal-300">Tier 0 · Pre-survey</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Drawing Intelligence &amp; Delta Module</h1>
          <p className="mt-1 text-sm text-white/50">
            Strict ingestion filter. Uploads are queued for backend extraction — no dimensions are ever generated
            locally.
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
            title="Technical Drawings"
            subtitle="One combined set or separate sheets — existing/proposed is read from each title block"
            files={drawings}
            onFiles={(l) => handleFiles("drawings", l)}
            onRemove={(n) => {
              setDrawings((p) => p.filter((x) => x !== n));
              setSheets((p) => p.filter((s) => s.fileName !== n));
            }}
          />
          <UploadZone
            title="Structural Calculations"
            subtitle="Engineer's calcs, beam schedules and span tables"
            files={calcs}
            onFiles={(l) => handleFiles("calcs", l)}
            onRemove={(n) => setCalcs((p) => p.filter((x) => x !== n))}
          />
        </div>

        {sheets.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-semibold text-white">Sheet classification</h3>
            <p className="mt-0.5 text-[11px] text-white/45">
              Read from each sheet's own title block — never from the upload zone, because one document often
              contains both existing and proposed sheets.
            </p>
            {unclassified.length > 0 && (
              <p className="mt-3 rounded-lg border border-orange-400/40 bg-orange-400/[0.08] px-3 py-2 text-[11px] text-orange-100/90">
                {unclassified.length} sheet(s) could not be classified from the title block. Set them manually
                before delta comparison — nothing is guessed.
              </p>
            )}
            <div className="mt-3 space-y-2">
              {sheets.map((s) => (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="truncate font-mono text-[11px] text-white/75">{s.label}</span>
                    <span
                      className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                      style={
                        s.classification === "UNCLASSIFIED"
                          ? { backgroundColor: "rgba(249,115,22,0.16)", color: "#fb923c", borderColor: "rgba(251,146,60,0.5)" }
                          : { backgroundColor: "rgba(56,189,248,0.14)", color: "#38bdf8", borderColor: "rgba(56,189,248,0.45)" }
                      }
                    >
                      {s.classification}
                      {s.manual ? " · manual" : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/50">{s.reason}</p>
                  {s.classification === "UNCLASSIFIED" && (
                    <div className="mt-2">
                      <p className="text-[11px] text-white/70">Is this Existing or Proposed?</p>
                      <div className="mt-1.5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSheetClass(s.id, "EXISTING")}
                          className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-[12px] text-white/85"
                        >
                          Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => setSheetClass(s.id, "PROPOSED")}
                          className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-[12px] text-white/85"
                        >
                          Proposed
                        </button>
                      </div>
                    </div>
                  )}
                  {s.classification !== "UNCLASSIFIED" && (
                    <button
                      type="button"
                      onClick={() => setSheetClass(s.id, s.classification === "EXISTING" ? "PROPOSED" : "EXISTING")}
                      className="mt-2 font-mono text-[10px] uppercase tracking-wider text-teal-300"
                    >
                      Switch to {s.classification === "EXISTING" ? "Proposed" : "Existing"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {state === "AWAITING_BACKEND_EXTRACTION" && (
          <div className="rounded-2xl border border-sky-400/35 bg-sky-400/[0.07] p-4">
            <div className="flex items-center gap-2">
              <Hourglass className="h-4 w-4 animate-pulse text-sky-300" />
              <p className="text-sm font-semibold text-white">Awaiting Backend Extraction</p>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-sky-100/80">
              {drawings.length + calcs.length} file(s) queued. Stated facts, derived measurements and delta
              clashes will populate when the extraction backend returns a payload. Nothing is estimated locally.
            </p>
            <div className="mt-3 space-y-2">
              {EXTRACTION_STREAMS.map((s) => (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-sm font-medium text-white">· {s.title}</p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/45">{s.blurb}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-sky-200/70">Pending</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={loadTestPayload}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-400/50 bg-teal-400/10 px-4 py-4 text-base font-semibold text-teal-200 transition hover:bg-teal-400/20"
        >
          <FlaskConical className="h-4 w-4" />
          Test Mode — inject 48 Thorsby Road payload
        </button>
        <p className="text-center text-[11px] text-white/40">
          Manual QA only: loads the real extracted JSON (width 6.903 m, rear opening 3.400 m) to verify decimal
          handling.
        </p>

        {analysis && (
          <>
            <div className="rounded-2xl border border-teal-400/35 bg-teal-400/[0.07] p-4">
              <p className="text-sm font-semibold text-white">
                {analysis.projectName} · payload loaded (Test Mode)
              </p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-teal-100/80">
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
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-orange-200/70">
                      Injects into SiteScout category: {c.category.replace(/_/g, " ")}
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
