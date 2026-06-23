import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import SEO from "@/components/SEO";

const C = {
  cream: "#F5F0E8", deep: "#0F2238", teal: "#14A8A1",
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
  existing_quotes_count?: number | null;
  scoping_notes?: string | null; scoped_at?: string | null;
  planning_notes?: string | null; planning_guidance_at?: string | null;
  override_reason?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  new: { label: "New", bg: "#E5E7EB", fg: "#374151" },
  under_review: { label: "Under review", bg: "#DBEAFE", fg: "#1E40AF" },
  awaiting_scoping: { label: "Awaiting scoping", bg: "#FEF3C7", fg: "#92400E" },
  scoped: { label: "Scoped", bg: "#CCFBF1", fg: "#0F766E" },
  approved: { label: "Approved", bg: "#DCFCE7", fg: "#166534" },
  published_to_trades: { label: "Published to trades", bg: "#D1FAE5", fg: "#065F46" },
};

const StatusPill = ({ status }: { status: string }) => {
  const s = STATUS_LABELS[status] || { label: status, bg: "#E5E7EB", fg: "#374151" };
  return (
    <span style={{ fontSize: 10, background: s.bg, color: s.fg, padding: "2px 8px", borderRadius: 999, fontWeight: 700, letterSpacing: "0.02em" }}>
      {s.label}
    </span>
  );
};

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
  const [busy, setBusy] = useState<string | null>(null);

  const patchBrief = (id: string, patch: Partial<Brief>) =>
    setBriefs((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const publish = async (b: Brief, overrideReason?: string) => {
    setPublishing(b.id);
    // Ensure a fresh, valid access token is attached before invoking the
    // admin-only function — a stale/expiring token causes a 401.
    const { data: sessionData } = await supabase.auth.getSession();
    let accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      accessToken = refreshed.session?.access_token;
    }
    if (!accessToken) {
      setPublishing(null);
      alert("Your admin session has expired. Please sign in again, then retry.");
      return;
    }
    const { data, error } = await supabase.functions.invoke("publish-job-brief", {
      body: { brief_id: b.id, override_reason: overrideReason || null },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setPublishing(null);
    if (error) { alert("Publish failed: " + error.message); return; }
    const matched = (data as any)?.matched ?? 0;
    alert(`Published to trades. ${matched} matched trade(s) notified.`);
    patchBrief(b.id, {
      status: "published_to_trades",
      published_at: new Date().toISOString(),
      matched_trade_count: matched,
      override_reason: overrideReason || null,
    });
  };

  // Record a scoping call: capture notes + editable scope fields, clear the flag.
  const recordScoping = async (b: Brief) => {
    const notes = prompt("Scoping call notes (what was agreed):", b.scoping_notes || "");
    if (notes === null) return;
    const scopeItems = prompt("Scope of works (edit/confirm):", b.scope_items || "");
    if (scopeItems === null) return;
    const knownIssues = prompt("Known issues (edit/confirm):", b.known_issues || "");
    if (knownIssues === null) return;
    setBusy(b.id);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("job_briefs" as any).update({
      scoping_notes: notes,
      scope_items: scopeItems,
      known_issues: knownIssues,
      needs_scoping: false,
      status: "scoped",
      scoped_by: u.user?.id ?? null,
      scoped_at: new Date().toISOString(),
    }).eq("id", b.id);
    setBusy(null);
    if (error) { alert("Save failed: " + error.message); return; }
    patchBrief(b.id, {
      scoping_notes: notes, scope_items: scopeItems, known_issues: knownIssues,
      needs_scoping: false, status: "scoped", scoped_at: new Date().toISOString(),
    });
  };

  // Record planning guidance given: capture notes, clear the flag.
  const recordPlanning = async (b: Brief) => {
    const notes = prompt("Planning guidance given (notes):", b.planning_notes || "");
    if (notes === null) return;
    setBusy(b.id);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("job_briefs" as any).update({
      planning_notes: notes,
      needs_planning_guidance: false,
      planning_guidance_by: u.user?.id ?? null,
      planning_guidance_at: new Date().toISOString(),
    }).eq("id", b.id);
    setBusy(null);
    if (error) { alert("Save failed: " + error.message); return; }
    patchBrief(b.id, {
      planning_notes: notes, needs_planning_guidance: false,
      planning_guidance_at: new Date().toISOString(),
    });
  };

  const approveAndPublish = (b: Brief) => {
    const blocked = b.needs_scoping || b.needs_planning_guidance;
    if (!blocked) { publish(b); return; }
    // Deliberate override path — requires a reason and is logged.
    const flags = [b.needs_scoping ? "NEEDS SCOPING" : null, b.needs_planning_guidance ? "PLANNING GUIDANCE" : null].filter(Boolean).join(" + ");
    const reason = prompt(`This brief still has blocking flag(s): ${flags}.\nPublishing now is an override. Enter a reason to proceed (required):`, "");
    if (reason === null) return;
    if (!reason.trim()) { alert("An override reason is required to publish a flagged brief."); return; }
    publish(b, reason.trim());
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
                    <span style={{ marginLeft: 8 }}><StatusPill status={b.status} /></span>
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
                    <Field label="Status" value={(STATUS_LABELS[b.status]?.label) || b.status} />
                    <Field label="Existing quotes" value={b.existing_quotes_count ?? null} />
                    <Field label="Matched trades" value={b.matched_trade_count} />
                    <Field label="Needs scoping" value={b.needs_scoping ? "Yes — homeowner requested scoping call" : null} />
                    <Field label="Planning guidance" value={b.needs_planning_guidance ? "Yes — homeowner unsure on planning/regs" : null} />
                    <Field label="Scoping notes" value={b.scoping_notes} />
                    <Field label="Planning notes" value={b.planning_notes} />
                    <Field label="Override reason" value={b.override_reason} />

                    <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {b.needs_scoping && (
                        <button
                          onClick={() => recordScoping(b)}
                          disabled={busy === b.id}
                          style={{ background: "#0F766E", color: C.white, border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: busy === b.id ? 0.6 : 1 }}
                        >
                          {busy === b.id ? "Saving…" : "Record scoping call"}
                        </button>
                      )}
                      {b.needs_planning_guidance && (
                        <button
                          onClick={() => recordPlanning(b)}
                          disabled={busy === b.id}
                          style={{ background: "#991B1B", color: C.white, border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: busy === b.id ? 0.6 : 1 }}
                        >
                          {busy === b.id ? "Saving…" : "Record planning guidance given"}
                        </button>
                      )}
                    </div>

                    {(b.needs_scoping || b.needs_planning_guidance) && (
                      <div style={{ marginTop: 10, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", borderRadius: 8, padding: "10px 12px", fontSize: 12, lineHeight: 1.5 }}>
                        <strong>Blocking flag present.</strong> Clear the flag(s) above before a clean publish.
                        Publishing now requires a logged override reason.
                      </div>
                    )}

                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => approveAndPublish(b)}
                        disabled={publishing === b.id}
                        style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: publishing === b.id ? 0.6 : 1 }}
                      >
                        {publishing === b.id
                          ? "Publishing…"
                          : b.published_at
                            ? "Re-publish to matched trades"
                            : (b.needs_scoping || b.needs_planning_guidance)
                              ? "Publish anyway (override)"
                              : "Approve & publish to trades"}
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
