import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Small technical label with a teal rule — the ProGrafter section marker. */
export const SectionLabel = ({
  children,
  tone = "dark",
  className,
}: {
  children: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) => (
  <div className={cn("flex items-center gap-3", className)}>
    <span className="h-[2px] w-8 bg-teal" aria-hidden />
    <span
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.24em]",
        tone === "dark" ? "text-teal" : "text-teal",
      )}
    >
      {children}
    </span>
  </div>
);

/**
 * Short editorial statement used as a graphic device between sections.
 * Decorative by intent — never a replacement for explanatory copy.
 */
export const EditorialStatement = ({
  lines,
  note,
  tone = "dark",
  align = "left",
  className,
}: {
  lines: string[];
  note?: string;
  tone?: "dark" | "light";
  align?: "left" | "center";
  className?: string;
}) => (
  <section
    className={cn(
      "relative overflow-hidden px-6 py-14 craft:py-16",
      tone === "dark" ? "bg-deep" : "bg-cream",
      className,
    )}
  >
    <div
      className={cn(
        "relative z-10 mx-auto flex max-w-5xl flex-col gap-4 craft:flex-row craft:items-end",
        align === "center" ? "text-center craft:justify-center" : "craft:justify-between",
      )}
    >
      <p
        className={cn(
          "font-heading text-4xl uppercase leading-[0.95] craft:text-6xl",
          tone === "dark" ? "text-cream" : "text-navy",
        )}
      >
        {lines.map((line, i) => (
          <span key={line} className="block">
            {i === lines.length - 1 ? <span className="text-teal">{line}</span> : line}
          </span>
        ))}
      </p>
      {note && (
        <p
          className={cn(
            "max-w-xs font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em]",
            tone === "dark" ? "text-cream/45" : "text-secondary-text",
          )}
        >
          {note}
        </p>
      )}
    </div>
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-px",
        tone === "dark" ? "bg-cream/10" : "bg-navy/10",
      )}
    />
  </section>
);

/** Browser-style frame used to present real ProGrafter interface imagery. */
export const DeviceFrame = ({
  src,
  alt,
  caption,
  label,
  className,
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
  label?: string;
  className?: string;
}) => (
  <figure
    className={cn(
      "overflow-hidden rounded-lg border border-navy/10 bg-card shadow-[0_18px_40px_-24px_rgba(11,31,51,0.55)]",
      className,
    )}
  >
    <div className="flex items-center gap-2 border-b border-navy/10 bg-navy/[0.04] px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-navy/15" aria-hidden />
      <span className="h-2.5 w-2.5 rounded-full bg-navy/15" aria-hidden />
      <span className="h-2.5 w-2.5 rounded-full bg-navy/15" aria-hidden />
      {label && (
        <span className="ml-2 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-secondary-text">
          {label}
        </span>
      )}
    </div>
    <img src={src} alt={alt} loading="lazy" className="w-full" />
    {caption && (
      <figcaption className="border-t border-navy/10 p-4 font-body text-sm leading-relaxed text-secondary-text">
        {caption}
      </figcaption>
    )}
  </figure>
);

/** Oversized low-opacity number/word used as an architectural annotation. */
export const GhostMark = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    aria-hidden
    className={cn(
      "pointer-events-none select-none font-heading uppercase leading-none text-cream/[0.04]",
      className,
    )}
  >
    {children}
  </span>
);

export const PublicSceneHero = ({
  image,
  imageAlt,
  eyebrow,
  title,
  highlight,
  intro,
  primaryCta,
  secondaryCta,
  annotation,
  phases,
}: {
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  highlight?: string;
  intro: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  annotation?: string[];
  phases?: string[];
}) => (
  <section className="public-scene-hero">
    <div className="public-scene-hero__image">
      <img src={image} alt={imageAlt} width={1280} height={1024} />
    </div>
    <div className="public-scene-hero__grid" aria-hidden />
    <div className="public-scene-container public-scene-hero__inner">
      <div className="public-scene-hero__copy">
        <p className="public-scene-eyebrow">{eyebrow}</p>
        <h1>{title}{highlight && <span>{highlight}</span>}</h1>
        <p className="public-scene-hero__intro">{intro}</p>
        {(primaryCta || secondaryCta) && <div className="public-scene-actions">
          {primaryCta && <Button asChild variant="cta" size="lg"><Link to={primaryCta.href}>{primaryCta.label}<ArrowRight /></Link></Button>}
          {secondaryCta && <Button asChild variant="outline" size="lg"><Link to={secondaryCta.href}>{secondaryCta.label}</Link></Button>}
        </div>}
      </div>
      {annotation && <p className="public-scene-annotation">{annotation.map((line, index) => <span key={line} className={index === annotation.length - 1 ? "is-accent" : undefined}>{line}</span>)}</p>}
      {phases && <div className="public-scene-phases" aria-hidden>{phases.map((phase) => <span key={phase}>{phase}</span>)}</div>}
    </div>
  </section>
);

export type VisualSequenceItem = {
  num: string;
  title: string;
  description: string;
  evidence: string;
  image: string;
  alt: string;
  icon: LucideIcon;
};

export const VisualSequence = ({ items, className }: { items: VisualSequenceItem[]; className?: string }) => (
  <div className={cn("public-visual-sequence", className)}>
    {items.map(({ num, title, description, evidence, image, alt, icon: Icon }) => (
      <article key={num} className="public-visual-step">
        <div className="public-visual-step__marker"><span>{num}</span><i aria-hidden /></div>
        <div className="public-visual-step__image">
          <img src={image} alt={alt} loading="lazy" />
          <div className="public-visual-step__shade" />
          <Icon aria-hidden />
          <p>{evidence}</p>
        </div>
        <div className="public-visual-step__copy">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </article>
    ))}
  </div>
);
