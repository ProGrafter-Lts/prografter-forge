// Pass 0 — deterministic extraction. No LLM involved.
//
// 1. Extract plain text from PDF uploads (via unpdf — validated to work
//    against a real PDF.js parse; see the spike notes in the build plan).
//    Image-only uploads (jpg/png/webp) and other non-PDF files have no local
//    text-extraction or OCR path in this codebase — Pass 0 simply has
//    nothing to work with for those, and Pass 1 proceeds without a
//    deterministic head start or a substring anti-hallucination check for
//    that specific document.
// 2. Regex over the extracted text for a small set of unambiguous patterns.
//
// IMPORTANT SCOPING DECISION: only the VAT number pattern is precise enough
// to be treated as a "locked" fact that can override Pass 1's own read (see
// index.ts). Price figures, dates and percentages are genuinely ambiguous
// out of context — a quote can contain several prices (subtotal, VAT, total,
// unit rates), several dates (quote date, site-visit date, start date), and
// several percentages (VAT rate, deposit rate, discount). Those are surfaced
// to Pass 1 as candidate hints only, never as locked overrides.

import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@1.8.0";

export interface Pass0Candidates {
  vatNumber: string | null;
  priceCandidates: string[];
  dateCandidates: string[];
  percentageCandidates: string[];
}

export async function extractPdfText(bytes: Uint8Array): Promise<string | null> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const full = Array.isArray(text) ? text.join("\n") : text;
    return full && full.trim().length > 0 ? full : null;
  } catch (e) {
    console.error("[pass0] PDF text extraction failed:", (e as Error).message);
    return null;
  }
}

const VAT_NUMBER_RE = /\bGB\s?\d{3}\s?\d{4}\s?\d{2}(?:\s?\d{3})?\b/i;
const PRICE_RE = /£\s?[\d,]+(?:\.\d{2})?|\b[\d,]+\.\d{2}\s?(?:GBP|gbp)\b/g;
const DATE_RE_NUMERIC = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g;
const DATE_RE_WORD = /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi;
const PERCENT_RE = /\b\d{1,3}\s?%/g;

export function runPass0Regex(sourceText: string): Pass0Candidates {
  const vatMatch = sourceText.match(VAT_NUMBER_RE);
  const prices = [...sourceText.matchAll(PRICE_RE)].map((m) => m[0].trim());
  const dates = [
    ...[...sourceText.matchAll(DATE_RE_NUMERIC)].map((m) => m[0].trim()),
    ...[...sourceText.matchAll(DATE_RE_WORD)].map((m) => m[0].trim()),
  ];
  const percentages = [...sourceText.matchAll(PERCENT_RE)].map((m) => m[0].trim());

  return {
    vatNumber: vatMatch ? vatMatch[0].trim() : null,
    priceCandidates: [...new Set(prices)].slice(0, 10),
    dateCandidates: [...new Set(dates)].slice(0, 10),
    percentageCandidates: [...new Set(percentages)].slice(0, 10),
  };
}

/** A short text block describing Pass 0's findings, to prepend to the Pass 1
 *  prompt as hints (not authoritative facts — see scoping note above). */
export function describePass0Candidates(c: Pass0Candidates): string {
  const lines: string[] = [];
  if (c.vatNumber) lines.push(`- VAT number detected: ${c.vatNumber}`);
  if (c.priceCandidates.length) lines.push(`- Price-like figures detected: ${c.priceCandidates.join(", ")}`);
  if (c.dateCandidates.length) lines.push(`- Date-like values detected: ${c.dateCandidates.join(", ")}`);
  if (c.percentageCandidates.length) lines.push(`- Percentage-like values detected: ${c.percentageCandidates.join(", ")}`);
  if (lines.length === 0) return "(none — no PDF text layer was available to pre-scan, or no matches found)";
  return lines.join("\n");
}
