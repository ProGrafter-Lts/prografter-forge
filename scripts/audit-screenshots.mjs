#!/usr/bin/env node
/**
 * Audit screenshot capture for the May 2026 8-issue fix batch.
 *
 * Usage:
 *   BASE_URL=https://prografter.co.uk node scripts/audit-screenshots.mjs
 *   # or
 *   node scripts/audit-screenshots.mjs https://graft-craft-co.lovable.app
 *
 * Output: ./audit-screenshots/*.png  (override with OUT_DIR=...)
 *
 * Captures, in order:
 *   01-hero-badge          — homepage hero badge ("Now live across the UK …")
 *   02-about-table         — /about comparison row showing 7.5% commission
 *   03-nav-anchors         — homepage with #pricing scrolled into view
 *   04-planning-alerts     — /planning-alerts Coming Soon page
 *   05-contact-meta        — /contact (filename includes <title>; full-page screenshot)
 *   06-platform-preview    — Platform Preview section with illustrative-figures disclaimer
 *   07-comparisons         — Old Way / Why Different sections naming Checkatrade
 *   08-signup-trade-redirect — /signup/trade after redirect to /register/trade
 *
 * Also writes audit-screenshots/manifest.json with title + final URL per shot,
 * and fails (exit 1) if any page logged a console error during capture.
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = (process.argv[2] || process.env.BASE_URL || "https://prografter.co.uk").replace(/\/$/, "");
const OUT_DIR = process.env.OUT_DIR || "audit-screenshots";

const VIEWPORT = { width: 1440, height: 900 };

/** @type {Array<{name: string, path: string, scrollTo?: string, fullPage?: boolean, clip?: string, waitFor?: string}>} */
const SHOTS = [
  { name: "01-hero-badge", path: "/", clip: "section:has(h1)" },
  { name: "02-about-table", path: "/about", scrollTo: "table, [class*='grid']", fullPage: true },
  { name: "03-nav-anchors", path: "/#pricing", waitFor: "#pricing", clip: "#pricing" },
  { name: "04-planning-alerts", path: "/planning-alerts", fullPage: true },
  { name: "05-contact-meta", path: "/contact", fullPage: true },
  { name: "06-platform-preview", path: "/#how-it-works", scrollTo: "[class*='Platform'], section:has(p:has-text('Example dashboard'))", fullPage: true },
  { name: "07-comparisons", path: "/", scrollTo: "*:has-text('Checkatrade')", fullPage: true },
  { name: "08-signup-trade-redirect", path: "/signup/trade", fullPage: true },
];

const errors = [];

async function capture(browser, shot) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`);
  });

  const url = BASE_URL + shot.path;
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});

  if (shot.waitFor) {
    await page.waitForSelector(shot.waitFor, { timeout: 5_000 }).catch(() => {});
  }
  if (shot.scrollTo) {
    await page.locator(shot.scrollTo).first().scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(400);
  }

  const file = path.join(OUT_DIR, `${shot.name}.png`);
  if (shot.clip) {
    const el = page.locator(shot.clip).first();
    if (await el.count()) {
      await el.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file, fullPage: !!shot.fullPage });
    }
  } else {
    await page.screenshot({ path: file, fullPage: !!shot.fullPage });
  }

  const meta = {
    name: shot.name,
    requested: url,
    finalUrl: page.url(),
    title: await page.title(),
    consoleErrors,
  };
  if (consoleErrors.length) errors.push({ shot: shot.name, consoleErrors });
  await ctx.close();
  return meta;
}

(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`▶ Audit screenshots against ${BASE_URL} → ${OUT_DIR}/`);
  const browser = await chromium.launch();
  const manifest = [];
  try {
    for (const shot of SHOTS) {
      process.stdout.write(`  • ${shot.name} … `);
      const meta = await capture(browser, shot);
      manifest.push(meta);
      console.log(`${meta.finalUrl}  [${meta.consoleErrors.length} console errors]`);
    }
  } finally {
    await browser.close();
  }
  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  if (errors.length) {
    console.error("\n✗ Console errors detected:");
    for (const e of errors) console.error(` - ${e.shot}: ${e.consoleErrors.join(" | ")}`);
    process.exit(1);
  }
  console.log("\n✓ Done. No console errors.");
})();
