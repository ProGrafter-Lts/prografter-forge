/**
 * Dispatch & Handover Hub — white-label branding, schedule of works and
 * contractual payment terms for the Stage 3 client-facing quotation.
 *
 * Sandbox-only: drives /sitescout-sandbox. Branding and issued revisions are
 * persisted locally so the document builder survives a page reload.
 */

import type { MasterBoqLine } from "./procurementEngine";

export interface DispatchBranding {
  companyName: string;
  logoDataUrl?: string;
  accent: string;
  address: string;
  phone: string;
  email: string;
  companyNumber: string;
  vatNumber: string;
}

export const DEFAULT_BRANDING: DispatchBranding = {
  companyName: "Palfreeman Construction Services Limited",
  accent: "#0f766e",
  address: "Unit 4, Sutton Business Park, Nottinghamshire NG17 1AB",
  phone: "07700 900123",
  email: "quotes@palfreemanconstruction.co.uk",
  companyNumber: "Company No. 09284471",
  vatNumber: "VAT No. GB 284 9917 33",
};

const BRAND_KEY = "pg-sitescout-dispatch-branding";
const REVISION_KEY = "pg-sitescout-dispatch-revisions";

export const loadBranding = (): DispatchBranding => {
  if (typeof window === "undefined") return DEFAULT_BRANDING;
  try {
    const raw = window.localStorage.getItem(BRAND_KEY);
    return raw ? { ...DEFAULT_BRANDING, ...JSON.parse(raw) } : DEFAULT_BRANDING;
  } catch {
    return DEFAULT_BRANDING;
  }
};

export const saveBranding = (b: DispatchBranding) => {
  try {
    window.localStorage.setItem(BRAND_KEY, JSON.stringify(b));
  } catch {
    /* storage unavailable — branding stays in-memory for this session */
  }
};

/* ------------------------------------------------------- issued revisions */

export interface IssuedRevision {
  /** A, B, C … — the legal chain of custody. */
  revision: string;
  projectRef: string;
  issuedAt: string;
  companyName: string;
  totalExVat: number;
  totalIncVat: number;
  lineCount: number;
}

export const loadRevisions = (projectRef: string): IssuedRevision[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REVISION_KEY);
    const all: IssuedRevision[] = raw ? JSON.parse(raw) : [];
    return all.filter((r) => r.projectRef === projectRef);
  } catch {
    return [];
  }
};

export const saveRevision = (rev: IssuedRevision): IssuedRevision[] => {
  try {
    const raw = window.localStorage.getItem(REVISION_KEY);
    const all: IssuedRevision[] = raw ? JSON.parse(raw) : [];
    all.push(rev);
    window.localStorage.setItem(REVISION_KEY, JSON.stringify(all));
    return all.filter((r) => r.projectRef === rev.projectRef);
  } catch {
    return [rev];
  }
};

/** Next revision letter: A, B, C … Z, then AA. */
export const nextRevision = (issued: IssuedRevision[]): string => {
  const n = issued.length;
  return n < 26
    ? String.fromCharCode(65 + n)
    : `A${String.fromCharCode(65 + (n - 26))}`;
};

/* ------------------------------------------------- Sharon: schedule of works */

export interface ScheduleBand {
  weeks: string;
  title: string;
  detail: string;
}

const PHASE_PLAN: { phase: string; title: string; weeks: number; detail: string }[] = [
  {
    phase: "Prelims",
    title: "Site set-up & enabling works",
    weeks: 1,
    detail: "Welfare, scaffold, skips, protection and statutory notifications.",
  },
  {
    phase: "Substructure",
    title: "Groundworks & foundations",
    weeks: 2,
    detail: "Excavation, muck-away, concrete pour, substructure masonry to DPC.",
  },
  {
    phase: "Superstructure",
    title: "Shell, structure & roof",
    weeks: 3,
    detail: "Cavity walls, steel, wall plate, roof structure and weathertight covering.",
  },
  {
    phase: "MEP",
    title: "First fix mechanical & electrical",
    weeks: 2,
    detail: "Electrical containment, board works, pipework, drainage connections.",
  },
  {
    phase: "Finishes",
    title: "Plaster, second fix & handover",
    weeks: 3,
    detail: "Boarding, skim, joinery, decoration, testing, certification and clean.",
  },
];

/** Builds Sharon's week-banded programme from the phases actually priced. */
export function buildScheduleOfWorks(boq: MasterBoqLine[]): ScheduleBand[] {
  const present = new Set(boq.map((l) => l.phase));
  const bands: ScheduleBand[] = [];
  let cursor = 1;
  for (const p of PHASE_PLAN) {
    if (!present.has(p.phase)) continue;
    const end = cursor + p.weeks - 1;
    bands.push({
      weeks: cursor === end ? `Week ${cursor}` : `Weeks ${cursor}–${end}`,
      title: p.title,
      detail: p.detail,
    });
    cursor = end + 1;
  }
  return bands;
}

export const programmeWeeks = (bands: ScheduleBand[]) =>
  bands.reduce((s, b) => s + (b.weeks.includes("–") ? 2 : 1), 0);

/* ------------------------------------------------- payment & legal terms */

export interface PaymentStage {
  label: string;
  pct: number;
}

export const DEFAULT_PAYMENT_STAGES: PaymentStage[] = [
  { label: "Deposit on acceptance (materials & mobilisation)", pct: 10 },
  { label: "On completion of foundations to DPC", pct: 25 },
  { label: "On completion of masonry to wall plate", pct: 30 },
  { label: "On the structure being made weathertight", pct: 20 },
  { label: "On practical completion & handover of certificates", pct: 15 },
];

export const CONTRACT_TERMS: string[] = [
  "This quotation is offered on the basis of the JCT Minor Works Building Contract 2016 (or the contractor's standard terms where the client does not require a JCT form). A signed contract is issued on acceptance.",
  "The price is fixed for 30 days from the date of issue and is based on the drawings, specification and site conditions recorded in Section 1. Variations instructed by the client, the designer or Building Control are valued as measured extras.",
  "Payment is due within 7 days of each stage application. Interest is chargeable on late payment under the Late Payment of Commercial Debts (Interest) Act 1998.",
  "The contractor carries public liability insurance of £5m and holds all statutory competent-person registrations relevant to the works. Certificates are issued at practical completion.",
  "Defects liability period of 12 months from practical completion. Workmanship is guaranteed for the period stated in the contract particulars.",
  "The client is responsible for obtaining planning permission, party wall awards and any rights of access required for the works to proceed.",
];
