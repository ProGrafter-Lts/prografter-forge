import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const ContentHero = ({
  eyebrow,
  title,
  highlight,
  intro,
  ghost,
  image,
  imageAlt = "",
  primaryCta,
  secondaryCta,
  tone = "dark",
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  intro: string;
  ghost?: string;
  image?: string;
  imageAlt?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** "light" gives content-led pages a cream, drafting-paper hero. */
  tone?: "dark" | "light";
}) => (
  <section
    className={
      tone === "light"
        ? "public-drafting relative overflow-hidden bg-cream px-6 pb-20 pt-36"
        : "public-blueprint relative overflow-hidden bg-deep px-6 pb-20 pt-36"
    }
  >
    {image && <div className="content-hero-image"><img src={image} alt={imageAlt} width={1280} height={1024} /></div>}
    {ghost && (
      <span
        className={`absolute -bottom-8 right-0 font-heading text-[140px] craft:text-[260px] select-none pointer-events-none leading-none ${tone === "light" ? "text-navy" : "text-cream"}`}
        style={{ opacity: tone === "light" ? 0.05 : 0.03 }}
      >
        {ghost}
      </span>
    )}
    <div className="max-w-4xl mx-auto relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-[2px] bg-teal" />
        <span className="font-mono text-xs text-teal uppercase tracking-widest">{eyebrow}</span>
      </div>
      <h1 className={`type-h1 mb-6 ${tone === "light" ? "text-navy" : "text-cream"}`}>
        {title}
        {highlight && (
          <>
            <br />
            <span className="text-teal">{highlight}</span>
          </>
        )}
      </h1>
      <p
        className={`font-body text-lg craft:text-xl font-light max-w-2xl leading-relaxed ${tone === "light" ? "text-secondary-text" : "text-cream/80"}`}
      >
        {intro}
      </p>
      {(primaryCta || secondaryCta) && (
        <div className="flex flex-col craft:flex-row gap-4 mt-9">
          {primaryCta && (
            <Button asChild variant="cta" size="lg"><Link to={primaryCta.href}>{primaryCta.label}</Link></Button>
          )}
          {secondaryCta && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className={
                tone === "light"
                  ? "border-navy/25 bg-transparent text-navy hover:border-teal hover:bg-transparent hover:text-teal"
                  : "border-cream/30 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"
              }
            >
              <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
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
  <section className={`px-6 py-16 craft:py-20 ${tone === "white" ? "bg-card" : "bg-cream"}`}>
    <div className="max-w-5xl mx-auto">
      {title && (
        <h2 className="type-h2 mb-4 max-w-3xl text-navy">
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
      <div key={it.title} className="flex gap-5 rounded-[4px] bg-card border border-border/60 p-6 shadow-sm">
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
      <div key={it.title} className="rounded-[4px] bg-card border border-border/60 p-6 shadow-sm hover:shadow-md hover:border-teal/40 transition-all">
        {it.icon && (
          <div className="h-11 w-11 rounded-[4px] bg-teal/10 border border-teal/25 flex items-center justify-center font-heading text-teal text-xl mb-4">
            {it.icon}
          </div>
        )}
        <h3 className="font-heading text-navy text-xl leading-tight mb-2">{it.title}</h3>
        <p className="font-body text-sm text-body-text leading-relaxed">{it.desc}</p>
      </div>
    ))}
  </div>
);

export const FaqBlock = ({
  items,
}: {
  items: { q: string; a: string; link?: { label: string; href: string } }[];
}) => (
  <div className="space-y-3 max-w-3xl">
    {items.map((it) => (
      <details key={it.q} className="group rounded-[4px] bg-card border border-border/60 p-5 shadow-sm">
        <summary className="flex items-center justify-between cursor-pointer font-heading text-navy text-lg leading-tight list-none">
          {it.q}
          <span className="ml-4 text-teal transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
        </summary>
        <p className="font-body text-sm text-body-text leading-relaxed mt-3">{it.a}</p>
        {it.link && (
          <Link to={it.link.href} className="mt-3 inline-flex font-mono text-xs uppercase tracking-[0.14em] text-teal-ink">
            {it.link.label} →
          </Link>
        )}
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
  <section className="public-blueprint bg-navy px-6 py-20 craft:py-24">
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="type-h2 mb-4 text-cream">{title}</h2>
      <p className="font-body text-cream/80 text-lg font-light mb-9 max-w-xl mx-auto">{intro}</p>
      <div className="flex flex-col craft:flex-row gap-4 justify-center">
        <Button asChild variant="cta" size="lg"><Link to={primary.href}>{primary.label}</Link></Button>
        {secondary && (
          <Button asChild variant="outline" size="lg" className="border-cream/30 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"><Link to={secondary.href}>{secondary.label}</Link></Button>
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
