import { Link } from "react-router-dom";
import { useAttention } from "@/hooks/useAttention";
import { PRIORITY_LABEL, SOURCE_LABEL, timeWaiting, AttentionPriority } from "@/lib/attention";

const PRIORITY_STYLE: Record<AttentionPriority, string> = {
  urgent: "bg-red-600 text-white",
  action_required: "bg-teal text-cream",
  follow_up: "bg-amber-500 text-white",
  information: "bg-navy/10 text-navy",
};

/**
 * Compact "Needs your attention" summary for the existing admin dashboard.
 * Reads from the same useAttention source as the nav badge and /admin/attention.
 */
const AttentionPanel = () => {
  const { items, counts, loading } = useAttention();
  const top = items.slice(0, 5);

  return (
    <section className="mb-8 rounded-2xl border border-navy/10 bg-white p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-xl text-navy">Needs your attention</h2>
        <Link to="/admin/attention" className="font-mono text-xs text-teal hover:underline">
          View all attention →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["urgent", "action_required", "follow_up"] as AttentionPriority[]).map((p) => (
          <span
            key={p}
            className={`font-mono text-[11px] uppercase tracking-wide px-2.5 py-1 rounded ${PRIORITY_STYLE[p]}`}
          >
            {counts[p]} {PRIORITY_LABEL[p]}
          </span>
        ))}
      </div>

      {loading && <p className="font-mono text-xs text-secondary-text">Loading…</p>}
      {!loading && top.length === 0 && (
        <p className="font-body text-sm text-secondary-text">Nothing is waiting on you right now.</p>
      )}

      <ul className="divide-y divide-navy/10">
        {top.map((item) => (
          <li key={item.key} className="py-2.5 flex items-center gap-3">
            <span className={`shrink-0 font-mono text-[10px] uppercase px-1.5 py-0.5 rounded ${PRIORITY_STYLE[item.priority]}`}>
              {PRIORITY_LABEL[item.priority]}
            </span>
            <span className="min-w-0 flex-1 font-body text-sm text-navy truncate">
              {item.title}
              <span className="text-secondary-text"> · {SOURCE_LABEL[item.source]}</span>
            </span>
            <span className="shrink-0 font-mono text-[11px] text-secondary-text">
              {timeWaiting(item.createdAt)}
            </span>
            <Link to={item.actionHref} className="shrink-0 font-mono text-[11px] text-teal hover:underline">
              Open
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AttentionPanel;
