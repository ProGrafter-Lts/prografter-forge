// Fetches live UK planning applications from PlanIt (planit.org.uk) for every
// active planning_alert_subs row and inserts deduped matches into planning_alerts.
//
// PlanIt's lat/lng/krad endpoint currently times out for almost any radius
// ("Timeout (45s) from data source"), so we instead:
//   1. Geocode trade postcode -> lat/lng + home admin_district (postcodes.io)
//   2. Discover all admin_districts within radius_miles by sampling concentric
//      rings of points and reverse-geocoding each (postcodes.io)
//   3. Query PlanIt by `auth=<district>` for each district (fast, ~2s)
//   4. Filter results client-side by exact distance from trade lat/lng
//
// Both data sources are free, no API key.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
  link?: string;
  area_name?: string;
  location?: { coordinates?: [number, number]; lat?: number; lng?: number } | null;
  lat?: number;
  lng?: number;
}

const MILES_PER_KM = 0.621371;
const KM_PER_MILE = 1.60934;

// Haversine distance in miles
function distanceMiles(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface Geo { lat: number; lng: number; district: string | null }

async function geocodePostcode(postcode: string): Promise<Geo | null> {
  try {
    const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const r = json?.result;
    if (!r?.latitude || !r?.longitude) return null;
    return {
      lat: r.latitude,
      lng: r.longitude,
      district: r.admin_district ?? null,
    };
  } catch (e) {
    console.error("[GEOCODE] failed for", postcode, e);
    return null;
  }
}

// Reverse-geocode a single point to its admin_district
async function reverseDistrict(lat: number, lng: number): Promise<string | null> {
  try {
    const url =
      `https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&radius=10000&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.result?.[0]?.admin_district ?? null;
  } catch {
    return null;
  }
}

// Sample concentric rings around (lat0, lng0) and collect unique admin_districts
// covering a circle of radiusMiles.
async function discoverDistricts(
  lat0: number,
  lng0: number,
  radiusMiles: number,
  homeDistrict: string | null,
): Promise<string[]> {
  const districts = new Set<string>();
  if (homeDistrict) districts.add(homeDistrict);

  // Choose ring radii — denser near home, sparser further out.
  const rings: number[] = [];
  const step = Math.max(8, Math.round(radiusMiles / 6));
  for (let r = step; r <= radiusMiles; r += step) rings.push(r);
  if (rings[rings.length - 1] !== radiusMiles) rings.push(radiusMiles);

  const tasks: Promise<string | null>[] = [];
  for (const ringMiles of rings) {
    const nPoints = Math.max(8, Math.min(24, Math.round(ringMiles * 0.8)));
    for (let i = 0; i < nPoints; i++) {
      const angle = (2 * Math.PI * i) / nPoints;
      const dLat = (ringMiles * Math.cos(angle)) / 69;
      const dLng =
        (ringMiles * Math.sin(angle)) /
        (69 * Math.cos((lat0 * Math.PI) / 180));
      tasks.push(reverseDistrict(lat0 + dLat, lng0 + dLng));
    }
  }

  // Run in parallel chunks of 20 to avoid hammering postcodes.io
  const CHUNK = 20;
  for (let i = 0; i < tasks.length; i += CHUNK) {
    const slice = tasks.slice(i, i + CHUNK);
    const results = await Promise.all(slice);
    for (const d of results) if (d) districts.add(d);
  }
  return [...districts];
}

async function fetchPlanItForAuthority(
  authority: string,
  recentDays: number,
): Promise<PlanItRecord[]> {
  const recent = Math.min(730, Math.max(1, Math.floor(recentDays)));
  // No `sort=` — that's what was triggering PlanIt's data-source timeouts.
  const url =
    `https://www.planit.org.uk/api/applics/json` +
    `?auth=${encodeURIComponent(authority)}&recent=${recent}&pg_sz=400`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ProGrafter-PlanningAlerts/1.0" },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[PLANIT] ${authority} HTTP ${res.status}: ${body.slice(0, 200)}`);
      return [];
    }
    const json = await res.json();
    return (json?.records ?? []) as PlanItRecord[];
  } catch (e) {
    console.error(`[PLANIT] ${authority} fetch failed:`, e);
    return [];
  }
}

function recordLatLng(r: PlanItRecord): { lat: number; lng: number } | null {
  // PlanIt usually returns location.coordinates as [lng, lat] (GeoJSON order)
  const coords = r.location?.coordinates;
  if (Array.isArray(coords) && coords.length === 2) {
    return { lng: coords[0], lat: coords[1] };
  }
  if (r.location?.lat != null && r.location?.lng != null) {
    return { lat: r.location.lat, lng: r.location.lng };
  }
  if (r.lat != null && r.lng != null) {
    return { lat: r.lat, lng: r.lng };
  }
  return null;
}

