import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { format } from "date-fns";

import { buildEmailCatalog } from "@/lib/emailCatalog";


interface LogRow {
  template_name: string;
  status: string;
  error_message: string | null;
  created_at: string;
  message_id: string | null;
}

interface Stats {
  configured: boolean;
  lastSent: string | null;
  lastFailed: string | null;
  lastFailedReason: string | null;
  totalSends30d: number;
  failures30d: number;
  failureRate: number;
}

const AdminEmailStatus = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("email_send_log")
        .select("template_name,status,error_message,created_at,message_id")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (!error && mounted) setLogs((data as LogRow[]) || []);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [refreshKey]);

  // Deduplicate by message_id, taking the latest row per email.
  const dedupedByMessage = useMemo(() => {
    const seen = new Set<string>();
    const out: LogRow[] = [];
    for (const r of logs) {
      const key = r.message_id || `${r.template_name}-${r.created_at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [logs]);

  // Catalog derived from the generated template registry + any template_name
  // actually observed in the log, so it can never silently drift.
  const sortedCatalog = useMemo(
    () => buildEmailCatalog(logs.map((r) => r.template_name)),
    [logs]
  );

  const statsByEmail = useMemo<Record<string, Stats>>(() => {
    const out: Record<string, Stats> = {};
    for (const e of sortedCatalog) {
      const rows = dedupedByMessage.filter((r) => r.template_name === e.matchKey);
      const sent = rows.filter((r) => r.status === "sent");
      const failed = rows.filter(
        (r) => r.status === "failed" || r.status === "dlq" || r.status === "bounced"
      );
      out[e.name] = {
        configured: e.registered,
        lastSent: sent[0]?.created_at || null,
        lastFailed: failed[0]?.created_at || null,
        lastFailedReason: failed[0]?.error_message || null,
        totalSends30d: rows.length,
        failures30d: failed.length,
        failureRate: rows.length > 0 ? (failed.length / rows.length) * 100 : 0,
      };
    }
    return out;
  }, [dedupedByMessage, sortedCatalog]);


  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Email Status — Admin" description="Admin monitor for transactional and auth email pipelines." path="/admin/email-status" />
      <AdminPageHeader
        title="Email status"
        subtitle={<>All transactional and auth email pipelines, last 30 days. Source: <code className="font-mono text-xs">email_send_log</code>.</>}
        actions={
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-xl bg-white border border-navy/10 hover:bg-navy/5"
          >
            ↻ Refresh
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {loading ? (
          <p className="font-mono text-sm text-secondary-text">Loading log entries…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-navy/5">
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-secondary-text">
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Template</th>
                  <th className="px-3 py-3">Last sent</th>
                  <th className="px-3 py-3">Last failed</th>
                  <th className="px-3 py-3 text-right">Sends 30d</th>
                  <th className="px-3 py-3 text-right">Fail rate</th>
                </tr>
              </thead>
              <tbody>
                {sortedCatalog.map((e) => {
                  const s = statsByEmail[e.name];
                  const flagged = s.failureRate > 5;
                  return (
                    <tr
                      key={e.name}
                      className={`border-t border-navy/5 ${flagged ? "bg-red-50" : ""}`}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-navy">{e.name}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                            e.category === "auth"
                              ? "bg-blue-100 text-blue-700"
                              : e.category === "onboarding"
                              ? "bg-teal/10 text-teal"
                              : e.category === "payments"
                              ? "bg-emerald-100 text-emerald-700"
                              : e.category === "quotes"
                              ? "bg-amber-100 text-amber-700"
                              : e.category === "project"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {e.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {s.configured ? (
                          <span className="text-green-600">✓ yes</span>
                        ) : (
                          <span className="text-red-600">✗ no</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-body-text">
                        {s.lastSent
                          ? format(new Date(s.lastSent), "dd MMM HH:mm")
                          : "—"}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {s.lastFailed ? (
                          <span title={s.lastFailedReason || ""} className="text-red-600">
                            {format(new Date(s.lastFailed), "dd MMM HH:mm")}
                          </span>
                        ) : (
                          <span className="text-secondary-text">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-body-text text-right">
                        {s.totalSends30d}
                      </td>
                      <td
                        className={`px-3 py-3 font-mono text-xs text-right ${
                          flagged ? "text-red-700 font-bold" : "text-body-text"
                        }`}
                      >
                        {s.totalSends30d === 0
                          ? "—"
                          : `${s.failureRate.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 space-y-3 font-mono text-xs text-secondary-text">
          <p>
            Auth emails (signup, recovery, magiclink, email_change) log under
            their Supabase action_type — rows above map directly to those keys
            in <code>email_send_log</code>.
          </p>
          <p>
            <strong>Contract emails:</strong> 7 templates configured but not yet
            wired. They will be connected when the contract signing feature
            ships (target: early June 2026). Do NOT ship contract signing
            without the <code>contract-awaiting-signature</code> trigger live.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminEmailStatus;
