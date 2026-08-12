import { createClient } from "@supabase/supabase-js";
const s = createClient("https://xryinqaxjclcmhebdcex.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const label of ["weak","medium","strong"]) {
  const { data } = await s.from("quote_check_consistency_tests").select("extraction_json,tested_at").eq("category","windows_doors").eq("test_quote_label",label).order("tested_at",{ascending:false}).limit(1);
  const f={};for(const[c,fs]of Object.entries(data[0].extraction_json||{}))for(const[k,v]of Object.entries(fs||{}))f[`${c}.${k}`]=v?.status;
  console.log("=== "+label);
  for (const [k,v] of Object.entries(f)) console.log(" ",k,"=>",v);
}
