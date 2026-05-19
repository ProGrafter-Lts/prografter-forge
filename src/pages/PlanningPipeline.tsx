import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const C = {
  cream: "#F5F0E8", deep: "#0F2238", navy: "#1B3A5C",
  teal: "#0D9488", tealHover: "#14B8A8", tealLight: "#CCFBF1",
  body: "#1F2937", secondary: "#4B5563", border: "#D1CBB8", white: "#FFFFFF",
  amber: "#D97706", amberBg: "#FFFBEB", amberBorder: "#FDE68A",
  green: "#16A34A", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  red: "#DC2626", redBg: "#FEF2F2", redBorder: "#FECACA",
  purple: "#7C3AED", purpleBg: "#F5F3FF", purpleBorder: "#DDD6FE",
  darkSurface: "#152C45", darkCard: "#1B3A5C",
  darkBorder: "rgba(245,240,232,0.1)", dimText: "rgba(245,240,232,0.5)",
  brightText: "#F5F0E8",
};

type Agent = {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  relationship_status: string;
  intro_sent: boolean;
  meeting_held: boolean;
  councils_active: string[] | null;
  avg_job_value_estimate: number | null;
  notes: string | null;
};

type Lead = {
  id: string;
  application_ref: string;
  council_name: string;
  site_address: string;
  postcode: string | null;
  application_type: string | null;
  status: string;
  description: string | null;
  submitted_date: string | null;
  applicant_name: string | null;
  applicant_address: string | null;
  agent_id: string | null;
  trades_likely: string[] | null;
  estimated_value_min: number | null;
  estimated_value_max: number | null;
  priority_score: number;
  pipeline_status: string;
  documents_available: boolean;
  form1app_extracted: boolean;
  notes: string | null;
  next_action: string | null;
};

const PIPELINE_STAGES = [
  { id: "new", label: "New lead", color: C.purple },
  { id: "contacted_agent", label: "Agent contacted", color: C.teal },
  { id: "contacted_homeowner", label: "Homeowner contacted", color: C.amber },
  { id: "brief_posted", label: "Brief posted", color: C.navy },
  { id: "converted", label: "Converted", color: C.green },
  { id: "not_suitable", label: "Not suitable", color: C.secondary },
];

const AGENT_STATUS: Record<string, { label: string; bg: string; border: string; text: string }> = {
  identified: { label: "Identified", bg: C.purpleBg, border: C.purpleBorder, text: C.purple },
  contacted: { label: "Contacted", bg: C.amberBg, border: C.amberBorder, text: C.amber },
  interested: { label: "Interested", bg: C.tealLight, border: "#99F6E4", text: C.teal },
  partner: { label: "Partner", bg: C.greenBg, border: C.greenBorder, text: C.green },
  not_interested: { label: "Not interested", bg: "#F3F4F6", border: C.border, text: C.secondary },
};

const fmt = (n: number | null | undefined) => (n ? `£${Number(n).toLocaleString("en-GB")}` : "—");
const daysSince = (dateStr: string | null) => {
  if (!dateStr) return 0;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
};

const inp = (): CSSProperties => ({
  width: "100%", padding: "8px 10px", borderRadius: 7,
  border: `1px solid ${C.darkBorder}`, background: "rgba(255,255,255,0.05)",
  color: C.brightText, fontSize: 12, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box",
});

const SBadge = ({ status }: { status: string }) => {
  const stage = PIPELINE_STAGES.find((s) => s.id === status);
  if (!stage) return null;
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 700,
      color: stage.color, background: `${stage.color}22`,
      border: `1px solid ${stage.color}55`,
      borderRadius: 20, padding: "2px 8px", letterSpacing: "0.04em",
    }}>{stage.label}</span>
  );
};

const PriorityBar = ({ score }: { score: number }) => {
  const c = score >= 75 ? C.red : score >= 50 ? C.amber : C.teal;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: c }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: c, minWidth: 22, textAlign: "right" }}>{score}</span>
    </div>
  );
};

