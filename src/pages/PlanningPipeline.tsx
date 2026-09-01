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
  isHistoric,
  isSkipped,
  lastContactAt,
  letterAlreadySent,
  matchesView,
  nextActionFor,
  outreachChip,
  responseLabel,
  type Agent,
  type Lead,
  type LeadEvent,
  type QuickView,
} from "./planningPipelineModel";
import {
  TEMPLATE_META,
  composeLetterBody,
  fullLetterText,
  letterDateLabel,
  letterGreeting,
  SENDER,
  type LetterRecipient,
  type LetterTemplateId,
} from "@/lib/planningLetterTemplates";

/* ------------------------------------------------------------------ */
/* Small shared primitives                                             */
/* ------------------------------------------------------------------ */

const inp = (): CSSProperties => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: "rgba(255,255,255,0.05)",
  color: C.cream,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
});

const Chip = ({ label, color, title }: { label: string; color: string; title?: string }) => (
  <span
    title={title}
    style={{
      display: "inline-block",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.02em",
      color,
      background: `${color}22`,
      borderRadius: 6,
      padding: "4px 10px",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

const SectionHeading = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "0 0 12px" }}>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.cream, margin: 0, letterSpacing: "0.01em", fontFamily: "inherit", textTransform: "none" }}>{children}</h3>
    {right}
  </div>
);

const Panel = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 14,
      padding: "18px 20px",
      border: `1px solid ${C.line}`,
      ...style,
    }}
  >
    {children}
  </div>
);

