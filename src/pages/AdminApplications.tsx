import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  TradeApplication, STATUS_OPTIONS, STATUS_LABEL, STATUS_COLOR, QUAL_LABEL,
} from "@/lib/tradeApplications";

const C = {
  cream: "#F5F0E8", deep: "#0F2238", teal: "#14A8A1",
  dimText: "rgba(245,240,232,0.78)", darkBorder: "rgba(245,240,232,0.22)",
  white: "#FFFFFF", border: "#E2E0DA", secondary: "#6B6B6B",
};


type SortKey = "full_name" | "business_name" | "trade_category_id" | "qualification_path" | "created_at" | "verification_status";

export default function AdminApplications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<TradeApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [qualFilter, setQualFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("trade_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setApps(((data as unknown) as TradeApplication[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const trades = useMemo(() => {
    const s = new Set<string>();
    apps.forEach((a) => a.trade_category_id && s.add(a.trade_category_id));
    return Array.from(s).sort();
  }, [apps]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "created_at" ? "desc" : "asc"); }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = apps.filter((a) => {
      if (statusFilter !== "all" && a.verification_status !== statusFilter) return false;
      if (tradeFilter !== "all" && a.trade_category_id !== tradeFilter) return false;
      if (qualFilter !== "all" && a.qualification_path !== qualFilter) return false;
      if (q) {
        const pc = String((a.form_data?.postcode as string) ?? "");
        const hay = [a.full_name, a.applicant_email, a.business_name, pc].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      const av = String((a[sortKey] as string) ?? "").toLowerCase();
      const bv = String((b[sortKey] as string) ?? "").toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [apps, search, statusFilter, tradeFilter, qualFilter, sortKey, sortDir]);

  const th = (label: string, key: SortKey) => (
    <th onClick={() => toggleSort(key)} style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 700, color: C.deep, cursor: "pointer", whiteSpace: "nowrap", borderBottom: `2px solid ${C.border}` }}>
      {label}{sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );

  const selStyle: React.CSSProperties = { fontSize: 13, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, color: C.deep };

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Trade Applications — Admin" description="Admin review of submitted trade applications." path="/admin/applications" />
      <AdminPageHeader
        title="Trade applications"
        subtitle={loading ? "Loading…" : `${rows.length} of ${apps.length} application${apps.length === 1 ? "" : "s"}`}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, business, postcode…"
            style={{ ...selStyle, flex: "1 1 260px", minWidth: 200 }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selStyle}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={qualFilter} onChange={(e) => setQualFilter(e.target.value)} style={selStyle}>
            <option value="all">All routes</option>
            <option value="regulated">Regulated</option>
            <option value="qualified">Qualified</option>
            <option value="time-served">Time-served</option>
          </select>
          <select value={tradeFilter} onChange={(e) => setTradeFilter(e.target.value)} style={selStyle}>
            <option value="all">All trades</option>
            {trades.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                {th("Applicant", "full_name")}
                {th("Business", "business_name")}
                {th("Trade", "trade_category_id")}
                {th("Route", "qualification_path")}
                {th("Submitted", "created_at")}
                {th("Status", "verification_status")}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} onClick={() => navigate(`/admin/applications/${a.id}`)}
                  style={{ cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF7")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 600, color: C.deep }}>
                    {a.full_name || "—"}
                    <div style={{ fontSize: 11, fontWeight: 400, color: C.secondary }}>{a.applicant_email || ""}</div>
                  </td>
                  <td style={{ padding: "11px 12px", fontSize: 13, color: C.deep }}>{a.business_name || "—"}</td>
                  <td style={{ padding: "11px 12px", fontSize: 13, color: C.deep }}>{a.trade_category_id || "—"}</td>
                  <td style={{ padding: "11px 12px", fontSize: 13, color: C.deep }}>{QUAL_LABEL[a.qualification_path ?? ""] || a.qualification_path || "—"}</td>
                  <td style={{ padding: "11px 12px", fontSize: 13, color: C.secondary, whiteSpace: "nowrap" }}>{format(new Date(a.created_at), "d MMM yyyy")}</td>
                  <td style={{ padding: "11px 12px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.white, background: STATUS_COLOR[a.verification_status] || C.secondary, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
                      {STATUS_LABEL[a.verification_status] || a.verification_status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", fontSize: 14, color: C.secondary }}>No applications match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
