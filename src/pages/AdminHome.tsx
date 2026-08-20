import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const SECTIONS: { to: string; label: string; desc: string }[] = [
  { to: "/admin/waitlist", label: "Waitlist signups", desc: "Early-access signups; dismiss out-of-area" },
  { to: "/admin/applications", label: "Trade Applications", desc: "Single review queue: all trade applications, documents and references" },
  { to: "/admin/verifications", label: "Legacy signups (archive)", desc: "Read-only: 13 pre-submission signups from the old flow. Being retired — do not use for new applications" },
  { to: "/admin/tradevault", label: "TradeVault", desc: "Review trade documents: insurance, quals, accreditations" },
  { to: "/admin/job-briefs", label: "Job briefs", desc: "Homeowner job briefs submitted" },
  { to: "/admin/scoping-calls", label: "Customer Discovery", desc: "Guided scoping & discovery calls with homeowners" },
  { to: "/admin/lead-distribution", label: "Lead distribution", desc: "Which trades got which briefs; area balance" },
  { to: "/admin/disputes", label: "Disputes", desc: "Open and resolved disputes" },
  { to: "/admin/suppliers", label: "Suppliers", desc: "Supplier directory" },
  { to: "/admin/testimonials", label: "Testimonials", desc: "Review submitted testimonials" },
  { to: "/admin/planning-pipeline", label: "Planning pipeline", desc: "Planning leads pipeline" },
  { to: "/admin/trade-scraper", label: "Trade scraper", desc: "Source and import trades" },
  { to: "/admin/email-status", label: "Email status", desc: "Email delivery and queue" },
  { to: "/admin/quote-standards", label: "Quote Standards", desc: "Manage trade-specific quote check standards & versions" },
  { to: "/admin/quote-checker-modules", label: "Quote Checker Modules", desc: "Module status & homeowner manual review requests" },
  { to: "/admin/advanced-quote-review", label: "Advanced Review Engine", desc: "Full fixed-standard checklist, project-readiness & audit trail (beta)" },
  { to: "/admin/analytics", label: "Analytics", desc: "Traffic and conversions (GA4)" },
];

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Admin — ProGrafter" description="ProGrafter admin dashboard" noindex />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl text-navy">Admin dashboard</h1>
          <p className="font-body text-secondary-text mt-1">Choose a section to manage.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group block rounded-2xl bg-white border border-navy/10 p-5 transition-all hover:-translate-y-0.5 hover:border-teal hover:shadow-lg hover:shadow-navy/5 focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-heading text-lg text-navy group-hover:text-teal transition-colors">
                  {s.label}
                </span>
                <span className="font-mono text-teal opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                  →
                </span>
              </div>
              <p className="mt-1.5 font-body text-sm text-secondary-text leading-snug">
                {s.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
