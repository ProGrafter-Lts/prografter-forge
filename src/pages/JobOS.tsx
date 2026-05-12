import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";

const C = {
  cream:"#F5F0E8", deep:"#0F2238", navy:"#1B3A5C",
  teal:"#0D9488", tealHover:"#14B8A6", tealLight:"#CCFBF1", tealDim:"rgba(13,148,136,0.12)",
  body:"#1F2937", secondary:"#4B5563", border:"#D1CBB8", white:"#FFFFFF",
  error:"#DC2626", amber:"#D97706", amberBg:"#FFFBEB", amberBorder:"#FDE68A",
  green:"#16A34A", greenBg:"#F0FDF4", greenBorder:"#BBF7D0",
  red:"#DC2626", redBg:"#FEF2F2", redBorder:"#FECACA",
  purple:"#7C3AED", purpleBg:"#F5F3FF", purpleBorder:"#DDD6FE",
  darkBorder:"rgba(245,240,232,0.1)",
  dimText:"rgba(245,240,232,0.5)", brightText:"#F5F0E8",
};

const STAGES = [
  { id:0, key:"brief",      label:"Brief posted",        icon:"📋", desc:"Homeowner brief submitted and matched to vetted traders." },
  { id:1, key:"quoted",     label:"Quote received",      icon:"💷", desc:"Trader has submitted a detailed quote for the works." },
  { id:2, key:"accepted",   label:"Quote accepted",      icon:"✅", desc:"Homeowner has accepted the quote. Scope locked." },
  { id:3, key:"contracted", label:"Scope agreed",        icon:"📄", desc:"Scope of works and milestone schedule signed off by both parties." },
  { id:4, key:"started",    label:"Works started",       icon:"🔨", desc:"Trader on site. First milestone payment released from escrow." },
  { id:5, key:"midpoint",   label:"Milestone reached",   icon:"📸", desc:"Mid-point works complete. Photo evidence uploaded. Second payment released." },
  { id:6, key:"practical",  label:"Practical completion",icon:"🏠", desc:"All works complete. Snagging list agreed. Final payment pending." },
  { id:7, key:"complete",   label:"Signed off",          icon:"⭐", desc:"Homeowner sign-off. Final escrow released. Reviews triggered." },
];

