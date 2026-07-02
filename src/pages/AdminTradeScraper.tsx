import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

type Stage = "new" | "contacted" | "no_answer" | "follow_up" | "interested" | "not_interested" | "converted";
type Pipeline = "trade" | "website";
type WebQuality = "none" | "poor" | "outdated" | "weak_mobile" | "no_form" | "ok";

type Scraped = {
  id: string;
  trade_name: string;
  trade_type: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  has_website: boolean;
  address: string | null;
  postcode: string | null;
  city: string | null;
  rating: number | null;
  reviews_count: number | null;
  source: string;
  search_query: string | null;
  contacted: boolean;
  outreach_stage: Stage;
  interested: boolean | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
  notes: string | null;
  last_scraped_at: string;
  pipeline: Pipeline;
  website_quality: WebQuality | null;
  mini_audit_sent: boolean;
  mini_audit_sent_at: string | null;
  proposal_sent: boolean;
  proposal_sent_at: string | null;
};

const C = {
  cream: "#F5F0E8", deep: "#0F2238", navy: "#27396A",
  teal: "#14A8A1", red: "#DC2626", green: "#16A34A", amber: "#D97706",
  border: "rgba(245,240,232,0.1)", dim: "rgba(245,240,232,0.55)", bright: "#F5F0E8",
};

const STAGES: { value: Stage | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: C.dim },
  { value: "new", label: "New", color: C.dim },
  { value: "contacted", label: "Contacted", color: C.teal },
  { value: "no_answer", label: "No answer", color: "#0EA5E9" },
  { value: "follow_up", label: "Follow-up", color: C.amber },
  { value: "interested", label: "Interested", color: C.green },
  { value: "not_interested", label: "Not interested", color: C.red },
  { value: "converted", label: "Converted", color: "#7c3aed" },
];

const WEB_QUALITY: { value: WebQuality; label: string; color: string }[] = [
  { value: "none", label: "No website", color: C.red },
  { value: "poor", label: "Poor / weak", color: C.amber },
  { value: "outdated", label: "Outdated", color: C.amber },
  { value: "weak_mobile", label: "Weak mobile", color: "#0EA5E9" },
  { value: "no_form", label: "No enquiry form", color: "#7c3aed" },
  { value: "ok", label: "Looks OK", color: C.green },
];

const webQualityMeta = (q: WebQuality | null) =>
  WEB_QUALITY.find((x) => x.value === q) ?? null;

// Website-outreach opportunity score (0-100): higher = better prospect to sell a website to.
// An established local business (lots of reviews, decent rating) with a missing/weak website
// is the strongest target — they clearly have demand but a poor online presence.
const webScore = (r: Scraped): number => {
  let score = 0;
  const q = r.website_quality;
  if (!r.has_website || q === "none") score += 45;
  else if (q === "poor" || q === "outdated") score += 30;
  else if (q === "weak_mobile" || q === "no_form") score += 18;
  else if (q === "ok") score += 4;
  else score += 20; // not assessed yet — treat as a live unknown

  const reviews = r.reviews_count ?? 0;
  if (reviews >= 100) score += 30;
  else if (reviews >= 40) score += 22;
  else if (reviews >= 15) score += 14;
  else if (reviews >= 5) score += 8;

  const rating = r.rating ?? 0;
  if (rating >= 4.5) score += 15;
  else if (rating >= 4.0) score += 10;
  else if (rating >= 3.0) score += 4;

  if (r.phone) score += 5;
  return Math.max(0, Math.min(100, score));
};

const scoreColor = (s: number): string =>
  s >= 70 ? C.green : s >= 45 ? C.amber : C.dim;

const stageMeta = (s: Stage) => STAGES.find((x) => x.value === s) ?? STAGES[1];


const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.05)",
  color: C.bright, fontSize: 13, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box",
};

const btn = (primary = true): React.CSSProperties => ({
  background: primary ? C.teal : "transparent",
  color: primary ? "#fff" : C.teal,
  border: primary ? "none" : `1px solid ${C.teal}`,
  borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700,
  cursor: "pointer",
});

