import { useNavigate } from "react-router-dom";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import { ArrowRight, ListChecks, CheckCircle2 } from "lucide-react";
import type { NextStep, NextStepPriority } from "@/lib/homeownerNextSteps";

interface Props {
  steps: NextStep[];
  setActiveNav: (tab: string) => void;
}

const PRIORITY_STYLE: Record<
  NextStepPriority,
  { dot: string; chip: string; label: string }
> = {
  high: {
    dot: "bg-amber-500",
    chip: "bg-amber-200 text-amber-900",
    label: "Action needed",
  },
  medium: {
    dot: "bg-secondary",
    chip: "bg-secondary/20 text-secondary",
    label: "Recommended",
  },
  low: {
    dot: "bg-blue-400",
    chip: "bg-blue-100 text-blue-900",
    label: "When you can",
  },
};

const NextSteps = ({ steps, setActiveNav }: Props) => {
  const navigate = useNavigate();
  const openDrawer = useDrawerNavigate();

  const run = (step: NextStep) => {
    const a = step.action;
    if (a.kind === "tab") setActiveNav(a.tab);
    else if (a.kind === "drawer") openDrawer(a.path);
    else navigate(a.href);
  };

  return (
    <section aria-labelledby="next-steps-heading">
      <h2
        id="next-steps-heading"
        className="font-heading text-primary text-2xl mb-4 flex items-center gap-2"
      >
        <ListChecks className="w-5 h-5" /> Your Next Steps
      </h2>

      {steps.length === 0 ? (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="font-heading text-primary text-base">You're all caught up</p>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              Nothing needs your attention right now. We'll flag anything new here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((step) => {
            const style = PRIORITY_STYLE[step.priority];
            return (
              <div
                key={step.id}
                className="relative bg-card rounded-2xl p-5 border border-border shadow-sm overflow-hidden"
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.dot}`}
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${style.chip}`}
                  >
                    {style.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {step.estTime}
                  </span>
                </div>
                <h3 className="font-heading text-primary text-lg">{step.title}</h3>
                <p className="font-mono text-xs text-muted-foreground mt-1 leading-relaxed">
                  {step.description}
                </p>
                <button
                  onClick={() => run(step)}
                  className="mt-4 inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                >
                  {step.ctaLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default NextSteps;
