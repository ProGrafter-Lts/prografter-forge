import { Link } from "react-router-dom";

type Card = {
  title: string;
  cta: string;
  route: string;
};

const CARDS: Card[] = [
  { title: "I’m planning a project", cta: "Project Cost Guide", route: "/project-cost-guide" },
  { title: "I already have a quote", cta: "Run Quote Checker", route: "/quote-checker" },
  { title: "I need trusted trades", cta: "Post a Project", route: "/post-job-brief" },
  { title: "I’m a trade", cta: "Join ProGrafter", route: "/signup/trade" },
];

const WhereAreYouSection = () => {
  return (
    <section className="px-6 py-20 bg-cream">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl text-navy tracking-wide text-center mb-3">
          Where are you in your project?
        </h2>
        <p className="text-center font-mono text-xs text-secondary-text mb-12">
          Powered by ProGrafter Intelligence™
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              to={c.route}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 hover:border-teal hover:shadow-xl hover:shadow-teal/10 transition-all"
            >
              <h3 className="font-heading text-xl text-navy tracking-wide mb-6">{c.title}</h3>
              <span className="w-full text-center font-mono text-sm px-4 py-2.5 rounded-xl bg-teal text-cream hover:bg-teal-hover transition-colors">
                {c.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhereAreYouSection;

