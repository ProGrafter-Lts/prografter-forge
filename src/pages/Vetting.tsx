import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const C = {
  cream: "#F5F0E8",
  deep: "#0F2238",
  navy: "#27396A",
  navyLight: "#244D78",
  teal: "#14A8A1",
  tealHover: "#14B8A8",
  tealLight: "#CCFBF1",
  tealDim: "rgba(13,148,136,0.15)",
  body: "#1F2937",
  secondary: "#4B5563",
  border: "#D1CBB8",
  white: "#FFFFFF",
  darkSurface: "#152C45",
  darkCard: "#27396A",
  darkBorder: "rgba(245,240,232,0.1)",
  dimText: "rgba(245,240,232,0.5)",
  mutedText: "rgba(245,240,232,0.75)",
  brightText: "#F5F0E8",
};

type App = {
  id: string; full_name: string; business_name: string; business_type: string;
  email: string; phone: string; address_line1: string; city: string; postcode: string;
  trade_name: string; trade_lane: "regulated" | "unregulated"; years_trading: number;
  registration_body: string | null; registration_number: string; registration_expiry: string;
  insurance_provider: string; insurance_policy_number: string; insurance_expiry: string; public_liability_cover: string;
  ref1_name: string; ref1_phone: string; ref1_relationship: string; ref1_job_description: string; ref1_job_year: number;
  ref2_name: string; ref2_phone: string; ref2_relationship: string; ref2_job_description: string; ref2_job_year: number;
  status: "received" | "under_review" | "interview_booked" | "approved" | "rejected";
  created_at: string;
  trading_history_description: string; portfolio_description: string;
  vet_companies_house_checked: boolean; vet_companies_house_notes: string;
  vet_registration_verified: boolean; vet_registration_notes: string;
  vet_insurance_verified: boolean; vet_insurance_notes: string;
  vet_ccj_checked: boolean; vet_ccj_notes: string;
  vet_ref1_called: boolean; vet_ref1_notes: string;
  vet_ref2_called: boolean; vet_ref2_notes: string;
  vet_portfolio_reviewed: boolean; vet_portfolio_notes: string;
  vet_interview_completed: boolean;
  interview_scheduled_at: string; interview_notes: string;
  admin_notes: string; rejection_reason: string;
  [key: string]: string | number | boolean | null;
};

// Live applications submitted via the 6-step `/apply` flow will populate this list
// once the application-submission edge function persists rows. Until then this
// dashboard intentionally renders empty — demo/seed rows have been removed so Lee
// never sees fictitious trades alongside real ones.
const MOCK: App[] = [];

const STATUS = {
  received: { label: "Received", bg: "rgba(13,148,136,0.1)", border: C.tealDim, text: C.teal },
  under_review: { label: "Under review", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)", text: "#F59E0B" },
  interview_booked: { label: "Interview booked", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.2)", text: "#A78BFA" },
  approved: { label: "Approved", bg: "rgba(13,148,136,0.18)", border: "rgba(13,148,136,0.3)", text: C.tealHover },
  rejected: { label: "Rejected", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", text: "#F87171" },
} as const;

type StatusKey = keyof typeof STATUS;
const STATUS_FLOW: StatusKey[] = ["received", "under_review", "interview_booked", "approved"];

const CHECKS = [
  { k: "vet_companies_house_checked", nk: "vet_companies_house_notes", label: "Companies House check", hint: "find-and-update.company-information.service.gov.uk" },
  { k: "vet_registration_verified", nk: "vet_registration_notes", label: "Registration verified", hint: "Check NICEIC / Gas Safe register directly", regulated: true },
  { k: "vet_insurance_verified", nk: "vet_insurance_notes", label: "Insurance verified", hint: "Call insurer — confirm policy is live and covers stated work" },
  { k: "vet_ccj_checked", nk: "vet_ccj_notes", label: "CCJ / insolvency check", hint: "Trust Online (£4) + GOV.UK insolvency register" },
  { k: "vet_ref1_called", nk: "vet_ref1_notes", label: "Reference 1 called", hint: "Phone call only — record outcome in notes" },
  { k: "vet_ref2_called", nk: "vet_ref2_notes", label: "Reference 2 called", hint: "Phone call only — record outcome in notes" },
  { k: "vet_portfolio_reviewed", nk: "vet_portfolio_notes", label: "Portfolio reviewed", hint: "Check photos for quality, authenticity, recency" },
  { k: "vet_interview_completed", nk: null as string | null, label: "Interview completed", hint: "Record date and outcome in interview section below" },
] as const;

const SBadge = ({ status }: { status: StatusKey }) => {
  const s = STATUS[status] || STATUS.received;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 20,
      border: `1px solid ${s.border}`, background: s.bg, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, color: s.text, letterSpacing: "0.02em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.text, flexShrink: 0 }} />
      {s.label}
    </span>
  );
};

