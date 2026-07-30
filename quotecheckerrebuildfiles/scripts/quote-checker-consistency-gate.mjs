#!/usr/bin/env node
/**
 * Consistency gate for the Pass 0/1/2 Quote Checker rebuild.
 *
 * Runs 3 reference quotes (weak / medium / strong) through the deployed
 * extract-quote function 5 times each, diffs Pass 1's field statuses across
 * the 5 runs, and requires >=95% field-agreement rate per quote before a
 * category is allowed to flip to true in
 * supabase/functions/_shared/quote-checker-v2-flags.ts. See the build spec,
 * section 4, and the rebuild plan.
 *
 * Every run is logged to the quote_check_consistency_tests table — that's
 * the audit trail if the checker's claims are ever challenged.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   WEAK_QUOTE=./fixtures/weak.pdf MEDIUM_QUOTE=./fixtures/medium.pdf STRONG_QUOTE=./fixtures/strong.pdf \
 *   node scripts/quote-checker-consistency-gate.mjs
 *
 * Optional env vars:
 *   CATEGORY        (default "landscaping_driveway")
 *   RUNS_PER_QUOTE  (default 5)
 *   AGREEMENT_THRESHOLD (default 0.95)
 *   POLL_TIMEOUT_MS (default 90000)
 *   TESTED_BY       (default "automated-script")
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CATEGORY = process.env.CATEGORY || "landscaping_driveway";
const RUNS_PER_QUOTE = Number(process.env.RUNS_PER_QUOTE || 5);
const AGREEMENT_THRESHOLD = Number(process.env.AGREEMENT_THRESHOLD || 0.95);
const POLL_TIMEOUT_MS = Number(process.env.POLL_TIMEOUT_MS || 90_000);
const POLL_INTERVAL_MS = 3_000;
const TESTED_BY = process.env.TESTED_BY || "automated-script";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const REFERENCE_QUOTES = [
  { label: "weak", filePath: process.env.WEAK_QUOTE },
  { label: "medium", filePath: process.env.MEDIUM_QUOTE },
  { label: "strong", filePath: process.env.STRONG_QUOTE },
].filter((q) => q.filePath);

if (REFERENCE_QUOTES.length !== 3) {
  console.error("Provide all three reference quotes via WEAK_QUOTE, MEDIUM_QUOTE, STRONG_QUOTE env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uploadReferenceQuote(filePath, label) {
  const bytes = await readFile(filePath);
  const storagePath = `consistency-gate/${CATEGORY}/${label}${path.extname(filePath)}`;
  const { error } = await supabase.storage.from("quote-pdfs").upload(storagePath, bytes, {
    upsert: true,
    contentType: filePath.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
  });
  if (error) throw new Error(`Upload failed for ${filePath}: ${error.message}`);
  return storagePath;
}

async function runExtraction(storagePath) {
  const { data, error } = await supabase.functions.invoke("extract-quote", {
    body: {
      category: CATEGORY,
      projectType: "Landscaping / Driveway",
      intake: { checker: CATEGORY, project_type: "Landscaping / Driveway", landscaping_context: {} },
      pdfPath: storagePath,
      supportingFiles: [],
    },
  });
  if (error) throw new Error(`extract-quote invoke failed: ${error.message}`);
  if (!data?.id) throw new Error("extract-quote returned no id");
  return data.id; // simple_quote_checks id
}

async function pollForExtraction(quoteCheckId) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from("quote_check_extractions")
      .select("pass1_json")
      .eq("quote_check_id", quoteCheckId)
      .maybeSingle();
    if (error) throw new Error(`Poll failed: ${error.message}`);
    if (data?.pass1_json) return data.pass1_json;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Timed out waiting for extraction (quote_check_id=${quoteCheckId})`);
}

/** Flatten a category -> field -> {status,...} extraction into "category.field": status. */
function flattenStatuses(extraction) {
  const flat = {};
  for (const [catKey, fields] of Object.entries(extraction || {})) {
    if (!fields || typeof fields !== "object") continue;
    for (const [fieldKey, field] of Object.entries(fields)) {
      flat[`${catKey}.${fieldKey}`] = field?.status ?? "unknown";
    }
  }
  return flat;
}

function fieldAgreementRate(runs) {
  const flattened = runs.map(flattenStatuses);
  const allKeys = new Set(flattened.flatMap((f) => Object.keys(f)));
  let agree = 0;
  for (const key of allKeys) {
    const values = flattened.map((f) => f[key]);
    if (values.every((v) => v === values[0])) agree += 1;
  }
  return { rate: allKeys.size ? agree / allKeys.size : 0, totalFields: allKeys.size, agreeingFields: agree };
}

async function testOneQuote({ label, filePath }) {
  console.log(`\n=== ${label.toUpperCase()} quote: ${filePath} ===`);
  const storagePath = await uploadReferenceQuote(filePath, label);
  const extractions = [];

  for (let run = 1; run <= RUNS_PER_QUOTE; run++) {
    process.stdout.write(`  run ${run}/${RUNS_PER_QUOTE}... `);
    const quoteCheckId = await runExtraction(storagePath);
    const pass1Json = await pollForExtraction(quoteCheckId);
    extractions.push(pass1Json);
    console.log("done");
  }

  const { rate, totalFields, agreeingFields } = fieldAgreementRate(extractions);
  const passed = rate >= AGREEMENT_THRESHOLD;
  console.log(
    `  field agreement: ${agreeingFields}/${totalFields} (${(rate * 100).toFixed(1)}%) — ${passed ? "PASS" : "FAIL"} (threshold ${(AGREEMENT_THRESHOLD * 100).toFixed(0)}%)`,
  );

  const rows = extractions.map((extraction_json, i) => ({
    category: CATEGORY,
    test_quote_label: label,
    test_quote_path: storagePath,
    run_number: i + 1,
    extraction_json,
    passed,
    tested_by: TESTED_BY,
  }));
  const { error: insertErr } = await supabase.from("quote_check_consistency_tests").insert(rows);
  if (insertErr) console.error(`  WARNING: failed to log results: ${insertErr.message}`);

  return { label, passed, rate, totalFields, agreeingFields };
}

async function main() {
  const results = [];
  for (const quote of REFERENCE_QUOTES) {
    results.push(await testOneQuote(quote));
  }

  console.log("\n=== SUMMARY ===");
  for (const r of results) {
    console.log(`  ${r.label.padEnd(8)} ${(r.rate * 100).toFixed(1)}%  ${r.passed ? "PASS" : "FAIL"}`);
  }

  const allPassed = results.every((r) => r.passed);
  console.log(`\nGate ${allPassed ? "PASSED" : "FAILED"} for category "${CATEGORY}".`);
  if (allPassed) {
    console.log(
      `You can now set QUOTE_CHECKER_V2_ENABLED.${CATEGORY} = true in supabase/functions/_shared/quote-checker-v2-flags.ts and redeploy.`,
    );
  } else {
    console.log("Review the failing quote(s)' field-by-field disagreement before considering the schema/prompt stable.");
  }
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Consistency gate failed:", err);
  process.exit(1);
});
