/* ============================================================
   ProGrafter Planning Hub — Introduction Letter engine.
   Deterministic letter composition + local persistence.
   Every generated letter is stored against its opportunity so
   it appears on the opportunity timeline.
   ============================================================ */

import type { Opportunity } from "@/hub/data/opportunities";
import { formatBuildValueFull } from "@/hub/data/opportunities";
import type { BusinessProfile } from "@/hub/data/business";

export interface SavedLetter {
  id: string;
  opportunityId: string;
  createdAt: string; // ISO
  greeting: string;
  body: string; // the editable letter body
}

const LETTERS_KEY = "pg-hub-intro-letters";
const TEMPLATE_KEY = "pg-hub-intro-letter-template";

/* ---------------- Composition ---------------- */

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Greeting line — uses the homeowner name when available. */
export const letterGreeting = (o: Opportunity): string =>
  o.homeownerName ? `Dear ${o.homeownerName},` : "Dear Homeowner,";

/**
 * The default, personalised letter body. If the user has saved a
 * custom template, the {{tokens}} inside it are filled instead.
 */
export const composeLetterBody = (o: Opportunity, biz: BusinessProfile): string => {
  const template = getTemplate();
  const tokens: Record<string, string> = {
    homeowner: o.homeownerName ?? "there",
    address: `${o.address}, ${o.postcode}`,
    projectType: o.projectType.toLowerCase(),
    planningRef: o.planningRef,
    planningDescription: o.description,
    buildValue: formatBuildValueFull(o.estBuildValue),
    contactName: biz.contactName,
    businessName: biz.businessName,
    tradeType: biz.tradeType,
    email: biz.email,
    phone: biz.phone,
    serviceArea: biz.serviceArea,
    website: biz.website ?? "",
    registrationNo: biz.registrationNo ?? "",
  };

  if (template) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? "");
  }

  return defaultBody(o, biz);
};

const defaultBody = (o: Opportunity, biz: BusinessProfile): string => {
  const addr = `${o.address}, ${o.postcode}`;
  return [
    `I hope this letter finds you well. I noticed your recent planning application (${o.planningRef}) for ${o.description.toLowerCase()} at ${addr}, and I wanted to introduce my business.`,
    `I'm ${biz.contactName} from ${biz.businessName}, a ${biz.tradeType.toLowerCase()} specialist working across ${biz.serviceArea}. We help homeowners bring projects like your ${o.projectType.toLowerCase()} to life — managing the work carefully, on schedule and to a high standard.`,
    `Having successfully delivered similar projects nearby, I'd welcome the chance to discuss your plans, answer any questions and provide a clear, no-obligation quotation. There's absolutely no pressure — I simply want to make myself available should you be looking for a trusted local builder.`,
    `If you'd like to have a chat, you can reach me directly on ${biz.phone} or by email at ${biz.email}. I'd be delighted to help.`,
  ].join("\n\n");
};

/** Full letter text (for PDF/print/copy) including date, greeting, sign-off. */
export const fullLetterText = (
  o: Opportunity,
  biz: BusinessProfile,
  greeting: string,
  body: string,
): string => {
  const lines = [
    biz.businessName,
    biz.serviceArea,
    `${biz.phone}  ·  ${biz.email}`,
    biz.website ?? "",
    "",
    fmtDate(new Date().toISOString()),
    "",
    `${o.address},`,
    o.postcode,
    "",
    greeting,
    "",
    body,
    "",
    "Kind regards,",
    "",
    biz.contactName,
    biz.businessName,
    biz.registrationNo ?? "",
  ];
  return lines.filter((l) => l !== undefined).join("\n");
};

/* ---------------- Template persistence ---------------- */

export const getTemplate = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TEMPLATE_KEY);
};

/** Save the current body as a reusable template with {{tokens}}. */
export const saveTemplate = (body: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TEMPLATE_KEY, body);
};

export const clearTemplate = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TEMPLATE_KEY);
};

/* ---------------- Saved letters (timeline) ---------------- */

export const getLetters = (opportunityId?: string): SavedLetter[] => {
  if (typeof window === "undefined") return [];
  try {
    const all: SavedLetter[] = JSON.parse(window.localStorage.getItem(LETTERS_KEY) ?? "[]");
    const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return opportunityId ? sorted.filter((l) => l.opportunityId === opportunityId) : sorted;
  } catch {
    return [];
  }
};

export const saveLetter = (letter: Omit<SavedLetter, "id" | "createdAt">): SavedLetter => {
  const record: SavedLetter = {
    ...letter,
    id: `ltr-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const all = getLetters();
  all.unshift(record);
  window.localStorage.setItem(LETTERS_KEY, JSON.stringify(all));
  return record;
};
