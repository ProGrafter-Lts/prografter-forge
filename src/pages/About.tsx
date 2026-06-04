import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { localBusinessJsonLd } from "@/lib/seoSchemas";

const About = () => {
  return (
    <AppShell>
      <SEO
        title="Why I Built ProGrafter — Lee's Story"
        description="ProGrafter founder Lee on twenty-seven years on the tools, what kept going wrong on site, and why he built a system that protects homeowners and trades alike."
        path="/about"
        jsonLd={localBusinessJsonLd}
      />

      <div className="bg-deep">
        {/* Hero */}
        <section className="relative pt-32 pb-16 px-6 overflow-hidden">
          <span
            className="absolute -bottom-8 right-0 font-heading text-[140px] craft:text-[240px] text-cream select-none pointer-events-none leading-none"
            style={{ opacity: 0.03 }}
          >
            STORY
          </span>
          <div className="max-w-6xl mx-auto relative z-10 grid craft:grid-cols-[1.4fr_1fr] gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-[2px] bg-teal" />
                <span className="font-mono text-xs text-teal uppercase tracking-widest">
                  Why I Built ProGrafter
                </span>
              </div>
              <h1 className="font-heading text-cream text-[40px] craft:text-[72px] leading-[0.98] max-w-3xl">
                I've stood on both sides of the job.
              </h1>
            </div>

            {/* Founder photo slot */}
            <div className="hidden craft:flex aspect-[4/5] w-full rounded-2xl border border-cream/15 bg-navy/40 items-center justify-center">
              <span className="font-mono text-xs text-secondary-text uppercase tracking-widest text-center px-6">
                Founder photo
              </span>
            </div>
          </div>
        </section>

        {/* Story body */}
        <section className="px-6 pb-20">
          <div className="max-w-2xl mx-auto space-y-7 font-body text-cream/90 text-lg craft:text-xl leading-loose font-light">
            <p>
              I'm Lee. I've been a builder for twenty-seven years — on the tools
              since I was sixteen. Development sites, refurbishments and
              extensions, mostly across Nottinghamshire. I trained as an
              electrician along the way and qualified in 2013, but building came
              first, and it always has. I'm not a tech bloke who hired a
              tradesman to sound credible. I am the tradesman.
            </p>
            <p>
              Twenty-seven years on site teaches you the job from both ends.
              I've been the one putting a quote in and waiting weeks to hear
              back. I've watched good builds go sideways over something that was
              never written down. And I've sat across the table from homeowners
              who'd saved for years — people spending money they couldn't afford
              to lose, with no wriggle room in it — and watched them get nervous,
              or get let down by someone who should never have been let loose on
              their home.
            </p>
            <p>
              Life's thrown a few things at me as well. In 2009 I had an accident
              that, by rights, should have finished me on the tools. It didn't —
              I adapted, I carried on, and I qualified anyway a few years later.
              I'm not telling you that for sympathy, and it doesn't define me.
              But it's part of why I understand that work, like life, doesn't
              always go to plan — and that what matters isn't whether something
              goes wrong, it's whether there's a fair way to put it right.
            </p>
            <p>
              The things that gave me restless nights were never the hard graft.
              It was everything around it. Quotes that drag on for weeks.
              Communication that falls apart the moment a job gets complicated.
              Variations agreed on a handshake that turn into arguments about
              money. And the one that does the most damage to everyone — getting
              to the end of a job, signed off and done right, and still having to
              chase to get paid.
            </p>
            <p>
              Trades don't get an easy ride from the platforms that are meant to
              help them, either. I once spent £625 buying leads from one of them
              and won not a single job. Paying to work, and getting nothing back.
              Good trades carry that cost whether the work comes or not — and the
              homeowner's side of it wasn't being fixed by anyone either.
            </p>
            <p>
              So I built ProGrafter. Not a set of promises — a system. Everything
              documented and accounted for, from the first quote to the final
              sign-off. Money held safely and released as the work is genuinely
              done. Every change agreed in writing before anyone lifts a tool.
              And if something does go wrong, a fair process with the evidence to
              back it.
            </p>
            <p>
              The point of it is simple. For the homeowner: your money protected,
              and the satisfaction of a job done properly — no nasty surprises
              halfway through, no being left in the dark on your own home. For
              the trade: getting paid fairly for good work, and a reputation
              built on what you actually produce and how you carry yourself — not
              on who shouts loudest or pays the most for leads.
            </p>
            <p className="text-cream font-normal">
              I built this because I've stood on both sides of it, and I believe
              both sides deserve better. Whether you're the one paying for the
              work or the one doing it — ProGrafter is built to look after you.
            </p>

            {/* Sign-off */}
            <div className="pt-6">
              <p className="font-heading text-cream text-[32px] craft:text-[40px] leading-none">
                — Lee
              </p>
              <p className="font-mono text-xs text-secondary-text uppercase tracking-widest mt-3">
                Founder, ProGrafter · builder, 27 years on the tools
              </p>
            </div>
          </div>
        </section>

        {/* Company info */}
        <section className="px-6 py-12 border-t border-cream/5">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-mono text-xs text-secondary-text uppercase tracking-widest">
              ProGrafter Ltd · Company 17124130 · ICO ZC114018
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default About;
