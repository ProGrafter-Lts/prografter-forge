import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface LeadRow {
  match_id: string;
  job_id: string;
  job_ref: string | null;
  job_type: string | null;
  job_postcode: string | null;
  job_created_at: string;
  match_status: string;
  notified_at: string;
  trade_id: string;
  trade_name: string | null;
  trade_company: string | null;
  trade_type: string | null;
  trade_postcode: string | null;
  trade_verified: boolean;
}

interface CoverageRow {
  area: string;
  trade_count: number;
  coming_soon_count: number;
  job_count: number;
  match_count: number;
}

type Tab = "by_job" | "by_trade" | "coverage";

const TABS: { key: Tab; label: string }[] = [
  { key: "by_job", label: "By job brief" },
  { key: "by_trade", label: "By trade" },
  { key: "coverage", label: "Area balance" },
];

const statusColor = (s: string) => {
  switch (s) {
    case "accepted":
      return "bg-teal/15 text-teal border-teal/30";
    case "declined":
    case "rejected":
    case "withdrawn":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-navy/10 text-navy border-navy/20";
  }
};

export default function AdminLeadDistribution() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("by_job");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [leads, cov] = await Promise.all([
        supabase.rpc("admin_lead_distribution" as any),
        supabase.rpc("admin_area_coverage" as any),
      ]);
      if (leads.error) {
        toast.error("Failed to load lead distribution");
        console.warn(leads.error);
      }
      if (cov.error) {
        toast.error("Failed to load area coverage");
        console.warn(cov.error);
      }
      setRows(((leads.data as unknown) as LeadRow[]) || []);
      setCoverage(((cov.data as unknown) as CoverageRow[]) || []);
      setLoading(false);
    })();
  }, []);

  // Group matches by job
  const byJob = useMemo(() => {
    const map = new Map<string, { job: LeadRow; matches: LeadRow[] }>();
    for (const r of rows) {
      if (!map.has(r.job_id)) map.set(r.job_id, { job: r, matches: [] });
      map.get(r.job_id)!.matches.push(r);
    }
    return Array.from(map.values());
  }, [rows]);

  // Group matches by trade
  const byTrade = useMemo(() => {
    const map = new Map<
      string,
      { trade: LeadRow; matches: LeadRow[]; accepted: number }
    >();
    for (const r of rows) {
      if (!map.has(r.trade_id))
        map.set(r.trade_id, { trade: r, matches: [], accepted: 0 });
      const t = map.get(r.trade_id)!;
      t.matches.push(r);
      if (r.match_status === "accepted") t.accepted += 1;
    }
    return Array.from(map.values()).sort(
      (a, b) => b.matches.length - a.matches.length
    );
  }, [rows]);

  const totals = useMemo(() => {
    const jobs = new Set(rows.map((r) => r.job_id)).size;
    const trades = new Set(rows.map((r) => r.trade_id)).size;
    return { leads: rows.length, jobs, trades };
  }, [rows]);

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Lead distribution — Admin" description="Trade lead distribution and area coverage" noindex />
      <AdminPageHeader
        title="Lead distribution"
        subtitle="See which trades were sent each job brief, who's getting the most leads, and where coverage is thin — to target advertising and networking."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Job briefs sent out" value={totals.jobs} />
          <Stat label="Trades receiving leads" value={totals.trades} />
          <Stat label="Total leads sent" value={totals.leads} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-body border transition-colors ${
                tab === t.key
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-navy border-navy/15 hover:border-teal"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-body text-secondary-text">Loading…</p>
        ) : tab === "by_job" ? (
          <ByJob groups={byJob} />
        ) : tab === "by_trade" ? (
          <ByTrade groups={byTrade} />
        ) : (
          <Coverage rows={coverage} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white border border-navy/10 p-4">
      <div className="font-heading text-2xl sm:text-3xl text-navy">{value}</div>
      <div className="font-body text-xs sm:text-sm text-secondary-text mt-1 leading-snug">
        {label}
      </div>
    </div>
  );
}

