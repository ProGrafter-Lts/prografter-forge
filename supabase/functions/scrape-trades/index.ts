// Scrapes tradesman contact info via Google Places API (Text Search + Place Details)
// and inserts into public.scraped_trades. Admin only.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceTextResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
}

interface PlaceDetails {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
}

function extractAddressBits(components?: PlaceDetails["address_components"]) {
  let postcode: string | null = null;
  let city: string | null = null;
  for (const c of components ?? []) {
    if (c.types.includes("postal_code")) postcode = c.long_name;
    if (c.types.includes("postal_town") || c.types.includes("locality")) city = c.long_name;
  }
  return { postcode, city };
}

async function textSearch(query: string, apiKey: string): Promise<PlaceTextResult[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Places Text Search HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new Error(`Places error: ${json.status} ${json.error_message ?? ""}`);
  }
  return (json.results ?? []) as PlaceTextResult[];
}

async function placeDetails(placeId: string, apiKey: string): Promise<PlaceDetails | null> {
  const fields = [
    "name", "formatted_address", "formatted_phone_number",
    "international_phone_number", "website", "rating",
    "user_ratings_total", "address_components",
  ].join(",");
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  if (json.status !== "OK") return null;
  return json.result as PlaceDetails;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Admin gate
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
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

    const body = await req.json().catch(() => ({}));
    const tradeType = String(body.trade_type ?? "").trim();
    const location = String(body.location ?? "Nottinghamshire").trim();
    const limit = Math.min(20, Math.max(1, parseInt(body.limit ?? "10", 10)));
    if (!tradeType) {
      return new Response(JSON.stringify({ error: "trade_type required (e.g. 'electricians')" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const query = `${tradeType} in ${location}`;
    const results = await textSearch(query, apiKey);
    const sliced = results.slice(0, limit);

    const inserted: any[] = [];
    const skipped: any[] = [];

    for (const r of sliced) {
      const details = await placeDetails(r.place_id, apiKey);
      if (!details) continue;
      const { postcode, city } = extractAddressBits(details.address_components);
      const row = {
        trade_name: details.name ?? r.name,
        trade_type: tradeType,
        phone: details.formatted_phone_number ?? details.international_phone_number ?? null,
        email: null, // Google Places does NOT return email — must be enriched separately
        website: details.website ?? null,
        has_website: !!details.website,
        address: details.formatted_address ?? r.formatted_address ?? null,
        postcode,
        city,
        rating: details.rating ?? null,
        reviews_count: details.user_ratings_total ?? null,
        source: "google_places",
        source_id: r.place_id,
        search_query: query,
      };

      const { data, error } = await supabase
        .from("scraped_trades")
        .upsert(row, { onConflict: "source,source_id" })
        .select("id, trade_name")
        .single();
      if (error) {
        skipped.push({ name: row.trade_name, reason: error.message });
      } else {
        inserted.push(data);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        query,
        found: results.length,
        processed: sliced.length,
        upserted: inserted.length,
        skipped,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[SCRAPE-TRADES] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
