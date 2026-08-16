// Quote Checker score bands — presentation layer only.
//
// The scoring model, category weights and AI pipeline are untouched. This module
// maps a finished clarity score (0-100) onto four distinct homeowner-facing
// bands, each with its own headline, colour treatment and summary copy.
// Deriving the band from the score at render time means historical reports
// stored before these bands existed render correctly too.

export type ScoreBandLevel = "excellent" | "good" | "workable" | "caution";

export interface ScoreBand {
  level: ScoreBandLevel;
  /** Small uppercase headline above the summary line. */
  label: string;
  /** Band-specific summary sentence (trade noun substituted). */
  line: string;
  ring: string;
  text: string;
  bar: string;
}

const TEMPLATES: Record<ScoreBandLevel, { label: string; line: (t: string) => string; ring: string; text: string; bar: string }> = {
  excellent: {
    label: "Excellent — ready to proceed",
    line: (t) =>
      `This is an excellent quote. The scope, materials, responsibilities and commercial terms are all clearly set out, and there is nothing significant left open. You can proceed with confidence — just keep the ${t}'s written quote on file as the agreed basis of the work.`,
    ring: "ring-emerald-300",
    text: "text-emerald-700",
    bar: "bg-emerald-600",
  },
  good: {
    label: "Good — a few points to confirm",
    line: (t) =>
      `This is a good quote. The main scope, materials and pricing are clear and it stands up well overall. A small number of points are still worth putting in writing with the ${t} before you accept, but none of them are red flags.`,
    ring: "ring-teal/40",
    text: "text-teal-deep",
    bar: "bg-teal",
  },
  workable: {
    label: "Workable — confirm several gaps",
    line: (t) =>
      `This quote is workable but incomplete. The basics are there, yet several meaningful details are missing or unclear. Go back to the ${t} and get those gaps confirmed in writing before you accept, so the price you agree is the price you pay.`,
    ring: "ring-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-500",
  },
  caution: {
    label: "Caution — significant gaps",
    line: (t) =>
      `Treat this quote with caution. It gives a price, but too much of the work is left undefined for you to accept it safely as it stands. Ask the ${t} for a revised, itemised quote covering the gaps below before committing any money.`,
    ring: "ring-rose-200",
    text: "text-rose-700",
    bar: "bg-rose-500",
  },
};

export function bandLevelForScore(score: number): ScoreBandLevel {
  const s = Number.isFinite(score) ? score : 0;
  if (s >= 90) return "excellent";
  if (s >= 75) return "good";
  if (s >= 55) return "workable";
  return "caution";
}

export function getScoreBand(score: number, tradeNoun = "builder"): ScoreBand {
  const level = bandLevelForScore(score);
  const t = TEMPLATES[level];
  return { level, label: t.label, line: t.line(tradeNoun), ring: t.ring, text: t.text, bar: t.bar };
}
