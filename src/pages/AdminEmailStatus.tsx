import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { format } from "date-fns";

// Emails the platform sends, grouped by category.
// `matchKey` is the value stored in email_send_log.template_name.
const EMAIL_CATALOG: {
  name: string;
  category: "auth" | "onboarding" | "contract" | "payments" | "quotes" | "project";
  matchKey: string;
}[] = [
  // Auth (handled by auth-email-hook — each action_type logs under its own name)
  { name: "auth_signup_verification", category: "auth", matchKey: "signup" },
  { name: "auth_password_reset",      category: "auth", matchKey: "recovery" },
  { name: "auth_email_change",        category: "auth", matchKey: "email_change" },
  { name: "auth_magic_link",          category: "auth", matchKey: "magiclink" },
  // Onboarding
  { name: "homeowner-welcome",            category: "onboarding", matchKey: "homeowner-welcome" },
  { name: "trade-welcome",                category: "onboarding", matchKey: "trade-welcome" },
  { name: "trade-verification-submitted", category: "onboarding", matchKey: "trade-verification-submitted" },
  { name: "trade-verified",               category: "onboarding", matchKey: "trade-verified" },
  { name: "trade-rejected",               category: "onboarding", matchKey: "trade-rejected" },
  { name: "trade-verification-query",     category: "onboarding", matchKey: "trade-verification-query" },
  // Quotes
  { name: "quote-received",               category: "quotes", matchKey: "quote-received" },
  // Payments
  { name: "payment-released-trade",       category: "payments", matchKey: "payment-released-trade" },
  { name: "payment-released-homeowner",   category: "payments", matchKey: "payment-released-homeowner" },
  // Project lifecycle
  { name: "project-overdue-trade",        category: "project", matchKey: "project-overdue-trade" },
  { name: "project-overdue-homeowner",    category: "project", matchKey: "project-overdue-homeowner" },
  // Contract lifecycle — templates registered, triggers ship with contract signing (target June 2026)
  { name: "contract-generated",           category: "contract", matchKey: "contract-generated" },
  { name: "contract-awaiting-signature",  category: "contract", matchKey: "contract-awaiting-signature" },
  { name: "contract-activated",           category: "contract", matchKey: "contract-activated" },
  { name: "variation-proposed",           category: "contract", matchKey: "variation-proposed" },
  { name: "variation-approved",           category: "contract", matchKey: "variation-approved" },
  { name: "completion-marked",            category: "contract", matchKey: "completion-marked" },
  { name: "completion-accepted",          category: "contract", matchKey: "completion-accepted" },
];

const REGISTERED_TEMPLATES = new Set([
  "homeowner-welcome",
  "trade-welcome",
  "trade-verification-submitted",
  "trade-verified",
  "trade-rejected",
  "trade-verification-query",
  "waitlist-welcome",
  "waitlist-admin-notification",
  "contact-message",
  "quote-received",
  "payment-released-trade",
  "payment-released-homeowner",
  "project-overdue-trade",
  "project-overdue-homeowner",
  "contract-generated",
  "contract-awaiting-signature",
  "contract-activated",
  "variation-proposed",
  "variation-approved",
  "completion-marked",
  "completion-accepted",
]);

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

  const statsByEmail = useMemo<Record<string, Stats>>(() => {
    const out: Record<string, Stats> = {};
    for (const e of EMAIL_CATALOG) {
      const rows = dedupedByMessage.filter((r) => r.template_name === e.matchKey);
      const sent = rows.filter((r) => r.status === "sent");
      const failed = rows.filter(
        (r) => r.status === "failed" || r.status === "dlq" || r.status === "bounced"
      );
      out[e.name] = {
        configured:
          e.category === "auth"
            ? true
            : REGISTERED_TEMPLATES.has(e.name),
        lastSent: sent[0]?.created_at || null,
        lastFailed: failed[0]?.created_at || null,
        lastFailedReason: failed[0]?.error_message || null,
        totalSends30d: rows.length,
        failures30d: failed.length,
        failureRate: rows.length > 0 ? (failed.length / rows.length) * 100 : 0,
      };
    }
    return out;
  }, [dedupedByMessage]);

  const sortedCatalog = useMemo(
    () =>
      [...EMAIL_CATALOG].sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      ),
    []
  );

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Email Status — Admin" description="Admin monitor for transactional and auth email pipelines." path="/admin/email-status" />
      <header className="border-b border-navy/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl text-navy">
            Pro<span className="text-teal">Grafter</span>
            <span className="ml-3 text-xs font-mono uppercase tracking-widest text-secondary-text">
              admin
            </span>
          </Link>
          <Link
            to="/admin/verifications"
            className="font-mono text-xs uppercase tracking-widest text-teal hover:underline"
          >
            Verifications →
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-heading text-navy text-4xl mb-2">Email Status</h1>
            <p className="font-body text-secondary-text">
              All transactional and auth email pipelines, last 30 days. Source:{" "}
              <code className="font-mono text-xs">email_send_log</code>.
            </p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-xl bg-white border border-navy/10 hover:bg-navy/5"
          >
            ↻ Refresh
          </button>
        </div>

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

        <p className="mt-6 font-mono text-xs text-secondary-text">
          Note: All four auth emails share a single template name{" "}
          <code>auth_emails</code> in the log (the auth-email-hook routes them
          all through one pipeline), so the four auth rows above show the same
          aggregate counts. Contract emails are not yet wired — they'll appear
          once the contract triggers ship.
        </p>
      </main>
    </div>
  );
};

export default AdminEmailStatus;
