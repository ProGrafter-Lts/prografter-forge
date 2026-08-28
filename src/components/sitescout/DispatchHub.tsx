/**
 * Dispatch & Handover Hub — Stage 3 client-facing document builder.
 *
 * Left: white-label branding settings. Centre: a live A4 preview of the
 * quotation that updates as the tradesman types. Bottom: generate & lock,
 * which issues an immutable revision (A, B, C …) and exports the PDF.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  CONTRACT_TERMS,
  DEFAULT_PAYMENT_STAGES,
  buildScheduleOfWorks,
  loadBranding,
  loadRevisions,
  nextRevision,
  saveBranding,
  saveRevision,
  type DispatchBranding,
  type IssuedRevision,
} from "@/lib/dispatchBranding";
import { generateDispatchQuotePdf } from "@/lib/dispatchQuotePdf";
import type { MasterBoqLine } from "@/lib/procurementEngine";

const ACCENT = "#38bdf8";
const inputClass =
  "w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 font-mono text-xs text-white/90 placeholder:text-white/35 focus:outline-none focus:border-[#38bdf8]";
const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-white/55 mb-1.5";

const money = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 });

interface Props {
  boq: MasterBoqLine[];
  projectRef: string;
  riskSummary: string[];
  exclusions: string[];
  /** Retail package roll-up presented to the homeowner (ex VAT). */
  packages: [string, number][];
  subtotalExVat: number;
  totalIncVat: number;
  vatRate: number;
}

