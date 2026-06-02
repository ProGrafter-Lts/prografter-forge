import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";

const C = {
  cream:"#F5F0E8", deep:"#0F2238", navy:"#27396A",
  teal:"#14A8A1", brightText:"#F5F0E8", dimText:"rgba(245,240,232,0.78)",
  darkSurface:"#152C45", darkCard:"#27396A", darkBorder:"rgba(245,240,232,0.22)",
  white:"#FFFFFF", red:"#DC2626", redBorder:"#FECACA", amber:"#D97706", amberBorder:"#FDE68A",
  green:"#16A34A", greenBorder:"#BBF7D0", purple:"#7C3AED", purpleBorder:"#DDD6FE",
  amberBg:"#FFFBEB", redBg:"#FEF2F2", greenBg:"#F0FDF4", purpleBg:"#F5F3FF",
};

const ADMIN_NAV = [
  { to: "/admin", label: "← Admin" },
  { to: "/vetting", label: "Vetting" },
  { to: "/admin/verifications", label: "Verifications" },
  { to: "/admin/suppliers", label: "Suppliers" },
  { to: "/admin/email-status", label: "Email Status" },
  { to: "/admin/disputes", label: "Disputes" },
  { to: "/admin/testimonials", label: "Testimonials" },
];

function AdminNav() {
  const { pathname } = useLocation();
  return (
    <div style={{ background:"#0A1A2E", padding:"8px 24px", display:"flex",
      gap:4, flexWrap:"wrap", borderBottom:`1px solid ${C.darkBorder}` }}>
      {ADMIN_NAV.map(n => {
        const active = pathname === n.to;
        return (
          <NavLink key={n.to} to={n.to}
            style={{ fontSize:12, fontWeight:600, padding:"6px 12px", borderRadius:6,
              textDecoration:"none", letterSpacing:"0.03em",
              color: active ? C.deep : C.dimText,
              background: active ? C.teal : "transparent" }}>
            {n.label}
          </NavLink>
        );
      })}
    </div>
  );
}

const FILTERS = [
  { key: "all",               label: "All" },
  { key: "under_review",      label: "New / Under Review" },
  { key: "awaiting_response", label: "Awaiting Response" },
  { key: "resolved",          label: "Resolved" },
  { key: "escalated",         label: "Escalated" },
] as const;
type FilterKey = typeof FILTERS[number]["key"];

const STATUS_CFG: Record<string,{label:string;bg:string;border:string;text:string}> = {
  under_review:      { label:"Under review",       bg:C.purpleBg,  border:C.purpleBorder, text:C.purple },
  awaiting_response: { label:"Awaiting response",  bg:C.amberBg,   border:C.amberBorder,  text:C.amber  },
  resolved:          { label:"Resolved",           bg:C.greenBg,   border:C.greenBorder,  text:C.green  },
  escalated:         { label:"Escalated",          bg:C.redBg,     border:C.redBorder,    text:C.red    },
};

const fmt = (pence?: number | null) => pence ? `£${(pence/100).toLocaleString("en-GB",{maximumFractionDigits:0})}` : "—";

const SBadge = ({ status }: { status: string }) => {
  const s = STATUS_CFG[status] || STATUS_CFG.under_review;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, borderRadius:20,
      border:`1px solid ${s.border}`, background:s.bg,
      padding:"3px 9px", fontSize:11, fontWeight:600, color:s.text }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.text }} />
      {s.label}
    </span>
  );
};

type Dispute = {
  id: string; ref: string; job_id: string;
  raised_by_role: string; reason_label: string | null;
  amount_disputed_pence: number | null; frozen_amount_pence: number | null;
  claimant_statement: string; respondent_statement: string | null;
  desired_outcome: string | null; status: string;
  recommendation: string | null; resolution: string | null;
  created_at: string;
};

type EventItem = { id:string; event_type:string; event_text:string; occurred_at:string };