// Strict allowlist — ONLY surface solid structural job types.
// Categories (in order): single-storey ext, double/two-storey ext, first-floor ext,
// loft conversion, garage conversion, detached garage, detached outbuilding,
// annexe, boundary wall, lawful development certificate.
const ALLOWED_PATTERNS: RegExp[] = [
  // Single storey extension (rear/side/front/wrap-around)
  /\bsingle[\s-]?stor(?:e?y|ied)\b.*\bextension\b/,
  /\bextension\b.*\bsingle[\s-]?stor(?:e?y|ied)\b/,
  // Two / double storey extension
  /\b(?:two|2|double)[\s-]?stor(?:e?y|ied)\b.*\bextension\b/,
  /\bextension\b.*\b(?:two|2|double)[\s-]?stor(?:e?y|ied)\b/,
  // First floor extension
  /\bfirst[\s-]?floor\b.*\bextension\b/,
  /\bextension\b.*\bfirst[\s-]?floor\b/,
  // Loft conversion (incl. dormer / hip-to-gable / roof conversion)
  /\bloft\s+conversion\b/,
  /\bdormer\b/,
  /\bhip[\s-]?to[\s-]?gable\b/,
  /\broof\s+conversion\b/,
  // Garage conversion
  /\bgarage\s+conversion\b/,
  /\bconversion\s+of\s+(?:existing\s+)?garage\b/,
  // Detached garage (new build)
  /\b(?:detached|new)\s+garage\b/,
  /\berection\s+of\s+(?:a\s+)?(?:detached\s+)?garage\b/,
  // Detached outbuilding / outbuilding
  /\bdetached\s+outbuilding\b/,
  /\boutbuilding\b/,
  // Annexe / annex / granny annexe
  /\bannex(?:e)?\b/,
  /\bgranny\s+annex(?:e)?\b/,
  // Boundary wall / fence / gates (boundary treatment)
  /\bboundary\s+wall\b/,
  /\bboundary\s+treatment\b/,
  // Lawful Development Certificate
  /\blawful\s+development\s+certificate\b/,
  /\bcertificate\s+of\s+lawful(?:ness)?\b/,
  /\bldc\b/,
];

// Hard exclusions — even if an allowlist pattern matches, drop these.
const EXCLUDE_PATTERNS: RegExp[] = [
  /\bnon[\s-]?material\s+amendment\b/,
  /\bminor[\s-]?material\s+amendment\b/,
  /\bs(?:ection)?\s?73\b/,            // variation of conditions
  /\bvariation\s+of\s+condition/,
  /\bdischarge\s+of\s+condition/,
  /\bapproval\s+of\s+(?:details|conditions?)\b/,
  /\bprior\s+approval\b.*\b(?:telecom|advert)/,
  /\btree\s+(?:works|preservation|surgery)\b/,
  /\btpo\b/,
  /\blisted\s+building\b/,
  /\badvertisement\b/,
  /\btelecom(?:munication)?s?\b/,
];

function isRelevant(record: PlanItRecord, _tradeType: string): boolean {
  const desc =
    `${record.description ?? ""} ${record.app_type ?? ""}`.toLowerCase();
  if (!desc.trim()) return false;
  if (EXCLUDE_PATTERNS.some((re) => re.test(desc))) return false;
  return ALLOWED_PATTERNS.some((re) => re.test(desc));
}

