const PILLARS = [
  {
    title: "No monthly fees for trades",
    desc: "Commission-only. We earn 7.5% when a job completes and you've been paid — capped at £900. No subscriptions, no lead fees.",
    icon: "£",
  },
  {
    title: "5-step trade verification",
    desc: "ID, insurance, qualifications, references and history — checked before any trade is approved. Not a paid listing.",
    icon: "✓",
  },
  {
    title: "Homeowner verification",
    desc: "Real, verified homeowners with genuine projects. Trades bid on real work, not tyre-kickers.",
    icon: "◎",
  },
  {
    title: "Two-way reviews",
    desc: "Homeowners and trades review each other. Accountability runs both ways — the way it should.",
    icon: "⇄",
  },
  {
    title: "AI Quote Checker",
    desc: "Upload a builder's quote and get an instant, construction-aware review of what's included, unclear or missing.",
    icon: "✦",
  },
  {
    title: "AI Quote Checker",
    desc: "A construction-aware review of a builder's quote, scored 0–100 for clarity and completeness.",
    icon: "◆",
  },
  {
    title: "Manual review of job briefs",
    desc: "Every homeowner brief is checked by a human before it reaches trades — better matches, fewer wasted quotes.",
    icon: "❏",
  },
  {
    title: "Transparent commission model",
    desc: "One fair, capped fee. No hidden costs, no surprise charges, no pay-to-play rankings.",
    icon: "≡",
  },
];

const WhyProGrafter = () => {
  return (
    <section className="bg-background py-16 craft:py-24 px-6" id="why">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">Why ProGrafter?</span>
            <div className="w-8 h-[2px] bg-teal" />
          </div>
          <h2 className="font-heading text-navy text-[32px] craft:text-[48px] leading-tight max-w-3xl mx-auto">
            Not Checkatrade. Not MyBuilder. Not Rated People.
          </h2>
          <p className="font-body text-secondary-text max-w-2xl mx-auto mt-4">
            Those sell leads. ProGrafter builds trust — with intelligent technology, genuine
            verification and real accountability at every stage.
          </p>
        </div>

        <div className="grid grid-cols-1 craft:grid-cols-2 gap-4 craft:gap-5">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="flex gap-4 rounded-2xl bg-white border border-border/60 p-6 shadow-sm hover:shadow-md hover:border-teal/40 transition-all"
            >
              <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center font-heading text-teal text-xl">
                {p.icon}
              </div>
              <div>
                <h3 className="font-heading text-navy text-xl leading-tight mb-1">{p.title}</h3>
                <p className="font-body text-sm text-body-text leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyProGrafter;
