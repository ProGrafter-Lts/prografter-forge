import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import Logo from "@/components/Logo";

const C = {
  cream:"#F5F0E8", deep:"#0F2238", navy:"#27396A",
  teal:"#14A8A1", tealDim:"rgba(13,148,136,0.12)",
  body:"#1F2937", secondary:"#4B5563", border:"#D1CBB8", white:"#FFFFFF",
  amber:"#D97706", amberBg:"#FFFBEB", amberBorder:"#FDE68A",
  red:"#DC2626", redBg:"#FEF2F2", redBorder:"#FECACA",
};

const DISPUTE_REASONS = [
  { id:"quality",      label:"Quality of work — does not meet agreed standard" },
  { id:"incomplete",   label:"Works incomplete — trader has not finished the job" },
  { id:"abandoned",    label:"Trader has abandoned the job" },
  { id:"overcharge",   label:"Overcharging — invoice does not match agreed quote" },
  { id:"damage",       label:"Damage to property caused during works" },
  { id:"variation",    label:"Unapproved variation charges added" },
  { id:"no_show",      label:"Trader failed to attend as agreed" },
  { id:"materials",    label:"Materials dispute — wrong or substandard materials used" },
  { id:"scope",        label:"Scope creep — homeowner changed scope without agreement" },
  { id:"access",       label:"Access refused — homeowner prevented works" },
  { id:"payment",      label:"Payment withheld — milestone not released after sign-off" },
  { id:"other",        label:"Other — describe below" },
];

const fmt = (pence: number) => `£${(pence/100).toLocaleString("en-GB",{maximumFractionDigits:0})}`;

