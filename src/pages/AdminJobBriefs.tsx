import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import SEO from "@/components/SEO";

const C = {
  cream: "#F5F0E8", deep: "#0F2238", teal: "#0D9488",
  dimText: "rgba(245,240,232,0.78)", darkBorder: "rgba(245,240,232,0.22)",
  white: "#FFFFFF", border: "#E2E0DA", secondary: "#6B6B6B",
};

const ADMIN_NAV = [
  { to: "/admin", label: "← Admin" },
  { to: "/admin/verifications", label: "Verifications" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/job-briefs", label: "Job briefs" },
  { to: "/admin/suppliers", label: "Suppliers" },
  { to: "/admin/disputes", label: "Disputes" },
];

function AdminNav() {
  const { pathname } = useLocation();
  return (
    <div style={{ background: "#0A1A2E", padding: "8px 24px", display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${C.darkBorder}` }}>
      {ADMIN_NAV.map((n) => {
        const active = pathname === n.to;
        return (
          <NavLink key={n.to} to={n.to} style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, textDecoration: "none", letterSpacing: "0.03em", color: active ? C.deep : C.dimText, background: active ? C.teal : "transparent" }}>
            {n.label}
          </NavLink>
        );
      })}
    </div>
  );
}

interface Brief {
  id: string; ref: string; full_name: string; email: string; phone: string;
  address_line1: string; address_line2: string | null; city: string; postcode: string;
  property_type: string | null; trade_category_id: string | null; job_title: string | null;
  job_description: string | null; planning_permission: string | null; building_regs: string | null;
  scope_items: string | null; known_issues: string | null; access_arrangement: string | null;
  parking_available: string | null; preferred_days: string | null; additional_notes: string | null;
  budget_band: string | null; timeline: string | null; quotes_received: string | null;
  decision_criteria: string | null; status: string; is_test: boolean; created_at: string;
  published_at?: string | null; matched_trade_count?: number | null;
  needs_scoping?: boolean | null; needs_planning_guidance?: boolean | null;
}

const Field = ({ label, value }: { label: string; value: any }) =>
  value ? (
    <div style={{ display: "flex", gap: 8, padding: "3px 0" }}>
      <span style={{ width: 150, flexShrink: 0, fontSize: 12, color: C.secondary }}>{label}</span>
      <span style={{ fontSize: 12, color: C.deep, flex: 1 }}>{value}</span>
    </div>
  ) : null;

export default function AdminJobBriefs() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("job_briefs" as any)
        .select("*")
        .order("created_at", { ascending: false });
      setBriefs((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const [publishing, setPublishing] = useState<string | null>(null);
  const publish = async (b: Brief) => {
    setPublishing(b.id);
    const { data, error } = await supabase.functions.invoke("publish-job-brief", {
      body: { brief_id: b.id },
    });
    setPublishing(null);
    if (error) { alert("Publish failed: " + error.message); return; }
    const matched = (data as any)?.matched ?? 0;
    alert(`Published to trades. ${matched} matched trade(s) notified.`);
    setBriefs((prev) => prev.map((x) => x.id === b.id
      ? { ...x, status: "published", published_at: new Date().toISOString(), matched_trade_count: matched }
      : x));
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <SEO title="Job briefs — Admin" description="Review submitted homeowner job briefs" noindex />
      <div style={{ background: C.deep, padding: "16px 24px", color: C.white }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Job briefs</div>
      </div>
      <AdminNav />
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
        {loading ? (
          <p style={{ color: C.secondary }}>Loading…</p>
        ) : briefs.length === 0 ? (
          <p style={{ color: C.secondary }}>No job briefs submitted yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {briefs.map((b) => (
              <div key={b.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <button
                  onClick={() => setOpen(open === b.id ? null : b.id)}
                  style={{ width: "100%", textAlign: "left", padding: "14px 18px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                >
                  <div>
                    <span style={{ fontFamily: "monospace", color: C.teal, fontWeight: 700, fontSize: 13 }}>{b.ref}</span>
                    {b.is_test && <span style={{ marginLeft: 8, fontSize: 10, background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 4 }}>TEST</span>}
                    {b.needs_scoping && <span style={{ marginLeft: 8, fontSize: 10, background: "#CCFBF1", color: "#0F766E", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>NEEDS SCOPING</span>}
                    {b.needs_planning_guidance && <span style={{ marginLeft: 8, fontSize: 10, background: "#FEE2E2", color: "#991B1B", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>PLANNING GUIDANCE</span>}
                    <div style={{ fontSize: 13, color: C.deep, marginTop: 2 }}>
                      {b.full_name} — {b.job_title || "Untitled"}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: C.secondary }}>{format(new Date(b.created_at), "d MMM yyyy, HH:mm")}</span>
                </button>
                {open === b.id && (
                  <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${C.border}` }}>
                    <Field label="Reference" value={b.ref} />
                    <Field label="Name" value={b.full_name} />
                    <Field label="Email" value={b.email} />
                    <Field label="Phone" value={b.phone} />
                    <Field label="Address" value={[b.address_line1, b.address_line2, b.city].filter(Boolean).join(", ")} />
                    <Field label="Postcode" value={b.postcode} />
                    <Field label="Property type" value={b.property_type} />
                    <Field label="Trade" value={b.trade_category_id} />
                    <Field label="Job title" value={b.job_title} />
                    <Field label="Description" value={b.job_description} />
                    <Field label="Budget" value={b.budget_band} />
                    <Field label="Timeline" value={b.timeline} />
                    <Field label="Access" value={b.access_arrangement} />
                    <Field label="Parking" value={b.parking_available} />
                    <Field label="Preferred days" value={b.preferred_days} />
                    <Field label="Planning permission" value={b.planning_permission} />
                    <Field label="Building regs" value={b.building_regs} />
                    <Field label="Scope items" value={b.scope_items} />
                    <Field label="Known issues" value={b.known_issues} />
                    <Field label="Quotes received" value={b.quotes_received} />
                    <Field label="Decision criteria" value={b.decision_criteria} />
                    <Field label="Notes" value={b.additional_notes} />
                    <Field label="Status" value={b.status} />
                    <Field label="Matched trades" value={b.matched_trade_count} />
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => publish(b)}
                        disabled={publishing === b.id}
                        style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: publishing === b.id ? 0.6 : 1 }}
                      >
                        {publishing === b.id ? "Publishing…" : b.published_at ? "Re-publish to matched trades" : "Approve & publish to trades"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
