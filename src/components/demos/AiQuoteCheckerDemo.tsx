import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";

type CheckState = "pending" | "running" | "done";

const CHECKS = [
  { label: "VAT clearly shown", verdict: "clear" as const, detail: "£8,400 VAT itemised separately" },
  { label: "Labour & materials split", verdict: "clear" as const, detail: "Breakdown provided per phase" },
  { label: "Scaffold & welfare", verdict: "clear" as const, detail: "Temporary works allowance itemised" },
  { label: "Payment schedule", verdict: "check" as const, detail: "Stage payments listed — confirm dates" },
  { label: "Overall programme", verdict: "risk" as const, detail: "No start/finish timescale stated" },
];

const verdictConfig = {
  clear: { icon: CheckCircle2, color: "text-teal", ring: "border-teal/40", chip: "bg-teal/15 text-teal" },
  check: { icon: AlertTriangle, color: "text-amber-400", ring: "border-amber-400/40", chip: "bg-amber-400/15 text-amber-300" },
  risk: { icon: XCircle, color: "text-rose-400", ring: "border-rose-400/40", chip: "bg-rose-400/15 text-rose-300" },
};

const AiQuoteCheckerDemo = () => {
  const [phase, setPhase] = useState<"idle" | "analysing" | "done">("idle");
  const [visible, setVisible] = useState(0);
  const [score, setScore] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const run = () => {
    if (phase === "analysing") return;
    setPhase("analysing");
    setVisible(0);
    setScore(0);
  };

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          run();
        }
      },
      { threshold: 0.35 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "analysing") return;
    if (visible < CHECKS.length) {
      const t = setTimeout(() => setVisible((v) => v + 1), 650);
      return () => clearTimeout(t);
    }
    setPhase("done");
  }, [phase, visible]);

  useEffect(() => {
    if (phase !== "done") return;
    const target = 78;
    let cur = 0;
    const id = setInterval(() => {
      cur += 3;
      if (cur >= target) {
        cur = target;
        clearInterval(id);
      }
      setScore(cur);
    }, 24);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <section ref={sectionRef} className="bg-deep py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">AI Quote Checker</span>
        </div>
        <h2 className="font-heading text-cream text-[40px] craft:text-[60px] leading-none mb-4">
          Watch the AI read a quote.
        </h2>
        <p className="font-body text-secondary-text text-base craft:text-lg max-w-2xl mb-12 text-cream/70">
          Upload any builder&apos;s quote and our AI checks it line by line — VAT, breakdowns, temporary
          works and hidden risks — then gives you a Clarity Score in minutes.
        </p>

        <div className="grid grid-cols-1 craft:grid-cols-[1.4fr_1fr] gap-6">
          {/* Checks panel */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-[11px] text-cream/50 uppercase tracking-widest">
                extension-quote.pdf
              </span>
              <span className="font-mono text-[11px] text-cream/40">12 pages</span>
            </div>
            <div className="space-y-3">
              {CHECKS.map((c, i) => {
                const shown = i < visible;
                const cfg = verdictConfig[c.verdict];
                const Icon = cfg.icon;
                return (
                  <div
                    key={c.label}
                    className={`flex items-start gap-3 rounded-xl border ${
                      shown ? cfg.ring : "border-white/5"
                    } bg-white/[0.02] px-4 py-3 transition-all duration-500 ${
                      shown ? "opacity-100 translate-y-0" : "opacity-30 translate-y-1"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${shown ? cfg.color : "text-cream/20"}`} />
                    <div className="min-w-0">
                      <div className="font-body text-cream text-sm font-medium">{c.label}</div>
                      <div className="font-body text-cream/50 text-xs">{shown ? c.detail : "Analysing…"}</div>
                    </div>
                    {shown && (
                      <span className={`ml-auto font-mono text-[10px] uppercase px-2 py-1 rounded-full ${cfg.chip}`}>
                        {c.verdict === "clear" ? "Clear" : c.verdict === "check" ? "Confirm" : "Risk"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score panel */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-[11px] text-cream/50 uppercase tracking-widest mb-4">
              Clarity Score
            </span>
            <div className="relative w-40 h-40 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#14A8A1"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - score / 100)}
                  className="transition-all duration-100"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-cream text-5xl leading-none">{score}</span>
                <span className="font-mono text-[10px] text-cream/50 mt-1">out of 100</span>
              </div>
            </div>
            <p className="font-body text-cream/70 text-sm mb-5">
              {phase === "done"
                ? "Mostly clear — one real risk to confirm before you commit."
                : "Scanning the document…"}
            </p>
            <button
              onClick={run}
              className="inline-flex items-center gap-2 font-mono text-xs text-teal border border-teal/40 rounded-lg px-4 py-2 hover:bg-teal/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {phase === "idle" ? "Run demo" : "Replay"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/quote-checker"
            className="inline-flex items-center justify-center gap-2 bg-teal text-cream font-mono text-sm px-7 py-3.5 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5"
          >
            Check your own quote
          </a>
        </div>
      </div>
    </section>
  );
};

export default AiQuoteCheckerDemo;