const LeadCard = ({ lead, onSelect, selected, agent }: {
  lead: Lead; onSelect: (l: Lead) => void; selected: boolean; agent?: Agent;
}) => (
  <div onClick={() => onSelect(lead)}
    style={{
      background: selected ? C.darkCard : "rgba(255,255,255,0.04)",
      border: `1px solid ${selected ? C.teal : C.darkBorder}`,
      borderRadius: 10, padding: "10px 14px", cursor: "pointer",
      marginBottom: 6, transition: "all 0.15s",
    }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.brightText, margin: "0 0 2px", lineHeight: 1.3 }}>
          {lead.site_address}
        </p>
        <p style={{ fontSize: 10, color: C.dimText, margin: 0 }}>
          {lead.council_name} · {lead.application_ref}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.teal, margin: 0 }}>
          {fmt(lead.estimated_value_max)}
        </p>
        <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>{daysSince(lead.submitted_date)}d ago</p>
      </div>
    </div>
    <div style={{ marginBottom: 6 }}>
      <PriorityBar score={lead.priority_score} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
      <SBadge status={lead.pipeline_status} />
      <span style={{ fontSize: 9, color: C.dimText, textAlign: "right" }}>
        {agent ? `🏛️ ${agent.company_name || agent.contact_name}` : "No agent"}
      </span>
    </div>
  </div>
);