async function processSub(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  sub: Sub,
  recentDays: number,
): Promise<{ inserted: number; reason?: string; districts?: number; fetched?: number }> {
  if (!sub.trades?.postcode) return { inserted: 0, reason: "no postcode on trade" };

  const geo = await geocodePostcode(sub.trades.postcode);
  if (!geo) return { inserted: 0, reason: "geocode failed" };

  const districts = await discoverDistricts(
    geo.lat, geo.lng, sub.radius_miles, geo.district,
  );
  console.log(
    `[PLANNING-ALERTS] trade=${sub.trade_id} postcode=${sub.trades.postcode} ` +
      `home=${geo.district} radius=${sub.radius_miles}mi districts=${districts.length}`,
  );
  if (!districts.length) return { inserted: 0, reason: "no districts discovered" };

  // Fetch PlanIt for each authority in parallel chunks
  const allRecords: PlanItRecord[] = [];
  const CHUNK = 5;
  for (let i = 0; i < districts.length; i += CHUNK) {
    const slice = districts.slice(i, i + CHUNK);
    const batches = await Promise.all(
      slice.map((d) => fetchPlanItForAuthority(d, recentDays)),
    );
    for (const b of batches) allRecords.push(...b);
  }
  console.log(
    `[PLANNING-ALERTS] trade=${sub.trade_id} fetched ${allRecords.length} raw records`,
  );

  if (!allRecords.length) {
    return { inserted: 0, reason: "no records returned", districts: districts.length, fetched: 0 };
  }

  // Filter by exact distance (trade radius)
  const inRadius = allRecords
    .map((r) => {
      const ll = recordLatLng(r);
      const dist = ll
        ? distanceMiles(geo.lat, geo.lng, ll.lat, ll.lng)
        : null;
      return { r, dist };
    })
    .filter(({ dist }) => dist != null && dist <= sub.radius_miles);

  // Existing refs for this trade — dedupe before inserting
  const refs = inRadius
    .map(({ r }) => r.uid ?? r.reference ?? "")
    .filter(Boolean);
  const existingSet = new Set<string>();
  if (refs.length) {
    // chunk IN clauses to keep request size sane
    const CHUNK_REF = 200;
    for (let i = 0; i < refs.length; i += CHUNK_REF) {
      const slice = refs.slice(i, i + CHUNK_REF);
      const { data: existing } = await supabase
        .from("planning_alerts")
        .select("application_ref")
        .eq("trade_id", sub.trade_id)
        .in("application_ref", slice);
      for (const e of (existing ?? []) as { application_ref: string }[]) {
        existingSet.add(e.application_ref);
      }
    }
  }

  const tradeType = sub.trades.trade_type ?? "";
  // Exclude non-substantive application types — trades only want full applications,
  // not condition discharges, amendments, tree works, ads, heritage, telecoms.
  const EXCLUDED_APP_TYPES = new Set([
    "conditions",
    "amendment",
    "amendments",
    "advertising",
    "heritage",
    "telecoms",
    "other",
  ]);
  const rows = inRadius
    .filter(({ r }) => {
      const ref = r.uid ?? r.reference;
      if (!ref || existingSet.has(ref)) return false;
      const appType = (r.app_type ?? "").trim().toLowerCase();
      if (EXCLUDED_APP_TYPES.has(appType)) return false;
      return isRelevant(r, tradeType);
    })
    .map(({ r, dist }) => ({
      trade_id: sub.trade_id,
      application_ref: r.uid ?? r.reference!,
      address: r.address ?? r.name ?? "Address not provided",
      postcode: r.postcode ?? "",
      application_type: r.app_type ?? "Planning Application",
      description: r.description ?? null,
      distance_miles: dist != null ? Number(dist.toFixed(2)) : null,
      approved_date: r.decided_date ?? r.start_date ?? null,
      local_authority: r.area_name ?? null,
      planning_portal_url: r.url ?? r.link ?? null,
    }));

  if (!rows.length) {
    return {
      inserted: 0,
      reason: `0 of ${inRadius.length} in-radius records were new+relevant`,
      districts: districts.length,
      fetched: allRecords.length,
    };
  }

  const { error } = await supabase.from("planning_alerts").insert(rows);
  if (error) {
    console.error("[INSERT] failed for trade", sub.trade_id, error);
    return { inserted: 0, reason: error.message, districts: districts.length, fetched: allRecords.length };
  }
  return { inserted: rows.length, districts: districts.length, fetched: allRecords.length };
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

    const url = new URL(req.url);
    const onlyTradeId = url.searchParams.get("trade_id");
    const daysParam = url.searchParams.get("days");
    const recentDays = daysParam
      ? Math.min(730, Math.max(1, parseInt(daysParam, 10) || 90))
      : 90;

    let query = supabase
      .from("planning_alert_subs")
      .select("id, trade_id, tier, radius_miles, trades(id, name, postcode, trade_type)")
      .eq("active", true);
    if (onlyTradeId) query = query.eq("trade_id", onlyTradeId);

    const { data: subs, error: subErr } = await query;
    if (subErr) throw subErr;

    console.log(
      `[PLANNING-ALERTS] Processing ${subs?.length ?? 0} subscription(s) lookback=${recentDays}d` +
        (onlyTradeId ? ` (trade ${onlyTradeId})` : ""),
    );

    const results: Record<string, { inserted: number; reason?: string; districts?: number; fetched?: number }> = {};
    let totalInserted = 0;

    for (const sub of (subs ?? []) as unknown as Sub[]) {
      const r = await processSub(supabase, sub, recentDays);
      results[sub.trade_id] = r;
      totalInserted += r.inserted;
      console.log(
        `[PLANNING-ALERTS] trade=${sub.trade_id} inserted=${r.inserted}` +
          (r.districts ? ` districts=${r.districts}` : "") +
          (r.fetched != null ? ` fetched=${r.fetched}` : "") +
          (r.reason ? ` reason="${r.reason}"` : ""),
      );
    }

    return new Response(
      JSON.stringify({
        processed: subs?.length ?? 0,
        inserted: totalInserted,
        lookback_days: recentDays,
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
