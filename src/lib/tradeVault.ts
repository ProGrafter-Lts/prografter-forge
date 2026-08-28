// TradeVault — document type config, status logic and expiry helpers.

export type VaultBaseStatus =
  | "missing"
  | "uploaded"
  | "pending_review"
  | "approved"
  | "rejected";

// Derived statuses shown to the user (base + expiry-aware)
export type VaultDisplayStatus =
  | "missing"
  | "not_added"
  | "legacy_verified"
  | "uploaded"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expiring_soon"
  | "expired";


export interface VaultDocTypeConfig {
  key: string;
  label: string;
  required: boolean;
  // whether provider/cover/policy fields are relevant
  hasProvider?: boolean;
  hasCover?: boolean;
  hasPolicy?: boolean;
  hasExpiry?: boolean;
  /** If set, the document only applies to these trade types. If omitted, applies to all. */
  applicableTradeTypes?: string[];
}

// Normalise trade-type strings so "Painter & Decorator" and "painterdecorator" match.
export const normalizeTradeType = (tradeType?: string | null): string =>
  (tradeType ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const isDocTypeApplicableToTrade = (
  cfg: VaultDocTypeConfig,
  tradeType?: string | null,
): boolean => {
  if (!cfg.applicableTradeTypes || cfg.applicableTradeTypes.length === 0) return true;
  if (!tradeType) return true;
  const normalized = normalizeTradeType(tradeType);
  return cfg.applicableTradeTypes.some((t) => normalizeTradeType(t) === normalized);
};

export const VAULT_DOC_TYPES: VaultDocTypeConfig[] = [
  // Required for verification — every trade
  { key: "public_liability", label: "Public liability insurance", required: true, hasProvider: true, hasCover: true, hasPolicy: true, hasExpiry: true },
  { key: "proof_of_identity", label: "Proof of identity", required: true, hasExpiry: true },
  { key: "trade_qualifications", label: "Trade qualifications / certificates", required: true, hasProvider: true, hasPolicy: true, hasExpiry: true },
  { key: "company_details", label: "Company or sole trader details", required: true, hasPolicy: true },
  // Optional but important — most trades
  { key: "professional_indemnity", label: "Professional indemnity insurance", required: false, hasProvider: true, hasCover: true, hasPolicy: true, hasExpiry: true },
  { key: "employers_liability", label: "Employer's liability insurance", required: false, hasProvider: true, hasCover: true, hasPolicy: true, hasExpiry: true },
  { key: "tool_insurance", label: "Tool insurance", required: false, hasProvider: true, hasCover: true, hasPolicy: true, hasExpiry: true },
  { key: "van_insurance", label: "Van insurance", required: false, hasProvider: true, hasCover: true, hasPolicy: true, hasExpiry: true },
  // Trade-specific optional credentials
  {
    key: "cscs_card",
    label: "CSCS card",
    required: false,
    hasPolicy: true,
    hasExpiry: true,
    applicableTradeTypes: [
      "Builder",
      "Bricklayer",
      "Plasterer",
      "Roofer",
      "Painter & Decorator",
      "Painter",
      "Decorator",
      "Tiler",
      "Landscaper",
      "Kitchen Fitter",
      "Bathroom Fitter",
      "Carpenter / Joiner",
      "Carpenter",
      "Joiner",
      "General Builder",
    ],
  },
  { key: "gas_safe", label: "Gas Safe registration", required: false, hasPolicy: true, hasExpiry: true, applicableTradeTypes: ["Plumber", "Gas Engineer", "Heating Engineer"] },
  { key: "niceic_napit", label: "NICEIC / NAPIT registration", required: false, hasPolicy: true, hasExpiry: true, applicableTradeTypes: ["Electrician", "Electrical Contractor"] },
  { key: "mcs", label: "MCS certification", required: false, hasPolicy: true, hasExpiry: true, applicableTradeTypes: ["Electrician", "Electrical Contractor", "Plumber", "Gas Engineer", "Builder", "General Builder", "Kitchen Fitter", "Bathroom Fitter"] },
  { key: "trustmark", label: "TrustMark registration", required: false, hasPolicy: true, hasExpiry: true },
  { key: "pas_accreditation", label: "PAS 2030 / PAS 2035 accreditation", required: false, hasProvider: true, hasPolicy: true, hasExpiry: true },
  { key: "other_accreditation", label: "Other accreditation", required: false, hasProvider: true, hasPolicy: true, hasExpiry: true },
];

export const getDocTypeConfig = (key: string): VaultDocTypeConfig | undefined =>
  VAULT_DOC_TYPES.find((d) => d.key === key);

export const getDocLabel = (key: string): string =>
  getDocTypeConfig(key)?.label ?? key;

export interface VaultDocument {
  id: string;
  trade_id: string;
  document_type: string;
  file_url: string | null;
  original_filename: string | null;
  provider_name: string | null;
  policy_or_membership_number: string | null;
  cover_amount: number | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  trade_notes: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  /** Storage bucket the file lives in. Legacy migrations point at the application bucket. */
  source_bucket?: string | null;
  /** Set when the row was carried over from a pre-TradeVault verification record. */
  legacy_source?: string | null;
}

export const VAULT_DEFAULT_BUCKET = "trade-verification-documents";


export const EXPIRING_SOON_DAYS = 30;

export const daysUntil = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Compute the display status for a document, combining its stored base status
 * with expiry-aware rules.
 */
export const computeDisplayStatus = (
  doc: VaultDocument | undefined,
  required: boolean,
  /**
   * True when the trade holds a manual verification approved before TradeVault
   * existed. A required document with no file is then a known-good approval
   * awaiting a copy, not an unverified gap.
   */
  legacyVerified = false,
): VaultDisplayStatus => {
  if (!doc || !doc.file_url) {
    if (required && legacyVerified) return "legacy_verified";
    return "missing";
  }

  const days = daysUntil(doc.expiry_date);

  // Expired overrides everything once we have an expiry in the past
  if (days !== null && days < 0) return "expired";

  if (doc.status === "rejected") return "rejected";
  if (doc.status === "approved") {
    if (days !== null && days <= EXPIRING_SOON_DAYS) return "expiring_soon";
    return "approved";
  }
  if (doc.status === "pending_review" || doc.status === "uploaded") return "pending_review";

  return "uploaded";
};

export const STATUS_META: Record<
  VaultDisplayStatus,
  { label: string; tone: "green" | "amber" | "red" | "grey" }
> = {
  missing: { label: "Missing", tone: "red" },
  legacy_verified: { label: "Verified pre-TradeVault — re-upload requested", tone: "amber" },
  uploaded: { label: "Uploaded", tone: "amber" },
  pending_review: { label: "Pending Review", tone: "amber" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  expiring_soon: { label: "Expiring Soon", tone: "amber" },
  expired: { label: "Expired", tone: "red" },
};


export const TONE_CLASSES: Record<string, string> = {
  green: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  red: "bg-red-500/15 text-red-600 border-red-500/30",
  grey: "bg-muted text-muted-foreground border-border",
};

export const REJECTION_REASONS = [
  "Document unreadable",
  "Expiry date missing",
  "Name does not match trade profile",
  "Cover amount insufficient",
  "Wrong document uploaded",
  "Expired document",
  "Accreditation cannot be verified",
];

// Reminder thresholds (days before expiry). Negative = days after.
export const REMINDER_THRESHOLDS = [60, 30, 14, 7, 0, -7];

export interface VaultSummary {
  verificationStatus:
    | "Not Started"
    | "Pending Review"
    | "Verified"
    | "Action Required"
    | "Verification Paused";
  requiredUploaded: number;
  requiredTotal: number;
  expiringSoon: number;
  expired: number;
  missingRequired: VaultDocTypeConfig[];
  expiringDocs: { config: VaultDocTypeConfig; days: number }[];
  expiredRequiredDocs: VaultDocTypeConfig[];
}

/**
 * Roll up an overall verification summary from the current documents.
 * Pass the trade's trade_type to filter out documents that don't apply to that trade.
 */
export const computeVaultSummary = (
  docs: VaultDocument[],
  tradeType?: string | null,
): VaultSummary => {
  const currentByType = new Map<string, VaultDocument>();
  docs
    .filter((d) => d.is_current)
    .forEach((d) => currentByType.set(d.document_type, d));

  const applicableTypes = VAULT_DOC_TYPES.filter((cfg) => isDocTypeApplicableToTrade(cfg, tradeType));
  const requiredTypes = applicableTypes.filter((d) => d.required);
  let requiredUploaded = 0;
  let expiringSoon = 0;
  let expired = 0;
  const missingRequired: VaultDocTypeConfig[] = [];
  const expiringDocs: { config: VaultDocTypeConfig; days: number }[] = [];
  const expiredRequiredDocs: VaultDocTypeConfig[] = [];

  // Count expiring/expired across applicable types only
  applicableTypes.forEach((cfg) => {
    const doc = currentByType.get(cfg.key);
    const status = computeDisplayStatus(doc, cfg.required);
    if (status === "expiring_soon") {
      expiringSoon += 1;
      const days = daysUntil(doc?.expiry_date ?? null);
      if (days !== null) expiringDocs.push({ config: cfg, days });
    }
    if (status === "expired") {
      expired += 1;
      if (cfg.required) expiredRequiredDocs.push(cfg);
    }
  });

  requiredTypes.forEach((cfg) => {
    const doc = currentByType.get(cfg.key);
    if (doc && doc.file_url) requiredUploaded += 1;
    else missingRequired.push(cfg);
  });

  // Overall verification status
  let verificationStatus: VaultSummary["verificationStatus"] = "Not Started";
  const anyUploaded = docs.some((d) => d.is_current && d.file_url);

  const requiredApprovedAndValid = requiredTypes.every((cfg) => {
    const doc = currentByType.get(cfg.key);
    return computeDisplayStatus(doc, cfg.required) === "approved" ||
      computeDisplayStatus(doc, cfg.required) === "expiring_soon";
  });

  if (expiredRequiredDocs.length > 0) {
    verificationStatus = "Verification Paused";
  } else if (missingRequired.length > 0 && anyUploaded) {
    verificationStatus = "Action Required";
  } else if (!anyUploaded) {
    verificationStatus = "Not Started";
  } else if (requiredApprovedAndValid) {
    verificationStatus = "Verified";
  } else {
    verificationStatus = "Pending Review";
  }

  return {
    verificationStatus,
    requiredUploaded,
    requiredTotal: requiredTypes.length,
    expiringSoon,
    expired,
    missingRequired,
    expiringDocs,
    expiredRequiredDocs,
  };
};

// ── Dashboard-facing verification state ───────────────────────────────────────
// Reconciles TradeVault documents with legacy manual/admin verification so the
// dashboard never shows a contradictory "Verified" + "0 of 4 uploaded" state.

export type DashboardVerificationStatus =
  | "Not Started"
  | "Pending Review"
  | "Verified"
  | "Verified — Manual Review"
  | "Migration Required"
  | "Action Required"
  | "Verification Paused";

export const GRACE_PERIOD_DAYS = 30;

export interface ManualVerificationContext {
  /** True when the trade was approved via manual/admin review. */
  manuallyVerified: boolean;
  /** When the trade was verified on ProGrafter (drives the grace window). */
  verifiedAt: string | null;
}

export interface DashboardVerification {
  status: DashboardVerificationStatus;
  /** Status to show specifically inside the TradeVault panel. */
  tradeVaultStatus: DashboardVerificationStatus;
  message?: string;
  inGrace: boolean;
  /** True when documents need migrating into TradeVault. */
  migrationRequired: boolean;
}

const MIGRATION_MESSAGE =
  "Your documents were manually reviewed before TradeVault was introduced. Please upload copies to TradeVault so your verification record stays complete and renewal reminders can work properly.";

export const computeDashboardVerification = (
  docs: VaultDocument[],
  ctx: ManualVerificationContext,
  tradeType?: string | null,
): DashboardVerification => {
  const summary = computeVaultSummary(docs, tradeType);
  const hasAnyDocs = docs.some((d) => d.is_current && d.file_url);
  const requiredComplete = summary.missingRequired.length === 0;

  // Legacy manual verification with nothing in TradeVault yet → migration path.
  if (ctx.manuallyVerified && !hasAnyDocs) {
    const daysSince = ctx.verifiedAt
      ? Math.floor((Date.now() - new Date(ctx.verifiedAt).getTime()) / 86_400_000)
      : 0;
    const inGrace = daysSince <= GRACE_PERIOD_DAYS;
    return {
      status: inGrace ? "Verified — Manual Review" : "Action Required",
      tradeVaultStatus: "Migration Required",
      message: MIGRATION_MESSAGE,
      inGrace,
      migrationRequired: true,
    };
  }

  if (summary.expiredRequiredDocs.length > 0) {
    return {
      status: "Verification Paused",
      tradeVaultStatus: "Verification Paused",
      inGrace: false,
      migrationRequired: false,
    };
  }

  if (!hasAnyDocs) {
    return {
      status: ctx.manuallyVerified ? "Verified" : "Not Started",
      tradeVaultStatus: "Not Started",
      inGrace: false,
      migrationRequired: false,
    };
  }

  if (!requiredComplete) {
    return {
      status: "Action Required",
      tradeVaultStatus: "Action Required",
      inGrace: false,
      migrationRequired: false,
    };
  }

  if (summary.verificationStatus === "Verified" || ctx.manuallyVerified) {
    return {
      status: "Verified",
      tradeVaultStatus: "Verified",
      inGrace: false,
      migrationRequired: false,
    };
  }

  return {
    status: "Pending Review",
    tradeVaultStatus: "Pending Review",
    inGrace: false,
    migrationRequired: false,
  };
};