export default function AdminDisputes() {
  const [list, setList] = useState<Dispute[]>([]);
  const [sel, setSel] = useState<Dispute | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [recommendation, setRecommendation] = useState("");
  const [showRecommend, setShowRecommend] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [workflowOpen, setWorkflowOpen] = useState(false);

  const loadList = async () => {
    const { data } = await supabase.from("disputes").select("*").order("created_at", { ascending: false });
    setList((data as Dispute[]) || []);
  };
  useEffect(() => { loadList(); }, []);

  const loadDetail = async (d: Dispute) => {
    setSel(d);
    setRecommendation(d.recommendation || "");
    setShowRecommend(false);
    const { data: ev } = await supabase.from("dispute_events").select("*")
      .eq("dispute_id", d.id).order("occurred_at", { ascending: true });
    setEvents((ev as EventItem[]) || []);
  };

  const issueRecommendation = async (resolution: "claimant"|"respondent"|"split") => {
    if (!sel || !recommendation.trim()) return;
    setSaving(true);
    await supabase.from("disputes").update({
      recommendation, resolution, status: "resolved", resolved_at: new Date().toISOString(),
    }).eq("id", sel.id);
    await supabase.from("dispute_events").insert({
      dispute_id: sel.id, event_type: "system",
      event_text: `Recommendation issued — finding for ${resolution}`,
    });
    setSaving(false);
    setShowRecommend(false);
    loadList();
    const { data } = await supabase.from("disputes").select("*").eq("id", sel.id).maybeSingle();
    if (data) loadDetail(data as Dispute);
  };

  const escalate = async () => {
    if (!sel) return;
    setSaving(true);
    await supabase.from("disputes").update({ status: "escalated" }).eq("id", sel.id);
    await supabase.from("dispute_events").insert({
      dispute_id: sel.id, event_type: "system", event_text: "Escalated to independent adjudicator",
    });
    setSaving(false);
    loadList();
    const { data } = await supabase.from("disputes").select("*").eq("id", sel.id).maybeSingle();
    if (data) loadDetail(data as Dispute);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.cream }}>
      <div style={{ background:C.deep, padding:"14px 24px",
        display:"flex", alignItems:"center", gap:12 }}>
        <div className="font-heading tracking-wider" style={{ fontSize:24, fontWeight:700 }}>
          <Logo variant="light" className="h-9 w-auto inline-block" />
        </div>
        <span style={{ color:"rgba(245,240,232,0.45)" }}>|</span>
        <span style={{ fontSize:12, color:"rgba(245,240,232,0.78)", letterSpacing:"0.05em" }}>
          ADMIN · DISPUTE MANAGEMENT
        </span>
      </div>

      <AdminNav />

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"1.5rem 1rem" }}>
        {/* Resolution workflow — collapsible operational reference */}
        <div style={{ background:"#FFFBEB", border:`1px solid ${C.amberBorder}`,
          borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
          <button onClick={() => setWorkflowOpen(o => !o)}
            style={{ background:"none", border:"none", padding:0, cursor:"pointer",
              display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left" }}>
            <span style={{ fontSize:14 }}>{workflowOpen ? "▼" : "▶"}</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.amber, letterSpacing:"0.06em",
              textTransform:"uppercase" }}>
              Dispute resolution workflow
            </span>
          </button>
          {workflowOpen && (
            <ol style={{ margin:"10px 0 0 28px", padding:0, color:"#78350F",
              fontSize:13, lineHeight:1.7 }}>
              <li><b>Acknowledge</b> within 1 working day of dispute being raised.</li>
              <li><b>Request evidence</b> from both parties — messages, photos, variation sign-offs, payment records.</li>
              <li><b>Review evidence</b> against the signed contract and variation records.</li>
              <li><b>Issue a mediation decision</b> (find for claimant / respondent / split) with full reasoning.</li>
              <li><b>If unresolved:</b> escalate to formal process (procedure to be defined in legal pack).</li>
            </ol>
          )}
        </div>

        {/* Required card-field reference — visible until first real dispute lands */}
        {list.length === 0 && (
          <div style={{ background:C.darkSurface, border:`1px solid ${C.darkBorder}`,
            borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.teal, letterSpacing:"0.08em",
              textTransform:"uppercase", margin:"0 0 8px" }}>
              Dispute card — required fields
            </p>
            <p style={{ fontSize:12, color:C.dimText, lineHeight:1.6, margin:0 }}>
              Ref · date raised · who raised it (role + name) · respondent (name + company) ·
              project ref + address · type (Payment / Quality / Scope / Variation / Other) ·
              status · brief description · link to full project (messages, variations, photos,
              payment records) · timestamped action log of ProGrafter mediation steps.
            </p>
          </div>
        )}

        <div style={{ background:C.deep, borderRadius:16,
          border:`1px solid ${C.darkBorder}`, padding:"1.25rem" }}>
          <p style={{ fontSize:10, fontWeight:700, color:C.teal,
            letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 14px" }}>
            All disputes ({list.length})
          </p>

          {/* Status filter tabs */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {FILTERS.map(f => {
              const count = f.key === "all" ? list.length : list.filter(d => d.status === f.key).length;
              const active = filter === f.key;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ background: active ? C.teal : "transparent",
                    color: active ? C.deep : C.dimText,
                    border:`1px solid ${active ? C.teal : C.darkBorder}`,
                    borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:600,
                    cursor:"pointer" }}>
                  {f.label} ({count})
                </button>
              );
            })}
          </div>

          {(() => {
            const filtered = filter === "all" ? list : list.filter(d => d.status === filter);
            if (filtered.length === 0) {
              return (
                <div style={{ padding:"20px 4px" }}>
                  <p style={{ color:C.brightText, fontSize:13, margin:"0 0 6px", fontWeight:600 }}>
                    No disputes {filter === "all" ? "raised yet" : `in “${FILTERS.find(f=>f.key===filter)?.label}”`}.
                  </p>
                  <p style={{ color:C.dimText, fontSize:12, lineHeight:1.6, margin:0 }}>
                    When a dispute is raised by a trade or homeowner, it will appear here for review
                    and mediation. ProGrafter aims to respond to all disputes within 1 working day.
                  </p>
                </div>
              );
            }
            return null;
          })()}

          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {(filter === "all" ? list : list.filter(d => d.status === filter)).map(d => {
              const ageDays = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000);
              return (
                <div key={d.id} onClick={() => loadDetail(d)}
                  style={{ background: sel?.id===d.id ? C.darkCard : C.darkSurface,
                    border:`1px solid ${sel?.id===d.id ? C.teal : C.darkBorder}`,
                    borderRadius:10, padding:"10px 14px", cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", gap:8 }}>
                    <div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                        <span style={{ fontSize:11, fontFamily:"'DM Mono', monospace", color:C.teal }}>{d.ref}</span>
                        <SBadge status={d.status} />
                      </div>
                      <p style={{ fontSize:11, color:C.dimText, margin:0 }}>
                        {d.reason_label || "—"} · raised by {d.raised_by_role}
                      </p>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:C.brightText, margin:"0 0 2px" }}>
                        {fmt(d.amount_disputed_pence)}
                      </p>
                      <p style={{ fontSize:10, color: ageDays>3 ? "#F87171" : C.dimText, margin:0 }}>
                        {ageDays} {ageDays === 1 ? "day" : "days"} open
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {sel && (
            <div>
              <div style={{ background:C.darkCard, borderRadius:12,
                border:`1px solid ${C.darkBorder}`, padding:"14px", marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div>
                    <span style={{ fontSize:12, fontFamily:"'DM Mono', monospace", color:C.teal, marginRight:8 }}>{sel.ref}</span>
                    <SBadge status={sel.status} />
                  </div>
                  <p style={{ fontSize:16, fontWeight:700, color:C.red, margin:0 }}>
                    {fmt(sel.amount_disputed_pence)} disputed
                  </p>
                </div>
                <p style={{ fontSize:10, fontWeight:700, color:C.red,
                  letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 6px" }}>
                  Claimant statement ({sel.raised_by_role})
                </p>
                <p style={{ fontSize:12, color:C.brightText, lineHeight:1.65,
                  margin:"0 0 12px", whiteSpace:"pre-wrap" }}>{sel.claimant_statement}</p>

                <p style={{ fontSize:10, fontWeight:700, color:C.teal,
                  letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 6px" }}>
                  Respondent statement
                </p>
                <p style={{ fontSize:12, color:C.brightText, lineHeight:1.65,
                  margin:"0 0 12px", whiteSpace:"pre-wrap" }}>
                  {sel.respondent_statement || <span style={{ color:C.dimText, fontStyle:"italic" }}>Not yet submitted</span>}
                </p>

                <p style={{ fontSize:10, fontWeight:700, color:C.teal,
                  letterSpacing:"0.08em", textTransform:"uppercase", margin:"12px 0 8px" }}>
                  Timeline
                </p>
                {events.map(e => (
                  <div key={e.id} style={{ display:"flex", gap:10,
                    padding:"6px 0", borderBottom:`1px solid ${C.darkBorder}` }}>
                    <div style={{ width:8, height:8, borderRadius:"50%",
                      background: e.event_type === "dispute" ? "#F87171"
                        : e.event_type === "system" ? "#A78BFA" : C.teal,
                      flexShrink:0, marginTop:6 }} />
                    <div>
                      <p style={{ fontSize:12, color:C.brightText, margin:0 }}>{e.event_text}</p>
                      <p style={{ fontSize:10, color:C.dimText, margin:"2px 0 0" }}>
                        {new Date(e.occurred_at).toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {sel.status === "resolved" ? (
                <div style={{ background:C.darkCard, borderRadius:10,
                  border:`1px solid ${C.darkBorder}`, padding:"12px 14px" }}>
                  <p style={{ fontSize:11, color:C.teal, margin:"0 0 8px", fontWeight:700 }}>
                    ✓ Resolved — finding for {sel.resolution}
                  </p>
                  <p style={{ fontSize:12, color:C.brightText, lineHeight:1.65,
                    margin:0, whiteSpace:"pre-wrap" }}>{sel.recommendation}</p>
                </div>
              ) : !showRecommend ? (
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setShowRecommend(true)}
                    style={{ flex:1, background:C.teal, color:C.white, border:"none",
                      borderRadius:8, padding:"11px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    Issue recommendation
                  </button>
                  <button onClick={escalate} disabled={saving}
                    style={{ flex:1, background:"none", border:`1px solid ${C.redBorder}`,
                      color:"#F87171", borderRadius:8, padding:"11px",
                      fontSize:13, cursor: saving ? "wait" : "pointer" }}>
                    Escalate to adjudicator
                  </button>
                </div>
              ) : (
                <div style={{ background:C.darkCard, borderRadius:10,
                  border:`1px solid ${C.darkBorder}`, padding:"14px" }}>
                  <p style={{ fontSize:10, fontWeight:700, color:C.teal,
                    letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 10px" }}>
                    Issue recommended resolution
                  </p>
                  <textarea rows={5} value={recommendation}
                    onChange={e => setRecommendation(e.target.value)}
                    placeholder="Set out ProGrafter's recommended resolution with full reasoning…"
                    style={{ width:"100%", padding:"8px 10px", borderRadius:7,
                      border:`1px solid ${C.darkBorder}`, background:"rgba(255,255,255,0.05)",
                      color:C.brightText, fontSize:12, fontFamily:"inherit",
                      resize:"vertical", boxSizing:"border-box", marginBottom:10, outline:"none" }} />
                  <div style={{ display:"flex", gap:8 }}>
                    {[
                      { label:"Find for claimant", color:C.red, key:"claimant" as const },
                      { label:"Find for respondent", color:C.teal, key:"respondent" as const },
                      { label:"Split — partial", color:C.amber, key:"split" as const },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => issueRecommendation(opt.key)}
                        disabled={saving || !recommendation.trim()}
                        style={{ flex:1, background:"none", border:`1px solid ${opt.color}`,
                          color:opt.color, borderRadius:7, padding:"8px 6px",
                          fontSize:11, fontWeight:600,
                          cursor: (saving || !recommendation.trim()) ? "not-allowed" : "pointer",
                          opacity: (saving || !recommendation.trim()) ? 0.6 : 1 }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
