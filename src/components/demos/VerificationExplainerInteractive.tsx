import { useState } from "react";
import { ShieldCheck, FileCheck, Award, Users, RefreshCw, ChevronRight } from "lucide-react";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Identity verification",
    short: "Who they really are",
    desc: "Government-issued ID confirms the person behind the business is genuine. No anonymous listings — ever.",
    stat: "0 anonymous profiles",
  },
  {
    icon: FileCheck,
    title: "Public liability insurance",
    short: "You're protected",
    desc: "We confirm valid public liability cover so you're protected if something goes wrong on site — and track expiry so it stays current.",
    stat: "Cover confirmed, not assumed",
  },
  {
    icon: Award,
    title: "Qualifications & accreditations",
    short: "Right trade, right job",
    desc: "Relevant qualifications, competent-person scheme membership and accreditations are checked against the work each trade offers.",
    stat: "Matched to the work offered",
  },
  {
    icon: Users,
    title: "References & work history",
    short: "A real track record",
    desc: "A human reviews references and past work, so a trade earns their place through their record — not their marketing.",
    stat: "Reviewed by a person",
  },
  {
    icon: RefreshCw,
    title: "Ongoing accountability",
    short: "Verified stays verified",
    desc: "Two-way reviews, document expiry reminders and manual oversight keep standards high after approval — not just at sign-up.",
    stat: "Checked continuously",
  },
];

const VerificationExplainerInteractive = () => {
  const [active, setActive] = useState(0);
  const Step = STEPS[active];
  const Icon = Step.icon;

  return (
    <section className="bg-cream py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal-deep uppercase tracking-widest">
            5-Step Verification
          </span>
        </div>
        <h2 className="font-heading text-deep text-[40px] craft:text-[60px] leading-none mb-4">
          Verification is earned, never bought.
        </h2>
        <p className="font-body text-secondary-text text-base craft:text-lg max-w-2xl mb-12">
          Trades can&apos;t pay their way onto ProGrafter. Every professional passes all five checks before
          their profile goes live to homeowners. Tap through each step.
        </p>

        <div className="grid grid-cols-1 craft:grid-cols-[1fr_1.3fr] gap-6">
          {/* Steps list */}
          <div className="space-y-2">
            {STEPS.map((s, i) => {
              const SIcon = s.icon;
              const on = i === active;
              return (
                <button
                  key={s.title}
                  onClick={() => setActive(i)}
                  className={`w-full flex items-center gap-4 text-left rounded-xl border px-4 py-4 transition-all ${
                    on
                      ? "bg-deep border-deep shadow-lg"
                      : "bg-white border-deep/10 hover:border-teal/40"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
                      on ? "bg-teal text-cream" : "bg-cream text-teal-deep"
                    }`}
                  >
                    <SIcon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block font-mono text-[10px] uppercase tracking-widest ${on ? "text-teal" : "text-secondary-text"}`}>
                      Step {i + 1}
                    </span>
                    <span className={`block font-heading text-lg leading-tight ${on ? "text-cream" : "text-deep"}`}>
                      {s.title}
                    </span>
                  </span>
                  <ChevronRight className={`w-4 h-4 ml-auto shrink-0 ${on ? "text-teal" : "text-deep/20"}`} />
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="rounded-2xl bg-deep p-8 flex flex-col justify-center relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-teal/20 blur-[90px]" />
            <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-teal/15 text-teal mb-6">
              <Icon className="w-7 h-7" />
            </span>
            <span className="font-mono text-[11px] text-teal uppercase tracking-widest mb-2">
              {Step.short}
            </span>
            <h3 className="font-heading text-cream text-3xl leading-tight mb-4">{Step.title}</h3>
            <p className="font-body text-cream/70 text-base leading-relaxed mb-6">{Step.desc}</p>
            <div className="inline-flex items-center gap-2 self-start font-mono text-xs text-cream bg-white/[0.06] border border-white/10 rounded-full px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
              {Step.stat}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col craft:flex-row gap-4">
          <a
            href="/trade-verification"
            className="inline-flex items-center justify-center gap-2 bg-teal text-cream font-mono text-sm px-7 py-3.5 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/20 hover:-translate-y-0.5"
          >
            How verification works
          </a>
          <a
            href="/signup/trade"
            className="inline-flex items-center justify-center gap-2 border border-deep/20 text-deep font-mono text-sm px-7 py-3.5 rounded-xl hover:border-teal hover:text-teal-deep transition-colors"
          >
            Join as a verified trade
          </a>
        </div>
      </div>
    </section>
  );
};

export default VerificationExplainerInteractive;