const DispatchHub = ({
  boq,
  projectRef,
  riskSummary,
  exclusions,
  packages,
  subtotalExVat,
  totalIncVat,
  vatRate,
}: Props) => {
  const [brand, setBrand] = useState<DispatchBranding>(() => loadBranding());
  const [clientName, setClientName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [issued, setIssued] = useState<IssuedRevision[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setIssued(loadRevisions(projectRef)), [projectRef]);
  useEffect(() => saveBranding(brand), [brand]);

  const set = <K extends keyof DispatchBranding>(k: K, v: DispatchBranding[K]) =>
    setBrand((p) => ({ ...p, [k]: v }));

  const schedule = useMemo(() => buildScheduleOfWorks(boq), [boq]);
  const surveyDate = useMemo(() => new Date().toLocaleDateString("en-GB"), []);
  const revision = nextRevision(issued);
  const locked = issued.length > 0;
  const latest = issued[issued.length - 1];

  const readLogo = (file?: File | null) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error("Logo must be an image file (PNG or JPG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logoDataUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!packages.length) {
      toast.error("Run the Stage 2 takeoff before issuing a quotation.");
      return;
    }
    generateDispatchQuotePdf({
      branding: brand,
      projectRef,
      revision,
      clientName: clientName || undefined,
      siteAddress: siteAddress || undefined,
      surveyDate,
      riskSummary,
      exclusions,
      packages,
      subtotalExVat,
      vatRate,
      totalIncVat,
      schedule,
      payments: DEFAULT_PAYMENT_STAGES,
      terms: CONTRACT_TERMS,
    });
    setIssued(
      saveRevision({
        revision,
        projectRef,
        issuedAt: new Date().toISOString(),
        companyName: brand.companyName,
        totalExVat: subtotalExVat,
        totalIncVat,
        lineCount: boq.length,
      }),
    );
    toast.success(`Revision ${revision} locked and exported`);
  };

  /* ------------------------------------------------------------- preview */

  const A4 = (
    <div
      className="bg-white text-[#161c26] shadow-2xl mx-auto w-full max-w-[620px] aspect-[1/1.414] overflow-y-auto no-scrollbar"
      style={{ borderTop: `6px solid ${brand.accent}` }}
      data-testid="a4-preview"
    >
      <div className="p-7 space-y-5">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {brand.logoDataUrl ? (
              <img src={brand.logoDataUrl} alt="Company logo" className="h-12 object-contain" />
            ) : (
              <p className="font-heading text-base font-bold leading-tight">{brand.companyName}</p>
            )}
          </div>
          <div className="rounded-md bg-[#f2f6fa] px-3 py-2 text-right shrink-0">
            <p className="text-[8px] font-bold leading-snug" style={{ color: brand.accent }}>
              MATHEMATICALLY VERIFIED &amp;
              <br />
              PROTECTED BY PROGRAFTER AI
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-xl font-bold">Fixed-Price Quotation</h2>
          <span className="text-[10px] font-bold" style={{ color: brand.accent }}>
            REVISION {revision}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[9px] text-[#697687]">
          <div className="space-y-0.5">
            <p>Project reference: {projectRef}</p>
            {clientName && <p>Prepared for: {clientName}</p>}
            {siteAddress && <p>Site: {siteAddress}</p>}
            <p>Date of issue: {surveyDate}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="font-semibold text-[#161c26]">{brand.companyName}</p>
            <p>{brand.address}</p>
            <p>
              {brand.phone} · {brand.email}
            </p>
            <p>
              {brand.companyNumber} · {brand.vatNumber}
            </p>
          </div>
        </div>

        <div className="h-px w-full" style={{ backgroundColor: brand.accent }} />

        {/* 1 */}
        <PreviewHeading accent={brand.accent}>
          1 · Site conditions, ground truth &amp; exclusions
        </PreviewHeading>
        <p className="text-[9px] text-[#697687]">
          Site conditions surveyed on {surveyDate} using the ProGrafter SiteScout survey. The
          findings below are recorded as the basis of this price.
        </p>
        <ul className="space-y-1 text-[9px] text-[#697687]">
          {riskSummary.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
        <p className="text-[9px] font-bold text-[#161c26]">Stated exclusions</p>
        <ul className="space-y-1 text-[9px] text-[#697687]">
          {exclusions.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>

        {/* 2 */}
        <PreviewHeading accent={brand.accent}>2 · The fixed-price quotation</PreviewHeading>
        <div>
          <div
            className="flex justify-between px-2.5 py-1.5 text-[8px] font-bold text-white"
            style={{ backgroundColor: brand.accent }}
          >
            <span>WORKS PACKAGE</span>
            <span>PRICE (EX VAT)</span>
          </div>
          {packages.map(([name, value], i) => (
            <div
              key={name}
              className={`flex justify-between gap-3 px-2.5 py-1.5 text-[9.5px] ${i % 2 ? "bg-[#f6f8fb]" : ""}`}
            >
              <span>{name}</span>
              <span className="whitespace-nowrap">{money(value)}</span>
            </div>
          ))}
          <div className="mt-3 space-y-1 text-[9.5px]">
            <Row label="Subtotal (ex VAT)" value={money(subtotalExVat)} />
            <Row
              label={`VAT @ ${vatRate}%`}
              value={money(Number((totalIncVat - subtotalExVat).toFixed(2)))}
            />
          </div>
          <div
            className="mt-2 flex justify-between px-3 py-2 text-[11px] font-bold text-white"
            style={{ backgroundColor: brand.accent }}
          >
            <span>Total payable inc VAT</span>
            <span>{money(totalIncVat)}</span>
          </div>
        </div>

        {/* 3 */}
        <PreviewHeading accent={brand.accent}>3 · Schedule of works &amp; programme</PreviewHeading>
        <div className="space-y-2.5">
          {schedule.map((b) => (
            <div key={b.weeks + b.title} className="flex gap-2.5">
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: brand.accent }}
              />
              <div>
                <p className="text-[9.5px] font-bold">
                  {b.weeks} · {b.title}
                </p>
                <p className="text-[9px] text-[#697687]">{b.detail}</p>
              </div>
            </div>
          ))}
          {!schedule.length && (
            <p className="text-[9px] text-[#697687]">
              Programme appears once the Stage 2 takeoff has been run.
            </p>
          )}
        </div>

        {/* 4 */}
        <PreviewHeading accent={brand.accent}>
          4 · Contractual terms &amp; payment schedule
        </PreviewHeading>
        <div>
          {DEFAULT_PAYMENT_STAGES.map((s, i) => (
            <div
              key={s.label}
              className={`flex justify-between gap-3 px-2.5 py-1.5 text-[9.5px] ${i % 2 ? "bg-[#f6f8fb]" : ""}`}
            >
              <span>
                {s.pct}% — {s.label}
              </span>
              <span className="whitespace-nowrap">{money((totalIncVat * s.pct) / 100)}</span>
            </div>
          ))}
        </div>
        <ul className="space-y-1.5 text-[8.5px] leading-relaxed text-[#697687]">
          {CONTRACT_TERMS.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>

        <div className="border-t border-[#e6ebf1] pt-2 text-[7.5px] text-[#697687]">
          {brand.companyName} · {projectRef} Rev {revision} · Prepared with ProGrafter
          (prografter.co.uk)
        </div>
      </div>
    </div>
  );

  /* --------------------------------------------------------------- shell */

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
      {/* settings */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="font-heading text-base font-bold text-white mb-3">White-label branding</h3>

          <div className="space-y-3">
            <div>
              <span className={labelClass}>Company name</span>
              <input
                className={inputClass}
                value={brand.companyName}
                onChange={(e) => set("companyName", e.target.value)}
              />
            </div>

            <div>
              <span className={labelClass}>Company logo</span>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  readLogo(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-xl border border-dashed px-3 py-5 text-center transition-colors"
                style={{
                  borderColor: dragOver ? ACCENT : "rgba(255,255,255,0.2)",
                  backgroundColor: dragOver ? "rgba(56,189,248,0.08)" : "transparent",
                }}
              >
                {brand.logoDataUrl ? (
                  <img
                    src={brand.logoDataUrl}
                    alt="Uploaded company logo"
                    className="mx-auto h-10 object-contain"
                  />
                ) : (
                  <p className="font-mono text-[10px] text-white/50">
                    Drag &amp; drop your logo, or click to browse
                  </p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => readLogo(e.target.files?.[0])}
              />
              {brand.logoDataUrl && (
                <button
                  onClick={() => set("logoDataUrl", undefined)}
                  className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/45 hover:text-white/80"
                >
                  Remove logo
                </button>
              )}
            </div>

            <div>
              <span className={labelClass}>Brand accent colour</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Brand accent colour"
                  value={brand.accent}
                  onChange={(e) => set("accent", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-white/15 bg-transparent"
                />
                <input
                  className={inputClass}
                  value={brand.accent}
                  onChange={(e) => set("accent", e.target.value)}
                />
              </div>
            </div>

            {(
              [
                ["address", "Registered address"],
                ["phone", "Contact number"],
                ["email", "Contact email"],
                ["companyNumber", "Company registration number"],
                ["vatNumber", "VAT number"],
              ] as [keyof DispatchBranding, string][]
            ).map(([k, label]) => (
              <div key={k}>
                <span className={labelClass}>{label}</span>
                <input
                  className={inputClass}
                  value={(brand[k] as string) ?? ""}
                  onChange={(e) => set(k, e.target.value as DispatchBranding[typeof k])}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <h3 className="font-heading text-base font-bold text-white">Client &amp; site</h3>
          <div>
            <span className={labelClass}>Client name</span>
            <input
              className={inputClass}
              placeholder="Mr &amp; Mrs Smedley"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div>
            <span className={labelClass}>Site address</span>
            <input
              className={inputClass}
              placeholder="12 Smedley Close, Sutton in Ashfield"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="font-heading text-base font-bold text-white mb-2">Chain of custody</h3>
          {locked ? (
            <div className="space-y-1.5">
              {issued.map((r) => (
                <div key={r.revision} className="flex justify-between gap-2">
                  <span className="font-mono text-[10px] text-white/70">
                    Rev {r.revision} · {new Date(r.issuedAt).toLocaleString("en-GB")}
                  </span>
                  <span className="font-mono text-[10px] text-white/85">
                    {money(r.totalIncVat)}
                  </span>
                </div>
              ))}
              <p className="pt-2 font-mono text-[10px] leading-relaxed text-white/45">
                Revision {latest?.revision} is locked. Any change to the figures or branding must be
                issued as Revision {revision}.
              </p>
            </div>
          ) : (
            <p className="font-mono text-[10px] leading-relaxed text-white/45">
              Nothing issued yet. The first generation locks Revision A.
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!packages.length}
            className="mt-3 w-full rounded-lg px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
            style={{ backgroundColor: ACCENT, color: "#04233a" }}
          >
            {locked ? `🔒 Generate & Lock Revision ${revision}` : "🔒 Generate & Lock PDF Quote"}
          </button>
        </div>
      </div>

      {/* live preview */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className={labelClass}>Live document preview · A4</p>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">
            {locked ? `Issued to Rev ${latest?.revision}` : "Draft — not yet issued"}
          </span>
        </div>
        {A4}
      </div>
    </div>
  );
};

const PreviewHeading = ({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 pt-1">
    <span className="h-3.5 w-[3px]" style={{ backgroundColor: accent }} />
    <h3 className="text-[10px] font-bold uppercase tracking-wide">{children}</h3>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-[#697687]">{label}</span>
    <span>{value}</span>
  </div>
);

export default DispatchHub;
