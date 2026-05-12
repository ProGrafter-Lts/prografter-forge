import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import SEO from "@/components/SEO";

const C = {
  cream:"#F5F0E8", deep:"#0F2238", navy:"#1B3A5C",
  teal:"#0D9488", tealHover:"#14B8A8", tealLight:"#CCFBF1", tealDim:"rgba(13,148,136,0.12)",
  body:"#1F2937", secondary:"#4B5563", border:"#D1CBB8", white:"#FFFFFF",
  amber:"#D97706", amberBg:"#FFFBEB", amberBorder:"#FDE68A",
  green:"#16A34A", greenBg:"#F0FDF4", greenBorder:"#BBF7D0",
  red:"#DC2626", redBg:"#FEF2F2", redBorder:"#FECACA",
  dimText:"rgba(245,240,232,0.78)", brightText:"#F5F0E8",
};

const TRADER_DIMENSIONS = [
  { id:"workmanship_rating",   label:"Quality of work",      hint:"Did the finished work meet the standard described in the brief?" },
  { id:"communication_rating", label:"Communication",        hint:"Did the trader keep you informed and respond promptly?" },
  { id:"reliability_rating",   label:"Timekeeping",          hint:"Did the trader show up when agreed and finish on schedule?" },
  { id:"tidiness_rating",      label:"Tidiness & respect",   hint:"Was the property left clean and tidy? Was your home treated with respect?" },
  { id:"value_rating",         label:"Value for money",      hint:"Given the quality of work, was the price fair?" },
];

const HOMEOWNER_DIMENSIONS = [
  { id:"trade_access_rating",        label:"Access provided",  hint:"Did the homeowner provide reliable access as agreed?" },
  { id:"trade_communication_rating", label:"Communication",    hint:"Were instructions clear? Did the homeowner respond promptly?" },
  { id:"trade_payment_rating",       label:"Payment conduct",  hint:"Were milestone payments released promptly on completion?" },
  { id:"trade_scope_rating",         label:"Scope respect",    hint:"Were there unreasonable scope changes or last-minute additions?" },
  { id:"trade_reasonable_rating",    label:"Reasonableness",   hint:"Was the homeowner fair and reasonable throughout the project?" },
];

type StarProps = { value: number; onChange?: (n:number)=>void; size?: number };
const StarRating = ({ value, onChange, size=22 }: StarProps) => (
  <div style={{ display:"flex", gap:4 }}>
    {[1,2,3,4,5].map(n => (
      <button key={n} type="button" onClick={()=>onChange && onChange(n)}
        style={{ background:"none", border:"none", padding:2,
          cursor:onChange ? "pointer" : "default",
          fontSize:size, lineHeight:1,
          filter: n <= value ? "none" : "grayscale(1) opacity(0.25)" }}>⭐</button>
    ))}
  </div>
);

const DimensionRow = ({ dim, value, onChange }: any) => (
  <div style={{ background:C.cream, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:6 }}>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:C.navy, margin:"0 0 2px" }}>{dim.label}</p>
        <p style={{ fontSize:11, color:C.secondary, margin:0 }}>{dim.hint}</p>
      </div>
      <StarRating value={value} onChange={onChange} />
    </div>
    {value > 0 && (
      <p style={{ fontSize:11, fontWeight:500, margin:0,
        color: value >= 4 ? C.green : value >= 3 ? C.amber : C.red }}>
        {["","Poor","Below expectations","Acceptable","Good","Excellent"][value]}
      </p>
    )}
  </div>
);

interface ReviewContext {
  job_id: string;
  homeowner_id: string;
  trade_id: string;
  role: "homeowner" | "trade";
  jobRef: string;
  jobTitle: string;
  jobAddress: string;
  counterparty: string;
  existing: any;
}

