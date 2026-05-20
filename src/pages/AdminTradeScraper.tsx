import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  last_scraped_at: string;
};

const C = {
  cream: "#F5F0E8", deep: "#0F2238", navy: "#1B3A5C",
  teal: "#0D9488", red: "#DC2626", green: "#16A34A",
  border: "rgba(245,240,232,0.1)", dim: "rgba(245,240,232,0.55)", bright: "#F5F0E8",
};

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
  const [tradeType, setTradeType] = useState("electricians");
  const [location, setLocation] = useState("Nottingham, Nottinghamshire");
  const [limit, setLimit] = useState(10);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterType, setFilterType] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scraped_trades")
      .select("*")
      .order("last_scraped_at", { ascending: false })
      .limit(500);
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data as Scraped[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScrape = async () => {
    if (!tradeType.trim()) {
      toast({ title: "Pick a trade type", description: "e.g. electricians, plumbers, builders", variant: "destructive" });
      return;
    }
    setRunning(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("scrape-trades", {
      body: { trade_type: tradeType, location, limit },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    setRunning(false);
    if (error) {
      toast({ title: "Scrape failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Scrape complete",
      description: `${(data as { upserted?: number }).upserted ?? 0} trades added/updated`,
    });
    load();
  };

  const toggleContacted = async (row: Scraped) => {
    const next = !row.contacted;
    const { error } = await supabase
      .from("scraped_trades")
      .update({ contacted: next, contacted_at: next ? new Date().toISOString() : null })
      .eq("id", row.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else load();
  };

  const deleteRow = async (row: Scraped) => {
    if (!confirm(`Delete ${row.trade_name}?`)) return;
    const { error } = await supabase.from("scraped_trades").delete().eq("id", row.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  const exportCsv = () => {
    if (!rows.length) return;
    const header = ["Trade name", "Type", "Phone", "Email", "Website", "Address", "Postcode", "City", "Rating", "Reviews", "Contacted"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      const cells = [
        r.trade_name, r.trade_type ?? "", r.phone ?? "", r.email ?? "",
        r.website ?? "", r.address ?? "", r.postcode ?? "", r.city ?? "",
        r.rating?.toString() ?? "", r.reviews_count?.toString() ?? "",
        r.contacted ? "yes" : "no",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tradeTypes = Array.from(new Set(rows.map((r) => r.trade_type).filter(Boolean))) as string[];
  const filtered = rows.filter((r) => {
    if (filterType !== "all" && r.trade_type !== filterType) return false;
    if (filter) {
      const s = filter.toLowerCase();
      return (
        r.trade_name.toLowerCase().includes(s) ||
        (r.address ?? "").toLowerCase().includes(s) ||
        (r.phone ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: C.deep, fontFamily: "system-ui, sans-serif", color: C.bright, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="font-heading tracking-wider" style={{ fontSize: 22, fontWeight: 700 }}>
            <span style={{ color: C.bright }}>PRO</span>
            <span style={{ color: C.teal }}>GRAFTER</span>
            <span style={{ color: C.dim, fontSize: 12, marginLeft: 12 }}>TRADE SCRAPER</span>
          </div>
          <p style={{ fontSize: 12, color: C.dim, margin: "4px 0 0" }}>
            Pull contractor contact info from Google Places. Admin only.
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

      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
          New scrape
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>Trade type</label>
            <input value={tradeType} onChange={(e) => setTradeType(e.target.value)} placeholder="electricians" style={inp} />
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
        <p style={{ fontSize: 10, color: C.dim, margin: "10px 0 0" }}>
          Google Places returns name, phone, website, address, rating. Email is <b>not</b> available from Places — fill it manually after a website visit.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input placeholder="Search name, address, phone…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...inp, maxWidth: 320 }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inp, maxWidth: 200 }}>
          <option value="all" style={{ color: "#000" }}>All trade types</option>
          {tradeTypes.map((t) => <option key={t} value={t} style={{ color: "#000" }}>{t}</option>)}
        </select>
        <span style={{ color: C.dim, fontSize: 12, alignSelf: "center" }}>
          {filtered.length} of {rows.length}
        </span>
      </div>

      {loading ? (
        <div style={{ color: C.dim, padding: 40, textAlign: "center" }}>Loading…</div>
      ) : (
        <div style={{ overflowX: "auto", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ background: "rgba(255,255,255,0.04)" }}>
              <tr style={{ textAlign: "left", color: C.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "10px 12px" }}>Trade</th>
                <th style={{ padding: "10px 12px" }}>Type</th>
                <th style={{ padding: "10px 12px" }}>Phone</th>
                <th style={{ padding: "10px 12px" }}>Email</th>
                <th style={{ padding: "10px 12px" }}>Website</th>
                <th style={{ padding: "10px 12px" }}>Location</th>
                <th style={{ padding: "10px 12px" }}>Rating</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.trade_name}</td>
                  <td style={{ padding: "10px 12px", color: C.dim }}>{r.trade_type ?? "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    {r.phone ? <a href={`tel:${r.phone}`} style={{ color: C.teal }}>{r.phone}</a> : <span style={{ color: C.dim }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {r.email ? <a href={`mailto:${r.email}`} style={{ color: C.teal }}>{r.email}</a> : <span style={{ color: C.dim }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {r.website ? (
                      <a href={r.website} target="_blank" rel="noreferrer" style={{ color: C.green }}>✓ Yes</a>
                    ) : (
                      <span style={{ color: C.red }}>✗ No</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: C.dim, maxWidth: 220 }}>
                    {[r.city, r.postcode].filter(Boolean).join(" · ") || r.address || "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {r.rating != null ? `${r.rating} (${r.reviews_count ?? 0})` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => toggleContacted(r)} style={{
                      background: r.contacted ? C.green : "transparent",
                      color: r.contacted ? "#fff" : C.dim,
                      border: `1px solid ${r.contacted ? C.green : C.border}`,
                      borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                    }}>
                      {r.contacted ? "✓ Contacted" : "Mark contacted"}
                    </button>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => deleteRow(r)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 11 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: C.dim }}>
                  No trades scraped yet. Run a scrape above to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
