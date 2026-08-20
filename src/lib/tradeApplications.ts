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
  approved: "#16A34A",
  rejected: "#DC2626",
  held: "#6B7280",
};

export const QUAL_LABEL: Record<string, string> = {
  regulated: "Regulated",
  qualified: "Qualified",
  "time-served": "Time-served",
  time_served: "Time-served",
};

// The five published verification checks
export const VERIFICATION_CHECKS = [
  { id: "identity", label: "Identity & photo ID confirmed" },
  { id: "qualifications", label: "Qualifications / scheme registration verified" },
  { id: "insurance", label: "Insurance certificate reviewed & valid" },
  { id: "references", label: "References checked" },
  { id: "portfolio", label: "Portfolio of work reviewed" },
] as const;

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
