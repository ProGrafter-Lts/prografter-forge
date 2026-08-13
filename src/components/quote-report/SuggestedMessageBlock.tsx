import { useState } from "react";
import { Copy, Check, MessageSquare } from "lucide-react";

/**
 * Presentation-only. Renders the "Suggested message to your builder" block
 * that the old V1 report had, rebuilt on top of the DETERMINISTIC V2 field
 * results (report.suggested_questions / suggested_message_text, both built in
 * score-quote from the scored extraction — never from a fresh model pass).
 *
 * Falls back to the legacy free-text `suggested_message` for reports generated
 * before the deterministic block existed.
 */
export interface SuggestedQuestion {
  n?: number;
  category?: string;
  label?: string;
  status?: string;
  question: string;
}

export interface SuggestedMessageSource {
  suggested_questions?: SuggestedQuestion[];
  suggested_message_text?: string;
  suggested_message?: string;
}

const VISIBLE = 12;

const parseLegacy = (msg: string) => {
  const cleaned = msg.trim();
  let parts = cleaned
    .split(/\n+/)
    .map((p) => p.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, "").trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    parts = cleaned.split(/(?<=[.?!])\s+/).map((p) => p.trim()).filter(Boolean);
  }
  if (parts.length <= 1) return { intro: cleaned, points: [] as string[] };
  return { intro: parts[0], points: parts.slice(1) };
};

export default function SuggestedMessageBlock({
  report,
  title = "Suggested Message To Your Builder",
}: {
  report: SuggestedMessageSource;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const deterministic = (report.suggested_questions ?? []).filter((q) => q?.question);
  const legacy = !deterministic.length && report.suggested_message ? parseLegacy(report.suggested_message) : null;

  if (!deterministic.length && !legacy) return null;

  const intro = deterministic.length
    ? `Hi, thanks for the quote. Before I go ahead, could you confirm a few points in writing please?`
    : legacy!.intro;
  const points = deterministic.length ? deterministic.map((q) => q.question) : legacy!.points;
  const shown = showAll ? points : points.slice(0, VISIBLE);
  const outro = deterministic.length
    ? `Once I have these confirmed in writing I'll be happy to move forward. Thanks.`
    : "";

  const copyText =
    report.suggested_message_text ||
    (deterministic.length
      ? [intro, "", ...points.slice(0, VISIBLE).map((p, i) => `${i + 1}. ${p}`), "", outro].join("\n")
      : report.suggested_message || "");

  const copy = async () => {
    if (!copyText) return;
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-navy rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="h-5 w-5 text-teal shrink-0" />
          <h2 className="font-heading text-base md:text-lg text-white">
            {title}
          </h2>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 font-mono text-xs text-white/90 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors shrink-0"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="space-y-3">
        {intro && <p className="font-mono text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{intro}</p>}
        {shown.length ? (
          <ol className="space-y-2 list-decimal list-inside">
            {shown.map((p, i) => (
              <li key={i} className="font-mono text-sm text-white/90 leading-relaxed">{p}</li>
            ))}
          </ol>
        ) : null}
        {points.length > VISIBLE && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="font-mono text-xs text-teal hover:text-teal/80 underline underline-offset-2"
          >
            {showAll ? "Show fewer" : `Show all ${points.length} points`}
          </button>
        )}
        {outro && <p className="font-mono text-sm text-white/70 leading-relaxed">{outro}</p>}
        {points.length > VISIBLE && (
          <p className="font-mono text-[11px] text-white/50 leading-relaxed">
            Copy sends the top {VISIBLE} points — the ones that matter most.
          </p>
        )}
      </div>
    </div>
  );
}
