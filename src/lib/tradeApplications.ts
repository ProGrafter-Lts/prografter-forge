import { supabase } from "@/integrations/supabase/client";

export type DocMeta = { path: string; filename: string; size: number; mime: string; uploaded_at: string };

export interface TradeApplication {
  id: string;
  applicant_email: string | null;
  full_name: string | null;
  business_name: string | null;
  trade_category_id: string | null;
  qualification_path: string | null;
  verification_status: string;
  status: string;
  admin_notes: string | null;
  verification_checks: Record<string, { checked: boolean; by?: string; by_email?: string; at?: string }> | null;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  document_paths: Record<string, DocMeta[]> | null;
  form_data: Record<string, unknown> | null;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: string;
  actor_user_id: string | null;
  actor_email: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

// Verification workflow statuses (matches the published standard)
export const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "reference_checks", label: "Reference checks" },
  { value: "awaiting_info", label: "Awaiting requested information" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "held", label: "Held" },
  { value: "coming_soon", label: "Coming soon (out of area)" },
] as const;

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.label]),
);

export const STATUS_COLOR: Record<string, string> = {
  new: "#2563EB",
  in_review: "#7C3AED",
  reference_checks: "#D97706",
  awaiting_info: "#B45309",
  approved: "#16A34A",
  rejected: "#DC2626",
  held: "#6B7280",
  coming_soon: "#0F766E",
};

export const QUAL_LABEL: Record<string, string> = {
  regulated: "Regulated",
  qualified: "Qualified",
  "time-served": "Time-served",
  time_served: "Time-served",
};

// Trades governed by an independent registration body. For these, registration
// with that body IS the independent assessment — references add nothing, so the
// "References checked" item is removed and references cannot be requested.
export const SCHEME_REGULATED_TRADES: Record<string, string> = {
  electrician: "Competent Person Scheme (NICEIC / NAPIT / ELECSA)",
  gas_engineer: "Gas Safe Register",
  solar_pv: "MCS",
  heat_pump: "MCS",
  ev_charger: "OZEV-authorised installer",
  oil_boiler: "OFTEC",
};

/** Independent body name for a trade category, or null when there is none. */
export const governingBodyFor = (tradeCategoryId?: string | null): string | null =>
  SCHEME_REGULATED_TRADES[(tradeCategoryId ?? "").trim().toLowerCase()] ?? null;

/**
 * References only apply where no independent assessing body exists
 * (builders, plasterers, joiners, roofers, landscapers, plumbers, tilers,
 * decorators, kitchen/bathroom fitters, "other", and anything unrecognised).
 */
export const tradeRequiresReferences = (tradeCategoryId?: string | null): boolean =>
  governingBodyFor(tradeCategoryId) === null;

/**
 * A plumber who is also a Gas Safe registered heating engineer is independently
 * assessed by the Gas Safe Register, so references add nothing. Detected from
 * the Gas Safe answer on the application form (number + card upload).
 */
export const hasGasSafeRegistration = (
  app: Pick<TradeApplication, "form_data" | "document_paths">,
): boolean => {
  const f = (app.form_data ?? {}) as Record<string, unknown>;
  const s = (k: string) => String(f[k] ?? "").trim();
  const scheme = `${s("qual_scheme_name")} ${s("cps_scheme")}`.toLowerCase();
  const number = s("gas_safe_number") || (/gas\s*safe/.test(scheme) ? s("qual_reg_number") : "");
  const hasCard = Boolean(app.document_paths?.gas_safe_doc?.length);
  return Boolean(number) && (hasCard || /gas\s*safe/.test(scheme));
};

/** Whether this specific application still needs trade references. */
export const applicationRequiresReferences = (
  app: Pick<TradeApplication, "form_data" | "document_paths" | "trade_category_id">,
): boolean => tradeRequiresReferences(app.trade_category_id) && !hasGasSafeRegistration(app);

// The published verification checks
export const VERIFICATION_CHECKS = [
  { id: "identity", label: "Identity & photo ID confirmed" },
  { id: "qualifications", label: "Qualifications / scheme registration verified" },
  { id: "insurance", label: "Insurance certificate reviewed & valid" },
  { id: "references", label: "References checked" },
  { id: "portfolio", label: "Portfolio of work reviewed" },
] as const;