const LeadDetail = ({ lead, agent, onSaved }: { lead: Lead; agent?: Agent; onSaved: () => void }) => {
  const [notes, setNotes] = useState(lead.notes || "");
  const [nextAction, setNextAction] = useState(lead.next_action || "");
  const [pipelineStatus, setPipelineStatus] = useState(lead.pipeline_status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(lead.notes || "");
    setNextAction(lead.next_action || "");
    setPipelineStatus(lead.pipeline_status);
  }, [lead.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("planning_leads")
      .update({ notes, next_action: nextAction, pipeline_status: pipelineStatus })
      .eq("id", lead.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead updated" });
      onSaved();
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard?.writeText(email);
    toast({ title: "Email copied" });
  };

  const ds = daysSince(lead.submitted_date);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px 20px", color: C.brightText }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.brightText, margin: "0 0 4px" }}>
              {lead.site_address}
            </h2>
            <p style={{ fontSize: 12, color: C.dimText, margin: "0 0 8px" }}>
              {lead.council_name} · {lead.application_ref} · {lead.application_type}
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <SBadge status={lead.pipeline_status} />
              <span style={{ fontSize: 11, color: C.dimText }}>
                {lead.status === "submitted" ? "🔥 Submitted" :
                  lead.status === "pending_decision" ? "⏳ Pending" : "✅ Approved"}
              </span>
              <span style={{ fontSize: 11, color: C.dimText }}>{ds} days ago</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.teal, margin: 0 }}>{fmt(lead.estimated_value_max)}</p>
            <p style={{ fontSize: 10, color: C.dimText, margin: 0 }}>est. value</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Description</p>
          <p style={{ fontSize: 12, color: C.brightText, lineHeight: 1.6, margin: 0 }}>{lead.description}</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Trades required</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(lead.trades_likely || []).map((t) => (
              <span key={t} style={{ fontSize: 11, fontWeight: 600, background: "rgba(13,148,136,0.15)", color: C.teal, border: `1px solid rgba(13,148,136,0.3)`, borderRadius: 6, padding: "3px 8px" }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>🏠 Applicant (homeowner)</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.brightText, margin: "0 0 2px" }}>{lead.applicant_name || "Name not listed"}</p>
          {lead.applicant_address && <p style={{ fontSize: 11, color: C.dimText, margin: 0 }}>{lead.applicant_address}</p>}
          {!agent && (
            <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(217,119,6,0.12)", border: `1px solid rgba(217,119,6,0.3)`, borderRadius: 7 }}>
              <p style={{ fontSize: 11, color: C.amber, margin: 0 }}>⚠️ No agent listed — contact homeowner directly via planning portal address</p>
            </div>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>🏛️ Agent / representative (contact first)</p>
          {agent ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.brightText, margin: "0 0 2px" }}>{agent.contact_name}</p>
              {agent.company_name && <p style={{ fontSize: 11, color: C.teal, margin: "0 0 2px" }}>{agent.company_name}</p>}
              {agent.address && <p style={{ fontSize: 11, color: C.dimText, margin: "0 0 8px" }}>{agent.address}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {agent.phone && (
                  <a href={`tel:${agent.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.teal, color: C.white, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>📞 {agent.phone}</a>
                )}
                {agent.email && (
                  <button onClick={() => copyEmail(agent.email!)} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(13,148,136,0.2)", color: C.teal, border: `1px solid rgba(13,148,136,0.3)`, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✉️ Copy email</button>
                )}
              </div>
            </>
          ) : (
            <p style={{ fontSize: 11, color: C.dimText, margin: 0 }}>No agent listed on this application — self-submission by homeowner.</p>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Pipeline status</p>
          <select value={pipelineStatus} onChange={(e) => setPipelineStatus(e.target.value)} style={{ ...inp(), marginBottom: 10 }}>
            {PIPELINE_STAGES.map((s) => <option key={s.id} value={s.id} style={{ color: C.body }}>{s.label}</option>)}
          </select>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Notes on this lead — conversations, outcomes…" style={{ ...inp(), resize: "vertical", marginBottom: 8 }} />
          <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next action — e.g. 'Call agent back after 20 May'" style={{ ...inp(), marginBottom: 8 }} />
          <button onClick={save} disabled={saving} style={{ width: "100%", background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AgentCard = ({ agent, onSelect, selected }: { agent: Agent; onSelect: (a: Agent) => void; selected: boolean }) => {
  const status = AGENT_STATUS[agent.relationship_status] || AGENT_STATUS.identified;
  return (
    <div onClick={() => onSelect(agent)}
      style={{
        background: selected ? C.darkCard : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? C.teal : C.darkBorder}`,
        borderRadius: 10, padding: "10px 14px", cursor: "pointer",
        marginBottom: 6, transition: "all 0.15s",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.brightText, margin: "0 0 1px" }}>{agent.contact_name}</p>
          <p style={{ fontSize: 10, color: C.teal, margin: 0 }}>{agent.company_name || "Independent"}</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, background: status.bg, color: status.text, border: `1px solid ${status.border}`, borderRadius: 20, padding: "2px 8px" }}>{status.label}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 10, color: C.dimText }}>{(agent.councils_active || []).join(", ")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {agent.intro_sent && <span style={{ fontSize: 10, color: C.teal }}>✉️</span>}
          {agent.meeting_held && <span style={{ fontSize: 10, color: C.green }}>🤝</span>}
        </div>
      </div>
    </div>
  );
};

