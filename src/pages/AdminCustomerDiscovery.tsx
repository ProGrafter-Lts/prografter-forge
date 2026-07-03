import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { CALL_TYPES, CALL_STATUSES, callTypeLabel, callStatusLabel } from "@/lib/callGuides";
import { toast } from "sonner";

interface CallRow {
  id: string;
  call_type: string;
  call_status: string;
  call_date: string | null;
  homeowner_name: string | null;
  project_reference: string | null;
  follow_up_date: string | null;
  job_brief_id: string | null;
  quote_check_id: string | null;
  created_at: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AdminCustomerDiscovery() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsWeek, setInsightsWeek] = useState(0);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("customer_call_notes")
      .select("id, call_type, call_status, call_date, homeowner_name, project_reference, follow_up_date, job_brief_id, quote_check_id, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as CallRow[]) ?? []);

    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const { count } = await (supabase as any)
      .from("customer_call_insights")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo);
    setInsightsWeek(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const t = todayStr();
    return {
      today: rows.filter((r) => (r.call_date ?? r.created_at)?.slice(0, 10) === t).length,
      followUp: rows.filter((r) => r.call_status === "needs_follow_up" || (r.follow_up_date && r.follow_up_date <= t)).length,
      scoping: rows.filter((r) => r.call_type === "job_scoping" && !["complete", "converted", "in_dataset"].includes(r.call_status)).length,
      planning: rows.filter((r) => r.call_type === "planning_guidance" && !["complete", "converted", "in_dataset"].includes(r.call_status)).length,
      qhc: rows.filter((r) => r.call_type === "qhc_followup" && !["complete", "converted", "in_dataset"].includes(r.call_status)).length,
      completed: rows.filter((r) => ["complete", "converted", "in_dataset"].includes(r.call_status)).length,
    };
  }, [rows]);

  const startNew = async () => {
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await (supabase as any)
      .from("customer_call_notes")
      .insert({ call_type: "initial_discovery", call_status: "not_started", admin_user_id: user?.id, call_date: new Date().toISOString() })
      .select("id")
      .single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    navigate(`/admin/scoping-calls/${data.id}`);
  };

  const statCards = [
    { label: "Calls today", value: stats.today },
    { label: "Needing follow-up", value: stats.followUp },
    { label: "Scoping outstanding", value: stats.scoping },
    { label: "Planning guidance outstanding", value: stats.planning },
    { label: "QHC follow-ups", value: stats.qhc },
    { label: "Completed", value: stats.completed },
    { label: "Insights added this week", value: insightsWeek },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Customer Discovery — ProGrafter Admin" description="Guided scoping calls" noindex />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl text-navy">Customer Discovery & Scoping</h1>
            <p className="font-body text-secondary-text mt-1">Internal ProGrafter tool for guided homeowner calls.</p>
          </div>
          <button
            onClick={startNew}
            disabled={creating}
            className="rounded-lg bg-navy text-cream font-mono text-sm px-4 py-2 hover:bg-teal transition-colors disabled:opacity-50"
          >
            {creating ? "Creating…" : "+ New scoping call"}
          </button>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl bg-white border border-navy/10 p-4">
              <div className="font-heading text-2xl text-navy">{s.value}</div>
              <div className="font-body text-xs text-secondary-text leading-snug mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-navy/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-navy font-mono text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Homeowner</th>
                  <th className="text-left px-4 py-3">Project</th>
                  <th className="text-left px-4 py-3">Call type</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Follow-up</th>
                  <th className="text-left px-4 py-3">Linked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-secondary-text">Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-secondary-text">No calls yet.</td></tr>
                ) : rows.map((r) => (
                  <tr key={r.id} className="hover:bg-cream/40 cursor-pointer" onClick={() => navigate(`/admin/scoping-calls/${r.id}`)}>
                    <td className="px-4 py-3 text-navy whitespace-nowrap">{(r.call_date ?? r.created_at)?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-navy">{r.homeowner_name || "—"}</td>
                    <td className="px-4 py-3 text-secondary-text">{r.project_reference || "—"}</td>
                    <td className="px-4 py-3 text-secondary-text">{callTypeLabel(r.call_type)}</td>
                    <td className="px-4 py-3"><span className="inline-block rounded-full bg-navy/10 text-navy px-2 py-0.5 text-xs">{callStatusLabel(r.call_status)}</span></td>
                    <td className="px-4 py-3 text-secondary-text whitespace-nowrap">{r.follow_up_date || "—"}</td>
                    <td className="px-4 py-3 text-secondary-text text-xs">
                      {r.job_brief_id ? "Job brief" : r.quote_check_id ? "Quote check" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 font-body text-xs text-secondary-text max-w-2xl">
          Recordings and transcripts may contain personal information. Only save what is needed for project
          support, service improvement and platform learning. Do not share recordings with trades or third
          parties without permission. Recordings are admin-only by default.
        </p>

        <div className="mt-4">
          <Link to="/admin" className="font-mono text-xs text-teal hover:underline">← Back to admin dashboard</Link>
        </div>
      </div>
    </div>
  );
}
