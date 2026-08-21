import { supabase } from "@/integrations/supabase/client";
import type { MaterialLine } from "@/components/trade/MaterialsBreakdown";

export const QUICKBUILD_HANDOFF_KEY = "prografter:quickbuild:handoff";
export const QUICKBUILD_PREFILL_MARKER = "— Drafted with QuickBuild AI; reviewed and confirmed by the trade.";

export interface QuickBuildLineItem {
  category?: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  labour_or_materials?: "labour" | "materials";
}

export interface QuickBuildOutput {
  line_items: QuickBuildLineItem[];
  methodology?: string;
  timeline_days?: number;
  risk_flags?: string[];
  variation_buffer_recommended_pence?: number;
  notes_to_trade?: string;
}

export interface QuickBuildPrefill {
  generationId: string | null;
  amount: string;
  message: string;
  duration: string;
  assumptions: string;
  materials: MaterialLine[];
}

const UNITS = ["each", "m", "m2", "kg", "l", "hours"] as const;
const normUnit = (u?: string): MaterialLine["unit"] => {
  const v = (u || "").toLowerCase().trim();
  if ((UNITS as readonly string[]).includes(v)) return v as MaterialLine["unit"];
  if (v === "m²" || v === "sqm" || v === "sq m") return "m2";
  if (v === "hr" || v === "hrs" || v === "hour") return "hours";
  if (v === "item" || v === "no" || v === "nr" || v === "unit") return "each";
  return "each";
};

const CATS = ["electrical", "plumbing", "timber", "fixings", "paint", "glass", "insulation", "other"];
const normCat = (c?: string): MaterialLine["category"] => {
  const v = (c || "").toLowerCase().trim();
  return (CATS.includes(v) ? v : "") as MaterialLine["category"];
};

const emptyLine = (): MaterialLine => ({
  description: "", brand: "", model_or_spec: "", quantity: "", unit: "each",
  unit_price_ex_vat: "", vat_rate_pct: "20", category: "", merchant_hint: "",
});

/** Turn a QuickBuild AI output into QuoteBuilder wizard field values. */
export function buildPrefillFromOutput(out: QuickBuildOutput, generationId: string | null): QuickBuildPrefill {
  const items = Array.isArray(out.line_items) ? out.line_items : [];
  const lineTotal = items.reduce(
    (s, li) => s + (Number(li.quantity) || 0) * (Number(li.estimated_unit_price) || 0), 0,
  );
  const buffer = (Number(out.variation_buffer_recommended_pence) || 0) / 100;
  const total = lineTotal + buffer;

  const scheduleLines = items
    .map((li) => `• ${li.description} (${li.quantity} ${li.unit} @ £${(Number(li.estimated_unit_price) || 0).toFixed(2)})`)
    .join("\n");

  const message = [
    out.methodology?.trim() || "",
    "",
    "SCHEDULE OF WORKS",
    scheduleLines,
    "",
    out.timeline_days ? `Timeline: ${out.timeline_days} working days` : "",
    buffer > 0 ? `Variation buffer included: £${buffer.toFixed(2)}` : "",
    "",
    QUICKBUILD_PREFILL_MARKER,
  ].filter(Boolean).join("\n");

  const materials: MaterialLine[] = items
    .filter((li) => (li.labour_or_materials ?? "materials") === "materials" && li.description?.trim())
    .map((li) => ({
      ...emptyLine(),
      description: li.description.trim(),
      quantity: String(Number(li.quantity) || 1),
      unit: normUnit(li.unit),
      unit_price_ex_vat: String(Number(li.estimated_unit_price) || 0),
      category: normCat(li.category),
    }));

  const flags = (out.risk_flags || []).map((f) => `• ${f.replace(/_/g, " ")}`);
  const assumptions = [
    flags.length ? "From QuickBuild AI draft — risk flags to confirm:" : "",
    ...flags,
    out.notes_to_trade?.trim() ? `\n${out.notes_to_trade.trim()}` : "",
  ].filter(Boolean).join("\n");

  return {
    generationId,
    amount: total > 0 ? String(Math.round(total)) : "",
    message,
    duration: out.timeline_days ? `${out.timeline_days} working days` : "",
    assumptions,
    materials: materials.length ? materials : [],
  };
}

/** Load a QuickBuild generation by id and map it to QuoteBuilder fields. */
export async function loadQuickBuildPrefill(generationId: string): Promise<QuickBuildPrefill | null> {
  const { data, error } = await supabase
    .from("quickbuild_generations")
    .select("id, final_output, ai_output")
    .eq("id", generationId)
    .maybeSingle();
  if (error || !data) return null;
  const out = ((data as any).final_output ?? (data as any).ai_output) as QuickBuildOutput | null;
  if (!out) return null;
  return buildPrefillFromOutput(out, data.id as string);
}

/** Read (and clear) the sessionStorage handoff stashed by QuickBuild. */
export function readQuickBuildHandoff(): { generationId: string | null; final: QuickBuildOutput } | null {
  try {
    const raw = sessionStorage.getItem(QUICKBUILD_HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(QUICKBUILD_HANDOFF_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed?.final) return null;
    return { generationId: parsed.generationId ?? null, final: parsed.final as QuickBuildOutput };
  } catch {
    return null;
  }
}
