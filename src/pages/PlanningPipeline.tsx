import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import {
  C,
  CONTACT_METHODS,
  LETTER_TEMPLATES,
  QUICK_VIEWS,
  RESPONSE_STATES,
  buildFunnel,
  buildToday,
  campaignFor,
  daysSince,
  fmt,
  fmtCompact,
  fmtDate,
  isContacted,
  isSkipped,
  lastContactAt,
  matchesView,
  nextActionFor,
  outreachChip,
  responseLabel,
  type Agent,
  type Lead,
  type LeadEvent,
  type QuickView,
} from "./planningPipelineModel";

/* ------------------------------------------------------------------ */
/* Small shared primitives                                             */
/* ------------------------------------------------------------------ */

const inp = (): CSSProperties => ({
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: "rgba(255,255,255,0.04)",
  color: C.cream,
  fontSize: 12,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
});

const Chip = ({ label, color, title }: { label: string; color: string; title?: string }) => (
  <span
    title={title}
    style={{
      display: "inline-block",
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: "0.06em",
      color,
      background: `${color}1F`,
      borderRadius: 5,
      padding: "2px 7px",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p
    style={{
      fontSize: 9.5,
      fontWeight: 700,
      color: C.dim,
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      margin: "0 0 10px",
    }}
  >
    {children}
  </p>
);

const Panel = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ background: "rgba(255,255,255,0.035)", borderRadius: 12, padding: "14px 16px", ...style }}>
    {children}
  </div>
);

const btn = (variant: "primary" | "ghost" | "quiet", extra?: CSSProperties): CSSProperties => ({
  border: variant === "primary" ? "none" : `1px solid ${variant === "ghost" ? "rgba(13,148,136,0.5)" : C.line}`,
  background: variant === "primary" ? C.teal : "transparent",
  color: variant === "primary" ? C.white : variant === "ghost" ? C.tealBright : C.dim,
  borderRadius: 8,
  padding: "7px 12px",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
  ...extra,
});

/* ------------------------------------------------------------------ */
/* Lead card                                                           */
/* ------------------------------------------------------------------ */

