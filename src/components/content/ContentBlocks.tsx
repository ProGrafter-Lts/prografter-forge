import { type ReactNode } from "react";

export const ContentHero = ({
  eyebrow,
  title,
  highlight,
  intro,
  ghost,
  primaryCta,
  secondaryCta,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  intro: string;
  ghost?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}) => (
  <section className="relative pt-32 pb-16 px-6 overflow-hidden bg-deep">
    {ghost && (
      <span
        className="absolute -bottom-8 right-0 font-heading text-[140px] craft:text-[260px] text-cream select-none pointer-events-none leading-none"
        style={{ opacity: 0.03 }}
      >
        {ghost}
      </span>
    )}
    <div className="max-w-4xl mx-auto relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-[2px] bg-teal" />
        <span className="font-mono text-xs text-teal uppercase tracking-widest">{eyebrow}</span>
      </div>
      <h1 className="font-heading text-cream text-[40px] craft:text-[72px] leading-[0.95] mb-6">
        {title}
        {highlight && (
          <>
            <br />
            <span className="text-teal">{highlight}</span>
          </>
        )}
      </h1>
      <p className="font-body text-cream/80 text-lg craft:text-xl font-light max-w-2xl leading-relaxed">
        {intro}
      </p>
      {(primaryCta || secondaryCta) && (
        <div className="flex flex-col craft:flex-row gap-4 mt-9">
          {primaryCta && (
            <a
              href={primaryCta.href}
              className="inline-flex items-center justify-center gap-2 bg-teal text-cream font-mono text-sm px-8 py-4 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5"
            >
              {primaryCta.label}
            </a>
          )}
          {secondaryCta && (
            <a
              href={secondaryCta.href}
              className="inline-flex items-center justify-center border border-cream/30 text-cream font-mono text-sm px-8 py-4 rounded-xl hover:border-teal hover:text-teal transition-colors"
            >
              {secondaryCta.label}
            </a>
          )}
        </div>
      )}
    </div>
  </section>
);

export const ContentSection = ({
  title,
  intro,
  children,
  tone = "cream",
}: {
  title?: string;
  intro?: string;
  children: ReactNode;
  tone?: "cream" | "white";
}) => (
  <section className={`px-6 py-16 craft:py-20 ${tone === "white" ? "bg-white" : "bg-cream"}`}>
    <div className="max-w-5xl mx-auto">
      {title && (
        <h2 className="font-heading text-navy text-[30px] craft:text-[42px] leading-tight mb-4 max-w-3xl">
          {title}
        </h2>
      )}
      {intro && <p className="font-body text-secondary-text text-lg max-w-2xl mb-10">{intro}</p>}
      {children}
    </div>
  </section>
);

export const StepList = ({
  items,
}: {
  items: { title: string; desc: string }[];
}) => (
  <div className="space-y-4">
    {items.map((it, i) => (
      <div key={it.title} className="flex gap-5 rounded-2xl bg-white border border-border/60 p-6 shadow-sm">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal text-cream font-mono text-sm flex items-center justify-center">
          {i + 1}
        </div>
        <div>
          <h3 className="font-heading text-navy text-xl leading-tight mb-1">{it.title}</h3>
          <p className="font-body text-sm text-body-text leading-relaxed">{it.desc}</p>
        </div>
      </div>
    ))}
  </div>
);

export const FeatureGrid = ({
  items,
  cols = 3,
}: {
  items: { title: string; desc: string; icon?: string }[];
  cols?: 2 | 3;
}) => (
  <div className={`grid grid-cols-1 ${cols === 2 ? "craft:grid-cols-2" : "craft:grid-cols-3"} gap-4 craft:gap-5`}>
    {items.map((it) => (
      <div key={it.title} className="rounded-2xl bg-white border border-border/60 p-6 shadow-sm hover:shadow-md hover:border-teal/40 transition-all">
        {it.icon && (
          <div className="h-11 w-11 rounded-xl bg-teal/10 border border-teal/25 flex items-center justify-center font-heading text-teal text-xl mb-4">
            {it.icon}
          </div>
        )}
        <h3 className="font-heading text-navy text-xl leading-tight mb-2">{it.title}</h3>
        <p className="font-body text-sm text-body-text leading-relaxed">{it.desc}</p>
      </div>
    ))}
  </div>
);

export const FaqBlock = ({ items }: { items: { q: string; a: string }[] }) => (
  <div className="space-y-3 max-w-3xl">
    {items.map((it) => (
      <details key={it.q} className="group rounded-2xl bg-white border border-border/60 p-5 shadow-sm">
        <summary className="flex items-center justify-between cursor-pointer font-heading text-navy text-lg leading-tight list-none">
          {it.q}
          <span className="ml-4 text-teal transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
        </summary>
        <p className="font-body text-sm text-body-text leading-relaxed mt-3">{it.a}</p>
      </details>
    ))}
  </div>
);

export const ContentCta = ({
  title,
  intro,
  primary,
  secondary,
}: {
  title: string;
  intro: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) => (
  <section
    className="px-6 py-20 craft:py-24 bg-navy"
    style={{ background: "linear-gradient(135deg, #27396A 0%, #0F1F38 100%)" }}
  >
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="font-heading text-cream text-[30px] craft:text-[46px] leading-tight mb-4">{title}</h2>
      <p className="font-body text-cream/80 text-lg font-light mb-9 max-w-xl mx-auto">{intro}</p>
      <div className="flex flex-col craft:flex-row gap-4 justify-center">
        <a
          href={primary.href}
          className="inline-flex items-center justify-center gap-2 bg-teal text-cream font-mono text-sm px-8 py-4 rounded-xl hover:bg-teal-hover transition-all shadow-lg shadow-teal/30 hover:-translate-y-0.5"
        >
          {primary.label}
        </a>
        {secondary && (
          <a
            href={secondary.href}
            className="inline-flex items-center justify-center border border-cream/30 text-cream font-mono text-sm px-8 py-4 rounded-xl hover:border-teal hover:text-teal transition-colors"
          >
            {secondary.label}
          </a>
        )}
      </div>
    </div>
  </section>
);

export const buildFaqJsonLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((it) => ({
    "@type": "Question",
    name: it.q,
    acceptedAnswer: { "@type": "Answer", text: it.a },
  })),
});