const LBadge = ({ lane }: { lane: "regulated" | "unregulated" }) => (
  <span style={{
    borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
    background: lane === "regulated" ? C.tealDim : "rgba(245,240,232,0.08)",
    color: lane === "regulated" ? C.teal : C.mutedText,
  }}>
    {lane === "regulated" ? "REGULATED" : "UNREGULATED"}
  </span>
);

const DR = ({ label, value }: { label: string; value: string | number | null | undefined }) => value ? (
  <div style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.darkBorder}` }}>
    <dt style={{ width: 130, flexShrink: 0, fontSize: 11, color: C.dimText }}>{label}</dt>
    <dd style={{ fontSize: 11, color: C.brightText, flex: 1, margin: 0 }}>{value}</dd>
  </div>
) : null;

export default function Vetting() {
  const [apps, setApps] = useState<App[]>(MOCK);
  const [sel, setSel] = useState<App | null>(null);
  const [filter, setFilter] = useState<StatusKey | "all">("all");
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const update = (id: string, changes: Partial<App>) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a));
    setSel(prev => prev?.id === id ? { ...prev, ...changes } : prev);
  };

  const reg = sel?.trade_lane === "regulated";
  const checks = sel ? CHECKS.filter(c => !("regulated" in c && c.regulated) || reg) : [];
  const doneCount = sel ? checks.filter(c => sel[c.k]).length : 0;
  const filtered = apps.filter(a => filter === "all" || a.status === filter);

  const advance = () => {
    if (!sel) return;
    const i = STATUS_FLOW.indexOf(sel.status as StatusKey);
    if (i >= 0 && i < STATUS_FLOW.length - 1) update(sel.id, { status: STATUS_FLOW[i + 1] });
  };
  const reject = () => {
    if (sel && rejectReason.trim()) {
      update(sel.id, { status: "rejected", rejection_reason: rejectReason });
      setShowReject(false);
      setRejectReason("");
    }
  };

  const Progress = ({ app }: { app: App }) => {
    const c = CHECKS.filter(x => !("regulated" in x && x.regulated) || app.trade_lane === "regulated");
    const d = c.filter(x => app[x.k]).length;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 3, background: C.darkBorder }}>
          <div style={{ height: 3, borderRadius: 3, background: C.teal, width: `${Math.round(d / c.length * 100)}%`, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 10, color: C.dimText, minWidth: 24, textAlign: "right" }}>{d}/{c.length}</span>
      </div>
    );
  };

  const inputSt: CSSProperties = {
    width: "100%", padding: "7px 10px", borderRadius: 8,
    border: `1px solid ${C.darkBorder}`, background: "rgba(255,255,255,0.05)",
    color: C.brightText, fontSize: 12, fontFamily: "inherit", resize: "vertical",
    minHeight: 52, boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", background: C.deep }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.deep, borderBottom: `1px solid ${C.darkBorder}`, padding: "0 20px", height: 56, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="font-heading tracking-wider" style={{ fontSize: 22, fontWeight: 700 }}>
            <Logo variant="light" className="h-9 w-auto inline-block" />
          </div>
          <span style={{ color: C.darkBorder, fontSize: 16 }}>|</span>
          <span style={{ fontSize: 12, color: C.dimText, fontWeight: 500, letterSpacing: "0.05em" }}>VETTING DASHBOARD</span>
          <Link to="/admin/verifications" style={{ fontSize: 11, color: C.teal, marginLeft: 8, textDecoration: "none", letterSpacing: "0.04em" }}>
            Pre-submission queue →
          </a>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setFilter("all")} style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid ${filter === "all" ? C.teal : C.darkBorder}`, background: filter === "all" ? C.tealDim : "transparent", color: filter === "all" ? C.teal : C.dimText, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
            All ({apps.length})
          </button>
          {(Object.entries(STATUS) as [StatusKey, typeof STATUS[StatusKey]][]).map(([k, s]) => (
            <button key={k} onClick={() => setFilter(f => f === k ? "all" : k)} style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid ${filter === k ? s.border : C.darkBorder}`, background: filter === k ? s.bg : "transparent", color: filter === k ? s.text : C.dimText, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
              {s.label} ({apps.filter(a => a.status === k).length})
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 20px", background: "rgba(13,148,136,0.07)", borderBottom: `1px solid ${C.darkBorder}`, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: C.mutedText, lineHeight: 1.5 }}>
        <span><strong style={{ color: C.teal }}>This dashboard</strong> = submitted 6-step applications in active review. <a href="/admin/verifications" style={{ color: C.teal }}>/admin/verifications</a> = pre-submission queue (trades who started but haven't uploaded yet).</span>
        <span><strong style={{ color: C.teal }}>5 published checks</strong> map to internal sub-steps: ID/business (Companies House + CCJ), Insurance (1), Qualification (Registration — regulated only), References (1 &amp; 2 phoned), Portfolio &amp; Interview (2 sub-steps). Total: 8 regulated / 7 unregulated.</span>
        <span><strong style={{ color: C.teal }}>Interview booked</strong> stage is moved manually by Lee after emailing the trade a Calendly link; confirmation is sent to both parties via that booking.</span>
      </div>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 272, flexShrink: 0, borderRight: `1px solid ${C.darkBorder}`, background: C.darkSurface, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && <p style={{ fontSize: 12, color: C.dimText, textAlign: "center", paddingTop: 20 }}>No applications</p>}
          {filtered.map(app => (
            <button key={app.id} onClick={() => setSel(app)} style={{ background: sel?.id === app.id ? C.darkCard : "transparent", border: `1px solid ${sel?.id === app.id ? C.teal : C.darkBorder}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box", transition: "all 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.brightText, margin: 0, lineHeight: 1.3 }}>{app.full_name}</p>
                  {app.business_name && <p style={{ fontSize: 11, color: C.dimText, margin: "2px 0 0" }}>{app.business_name}</p>}
                </div>
                <SBadge status={app.status} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.mutedText }}>{app.trade_name}</span>
                <LBadge lane={app.trade_lane} />
              </div>
              <Progress app={app} />
              <p style={{ fontSize: 10, color: C.dimText, marginTop: 5 }}>
                {new Date(app.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </button>
          ))}
        </div>

        {sel ? (
          <div style={{ flex: 1, overflowY: "auto", padding: 24, background: C.deep }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.cream, margin: "0 0 3px" }}>{sel.full_name}</h1>
                {sel.business_name && <p style={{ fontSize: 13, color: C.mutedText, margin: "0 0 8px" }}>{sel.business_name}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SBadge status={sel.status} />
                  <LBadge lane={sel.trade_lane} />
                  <span style={{ fontSize: 11, color: C.dimText }}>
                    Applied {new Date(sel.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {sel.status !== "approved" && sel.status !== "rejected" && (
                  <>
                    <button onClick={() => setShowReject(true)} style={{ padding: "8px 14px", background: "transparent", color: "#F87171", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Reject</button>
                    {sel.status === "interview_booked"
                      ? <button onClick={() => update(sel.id, { status: "approved" })} style={{ padding: "8px 16px", background: C.teal, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Approve ✓</button>
                      : <button onClick={advance} style={{ padding: "8px 16px", background: C.navy, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          → {STATUS[STATUS_FLOW[STATUS_FLOW.indexOf(sel.status as StatusKey) + 1]]?.label}
                        </button>}
                  </>
                )}
                {sel.status === "approved" && <span style={{ padding: "8px 14px", background: C.tealDim, color: C.teal, border: `1px solid rgba(13,148,136,0.3)`, borderRadius: 8, fontSize: 12, fontWeight: 600 }}>✓ Approved</span>}
                {sel.status === "rejected" && <span style={{ padding: "8px 14px", background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12 }}>Rejected</span>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: C.darkCard, borderRadius: 12, border: `1px solid ${C.darkBorder}`, padding: "1rem" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", marginBottom: 10 }}>PERSONAL & BUSINESS</p>
                  <dl>
                    <DR label="Email" value={sel.email} />
                    <DR label="Phone" value={sel.phone} />
                    <DR label="Business type" value={sel.business_type?.replace("_", " ")} />
                    <DR label="Address" value={[sel.address_line1, sel.city, sel.postcode].filter(Boolean).join(", ")} />
                    <DR label="Trade" value={sel.trade_name} />
                    <DR label="Years trading" value={`${sel.years_trading} years`} />
                  </dl>
                </div>

                {reg && (
                  <div style={{ background: C.darkCard, borderRadius: 12, border: `1px solid rgba(13,148,136,0.25)`, padding: "1rem" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", marginBottom: 10 }}>REGISTRATION</p>
                    <dl>
                      <DR label="Body" value={sel.registration_body} />
                      <DR label="Number" value={sel.registration_number} />
                      <DR label="Expires" value={sel.registration_expiry ? new Date(sel.registration_expiry).toLocaleDateString("en-GB") : null} />
                    </dl>
                  </div>
                )}

                <div style={{ background: C.darkCard, borderRadius: 12, border: `1px solid ${C.darkBorder}`, padding: "1rem" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", marginBottom: 10 }}>INSURANCE</p>
                  <dl>
                    <DR label="Provider" value={sel.insurance_provider} />
                    <DR label="Policy no." value={sel.insurance_policy_number} />
                    <DR label="Expires" value={sel.insurance_expiry ? new Date(sel.insurance_expiry).toLocaleDateString("en-GB") : null} />
                    <DR label="Public liability" value={sel.public_liability_cover} />
                  </dl>
                </div>

                <div style={{ background: C.darkCard, borderRadius: 12, border: `1px solid ${C.darkBorder}`, padding: "1rem" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", marginBottom: 10 }}>REFERENCES</p>
                  {[
                    { n: 1, nm: sel.ref1_name, ph: sel.ref1_phone, rl: sel.ref1_relationship, jb: sel.ref1_job_description, yr: sel.ref1_job_year },
                    { n: 2, nm: sel.ref2_name, ph: sel.ref2_phone, rl: sel.ref2_relationship, jb: sel.ref2_job_description, yr: sel.ref2_job_year },
                  ].map(r => (
                    <div key={r.n} style={{ marginBottom: r.n === 1 ? 12 : 0, paddingBottom: r.n === 1 ? 12 : 0, borderBottom: r.n === 1 ? `1px solid ${C.darkBorder}` : "none" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.mutedText, marginBottom: 4 }}>Reference {r.n}</p>
                      <dl>
                        <DR label="Name" value={r.nm} />
                        <DR label="Phone" value={r.ph} />
                        <DR label="Relationship" value={r.rl} />
                        <DR label="Job" value={`${r.jb} (${r.yr})`} />
                      </dl>
                    </div>
                  ))}
                </div>

                {(sel.trading_history_description || sel.portfolio_description) && (
                  <div style={{ background: C.darkCard, borderRadius: 12, border: `1px solid ${C.darkBorder}`, padding: "1rem" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", marginBottom: 10 }}>TRADING HISTORY / PORTFOLIO</p>
                    {sel.trading_history_description && <p style={{ fontSize: 11, color: C.mutedText, lineHeight: 1.65, marginBottom: 8 }}>{sel.trading_history_description}</p>}
                    {sel.portfolio_description && <p style={{ fontSize: 11, color: C.mutedText, lineHeight: 1.65, whiteSpace: "pre-line" }}>{sel.portfolio_description}</p>}
                  </div>
                )}

                {sel.rejection_reason && (
                  <div style={{ background: "rgba(239,68,68,0.08)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)", padding: "1rem" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#F87171", letterSpacing: "0.1em", marginBottom: 8 }}>REJECTION REASON</p>
                    <p style={{ fontSize: 11, color: "#FCA5A5", lineHeight: 1.6 }}>{sel.rejection_reason}</p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: C.darkCard, borderRadius: 12, border: `1px solid ${C.darkBorder}`, padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", margin: 0 }}>VETTING CHECKLIST</p>
                    <span style={{ fontSize: 11, color: C.dimText }}>{doneCount}/{checks.length}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 3, background: C.darkBorder, marginBottom: 14 }}>
                    <div style={{ height: 3, borderRadius: 3, background: C.teal, transition: "width 0.3s", width: `${doneCount && checks.length ? Math.round(doneCount / checks.length * 100) : 0}%` }} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {checks.map(item => {
                      const done = !!sel[item.k];
                      return (
                        <div key={item.k} style={{ background: done ? "rgba(13,148,136,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${done ? "rgba(13,148,136,0.2)" : C.darkBorder}`, borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div onClick={() => update(sel.id, { [item.k]: !done } as Partial<App>)} style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, border: `1.5px solid ${done ? C.teal : "rgba(245,240,232,0.2)"}`, background: done ? C.teal : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                              {done && (
                                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={C.white} strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 12, fontWeight: 500, margin: 0, color: done ? C.teal : C.brightText, textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>
                                {item.label}
                              </p>
                              <p style={{ fontSize: 10, color: C.dimText, margin: "2px 0 6px" }}>{item.hint}</p>
                              {item.nk && (
                                <textarea
                                  placeholder="Add notes..."
                                  value={(sel[item.nk] as string) || ""}
                                  onChange={e => update(sel.id, { [item.nk as string]: e.target.value } as Partial<App>)}
                                  style={{ ...inputSt, minHeight: 44, fontSize: 11 }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: C.darkCard, borderRadius: 12, border: `1px solid ${C.darkBorder}`, padding: "1rem" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", marginBottom: 12 }}>INTERVIEW</p>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: "block", fontSize: 11, color: C.dimText, marginBottom: 5 }}>Scheduled date / time</label>
                    <input type="datetime-local" value={sel.interview_scheduled_at || ""} onChange={e => update(sel.id, { interview_scheduled_at: e.target.value })} style={{ ...inputSt, resize: "none", minHeight: "auto", padding: "7px 10px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.dimText, marginBottom: 5 }}>Notes & outcome</label>
                    <textarea rows={3} value={sel.interview_notes || ""} onChange={e => update(sel.id, { interview_notes: e.target.value })} placeholder="Record observations from the interview call..." style={inputSt} />
                  </div>
                </div>

                <div style={{ background: C.darkCard, borderRadius: 12, border: `1px solid ${C.darkBorder}`, padding: "1rem" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", marginBottom: 12 }}>ADMIN NOTES</p>
                  <textarea rows={4} value={sel.admin_notes || ""} onChange={e => update(sel.id, { admin_notes: e.target.value })} placeholder="Internal notes — not visible to the applicant..." style={inputSt} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: C.deep }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.darkCard, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={C.dimText} strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p style={{ fontSize: 13, color: C.dimText }}>Select an application to review</p>
            </div>
          </div>
        )}
      </div>

      {showReject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: C.darkSurface, borderRadius: 16, border: `1px solid ${C.darkBorder}`, padding: 24, width: "100%", maxWidth: 420, margin: "0 1rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.cream, marginBottom: 4 }}>Reject application</h2>
            <p style={{ fontSize: 12, color: C.dimText, marginBottom: 16 }}>Provide a clear reason. Stored internally — share with the applicant at your discretion.</p>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Unable to verify NICEIC registration / Reference 2 raised concerns about reliability..." style={{ ...inputSt, marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowReject(false); setRejectReason(""); }} style={{ padding: "8px 16px", border: `1px solid ${C.darkBorder}`, borderRadius: 8, fontSize: 12, background: "transparent", cursor: "pointer", color: C.mutedText }}>Cancel</button>
              <button onClick={reject} disabled={!rejectReason.trim()} style={{ padding: "8px 16px", background: rejectReason.trim() ? "#DC2626" : "rgba(220,38,38,0.3)", color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: rejectReason.trim() ? "pointer" : "not-allowed" }}>Confirm rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
