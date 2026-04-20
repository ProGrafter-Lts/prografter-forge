// Fetches live UK planning applications from PlanIt (planit.org.uk) for every
// active planning_alert_subs row and inserts deduped matches into planning_alerts.
//
// Data sources (both free, no API key):
//   - postcodes.io  -> geocode trade postcode to lat/lng
//   - planit.org.uk -> recent planning applications near a lat/lng

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Sub {
  id: string;
  trade_id: string;
  tier: string;
  radius_miles: number;
  trades: {
    id: string;
    name: string;
    postcode: string;
    trade_type: string;
  } | null;
}

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
  area_name?: string;
  location?: { lat?: number; lng?: number } | null;
  lat?: number;
  lng?: number;
  distance?: number; // some payloads include km distance
}

const MILES_PER_KM = 0.621371;

// Haversine distance in miles
function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function geocodePostcode(
  postcode: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const r = json?.result;
    if (!r?.latitude || !r?.longitude) return null;
    return { lat: r.latitude, lng: r.longitude };
  } catch (e) {
    console.error("[GEOCODE] failed for", postcode, e);
    return null;
  }
}

async function fetchPlanItApplications(
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<PlanItRecord[]> {
  // PlanIt areasearch — open API, lat/lng + krad (km radius), recent apps.
  // See https://www.planit.org.uk/api/
  const krad = Math.min(50, Math.max(1, radiusMiles / MILES_PER_KM));
  const url =
    `https://www.planit.org.uk/api/applics/json?lat=${lat}&lng=${lng}` +
    `&krad=${krad.toFixed(2)}&recent=14&pg_sz=100`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ProGrafter-PlanningAlerts/1.0" },
    });
    if (!res.ok) {
      console.error("[PLANIT] HTTP", res.status, await res.text());
      return [];
    }
    const json = await res.json();
    return (json?.records ?? []) as PlanItRecord[];
  } catch (e) {
    console.error("[PLANIT] fetch failed", e);
    return [];
  }
}

// Filter applications by trade type relevance. Keep it loose — we'd rather show
// a few extra than miss good leads. Returns true if the application looks
// relevant to the given trade_type.
function isRelevant(record: PlanItRecord, tradeType: string): boolean {
  const desc = `${record.description ?? ""} ${record.app_type ?? ""}`.toLowerCase();
  if (!desc.trim()) return true; // no text -> don't filter out
  const t = tradeType.toLowerCase();

  const keywordMap: Record<string, string[]> = {
    extension: ["extension", "rear extension", "side extension", "single storey", "two storey"],
    "loft conversion": ["loft", "dormer", "roof conversion"],
    roofing: ["roof", "re-roof", "tiling"],
    "solar pv": ["solar", "photovoltaic", "pv panel"],
    "heat pump": ["heat pump", "ashp", "gshp", "renewable heating"],
    ewi: ["external wall insulation", "ewi", "render", "cladding"],
    cwi: ["cavity wall", "cavity insulation"],
    "ev charger": ["ev charge", "electric vehicle", "charge point"],
    windows: ["window", "glazing", "fenestration"],
    kitchen: ["kitchen"],
    bathroom: ["bathroom", "wet room", "en-suite"],
    landscaping: ["landscap", "garden", "patio", "driveway"],
    driveway: ["driveway", "dropped kerb", "hardstanding"],
    plastering: ["internal alteration"],
    electrical: ["rewire", "consumer unit"],
    plumbing: ["plumb", "boiler"],
    builder: [
      "extension", "loft", "conversion", "alteration", "outbuilding",
      "garage", "annex", "rebuild",
    ],
  };

  for (const [key, kws] of Object.entries(keywordMap)) {
    if (t.includes(key)) {
      return kws.some((kw) => desc.includes(kw));
    }
  }
  // Unknown trade type -> don't filter
  return true;
}

async function processSub(
  supabase: ReturnType<typeof createClient>,
  sub: Sub,
): Promise<{ inserted: number; reason?: string }> {
  if (!sub.trades?.postcode) {
    return { inserted: 0, reason: "no postcode on trade" };
  }
  const geo = await geocodePostcode(sub.trades.postcode);
  if (!geo) return { inserted: 0, reason: "geocode failed" };

  const records = await fetchPlanItApplications(
    geo.lat,
    geo.lng,
    sub.radius_miles,
  );
  if (!records.length) return { inserted: 0, reason: "no records returned" };

  // Existing refs for this trade — dedupe before inserting
  const refs = records.map((r) => r.uid ?? r.reference ?? "").filter(Boolean);
  const { data: existing } = await supabase
    .from("planning_alerts")
    .select("application_ref")
    .eq("trade_id", sub.trade_id)
    .in("application_ref", refs);
  const existingSet = new Set(
    (existing ?? []).map((e: any) => e.application_ref),
  );

  const tradeType = sub.trades.trade_type ?? "";
  const rows = records
    .filter((r) => {
      const ref = r.uid ?? r.reference;
      if (!ref || existingSet.has(ref)) return false;
      return isRelevant(r, tradeType);
    })
    .map((r) => {
      const recLat = r.location?.lat ?? r.lat;
      const recLng = r.location?.lng ?? r.lng;
      const dist =
        recLat != null && recLng != null
          ? distanceMiles(geo.lat, geo.lng, recLat, recLng)
          : r.distance != null
          ? r.distance * MILES_PER_KM
          : null;
      return {
        trade_id: sub.trade_id,
        application_ref: r.uid ?? r.reference!,
        address: r.address ?? r.name ?? "Address not provided",
        postcode: r.postcode ?? "",
        application_type: r.app_type ?? "Planning Application",
        description: r.description ?? null,
        distance_miles: dist != null ? Number(dist.toFixed(2)) : null,
        approved_date: r.decided_date ?? r.start_date ?? null,
        local_authority: r.area_name ?? null,
        planning_portal_url: r.url ?? null,
      };
    });

  if (!rows.length) return { inserted: 0, reason: "all duplicates or filtered" };

  const { error } = await supabase.from("planning_alerts").insert(rows);
  if (error) {
    console.error("[INSERT] failed for trade", sub.trade_id, error);
    return { inserted: 0, reason: error.message };
  }
  return { inserted: rows.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Optional: ?trade_id=<uuid> to refresh just one trade (used by manual button)
    const url = new URL(req.url);
    const onlyTradeId = url.searchParams.get("trade_id");

    let query = supabase
      .from("planning_alert_subs")
      .select("id, trade_id, tier, radius_miles, trades(id, name, postcode, trade_type)")
      .eq("active", true);
    if (onlyTradeId) query = query.eq("trade_id", onlyTradeId);

    const { data: subs, error: subErr } = await query;
    if (subErr) throw subErr;

    console.log(
      `[PLANNING-ALERTS] Processing ${subs?.length ?? 0} subscription(s)` +
        (onlyTradeId ? ` (trade ${onlyTradeId})` : ""),
    );

    const results: Record<string, { inserted: number; reason?: string }> = {};
    let totalInserted = 0;

    for (const sub of (subs ?? []) as Sub[]) {
      const r = await processSub(supabase, sub);
      results[sub.trade_id] = r;
      totalInserted += r.inserted;
      console.log(
        `[PLANNING-ALERTS] trade=${sub.trade_id} inserted=${r.inserted}` +
          (r.reason ? ` reason="${r.reason}"` : ""),
      );
    }

    return new Response(
      JSON.stringify({
        processed: subs?.length ?? 0,
        inserted: totalInserted,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("[PLANNING-ALERTS] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
