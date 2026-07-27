// Ingests live UK planning applications for Nottinghamshire councils via PlanIt
// (planit.org.uk — free, no key) into public.planning_leads.
//
// Admin-triggered from /admin/planning-pipeline. Dedupes on (application_ref, council_name).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 8 Nottinghamshire local planning authorities
const NOTTS_COUNCILS = [
  "Nottingham",
  "Ashfield",
  "Bassetlaw",
  "Broxtowe",
  "Gedling",
  "Mansfield",
  "Newark and Sherwood",
  "Rushcliffe",
];

interface PlanItRecord {
  uid?: string;
  reference?: string;
  name?: string;
  address?: string;
  postcode?: string;
  app_type?: string;
  app_state?: string;
  description?: string;
  start_date?: string;
  decided_date?: string;
  url?: string;
  link?: string;
  area_name?: string;
  other_fields?: {
    applicant_name?: string;
    applicant_address?: string;
    agent_name?: string;
    agent_company?: string;
    agent_address?: string;
    case_officer?: string;
    [k: string]: unknown;
  };
}

// Allow only substantive domestic / small-build applications
const ALLOWED = [
  /\bsingle[\s-]?stor(?:e?y|ied)\b.*\bextension\b/,
  /\bextension\b.*\bsingle[\s-]?stor(?:e?y|ied)\b/,
  /\b(?:two|2|double)[\s-]?stor(?:e?y|ied)\b.*\bextension\b/,
  /\bextension\b.*\b(?:two|2|double)[\s-]?stor(?:e?y|ied)\b/,
  /\bfirst[\s-]?floor\b.*\bextension\b/,
  /\bloft\s+conversion\b/,
  /\bdormer\b/,
  /\bhip[\s-]?to[\s-]?gable\b/,
  /\bgarage\s+conversion\b/,
  /\bconversion\s+of\s+(?:existing\s+)?garage\b/,
  /\b(?:detached|new)\s+garage\b/,
  /\berection\s+of\s+(?:a\s+)?(?:detached\s+)?garage\b/,
  /\bdetached\s+outbuilding\b/,
  /\boutbuilding\b/,
  /\bannex(?:e)?\b/,
  /\bnew\s+dwelling/,
  /\bconversion\s+of\b.*\b(?:barn|agricultural)/,
  /\bextension\b/,
];

const EXCLUDE = [
  /\bnon[\s-]?material\s+amendment\b/,
  /\bdischarge\s+of\s+condition/,
  /\btree\s+(?:works|preservation|surgery)\b/,
  /\btpo\b/,
  /\badvertisement\b/,
  /\btelecom(?:munication)?s?\b/,
];

function isRelevant(rec: PlanItRecord): boolean {
  const desc = `${rec.description ?? ""} ${rec.app_type ?? ""}`.toLowerCase();
  if (!desc.trim()) return false;
  if (EXCLUDE.some((re) => re.test(desc))) return false;
  return ALLOWED.some((re) => re.test(desc));
}

// Estimate value from description keywords
function estimateValue(desc: string): { min: number; max: number } {
  const d = desc.toLowerCase();
  if (/two[\s-]?storey|double[\s-]?storey|new\s+dwelling/.test(d)) return { min: 60000, max: 120000 };
  if (/loft\s+conversion|first[\s-]?floor/.test(d)) return { min: 35000, max: 65000 };
  if (/single[\s-]?storey.*extension|rear\s+extension/.test(d)) return { min: 25000, max: 55000 };
  if (/garage\s+conversion/.test(d)) return { min: 12000, max: 25000 };
  if (/(detached|new)\s+garage|outbuilding|annex/.test(d)) return { min: 15000, max: 40000 };
  return { min: 10000, max: 30000 };
}

// Infer likely trades from description
function inferTrades(desc: string): string[] {
  const d = desc.toLowerCase();
  const trades = new Set<string>();
  if (/extension|new\s+dwelling|conversion|outbuilding|annex|garage|dormer/.test(d)) {
    trades.add("Builder");
    trades.add("Bricklayer");
    trades.add("Roofer");
    trades.add("Plasterer");
  }
  if (/loft|dormer|first[\s-]?floor/.test(d)) {
    trades.add("Carpenter");
    trades.add("Structural engineer");
  }
  if (/extension|new\s+dwelling|conversion/.test(d)) {
    trades.add("Electrician");
    trades.add("Plumber");
    trades.add("Heating engineer");
  }
  if (/kitchen/.test(d)) trades.add("Kitchen fitter");
  if (/bathroom|wet[\s-]?room/.test(d)) trades.add("Bathroom fitter");
  return [...trades];
}

