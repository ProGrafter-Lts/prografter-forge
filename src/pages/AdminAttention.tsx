import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAttention } from "@/hooks/useAttention";
import {
  AttentionItem,
  AttentionPriority,
  PRIORITY_LABEL,
  SOURCE_LABEL,
  formatWhen,
  timeWaiting,
} from "@/lib/attention";

type FilterKey = "all" | AttentionPriority | "resolved";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "urgent", label: "Urgent" },
  { key: "action_required", label: "Action required" },
  { key: "follow_up", label: "Follow up" },
  { key: "information", label: "Information" },
  { key: "resolved", label: "Resolved" },
];

const PRIORITY_STYLE: Record<AttentionPriority, string> = {
  urgent: "bg-red-600 text-white",
  action_required: "bg-teal text-cream",
  follow_up: "bg-amber-500 text-white",
  information: "bg-navy/10 text-navy",
};

interface EnquiryRecord {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: string;
}

const AdminAttention = () => {
  const { items, resolved, counts, total, loading, refresh } = useAttention();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [params, setParams] = useSearchParams();
  const [enquiry, setEnquiry] = useState<EnquiryRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const openKey = params.get("item");

  useEffect(() => {
    if (!openKey?.startsWith("contact_enquiry:")) {
      setEnquiry(null);
      return;
    }
    const id = openKey.split(":")[1];
    (async () => {
      const { data } = await supabase
        .from("contact_enquiries")
        .select("id,name,email,subject,message,created_at,status")
        .eq("id", id)
        .maybeSingle();
      setEnquiry((data as EnquiryRecord) ?? null);
    })();
  }, [openKey]);

  const sources = useMemo(
    () => Array.from(new Set([...items, ...resolved].map((i) => i.source))),
    [items, resolved],
  );

  const visible = useMemo(() => {
    const base = filter === "resolved" ? resolved : items;
    return base.filter(
      (i) =>
        (filter === "all" || filter === "resolved" || i.priority === filter) &&
        (sourceFilter === "all" || i.source === sourceFilter),
    );
  }, [filter, sourceFilter, items, resolved]);

  const markEnquiryResponded = async (id: string) => {
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("contact_enquiries")
      .update({ status: "responded", responded_at: new Date().toISOString(), responded_by: userData.user?.id ?? null })
      .eq("id", id);
    setBusy(false);
    if (error) return toast.error("Could not update the enquiry");
    toast.success("Enquiry marked as responded");
    setParams({});
    refresh();
  };

  const markResolved = async (item: AttentionItem) => {
    const note = window.prompt("Optional resolution note", "") ?? null;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from("attention_resolutions").insert([{
      source_type: item.source,
      source_id: item.sourceId,
      resolved_by: userData.user.id,
      resolved_by_email: userData.user.email ?? null,
      note: note || null,
    }]);
    if (error) return toast.error("Could not mark as resolved");
    toast.success("Marked resolved");
    refresh();
  };

  const reopen = async (item: AttentionItem) => {
    const { error } = await supabase
      .from("attention_resolutions")
      .delete()
      .eq("source_type", item.source)
      .eq("source_id", item.sourceId);
    if (error) return toast.error("Could not reopen");
    refresh();
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Attention — ProGrafter Admin" description="Admin attention centre" noindex />
      <AdminPageHeader
        title="Needs your attention"
        subtitle="Everything across ProGrafter waiting on an administrator, newest risk first."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["urgent", "action_required", "follow_up", "information"] as AttentionPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                filter === p ? "border-teal bg-white" : "border-navy/10 bg-white/70 hover:border-teal/40"
              }`}
            >
              <div className="font-heading text-3xl text-navy">{counts[p]}</div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-secondary-text mt-1">
                {PRIORITY_LABEL[p]}
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.key
                  ? "bg-navy text-cream border-navy"
                  : "border-navy/20 text-navy hover:border-teal"
              }`}
            >
              {f.label}
            </button>
          ))}
          {sources.length > 1 && (
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="ml-auto font-mono text-xs border border-navy/20 rounded-full px-3 py-1.5 bg-white text-navy"
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
              ))}
            </select>
          )}
        </div>

        {loading && <p className="font-mono text-sm text-secondary-text">Loading attention items…</p>}

        {!loading && visible.length === 0 && (
          <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center">
            <p className="font-heading text-xl text-navy">Nothing needs your attention</p>
            <p className="font-body text-sm text-secondary-text mt-1">
              {total === 0 ? "The queue is clear." : "No items match this filter."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {visible.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-navy/10 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${PRIORITY_STYLE[item.priority]}`}>
                    {PRIORITY_LABEL[item.priority]}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-secondary-text border border-navy/15 rounded px-2 py-0.5">
                    {SOURCE_LABEL[item.source]}
                  </span>
                  {item.overdue && (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-red-600">Past response target</span>
                  )}
                  {!item.overdue && item.dueSoon && (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-amber-600">Due soon</span>
                  )}
                </div>
                <h2 className="font-heading text-lg text-navy leading-snug break-words">{item.title}</h2>
                {item.description && (
                  <p className="font-body text-sm text-secondary-text mt-1 line-clamp-2">{item.description}</p>
                )}
                <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 font-mono text-[11px]">
                  {(item.person || item.company) && (
                    <div>
                      <dt className="text-secondary-text uppercase">Who</dt>
                      <dd className="text-navy break-words">{[item.person, item.company].filter(Boolean).join(" · ")}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-secondary-text uppercase">Received</dt>
                    <dd className="text-navy">{formatWhen(item.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-secondary-text uppercase">Waiting</dt>
                    <dd className="text-navy">{timeWaiting(item.createdAt)}</dd>
                  </div>
                  {item.dueAt && (
                    <div>
                      <dt className="text-secondary-text uppercase">Target</dt>
                      <dd className={item.overdue ? "text-red-600" : "text-navy"}>{formatWhen(item.dueAt)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-secondary-text uppercase">Status</dt>
                    <dd className="text-navy">{item.status}</dd>
                  </div>
                  {item.relatedRef && (
                    <div>
                      <dt className="text-secondary-text uppercase">Reference</dt>
                      <dd className="text-navy">{item.relatedRef}</dd>
                    </div>
                  )}
                </dl>
                {"resolution" in item && (item as { resolution?: { resolved_by_email?: string | null; resolved_at: string; note?: string | null } }).resolution && (
                  <p className="mt-3 font-mono text-[11px] text-secondary-text">
                    Resolved by {(item as never as { resolution: { resolved_by_email?: string | null } }).resolution.resolved_by_email ?? "admin"} ·{" "}
                    {formatWhen((item as never as { resolution: { resolved_at: string } }).resolution.resolved_at)}
                    {(item as never as { resolution: { note?: string | null } }).resolution.note
                      ? ` · ${(item as never as { resolution: { note?: string | null } }).resolution.note}`
                      : ""}
                  </p>
                )}
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <Link
                  to={item.actionHref}
                  className="font-mono text-xs bg-teal text-cream px-3 py-2 rounded-lg text-center hover:bg-teal-hover transition-colors"
                >
                  {item.actionLabel}
                </Link>
                {filter === "resolved" ? (
                  <button
                    onClick={() => reopen(item)}
                    className="font-mono text-xs border border-navy/20 text-navy px-3 py-2 rounded-lg hover:border-teal transition-colors"
                  >
                    Reopen
                  </button>
                ) : (
                  <button
                    onClick={() => markResolved(item)}
                    className="font-mono text-xs border border-navy/20 text-navy px-3 py-2 rounded-lg hover:border-teal transition-colors"
                  >
                    Mark resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enquiry reader */}
      {enquiry && (
        <div className="fixed inset-0 z-[60] bg-navy/50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-heading text-2xl text-navy">{enquiry.subject}</h2>
                <p className="font-mono text-xs text-secondary-text mt-1">
                  {enquiry.name} · {enquiry.email} · {formatWhen(enquiry.created_at)}
                </p>
              </div>
              <button
                onClick={() => setParams({})}
                className="font-mono text-xs text-secondary-text hover:text-navy"
              >
                Close
              </button>
            </div>
            <p className="font-body text-body-text whitespace-pre-wrap">{enquiry.message}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: ${enquiry.subject}`)}`}
                className="font-mono text-xs bg-teal text-cream px-4 py-2.5 rounded-lg hover:bg-teal-hover transition-colors"
              >
                Reply by email
              </a>
              {enquiry.status === "new" && (
                <button
                  disabled={busy}
                  onClick={() => markEnquiryResponded(enquiry.id)}
                  className="font-mono text-xs border border-navy/20 text-navy px-4 py-2.5 rounded-lg hover:border-teal transition-colors disabled:opacity-50"
                >
                  Mark as responded
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttention;
