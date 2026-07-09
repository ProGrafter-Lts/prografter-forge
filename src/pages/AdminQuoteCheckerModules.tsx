import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUOTE_CHECKER_MODULES } from "@/lib/quoteCheckerModules";

interface ManualRequest {
  id: string;
  quote_type: string;
  name: string;
  email: string;
  phone: string | null;
  file_path: string | null;
  file_name: string | null;
  note: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["new", "reviewing", "completed"];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: "bg-teal/15 text-teal border-teal/30",
    coming_soon: "bg-muted text-muted-foreground border-border",
    draft: "bg-amber-100 text-amber-700 border-amber-200",
    new: "bg-teal/15 text-teal border-teal/30",
    reviewing: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`font-mono text-[10px] uppercase tracking-wider ${map[status] ?? ""}`}>
      {status.replace("_", " ")}
    </Badge>
  );
};

export default function AdminQuoteCheckerModules() {
  const [requests, setRequests] = useState<ManualRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("manual_quote_review_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load manual review requests");
    } else {
      setRequests((data as ManualRequest[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Per-module submitted-check counts derived from manual requests by quote type.
  const requestCountByType = useMemo(() => {
    const m: Record<string, { count: number; last: string | null }> = {};
    for (const r of requests) {
      const key = r.quote_type;
      if (!m[key]) m[key] = { count: 0, last: null };
      m[key].count += 1;
      if (!m[key].last || r.created_at > (m[key].last as string)) m[key].last = r.created_at;
    }
    return m;
  }, [requests]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("manual_quote_review_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Could not update status");
      return;
    }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("quote-pdfs").createSignedUrl(path, 600);
    if (error || !data?.signedUrl) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Quote Checker Modules — Admin" description="Manage quote checker modules and manual review requests." path="/admin/quote-checker-modules" noindex />
      <AdminPageHeader
        title="Quote Checker Modules"
        subtitle="Module status overview and homeowner manual review requests for coming-soon quote types."
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* MODULES */}
        <section>
          <h2 className="font-heading text-lg text-navy mb-3">Modules</h2>
          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-left font-mono text-[11px] uppercase tracking-wider text-secondary-text">
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted checks</th>
                  <th className="px-4 py-3">Last run</th>
                </tr>
              </thead>
              <tbody>
                {QUOTE_CHECKER_MODULES.map((m) => {
                  const stats = requestCountByType[m.short_label];
                  return (
                    <tr key={m.module_id} className="border-b border-navy/5 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-body text-navy">{m.display_name}</div>
                        <div className="font-mono text-[11px] text-secondary-text">{m.short_label}</div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                      <td className="px-4 py-3 font-mono text-navy">{stats?.count ?? 0}</td>
                      <td className="px-4 py-3 font-mono text-secondary-text">
                        {stats?.last ? format(new Date(stats.last), "d MMM yyyy") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 font-mono text-[11px] text-secondary-text">
            Only the Extension module is active. "Submitted checks" here reflects manual review requests per type.
          </p>
        </section>

        {/* MANUAL REQUESTS */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg text-navy">Manual Quote Review Requests</h2>
            <Button variant="outline" size="sm" onClick={load} className="font-mono text-xs">Refresh</Button>
          </div>

          {loading ? (
            <p className="font-mono text-sm text-secondary-text">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="font-mono text-sm text-secondary-text">No manual review requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-navy/10 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading text-navy">{r.name}</span>
                        <StatusBadge status={r.status} />
                        <Badge variant="outline" className="font-mono text-[10px]">{r.quote_type}</Badge>
                      </div>
                      <div className="mt-1 font-mono text-[12px] text-secondary-text space-y-0.5">
                        <div>{r.email}{r.phone ? ` · ${r.phone}` : ""}</div>
                        <div>Submitted {format(new Date(r.created_at), "d MMM yyyy, HH:mm")}</div>
                      </div>
                      {r.note && <p className="mt-2 font-body text-sm text-navy/80 whitespace-pre-wrap">{r.note}</p>}
                      {r.file_path && (
                        <button
                          onClick={() => openFile(r.file_path as string)}
                          className="mt-2 font-mono text-xs text-teal underline underline-offset-2"
                        >
                          {r.file_name ?? "View uploaded file"}
                        </button>
                      )}
                    </div>
                    <div className="shrink-0">
                      <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                        <SelectTrigger className="w-36 font-mono text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s} className="font-mono text-xs capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
