// Shared brief-quality validation used by the homeowner post-a-job flow and the
// admin publish checklist. Deliberately gentle: guides homeowners to improve a
// brief rather than punishing them, and surfaces the same signals as admin flags.

export type BriefFlag =
  | "title_too_short"
  | "description_too_short"
  | "description_too_vague"
  | "profanity"
  | "nonsense"
  | "repeated_chars";

export interface BriefIssue {
  flag: BriefFlag;
  /** Homeowner-facing, non-aggressive guidance. */
  message: string;
  /** Short label for the admin flag chips. */
  adminLabel: string;
  /** Blocks a clean homeowner submission when true. */
  blocking: boolean;
}

const MIN_TITLE = 6;
const MIN_DESCRIPTION = 30;

// Kept intentionally small and word-boundary matched to avoid false positives
// (e.g. "Scunthorpe problem"). Covers the common abusive/offensive terms.
const PROFANITY = [
  "shit", "shite", "bullshit", "fuck", "fucking", "fucker", "cunt", "bastard",
  "bollocks", "wanker", "twat", "prick", "arsehole", "asshole", "bitch",
  "dickhead", "piss", "slag", "nigger", "faggot", "retard",
];

const VAGUE_PHRASES = [
  "some work", "bit of work", "few things", "this and that", "dunno",
  "not sure", "stuff", "sort it", "fix it", "do up", "general work",
];

function normalise(text: string): string {
  return (text || "").toLowerCase().trim();
}

/** True if a word from `list` appears as a whole word in `text`. */
function containsWord(text: string, list: string[]): boolean {
  const t = normalise(text);
  return list.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`, "i").test(t));
}

function hasRepeatedChars(text: string): boolean {
  // e.g. "aaaaaa", "!!!!!!", "sdsdsdsdsd" keyboard mashing
  return /(.)\1{5,}/i.test(text) || /(..)\1{4,}/i.test(text);
}

function looksLikeNonsense(text: string): boolean {
  const t = normalise(text);
  if (t.length < 8) return false;
  const letters = t.replace(/[^a-z]/g, "");
  if (letters.length < 6) return false;
  const vowels = (letters.match(/[aeiou]/g) || []).length;
  const vowelRatio = vowels / letters.length;
  // Real English sits ~0.35-0.45 vowels. Very low or zero suggests mashing.
  const noSpaces = !/\s/.test(t) && t.length > 20;
  return vowelRatio < 0.12 || noSpaces;
}

/**
 * Validate a homeowner brief. Returns an ordered list of issues.
 * `blocking` issues should stop a clean homeowner submission; all issues are
 * surfaced to admin as flags.
 */
export function validateBrief(title: string, description: string): BriefIssue[] {
  const issues: BriefIssue[] = [];
  const t = (title || "").trim();
  const d = (description || "").trim();

  if (containsWord(t, PROFANITY) || containsWord(d, PROFANITY)) {
    issues.push({
      flag: "profanity",
      message: "Please remove offensive language before submitting your brief.",
      adminLabel: "Possible profanity",
      blocking: true,
    });
  }

  if (t.length < MIN_TITLE) {
    issues.push({
      flag: "title_too_short",
      message: "Please give your job a clear title so trades know what it involves.",
      adminLabel: "Title too short",
      blocking: true,
    });
  }

  if (d.length < MIN_DESCRIPTION) {
    issues.push({
      flag: "description_too_short",
      message:
        "This description is too short for trades to quote properly. Please add what work you want done, the current condition, and the outcome you are looking for.",
      adminLabel: "Description too short",
      blocking: true,
    });
  } else if (containsWord(d, VAGUE_PHRASES) && d.length < 80) {
    issues.push({
      flag: "description_too_vague",
      message:
        "This description is a little vague for trades to quote properly. Try to include what you want done, the current condition, measurements if known, whether drawings exist, and the outcome you want.",
      adminLabel: "Description too vague",
      blocking: true,
    });
  }

  if (hasRepeatedChars(t) || hasRepeatedChars(d)) {
    issues.push({
      flag: "repeated_chars",
      message: "Please provide a clear project description so trades can understand the work.",
      adminLabel: "Possible nonsense",
      blocking: true,
    });
  } else if (looksLikeNonsense(d)) {
    issues.push({
      flag: "nonsense",
      message: "Please provide a clear project description so trades can understand the work.",
      adminLabel: "Possible nonsense",
      blocking: true,
    });
  }

  return issues;
}

export function blockingBriefIssues(title: string, description: string): BriefIssue[] {
  return validateBrief(title, description).filter((i) => i.blocking);
}

export const BRIEF_HELPER_TEXT =
  "Try to include: what you want done, the current condition, measurements if known, whether drawings exist, and the outcome you want.";