export default function DisputeRaise() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const jobRef = params.get("job") || "";

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<{ id:string; title:string|null; ref:string } | null>(null);
  const [role, setRole] = useState<"homeowner"|"trade"|null>(null);
  const [frozenPence, setFrozenPence] = useState(0);
  const [form, setForm] = useState({
    reason:"", amount_pounds:"", statement:"", desired_outcome:"", evidence_notes:"",
  });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [createdDisputeId, setCreatedDisputeId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!jobRef) { setError("Missing job reference."); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav(`/login?redirect=/disputes/new?job=${jobRef}`); return; }

      const { data: jobRow, error: jobErr } = await supabase
        .from("jobs").select("id, title, ref, homeowner_id").eq("ref", jobRef).maybeSingle();
      if (jobErr || !jobRow) { setError("Job not found."); return; }
      setJob({ id: jobRow.id, title: jobRow.title, ref: jobRow.ref });

      // Determine role
      const { data: ho } = await supabase.from("homeowners").select("id").eq("user_id", user.id).maybeSingle();
      if (ho && ho.id === jobRow.homeowner_id) setRole("homeowner");
      else {
        const { data: tr } = await supabase.from("trades").select("id").eq("user_id", user.id).maybeSingle();
        if (tr) {
          const { data: match } = await supabase.from("job_matches")
            .select("id").eq("job_id", jobRow.id).eq("trade_id", tr.id).maybeSingle();
          if (match) setRole("trade");
        }
      }

      // Frozen escrow estimate from contract
      const { data: contract } = await supabase.from("contracts")
        .select("payment_milestones, total_value_incl_vat_pence").eq("job_id", jobRow.id).maybeSingle();
      if (contract?.payment_milestones && Array.isArray(contract.payment_milestones)) {
        const pending = (contract.payment_milestones as Array<{ amount_pence?: number; status?: string }>)
          .filter(m => m.status !== "paid" && m.status !== "released")
          .reduce((s,m) => s + (m.amount_pence ?? 0), 0);
        setFrozenPence(pending);
      }
    })();
  }, [jobRef, nav]);

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = (n: number) => {
    const e: Record<string,string> = {};
    if (n===0 && !form.reason) e.reason = "Please select the reason for your dispute";
    if (n===1) {
      if (form.statement.trim().length < 80) e.statement = "Please provide at least 80 characters";
      if (!form.desired_outcome.trim()) e.desired_outcome = "Required — what outcome are you seeking?";
    }
    return e;
  };
  const next = () => { const e = validate(step); setErrors(e); if (!Object.keys(e).length) setStep(s => s+1); };
  const back = () => { setErrors({}); setStep(s => s-1); };

  const submit = async () => {
    if (!job || !role) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const reasonObj = DISPUTE_REASONS.find(r => r.id === form.reason);
    const amountPence = form.amount_pounds ? Math.round(parseFloat(form.amount_pounds) * 100) : null;

    const { data: dispute, error: dErr } = await supabase.from("disputes").insert({
      job_id: job.id,
      raised_by_user_id: user.id,
      raised_by_role: role,
      reason: form.reason,
      reason_label: reasonObj?.label,
      amount_disputed_pence: amountPence,
      frozen_amount_pence: frozenPence || null,
      claimant_statement: form.statement,
      desired_outcome: form.desired_outcome,
      evidence_notes: form.evidence_notes || null,
      status: "awaiting_response",
    }).select("id").single();

    if (dErr || !dispute) { setError(dErr?.message || "Failed to raise dispute"); setSubmitting(false); return; }
    await supabase.from("dispute_events").insert({
      dispute_id: dispute.id,
      event_type: "dispute",
      event_text: `Dispute raised by ${role}${form.reason ? ` — ${form.reason}` : ""}`,
    });
    void supabase.functions.invoke("notify-dispute-raised", { body: { dispute_id: dispute.id } });
    trackEvent("dispute_raise", { reason: form.reason });
    setCreatedDisputeId(dispute.id);
    setSubmitted(true);
    setSubmitting(false);
  };

  if (error) return (
    <div style={{ minHeight:"100vh", background:C.cream, padding:"2rem" }}>
      <div style={{ maxWidth:600, margin:"0 auto", background:C.white, border:`1.5px solid ${C.border}`,
        borderRadius:14, padding:"1.5rem" }}>
        <p style={{ color:C.red, margin:0 }}>{error}</p>
      </div>
    </div>
  );

  if (!job || !role) return (
      <div style={{ minHeight:"100vh", background:C.cream, display:"flex",
        alignItems:"center", justifyContent:"center", color:C.secondary }}>
      Loading…
    </div>
  );

  if (submitted && createdDisputeId) {
    return (
      <div style={{ minHeight:"100vh", background:C.cream }}>
        <div style={{ background:C.deep, padding:"14px 24px",
          display:"flex", alignItems:"center", gap:12 }}>
          <div className="font-heading tracking-wider" style={{ fontSize:24, fontWeight:700 }}>
            <Logo variant="light" className="h-9 w-auto inline-block" />
          </div>
          <span style={{ color:"rgba(245,240,232,0.45)" }}>|</span>
          <span style={{ fontSize:12, color:"rgba(245,240,232,0.78)", letterSpacing:"0.05em" }}>
            DISPUTE RESOLUTION · {job.ref}
          </span>
        </div>

        <div style={{ maxWidth:660, margin:"0 auto", padding:"2.5rem 1rem" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:C.tealDim,
              display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <span style={{ fontSize:32 }}>🛡️</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:C.deep, margin:"0 0 8px" }}>
              Dispute raised successfully
            </h1>
            <p style={{ fontSize:13, color:C.secondary, maxWidth:480, margin:"0 auto", lineHeight:1.65 }}>
              Your dispute for <strong>{job.title || "this job"}</strong> has been logged and
              pending escrow payments are now frozen.
            </p>
          </div>

          <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"1.25rem 1.25rem" }}>
            <div style={{ background:C.tealDim, border:`1px solid #99F6E4`,
              borderRadius:10, padding:"14px 16px", marginBottom:20 }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#0F766E", letterSpacing:"0.08em",
                textTransform:"uppercase", margin:"0 0 8px" }}>What happens next</p>
              <p style={{ fontSize:12, color:"#0F766E", lineHeight:1.65, margin:0 }}>
                We'll acknowledge your dispute within 1 working day. A ProGrafter mediator then reviews
                the evidence from both sides and works toward a fair outcome — most cases are resolved
                within 5–7 working days, with complex ones taking a little longer. You'll be kept updated
                throughout.
              </p>
            </div>

            <div style={{ display:"flex", justifyContent:"center" }}>
              <button onClick={() => nav(`/disputes/${createdDisputeId}`)}
                style={{ background:C.teal, color:C.white, border:"none", borderRadius:10,
                  padding:"11px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                View dispute details →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inp = (err: boolean) => ({
    width:"100%", padding:"9px 12px", borderRadius:8,
    border:`1.5px solid ${err ? C.red : C.border}`,
    fontSize:13, color:C.body, fontFamily:"inherit",
    outline:"none", boxSizing:"border-box" as const, background:C.white,
  });

  return (
    <div style={{ minHeight:"100vh", background:C.cream }}>
      <div style={{ background:C.deep, padding:"14px 24px",
        display:"flex", alignItems:"center", gap:12 }}>
        <div className="font-heading tracking-wider" style={{ fontSize:24, fontWeight:700 }}>
          <Logo variant="light" className="h-9 w-auto inline-block" />
        </div>
        <span style={{ color:"rgba(245,240,232,0.45)" }}>|</span>
        <span style={{ fontSize:12, color:"rgba(245,240,232,0.78)", letterSpacing:"0.05em" }}>
          DISPUTE RESOLUTION · {job.ref}
        </span>
      </div>

      <div style={{ maxWidth:660, margin:"0 auto", padding:"1.5rem 1rem" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:C.deep, margin:"0 0 6px" }}>Raise a dispute</h1>
          <p style={{ fontSize:13, color:C.secondary, maxWidth:480, margin:"0 auto", lineHeight:1.65 }}>
            {job.title || "This job"} — disputes freeze pending escrow payments immediately.
          </p>
        </div>

        <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"1rem 1.25rem" }}>
          <div style={{ background:C.redBg, border:`2px solid ${C.redBorder}`,
            borderRadius:12, padding:"14px 16px", marginBottom:20,
            display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:22 }}>❄️</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:C.red, margin:"0 0 4px" }}>
                Raising a dispute will freeze pending escrow payments
              </p>
              <p style={{ fontSize:12, color:C.red, opacity:0.85, margin:0, lineHeight:1.6 }}>
                {frozenPence > 0 ? `${fmt(frozenPence)} held in escrow will be locked` : "Pending payments will be locked"} until resolved. This cannot be undone.
              </p>
            </div>
          </div>

          <div style={{ background:C.tealDim, border:`1px solid #99F6E4`,
            borderRadius:10, padding:"12px 14px", marginBottom:20 }}>
            <p style={{ fontSize:10, fontWeight:700, color:"#0F766E", letterSpacing:"0.08em",
              textTransform:"uppercase", margin:"0 0 6px" }}>What happens next</p>
            <p style={{ fontSize:12, color:"#0F766E", lineHeight:1.65, margin:0 }}>
              We'll acknowledge your dispute within 1 working day. A ProGrafter mediator then reviews
              the evidence from both sides and works toward a fair outcome — most cases are resolved
              within 5–7 working days, with complex ones taking a little longer. You'll be kept updated
              throughout.
            </p>
          </div>



          {step === 0 && (
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.1em",
                textTransform:"uppercase", margin:"0 0 10px" }}>Step 1 of 3 — Reason</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {DISPUTE_REASONS
                  .filter(r => role === "homeowner"
                    ? !["scope","access","payment"].includes(r.id)
                    : ["scope","access","payment","variation","other"].includes(r.id))
                  .map(r => (
                    <label key={r.id} style={{ display:"flex", alignItems:"center", gap:12,
                      background: form.reason===r.id ? C.redBg : C.cream,
                      border:`1.5px solid ${form.reason===r.id ? C.redBorder : C.border}`,
                      borderRadius:10, padding:"10px 14px", cursor:"pointer" }}>
                      <input type="radio" name="reason" value={r.id}
                        checked={form.reason===r.id} onChange={upd("reason")}
                        style={{ accentColor:C.red, width:16, height:16 }} />
                      <span style={{ fontSize:13, color:C.body }}>{r.label}</span>
                    </label>
                  ))}
              </div>
              {errors.reason && <p style={{ fontSize:11, color:C.red, marginTop:6 }}>{errors.reason}</p>}

              <div style={{ marginTop:14 }}>
                <p style={{ fontSize:12, fontWeight:600, color:C.navy, margin:"0 0 8px" }}>
                  Amount you are disputing (£)
                </p>
                <input type="number" value={form.amount_pounds} onChange={upd("amount_pounds")}
                  placeholder="Leave blank to dispute the full outstanding amount" style={inp(false)} />
                {frozenPence > 0 && (
                  <p style={{ fontSize:11, color:C.secondary, marginTop:4 }}>
                    Current pending escrow: <strong>{fmt(frozenPence)}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.1em",
                textTransform:"uppercase", margin:"0 0 10px" }}>Step 2 of 3 — Your statement</p>
              <p style={{ fontSize:13, color:C.secondary, margin:"0 0 14px", lineHeight:1.6 }}>
                Set out your position factually — what happened, when, and what was agreed.
              </p>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.navy, marginBottom:5 }}>
                Your statement <span style={{ color:C.red }}>*</span>
              </label>
              <textarea rows={7} value={form.statement} onChange={upd("statement")}
                placeholder="Describe the issue with reference to the agreed scope, dates, and any earlier communications…"
                style={{ ...inp(!!errors.statement), resize:"vertical", minHeight:160 }} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                {errors.statement
                  ? <p style={{ fontSize:11, color:C.red, margin:0 }}>{errors.statement}</p>
                  : <div />}
                <p style={{ fontSize:11, color: form.statement.length>=80 ? C.teal : C.secondary, margin:0 }}>
                  {form.statement.length} chars {form.statement.length<80 ? `(${80-form.statement.length} more)` : "✓"}
                </p>
              </div>

              <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.navy, margin:"14px 0 5px" }}>
                Desired outcome <span style={{ color:C.red }}>*</span>
              </label>
              <select value={form.desired_outcome} onChange={upd("desired_outcome")} style={inp(!!errors.desired_outcome)}>
                <option value="">Select the outcome you are seeking…</option>
                {role === "homeowner" ? <>
                  <option value="rectify">Trader returns to rectify the works</option>
                  <option value="partial_refund">Partial refund of milestone payment</option>
                  <option value="full_refund">Full refund of milestone payment</option>
                  <option value="third_party">Independent inspection and cost assessment</option>
                  <option value="terminate">Terminate contract and settle outstanding balance</option>
                </> : <>
                  <option value="release">Milestone payment released immediately</option>
                  <option value="access">Homeowner required to provide access as agreed</option>
                  <option value="variation_approval">Variation order approved and paid</option>
                  <option value="scope_clarification">Formal scope clarification from ProGrafter</option>
                </>}
              </select>
              {errors.desired_outcome && <p style={{ fontSize:11, color:C.red, marginTop:4 }}>{errors.desired_outcome}</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.1em",
                textTransform:"uppercase", margin:"0 0 10px" }}>Step 3 of 3 — Evidence</p>
              <p style={{ fontSize:13, color:C.secondary, margin:"0 0 14px", lineHeight:1.6 }}>
                The full job record (messages, photos, variations, milestones) is automatically included.
              </p>

              <div style={{ background:C.tealDim, border:`1px solid #99F6E4`,
                borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
                <p style={{ fontSize:12, fontWeight:600, color:"#0F766E", margin:"0 0 8px" }}>
                  ✅ Automatically included in your dispute pack
                </p>
                {["Complete job message thread","All photo uploads with stage and date",
                  "Signed scope of works and milestones","All variation orders",
                  "Milestone payment history","Trader vetting record"].map((t,i) => (
                  <div key={i} style={{ fontSize:12, color:"#0F766E", padding:"3px 0" }}>• {t}</div>
                ))}
              </div>

              <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.navy, marginBottom:5 }}>
                Evidence notes
              </label>
              <textarea rows={3} value={form.evidence_notes} onChange={upd("evidence_notes")}
                placeholder="Describe any additional evidence and why it's relevant…"
                style={{ ...inp(false), resize:"vertical" }} />

              <div style={{ background:C.amberBg, border:`1px solid ${C.amberBorder}`,
                borderRadius:8, padding:"10px 12px", marginTop:14,
                fontSize:11, color:C.amber, lineHeight:1.65 }}>
                <strong>By submitting:</strong> you confirm the information is accurate. False or vexatious
                disputes may result in account suspension. You agree to engage with mediation in good faith.
              </div>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between",
            borderTop:`1px solid ${C.cream}`, paddingTop:16, marginTop:16 }}>
            {step > 0
              ? <button onClick={back} style={{ background:"none", border:"none",
                  color:C.secondary, fontSize:13, cursor:"pointer" }}>← Back</button>
              : <div />}
            {step < 2
              ? <button onClick={next} style={{ background:C.red, color:C.white, border:"none",
                  borderRadius:10, padding:"11px 24px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  Continue →
                </button>
              : <button onClick={submit} disabled={submitting}
                  style={{ background:C.red, color:C.white, border:"none", borderRadius:10,
                    padding:"11px 24px", fontSize:14, fontWeight:700,
                    cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Raising…" : "Raise dispute & freeze escrow"}
                </button>}
          </div>
          <p style={{ textAlign:"center", fontSize:11, color:C.secondary, marginTop:10 }}>
            Step {step+1} of 3
          </p>
        </div>
      </div>
    </div>
  );
}
