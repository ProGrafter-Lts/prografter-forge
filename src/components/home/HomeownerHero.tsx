import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Users, Home } from "lucide-react";
import heroImage from "@/assets/home/hero-blueprint-build.jpg";

const INDICATORS = [
  { icon: ShieldCheck, title: "Verified Trades", desc: "Five checks. No exceptions." },
  { icon: Users, title: "Clearer Quotes", desc: "Like-for-like and easy to compare." },
  { icon: Home, title: "Project Control", desc: "Keep everything in one place." },
];

const HomeownerHero = () => {
  return (
    <section className="relative overflow-hidden bg-deep">
      {/* Architectural visual */}
      <div className="absolute inset-y-0 right-0 w-full craft:w-[58%]">
        <img
          src={heroImage}
          alt="Modern residential extension shown transitioning from blueprint wireframe into the finished building"
          width={1280}
          height={1024}
          className="h-full w-full object-cover opacity-45 craft:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep via-deep/85 craft:via-deep/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-transparent to-deep/40" />
      </div>

      {/* Drafting annotations */}
      <div className="hidden craft:block absolute top-32 right-10 text-right pointer-events-none">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cream/70 leading-relaxed">
          Better Homes
          <br />
          Brighter Outcomes
        </p>
        <div className="ml-auto mt-2 w-12 h-[2px] bg-teal" />
      </div>
      <div className="hidden craft:block absolute top-[46%] right-16 pointer-events-none">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cream/65 leading-relaxed -rotate-6">
          Real People.
          <br />
          Real Progress.
        </p>
      </div>
      <div className="hidden craft:block absolute bottom-24 right-10 pointer-events-none border-l border-cream/20 pl-4">
        {["Plan", "Compare", "Build", "Complete"].map((s) => (
          <p key={s} className="font-mono text-[10px] uppercase tracking-[0.3em] text-cream/55 leading-loose">
            {s}
          </p>
        ))}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-32 craft:pt-36 pb-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cream/70 mb-5">
            A Clearer Way To Build
          </p>

          <h1 className="font-heading uppercase text-cream text-[42px] craft:text-[76px] leading-[0.92] mb-6">
            Home building work,
            <br />
            without the guesswork.
          </h1>

          <p className="font-body text-cream/85 text-base craft:text-lg leading-relaxed max-w-xl mb-8">
            Check quotes, find verified trades, and manage your project with clarity. ProGrafter gives
            homeowners the confidence to build, renovate and improve — the right way.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-5">
            <Link
              to="/quote-checker"
              className="inline-flex items-center justify-center gap-3 bg-teal text-cream font-body text-sm font-semibold uppercase tracking-wide px-7 py-4 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5"
            >
              Check My Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/post-job-brief"
              className="inline-flex items-center justify-center gap-3 border border-cream/30 bg-navy/40 text-cream font-body text-sm font-semibold uppercase tracking-wide px-7 py-4 rounded-xl hover:border-teal hover:text-teal transition-colors backdrop-blur-sm"
            >
              Find A Trade
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.18em] text-cream underline underline-offset-4 decoration-teal hover:text-teal transition-colors"
          >
            How It Works
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
            {INDICATORS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-teal shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="font-body text-[13px] font-semibold uppercase tracking-wide text-cream leading-tight">
                    {title}
                  </p>
                  <p className="font-body text-xs text-cream/65 mt-1 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeownerHero;