export default function AdminTradeScraper() {
  const [rows, setRows] = useState<Scraped[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Pipeline>("trade");
  const [tradeType, setTradeType] = useState("electricians");
  const [location, setLocation] = useState("Nottingham, Nottinghamshire");
  const [limit, setLimit] = useState(10);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(true);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStage, setFilterStage] = useState<Stage | "all">("all");
  const [hideContacted, setHideContacted] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftFollowUp, setDraftFollowUp] = useState("");


  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scraped_trades")
      .select("*")
      .order("last_scraped_at", { ascending: false })
      .limit(1000);
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data as unknown as Scraped[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScrape = async () => {
    if (!tradeType.trim()) {
      toast({ title: pipeline === "website" ? "Pick a business type" : "Pick a trade type", variant: "destructive" });
      return;
    }
    setRunning(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("scrape-trades", {
      body: {
        trade_type: tradeType,
        location,
        limit,
        pipeline,
        no_website_only: pipeline === "website" ? noWebsiteOnly : false,
      },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    setRunning(false);
    if (error) {
      toast({ title: "Scrape failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Scrape complete",
      description: `${(data as { upserted?: number }).upserted ?? 0} ${pipeline === "website" ? "businesses" : "trades"} added/updated`,
    });
    load();
  };

  const updateRow = async (id: string, patch: Partial<Scraped>) => {

    const { error } = await supabase.from("scraped_trades").update(patch as never).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } as Scraped : r)));
  };

  const setStage = (row: Scraped, stage: Stage) => {
    const patch: Record<string, unknown> = { outreach_stage: stage };
    if (stage !== "new") {
      patch.contacted = true;
      patch.last_contacted_at = new Date().toISOString();
      if (!row.last_contacted_at) patch.contacted_at = new Date().toISOString();
    }
    if (stage === "interested") patch.interested = true;
    if (stage === "not_interested") patch.interested = false;
    updateRow(row.id, patch as Partial<Scraped>);
  };

  const setWebQuality = (row: Scraped, q: WebQuality) => {
    updateRow(row.id, { website_quality: q });
  };

  const toggleAudit = (row: Scraped) => {
    const next = !row.mini_audit_sent;
    updateRow(row.id, {
      mini_audit_sent: next,
      mini_audit_sent_at: next ? new Date().toISOString() : null,
    });
  };

  const toggleProposal = (row: Scraped) => {
    const next = !row.proposal_sent;
    updateRow(row.id, {
      proposal_sent: next,
      proposal_sent_at: next ? new Date().toISOString() : null,
    });
  };

  const beginEdit = (r: Scraped) => {
    setEditing(r.id);
    setDraftNotes(r.notes ?? "");
    setDraftFollowUp(r.follow_up_at ? r.follow_up_at.slice(0, 10) : "");
  };
  const saveEdit = async (r: Scraped) => {
    await updateRow(r.id, {
      notes: draftNotes,
      follow_up_at: draftFollowUp ? new Date(draftFollowUp).toISOString() : null,
    });
    setEditing(null);
  };

  const deleteRow = async (row: Scraped) => {
    if (!confirm(`Delete ${row.trade_name}?`)) return;
    const { error } = await supabase.from("scraped_trades").delete().eq("id", row.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  const pipelineRows = useMemo(
    () => rows.filter((r) => (r.pipeline ?? "trade") === pipeline),
    [rows, pipeline],
  );

  const tradeTypes = Array.from(new Set(pipelineRows.map((r) => r.trade_type).filter(Boolean))) as string[];

  const filtered = useMemo(() => pipelineRows.filter((r) => {
    if (filterType !== "all" && r.trade_type !== filterType) return false;
    if (filterStage !== "all" && r.outreach_stage !== filterStage) return false;
    if (hideContacted && r.contacted) return false;
    if (filter) {
      const s = filter.toLowerCase();
      return (
        r.trade_name.toLowerCase().includes(s) ||
        (r.address ?? "").toLowerCase().includes(s) ||
        (r.phone ?? "").toLowerCase().includes(s) ||
        (r.notes ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  }), [pipelineRows, filter, filterType, filterStage, hideContacted]);

  // In the website pipeline, surface the strongest opportunities first.
  const sorted = useMemo(() => {
    if (pipeline !== "website") return filtered;
    return [...filtered].sort((a, b) => webScore(b) - webScore(a));
  }, [filtered, pipeline]);


  const counts = useMemo(() => {
    const c: Record<string, number> = { all: pipelineRows.length };
    for (const s of STAGES) if (s.value !== "all") c[s.value] = 0;
    for (const r of pipelineRows) c[r.outreach_stage] = (c[r.outreach_stage] ?? 0) + 1;
    return c;
  }, [pipelineRows]);

  const pipelineCounts = useMemo(() => {
    let trade = 0, website = 0;
    for (const r of rows) ((r.pipeline ?? "trade") === "website" ? (website++) : (trade++));
    return { trade, website };
  }, [rows]);


  const exportCsv = () => {
    if (!filtered.length) return;
    const isWeb = pipeline === "website";
    const header = isWeb
      ? ["Business name","Type","Phone","Email","Website","Website quality","Audit sent","Proposal sent","Address","Postcode","City","Rating","Reviews","Stage","Interested","Follow-up","Last contacted","Notes"]
      : ["Trade name","Type","Phone","Email","Website","Address","Postcode","City","Rating","Reviews","Stage","Interested","Follow-up","Last contacted","Notes"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      const cells = (isWeb
        ? [
            r.trade_name, r.trade_type ?? "", r.phone ?? "", r.email ?? "",
            r.website ?? "", webQualityMeta(r.website_quality)?.label ?? "",
            r.mini_audit_sent ? "yes" : "no", r.proposal_sent ? "yes" : "no",
            r.address ?? "", r.postcode ?? "", r.city ?? "",
            r.rating?.toString() ?? "", r.reviews_count?.toString() ?? "",
            r.outreach_stage,
            r.interested == null ? "" : r.interested ? "yes" : "no",
            r.follow_up_at ?? "", r.last_contacted_at ?? "", r.notes ?? "",
          ]
        : [
            r.trade_name, r.trade_type ?? "", r.phone ?? "", r.email ?? "",
            r.website ?? "", r.address ?? "", r.postcode ?? "", r.city ?? "",
            r.rating?.toString() ?? "", r.reviews_count?.toString() ?? "",
            r.outreach_stage,
            r.interested == null ? "" : r.interested ? "yes" : "no",
            r.follow_up_at ?? "", r.last_contacted_at ?? "", r.notes ?? "",
          ]
      ).map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isWeb ? "website-outreach" : "trades"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div style={{ minHeight: "100vh", background: C.deep, fontFamily: "system-ui, sans-serif", color: C.bright, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="font-heading tracking-wider" style={{ fontSize: 22, fontWeight: 700 }}>
            <Logo variant="light" className="h-9 w-auto inline-block" />
            <span style={{ color: C.dim, fontSize: 12, marginLeft: 12 }}>
              {pipeline === "website" ? "WEBSITE OUTREACH PIPELINE" : "TRADE OUTREACH PIPELINE"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.dim, margin: "4px 0 0" }}>
            {pipeline === "website"
              ? "Find local businesses with weak or missing websites, log calls, send mini-audits and proposals. Admin only."
              : "Scrape local trades, track outreach, log follow-ups. Admin only."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/admin/planning-pipeline" style={{ ...btn(false), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            ← Planning pipeline
          </Link>
          <button onClick={exportCsv} disabled={!filtered.length} style={{ ...btn(false), opacity: filtered.length ? 1 : 0.4 }}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Pipeline tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {([
          { value: "trade" as Pipeline, label: "🔧 Trade Outreach", count: pipelineCounts.trade },
          { value: "website" as Pipeline, label: "🌐 Website Outreach", count: pipelineCounts.website },
        ]).map((t) => {
          const active = pipeline === t.value;
          return (
            <button
              key={t.value}
              onClick={() => { setPipeline(t.value); setFilterStage("all"); setFilterType("all"); setEditing(null); }}
              style={{
                background: active ? C.teal : "rgba(255,255,255,0.04)",
                color: active ? "#fff" : C.bright,
                border: `1px solid ${active ? C.teal : C.border}`,
                borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              {t.label}
              <span style={{
                background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                borderRadius: 999, padding: "1px 8px", fontSize: 11,
              }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
          {pipeline === "website" ? "Find businesses (website prospects)" : "New scrape"}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>
              {pipeline === "website" ? "Business type" : "Trade type"}
            </label>
            <input value={tradeType} onChange={(e) => setTradeType(e.target.value)} placeholder={pipeline === "website" ? "e.g. plumbers, cafes, garages" : "electricians"} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nottingham, Nottinghamshire" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>Limit (max 20)</label>
            <input type="number" min={1} max={20} value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10) || 10)} style={inp} />
          </div>
          <button onClick={runScrape} disabled={running} style={{ ...btn(true), opacity: running ? 0.6 : 1 }}>
            {running ? "Scraping…" : "🔎 Run scrape"}
          </button>
        </div>
        {pipeline === "website" && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.dim, cursor: "pointer", marginTop: 12 }}>
            <input type="checkbox" checked={noWebsiteOnly} onChange={(e) => setNoWebsiteOnly(e.target.checked)} />
            Only keep businesses with no website (best cold-outreach targets)
          </label>
        )}
        <p style={{ fontSize: 10, color: C.dim, margin: "10px 0 0" }}>
          Re-running the same search won't create duplicates — existing leads are refreshed and your stage/notes are preserved.
        </p>
      </div>


      {/* Stage chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {STAGES.map((s) => {
          const active = filterStage === s.value;
          return (
            <button key={s.value} onClick={() => setFilterStage(s.value)} style={{
              background: active ? s.color : "transparent",
              color: active ? "#fff" : s.color,
              border: `1px solid ${s.color}`,
              borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}>
              {s.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts[s.value] ?? 0}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search name, address, phone, notes…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...inp, maxWidth: 320 }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inp, maxWidth: 200 }}>
          <option value="all" style={{ color: "#000" }}>All trade types</option>
          {tradeTypes.map((t) => <option key={t} value={t} style={{ color: "#000" }}>{t}</option>)}
        </select>
        <button
          onClick={() => setFilterStage((prev) => (prev === "no_answer" ? "all" : "no_answer"))}
          style={{
            background: filterStage === "no_answer" ? "#0EA5E9" : "transparent",
            color: filterStage === "no_answer" ? "#fff" : "#0EA5E9",
            border: "1px solid #0EA5E9",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>📞</span>
          No answer only {counts["no_answer"] ? `(${counts["no_answer"]})` : ""}
        </button>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.dim, cursor: "pointer" }}>
          <input type="checkbox" checked={hideContacted} onChange={(e) => setHideContacted(e.target.checked)} />
          Hide already-contacted
        </label>
        <span style={{ color: C.dim, fontSize: 12, marginLeft: "auto" }}>
          {filtered.length} of {pipelineRows.length}
        </span>

      </div>

      {loading ? (
        <div style={{ color: C.dim, padding: 40, textAlign: "center" }}>Loading…</div>
      ) : (
        <div style={{ overflowX: "auto", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ background: "rgba(255,255,255,0.04)" }}>
              <tr style={{ textAlign: "left", color: C.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "10px 12px" }}>{pipeline === "website" ? "Business" : "Trade"}</th>
                <th style={{ padding: "10px 12px" }}>Contact</th>
                {pipeline === "website" && <th style={{ padding: "10px 12px" }}>Score</th>}
                {pipeline === "website" && <th style={{ padding: "10px 12px" }}>Website / Outreach</th>}
                <th style={{ padding: "10px 12px" }}>Location</th>
                <th style={{ padding: "10px 12px" }}>Rating</th>
                <th style={{ padding: "10px 12px" }}>Stage</th>
                <th style={{ padding: "10px 12px" }}>Follow-up</th>
                <th style={{ padding: "10px 12px" }}>Notes</th>
                <th style={{ padding: "10px 12px" }}></th>
              </tr>

            </thead>
            <tbody>
              {sorted.map((r) => {
                const m = stageMeta(r.outreach_stage);
                const isEditing = editing === r.id;
                return (
                  <tr key={r.id} style={{ borderTop: `1px solid ${C.border}`, verticalAlign: "top" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{r.trade_name}</div>
                      <div style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>{r.trade_type ?? "—"}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {r.phone && <div><a href={`tel:${r.phone}`} style={{ color: C.teal }}>{r.phone}</a></div>}
                      {r.email && <div><a href={`mailto:${r.email}`} style={{ color: C.teal }}>{r.email}</a></div>}
                      {r.website && <div><a href={r.website} target="_blank" rel="noreferrer" style={{ color: C.green }}>website ↗</a></div>}
                      {!r.phone && !r.email && !r.website && <span style={{ color: C.dim }}>—</span>}
                    </td>
                    {pipeline === "website" && (() => {
                      const sc = webScore(r);
                      return (
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{
                            display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2,
                            background: "rgba(255,255,255,0.04)", border: `1px solid ${scoreColor(sc)}`,
                            borderRadius: 10, padding: "6px 10px", minWidth: 52,
                          }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor(sc), lineHeight: 1 }}>{sc}</span>
                            <span style={{ fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {sc >= 70 ? "Hot" : sc >= 45 ? "Warm" : "Low"}
                            </span>
                          </div>
                        </td>
                      );
                    })()}
                    {pipeline === "website" && (
                      <td style={{ padding: "10px 12px", minWidth: 180 }}>
                        {(() => {
                          const wm = webQualityMeta(r.website_quality);
                          return (
                            <select
                              value={r.website_quality ?? ""}
                              onChange={(e) => setWebQuality(r, e.target.value as WebQuality)}
                              style={{
                                ...inp, padding: "5px 8px", fontSize: 11, fontWeight: 700, width: "auto",
                                borderColor: wm?.color ?? C.border, color: wm?.color ?? C.dim,
                              }}
                            >
                              <option value="" style={{ color: "#000" }}>Not assessed</option>
                              {WEB_QUALITY.map((q) => (
                                <option key={q.value} value={q.value} style={{ color: "#000" }}>{q.label}</option>
                              ))}
                            </select>
                          );
                        })()}
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => toggleAudit(r)}
                            title="Toggle whether a mini website audit has been sent"
                            style={{
                              background: r.mini_audit_sent ? C.green : "transparent",
                              color: r.mini_audit_sent ? "#fff" : C.green,
                              border: `1px solid ${C.green}`, borderRadius: 999,
                              padding: "3px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                            }}
                          >
                            {r.mini_audit_sent ? "✓ Audit sent" : "Audit sent?"}
                          </button>
                          <button
                            onClick={() => toggleProposal(r)}
                            title="Toggle whether a proposal has been sent"
                            style={{
                              background: r.proposal_sent ? "#7c3aed" : "transparent",
                              color: r.proposal_sent ? "#fff" : "#a78bfa",
                              border: "1px solid #7c3aed", borderRadius: 999,
                              padding: "3px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                            }}
                          >
                            {r.proposal_sent ? "✓ Proposal sent" : "Proposal sent?"}
                          </button>
                        </div>
                      </td>
                    )}
                    <td style={{ padding: "10px 12px", color: C.dim, maxWidth: 200 }}>

                      {[r.city, r.postcode].filter(Boolean).join(" · ") || r.address || "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {r.rating != null ? `${r.rating} (${r.reviews_count ?? 0})` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", minWidth: 160 }}>
                      <select
                        value={r.outreach_stage}
                        onChange={(e) => setStage(r, e.target.value as Stage)}
                        style={{
                          ...inp, padding: "5px 8px", fontSize: 11, fontWeight: 700,
                          borderColor: m.color, color: m.color, width: "auto",
                        }}
                      >
                        {STAGES.filter((s) => s.value !== "all").map((s) => (
                          <option key={s.value} value={s.value} style={{ color: "#000" }}>{s.label}</option>
                        ))}
                      </select>
                      {r.last_contacted_at && (
                        <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>
                          last: {new Date(r.last_contacted_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing ? (
                        <input type="date" value={draftFollowUp} onChange={(e) => setDraftFollowUp(e.target.value)} style={{ ...inp, padding: "5px 8px", fontSize: 11 }} />
                      ) : r.follow_up_at ? (
                        <span style={{ color: new Date(r.follow_up_at) < new Date() ? C.red : C.amber, fontWeight: 600 }}>
                          {new Date(r.follow_up_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ color: C.dim }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", maxWidth: 260 }}>
                      {isEditing ? (
                        <textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} rows={3} style={{ ...inp, fontSize: 11 }} />
                      ) : (
                        <div
                          onClick={() => beginEdit(r)}
                          title="Click to add or edit a note"
                          style={{ color: r.notes ? C.bright : C.dim, fontSize: 11, whiteSpace: "pre-wrap", cursor: "pointer", minHeight: 18 }}
                        >
                          {r.notes || "✎ Add note…"}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(r)} style={{ ...btn(true), padding: "5px 10px", fontSize: 10, marginRight: 4 }}>Save</button>
                          <button onClick={() => setEditing(null)} style={{ background: "transparent", color: C.dim, border: "none", cursor: "pointer", fontSize: 11 }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => beginEdit(r)} style={{ ...btn(false), padding: "5px 10px", fontSize: 10, marginRight: 4 }}>Edit</button>
                          <button onClick={() => deleteRow(r)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 11 }}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr><td colSpan={pipeline === "website" ? 9 : 8} style={{ padding: 40, textAlign: "center", color: C.dim }}>
                  {pipeline === "website"
                    ? "No website prospects match. Try a different filter or run a search above."
                    : "No trades match. Try a different filter or run a scrape above."}
                </td></tr>

              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