/** Checklist for a specific application — drops references for scheme-regulated trades. */
export const verificationChecksFor = (tradeCategoryId?: string | null) =>
  VERIFICATION_CHECKS.filter((c) => c.id !== "references" || tradeRequiresReferences(tradeCategoryId));

// Document groups shown in the detail view, in display order.
export const DOC_GROUPS: { heading: string; fields: string[] }[] = [
  { heading: "Qualifications", fields: ["qual_card_doc", "qual_cert_doc"] },
  { heading: "Portfolio Photos", fields: ["portfolio_photos"] },
  { heading: "Insurance Certificate", fields: ["insurance_certificate"] },
  { heading: "Photo ID", fields: ["photo_id", "id_document"] },
];

export const FIELD_LABELS: Record<string, string> = {
  qual_card_doc: "Scheme card / certificate",
  qual_cert_doc: "Qualification certificate",
  insurance_certificate: "Certificate of Insurance",
  portfolio_photos: "Portfolio photo",
  photo_id: "Photo ID",
  id_document: "Photo ID",
};

// Photo ID became a required field on the public /apply form at this moment.
// Applications submitted before it have no ID file and must not be presented
// as though identity evidence was ever collected.
export const ID_CAPTURE_REQUIRED_FROM = "2026-09-09T20:30:00.000Z";

export const hasPhotoId = (docPaths: Record<string, DocMeta[]> | null | undefined): boolean =>
  Boolean((docPaths?.photo_id?.length ?? 0) + (docPaths?.id_document?.length ?? 0));

export const predatesIdCapture = (createdAt: string): boolean =>
  new Date(createdAt).getTime() < new Date(ID_CAPTURE_REQUIRED_FROM).getTime();

export const fmtSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

export const isImage = (mime: string) => /^image\//.test(mime || "");

// Generate a short-lived signed URL for a private document.
export async function signedUrlFor(path: string, expiresIn = 600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("trade-application-docs")
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// Append an audit-trail event under the current admin's identity.
export async function logApplicationEvent(
  applicationId: string,
  eventType: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("trade_application_events").insert([{
    application_id: applicationId,
    event_type: eventType,
    actor_user_id: user.id,
    actor_email: user.email ?? null,
    detail: detail as never,
  }]);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Missing-information requests
//
// Generic across every evidence type: each requestable item knows how to test
// whether it is present on an application, so new document groups only need a
// row adding here — no per-field UI or email work.
// ---------------------------------------------------------------------------

export interface RequestableItem {
  id: string;
  /** Short label for the admin screen. */
  label: string;
  /** Precise wording sent to the applicant. */
  emailLabel: string;
  /** Only offered when true (e.g. references are time-served only). */
  applies: boolean;
  missing: boolean;
}

const docCount = (
  docPaths: Record<string, DocMeta[]> | null | undefined,
  fields: string[],
): number => fields.reduce((n, f) => n + (docPaths?.[f]?.length ?? 0), 0);

export function detectRequestableItems(
  app: Pick<TradeApplication, "document_paths" | "qualification_path" | "trade_category_id">,
  referenceCount: number,
): RequestableItem[] {
  const d = app.document_paths;
  return [
    {
      id: "photo_id",
      label: "Photo ID",
      emailLabel: "Photo ID — a clear photo or scan of your passport or driving licence",
      applies: true,
      missing: !hasPhotoId(d),
    },
    {
      id: "insurance_certificate",
      label: "Insurance certificate",
      emailLabel: "Your current public liability insurance certificate, showing cover level and expiry date",
      applies: true,
      missing: docCount(d, ["insurance_certificate"]) === 0,
    },
    {
      id: "qualifications",
      label: "Qualifications / scheme card",
      emailLabel: "Your qualification certificate or trade scheme registration card",
      applies: true,
      missing: docCount(d, ["qual_card_doc", "qual_cert_doc"]) === 0,
    },
    {
      id: "portfolio_photos",
      label: "Portfolio photos",
      emailLabel: "Photos of recent completed work (at least three, showing finished jobs)",
      applies: true,
      missing: docCount(d, ["portfolio_photos"]) === 0,
    },
    {
      id: "references",
      label: "Trade references",
      emailLabel: "Two trade references — name, relationship to you, phone number and email for each",
      applies: tradeRequiresReferences(app.trade_category_id),
      missing: referenceCount < 2,
    },
  ].filter((i) => i.applies);
}