export default function ReviewSubmit() {
  const { ref } = useParams<{ ref: string }>();
  const { isReady, user } = useAuthReady();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ReviewContext | null>(null);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | "maybe" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isReady || !user || !ref) return;
    (async () => {
      setLoading(true);
      const { data: rpc, error: rpcErr } = await supabase.rpc("get_review_context", { _ref: ref });
      if (rpcErr || !rpc || rpc.length === 0) {
        setError("Job not found or you do not have access to it.");
        setLoading(false);
        return;
      }
      const row = rpc[0];
      const { data: job } = await supabase.from("jobs").select("title,address,job_type").eq("id", row.job_id).maybeSingle();
      let counterparty = "";
      if (row.role === "homeowner") {
        const { data: t } = await supabase.from("trades").select("name,company_name").eq("id", row.trade_id).maybeSingle();
        counterparty = t ? `${t.name}${t.company_name ? ` · ${t.company_name}` : ""}` : "Trader";
      } else {
        const { data: h } = await supabase.from("homeowners").select("name").eq("id", row.homeowner_id).maybeSingle();
        counterparty = h?.name ?? "Homeowner";
      }
      const { data: existing } = await supabase
        .from("reviews")
        .select("*")
        .eq("job_id", row.job_id)
        .maybeSingle();

      setCtx({
        job_id: row.job_id, homeowner_id: row.homeowner_id, trade_id: row.trade_id,
        role: row.role as "homeowner" | "trade",
        jobRef: ref!,
        jobTitle: job?.title ?? job?.job_type ?? "Job",
        jobAddress: job?.address ?? "",
        counterparty,
        existing,
      });

      // If already submitted own side, mark as submitted
      const ownDone = row.role === "homeowner"
        ? !!existing?.homeowner_review_submitted_at
        : !!existing?.trade_review_submitted_at;
      if (ownDone) setSubmitted(true);
      setLoading(false);
    })();
  }, [isReady, user, ref]);

  const dims = ctx?.role === "homeowner" ? TRADER_DIMENSIONS : HOMEOWNER_DIMENSIONS;
  const allScored = dims.length > 0 && dims.every(d => (scores[d.id] ?? 0) > 0);
  const overall = allScored
    ? dims.reduce((s,d)=>s+(scores[d.id] ?? 0), 0) / dims.length
    : null;

  const handleSubmit = async () => {
    if (!ctx) return;
    const e: Record<string,string> = {};
    if (!allScored) e.scores = "Please rate all dimensions before submitting";
    if (comment.trim().length < 40) e.comment = "Please write at least 40 characters";
    if (ctx.role === "homeowner" && wouldRecommend === null) e.recommend = "Required";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    const now = new Date().toISOString();

    if (!ctx.existing) {
      // Insert new row with own side
      const base: any = {
        job_id: ctx.job_id, homeowner_id: ctx.homeowner_id, trade_id: ctx.trade_id,
      };
      if (ctx.role === "homeowner") {
        Object.assign(base, scores, {
          rating: Math.round(overall!),
          body: comment.trim(),
          would_recommend: wouldRecommend === true,
          homeowner_overall: Number(overall!.toFixed(2)),
          homeowner_review_submitted_at: now,
        });
      } else {
        Object.assign(base, scores, {
          trade_review_comment: comment.trim(),
          trade_overall: Number(overall!.toFixed(2)),
          trade_review_submitted_at: now,
        });
      }
      const { error: insErr } = await supabase.from("reviews").insert(base);
      if (insErr) { setError(insErr.message); setSubmitting(false); return; }
    } else {
      // Update own side on existing row
      const patch: any = { ...scores };
      if (ctx.role === "homeowner") {
        patch.rating = Math.round(overall!);
        patch.body = comment.trim();
        patch.would_recommend = wouldRecommend === true;
        patch.homeowner_overall = Number(overall!.toFixed(2));
        patch.homeowner_review_submitted_at = now;
      } else {
        patch.trade_review_comment = comment.trim();
        patch.trade_overall = Number(overall!.toFixed(2));
        patch.trade_review_submitted_at = now;
      }
      const { error: updErr } = await supabase.from("reviews").update(patch).eq("id", ctx.existing.id);
      if (updErr) { setError(updErr.message); setSubmitting(false); return; }
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  if (!isReady || loading) {
    return <div style={{ minHeight:"100vh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center", color:C.secondary }}>Loading…</div>;
  }
  if (error || !ctx) {
    return (
      <div style={{ minHeight:"100vh", background:C.cream, padding:"3rem 1rem" }}>
        <div style={{ maxWidth:480, margin:"0 auto", background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"1.5rem", textAlign:"center" }}>
          <p style={{ fontSize:15, fontWeight:600, color:C.deep }}>{error ?? "Unable to load review."}</p>
          <Link to="/" style={{ display:"inline-block", marginTop:12, color:C.teal, fontWeight:600 }}>← Back home</Link>
        </div>
      </div>
    );
  }

  const otherSubmitted = ctx.role === "homeowner"
    ? !!ctx.existing?.trade_review_submitted_at
    : !!ctx.existing?.homeowner_review_submitted_at;

  return (
    <div style={{ minHeight:"100vh", background:C.cream }}>
      <SEO title="Leave a review · ProGrafter" description="Submit a permanent, verified review on your completed job." path={`/reviews/${ctx.jobRef}`} noindex />

      <div style={{ background:C.deep, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Link to="/" style={{ fontSize:20, fontWeight:700, textDecoration:"none" }}>
            <span style={{ color:C.brightText }}>Pro</span>
            <span style={{ color:C.teal }}>Grafter</span>
          </Link>
          <span style={{ color:"rgba(245,240,232,0.45)", fontSize:16 }}>|</span>
          <span style={{ fontSize:12, color:C.dimText, fontWeight:500, letterSpacing:"0.05em" }}>REVIEW</span>
        </div>
        <span style={{ fontSize:11, color:C.dimText, fontFamily:"'DM Mono', monospace" }}>{ctx.jobRef}</span>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"1.5rem 1rem" }}>
        {/* Job summary */}
        <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"14px 18px", marginBottom:20 }}>
          <p style={{ fontSize:12, fontFamily:"'DM Mono', monospace", color:C.teal, margin:"0 0 4px" }}>{ctx.jobRef}</p>
          <h2 style={{ fontSize:16, fontWeight:700, color:C.deep, margin:"0 0 3px" }}>{ctx.jobTitle}</h2>
          {ctx.jobAddress && <p style={{ fontSize:12, color:C.secondary, margin:0 }}>{ctx.jobAddress}</p>}
        </div>

        {/* Who you're reviewing */}
        <div style={{ background:C.navy, borderRadius:12, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:C.teal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
            {ctx.role === "homeowner" ? "🔨" : "🏠"}
          </div>
          <div>
            <p style={{ fontSize:11, color:C.dimText, margin:"0 0 2px" }}>You are reviewing</p>
            <p style={{ fontSize:14, fontWeight:700, color:C.brightText, margin:0 }}>{ctx.counterparty}</p>
          </div>
        </div>

        {submitted ? (
          <div style={{ background:C.greenBg, border:`2px solid ${C.greenBorder}`, borderRadius:16, padding:"2rem", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <h3 style={{ fontSize:17, fontWeight:700, color:C.green, marginBottom:8 }}>Review submitted</h3>
            <p style={{ fontSize:13, color:C.secondary, lineHeight:1.65, margin:"0 0 12px" }}>
              Your review is permanently recorded against job <strong>{ctx.jobRef}</strong>.
              {otherSubmitted
                ? " Both sides have submitted — your reviews are now published."
                : ` It will be published once ${ctx.role === "homeowner" ? "the trader" : "the homeowner"} also submits theirs.`}
            </p>
          </div>
        ) : (
          <>
            <div style={{ background:C.amberBg, border:`1.5px solid ${C.amberBorder}`, borderRadius:10, padding:"10px 14px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>🔒</span>
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:C.amber, margin:"0 0 3px" }}>This review is permanent</p>
                <p style={{ fontSize:11, color:C.amber, opacity:0.9, margin:0, lineHeight:1.6 }}>
                  Once submitted, your review cannot be edited or removed. Be honest.
                </p>
              </div>
            </div>

            <div style={{ background:C.tealDim, border:`1px solid #99F6E4`, borderRadius:10, padding:"10px 14px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>👁️</span>
              <p style={{ fontSize:11, color:"#0F766E", margin:0, lineHeight:1.6 }}>
                <strong>Blind review:</strong> You cannot see the other party's review until both sides have submitted.
              </p>
            </div>

            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:"0 0 10px", letterSpacing:"0.03em" }}>
                Rate each dimension <span style={{ color:C.teal }}>*</span>
              </p>
              {dims.map(dim => (
                <DimensionRow key={dim.id} dim={dim} value={scores[dim.id] ?? 0}
                  onChange={(v: number) => setScores(p => ({ ...p, [dim.id]: v }))} />
              ))}
              {errors.scores && <p style={{ fontSize:11, color:C.red, marginTop:4 }}>{errors.scores}</p>}
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.navy, marginBottom:5 }}>
                Written review <span style={{ color:C.teal }}>*</span>
              </label>
              <textarea rows={5} value={comment} onChange={e => setComment(e.target.value)}
                placeholder={ctx.role === "homeowner"
                  ? "Describe your experience with the trader — quality, communication, timekeeping…"
                  : "Describe your experience with the homeowner — access, payment promptness, reasonableness…"}
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1.5px solid ${errors.comment ? C.red : C.border}`, fontSize:13, color:C.body, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                {errors.comment ? <p style={{ fontSize:11, color:C.red, margin:0 }}>{errors.comment}</p> : <div />}
                <p style={{ fontSize:11, color:comment.length >= 40 ? C.teal : C.secondary, margin:0 }}>
                  {comment.length} characters {comment.length < 40 ? `(${40 - comment.length} more needed)` : "✓"}
                </p>
              </div>
            </div>

            {ctx.role === "homeowner" && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:"0 0 10px" }}>
                  Would you recommend this trader? <span style={{ color:C.teal }}>*</span>
                </p>
                <div style={{ display:"flex", gap:10 }}>
                  {[
                    { val:true, label:"Yes, absolutely", colour:C.green, bg:C.greenBg, border:C.greenBorder },
                    { val:"maybe" as const, label:"With reservations", colour:C.amber, bg:C.amberBg, border:C.amberBorder },
                    { val:false, label:"No", colour:C.red, bg:C.redBg, border:C.redBorder },
                  ].map(opt => (
                    <button key={String(opt.val)} type="button" onClick={() => setWouldRecommend(opt.val)}
                      style={{ flex:1, padding:"10px 8px", borderRadius:10,
                        border:`1.5px solid ${wouldRecommend === opt.val ? opt.border : C.border}`,
                        background: wouldRecommend === opt.val ? opt.bg : C.white,
                        color: wouldRecommend === opt.val ? opt.colour : C.secondary,
                        fontSize:12, fontWeight:600, cursor:"pointer" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.recommend && <p style={{ fontSize:11, color:C.red, marginTop:4 }}>{errors.recommend}</p>}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              style={{ width:"100%", background:C.teal, color:C.white, border:"none", borderRadius:10, padding:"14px", fontSize:15, fontWeight:700, cursor:submitting ? "wait" : "pointer", opacity:submitting ? 0.7 : 1 }}>
              {submitting ? "Submitting…" : "Submit review permanently →"}
            </button>
            <p style={{ fontSize:11, color:C.secondary, textAlign:"center", marginTop:8, lineHeight:1.5 }}>
              By submitting you confirm this review is honest and accurate.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