// 0-100 priority score
function scoreLead(rec: PlanItRecord, valueMax: number): number {
  let score = 30;
  // Value factor (40%)
  score += Math.min(40, Math.round((valueMax / 120000) * 40));
  // Recency (30%)
  const dateStr = rec.start_date || rec.decided_date;
  if (dateStr) {
    const days = (Date.now() - new Date(dateStr).getTime()) / 86400000;
    if (days <= 7) score += 30;
    else if (days <= 14) score += 22;
    else if (days <= 30) score += 12;
  }
  return Math.min(100, Math.max(0, score));
}

function mapStatus(appState?: string): string {
  const s = (appState ?? "").toLowerCase();
  if (s.includes("permitted") || s.includes("approved") || s.includes("granted")) return "approved";
  if (s.includes("undecided") || s.includes("pending")) return "pending_decision";
  return "submitted";
}

async function fetchPlanItForAuthority(authority: string, recent: number): Promise<PlanItRecord[]> {
  const url =
    `https://www.planit.org.uk/api/applics/json` +
    `?auth=${encodeURIComponent(authority)}&recent=${recent}&pg_sz=400`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ProGrafter-PlanningPipeline/1.0" } });
    if (!res.ok) {
      console.error(`[PLANIT] ${authority} HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    return (json?.records ?? []) as PlanItRecord[];
  } catch (e) {
    console.error(`[PLANIT] ${authority} fetch failed:`, e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const recentDays = Math.min(365, Math.max(7, parseInt(url.searchParams.get("days") ?? "60", 10)));

    // Run ingestion in parallel across councils to avoid the 150s idle timeout.
    const run = async () => {
      const perCouncil: Record<string, { fetched: number; relevant: number; inserted: number }> = {};
      let totalFetched = 0, totalRelevant = 0, totalInserted = 0;

      const results = await Promise.all(
        NOTTS_COUNCILS.map(async (council) => {
          const records = await fetchPlanItForAuthority(council, recentDays);
          const relevant = records.filter(isRelevant);

          const refs = relevant.map((r) => r.uid ?? r.reference ?? "").filter(Boolean);
          const existingSet = new Set<string>();
          if (refs.length) {
            const { data: existing } = await supabase
              .from("planning_leads")
              .select("application_ref")
              .eq("council_name", council)
              .in("application_ref", refs);
            for (const e of existing ?? []) existingSet.add(e.application_ref);
          }

          const rows = relevant
            .filter((r) => {
              const ref = r.uid ?? r.reference;
              return ref && !existingSet.has(ref);
            })
            .map((r) => {
              const desc = r.description ?? "";
              const value = estimateValue(desc);
              const score = scoreLead(r, value.max);
              const of = r.other_fields ?? {};
              return {
                application_ref: r.uid ?? r.reference!,
                council_name: council,
                site_address: r.address ?? r.name ?? "Address not provided",
                postcode: r.postcode ?? null,
                application_type: r.app_type ?? "Planning Application",
                status: mapStatus(r.app_state),
                description: desc,
                submitted_date: r.start_date ?? null,
                applicant_name: of.applicant_name ?? null,
                applicant_address: of.applicant_address ?? null,
                trades_likely: inferTrades(desc),
                estimated_value_min: value.min,
                estimated_value_max: value.max,
                priority_score: score,
                pipeline_status: "new",
                documents_available: !!(r.url ?? r.link),
                council_application_url: r.url ?? r.link ?? null,
                notes: of.agent_name
                  ? `Agent: ${of.agent_name}${of.agent_company ? ` (${of.agent_company})` : ""}${of.agent_address ? ` — ${of.agent_address}` : ""}`
                  : "",
                next_action: "",
              };
            });

          let inserted = 0;
          // Insert in chunks to avoid large single payloads
          for (let i = 0; i < rows.length; i += 100) {
            const chunk = rows.slice(i, i + 100);
            const { error } = await supabase.from("planning_leads").insert(chunk);
            if (error) console.error(`[INSERT] ${council} failed:`, error.message);
            else inserted += chunk.length;
          }
          return { council, fetched: records.length, relevant: relevant.length, inserted };
        }),
      );

      for (const r of results) {
        perCouncil[r.council] = { fetched: r.fetched, relevant: r.relevant, inserted: r.inserted };
        totalFetched += r.fetched;
        totalRelevant += r.relevant;
        totalInserted += r.inserted;
      }
      console.log("[INGEST-PLANNING] complete", { totalFetched, totalRelevant, totalInserted, perCouncil });
    };

    // Fire-and-forget so we respond before the 150s idle timeout.
    // @ts-expect-error EdgeRuntime is provided by Supabase edge runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-expect-error see above
      EdgeRuntime.waitUntil(run());
    } else {
      run().catch((e) => console.error("[INGEST-PLANNING] bg error:", e));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        started: true,
        message: "Ingestion running in background. Refresh the leads list in ~30–60s.",
        lookback_days: recentDays,
        councils: NOTTS_COUNCILS.length,
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[INGEST-PLANNING] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

