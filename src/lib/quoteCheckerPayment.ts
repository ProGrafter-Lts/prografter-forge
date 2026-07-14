// Shared payment-gate helper for the modular Quote Checker.
// Each module's intake page uploads its quote + supporting docs, then hands
// off to Stripe Checkout via `create-module-quote-checkout`. After payment,
// `/quote-checker/success` runs the appropriate analyse-* function.

import { supabase } from "@/integrations/supabase/client";

export type ModuleId =
  | "extension_building"
  | "boiler_heating"
  | "electrical_rewire"
  | "bathroom"
  | "roofing"
  | "kitchen"
  | "windows_doors"
  | "landscaping_driveway"
  | "plastering_rendering";

export type PriceBand = "single_trade" | "standard_trade" | "extension";

export const MODULE_PRICE_BAND: Record<ModuleId, PriceBand> = {
  boiler_heating: "single_trade",
  windows_doors: "single_trade",
  plastering_rendering: "single_trade",
  electrical_rewire: "standard_trade",
  bathroom: "standard_trade",
  kitchen: "standard_trade",
  roofing: "standard_trade",
  landscaping_driveway: "standard_trade",
  extension_building: "extension",
};

export const PRICE_BAND_AMOUNT: Record<PriceBand, number> = {
  single_trade: 1900,
  standard_trade: 3900,
  extension: 5900,
};

export const PRICE_BAND_DISPLAY: Record<PriceBand, string> = {
  single_trade: "£19",
  standard_trade: "£39",
  extension: "£59",
};

export const MODULE_ANALYSE_FN: Record<ModuleId, string> = {
  extension_building: "analyse-simple-quote",
  boiler_heating: "analyse-boiler-quote",
  electrical_rewire: "analyse-electrical-quote",
  bathroom: "analyse-bathroom-quote",
  roofing: "analyse-roofing-quote",
  kitchen: "analyse-kitchen-quote",
  windows_doors: "analyse-windows-doors-quote",
  landscaping_driveway: "analyse-landscaping-quote",
  plastering_rendering: "analyse-plastering-quote",
};

export const MODULE_REPORT_PATH: Record<ModuleId, string> = {
  extension_building: "/simple-quote-report",
  boiler_heating: "/boiler-quote-report",
  electrical_rewire: "/electrical-quote-report",
  bathroom: "/bathroom-quote-report",
  roofing: "/roofing-quote-report",
  kitchen: "/kitchen-quote-report",
  windows_doors: "/windows-doors-quote-report",
  landscaping_driveway: "/landscaping-quote-report",
  plastering_rendering: "/plastering-quote-report",
};

export function moduleDisplayPrice(moduleId: string): string | null {
  const band = MODULE_PRICE_BAND[moduleId as ModuleId];
  return band ? PRICE_BAND_DISPLAY[band] : null;
}

export interface StartPaymentArgs {
  moduleId: ModuleId;
  email: string;
  projectType: string;
  intake: Record<string, unknown>;
  file: File;
  supportingFiles?: File[];
  filePrefix?: string;
}

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/**
 * Uploads the quote & supporting docs to Storage, creates a Stripe Checkout
 * Session for the module's price band, and redirects the browser to Stripe.
 * The caller stays on their intake page until Stripe navigates away.
 */
export async function startModuleQuotePayment(args: StartPaymentArgs): Promise<void> {
  const { moduleId, email, projectType, intake, file, supportingFiles = [], filePrefix = moduleId } = args;

  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Please upload a PDF, JPG, PNG or screenshot for the main quote.");
  }

  // 1. Upload main quote
  const pdfPath = `${filePrefix}-${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage
    .from("quote-pdfs")
    .upload(pdfPath, file, { contentType: file.type || "application/octet-stream" });
  if (upErr) throw upErr;

  // 2. Upload supporting docs (best-effort)
  const uploadedSupporting: { path: string; name: string }[] = [];
  for (const sf of supportingFiles.slice(0, 10)) {
    if (!ACCEPTED_TYPES.includes(sf.type)) continue;
    const spName = `${filePrefix}-${Date.now()}-support-${Math.random().toString(36).slice(2, 8)}-${sf.name}`;
    const { error: spErr } = await supabase.storage
      .from("quote-pdfs")
      .upload(spName, sf, { contentType: sf.type || "application/octet-stream" });
    if (spErr) { console.warn("supporting upload failed", sf.name, spErr); continue; }
    uploadedSupporting.push({ path: spName, name: sf.name });
  }

  // 3. Current user (guests allowed)
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Create Stripe checkout session via edge function
  const { data, error } = await supabase.functions.invoke("create-module-quote-checkout", {
    body: {
      moduleId,
      email,
      projectType,
      intake,
      pdfPath,
      supportingFiles: uploadedSupporting,
      userId: user?.id ?? null,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Payment session could not be created.");

  window.location.href = data.url;
}
