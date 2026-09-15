import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
            tone === "dark" ? "text-cream/70" : "text-secondary-text",
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
  mobileFocus = "center",
  className,
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
  label?: string;
  mobileFocus?: "left" | "center" | "right";
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
    <div className="device-frame__screen">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          "device-frame__image",
          mobileFocus === "left" && "device-frame__image--left",
          mobileFocus === "right" && "device-frame__image--right",
        )}
      />
    </div>
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

export type PublicJourneyStep = {
  num: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  icon: LucideIcon;
  note?: string;
};

/** The connected numbered journey established by How It Works. */
export const PublicJourney = ({
  id,
  label,
  title,
  description,
  steps,
  tone,
}: {
  id: string;
  label: string;
  title: ReactNode;
  description: string;
  steps: PublicJourneyStep[];
  tone: "homeowner" | "trade";
}) => (
  <section id={id} className={`hiw-journey hiw-journey--${tone}`}>
    <div className="hiw-container">
      <div className="hiw-section-heading">
        <div>
          <p className="hiw-eyebrow">{label}</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      <div className="hiw-journey-grid">
        {steps.map(({ num, title: stepTitle, description: stepDescription, image, alt, icon: Icon, note }) => (
          <article key={num} className="hiw-step">
            <div className="hiw-step-marker">
              <span>{num}</span>
              <i aria-hidden="true" />
            </div>
            <div className="hiw-step-image">
              <img src={image} alt={alt} loading="lazy" width={1024} height={1280} />
              <div className="hiw-step-image-shade" aria-hidden="true" />
              <Icon className="hiw-step-icon" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="hiw-step-copy">
              <h3>{stepTitle}</h3>
              <p>{stepDescription}</p>
              {note && <span className="hiw-step-note">{note}</span>}
            </div>
          </article>
        ))}
      </div>
      <div className="hiw-shared-truth" aria-label="One shared project principle">
        <span>One project record.</span>
        <span>Two views.</span>
        <strong>Same truth.</strong>
      </div>
    </div>
  </section>
);
