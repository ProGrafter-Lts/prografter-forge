import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";

const C = {
  cream:"#F5F0E8", deep:"#0F2238", navy:"#27396A",
  teal:"#14A8A1", body:"#1F2937", secondary:"#4B5563",
  border:"#D1CBB8", white:"#FFFFFF",
  amber:"#D97706", amberBg:"#FFFBEB", amberBorder:"#FDE68A",
  green:"#16A34A", greenBg:"#F0FDF4", greenBorder:"#BBF7D0",
  red:"#DC2626", redBg:"#FEF2F2", redBorder:"#FECACA",
  purple:"#7C3AED", purpleBg:"#F5F3FF", purpleBorder:"#DDD6FE",
};

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
  id: string; ref: string; job_id: string; raised_by_user_id: string;
  raised_by_role: string; reason_label: string | null;
  amount_disputed_pence: number | null; frozen_amount_pence: number | null;
  claimant_statement: string; respondent_statement: string | null;
  desired_outcome: string | null; status: string;
  recommendation: string | null; resolution: string | null; resolved_at: string | null;
  created_at: string;
};

type EventItem = { id:string; event_type:string; event_text:string; occurred_at:string };

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [job, setJob] = useState<{ ref:string; title:string|null } | null>(null);
  const [meRole, setMeRole] = useState<"homeowner"|"trade"|"admin"|"observer">("observer");
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("disputes").select("*").eq("id", id).maybeSingle();
    if (error || !data) { setErr("Dispute not found or access denied."); return; }
    setDispute(data as Dispute);
    setResponse(data.respondent_statement || "");

    const { data: jobData } = await supabase.from("jobs").select("ref, title, homeowner_id").eq("id", data.job_id).maybeSingle();
    if (jobData) setJob({ ref: jobData.ref, title: jobData.title });

    const { data: ev } = await supabase.from("dispute_events").select("*")
      .eq("dispute_id", id).order("occurred_at", { ascending: true });
    setEvents((ev as EventItem[]) || []);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: adminRow } = await supabase.from("user_roles")
      .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (adminRow) { setMeRole("admin"); return; }
    if (data.raised_by_user_id === user.id) {
      setMeRole(data.raised_by_role as "homeowner" | "trade");
    } else {
      // they are the respondent — opposite role
      setMeRole(data.raised_by_role === "homeowner" ? "trade" : "homeowner");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const submitResponse = async () => {
    if (!dispute || !response.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("disputes")
      .update({ respondent_statement: response, status: "under_review" })
      .eq("id", dispute.id);
    if (!error) {
      await supabase.from("dispute_events").insert({
        dispute_id: dispute.id, event_type: "dispute", event_text: "Respondent statement submitted",
      });
      await supabase.from("dispute_events").insert({
        dispute_id: dispute.id, event_type: "system", event_text: "ProGrafter review commenced",
      });
    }
    setSaving(false);
    load();
  };

  if (err) return (
    <div style={{ minHeight:"100vh", background:C.cream, padding:"3rem 1rem",
      display:"flex", justifyContent:"center" }}>
      <p style={{ color:C.red }}>{err}</p>
    </div>
  );
  if (!dispute) return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex",
      alignItems:"center", justifyContent:"center", color:C.secondary }}>
      Loading…
    </div>
  );

  const isRespondent = dispute.raised_by_user_id !== null
    && (meRole === "homeowner" || meRole === "trade")
    && meRole !== dispute.raised_by_role;
  const canRespond = isRespondent && !dispute.respondent_statement;

  return (
    <div style={{ minHeight:"100vh", background:C.cream }}>
      <div style={{ background:C.deep, padding:"14px 24px",
        display:"flex", alignItems:"center", gap:12 }}>
        <div className="font-heading tracking-wider" style={{ fontSize:24, fontWeight:700 }}>
          <Logo variant="light" className="h-9 w-auto inline-block" />
        </div>
        <span style={{ color:"rgba(245,240,232,0.45)" }}>|</span>
        <span style={{ fontSize:12, color:"rgba(245,240,232,0.78)", letterSpacing:"0.05em" }}>
          DISPUTE · {dispute.ref}
        </span>
      </div>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"1.5rem 1rem" }}>
        {/* Header card */}
        <div style={{ background:C.white, border:`1.5px solid ${C.border}`,
          borderRadius:14, padding:"1rem 1.25rem", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
            <div>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:12, fontFamily:"'DM Mono', monospace", color:C.teal }}>{dispute.ref}</span>
                <SBadge status={dispute.status} />
              </div>
              <p style={{ fontSize:14, fontWeight:700, color:C.deep, margin:"0 0 2px" }}>
                {job?.title || "Job"}
              </p>
              <p style={{ fontSize:11, color:C.secondary, margin:0 }}>
                Job ref <strong>{job?.ref}</strong> · raised by {dispute.raised_by_role}
              </p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:18, fontWeight:700, color:C.red, margin:"0 0 2px" }}>
                {fmt(dispute.amount_disputed_pence)}
              </p>
              <p style={{ fontSize:11, color:C.secondary, margin:0 }}>disputed</p>
            </div>
          </div>
          {dispute.reason_label && (
            <p style={{ fontSize:12, color:C.body, margin:"10px 0 0",
              padding:"8px 10px", background:C.cream, borderRadius:8 }}>
              <strong>Reason:</strong> {dispute.reason_label}
            </p>
          )}
        </div>

        {/* What happens next */}
        <div style={{ background:C.white, border:`1.5px solid ${C.border}`,
          borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
          <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.08em",
            textTransform:"uppercase", margin:"0 0 8px" }}>What happens next</p>
          <p style={{ fontSize:12, color:C.body, lineHeight:1.65, margin:0 }}>
            We'll acknowledge your dispute within 1 working day. A ProGrafter mediator then reviews
            the evidence from both sides and works toward a fair outcome — most cases are resolved
            within 5–7 working days, with complex ones taking a little longer. You'll be kept updated
            throughout.
          </p>
        </div>


        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:10, marginBottom:14 }}>
          <div style={{ background:C.white, border:`1.5px solid ${C.border}`,
            borderRadius:12, padding:"12px 14px" }}>
            <p style={{ fontSize:10, fontWeight:700, color:C.red, letterSpacing:"0.08em",
              textTransform:"uppercase", margin:"0 0 8px" }}>Claimant statement</p>
            <p style={{ fontSize:12, color:C.body, lineHeight:1.65, margin:0, whiteSpace:"pre-wrap" }}>
              {dispute.claimant_statement}
            </p>
            {dispute.desired_outcome && (
              <p style={{ fontSize:11, color:C.secondary, margin:"8px 0 0" }}>
                Desired outcome: <strong>{dispute.desired_outcome}</strong>
              </p>
            )}
          </div>

          <div style={{ background:C.white, border:`1.5px solid ${C.border}`,
            borderRadius:12, padding:"12px 14px" }}>
            <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.08em",
              textTransform:"uppercase", margin:"0 0 8px" }}>Respondent statement</p>
            {dispute.respondent_statement ? (
              <p style={{ fontSize:12, color:C.body, lineHeight:1.65, margin:0, whiteSpace:"pre-wrap" }}>
                {dispute.respondent_statement}
              </p>
            ) : canRespond ? (
              <div>
                <p style={{ fontSize:12, color:C.secondary, margin:"0 0 8px" }}>
                  You are the respondent. You have 48 hours from the dispute being raised to submit your response.
                </p>
                <textarea rows={6} value={response} onChange={e => setResponse(e.target.value)}
                  placeholder="Set out your position factually with reference to the agreed scope and any prior correspondence…"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8,
                    border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit",
                    resize:"vertical", boxSizing:"border-box", outline:"none" }} />
                <button onClick={submitResponse} disabled={saving || response.trim().length < 40}
                  style={{ marginTop:8, background:C.teal, color:C.white, border:"none",
                    borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600,
                    cursor: saving ? "wait" : "pointer",
                    opacity: (saving || response.trim().length < 40) ? 0.6 : 1 }}>
                  {saving ? "Submitting…" : "Submit response"}
                </button>
              </div>
            ) : (
              <p style={{ fontSize:12, color:C.secondary, margin:0, fontStyle:"italic" }}>
                Awaiting response from the other party.
              </p>
            )}
          </div>
        </div>

        {/* Recommendation */}
        {dispute.recommendation && (
          <div style={{ background:C.greenBg, border:`1.5px solid ${C.greenBorder}`,
            borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
            <p style={{ fontSize:10, fontWeight:700, color:C.green, letterSpacing:"0.08em",
              textTransform:"uppercase", margin:"0 0 8px" }}>ProGrafter recommendation</p>
            <p style={{ fontSize:12, color:C.body, lineHeight:1.65, margin:0, whiteSpace:"pre-wrap" }}>
              {dispute.recommendation}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background:C.white, border:`1.5px solid ${C.border}`,
          borderRadius:12, padding:"12px 14px" }}>
          <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.08em",
            textTransform:"uppercase", margin:"0 0 10px" }}>Timeline</p>
          {events.length === 0 && <p style={{ fontSize:12, color:C.secondary }}>No events yet.</p>}
          {events.map(e => (
            <div key={e.id} style={{ display:"flex", gap:10, padding:"6px 0",
              borderBottom:`1px solid ${C.cream}` }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background: e.event_type === "dispute" ? C.red : e.event_type === "system" ? C.purple : C.teal,
                flexShrink:0, marginTop:6 }} />
              <div>
                <p style={{ fontSize:12, color:C.body, margin:0 }}>{e.event_text}</p>
                <p style={{ fontSize:10, color:C.secondary, margin:"2px 0 0" }}>
                  {new Date(e.occurred_at).toLocaleString("en-GB",
                    { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
