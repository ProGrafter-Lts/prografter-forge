import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const C = {
  cream: "#F5F0E8", deep: "#0F2238", teal: "#0D9488", white: "#FFFFFF",
  border: "#E2E0DA", secondary: "#6B6B6B", dark: "#0A1A2E",
};

const SECTIONS: { to: string; label: string; desc: string }[] = [
  { to: "/admin/applications", label: "Applications", desc: "Review trade applications and references" },
  { to: "/admin/verifications", label: "Verifications", desc: "Approve, query or reject pending trades" },
  { to: "/admin/job-briefs", label: "Job briefs", desc: "Homeowner job briefs submitted" },
  { to: "/admin/disputes", label: "Disputes", desc: "Open and resolved disputes" },
  { to: "/admin/suppliers", label: "Suppliers", desc: "Supplier directory" },
  { to: "/admin/testimonials", label: "Testimonials", desc: "Review submitted testimonials" },
  { to: "/admin/planning-pipeline", label: "Planning pipeline", desc: "Planning leads pipeline" },
  { to: "/admin/trade-scraper", label: "Trade scraper", desc: "Source and import trades" },
  { to: "/admin/email-status", label: "Email status", desc: "Email delivery and queue" },
  { to: "/admin/analytics", label: "Analytics", desc: "Traffic and conversions (GA4)" },
];

export default function AdminHome() {
  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <SEO title="Admin — ProGrafter" description="ProGrafter admin dashboard" noindex />
      <div style={{ background: C.dark, padding: "20px 24px" }}>
        <h1 style={{ color: C.white, fontSize: 20, fontWeight: 800, margin: 0 }}>ProGrafter Admin</h1>
        <p style={{ color: "rgba(245,240,232,0.7)", fontSize: 13, margin: "4px 0 0" }}>
          Choose a section to manage.
        </p>
      </div>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {SECTIONS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            style={{ display: "block", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, textDecoration: "none" }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: C.deep, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: C.secondary, lineHeight: 1.4 }}>{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
