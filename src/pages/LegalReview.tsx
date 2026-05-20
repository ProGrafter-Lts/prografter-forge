import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import { LEGAL_REVIEW_ETA } from "@/components/LegalReviewBanner";
import { ShieldCheck, FileText, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const LegalReview = () => {
  return (
    <AppShell>
      <SEO
        title="Contract templates under legal review — ProGrafter"
        description="Why ProGrafter's contract templates are under final review with a construction solicitor before signing activates."
        noindex
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          to="/"
          className="font-mono text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back home
        </Link>

        <h1 className="font-heading text-3xl md:text-4xl text-primary mb-3">
          Contract templates: under final legal review
        </h1>
        <p className="font-mono text-sm text-muted-foreground mb-8">
          A short, honest note on where we are with the contract layer of ProGrafter.
        </p>

        <div className="space-y-6 font-mono text-sm leading-relaxed text-foreground">
          <div className="bg-card border border-border rounded-2xl p-5 flex gap-4">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading text-primary text-lg mb-2">Why this matters</h2>
              <p>
                A bad contract is worse than no contract. Construction projects go wrong because
                the paperwork is vague, missing, or copy-pasted from a template that doesn't fit
                the actual job. We're not willing to ship that to homeowners or trades — so the
                core legal text is being drafted by a specialist construction solicitor, not by us.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 flex gap-4">
            <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading text-primary text-lg mb-2">What you can do today</h2>
              <p className="mb-2">
                The platform generates a fully-structured contract from your accepted quote — seven
                sections, project-specific data populated from your profile, and space for bespoke
                terms either party can add.
              </p>
              <p className="mb-4">
                You can review the full document, discuss it with the other party, and add bespoke
                clauses. Signing is temporarily disabled until the solicitor's text replaces the
                placeholder body copy in each section.
              </p>
              <Link
                to="/dashboard/trade"
                className="inline-flex items-center gap-2 bg-teal text-cream font-mono text-sm px-6 py-2.5 rounded-xl hover:bg-teal/90 transition-colors"
              >
                Generate your contract
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 flex gap-4">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading text-primary text-lg mb-2">Timeline</h2>
              <p>
                Estimated delivery from the solicitor: <strong>{LEGAL_REVIEW_ETA}</strong>. When
                the final template is approved we'll flip signing on automatically — no action
                needed from you. Contracts you generate now will continue to reference the
                placeholder version; new contracts after that date will use the approved version.
              </p>
            </div>
          </div>

          <div className="bg-muted/40 border border-border rounded-2xl p-5">
            <h2 className="font-heading text-primary text-lg mb-2">Questions?</h2>
            <p>
              Email{" "}
              <a href="mailto:hello@prografter.co.uk" className="text-teal underline">
                hello@prografter.co.uk
              </a>{" "}
              and we'll get back to you the same working day.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default LegalReview;