export default function PlanningPipeline() {
  const [tab, setTab] = useState<"leads" | "agents" | "kanban">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPipeline, setFilterPipeline] = useState("all");
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();

  const load = async () => {
    setLoading(true);
    const [{ data: lData, error: lErr }, { data: aData, error: aErr }] = await Promise.all([
      supabase.from("planning_leads").select("*").order("priority_score", { ascending: false }),
      supabase.from("planning_agents").select("*").order("created_at", { ascending: false }),
    ]);
    if (lErr) toast({ title: "Failed to load leads", description: lErr.message, variant: "destructive" });
    if (aErr) toast({ title: "Failed to load agents", description: aErr.message, variant: "destructive" });
    setLeads((lData as Lead[]) || []);
    setAgents((aData as Agent[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const agentsById = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a])), [agents]);
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0] || null;

  const filteredLeads = useMemo(() => leads.filter((l) => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterPipeline !== "all" && l.pipeline_status !== filterPipeline) return false;
    if (search) {
      const s = search.toLowerCase();
      const agent = l.agent_id ? agentsById[l.agent_id] : null;
      if (!l.site_address.toLowerCase().includes(s)
        && !(l.description || "").toLowerCase().includes(s)
        && !(agent?.contact_name || "").toLowerCase().includes(s)
        && !(l.applicant_name || "").toLowerCase().includes(s)) return false;
    }
    return true;
  }), [leads, filterStatus, filterPipeline, search, agentsById]);

  const hotLeads = leads.filter((l) => l.pipeline_status === "new" && daysSince(l.submitted_date) <= 14).length;
  const totalValue = leads.reduce((s, l) => s + (Number(l.estimated_value_max) || 0), 0);

  const updateAgentStatus = async (agent: Agent, status: string) => {
    const { error } = await supabase.from("planning_agents").update({ relationship_status: status }).eq("id", agent.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agent updated" });
      setSelectedAgent({ ...agent, relationship_status: status });
      load();
    }
  };

  const navTab = (id: typeof tab, label: string) => (
    <button onClick={() => setTab(id)} style={{
      padding: "10px 18px", borderRadius: 10, border: "none",
      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
      background: tab === id ? C.teal : "transparent",
      color: tab === id ? C.white : C.dimText,
    }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui, sans-serif", background: C.deep }}>
      <div style={{ background: C.deep, borderBottom: `1px solid ${C.darkBorder}`, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="font-heading tracking-wider" style={{ fontSize: 22, fontWeight: 700 }}>
            <span style={{ color: C.brightText }}>PRO</span>
            <span style={{ color: C.teal }}>GRAFTER</span>
          </div>
          <span style={{ color: C.darkBorder }}>|</span>
          <span style={{ fontSize: 12, color: C.dimText, fontWeight: 500, letterSpacing: "0.05em" }}>PLANNING PIPELINE</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.red, margin: 0 }}>{hotLeads}</p>
            <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>HOT LEADS</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.brightText, margin: 0 }}>{leads.length}</p>
            <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>TOTAL</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.teal, margin: 0 }}>{agents.length}</p>
            <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>AGENTS</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.green, margin: 0 }}>{fmt(totalValue)}</p>
            <p style={{ fontSize: 9, color: C.dimText, margin: 0 }}>PIPELINE VALUE</p>
          </div>
          <button onClick={() => toast({ title: "Scraper not yet connected", description: "Ingestion pipeline is on the roadmap." })}
            style={{ background: C.teal, color: C.white, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            🔄 Run scraper
          </button>
        </div>
      </div>

      <div style={{ background: C.darkSurface, borderBottom: `1px solid ${C.darkBorder}`, padding: "0 20px", display: "flex", gap: 4 }}>
        {navTab("leads", `📋 Leads (${leads.length})`)}
        {navTab("agents", `🏛️ Agents (${agents.length})`)}
        {navTab("kanban", "📊 Pipeline board")}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.dimText }}>Loading…</div>
      ) : tab === "leads" ? (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${C.darkBorder}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: 12, borderBottom: `1px solid ${C.darkBorder}` }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search address, applicant, agent…" style={{ ...inp(), marginBottom: 8 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inp()}>
                  <option value="all" style={{ color: C.body }}>All statuses</option>
                  <option value="submitted" style={{ color: C.body }}>🔥 Submitted</option>
                  <option value="pending_decision" style={{ color: C.body }}>⏳ Pending</option>
                  <option value="approved" style={{ color: C.body }}>✅ Approved</option>
                </select>
                <select value={filterPipeline} onChange={(e) => setFilterPipeline(e.target.value)} style={inp()}>
                  <option value="all" style={{ color: C.body }}>All stages</option>
                  {PIPELINE_STAGES.map((s) => <option key={s.id} value={s.id} style={{ color: C.body }}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} agent={lead.agent_id ? agentsById[lead.agent_id] : undefined}
                  selected={selectedLead?.id === lead.id} onSelect={(l) => setSelectedLeadId(l.id)} />
              ))}
              {filteredLeads.length === 0 && (
                <p style={{ color: C.dimText, fontSize: 12, textAlign: "center", marginTop: 20 }}>No leads match your filters.</p>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflow: "hidden", background: C.darkSurface }}>
            {selectedLead ? (
              <LeadDetail lead={selectedLead} agent={selectedLead.agent_id ? agentsById[selectedLead.agent_id] : undefined} onSaved={load} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.dimText, fontSize: 13 }}>Select a lead to review</div>
            )}
          </div>
        </div>
      ) : tab === "agents" ? (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${C.darkBorder}`, padding: 12, overflowY: "auto" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Agent network ({agents.length})</p>
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} selected={selectedAgent?.id === agent.id} onSelect={setSelectedAgent} />
            ))}
          </div>
          <div style={{ flex: 1, padding: 20, overflowY: "auto", color: C.brightText }}>
            {selectedAgent ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.brightText, margin: "0 0 4px" }}>{selectedAgent.contact_name}</h2>
                    <p style={{ fontSize: 13, color: C.teal, margin: "0 0 8px" }}>{selectedAgent.company_name}</p>
                    {(() => {
                      const s = AGENT_STATUS[selectedAgent.relationship_status] || AGENT_STATUS.identified;
                      return <span style={{ fontSize: 11, fontWeight: 600, background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 10px" }}>{s.label}</span>;
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {selectedAgent.phone && <a href={`tel:${selectedAgent.phone}`} style={{ background: C.teal, color: C.white, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>📞 Call</a>}
                    {selectedAgent.email && <a href={`mailto:${selectedAgent.email}`} style={{ background: "none", border: `1px solid ${C.teal}`, color: C.teal, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>✉️ Email</a>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Email", value: selectedAgent.email },
                    { label: "Phone", value: selectedAgent.phone },
                    { label: "Address", value: selectedAgent.address },
                    { label: "Active councils", value: (selectedAgent.councils_active || []).join(", ") },
                    { label: "Avg job value", value: fmt(selectedAgent.avg_job_value_estimate) },
                  ].map((r) => r.value ? (
                    <div key={r.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                      <p style={{ fontSize: 10, color: C.dimText, margin: "0 0 2px" }}>{r.label}</p>
                      <p style={{ fontSize: 12, color: C.brightText, fontWeight: 500, margin: 0 }}>{r.value}</p>
                    </div>
                  ) : null)}
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Notes & relationship log</p>
                  <p style={{ fontSize: 12, color: selectedAgent.notes ? C.brightText : C.dimText, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{selectedAgent.notes || "No notes yet."}</p>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["contacted", "interested", "partner", "not_interested"] as const).map((s) => (
                    <button key={s} onClick={() => updateAgentStatus(selectedAgent, s)}
                      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${AGENT_STATUS[s].border}`, color: AGENT_STATUS[s].text, borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Mark as {AGENT_STATUS[s].label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.dimText, fontSize: 13 }}>Select an agent to view their profile</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowX: "auto", padding: 16, display: "flex", gap: 10 }}>
          {PIPELINE_STAGES.filter((s) => s.id !== "not_suitable").map((stage) => {
            const stageLeads = leads.filter((l) => l.pipeline_status === stage.id);
            return (
              <div key={stage.id} style={{ width: 220, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: stage.color, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage.label}</p>
                  <span style={{ fontSize: 11, color: C.dimText, background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "1px 8px" }}>{stageLeads.length}</span>
                </div>
                <div>
                  {stageLeads.map((lead) => (
                    <div key={lead.id} onClick={() => { setSelectedLeadId(lead.id); setTab("leads"); }}
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.darkBorder}`, borderRadius: 8, padding: "8px 10px", marginBottom: 6, cursor: "pointer" }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.brightText, margin: "0 0 2px", lineHeight: 1.3 }}>{lead.site_address.split(",")[0]}</p>
                      <p style={{ fontSize: 10, color: C.teal, margin: "0 0 4px" }}>{fmt(lead.estimated_value_max)}</p>
                      <PriorityBar score={lead.priority_score} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