const btn = (variant: "primary" | "ghost" | "quiet", extra?: CSSProperties): CSSProperties => ({
  border: variant === "primary" ? "none" : `1px solid ${variant === "ghost" ? "rgba(13,148,136,0.5)" : C.line}`,
  background: variant === "primary" ? C.teal : "transparent",
  color: variant === "primary" ? C.white : variant === "ghost" ? C.tealBright : C.dim,
  borderRadius: 9,
  padding: variant === "primary" ? "11px 18px" : "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.2,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
  ...extra,
});

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <p style={{ fontSize: 12.5, color: C.faint, margin: 0, fontWeight: 600 }}>{label}</p>
    <p style={{ fontSize: 14, color: C.cream, margin: "3px 0 0", fontWeight: 600, lineHeight: 1.45, wordBreak: "break-word" }}>
      {value}
    </p>
  </div>
);

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
        background: selected ? "rgba(13,148,136,0.16)" : "rgba(255,255,255,0.035)",
        boxShadow: selected ? `inset 0 0 0 1px ${C.teal}` : "none",
        borderRadius: 10,
        padding: "9px 10px 9px 8px",
        cursor: "pointer",
        marginBottom: 6,
        opacity: isSkipped(lead) ? 0.55 : 1,
        transition: "background 0.12s",
      }}
    >
      <span style={{ width: 3, borderRadius: 3, background: chip.color, flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <p
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: C.cream,
              margin: 0,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lead.site_address}
          </p>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.tealBright, flexShrink: 0 }}>
            {fmt(lead.estimated_value_max)}
          </span>
        </div>
        {lead.description && (
          <p
            style={{
              fontSize: 12.5,
              color: C.dim,
              margin: "3px 0 0",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lead.description}
          </p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 6,
          }}
        >
          <Chip label={chip.label} color={chip.color} />
          <span
            style={{
              fontSize: 11.5,
              color: C.faint,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {lead.council_name} · {chip.date ? fmtDate(chip.date) : `${days}d`}
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
  onOpenBatch,
}: {
  lead: Lead;
  agent?: Agent;
  events: LeadEvent[];
  onSaved: () => void;
  onSkip: (l: Lead, skip: boolean) => void;
  onLog: (leadId: string, type: string, detail?: string, template?: string) => Promise<void>;
  onOpenBatch: () => void;
}) => {
  const [notes, setNotes] = useState(lead.notes || "");
  const [nextAction, setNextAction] = useState(lead.next_action || "");
  const [template, setTemplate] = useState<LetterTemplateId>(
    (lead.homeowner_letter_template as LetterTemplateId) || "A",
  );
  const [editUrl, setEditUrl] = useState(false);
  
  const [councilUrl, setCouncilUrl] = useState(lead.council_application_url || "");
  const [busy, setBusy] = useState(false);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    setNotes(lead.notes || "");
    setNextAction(lead.next_action || "");
    setTemplate((lead.homeowner_letter_template as LetterTemplateId) || "A");
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
  const chip = outreachChip(lead);
  const inBatch = lead.letter_batch_status === "queued";

  const markReviewed = async () => {
    if (await patch({ reviewed_at: new Date().toISOString() }, "Lead reviewed")) {
      await onLog(lead.id, "reviewed", "Lead reviewed");
    }
  };

  const addToBatch = async () => {
    if (inBatch) {
      if (await patch({ letter_batch_status: null, letter_batch_added_at: null }, "Removed from letter batch")) {
        await onLog(lead.id, "batch_removed", "Removed from letter batch");
      }
      return;
    }
    // Duplicate protection — a letter has already physically gone out.
    if (letterAlreadySent(lead)) {
      const when = lastContactAt(lead) ? fmtDate(lastContactAt(lead)) : "previously";
      const ok = window.confirm(
        `A letter was already sent to this lead (${when}). Add it to the batch again as a follow-up?`,
      );
      if (!ok) return;
    }
    const done = await patch(
      {
        letter_batch_status: "queued",
        letter_batch_added_at: new Date().toISOString(),
        homeowner_letter_template: template,
        outreach_campaign: campaignFor(template),
        reviewed_at: lead.reviewed_at || new Date().toISOString(),
      },
      `Added to letter batch — Template ${template}`,
    );
    if (done) await onLog(lead.id, "batch_added", "Added to letter batch", template);
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
    const next = state || null;
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

  const naTone =
    na.tone === "amber" ? C.amberBright : na.tone === "grey" ? C.dim : na.key === "action_response" ? C.purple : C.tealBright;

  const locationLine = [lead.applicant_address?.includes(lead.site_address) ? null : null, lead.postcode]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "26px 32px 56px", color: C.cream }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 16 }}>
        {/* 1. PROJECT HEADER */}
        <div>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em", color: C.cream, fontFamily: "inherit", textTransform: "none" }}>
            {lead.site_address}
          </h2>
          {(lead.postcode || locationLine) && (
            <p style={{ fontSize: 15, color: C.dim, margin: "6px 0 0" }}>{lead.postcode}</p>
          )}
          {lead.description && (
            <p style={{ fontSize: 16, color: C.cream, margin: "10px 0 0", lineHeight: 1.55, maxWidth: 780 }}>
              {lead.description}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
              marginTop: 12,
              fontSize: 14,
              color: C.dim,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, color: C.tealBright }}>
              {fmt(lead.estimated_value_max)} estimated
            </span>
            <span>·</span>
            <span>{ds} days old</span>
            <span>·</span>
            <span>{lead.council_name}</span>
            <span>·</span>
            <span>{lead.application_ref}</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: C.faint, fontWeight: 600 }}>Status</span>
            <Chip label={chip.label} color={chip.color} />
            {chip.date && <span style={{ fontSize: 13, color: C.faint }}>{fmtDate(chip.date)}</span>}
            {isHistoric(lead) && <Chip label="HISTORIC — UNPROCESSED" color={C.faint} />}
          </div>

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
              <a
                href={lead.pdf_source_url}
                target="_blank"
                rel="noreferrer"
                style={{ ...btn("ghost"), textDecoration: "none", display: "inline-block" }}
              >
                Open PDF
              </a>
            )}
            <button onClick={addToBatch} disabled={busy} style={btn(inBatch ? "quiet" : "primary")}>
              {inBatch ? "Remove from letter batch" : "Add to letter batch"}
            </button>
            {inBatch && (
              <button onClick={onOpenBatch} style={btn("quiet")}>
                Open letter batch
              </button>
            )}
            <button
              onClick={() => lead.council_application_url && copy(lead.council_application_url, "Link")}
              disabled={!lead.council_application_url}
              style={btn("quiet", { opacity: lead.council_application_url ? 1 : 0.5 })}
            >
              Copy link
            </button>
            <button onClick={() => setEditUrl((v) => !v)} style={btn("quiet")}>
              {editUrl ? "Close URL editor" : "Edit URL"}
            </button>
            <button onClick={enrichFromPdf} disabled={enriching || !lead.council_application_url} style={btn("quiet")}>
              {enriching ? "Reading PDF…" : lead.pdf_enriched_at ? "Re-read PDF form" : "Read PDF form"}
            </button>
            <button onClick={() => onSkip(lead, !isSkipped(lead))} style={btn("quiet")}>
              {isSkipped(lead) ? "Restore lead" : "Skip lead"}
            </button>
          </div>


          {editUrl && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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

        {/* 2. NEXT ACTION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: `${naTone}14`,
            boxShadow: `inset 0 0 0 1px ${naTone}44`,
            borderRadius: 14,
            padding: "16px 20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", color: C.dim, margin: 0 }}>
              NEXT ACTION
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: naTone, margin: "5px 0 0" }}>
              {nextAction.trim() || na.label}
            </p>
            {na.hint && !nextAction.trim() && (
              <p style={{ fontSize: 13.5, color: C.faint, margin: "4px 0 0" }}>{na.hint}</p>
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
          {na.key === "batch" && (
            <button onClick={onOpenBatch} style={btn("primary")}>
              Open letter batch
            </button>
          )}
          {na.key === "follow_up" && (
            <button onClick={() => recordContact("homeowner", "letter")} style={btn("primary")}>
              Log follow-up letter
            </button>
          )}
        </div>

        {/* 3. OUTREACH — two cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16 }}>
          <Panel>
            <SectionHeading right={<Chip label={chip.label} color={chip.color} />}>Homeowner</SectionHeading>
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Last contact" value={lastContactAt(lead) ? fmtDate(lastContactAt(lead)) : "Not contacted"} />
              <Field
                label="Method"
                value={
                  lead.homeowner_last_contact_method
                    ? CONTACT_METHODS.find((m) => m.id === lead.homeowner_last_contact_method)?.label ||
                      lead.homeowner_last_contact_method
                    : lead.letter_sent_at
                      ? "Letter"
                      : "—"
                }
              />
              {lead.homeowner_letter_template && (
                <Field label="Template" value={`Template ${lead.homeowner_letter_template}`} />
              )}
              {(lead.applicant_name || lead.applicant_address) && (
                <Field
                  label="Recipient"
                  value={[lead.applicant_name, lead.applicant_address].filter(Boolean).join(" · ")}
                />
              )}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: C.faint, fontWeight: 600 }}>Letter template</span>
              {LETTER_TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t as LetterTemplateId)}
                  title={TEMPLATE_META[t as LetterTemplateId].purpose}
                  style={btn(template === t ? "primary" : "quiet", { padding: "8px 16px" })}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {CONTACT_METHODS.map((m) => (
                <button key={m.id} onClick={() => recordContact("homeowner", m.id)} disabled={busy} style={btn("ghost")}>
                  Log {m.label.toLowerCase()}
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeading>Architect / agent</SectionHeading>
            {agent || lead.agent_name ? (
              <>
                <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                  {agent?.company_name || agent?.contact_name || lead.agent_name}
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                  <Chip
                    label={(lead.agent_outreach_status || "not contacted").toUpperCase()}
                    color={lead.agent_outreach_status === "contacted" ? C.amberBright : C.faint}
                  />
                  {agent?.email && (
                    <button onClick={() => copy(agent.email!, "Email")} style={btn("quiet", { padding: "6px 12px" })}>
                      {agent.email}
                    </button>
                  )}
                </div>
                {lead.agent_last_contact_at && (
                  <p style={{ fontSize: 14, color: C.dim, margin: "12px 0 0" }}>
                    Last contact {fmtDate(lead.agent_last_contact_at)} · {lead.agent_last_contact_method}
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  {CONTACT_METHODS.map((m) => (
                    <button key={m.id} onClick={() => recordContact("agent", m.id)} disabled={busy} style={btn("ghost")}>
                      Log {m.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <p style={{ fontSize: 15, color: C.dim, margin: 0 }}>Not identified</p>
                <button
                  onClick={enrichFromPdf}
                  disabled={enriching || !lead.council_application_url}
                  style={btn("quiet", { marginTop: 14, opacity: lead.council_application_url ? 1 : 0.5 })}
                >
                  {enriching ? "Reading form…" : "Identify from planning form"}
                </button>
              </div>
            )}
          </Panel>
        </div>

        {/* 4. RESPONSE / OUTCOME */}
        <Panel>
          <SectionHeading
            right={
              lead.response_at ? (
                <span style={{ fontSize: 13, color: C.faint }}>Recorded {fmtDate(lead.response_at)}</span>
              ) : undefined
            }
          >
            Response / outcome
          </SectionHeading>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            {(() => {
              const cur = RESPONSE_STATES.find((r) => r.id === lead.response_state);
              const color =
                cur?.tone === "teal"
                  ? C.tealBright
                  : cur?.tone === "purple"
                    ? C.purple
                    : cur?.tone === "red"
                      ? C.red
                      : C.dim;
              return (
                <span style={{ fontSize: 18, fontWeight: 700, color }}>{cur?.label || "No response yet"}</span>
              );
            })()}
            <select
              value={lead.response_state || ""}
              onChange={(e) => setResponse(e.target.value)}
              style={{ ...inp(), width: "auto", minWidth: 260, cursor: "pointer" }}
            >
              <option value="" style={{ color: "#1F2937" }}>
                No response yet
              </option>
              {RESPONSE_STATES.filter((r) => r.id !== "no_response").map((r) => (
                <option key={r.id} value={r.id} style={{ color: "#1F2937" }}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {lead.response_state === "draftline_enquiry" && (
            <p style={{ fontSize: 13.5, color: C.purple, margin: "12px 0 0" }}>
              Source attribution retained: ProGrafter Planning Outreach
              {lead.outreach_campaign ? ` · ${lead.outreach_campaign}` : ""}.
            </p>
          )}
        </Panel>

        {/* 5. PLANNING DETAILS */}
        <Panel>
          <SectionHeading>Planning details</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "16px 24px" }}>
            <Field label="Application type" value={lead.application_type || "—"} />
            <Field label="Submitted" value={`${fmtDate(lead.submitted_date)} (${ds} days)`} />
            <Field label="Applicant" value={lead.applicant_name || "Not listed"} />
            <Field label="Planning status" value={lead.status.replace(/_/g, " ")} />
          </div>
        </Panel>

        {/* 6. ACTIVITY */}
        <Panel>
          <SectionHeading>Activity</SectionHeading>
          {events.length === 0 ? (
            <p style={{ fontSize: 14, color: C.faint, margin: 0 }}>No recorded activity yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {events.map((e) => (
                <div key={e.id} style={{ display: "flex", gap: 14, fontSize: 14, lineHeight: 1.5 }}>
                  <span style={{ color: C.faint, minWidth: 110 }}>{fmtDate(e.created_at)}</span>
                  <span style={{ color: C.cream }}>
                    {e.detail || e.event_type}
                    {e.template ? ` — Template ${e.template}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* 7. NOTES */}
        <Panel>
          <SectionHeading>Notes</SectionHeading>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes on this lead — conversations, outcomes…"
            style={{ ...inp(), resize: "vertical", marginBottom: 10, lineHeight: 1.6 }}
          />
          <input
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="Override next action (optional)"
            style={{ ...inp(), marginBottom: 10 }}
          />
          <button
            onClick={() => patch({ notes, next_action: nextAction }, "Lead updated")}
            disabled={busy}
            style={btn("primary", { width: "100%" })}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </Panel>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Agent card                                                          */
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
        background: selected ? "rgba(13,148,136,0.16)" : "rgba(255,255,255,0.035)",
        boxShadow: selected ? `inset 0 0 0 1px ${C.teal}` : "none",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.cream, margin: 0 }}>{agent.contact_name}</p>
          <p style={{ fontSize: 13, color: C.tealBright, margin: "4px 0 0" }}>{agent.company_name || "Independent"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Chip label={status.label} color={status.color} />
          <span style={{ fontSize: 12.5, color: leadCount > 1 ? C.amberBright : C.faint }}>
            {leadCount} app{leadCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Batch letter printer                                                */
/* ------------------------------------------------------------------ */

const toRecipient = (l: Lead): LetterRecipient => ({
  name: l.applicant_name,
  address: l.applicant_address || l.site_address,
  postcode: l.postcode,
  siteAddress: l.site_address,
  council: l.council_name,
  reference: l.application_ref,
  description: l.description,
});

const PrintSheet = ({ leads }: { leads: Lead[] }) => (
  <div className="pp-print">
    {leads.map((l) => {
      const r = toRecipient(l);
      const t = ((l.homeowner_letter_template as LetterTemplateId) || "A") as LetterTemplateId;
      return (
        <div className="pp-letter" key={l.id}>
          <div className="pp-letterhead">
            <strong>{SENDER.line1}</strong>
            <br />
            {SENDER.email} · {SENDER.web}
          </div>
          <p className="pp-date">{letterDateLabel()}</p>
          <p className="pp-addr">
            {r.name || "The Homeowner"}
            <br />
            {r.address}
            {r.postcode ? (
              <>
                <br />
                {r.postcode}
              </>
            ) : null}
          </p>
          <p className="pp-greet">{letterGreeting(r)}</p>
          {composeLetterBody(r, t).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <p className="pp-sign">
            Kind regards,
            <br />
            <strong>{SENDER.name}</strong>
            <br />
            {SENDER.web}
          </p>
          <p className="pp-foot">
            Ref: {r.reference} · {r.council} · {TEMPLATE_META[t].label}
          </p>
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20;
const LS_BAND = "pp_value_band";
const LS_SORT = "pp_sort";

const VALUE_BANDS = [
  { id: "all", label: "All values", min: 0 },
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

const PRINT_CSS = `
.pp-print { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .pp-print, .pp-print * { visibility: visible !important; }
  .pp-print {
    display: block !important;
    position: absolute; left: 0; top: 0; width: 100%;
    background: #fff; color: #111;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .pp-letter {
    page-break-after: always;
    padding: 22mm 20mm;
    font-size: 11.5pt;
    line-height: 1.6;
  }
  .pp-letter:last-child { page-break-after: auto; }
  .pp-letterhead { font-size: 10.5pt; margin-bottom: 16mm; }
  .pp-date, .pp-addr, .pp-greet, .pp-sign { margin: 0 0 6mm; }
  .pp-letter p { margin: 0 0 5mm; }
  .pp-foot { font-size: 9pt; color: #555; margin-top: 12mm; }
  @page { size: A4; margin: 0; }
}
`;

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
  const [batchBusy, setBatchBusy] = useState(false);
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
    const { error } = await supabase.from("planning_lead_events").insert({
      lead_id: leadId,
      event_type: type,
      detail: detail ?? null,
      template: template ?? null,
      created_by: auth.user?.id ?? null,
    } as never);
    if (error) console.error("[planning] event log failed", error.message);
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

  const setBatchTemplate = async (l: Lead, t: LetterTemplateId) => {
    const { error } = await supabase
      .from("planning_leads")
      .update({ homeowner_letter_template: t, outreach_campaign: campaignFor(t) } as never)
      .eq("id", l.id);
    if (error) toast({ title: "Template change failed", description: error.message, variant: "destructive" });
    else void load();
  };

  const removeFromBatch = async (l: Lead) => {
    const { error } = await supabase
      .from("planning_leads")
      .update({ letter_batch_status: null, letter_batch_added_at: null } as never)
      .eq("id", l.id);
    if (error) toast({ title: "Remove failed", description: error.message, variant: "destructive" });
    else {
      await logEvent(l.id, "batch_removed", "Removed from letter batch");
      toast({ title: "Removed from batch" });
      void load();
    }
  };

  const markBatchSent = async () => {
    if (!batchLeads.length) return;
    if (!window.confirm(`Mark ${batchLeads.length} letter(s) as sent? This records the outreach against every lead.`))
      return;
    setBatchBusy(true);
    const now = new Date().toISOString();
    const ids = batchLeads.map((l) => l.id);
    const { error } = await supabase
      .from("planning_leads")
      .update({
        letter_batch_status: "sent",
        letter_batch_sent_at: now,
        letter_sent_at: now,
        homeowner_contacted: true,
        homeowner_contacted_at: now,
        homeowner_last_contact_at: now,
        homeowner_last_contact_method: "letter",
        outreach_status: "letter_sent",
        pipeline_status: "letter_sent",
      } as never)
      .in("id", ids);
    if (error) {
      setBatchBusy(false);
      toast({ title: "Batch update failed", description: error.message, variant: "destructive" });
      return;
    }
    await Promise.all(
      batchLeads.map((l) => logEvent(l.id, "letter_sent", "Letter sent", l.homeowner_letter_template || "A")),
    );
    setBatchBusy(false);
    toast({ title: "Batch marked sent", description: `${ids.length} letter(s) recorded as sent.` });
    void load();
  };

  const exportBatchCsv = () => {
    const rows = [
      ["applicant_name", "address", "postcode", "planning_ref", "council", "description", "template", "campaign", "letter_text"],
      ...batchLeads.map((l) => {
        const t = ((l.homeowner_letter_template as LetterTemplateId) || "A") as LetterTemplateId;
        return [
          l.applicant_name || "The Homeowner",
          l.applicant_address || l.site_address,
          l.postcode || "",
          l.application_ref,
          l.council_name,
          (l.description || "").replace(/[\r\n]+/g, " "),
          t,
          l.outreach_campaign || campaignFor(t) || "",
          fullLetterText(toRecipient(l), t).replace(/[\r\n]+/g, " \\n "),
        ];
      }),
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
    <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
      <span style={{ fontSize: 19, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: C.faint, letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
      {delta && <span style={{ fontSize: 11.5, color: C.tealBright }}>{delta}</span>}
    </div>
  );

  const navTab = (id: typeof tab, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        padding: "9px 14px",
        border: "none",
        background: "transparent",
        borderBottom: `2px solid ${tab === id ? C.teal : "transparent"}`,
        color: tab === id ? C.cream : C.dim,
        fontSize: 13.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  const todayChip = (label: string, onClick: () => void, color: string) => (
    <button
      onClick={onClick}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}55`,
        color,
        borderRadius: 8,
        padding: "5px 11px",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
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
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: C.deep,
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <style>{PRINT_CSS}</style>
      <PrintSheet leads={batchLeads} />

      {/* Masthead */}
      <div
        style={{
          padding: isMobile ? "14px 16px" : "18px 28px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo variant="light" className="h-8 w-auto inline-block" />
          <span style={{ fontSize: 14, color: C.dim, fontWeight: 700, letterSpacing: "0.12em" }}>PLANNING PIPELINE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 20 : 36, flexWrap: "wrap" }}>
          {kpi("TOTAL LEADS", String(leads.length), newThisWeek ? `+${newThisWeek} this week` : null)}
          {kpi(
            "ESTIMATED VALUE",
            fmtCompact(totalValue),
            valueThisWeek ? `+${fmtCompact(valueThisWeek)} this week` : null,
            C.tealBright,
          )}
          <span style={{ fontSize: 13, color: C.faint }}>{hotLeads} hot</span>
          <div style={{ display: "flex", gap: 10 }}>
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
          background: C.surface,
          padding: isMobile ? "12px 16px" : "14px 28px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: isMobile ? 14 : 22,
            alignItems: "center",
            flexWrap: "wrap",
            maxWidth: 1100,
          }}
        >
          {(
            [
              ["Identified", funnel.identified],
              ["Qualified", funnel.qualified],
              ["Contacted", funnel.contacted],
              ["Responded", funnel.responded],
              ["Registered", funnel.registered],
              ["Projects", funnel.projects],
            ] as [string, number][]
          ).map(([label, n], i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 22 }}>
              {i > 0 && <span style={{ color: C.faint, fontSize: 15 }}>→</span>}
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: n ? C.cream : C.faint, margin: 0, lineHeight: 1.1 }}>
                  {n}
                </p>
                <p style={{ fontSize: 13, color: C.dim, margin: "2px 0 0", fontWeight: 600 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today strip */}
      <div
        style={{
          padding: isMobile ? "14px 16px" : "16px 28px",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 15, color: C.cream, fontWeight: 800, letterSpacing: "0.06em", marginRight: 6 }}>
          TODAY
        </span>
        {today.total === 0 ? (
          <span style={{ fontSize: 15, fontWeight: 700, color: C.tealBright }}>Today's pipeline is clear ✓</span>
        ) : (
          <>
            {today.toReview > 0 &&
              todayChip(`${today.toReview} to review`, () => {
                setTab("leads");
                setView("review");
              }, C.tealBright)}
            {today.lettersReady > 0 && todayChip(`${today.lettersReady} letters ready`, () => setTab("batch"), C.amberBright)}
            {today.responsesToAction > 0 &&
              todayChip(`${today.responsesToAction} response${today.responsesToAction === 1 ? "" : "s"}`, () => {
                setTab("leads");
                setView("responses");
              }, C.tealBright)}
            {today.followUpsDue > 0 &&
              todayChip(`${today.followUpsDue} follow-ups due`, () => {
                setTab("leads");
                setView("contacted");
              }, C.amberBright)}
          </>
        )}
        {today.historic > 0 && (
          <button
            onClick={() => {
              setTab("leads");
              setView("historic");
            }}
            style={btn("quiet", { fontSize: 13 })}
            title="Older imported applications with no outreach history — not part of today's workload"
          >
            {today.historic} historic / unprocessed
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: isMobile ? "0 10px" : "0 28px",
          borderBottom: `1px solid ${C.line}`,
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {navTab("leads", `Leads (${leads.length})`)}
        {navTab("batch", `Letter batch (${batchLeads.length})`)}
        {navTab("agents", `Architects & agents (${agents.length})`)}
        {navTab("insights", "Insights")}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, fontSize: 15, padding: 40 }}>
          Loading…
        </div>
      ) : tab === "leads" ? (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: isMobile ? "visible" : "hidden" }}>
          {(!isMobile || !selectedLeadId) && (
            <div
              style={{
                width: isMobile ? "100%" : 370,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "rgba(0,0,0,0.14)",
              }}
            >
              <div style={{ padding: "16px 16px 12px", display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {QUICK_VIEWS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setView(v.id)}
                      style={{
                        background: view === v.id ? C.teal : "rgba(255,255,255,0.05)",
                        color: view === v.id ? C.white : C.dim,
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 13px",
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
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
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={valueBand} onChange={(e) => setValueBand(e.target.value)} style={{ ...inp(), flex: 1 }}>
                    {VALUE_BANDS.map((b) => (
                      <option key={b.id} value={b.id} style={{ color: "#1F2937" }}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...inp(), flex: 1.3 }}>
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id} style={{ color: "#1F2937" }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <p style={{ fontSize: 13, color: C.dim, margin: 0 }}>
                    {filteredLeads.length} matching · page {page + 1} of {pageCount}
                  </p>
                  <button
                    onClick={() => setShowSkipped((v) => !v)}
                    style={btn("quiet", { padding: "6px 12px", fontSize: 13, color: showSkipped ? C.tealBright : C.dim })}
                  >
                    {showSkipped ? "Hide skipped" : "Show skipped"}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
                {pageLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} selected={selectedLeadId === lead.id} onSelect={(l) => setSelectedLeadId(l.id)} />
                ))}
                {filteredLeads.length === 0 && (
                  <p style={{ color: C.faint, fontSize: 14, textAlign: "center", marginTop: 24 }}>
                    No leads match these filters.
                  </p>
                )}
                {pageCount > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
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
                <button onClick={() => setSelectedLeadId(null)} style={{ ...btn("quiet"), margin: "14px 0 0 16px" }}>
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
                  onOpenBatch={() => setTab("batch")}
                />
              ) : (
                !isMobile && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.faint, fontSize: 16 }}>
                    Select a lead to review
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ) : tab === "batch" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 28, color: C.cream }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: C.cream, fontFamily: "inherit", textTransform: "none" }}>Batch Letter Printer</h2>
                <p style={{ fontSize: 14.5, color: C.dim, margin: "6px 0 0", maxWidth: 620, lineHeight: 1.55 }}>
                  {batchLeads.length} lead{batchLeads.length === 1 ? "" : "s"} queued. Check the recipient details, choose a
                  template per letter, print the batch, then mark it sent to record the outreach on every lead.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                <button onClick={exportBatchCsv} disabled={!batchLeads.length} style={btn("quiet", { opacity: batchLeads.length ? 1 : 0.4 })}>
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={!batchLeads.length}
                  style={btn("ghost", { opacity: batchLeads.length ? 1 : 0.4 })}
                >
                  Print {batchLeads.length || ""} letter{batchLeads.length === 1 ? "" : "s"}
                </button>
                <button
                  onClick={markBatchSent}
                  disabled={!batchLeads.length || batchBusy}
                  style={btn("primary", { opacity: batchLeads.length && !batchBusy ? 1 : 0.4 })}
                >
                  {batchBusy ? "Recording…" : "Mark batch sent"}
                </button>
              </div>
            </div>

            {batchLeads.length === 0 ? (
              <Panel>
                <p style={{ fontSize: 15, color: C.dim, margin: 0 }}>
                  No letters queued. Open a lead and choose “Add to letter batch”.
                </p>
              </Panel>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {batchLeads.map((l) => {
                  const t = ((l.homeowner_letter_template as LetterTemplateId) || "A") as LetterTemplateId;
                  const noRecipient = !l.applicant_name && !l.applicant_address;
                  return (
                    <Panel key={l.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ minWidth: 260, flex: 1 }}>
                          <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{l.applicant_name || "The Homeowner"}</p>
                          <p style={{ fontSize: 14.5, color: C.cream, margin: "5px 0 0", lineHeight: 1.5 }}>
                            {l.applicant_address || l.site_address}
                            {l.postcode ? `, ${l.postcode}` : ""}
                          </p>
                          <p style={{ fontSize: 13.5, color: C.dim, margin: "6px 0 0", lineHeight: 1.5 }}>
                            {l.council_name} · {l.application_ref} · {l.description}
                          </p>
                          {noRecipient && (
                            <p style={{ fontSize: 13.5, color: C.amberBright, margin: "8px 0 0" }}>
                              No applicant address on file — letter will be addressed to the site address.
                            </p>
                          )}
                          {letterAlreadySent(l) && (
                            <p style={{ fontSize: 13.5, color: C.amberBright, margin: "6px 0 0" }}>
                              A letter was already sent to this lead — this will print as a follow-up.
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: C.faint, fontWeight: 600 }}>Template</span>
                            {(["A", "B", "C"] as LetterTemplateId[]).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setBatchTemplate(l, opt)}
                                title={TEMPLATE_META[opt].purpose}
                                style={btn(t === opt ? "primary" : "quiet", { padding: "7px 14px" })}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => {
                                setTab("leads");
                                setSelectedLeadId(l.id);
                              }}
                              style={btn("quiet", { padding: "7px 14px" })}
                            >
                              Open lead
                            </button>
                            <button onClick={() => removeFromBatch(l)} style={btn("quiet", { padding: "7px 14px" })}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : tab === "agents" ? (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex: 1, overflow: isMobile ? "visible" : "hidden" }}>
          {(!isMobile || !selectedAgent) && (
            <div style={{ width: isMobile ? "100%" : 340, flexShrink: 0, padding: 16, overflowY: "auto", background: "rgba(0,0,0,0.14)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: C.cream, fontFamily: "inherit", textTransform: "none" }}>Agent network ({agents.length})</h3>
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  selected={selectedAgent?.id === agent.id}
                  onSelect={setSelectedAgent}
                  leadCount={leadsByAgent[agent.id] ?? 0}
                />
              ))}
              {agents.length === 0 && <p style={{ fontSize: 14, color: C.faint }}>No agents identified yet.</p>}
            </div>
          )}
          {(!isMobile || selectedAgent) && (
            <div style={{ flex: 1, padding: isMobile ? 16 : 28, overflowY: "auto", color: C.cream, background: C.surface }}>
              <div style={{ maxWidth: 900, margin: "0 auto" }}>
                {isMobile && selectedAgent && (
                  <button onClick={() => setSelectedAgent(null)} style={{ ...btn("quiet"), marginBottom: 14 }}>
                    ← Back
                  </button>
                )}
                {selectedAgent ? (
                  <>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: C.cream, fontFamily: "inherit", textTransform: "none" }}>
                      {selectedAgent.company_name || selectedAgent.contact_name}
                    </h2>
                    <p style={{ fontSize: 15, color: C.dim, margin: "6px 0 18px" }}>
                      {selectedAgent.contact_name}
                      {selectedAgent.email ? ` · ${selectedAgent.email}` : ""}
                      {selectedAgent.phone ? ` · ${selectedAgent.phone}` : ""}
                    </p>
                    <Panel>
                      <SectionHeading>Relationship</SectionHeading>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
                        <Field
                          label="Status"
                          value={(AGENT_STATUS[selectedAgent.relationship_status] || AGENT_STATUS.identified).label}
                        />
                        <Field label="Applications" value={String(leadsByAgent[selectedAgent.id] ?? 0)} />
                        <Field label="Intro sent" value={selectedAgent.intro_sent ? "Yes" : "No"} />
                        <Field label="Meeting held" value={selectedAgent.meeting_held ? "Yes" : "No"} />
                      </div>
                      {selectedAgent.notes && (
                        <p style={{ fontSize: 14.5, color: C.dim, margin: "16px 0 0", lineHeight: 1.6 }}>
                          {selectedAgent.notes}
                        </p>
                      )}
                    </Panel>
                  </>
                ) : (
                  !isMobile && (
                    <div style={{ color: C.faint, fontSize: 16, textAlign: "center", marginTop: 60 }}>
                      Select an agent to view the relationship.
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 28, color: C.cream }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 16 }}>
            <Panel>
              <SectionHeading>Market intelligence</SectionHeading>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
                {kpi("TOTAL LEADS", String(leads.length), newThisWeek ? `+${newThisWeek} this week` : null)}
                {kpi("ESTIMATED VALUE", fmtCompact(totalValue), valueThisWeek ? `+${fmtCompact(valueThisWeek)} this week` : null, C.tealBright)}
                {kpi("HOT LEADS", String(hotLeads), null, C.amberBright)}
                {kpi("HISTORIC / UNPROCESSED", String(today.historic), null, C.dim)}
              </div>
            </Panel>
            <Panel>
              <SectionHeading>Conversion funnel</SectionHeading>
              <div style={{ display: "grid", gap: 12 }}>
                {(
                  [
                    ["Identified", funnel.identified],
                    ["Qualified", funnel.qualified],
                    ["Contacted", funnel.contacted],
                    ["Responded", funnel.responded],
                    ["Registered", funnel.registered],
                    ["Projects", funnel.projects],
                  ] as [string, number][]
                ).map(([label, n]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 14, color: C.dim, width: 110, fontWeight: 600 }}>{label}</span>
                    <div style={{ flex: 1, height: 12, background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>
                      <div
                        style={{
                          width: `${funnel.identified ? Math.max(1, (n / funnel.identified) * 100) : 0}%`,
                          height: "100%",
                          background: C.teal,
                          borderRadius: 6,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, width: 60, textAlign: "right" }}>{n}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