function ByJob({ groups }: { groups: { job: LeadRow; matches: LeadRow[] }[] }) {
  if (!groups.length)
    return <Empty text="No job briefs have been matched to trades yet." />;
  return (
    <div className="space-y-4">
      {groups.map(({ job, matches }) => (
        <div
          key={job.job_id}
          className="rounded-2xl bg-white border border-navy/10 overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-navy/10 bg-cream/40">
            <div className="min-w-0">
              <span className="font-heading text-navy">
                {job.job_type || "Job"}{" "}
                <span className="font-mono text-xs text-secondary-text">
                  {job.job_ref ? `· ${job.job_ref}` : ""}
                </span>
              </span>
              <div className="font-body text-xs text-secondary-text mt-0.5">
                {job.job_postcode || "—"} ·{" "}
                {format(new Date(job.job_created_at), "d MMM yyyy")}
              </div>
            </div>
            <Badge variant="outline" className="border-navy/20 text-navy">
              {matches.length} trade{matches.length === 1 ? "" : "s"} notified
            </Badge>
          </div>
          <div className="divide-y divide-navy/5">
            {matches.map((m) => (
              <div
                key={m.match_id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <span className="font-body text-sm text-navy">
                    {m.trade_company || m.trade_name || "Trade"}
                  </span>
                  <span className="font-body text-xs text-secondary-text ml-2">
                    {m.trade_type} · {m.trade_postcode}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${statusColor(m.match_status)}`}
                >
                  {m.match_status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ByTrade({
  groups,
}: {
  groups: { trade: LeadRow; matches: LeadRow[]; accepted: number }[];
}) {
  if (!groups.length)
    return <Empty text="No trades have received leads yet." />;
  return (
    <div className="rounded-2xl bg-white border border-navy/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-cream/40 text-left font-body text-secondary-text">
            <th className="px-4 py-3 font-medium">Trade</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Area</th>
            <th className="px-4 py-3 font-medium text-right">Leads</th>
            <th className="px-4 py-3 font-medium text-right">Accepted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {groups.map(({ trade, matches, accepted }) => (
            <tr key={trade.trade_id}>
              <td className="px-4 py-3 font-body text-navy">
                {trade.trade_company || trade.trade_name || "Trade"}
                {trade.trade_verified && (
                  <span className="ml-1.5 text-xs text-teal">✓</span>
                )}
              </td>
              <td className="px-4 py-3 font-body text-secondary-text">
                {trade.trade_type || "—"}
              </td>
              <td className="px-4 py-3 font-body text-secondary-text">
                {trade.trade_postcode || "—"}
              </td>
              <td className="px-4 py-3 font-body text-navy text-right">
                {matches.length}
              </td>
              <td className="px-4 py-3 font-body text-navy text-right">
                {accepted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Coverage({ rows }: { rows: CoverageRow[] }) {
  if (!rows.length)
    return <Empty text="No area data yet." />;

  const maxJobs = Math.max(1, ...rows.map((r) => r.job_count));
  const maxTrades = Math.max(1, ...rows.map((r) => r.trade_count));

  const flag = (r: CoverageRow) => {
    // High demand, low supply -> opportunity to recruit trades
    if (r.job_count >= 3 && r.trade_count <= 1)
      return { label: "Need more trades", cls: "bg-amber-100 text-amber-800 border-amber-200" };
    // Trades present, no jobs -> opportunity to advertise to homeowners
    if (r.trade_count >= 3 && r.job_count === 0)
      return { label: "Need more jobs", cls: "bg-blue-100 text-blue-800 border-blue-200" };
    return null;
  };

  return (
    <>
      <p className="font-body text-sm text-secondary-text mb-3">
        Per postcode area: trades that can actually receive leads (verified and in-area) vs job posts.
        Out-of-area "coming soon" trades are counted separately — they can never be sent a lead.
      </p>
      <div className="rounded-2xl bg-white border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream/40 text-left font-body text-secondary-text">
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Lead-eligible trades</th>
              <th className="px-4 py-3 font-medium text-right">Coming soon (out of area)</th>
              <th className="px-4 py-3 font-medium">Job posts</th>
              <th className="px-4 py-3 font-medium text-right">Leads sent</th>
              <th className="px-4 py-3 font-medium text-right">Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {rows.map((r) => {
              const f = flag(r);
              return (
                <tr key={r.area}>
                  <td className="px-4 py-3 font-heading text-navy">{r.area}</td>
                  <td className="px-4 py-3">
                    <Bar value={r.trade_count} max={maxTrades} color="bg-teal" />
                  </td>
                  <td className="px-4 py-3 font-body text-secondary-text text-right tabular-nums">
                    {r.coming_soon_count || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Bar value={r.job_count} max={maxJobs} color="bg-navy" />
                  </td>
                  <td className="px-4 py-3 font-body text-navy text-right">
                    {r.match_count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {f ? (
                      <Badge variant="outline" className={`text-xs ${f.cls}`}>
                        {f.label}
                      </Badge>
                    ) : (
                      <span className="text-secondary-text text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 max-w-[140px] rounded-full bg-navy/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.round((value / max) * 100)}%` }}
        />
      </div>
      <span className="font-body text-navy tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white border border-navy/10 p-8 text-center font-body text-secondary-text">
      {text}
    </div>
  );
}
