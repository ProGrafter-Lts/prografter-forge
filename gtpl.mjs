import { createClient } from "@supabase/supabase-js";
const s = createClient("https://xryinqaxjclcmhebdcex.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);
const N = Number(process.env.N || 5);
for (const label of (process.env.LABELS || "weak,medium,strong").split(",")) {
  const { data } = await s.from("quote_check_consistency_tests")
    .select("extraction_json,tested_at").eq("category", "plastering_rendering")
    .eq("test_quote_label", label).order("tested_at", { ascending: false }).limit(N);
  const runs = data.map((r) => {
    const f = {};
    for (const [c, fs] of Object.entries(r.extraction_json || {})) for (const [k, v] of Object.entries(fs || {})) f[`${c}.${k}`] = v?.status;
    return f;
  });
  const quotes = data.map((r) => {
    const f = {};
    for (const [c, fs] of Object.entries(r.extraction_json || {})) for (const [k, v] of Object.entries(fs || {})) f[`${c}.${k}`] = v?.quote;
    return f;
  });
  console.log("=== " + label);
  for (const k of Object.keys(runs[0] || {})) {
    const vals = runs.map((r) => r[k]);
    const flap = !vals.every((v) => v === vals[0]);
    if (process.env.ONLY_FLAP && !flap) continue;
    console.log(" ", flap ? "FLAP" : "    ", k, "=>", vals.join("|"), flap ? "\n      quotes: " + JSON.stringify(quotes.map((q) => q[k])) : "");
  }
}