const fmt = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits:0 })}`;
const commission = (v: number) => Math.min(v * 0.075, 900);

// ── Types ─────────────────────────────────────────────────────────────────────
interface Milestone { id:number; label:string; pct:number; amount:number; status:string; released_date:string|null; stage_required:number; }
interface Photo { id:string; stage:number; label:string; date:string; uploaded_by:string; }
interface Variation { id:number; date:string; description:string; amount:number; status:string; raised_by:string; }
interface Message { id:string; from:string; date:string; text:string; }
interface JobData {
  ref:string; title:string; trade:string; trader_name:string; trader_business:string;
  homeowner_name:string; address:string; current_stage:number;
  contract_value:number; started_date:string; expected_completion:string;
  milestones:Milestone[]; photos:Photo[]; variations:Variation[]; messages:Message[];
  job_id:string;
}

// ── Mini components ───────────────────────────────────────────────────────────
const Card = ({ children, style={} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14,
    padding:"1rem 1.25rem", ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.1em",
    textTransform:"uppercase", margin:"0 0 10px" }}>
    {children}
  </p>
);

const Pill = ({ label, color="teal" }: { label: string; color?: string }) => {
  const cfgMap: Record<string, { bg:string; text:string; border:string }> = {
    teal:   { bg:C.tealLight,  text:"#0F766E", border:"#99F6E4" },
    green:  { bg:C.greenBg,    text:C.green,   border:C.greenBorder },
    amber:  { bg:C.amberBg,    text:C.amber,   border:C.amberBorder },
    purple: { bg:C.purpleBg,   text:C.purple,  border:C.purpleBorder },
    grey:   { bg:"#F3F4F6",    text:C.secondary, border:C.border },
  };
  const cfg = cfgMap[color] || cfgMap.teal;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", borderRadius:20,
      border:`1px solid ${cfg.border}`, background:cfg.bg,
      padding:"2px 9px", fontSize:11, fontWeight:600, color:cfg.text }}>
      {label}
    </span>
  );
};

const MilestoneBadge = ({ status }: { status: string }) => {
  const map: Record<string, JSX.Element> = {
    released: <Pill label="Released ✓" color="green" />,
    pending:  <Pill label="Pending"    color="grey"  />,
    disputed: <Pill label="Disputed"   color="amber" />,
    frozen:   <Pill label="Frozen ❄️"  color="purple" />,
  };
  return map[status] || null;
};

// ── Stage tracker ─────────────────────────────────────────────────────────────
const StageTracker = ({ currentStage }: { currentStage: number }) => (
  <div style={{ background:C.deep, borderRadius:14, padding:"1.25rem", marginBottom:20 }}>
    <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.1em",
      textTransform:"uppercase", margin:"0 0 14px" }}>
      Job lifecycle — Stage {currentStage + 1} of {STAGES.length}
    </p>
    <div style={{ display:"flex", alignItems:"flex-start", gap:0, overflowX:"auto", paddingBottom:4 }}>
      {STAGES.map((stage, i) => {
        const done    = i < currentStage;
        const active  = i === currentStage;
        const future  = i > currentStage;
        return (
          <div key={stage.id} style={{ display:"flex", alignItems:"flex-start", flexShrink:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, minWidth:72 }}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
                background: done ? C.teal : active ? C.white : "rgba(255,255,255,0.08)",
                border: active ? `2px solid ${C.teal}` : "none",
                boxShadow: active ? `0 0 0 4px ${C.tealDim}` : "none",
                opacity: future ? 0.4 : 1,
                transition:"all 0.2s",
              }}>
                {done ? "✓" : stage.icon}
              </div>
              <p style={{ fontSize:9, fontWeight: active ? 700 : 500, textAlign:"center",
                color: done ? C.teal : active ? C.brightText : C.dimText,
                margin:0, lineHeight:1.3, maxWidth:64 }}>
                {stage.label}
              </p>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ width:24, height:2, background: done ? C.teal : "rgba(255,255,255,0.1)",
                marginTop:17, flexShrink:0, transition:"background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
    <div style={{ marginTop:14, background:"rgba(255,255,255,0.05)", borderRadius:8,
      padding:"10px 12px", borderLeft:`3px solid ${C.teal}` }}>
      <p style={{ fontSize:12, color:C.brightText, margin:0, lineHeight:1.55 }}>
        <strong style={{ color:C.teal }}>Current: </strong>
        {STAGES[currentStage]?.desc}
      </p>
    </div>
  </div>
);

// ── Escrow panel ──────────────────────────────────────────────────────────────
const EscrowPanel = ({ job, view }: { job: JobData; view: string }) => {
  const [showRelease, setShowRelease] = useState<number | null>(null);
  const totalReleased = job.milestones.filter(m=>m.status==="released").reduce((s,m)=>s+m.amount,0);
  const totalPending  = job.milestones.filter(m=>m.status==="pending").reduce((s,m)=>s+m.amount,0);
  const commAmt       = commission(job.contract_value);
  const pct           = job.contract_value ? Math.round((totalReleased / job.contract_value) * 100) : 0;

  return (
    <Card style={{ marginBottom:16 }}>
      <SectionTitle>Escrow & milestone payments</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { label:"Contract value",  value:fmt(job.contract_value), color:C.navy },
          { label:"Released to date",value:fmt(totalReleased),      color:C.green },
          { label:"Held in escrow",  value:fmt(totalPending),       color:C.amber },
        ].map(s=>(
          <div key={s.label} style={{ background:C.cream, borderRadius:8, padding:"8px 10px" }}>
            <p style={{ fontSize:10, color:C.secondary, margin:"0 0 2px" }}>{s.label}</p>
            <p style={{ fontSize:14, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:11, color:C.secondary }}>Payment progress</span>
          <span style={{ fontSize:11, fontWeight:600, color:C.navy }}>{pct}% released</span>
        </div>
        <div style={{ height:8, borderRadius:4, background:"#E5E1D8", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:C.teal, borderRadius:4, transition:"width 0.5s ease" }} />
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {job.milestones.length === 0 && (
          <p style={{ fontSize:12, color:C.secondary, margin:0 }}>No milestones defined yet.</p>
        )}
        {job.milestones.map(m => (
          <div key={m.id} style={{
            background: m.status==="released" ? C.greenBg : m.status==="pending" ? C.cream : C.amberBg,
            border:`1px solid ${m.status==="released" ? C.greenBorder : m.status==="pending" ? C.border : C.amberBorder}`,
            borderRadius:10, padding:"10px 14px",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.navy }}>
                    Milestone {m.id} — {fmt(m.amount)}
                  </span>
                  <span style={{ fontSize:10, color:C.secondary }}>({m.pct}%)</span>
                </div>
                <p style={{ fontSize:12, color:C.secondary, margin:"2px 0 0" }}>{m.label}</p>
                {m.released_date && (
                  <p style={{ fontSize:10, color:C.green, margin:"2px 0 0" }}>
                    Released {new Date(m.released_date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                  </p>
                )}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <MilestoneBadge status={m.status} />
                {m.status === "pending" && view === "homeowner" && job.current_stage >= m.stage_required && (
                  <button onClick={()=>setShowRelease(m.id)}
                    style={{ background:C.teal, color:C.white, border:"none",
                      borderRadius:7, padding:"6px 12px", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                    Sign off & release
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, background:C.tealDim, border:`1px solid #99F6E4`,
        borderRadius:8, padding:"8px 12px", fontSize:11, color:"#0F766E" }}>
        ProGrafter commission: <strong>{fmt(commAmt)}</strong> (7.5% of contract value, capped at £900)
        — deducted automatically at each milestone release.
      </div>
      {showRelease !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }}>
          <div style={{ background:C.white, borderRadius:16, border:`1.5px solid ${C.border}`,
            padding:24, maxWidth:400, width:"100%", margin:"0 1rem" }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:C.deep, margin:"0 0 8px" }}>
              Confirm milestone sign-off
            </h3>
            <p style={{ fontSize:13, color:C.secondary, lineHeight:1.6, margin:"0 0 16px" }}>
              By signing off this milestone, you confirm the works described are complete to your satisfaction.
              <strong style={{ color:C.navy }}> {fmt(job.milestones.find(m=>m.id===showRelease)?.amount || 0)}</strong> will
              be released from escrow to the trader. This action cannot be undone.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowRelease(null)}
                style={{ flex:1, padding:"10px", border:`1.5px solid ${C.border}`,
                  borderRadius:8, fontSize:13, background:"none", cursor:"pointer", color:C.secondary }}>
                Cancel
              </button>
              <button onClick={()=>setShowRelease(null)}
                style={{ flex:1, padding:"10px", background:C.teal, color:C.white,
                  border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Confirm & release
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// ── Photo log ─────────────────────────────────────────────────────────────────
const PhotoLog = ({ photos }: { photos: Photo[] }) => {
  const [showUpload, setShowUpload] = useState(false);
  return (
    <Card style={{ marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <SectionTitle>Photo log — evidence trail</SectionTitle>
        <button onClick={()=>setShowUpload(s=>!s)}
          style={{ background:C.navy, color:C.white, border:"none",
            borderRadius:7, padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer" }}>
          + Upload photo
        </button>
      </div>
      {showUpload && (
        <div style={{ background:C.cream, border:`1.5px dashed ${C.border}`, borderRadius:10,
          padding:"16px", textAlign:"center", marginBottom:14 }}>
          <p style={{ fontSize:13, color:C.secondary, margin:"0 0 8px" }}>
            📸 Drag photos here or click to browse
          </p>
          <p style={{ fontSize:11, color:C.secondary, margin:"0 0 10px" }}>
            JPEG, PNG · Max 10MB · Timestamped automatically
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
            <input style={{ fontSize:12, padding:"6px 10px",
              border:`1px solid ${C.border}`, borderRadius:7,
              fontFamily:"inherit", flex:1, maxWidth:220 }}
              placeholder="Add a description..." />
            <button style={{ background:C.teal, color:C.white, border:"none",
              borderRadius:7, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              Upload
            </button>
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
        {photos.length === 0 && (
          <p style={{ fontSize:12, color:C.secondary, margin:0, gridColumn:"1 / -1" }}>
            No photos uploaded yet.
          </p>
        )}
        {photos.map(photo => (
          <div key={photo.id} style={{ background:C.cream, border:`1px solid ${C.border}`,
            borderRadius:10, overflow:"hidden" }}>
            <div style={{ height:90, background:`linear-gradient(135deg, ${C.navy} 0%, ${C.teal} 100%)`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:28 }}>📷</span>
            </div>
            <div style={{ padding:"8px 10px" }}>
              <p style={{ fontSize:11, fontWeight:600, color:C.navy, margin:"0 0 2px",
                lineHeight:1.3 }}>{photo.label || "Untitled"}</p>
              <p style={{ fontSize:10, color:C.secondary, margin:0 }}>
                Stage {photo.stage + 1} · {new Date(photo.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
              </p>
              <p style={{ fontSize:10, color:C.teal, margin:"2px 0 0", textTransform:"capitalize" }}>
                {photo.uploaded_by}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize:11, color:C.secondary, margin:"10px 0 0", lineHeight:1.6 }}>
        All photos are timestamped and stored permanently. They form part of the job record
        and are included in any dispute documentation pack.
      </p>
    </Card>
  );
};

// ── Variation orders ──────────────────────────────────────────────────────────
const VariationOrders = ({ variations }: { variations: Variation[] }) => {
  const [showForm, setShowForm] = useState(false);
  const [vForm, setVForm] = useState({ description:"", amount:"" });
  return (
    <Card style={{ marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <SectionTitle>Variation orders</SectionTitle>
        <button onClick={()=>setShowForm(s=>!s)}
          style={{ background:"none", border:`1.5px solid ${C.amber}`, color:C.amber,
            borderRadius:7, padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer" }}>
          + Raise variation
        </button>
      </div>
      {showForm && (
        <div style={{ background:C.amberBg, border:`1.5px solid ${C.amberBorder}`,
          borderRadius:10, padding:"14px", marginBottom:14 }}>
          <p style={{ fontSize:12, fontWeight:600, color:C.amber, margin:"0 0 10px" }}>
            New variation order
          </p>
          <div style={{ marginBottom:10 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.navy, marginBottom:4 }}>
              Description of additional works *
            </label>
            <textarea rows={2} value={vForm.description}
              onChange={e=>setVForm(p=>({...p,description:e.target.value}))}
              placeholder="Describe the additional or changed work required and the reason..."
              style={{ width:"100%", padding:"8px 10px", borderRadius:7,
                border:`1px solid ${C.amberBorder}`, fontSize:12,
                fontFamily:"inherit", resize:"none" }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:C.navy, marginBottom:4 }}>
                Additional cost (£) *
              </label>
              <input type="number" value={vForm.amount}
                onChange={e=>setVForm(p=>({...p,amount:e.target.value}))}
                placeholder="e.g. 350"
                style={{ width:"100%", padding:"8px 10px", borderRadius:7,
                  border:`1px solid ${C.amberBorder}`, fontSize:12, fontFamily:"inherit" }} />
            </div>
            <div style={{ display:"flex", alignItems:"flex-end" }}>
              <button onClick={()=>setShowForm(false)}
                style={{ width:"100%", background:C.amber, color:C.white,
                  border:"none", borderRadius:7, padding:"8px", fontSize:12,
                  fontWeight:600, cursor:"pointer" }}>
                Submit for approval
              </button>
            </div>
          </div>
          <p style={{ fontSize:10, color:C.amber, margin:"8px 0 0" }}>
            ⚠️ No additional work may begin until the homeowner approves this variation in writing.
          </p>
        </div>
      )}
      {variations.length === 0 ? (
        <p style={{ fontSize:12, color:C.secondary, margin:0 }}>No variation orders raised.</p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {variations.map(v => (
            <div key={v.id} style={{
              background: v.status==="agreed" ? C.greenBg : v.status==="pending" ? C.amberBg : C.redBg,
              border:`1px solid ${v.status==="agreed" ? C.greenBorder : v.status==="pending" ? C.amberBorder : C.redBorder}`,
              borderRadius:10, padding:"10px 14px",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:"0 0 2px" }}>
                    VO-{String(v.id).padStart(3,"0")} · {new Date(v.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                  </p>
                  <p style={{ fontSize:12, color:C.body, margin:"0 0 4px", lineHeight:1.5 }}>{v.description}</p>
                  <p style={{ fontSize:11, color:C.secondary, margin:0 }}>
                    Raised by: {v.raised_by}
                  </p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:"0 0 4px" }}>
                    +{fmt(v.amount)}
                  </p>
                  <Pill label={v.status === "agreed" ? "Agreed ✓" : v.status === "pending" ? "Awaiting approval" : "Rejected"}
                    color={v.status==="agreed" ? "green" : v.status==="pending" ? "amber" : "grey"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// ── Message thread ─────────────────────────────────────────────────────────────
const MessageThread = ({ messages, view, jobId, senderId, senderType, onSent }:
  { messages: Message[]; view: string; jobId: string; senderId: string | null; senderType: "homeowner" | "trade" | null; onSent: () => void }) => {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!msg.trim() || !senderId || !senderType) return;
    setSending(true);
    const { error } = await supabase.from("project_messages").insert({
      job_id: jobId, sender_id: senderId, sender_type: senderType, message_text: msg.trim(),
    });
    setSending(false);
    if (!error) { setMsg(""); onSent(); }
  };

  return (
    <Card>
      <SectionTitle>Job messages</SectionTitle>
      <p style={{ fontSize:11, color:C.secondary, margin:"0 0 12px", lineHeight:1.5 }}>
        All communication must stay on-platform. Messages are timestamped and form part of the job record.
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14,
        maxHeight:240, overflowY:"auto" }}>
        {messages.length === 0 && (
          <p style={{ fontSize:12, color:C.secondary, margin:0 }}>No messages yet.</p>
        )}
        {messages.map(m => {
          const isMe = m.from === view;
          return (
            <div key={m.id} style={{ display:"flex", flexDirection:"column",
              alignItems: isMe ? "flex-end" : "flex-start" }}>
              <div style={{
                background: isMe ? C.navy : C.cream,
                color: isMe ? C.brightText : C.body,
                borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding:"8px 12px", maxWidth:"80%",
                border: isMe ? "none" : `1px solid ${C.border}`,
              }}>
                <p style={{ fontSize:12, margin:0, lineHeight:1.55 }}>{m.text}</p>
              </div>
              <p style={{ fontSize:10, color:C.secondary, margin:"3px 4px 0",
                textAlign: isMe ? "right" : "left" }}>
                {m.from} · {new Date(m.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
              </p>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <input value={msg} onChange={e=>setMsg(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={e=>{ if (e.key==="Enter") send(); }}
          style={{ flex:1, padding:"9px 12px", borderRadius:8,
            border:`1.5px solid ${C.border}`, fontSize:13,
            fontFamily:"inherit", outline:"none", color:C.body }} />
        <button onClick={send} disabled={sending || !senderId}
          style={{ background:C.teal, color:C.white, border:"none",
            borderRadius:8, padding:"9px 16px", fontSize:13,
            fontWeight:600, cursor: sending || !senderId ? "not-allowed" : "pointer", opacity: sending || !senderId ? 0.6 : 1 }}>
          {sending ? "..." : "Send"}
        </button>
      </div>
    </Card>
  );
};

// ── Data loader ───────────────────────────────────────────────────────────────
async function loadJobByRef(ref: string, userId: string): Promise<{ job: JobData | null; view: "trader" | "homeowner" | null; senderId: string | null; senderType: "homeowner" | "trade" | null; error?: string }> {
  // 1. Job
  const { data: job, error: jobErr } = await supabase
    .from("jobs").select("*").eq("ref", ref).maybeSingle();
  if (jobErr || !job) return { job: null, view: null, senderId: null, senderType: null, error: jobErr?.message || "Job not found" };

  // 2. Determine viewer role
  const { data: ho } = await supabase.from("homeowners").select("id, name").eq("user_id", userId).maybeSingle();
  const { data: tr } = await supabase.from("trades").select("id, name, company_name").eq("user_id", userId).maybeSingle();

  let view: "trader" | "homeowner" | null = null;
  let senderId: string | null = null;
  let senderType: "homeowner" | "trade" | null = null;
  if (ho && ho.id === job.homeowner_id) { view = "homeowner"; senderId = ho.id; senderType = "homeowner"; }
  else if (tr) {
    const { data: match } = await supabase.from("job_matches").select("id").eq("job_id", job.id).eq("trade_id", tr.id).maybeSingle();
    if (match) { view = "trader"; senderId = tr.id; senderType = "trade"; }
  }
  if (!view) return { job: null, view: null, senderId: null, senderType: null, error: "You don't have access to this job" };

  // 3. Homeowner & trade names
  const { data: hoRecord } = await supabase.from("homeowners").select("name").eq("id", job.homeowner_id).maybeSingle();
  // Find primary trade — via contracts first, fall back to first job_match
  const { data: contract } = await supabase
    .from("contracts").select("*").eq("job_id", job.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  let traderName = "";
  let traderBusiness = "";
  let tradeId: string | null = contract?.trade_id || null;
  if (!tradeId) {
    const { data: m } = await supabase.from("job_matches").select("trade_id").eq("job_id", job.id).limit(1).maybeSingle();
    tradeId = m?.trade_id || null;
  }
  if (tradeId) {
    const { data: trd } = await supabase.from("trades").select("full_name, business_name, trade_type").eq("id", tradeId).maybeSingle();
    traderName = trd?.full_name || "";
    traderBusiness = trd?.business_name || "";
  }

  // 4. Stages → current_stage
  const { data: stages } = await supabase.from("project_stages").select("*").eq("job_id", job.id).order("stage_order");
  const currentStage = Math.min(7, Math.max(0, (stages || []).filter(s => s.status === "complete" || s.homeowner_confirmed).length));

  // 5. Milestones (from contract.payment_milestones jsonb, or project_stages)
  let milestones: Milestone[] = [];
  const contractValue = contract ? (contract.total_value_incl_vat_pence || 0) / 100 : 0;
  const pm = (contract?.payment_milestones as Array<Record<string, unknown>> | null) || [];
  if (Array.isArray(pm) && pm.length > 0) {
    milestones = pm.map((m, i) => {
      const amount = Number(m.amount_pence || 0) / 100;
      const pct = contractValue ? Math.round((amount / contractValue) * 100) : 0;
      return {
        id: i + 1,
        label: String(m.label || m.description || `Milestone ${i + 1}`),
        pct,
        amount,
        status: String(m.status || "pending"),
        released_date: (m.released_date as string) || null,
        stage_required: Number(m.stage_required || 4),
      };
    });
  } else if (stages && stages.length > 0) {
    milestones = stages
      .filter(s => Number(s.payment_amount) > 0)
      .map((s, i) => ({
        id: i + 1,
        label: s.stage_name,
        pct: contractValue ? Math.round((Number(s.payment_amount) / contractValue) * 100) : 0,
        amount: Number(s.payment_amount) || 0,
        status: s.payment_status === "paid" ? "released" : s.payment_status,
        released_date: s.homeowner_confirmed_at,
        stage_required: s.stage_order,
      }));
  }

  // 6. Photos
  const { data: photos } = await supabase.from("job_photos").select("*").eq("job_id", job.id).order("created_at");
  const photoList: Photo[] = (photos || []).map(p => ({
    id: p.id,
    stage: p.stage,
    label: p.label,
    date: p.created_at,
    uploaded_by: p.uploaded_by,
  }));

  // 7. Variations
  let variations: Variation[] = [];
  if (contract) {
    const { data: vars } = await supabase.from("contract_variations").select("*").eq("contract_id", contract.id).order("sequence");
    variations = (vars || []).map(v => ({
      id: v.sequence,
      date: v.created_at,
      description: v.description,
      amount: (v.cost_change_pence || 0) / 100,
      status: v.status === "active" || v.status === "agreed" ? "agreed" : v.status,
      raised_by: v.proposed_by,
    }));
  }

  // 8. Messages
  const { data: msgs } = await supabase.from("project_messages").select("*").eq("job_id", job.id).order("created_at");
  const messages: Message[] = (msgs || []).map(m => ({
    id: m.id,
    from: m.sender_type === "homeowner" ? "homeowner" : "trader",
    date: m.created_at,
    text: m.message_text,
  }));

  return {
    job: {
      ref: job.ref,
      title: job.title || job.description?.slice(0, 80) || "Untitled job",
      trade: contract ? "Contracted trade" : (job.job_type || ""),
      trader_name: traderName,
      trader_business: traderBusiness,
      homeowner_name: hoRecord?.name || "",
      address: job.address,
      current_stage: currentStage,
      contract_value: contractValue,
      started_date: contract?.activated_at || contract?.estimated_start_date || job.created_at,
      expected_completion: contract?.estimated_completion_date || "",
      milestones,
      photos: photoList,
      variations,
      messages,
      job_id: job.id,
    },
    view,
    senderId,
    senderType,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function JobOSContent() {
  const { ref } = useParams<{ ref: string }>();
  const { isReady, user } = useAuthReady();
  const [job, setJob] = useState<JobData | null>(null);
  const [view, setView] = useState<"trader" | "homeowner">("trader");
  const [senderId, setSenderId] = useState<string | null>(null);
  const [senderType, setSenderType] = useState<"homeowner" | "trade" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isReady || !ref) return;
    if (!user) { setError("Please sign in to view this job."); setLoading(false); return; }
    setLoading(true);
    loadJobByRef(ref, user.id).then(res => {
      if (res.error || !res.job) { setError(res.error || "Job not found"); setJob(null); }
      else {
        setJob(res.job);
        setView(res.view!);
        setSenderId(res.senderId);
        setSenderType(res.senderType);
        setError(null);
      }
      setLoading(false);
    });
  }, [isReady, user, ref, reload]);

  const totalVOValue = useMemo(() =>
    job?.variations.filter(v=>v.status==="agreed").reduce((s,v)=>s+v.amount,0) || 0,
  [job]);

  if (loading) {
    return <div style={{ padding:"4rem 2rem", textAlign:"center", color:C.secondary, fontSize:14 }}>Loading job…</div>;
  }
  if (error || !job) {
    return (
      <div style={{ padding:"4rem 2rem", textAlign:"center" }}>
        <p style={{ fontSize:16, fontWeight:600, color:C.navy }}>{error || "Job not found"}</p>
        <p style={{ fontSize:13, color:C.secondary, marginTop:8 }}>Check the link or sign in with the correct account.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"system-ui, sans-serif" }}>
      <div style={{ background:C.deep, padding:"14px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:C.dimText, fontWeight:500, letterSpacing:"0.05em" }}>JOB OS</span>
          <span style={{ fontSize:12, fontFamily:"monospace", color:C.teal,
            background:"rgba(13,148,136,0.15)", padding:"2px 8px", borderRadius:6 }}>
            {job.ref}
          </span>
          <span style={{ fontSize:11, color:C.dimText }}>
            Viewing as {view === "trader" ? "🔨 Trader" : "🏠 Homeowner"}
          </span>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"1.5rem 1rem" }}>
        <div style={{ background:C.white, borderRadius:14, border:`1.5px solid ${C.border}`,
          padding:"14px 18px", marginBottom:16,
          display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
          <div>
            <h1 style={{ fontSize:18, fontWeight:700, color:C.deep, margin:"0 0 3px" }}>{job.title}</h1>
            <p style={{ fontSize:12, color:C.secondary, margin:"0 0 6px" }}>{job.address}</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {job.trade && <Pill label={job.trade} color="teal" />}
              <Pill label={view==="trader" ? `Client: ${job.homeowner_name || "—"}` : `Trader: ${job.trader_name || job.trader_business || "—"}`} color="grey" />
              {totalVOValue > 0 && <Pill label={`+${fmt(totalVOValue)} variations`} color="amber" />}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:11, color:C.secondary, margin:"0 0 2px" }}>Contract value</p>
            <p style={{ fontSize:20, fontWeight:700, color:C.navy, margin:"0 0 2px" }}>
              {fmt(job.contract_value + totalVOValue)}
            </p>
            {job.started_date && (
              <p style={{ fontSize:10, color:C.secondary, margin:0 }}>
                Started {new Date(job.started_date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
                {job.expected_completion && ` · Due ${new Date(job.expected_completion).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}`}
              </p>
            )}
          </div>
        </div>

        <StageTracker currentStage={job.current_stage} />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <EscrowPanel job={job} view={view} />
            <VariationOrders variations={job.variations} />
          </div>
          <div>
            <PhotoLog photos={job.photos} />
            <MessageThread messages={job.messages} view={view} jobId={job.job_id}
              senderId={senderId} senderType={senderType}
              onSent={()=>setReload(r=>r+1)} />
          </div>
        </div>

        <div style={{ marginTop:16, display:"flex", justifyContent:"center" }}>
          <button style={{ background:"none", border:`1px solid ${C.redBorder}`,
            color:C.red, borderRadius:8, padding:"8px 18px",
            fontSize:12, cursor:"pointer" }}>
            ⚠️ Raise a dispute
          </button>
        </div>

        <div style={{ marginTop:12, background:C.white, border:`1px solid ${C.border}`,
          borderRadius:10, padding:"10px 14px",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16, flexShrink:0 }}>🔒</span>
          <p style={{ fontSize:11, color:C.secondary, margin:0, lineHeight:1.6 }}>
            Every action on this job is timestamped and permanently recorded. This record is available
            to both parties at any time and is used in the event of a dispute.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function JobOS() {
  const { ref } = useParams<{ ref: string }>();
  return (
    <>
      <SEO title={`Job ${ref} | ProGrafter`} description="Live job workspace with milestones, escrow, photos, variations and messages." path={`/jobs/${ref}`} />
      <AppShell>
        <JobOSContent />
      </AppShell>
    </>
  );
}