const LeadCard = ({
  lead,
  selected,
  onSelect,
}: {
  lead: Lead;
  selected: boolean;
  onSelect: (l: Lead) => void;
}) => {
  const chip = outreachChip(lead);
  const days = daysSince(lead.submitted_date);
  return (
    <div
      onClick={() => onSelect(lead)}
      style={{
        display: "flex",
        gap: 10,
        background: selected ? "rgba(13,148,136,0.14)" : "rgba(255,255,255,0.03)",
        boxShadow: selected ? `inset 0 0 0 1px ${C.teal}` : "none",
        borderRadius: 10,
        padding: "10px 12px 10px 10px",
        cursor: "pointer",
        marginBottom: 6,
        opacity: isSkipped(lead) ? 0.5 : 1,
        transition: "background 0.12s",
      }}
    >
      <span style={{ width: 3, borderRadius: 3, background: chip.color, flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: selected ? C.cream : "rgba(245,240,232,0.92)",
              margin: 0,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lead.site_address}
          </p>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.tealBright, flexShrink: 0 }}>
            {fmt(lead.estimated_value_max)}
          </span>
        </div>
        <p style={{ fontSize: 10, color: C.faint, margin: "2px 0 0" }}>
          {lead.council_name} · {lead.application_ref}
        </p>
        {lead.description && (
          <p
            style={{
              fontSize: 10.5,
              color: C.dim,
              margin: "4px 0 0",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lead.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 7 }}>
          <Chip label={chip.label} color={chip.color} />
          <span style={{ fontSize: 9.5, color: C.faint, whiteSpace: "nowrap" }}>
            {chip.date ? fmtDate(chip.date) : `${days} days`}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Lead detail                                                         */
/* ------------------------------------------------------------------ */

const LeadDetail = ({
  lead,
  agent,
  events,
  onSaved,
  onSkip,
  onLog,
}: {
  lead: Lead;
  agent?: Agent;
  events: LeadEvent[];
  onSaved: () => void;
  onSkip: (l: Lead, skip: boolean) => void;
  onLog: (leadId: string, type: string, detail?: string, template?: string) => Promise<void>;
}) => {
  const [notes, setNotes] = useState(lead.notes || "");
  const [nextAction, setNextAction] = useState(lead.next_action || "");
  const [template, setTemplate] = useState(lead.homeowner_letter_template || "A");
  const [editUrl, setEditUrl] = useState(false);
  const [councilUrl, setCouncilUrl] = useState(lead.council_application_url || "");
  const [busy, setBusy] = useState(false);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    setNotes(lead.notes || "");
    setNextAction(lead.next_action || "");
    setTemplate(lead.homeowner_letter_template || "A");
    setCouncilUrl(lead.council_application_url || "");
    setEditUrl(false);
  }, [lead.id]);

  const patch = useCallback(
    async (values: Record<string, unknown>, successTitle?: string) => {
      setBusy(true);
      const { error } = await supabase.from("planning_leads").update(values as never).eq("id", lead.id);
      setBusy(false);
      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
        return false;
      }
      if (successTitle) toast({ title: successTitle });
      onSaved();
      return true;
    },
    [lead.id, onSaved],
  );

  const na = nextActionFor(lead);
  const ds = daysSince(lead.submitted_date);

  const markReviewed = async () => {
    if (await patch({ reviewed_at: new Date().toISOString() }, "Lead reviewed")) {
      await onLog(lead.id, "reviewed", "Lead reviewed");
    }
  };

  const addToBatch = async () => {
    if (lead.letter_batch_status === "queued") {
      if (await patch({ letter_batch_status: null, letter_batch_added_at: null }, "Removed from letter batch")) {
        await onLog(lead.id, "batch_removed", "Removed from letter batch");
      }
      return;
    }
    const ok = await patch(
      {
        letter_batch_status: "queued",
        letter_batch_added_at: new Date().toISOString(),
        homeowner_letter_template: template,
        outreach_campaign: campaignFor(template),
        reviewed_at: lead.reviewed_at || new Date().toISOString(),
      },
      `Added to letter batch — Template ${template}`,
    );
    if (ok) await onLog(lead.id, "batch_added", `Added to letter batch`, template);
  };

  const recordContact = async (party: "homeowner" | "agent", method: string) => {
    const now = new Date().toISOString();
    const values: Record<string, unknown> =
      party === "homeowner"
        ? {
            homeowner_contacted: true,
            homeowner_contacted_at: lead.homeowner_contacted_at || now,
            homeowner_last_contact_at: now,
            homeowner_last_contact_method: method,
            homeowner_contact_methods: Array.from(new Set([...(lead.homeowner_contact_methods || []), method])),
            ...(method === "letter"
              ? {
                  letter_sent_at: now,
                  outreach_status: "letter_sent",
                  homeowner_letter_template: template,
                  outreach_campaign: campaignFor(template),
                }
              : {}),
          }
        : {
            agent_contacted: true,
            agent_contacted_at: lead.agent_contacted_at || now,
            agent_last_contact_at: now,
            agent_last_contact_method: method,
            agent_outreach_status: "contacted",
            agent_contact_methods: Array.from(new Set([...(lead.agent_contact_methods || []), method])),
          };
    const label = CONTACT_METHODS.find((m) => m.id === method)?.label ?? method;
    if (await patch(values, `${party === "homeowner" ? "Homeowner" : "Agent"} contact recorded — ${label}`)) {
      await onLog(
        lead.id,
        party === "homeowner" ? "homeowner_contact" : "agent_contact",
        `${label} — ${party === "homeowner" ? "homeowner" : "architect/agent"}`,
        method === "letter" ? template : undefined,
      );
    }
  };

  const setResponse = async (state: string) => {
    const next = lead.response_state === state ? null : state;
    if (
      await patch(
        { response_state: next, response_at: next ? new Date().toISOString() : null },
        next ? `Outcome: ${responseLabel(next)}` : "Outcome cleared",
      )
    ) {
      if (next) await onLog(lead.id, "response", responseLabel(next) || next);
    }
  };

  const saveUrl = async () => {
    const t = councilUrl.trim();
    if (t && !/^https?:\/\//i.test(t)) {
      toast({ title: "Invalid URL", description: "Must start with http:// or https://", variant: "destructive" });
      return;
    }
    if (await patch({ council_application_url: t || null }, "Council URL saved")) setEditUrl(false);
  };

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text);
    toast({ title: `${what} copied` });
  };

  const enrichFromPdf = async () => {
    setEnriching(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("enrich-planning-lead-pdf", {
      body: { lead_id: lead.id },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    setEnriching(false);
    if (error) {
      let detail = error.message;
      try {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) detail = body.error;
        }
      } catch {
        /* keep generic message */
      }
      toast({ title: "PDF enrich failed", description: detail, variant: "destructive" });
      return;
    }
    const r = data as { error?: string };
    if (r?.error) toast({ title: "PDF enrich failed", description: r.error, variant: "destructive" });
    else {
      toast({ title: "PDF read", description: "Applicant & agent details extracted." });
      onSaved();
    }
  };

  const info: [string, string][] = [
    ["Reference", lead.application_ref],
    ["Council", lead.council_name],
    ["Type", lead.application_type || "—"],
    ["Submitted", `${fmtDate(lead.submitted_date)} (${ds} days)`],
    ["Applicant", lead.applicant_name || "Not listed"],
    ["Postcode", lead.postcode || "—"],
    ["Estimated value", fmt(lead.estimated_value_max)],
    ["Status", lead.status.replace(/_/g, " ")],
  ];

  const naTone = na.tone === "amber" ? C.amberBright : na.tone === "grey" ? C.dim : C.tealBright;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px 24px 40px", color: C.cream }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>{lead.site_address}</h2>
            <p style={{ fontSize: 12, color: C.dim, margin: "6px 0 0", lineHeight: 1.5 }}>{lead.description}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.tealBright }}>{fmt(lead.estimated_value_max)}</span>
              <span style={{ fontSize: 11, color: C.faint }}>{ds} days</span>
              <span style={{ fontSize: 11, color: C.faint }}>{lead.council_name}</span>
              <span style={{ fontSize: 11, color: C.faint }}>{lead.application_ref}</span>
              <Chip {...outreachChip(lead)} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <a
            href={lead.council_application_url || undefined}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              if (!lead.council_application_url) {
                e.preventDefault();
                setEditUrl(true);
              }
            }}
            style={{
              ...btn("ghost"),
              textDecoration: "none",
              opacity: lead.council_application_url ? 1 : 0.55,
              display: "inline-block",
            }}
          >
            Open council record
          </a>
          {lead.pdf_source_url && (
            <a href={lead.pdf_source_url} target="_blank" rel="noreferrer" style={{ ...btn("quiet"), textDecoration: "none" }}>
              Open PDF
            </a>
          )}
          <button
            onClick={() => lead.council_application_url && copy(lead.council_application_url, "Link")}
            disabled={!lead.council_application_url}
            style={btn("quiet", { opacity: lead.council_application_url ? 1 : 0.5 })}
          >
            Copy link
          </button>
          <button onClick={addToBatch} disabled={busy} style={btn(lead.letter_batch_status === "queued" ? "quiet" : "primary")}>
            {lead.letter_batch_status === "queued" ? "Remove from letter batch" : "Add to letter batch"}
          </button>
          <button onClick={() => setEditUrl((v) => !v)} style={btn("quiet")}>
            {editUrl ? "Close" : "Edit URL"}
          </button>
          <button onClick={enrichFromPdf} disabled={enriching || !lead.council_application_url} style={btn("quiet")}>
            {enriching ? "Reading PDF…" : lead.pdf_enriched_at ? "Re-read PDF form" : "Read PDF form"}
          </button>
          <button onClick={() => onSkip(lead, !isSkipped(lead))} style={btn("quiet")}>
            {isSkipped(lead) ? "Restore lead" : "Skip lead"}
          </button>
        </div>

        {editUrl && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <input
              type="url"
              value={councilUrl}
              onChange={(e) => setCouncilUrl(e.target.value)}
              placeholder="https://publicaccess.council.gov.uk/online-applications/..."
              style={inp()}
            />
            <button onClick={saveUrl} disabled={busy} style={btn("primary")}>
              Save
            </button>
          </div>
        )}
      </div>

      {/* Next action */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: `${naTone}14`,
          boxShadow: `inset 0 0 0 1px ${naTone}44`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", color: C.dim, margin: 0 }}>NEXT ACTION</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: naTone, margin: "3px 0 0" }}>
            {nextAction.trim() || na.label}
          </p>
          {na.hint && !nextAction.trim() && (
            <p style={{ fontSize: 10.5, color: C.faint, margin: "2px 0 0" }}>{na.hint}</p>
          )}
        </div>
        {na.key === "review" && (
          <button onClick={markReviewed} style={btn("primary")}>
            Mark reviewed
          </button>
        )}
        {na.key === "add_batch" && (
          <button onClick={addToBatch} style={btn("primary")}>
            Add to letter batch
          </button>
        )}
        {na.key === "follow_up" && (
          <button onClick={() => recordContact("homeowner", "letter")} style={btn("primary")}>
            Log follow-up letter
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {/* Outreach — homeowner */}
        <Panel>
          <SectionLabel>Outreach — homeowner</SectionLabel>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 12 }}>
            {[
              ["Status", outreachChip(lead).label],
              ["Last contact", lastContactAt(lead) ? fmtDate(lastContactAt(lead)) : "—"],
              ["Method", lead.homeowner_last_contact_method || (lead.letter_sent_at ? "letter" : "—")],
              ["Template", lead.homeowner_letter_template ? `Template ${lead.homeowner_letter_template}` : "—"],
              ["Campaign", lead.outreach_campaign || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 9.5, color: C.faint, margin: 0, letterSpacing: "0.08em" }}>{k.toUpperCase()}</p>
                <p style={{ fontSize: 12, color: C.cream, margin: "2px 0 0", fontWeight: 600 }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 10.5, color: C.faint }}>Template</span>
            {LETTER_TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                style={btn(template === t ? "primary" : "quiet", { padding: "5px 12px" })}
              >
                {t}
              </button>
            ))}
            <span style={{ width: 12 }} />
            {CONTACT_METHODS.map((m) => (
              <button key={m.id} onClick={() => recordContact("homeowner", m.id)} disabled={busy} style={btn("ghost")}>
                Log {m.label.toLowerCase()}
              </button>
            ))}
          </div>
          {lead.applicant_address && (
            <p style={{ fontSize: 11, color: C.dim, margin: "10px 0 0" }}>
              {lead.applicant_name ? `${lead.applicant_name} · ` : ""}
              {lead.applicant_address}
            </p>
          )}
        </Panel>

        {/* Architect / agent */}
        <Panel>
          <SectionLabel>Architect / agent</SectionLabel>
          {agent || lead.agent_name ? (
            <>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                  {agent?.company_name || agent?.contact_name || lead.agent_name}
                </p>
                <Chip
                  label={(lead.agent_outreach_status || "not contacted").toUpperCase()}
                  color={lead.agent_outreach_status === "contacted" ? C.amberBright : C.faint}
                />
                {agent?.email && (
                  <button onClick={() => copy(agent.email!, "Email")} style={btn("quiet", { padding: "3px 9px" })}>
                    {agent.email}
                  </button>
                )}
              </div>
              {lead.agent_last_contact_at && (
                <p style={{ fontSize: 11, color: C.dim, margin: "6px 0 0" }}>
                  Last contact {fmtDate(lead.agent_last_contact_at)} · {lead.agent_last_contact_method}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {CONTACT_METHODS.map((m) => (
                  <button key={m.id} onClick={() => recordContact("agent", m.id)} disabled={busy} style={btn("ghost")}>
                    {m.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>Not identified</p>
              <button onClick={enrichFromPdf} disabled={enriching || !lead.council_application_url} style={btn("quiet")}>
                + Identify from PDF form
              </button>
            </div>
          )}
        </Panel>

        {/* Response / outcome */}
        <Panel>
          <SectionLabel>Response / outcome</SectionLabel>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RESPONSE_STATES.map((r) => {
              const on = lead.response_state === r.id;
              const color =
                r.tone === "teal" ? C.tealBright : r.tone === "purple" ? C.purple : r.tone === "red" ? C.red : C.dim;
              return (
                <button
                  key={r.id}
                  onClick={() => setResponse(r.id)}
                  style={{
                    background: on ? color : "transparent",
                    color: on ? C.white : color,
                    border: `1px solid ${on ? color : C.line}`,
                    borderRadius: 20,
                    padding: "5px 12px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          {lead.response_state === "draftline_enquiry" && (
            <p style={{ fontSize: 10.5, color: C.purple, margin: "10px 0 0" }}>
              Source attribution retained: ProGrafter Planning Outreach
              {lead.outreach_campaign ? ` · ${lead.outreach_campaign}` : ""}.
            </p>
          )}
          {lead.response_at && (
            <p style={{ fontSize: 10.5, color: C.faint, margin: "8px 0 0" }}>Recorded {fmtDate(lead.response_at)}</p>
          )}
        </Panel>

        {/* Planning application info */}
        <Panel>
          <SectionLabel>Planning application</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px 18px" }}>
            {info.map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 9.5, color: C.faint, margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {k}
                </p>
                <p style={{ fontSize: 12, color: C.cream, margin: "2px 0 0", fontWeight: 500, wordBreak: "break-word" }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Activity */}
        <Panel>
          <SectionLabel>Activity</SectionLabel>
          {events.length === 0 ? (
            <p style={{ fontSize: 11.5, color: C.faint, margin: 0 }}>No recorded activity yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 7 }}>
              {events.map((e) => (
                <div key={e.id} style={{ display: "flex", gap: 10, fontSize: 11.5 }}>
                  <span style={{ color: C.faint, minWidth: 92 }}>{fmtDate(e.created_at)}</span>
                  <span style={{ color: C.cream }}>
                    {e.detail || e.event_type}
                    {e.template ? ` — Template ${e.template}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Notes + manual next action */}
        <Panel>
          <SectionLabel>Notes</SectionLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes on this lead — conversations, outcomes…"
            style={{ ...inp(), resize: "vertical", marginBottom: 8 }}
          />
          <input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="Override next action (optional)"
            style={{ ...inp(), marginBottom: 8 }}
          />
          <button
            onClick={() => patch({ notes, next_action: nextAction }, "Lead updated")}
            disabled={busy}
            style={btn("primary", { width: "100%", padding: "10px" })}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </Panel>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Agent card (unchanged behaviour)                                    */
/* ------------------------------------------------------------------ */

const AGENT_STATUS: Record<string, { label: string; color: string }> = {
  identified: { label: "Identified", color: C.purple },
  contacted: { label: "Contacted", color: C.amberBright },
  interested: { label: "Interested", color: C.tealBright },
  partner: { label: "Partner", color: C.green },
  not_interested: { label: "Not interested", color: C.dim },
};

const AgentCard = ({
  agent,
  onSelect,
  selected,
  leadCount,
}: {
  agent: Agent;
  onSelect: (a: Agent) => void;
  selected: boolean;
  leadCount: number;
}) => {
  const status = AGENT_STATUS[agent.relationship_status] || AGENT_STATUS.identified;
  return (
    <div
      onClick={() => onSelect(agent)}
      style={{
        background: selected ? "rgba(13,148,136,0.14)" : "rgba(255,255,255,0.03)",
        boxShadow: selected ? `inset 0 0 0 1px ${C.teal}` : "none",
        borderRadius: 10,
        padding: "10px 14px",
        cursor: "pointer",
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: C.cream, margin: 0 }}>{agent.contact_name}</p>
          <p style={{ fontSize: 10.5, color: C.tealBright, margin: "2px 0 0" }}>{agent.company_name || "Independent"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <Chip label={status.label} color={status.color} />
          <span style={{ fontSize: 10, color: leadCount > 1 ? C.amberBright : C.faint }}>
            {leadCount} app{leadCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20;
const LS_BAND = "pp_value_band";
const LS_SORT = "pp_sort";

const VALUE_BANDS = [
  { id: "all", label: "All", min: 0 },
  { id: "40k", label: "£40k+", min: 40000 },
  { id: "80k", label: "£80k+", min: 80000 },
  { id: "150k", label: "£150k+", min: 150000 },
];
const SORT_OPTIONS = [
  { id: "value_desc", label: "Value (high to low)" },
  { id: "value_asc", label: "Value (low to high)" },
  { id: "newest", label: "Newest" },
  { id: "deadline", label: "Oldest first" },
];

export default function PlanningPipeline() {
  const [tab, setTab] = useState<"leads" | "batch" | "agents" | "insights">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [view, setView] = useState<QuickView>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [ingesting, setIngesting] = useState(false);
  const [valueBand, setValueBand] = useState<string>(() => localStorage.getItem(LS_BAND) || "40k");
  const [sortBy, setSortBy] = useState<string>(() => localStorage.getItem(LS_SORT) || "value_desc");
  const [showSkipped, setShowSkipped] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => localStorage.setItem(LS_BAND, valueBand), [valueBand]);
  useEffect(() => localStorage.setItem(LS_SORT, sortBy), [sortBy]);
  useEffect(() => setPage(0), [view, search, valueBand, sortBy, showSkipped]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: lData, error: lErr }, { data: aData, error: aErr }] = await Promise.all([
      supabase.from("planning_leads").select("*").order("priority_score", { ascending: false }),
      supabase.from("planning_agents").select("*").order("created_at", { ascending: false }),
    ]);
    if (lErr) toast({ title: "Failed to load leads", description: lErr.message, variant: "destructive" });
    if (aErr) toast({ title: "Failed to load agents", description: aErr.message, variant: "destructive" });
    setLeads(((lData as unknown) as Lead[]) || []);
    setAgents(((aData as unknown) as Agent[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Activity for the selected lead only — keeps the page light.
  useEffect(() => {
    if (!selectedLeadId) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("planning_lead_events")
        .select("*")
        .eq("lead_id", selectedLeadId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled) setEvents(((data as unknown) as LeadEvent[]) || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLeadId, leads]);

  const logEvent = useCallback(async (leadId: string, type: string, detail?: string, template?: string) => {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("planning_lead_events").insert({
      lead_id: leadId,
      event_type: type,
      detail: detail ?? null,
      template: template ?? null,
      created_by: auth.user?.id ?? null,
    } as never);
  }, []);

  const runIngest = async () => {
    setIngesting(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("ingest-planning-leads", {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    setIngesting(false);
    if (error) {
      toast({ title: "Ingest failed", description: error.message, variant: "destructive" });
      return;
    }
    const r = data as { started?: boolean; inserted?: number; fetched?: number; councils?: number };
    if (r.started) {
      toast({
        title: "Planning ingest started",
        description: `Scanning ${r.councils ?? 8} Notts councils in the background.`,
      });
      setTimeout(load, 15000);
      setTimeout(load, 45000);
      setTimeout(load, 90000);
    } else {
      toast({
        title: "Planning ingest complete",
        description: `${r.inserted ?? 0} new Notts leads from ${r.councils ?? 0} councils (${r.fetched ?? 0} scanned)`,
      });
      void load();
    }
  };

  const skipLead = async (l: Lead, skip: boolean) => {
    const { error } = await supabase
      .from("planning_leads")
      .update({ outreach_status: skip ? "skipped" : "not_contacted" } as never)
      .eq("id", l.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: skip ? "Lead skipped" : "Lead restored" });
      void load();
    }
  };

  const agentsById = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a])), [agents]);
  const leadsByAgent = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of leads) if (l.agent_id) m[l.agent_id] = (m[l.agent_id] ?? 0) + 1;
    return m;
  }, [leads]);

  const bandMin = useMemo(() => VALUE_BANDS.find((b) => b.id === valueBand)?.min ?? 0, [valueBand]);

  const filteredLeads = useMemo(() => {
    const out = leads.filter((l) => {
      if (!showSkipped && isSkipped(l)) return false;
      if (!matchesView(l, view)) return false;
      if (bandMin > 0 && (Number(l.estimated_value_max) || 0) < bandMin) return false;
      if (search) {
        const s = search.toLowerCase();
        const a = l.agent_id ? agentsById[l.agent_id] : null;
        if (
          !l.site_address.toLowerCase().includes(s) &&
          !(l.description || "").toLowerCase().includes(s) &&
          !(l.application_ref || "").toLowerCase().includes(s) &&
          !(a?.contact_name || "").toLowerCase().includes(s) &&
          !(l.applicant_name || "").toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
    const val = (l: Lead) => Number(l.estimated_value_max) || 0;
    const sub = (l: Lead) => (l.submitted_date ? new Date(l.submitted_date).getTime() : 0);
    out.sort((a, b) => {
      switch (sortBy) {
        case "value_asc":
          return val(a) - val(b);
        case "value_desc":
          return val(b) - val(a);
        case "newest":
          return sub(b) - sub(a);
        case "deadline":
          return sub(a) - sub(b);
        default:
          return 0;
      }
    });
    return out;
  }, [leads, view, search, agentsById, bandMin, showSkipped, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const pageLeads = filteredLeads.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  /* ---- metrics ---- */
  const weekAgo = Date.now() - 7 * 86400000;
  const newThisWeek = leads.filter((l) => l.created_at && new Date(l.created_at).getTime() >= weekAgo).length;
  const totalValue = leads.reduce((s, l) => s + (Number(l.estimated_value_max) || 0), 0);
  const valueThisWeek = leads
    .filter((l) => l.created_at && new Date(l.created_at).getTime() >= weekAgo)
    .reduce((s, l) => s + (Number(l.estimated_value_max) || 0), 0);
  const hotLeads = leads.filter((l) => l.pipeline_status === "new" && daysSince(l.submitted_date) <= 14).length;
  const funnel = useMemo(() => buildFunnel(leads), [leads]);
  const today = useMemo(() => buildToday(leads), [leads]);
  const batchLeads = useMemo(() => leads.filter((l) => l.letter_batch_status === "queued"), [leads]);

  const markBatchSent = async () => {
    if (!batchLeads.length) return;
    const now = new Date().toISOString();
    const ids = batchLeads.map((l) => l.id);
    const { error } = await supabase
      .from("planning_leads")
      .update({
        letter_batch_status: "sent",
        letter_batch_sent_at: now,
        letter_sent_at: now,
        homeowner_contacted: true,
        homeowner_last_contact_at: now,
        homeowner_last_contact_method: "letter",
        outreach_status: "letter_sent",
        pipeline_status: "letter_sent",
      } as never)
      .in("id", ids);
    if (error) {
      toast({ title: "Batch update failed", description: error.message, variant: "destructive" });
      return;
    }
    await Promise.all(
      batchLeads.map((l) => logEvent(l.id, "letter_sent", "Letter sent", l.homeowner_letter_template || "A")),
    );
    toast({ title: `Batch marked sent`, description: `${ids.length} letters recorded as sent.` });
    void load();
  };

  const exportBatchCsv = () => {
    const rows = [
      ["applicant_name", "address", "postcode", "planning_ref", "council", "description", "template", "campaign"],
      ...batchLeads.map((l) => [
        l.applicant_name || "The Homeowner",
        l.applicant_address || l.site_address,
        l.postcode || "",
        l.application_ref,
        l.council_name,
        (l.description || "").replace(/[\r\n]+/g, " "),
        l.homeowner_letter_template || "A",
        l.outreach_campaign || campaignFor(l.homeowner_letter_template || "A") || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `prografter-letter-batch-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpi = (label: string, value: string, delta: string | null, color = C.cream) => (
    <div>
      <p style={{ fontSize: 9.5, color: C.faint, margin: 0, letterSpacing: "0.14em" }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color, margin: "2px 0 0", lineHeight: 1.1 }}>{value}</p>
      {delta && <p style={{ fontSize: 10.5, color: C.tealBright, margin: "2px 0 0" }}>{delta}</p>}
    </div>
  );

  const navTab = (id: typeof tab, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        padding: "12px 16px",
        border: "none",
        background: "transparent",
        borderBottom: `2px solid ${tab === id ? C.teal : "transparent"}`,
        color: tab === id ? C.cream : C.dim,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        height: isMobile ? "auto" : "100vh",
        fontFamily: "system-ui, sans-serif",
        background: C.deep,
        width: "100%",
        overflowX: "hidden",
      }}
    >
      {/* Masthead */}
      <div
        style={{
          padding: isMobile ? "12px 14px" : "14px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo variant="light" className="h-8 w-auto inline-block" />
          <span style={{ fontSize: 11, color: C.dim, fontWeight: 600, letterSpacing: "0.18em" }}>PLANNING PIPELINE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 18 : 32, flexWrap: "wrap" }}>
          {kpi("TOTAL LEADS", String(leads.length), newThisWeek ? `+${newThisWeek} this week` : null)}
          {kpi(
            "ESTIMATED VALUE",
            fmtCompact(totalValue),
            valueThisWeek ? `+${fmtCompact(valueThisWeek)} this week` : null,
            C.tealBright,
          )}
          <span style={{ fontSize: 10.5, color: C.faint }}>{hotLeads} hot</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/admin/trade-scraper" style={{ ...btn("quiet"), textDecoration: "none" }}>
              Trade scraper
            </Link>
            <button onClick={runIngest} disabled={ingesting} style={btn("primary", { opacity: ingesting ? 0.6 : 1 })}>
              {ingesting ? "Ingesting…" : "Ingest Notts planning"}
            </button>
          </div>
        </div>
      </div>

      {/* Funnel strip */}
      <div
        style={{
          display: "flex",
          gap: isMobile ? 14 : 28,
          padding: isMobile ? "10px 14px" : "10px 24px",
          background: C.surface,
          flexWrap: "wrap",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {(
          [
            ["IDENTIFIED", funnel.identified],
            ["QUALIFIED", funnel.qualified],
            ["CONTACTED", funnel.contacted],
            ["RESPONDED", funnel.responded],
            ["REGISTERED", funnel.registered],
            ["PROJECTS", funnel.projects],
          ] as [string, number][]
        ).map(([label, n], i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 28 }}>
            {i > 0 && <span style={{ color: C.faint, fontSize: 11 }}>→</span>}
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: n ? C.cream : C.faint }}>{n}</span>{" "}
              <span style={{ fontSize: 9.5, color: C.faint, letterSpacing: "0.1em" }}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Today strip */}
      <div
        style={{
          padding: isMobile ? "10px 14px" : "10px 24px",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 9.5, color: C.faint, letterSpacing: "0.14em", fontWeight: 700 }}>TODAY</span>
        {today.total === 0 ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: C.tealBright }}>TODAY'S PIPELINE CLEARED ✓</span>
        ) : (
          <>
            {today.toReview > 0 && (
              <button onClick={() => { setTab("leads"); setView("review"); }} style={btn("quiet")}>
                {today.toReview} to review
              </button>
            )}
            {today.lettersReady > 0 && (
              <button onClick={() => setTab("batch")} style={btn("quiet", { color: C.amberBright })}>
                {today.lettersReady} letters ready
              </button>
            )}
            {today.responsesToAction > 0 && (
              <button onClick={() => { setTab("leads"); setView("responses"); }} style={btn("quiet", { color: C.tealBright })}>
                {today.responsesToAction} responses to action
              </button>
            )}
            {today.followUpsDue > 0 && (
              <button onClick={() => { setTab("leads"); setView("contacted"); }} style={btn("quiet", { color: C.amberBright })}>
                {today.followUpsDue} follow-ups due
              </button>
            )}
          </>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: isMobile ? "0 8px" : "0 24px", borderBottom: `1px solid ${C.line}`, overflowX: "auto", flexShrink: 0 }}>
        {navTab("leads", `Leads (${leads.length})`)}
        {navTab("batch", `Letter batch (${batchLeads.length})`)}
        {navTab("agents", `Architects & agents (${agents.length})`)}
        {navTab("insights", "Insights")}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, padding: 40 }}>
          Loading…
        </div>
      ) : tab === "leads" ? (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: isMobile ? "visible" : "hidden" }}>
          {(!isMobile || !selectedLeadId) && (
            <div
              style={{
                width: isMobile ? "100%" : 360,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "rgba(0,0,0,0.12)",
              }}
            >
              <div style={{ padding: "12px 14px", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {QUICK_VIEWS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setView(v.id)}
                      style={{
                        background: view === v.id ? C.teal : "transparent",
                        color: view === v.id ? C.white : C.dim,
                        border: "none",
                        borderRadius: 7,
                        padding: "5px 11px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search address, reference, applicant…"
                  style={inp()}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <select value={valueBand} onChange={(e) => setValueBand(e.target.value)} style={{ ...inp(), flex: 1 }}>
                    {VALUE_BANDS.map((b) => (
                      <option key={b.id} value={b.id} style={{ color: "#1F2937" }}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...inp(), flex: 1.4 }}>
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id} style={{ color: "#1F2937" }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setShowSkipped((v) => !v)} style={btn("quiet", { color: showSkipped ? C.tealBright : C.dim })}>
                    Skipped
                  </button>
                </div>
                <p style={{ fontSize: 10, color: C.faint, margin: 0 }}>
                  {filteredLeads.length} matching · page {page + 1} of {pageCount}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
                {pageLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} selected={selectedLeadId === lead.id} onSelect={(l) => setSelectedLeadId(l.id)} />
                ))}
                {filteredLeads.length === 0 && (
                  <p style={{ color: C.faint, fontSize: 12, textAlign: "center", marginTop: 20 }}>No leads match these filters.</p>
                )}
                {pageCount > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
                    <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={btn("quiet", { opacity: page === 0 ? 0.4 : 1 })}>
                      ← Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                      disabled={page >= pageCount - 1}
                      style={btn("quiet", { opacity: page >= pageCount - 1 ? 0.4 : 1 })}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(!isMobile || selectedLeadId) && (
            <div style={{ flex: 1, overflow: isMobile ? "visible" : "hidden", background: C.surface }}>
              {isMobile && selectedLeadId && (
                <button onClick={() => setSelectedLeadId(null)} style={{ ...btn("quiet"), margin: "12px 0 0 16px" }}>
                  ← Back to leads
                </button>
              )}
              {selectedLead ? (
                <LeadDetail
                  lead={selectedLead}
                  agent={selectedLead.agent_id ? agentsById[selectedLead.agent_id] : undefined}
                  events={events}
                  onSaved={load}
                  onSkip={skipLead}
                  onLog={logEvent}
                />
              ) : (
                !isMobile && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.faint, fontSize: 13 }}>
                    Select a lead to review
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ) : tab === "batch" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 14 : 24, color: C.cream }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Letter batch</h2>
              <p style={{ fontSize: 12, color: C.dim, margin: "4px 0 0" }}>
                {batchLeads.length} lead{batchLeads.length === 1 ? "" : "s"} queued · export to the Batch Letter Printer,
                then mark the batch sent to update every record.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={exportBatchCsv} disabled={!batchLeads.length} style={btn("quiet", { opacity: batchLeads.length ? 1 : 0.4 })}>
                Export batch CSV
              </button>
              <button onClick={() => window.print()} disabled={!batchLeads.length} style={btn("quiet", { opacity: batchLeads.length ? 1 : 0.4 })}>
                Print list
              </button>
              <button onClick={markBatchSent} disabled={!batchLeads.length} style={btn("primary", { opacity: batchLeads.length ? 1 : 0.4 })}>
                Mark batch sent
              </button>
            </div>
          </div>
          {batchLeads.length === 0 ? (
            <Panel>
              <p style={{ fontSize: 12.5, color: C.dim, margin: 0 }}>
                No letters queued. Open a lead and choose “Add to letter batch”.
              </p>
            </Panel>
          ) : (
            <Panel style={{ padding: 0, overflow: "hidden" }}>
              {batchLeads.map((l, i) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 16px",
                    borderTop: i ? `1px solid ${C.line}` : "none",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                      {l.applicant_name || "The Homeowner"} · {l.applicant_address || l.site_address}
                    </p>
                    <p style={{ fontSize: 11, color: C.dim, margin: "3px 0 0" }}>
                      {l.council_name} · {l.application_ref} · {l.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Chip label={`TEMPLATE ${l.homeowner_letter_template || "A"}`} color={C.amberBright} />
                    <button onClick={() => { setTab("leads"); setSelectedLeadId(l.id); }} style={btn("quiet")}>
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </Panel>
          )}
        </div>
      ) : tab === "agents" ? (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: isMobile ? "visible" : "hidden" }}>
          {(!isMobile || !selectedAgent) && (
            <div style={{ width: isMobile ? "100%" : 320, flexShrink: 0, padding: 12, overflowY: "auto", background: "rgba(0,0,0,0.12)" }}>
              <SectionLabel>Agent network ({agents.length})</SectionLabel>
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  selected={selectedAgent?.id === agent.id}
                  onSelect={setSelectedAgent}
                  leadCount={leadsByAgent[agent.id] ?? 0}
                />
              ))}
            </div>
          )}
          {(!isMobile || selectedAgent) && (
            <div style={{ flex: 1, padding: isMobile ? 14 : 24, overflowY: "auto", color: C.cream, background: C.surface }}>
              {isMobile && selectedAgent && (
                <button onClick={() => setSelectedAgent(null)} style={{ ...btn("quiet"), marginBottom: 12 }}>
                  ← Back to agents
                </button>
              )}
              {selectedAgent ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedAgent.contact_name}</h2>
                    <p style={{ fontSize: 13, color: C.tealBright, margin: "4px 0 8px" }}>{selectedAgent.company_name}</p>
                    <Chip
                      label={(AGENT_STATUS[selectedAgent.relationship_status] || AGENT_STATUS.identified).label}
                      color={(AGENT_STATUS[selectedAgent.relationship_status] || AGENT_STATUS.identified).color}
                    />
                  </div>
                  <Panel>
                    <SectionLabel>Contact</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
                      {[
                        ["Email", selectedAgent.email],
                        ["Phone", selectedAgent.phone],
                        ["Address", selectedAgent.address],
                        ["Active councils", (selectedAgent.councils_active || []).join(", ")],
                        ["Avg job value", fmt(selectedAgent.avg_job_value_estimate)],
                        ["Associated planning projects", String(leadsByAgent[selectedAgent.id] ?? 0)],
                      ].map(([k, v]) =>
                        v ? (
                          <div key={k as string}>
                            <p style={{ fontSize: 9.5, color: C.faint, margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k}</p>
                            <p style={{ fontSize: 12, margin: "2px 0 0", wordBreak: "break-word" }}>{v}</p>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </Panel>
                  <Panel>
                    <SectionLabel>Notes & relationship log</SectionLabel>
                    <p style={{ fontSize: 12, color: selectedAgent.notes ? C.cream : C.faint, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
                      {selectedAgent.notes || "No notes yet."}
                    </p>
                  </Panel>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["contacted", "interested", "partner", "not_interested"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={async () => {
                          const { error } = await supabase.from("planning_agents").update({ relationship_status: s }).eq("id", selectedAgent.id);
                          if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
                          else {
                            toast({ title: "Agent updated" });
                            setSelectedAgent({ ...selectedAgent, relationship_status: s });
                            void load();
                          }
                        }}
                        style={btn("quiet", { color: AGENT_STATUS[s].color })}
                      >
                        Mark as {AGENT_STATUS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                !isMobile && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.faint, fontSize: 13 }}>
                    Select an agent to view their profile
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 14 : 24, color: C.cream }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Planning insights</h2>
          <p style={{ fontSize: 12, color: C.dim, margin: "0 0 16px" }}>
            Simple statistics from the live dataset. Deeper analysis will be added once more outreach history exists.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <Panel>
              <SectionLabel>Applications by council</SectionLabel>
              {Object.entries(
                leads.reduce<Record<string, number>>((m, l) => {
                  m[l.council_name] = (m[l.council_name] || 0) + 1;
                  return m;
                }, {}),
              )
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                    <span style={{ color: C.dim }}>{k}</span>
                    <span style={{ fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
            </Panel>
            <Panel>
              <SectionLabel>Value</SectionLabel>
              <p style={{ fontSize: 12, color: C.dim, margin: 0 }}>Total estimated</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: C.tealBright, margin: "2px 0 10px" }}>{fmtCompact(totalValue)}</p>
              <p style={{ fontSize: 12, color: C.dim, margin: 0 }}>Average per application</p>
              <p style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 0" }}>
                {leads.length ? fmtCompact(Math.round(totalValue / leads.length)) : "—"}
              </p>
            </Panel>
            <Panel>
              <SectionLabel>Most active agents</SectionLabel>
              {Object.entries(leadsByAgent)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([id, count]) => (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                    <span style={{ color: C.dim }}>{agentsById[id]?.company_name || agentsById[id]?.contact_name || "Unknown"}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
              {Object.keys(leadsByAgent).length === 0 && (
                <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>No agents linked to leads yet.</p>
              )}
            </Panel>
            <Panel>
              <SectionLabel>Conversion</SectionLabel>
              {(
                [
                  ["Contacted", funnel.contacted],
                  ["Responded", funnel.responded],
                  ["Registered", funnel.registered],
                  ["Projects", funnel.projects],
                ] as [string, number][]
              ).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                  <span style={{ color: C.dim }}>{k}</span>
                  <span style={{ fontWeight: 700 }}>
                    {v} {funnel.identified ? `· ${((v / funnel.identified) * 100).toFixed(1)}%` : ""}
                  </span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
