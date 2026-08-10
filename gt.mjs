import { createClient } from "@supabase/supabase-js";
const s = createClient("https://xryinqaxjclcmhebdcex.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);
const cat = process.argv[2];
for (const label of ["weak","medium","strong"]) {
  const { data } = await s.from("quote_check_consistency_tests").select("extraction_json,tested_at").eq("category",cat).eq("test_quote_label",label).order("tested_at",{ascending:false}).limit(1);
  if (!data?.length) { console.log(label, "NO DATA"); continue; }
  const flat={};
  for (const [c,f] of Object.entries(data[0].extraction_json||{})) for (const [k,v] of Object.entries(f||{})) flat[`${c}.${k}`]=v?.status;
  console.log("### "+label, data[0].tested_at, Object.keys(flat).length);
  console.log(JSON.stringify(flat,null,0));
}
