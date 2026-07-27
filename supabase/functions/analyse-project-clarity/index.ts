// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type PIRecord = {
  id: string;
  project_type?: string | null;
  address?: any;
  property_type?: string | null;
  property_age?: string | null;
  current_stage?: string | null;
  description?: string | null;
  budget_band?: string | null;
  documents?: Array<{ kind: string; name: string }> | null;
};

const STAGE_SCORE: Record<string, number> = {
  ideas: 5,
  budgeting: 12,
  drawings: 20,
  planning_submitted: 24,
  planning_approved: 28,
  ready_for_quotes: 30,
  already_have_quotes: 30,
};

const BAND_RANGES: Record<string, string> = {
  under_25k: "under £25,000",
  "25_50k": "£25,000 – £50,000",
  "50_100k": "£50,000 – £100,000",
  over_100k: "£100,000+",
  not_sure: "not yet defined",
};

const TYPICAL: Record<string, [number, number]> = {
  rear_extension: [45000, 90000],
  side_extension: [40000, 80000],
  double_storey_extension: [80000, 160000],
  loft_conversion: [40000, 75000],
  garage_conversion: [15000, 30000],
  renovation: [25000, 120000],
  new_build: [200000, 500000],
  landscaping: [8000, 40000],
  kitchen: [12000, 35000],
  bathroom: [6000, 18000],
  other: [10000, 60000],
};

function scoreRecord(r: PIRecord) {
  let score = 0;
  const reasons: string[] = [];

  if (r.project_type) { score += 10; reasons.push("Project type defined"); }
  if (r.address && (r.address.line1 || r.address.postcode)) { score += 8; reasons.push("Property location captured"); }
  if (r.property_type) score += 4;
  if (r.property_age) score += 4;

  const stagePts = r.current_stage ? (STAGE_SCORE[r.current_stage] ?? 5) : 0;
  score += stagePts;
  if (stagePts >= 20) reasons.push("Design stage well advanced");

  const docs = r.documents ?? [];
  const hasDrawings = docs.some((d) => d.kind === "drawings");
  const hasStructural = docs.some((d) => d.kind === "structural");
  const hasQuotes = docs.some((d) => d.kind === "quotes");
  if (hasDrawings) { score += 10; reasons.push("Drawings uploaded"); }
  if (hasStructural) { score += 8; reasons.push("Structural information provided"); }
  if (hasQuotes) { score += 5; reasons.push("Existing quotations shared"); }
  if (docs.length > 0 && !hasDrawings && !hasStructural && !hasQuotes) score += 3;

  const desc = (r.description ?? "").trim();
  if (desc.length > 40) score += 5;
  if (desc.length > 200) score += 5;

  if (r.budget_band && r.budget_band !== "not_sure") { score += 6; reasons.push("Budget expectation set"); }

  score = Math.min(100, Math.max(0, score));
  return { score, reasons };
}

function readinessLabel(score: number) {
  if (score >= 80) return { label: "Quote-ready", tone: "teal" };
  if (score >= 60) return { label: "Nearly ready", tone: "teal" };
  if (score >= 40) return { label: "Taking shape", tone: "amber" };
  return { label: "Early stage", tone: "amber" };
}

function budgetGuidance(r: PIRecord) {
  if (!r.project_type) return { headline: "Add a project type to benchmark your budget.", detail: "" };
  const range = TYPICAL[r.project_type] ?? TYPICAL.other;
  const band = r.budget_band ? BAND_RANGES[r.budget_band] : null;
  const typical = `£${(range[0] / 1000).toFixed(0)}k – £${(range[1] / 1000).toFixed(0)}k`;
  if (!band || r.budget_band === "not_sure") {
    return {
      headline: `Typical range: ${typical}`,
      detail: "Set a target budget so we can flag risk of under-scoping or over-spend.",
    };
  }
  return {
    headline: `Your budget is ${band}. Typical range for this work: ${typical}.`,
    detail: "Actual cost depends on specification, site access and location — the AI Quote Checker will benchmark a real quote against this range.",
  };
}

function nextAction(r: PIRecord, score: number) {
  const docs = r.documents ?? [];
  if (!r.project_type || !r.current_stage) return { title: "Complete your project profile", detail: "A few more details unlock accurate guidance." };
  if (score < 40) return { title: "Firm up your scope", detail: "Sketch what you want and roughly where — you don't need drawings yet." };
  if (!docs.some((d) => d.kind === "drawings") && ["drawings", "planning_submitted", "planning_approved", "ready_for_quotes"].includes(r.current_stage)) {
    return { title: "Upload your drawings", detail: "Trades quote much more accurately with a plan in front of them." };
  }
  if (r.current_stage === "already_have_quotes") {
    return { title: "Run the AI Quote Checker", detail: "Get a plain-English breakdown of what your quote covers and what it misses." };
  }
  if (score >= 70) return { title: "Ready to invite trades", detail: "Post your project and we'll match you to verified trades." };
  return { title: "Add drawings or a written scope", detail: "This is the single biggest lever on quote accuracy." };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { record_id } = await req.json();
    if (!record_id) throw new Error("record_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: record, error } = await supabase
      .from("project_intelligence_records")
      .select("*")
      .eq("id", record_id)
      .maybeSingle();
    if (error) throw error;
    if (!record) throw new Error("Record not found");

    const { score, reasons } = scoreRecord(record as PIRecord);
    const readiness = readinessLabel(score);
    const budget = budgetGuidance(record as PIRecord);
    const action = nextAction(record as PIRecord, score);

    const analysis = {
      readiness: { score, label: readiness.label, tone: readiness.tone, reasons },
      budget,
      status: {
        stage_label: (record.current_stage ?? "").replaceAll("_", " ") || "Not set",
        summary: score >= 60
          ? "You have enough clarity to start conversations with trades."
          : "A few more inputs will make trade conversations much sharper.",
      },
      next_action: action,
      generated_at: new Date().toISOString(),
    };

    await supabase
      .from("project_intelligence_records")
      .update({ analysis, status: "complete" })
      .eq("id", record_id);

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
