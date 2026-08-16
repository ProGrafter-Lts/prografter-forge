import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";

export const LEGAL_LAST_UPDATED = "16 August 2026";

interface LegalLayoutProps {
  title: string;
  seoTitle: string;
  description: string;
  path: string;
  intro?: ReactNode;
  children: ReactNode;
}

/** Shared shell for ProGrafter's self-hosted legal pages. */
const LegalLayout = ({ title, seoTitle, description, path, intro, children }: LegalLayoutProps) => (
  <AppShell>
    <SEO title={seoTitle} description={description} path={path} />
    <main className="px-6 pt-28 pb-16">
      <article className="mx-auto max-w-4xl rounded-2xl border border-navy/10 bg-white p-6 shadow-sm craft:p-10">
        <h1 className="font-heading text-3xl text-navy craft:text-4xl">{title}</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-secondary-text mt-3">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>
        {intro && <div className="font-body text-secondary-text mt-4 space-y-3">{intro}</div>}
        <div className="mt-8 space-y-8 font-body text-body-text leading-relaxed">{children}</div>
        <p className="mt-10 border-t border-navy/10 pt-6 font-mono text-xs text-secondary-text">
          ProGrafter Ltd · Company number 17124130 · ICO registration ZC114018 · Registered office:
          66 Paul Street, London EC2A 4NA ·{" "}
          <a href="mailto:hello@prografter.co.uk" className="text-teal hover:underline">
            hello@prografter.co.uk
          </a>
        </p>
        <p className="mt-3 font-body text-xs text-secondary-text">
          These policies are reviewed periodically as the platform grows.
        </p>
      </article>
    </main>
  </AppShell>
);

export const Section = ({ heading, children }: { heading: string; children: ReactNode }) => (
  <section>
    <h2 className="font-heading text-xl text-navy">{heading}</h2>
    <div className="mt-2 space-y-2">{children}</div>
  </section>
);

export default LegalLayout;
