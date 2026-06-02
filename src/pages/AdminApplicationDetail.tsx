import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import {
  TradeApplication, ApplicationEvent, DocMeta, STATUS_OPTIONS, STATUS_LABEL, STATUS_COLOR,
  QUAL_LABEL, VERIFICATION_CHECKS, DOC_GROUPS, FIELD_LABELS, fmtSize, isImage,
  signedUrlFor, logApplicationEvent,
} from "@/lib/tradeApplications";

const C = {
  cream: "#F5F0E8", deep: "#0F2238", teal: "#14A8A1", white: "#FFFFFF",
  border: "#E2E0DA", secondary: "#6B6B6B", red: "#DC2626", green: "#16A34A", amber: "#D97706",
};

interface TradeReference {
  id: string;
  contact_name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  status: string;
  admin_notes: string | null;
  status_updated_at: string | null;
}

const card: React.CSSProperties = { background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16 };
const h2: React.CSSProperties = { fontSize: 15, fontWeight: 800, color: C.deep, margin: "0 0 12px" };
const inputStyle: React.CSSProperties = { width: "100%", fontSize: 13, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, color: C.deep, boxSizing: "border-box" };

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<TradeApplication | null>(null);
  const [refs, setRefs] = useState<TradeReference[]>([]);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  const refreshEvents = useCallback(async (appId: string) => {
    const { data } = await supabase
      .from("trade_application_events")
      .select("*")
      .eq("application_id", appId)
      .order("created_at", { ascending: false });
    setEvents(((data as unknown) as ApplicationEvent[]) ?? []);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("trade_applications").select("*").eq("id", id).maybeSingle();
    if (error || !data) { toast.error(error?.message || "Application not found"); setLoading(false); return; }
    const a = (data as unknown) as TradeApplication;
    setApp(a);
    setNotes(a.admin_notes ?? "");
    if (a.applicant_email) {
      const { data: r } = await supabase.from("trade_references").select("*").eq("applicant_email", a.applicant_email);
      setRefs(((r as unknown) as TradeReference[]) ?? []);
    }
    await refreshEvents(a.id);
    setLoading(false);
  }, [id, refreshEvents]);

  useEffect(() => { load(); }, [load]);

  const openDoc = async (path: string) => {
    const url = await signedUrlFor(path);
    if (!url) { toast.error("Could not generate a link for this file"); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openImage = async (path: string) => {
    const url = await signedUrlFor(path);
    if (!url) { toast.error("Could not open image"); return; }
    setLightbox(url);
  };

  const changeStatus = async (newStatus: string) => {
    if (!app || newStatus === app.verification_status) return;
    const prev = app.verification_status;
    const { error } = await supabase.from("trade_applications").update({ verification_status: newStatus }).eq("id", app.id);
    if (error) { toast.error(error.message); return; }
    await logApplicationEvent(app.id, "status_changed", { from: prev, to: newStatus });
    setApp({ ...app, verification_status: newStatus });
    await refreshEvents(app.id);
    toast.success(`Status set to ${STATUS_LABEL[newStatus]}`);
  };

  const toggleCheck = async (checkId: string, label: string) => {
    if (!app) return;
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    const current = app.verification_checks ?? {};
    const wasChecked = current[checkId]?.checked;
    const next = { ...current };
    if (wasChecked) next[checkId] = { checked: false };
    else next[checkId] = { checked: true, by: user?.id, by_email: user?.email ?? undefined, at: new Date().toISOString() };
    const { error } = await supabase.from("trade_applications").update({ verification_checks: next as never }).eq("id", app.id);
    if (error) { toast.error(error.message); return; }
    await logApplicationEvent(app.id, wasChecked ? "check_unticked" : "check_ticked", { check: checkId, label });
    setApp({ ...app, verification_checks: next });
    await refreshEvents(app.id);
  };

  const saveNotes = async () => {
    if (!app) return;
    setSavingNotes(true);
    const { error } = await supabase.from("trade_applications").update({ admin_notes: notes }).eq("id", app.id);
    if (!error) { await logApplicationEvent(app.id, "notes_updated", {}); toast.success("Notes saved"); }
    else toast.error(error.message);
    setSavingNotes(false);
  };

  const updateRef = async (r: TradeReference, patch: Partial<TradeReference>) => {
    const { data: userData } = await supabase.auth.getUser();
    const merged = { ...r, ...patch };
    const { error } = await supabase.from("trade_references").update({
      status: merged.status as never,
      admin_notes: merged.admin_notes,
      status_updated_at: merged.status_updated_at,
      status_updated_by: userData?.user?.id ?? null,
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    setRefs((list) => list.map((x) => (x.id === r.id ? merged : x)));
    if (app) await logApplicationEvent(app.id, "reference_updated", { reference: merged.contact_name, status: merged.status });
  };

  const decide = async (decision: "approved" | "rejected" | "held") => {
    if (!app) return;
    const verb = decision === "approved" ? "approve" : decision === "rejected" ? "reject" : "hold";
    const reason = window.prompt(`Enter a short reason to ${verb} this application:`);
    if (reason === null) return;
    if (!reason.trim()) { toast.error("A reason is required"); return; }
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("trade_applications").update({
      verification_status: decision,
      decision_reason: reason.trim(),
      decided_by: userData?.user?.id ?? null,
      decided_at: new Date().toISOString(),
    }).eq("id", app.id);
    if (error) { toast.error(error.message); return; }
    await logApplicationEvent(app.id, `decision_${decision}`, { reason: reason.trim() });
    let emailSent = false;
    if ((decision === "approved" || decision === "rejected") && app.applicant_email) {
      const firstName = (app.full_name || "").trim().split(/\s+/)[0] || "";
      try {
        const { error: emailError } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: decision === "approved" ? "trade-verified" : "trade-rejected",
            recipientEmail: app.applicant_email,
            idempotencyKey: `application-${decision}-${app.id}`,
            templateData: decision === "approved" ? { firstName } : { firstName, reason: reason.trim() },
          },
        });
        if (emailError) throw emailError;
        emailSent = true;
        await logApplicationEvent(app.id, "email_queued", { type: decision });
      } catch (e) {
        console.warn("application decision email failed", e);
        await logApplicationEvent(app.id, "email_failed", { type: decision });
      }
    }
    setApp({ ...app, verification_status: decision, decision_reason: reason.trim(), decided_at: new Date().toISOString() });
    await refreshEvents(app.id);
    toast.success(`Application ${STATUS_LABEL[decision].toLowerCase()}${decision !== "held" ? (emailSent ? " — applicant email sent" : " — but email could not be sent") : ""}`);
  };

  if (loading) return <div style={{ minHeight: "100vh", background: C.cream, padding: 40, color: C.deep }}>Loading…</div>;
  if (!app) return (
    <div style={{ minHeight: "100vh", background: C.cream, padding: 40 }}>
      <p style={{ color: C.deep }}>Application not found. <Link to="/admin/applications" style={{ color: C.teal }}>Back to list</Link></p>
    </div>
  );

  const fd = app.form_data ?? {};
  const docPaths = app.document_paths ?? {};
  const isTimeServed = (app.qualification_path ?? "").includes("time");

  // Free-text declarations to surface as plain text
  const declarations: { label: string; value: string }[] = [
    { label: "Portfolio description", value: String(fd.portfolio_description ?? "") },
    { label: "Trading history", value: String(fd.trading_history_description ?? "") },
    { label: "Time-served specialism", value: String(fd.ts_specialism ?? "") },
  ].filter((d) => d.value.trim());

  const summaryRow = (label: string, value?: string | null) => (
    <div style={{ display: "flex", gap: 8, fontSize: 13, padding: "3px 0" }}>
      <span style={{ color: C.secondary, minWidth: 130 }}>{label}</span>
      <span style={{ color: C.deep, fontWeight: 600 }}>{value || "—"}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <SEO title={`${app.full_name || "Application"} — Admin`} description="Trade application review." path={`/admin/applications/${app.id}`} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => navigate("/admin/applications")} style={{ background: "none", border: "none", color: C.teal, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 14 }}>← All applications</button>

        {/* Summary */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: C.deep, margin: "0 0 2px" }}>{app.full_name || "—"}</h1>
              <div style={{ fontSize: 13, color: C.secondary }}>Submitted {format(new Date(app.created_at), "d MMM yyyy, HH:mm")}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.secondary, marginBottom: 4 }}>Verification status</div>
              <select value={app.verification_status} onChange={(e) => changeStatus(e.target.value)}
                style={{ ...inputStyle, width: "auto", fontWeight: 700, color: C.white, background: STATUS_COLOR[app.verification_status] || C.secondary, border: "none" }}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value} style={{ color: C.deep, background: C.white }}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            {summaryRow("Email", app.applicant_email)}
            {summaryRow("Phone", String(fd.phone ?? ""))}
            {summaryRow("Business", app.business_name)}
            {summaryRow("Business type", String(fd.business_type ?? ""))}
            {summaryRow("Postcode", String(fd.postcode ?? ""))}
            {summaryRow("Trade", app.trade_category_id)}
            {summaryRow("Qualification route", QUAL_LABEL[app.qualification_path ?? ""] || app.qualification_path)}
            {summaryRow("Address", [fd.address_line1, fd.city].filter(Boolean).join(", "))}
          </div>
        </div>

        {/* Documents */}
        <div style={card}>
          <h2 style={h2}>Documents</h2>
          {DOC_GROUPS.map((group) => {
            const docs: DocMeta[] = group.fields.flatMap((f) => docPaths[f] ?? []);
            if (!docs.length) return null;
            const photos = group.heading === "Portfolio Photos";
            return (
              <div key={group.heading} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.deep, marginBottom: 8 }}>{group.heading}</div>
                {photos ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
                    {docs.map((d) => (
                      <button key={d.path} onClick={() => openImage(d.path)} title={`${d.filename} · ${fmtSize(d.size)}`}
                        style={{ aspectRatio: "1 / 1", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", background: C.cream, cursor: "pointer", padding: 0 }}>
                        <Thumb path={d.path} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {docs.map((d) => (
                      <div key={d.path} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12, color: C.secondary }}>
                        <button onClick={() => (isImage(d.mime) ? openImage(d.path) : openDoc(d.path))} style={{ background: C.teal, color: C.white, border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View / Download</button>
                        <span style={{ color: C.deep, fontWeight: 600 }}>{d.filename}</span>
                        <span>{fmtSize(d.size)}</span>
                        <span>{d.uploaded_at ? format(new Date(d.uploaded_at), "d MMM yyyy") : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {Object.values(docPaths).flat().length === 0 && <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>No documents uploaded.</p>}
        </div>

        {/* Declarations */}
        {declarations.length > 0 && (
          <div style={card}>
            <h2 style={h2}>Declarations</h2>
            {declarations.map((d) => (
              <div key={d.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.deep, marginBottom: 4 }}>{d.label}</div>
                <p style={{ fontSize: 13, color: C.deep, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5 }}>{d.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* References (time-served) */}
        {isTimeServed && (
          <div style={card}>
            <h2 style={h2}>Trade references</h2>
            {refs.length === 0 && <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>No references on file.</p>}
            {refs.map((r) => {
              const contacted = r.status === "contacted" || r.status === "verified";
              const dateVal = r.status_updated_at ? r.status_updated_at.slice(0, 10) : "";
              return (
                <div key={r.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{r.contact_name}</div>
                  <div style={{ fontSize: 12, color: C.secondary, marginBottom: 8 }}>
                    {r.relationship} · {r.phone || "no phone"} · {r.email || "no email"}
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                    <label style={{ fontSize: 13, color: C.deep, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={contacted} onChange={(e) => updateRef(r, { status: e.target.checked ? "contacted" : "not_contacted", status_updated_at: e.target.checked ? new Date().toISOString() : r.status_updated_at })} />
                      Reference contacted
                    </label>
                    <label style={{ fontSize: 12, color: C.secondary, display: "flex", alignItems: "center", gap: 6 }}>
                      Date
                      <input type="date" value={dateVal} onChange={(e) => updateRef(r, { status_updated_at: e.target.value ? new Date(e.target.value).toISOString() : null })} style={{ ...inputStyle, width: "auto" }} />
                    </label>
                  </div>
                  <textarea defaultValue={r.admin_notes ?? ""} placeholder="Notes from the call…" rows={2}
                    onBlur={(e) => { if (e.target.value !== (r.admin_notes ?? "")) updateRef(r, { admin_notes: e.target.value }); }}
                    style={{ ...inputStyle, resize: "vertical" }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Verification checklist */}
        <div style={card}>
          <h2 style={h2}>Verification checklist</h2>
          {VERIFICATION_CHECKS.map((c) => {
            const state = app.verification_checks?.[c.id];
            return (
              <label key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", fontSize: 13, color: C.deep, cursor: "pointer" }}>
                <input type="checkbox" checked={!!state?.checked} onChange={() => toggleCheck(c.id, c.label)} style={{ marginTop: 2 }} />
                <span>
                  <span style={{ fontWeight: 600 }}>{c.label}</span>
                  {state?.checked && state.at && (
                    <span style={{ display: "block", fontSize: 11, color: C.secondary }}>
                      Ticked by {state.by_email || "admin"} on {format(new Date(state.at), "d MMM yyyy, HH:mm")}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        {/* Admin notes */}
        <div style={card}>
          <h2 style={h2}>Admin notes <span style={{ fontSize: 11, fontWeight: 400, color: C.secondary }}>(never shown to applicant)</span></h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Internal notes…" style={{ ...inputStyle, resize: "vertical" }} />
          <button onClick={saveNotes} disabled={savingNotes} style={{ marginTop: 8, background: C.deep, color: C.white, border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: savingNotes ? 0.6 : 1 }}>
            {savingNotes ? "Saving…" : "Save notes"}
          </button>
        </div>

        {/* Decision */}
        <div style={card}>
          <h2 style={h2}>Decision</h2>
          {app.decision_reason && (
            <p style={{ fontSize: 12, color: C.secondary, margin: "0 0 10px" }}>
              Last decision: <strong style={{ color: C.deep }}>{STATUS_LABEL[app.verification_status]}</strong>
              {app.decided_at ? ` on ${format(new Date(app.decided_at), "d MMM yyyy")}` : ""} — "{app.decision_reason}"
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => decide("approved")} style={{ background: C.green, color: C.white, border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Approve</button>
            <button onClick={() => decide("rejected")} style={{ background: C.red, color: C.white, border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reject</button>
            <button onClick={() => decide("held")} style={{ background: C.amber, color: C.white, border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Hold</button>
          </div>
        </div>

        {/* Audit trail */}
        <div style={card}>
          <h2 style={h2}>Audit trail</h2>
          {events.length === 0 && <p style={{ fontSize: 13, color: C.secondary, margin: 0 }}>No events recorded yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {events.map((e) => (
              <div key={e.id} style={{ fontSize: 12, color: C.secondary, borderLeft: `2px solid ${C.border}`, paddingLeft: 10 }}>
                <span style={{ color: C.deep, fontWeight: 600 }}>{describeEvent(e)}</span>
                {" — "}{e.actor_email || "admin"} · {format(new Date(e.created_at), "d MMM yyyy, HH:mm")}
              </div>
            ))}
          </div>
        </div>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <img src={lightbox} alt="Portfolio work" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

function Thumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { let live = true; signedUrlFor(path).then((u) => { if (live) setUrl(u); }); return () => { live = false; }; }, [path]);
  if (!url) return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖼️</div>;
  return <img src={url} alt="Work" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}

function describeEvent(e: ApplicationEvent): string {
  const d = e.detail ?? {};
  switch (e.event_type) {
    case "status_changed": return `Status changed: ${STATUS_LABEL[String(d.from)] ?? d.from} → ${STATUS_LABEL[String(d.to)] ?? d.to}`;
    case "check_ticked": return `Checked: ${d.label}`;
    case "check_unticked": return `Unchecked: ${d.label}`;
    case "notes_updated": return "Admin notes updated";
    case "reference_updated": return `Reference updated: ${d.reference} (${d.status})`;
    case "decision_approved": return `Approved — "${d.reason}"`;
    case "decision_rejected": return `Rejected — "${d.reason}"`;
    case "decision_held": return `Held — "${d.reason}"`;
    case "email_queued": return `Email queued (${d.type})`;
    default: return e.event_type;
  }
}
