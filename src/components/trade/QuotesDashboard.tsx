import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, PoundSterling, MapPin, Clock, CheckCircle2, XCircle, PencilLine, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GenerateQuotePdfButton from "./GenerateQuotePdfButton";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { isTestRecord } from "@/lib/testData";
import { badgeToneStyle, type BadgeTone } from "@/lib/statusBadge";

interface QuoteRow {
  id: string;
  amount: number;
  status: string | null;
  created_at: string;
  job_id?: string | null;
  is_test?: boolean | null;
  jobs: {
    id?: string;
    is_test?: boolean | null;
    title: string | null;
    job_type: string;
    postcode: string;
    stage?: string | null;
  } | null;
}

interface DraftRow {
  jobId: string;
  savedAt: string | null;
  amount: number;
  jobTitle: string;
  postcode: string;
}

const timeAgo = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

type StatusKey = "submitted" | "accepted" | "declined" | "withdrawn";

const statusMeta: Record<StatusKey, { label: string; tone: BadgeTone; icon: typeof Clock }> = {
  submitted: { label: "Awaiting decision", tone: "amber", icon: Clock },
  accepted: { label: "Accepted", tone: "green", icon: CheckCircle2 },
  declined: { label: "Not selected", tone: "red", icon: XCircle },
  withdrawn: { label: "Withdrawn / superseded", tone: "grey", icon: XCircle },
};

const normaliseStatus = (raw: string | null): StatusKey => {
  const s = (raw || "").toLowerCase();
  if (["accepted", "won", "awarded", "agreed_offline"].includes(s)) return "accepted";
  if (["declined", "rejected", "lost", "not_selected"].includes(s)) return "declined";
  if (["withdrawn", "cancelled", "expired", "superseded"].includes(s)) return "withdrawn";
  return "submitted";
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">{children}</div>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary font-mono text-[11px] px-2.5 py-1.5 rounded-full">
    {children}
  </span>
);

const QuotesDashboard = ({ quotes: allQuotes }: { quotes: QuoteRow[] }) => {
  const navigate = useNavigate();
  /* Real vs test/demo records are never blended into one figure. */
  const quotes = useMemo(() => allQuotes.filter((q) => !isTestRecord(q)), [allQuotes]);
  const testQuotes = useMemo(() => allQuotes.filter((q) => isTestRecord(q)), [allQuotes]);
  const testValue = useMemo(
    () => testQuotes.reduce((s, q) => s + Number(q.amount || 0), 0),
    [testQuotes],
  );
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [filter, setFilter] = useState<"all" | "drafts" | StatusKey>("all");

  /* ---- local unsent drafts (QuoteBuilder autosaves to localStorage) ---- */
  useEffect(() => {
    const load = async () => {
      const found: { jobId: string; savedAt: string | null; amount: number }[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key?.startsWith("pg_quote_draft_")) continue;
          const jobId = key.replace("pg_quote_draft_", "");
          try {
            const d = JSON.parse(localStorage.getItem(key) || "{}");
            found.push({ jobId, savedAt: d.savedAt ?? null, amount: Number(d.amount) || Number(d.standardPrice) || 0 });
          } catch { /* skip corrupt */ }
        }
      } catch { /* storage unavailable */ }

      // Drop drafts for jobs that already have a submitted quote.
      const quotedJobIds = new Set(quotes.map((q) => q.job_id || q.jobs?.id).filter(Boolean) as string[]);
      const pending = found.filter((f) => !quotedJobIds.has(f.jobId));
      if (!pending.length) { setDrafts([]); return; }

      const { data } = await supabase
        .from("jobs")
        .select("id, title, job_type, postcode")
        .in("id", pending.map((p) => p.jobId));

      setDrafts(
        pending.map((p) => {
          const job = (data || []).find((j: any) => j.id === p.jobId) as any;
          return {
            ...p,
            jobTitle: job?.title || job?.job_type || "Job",
            postcode: job?.postcode || "",
          };
        }).sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || "")),
      );
    };
    load();
  }, [quotes]);

  const counts = useMemo(() => {
    const base = { drafts: drafts.length, submitted: 0, accepted: 0, declined: 0, withdrawn: 0 };
    quotes.forEach((q) => { base[normaliseStatus(q.status)] += 1; });
    return base;
  }, [quotes, drafts]);

  const totalValue = useMemo(
    () => quotes.filter((q) => normaliseStatus(q.status) === "submitted").reduce((s, q) => s + Number(q.amount || 0), 0),
    [quotes],
  );
  const wonValue = useMemo(
    () => quotes.filter((q) => normaliseStatus(q.status) === "accepted").reduce((s, q) => s + Number(q.amount || 0), 0),
    [quotes],
  );
  const winRate = counts.accepted + counts.declined > 0
    ? Math.round((counts.accepted / (counts.accepted + counts.declined)) * 100)
    : null;

  const visibleQuotes = useMemo(() => {
    if (filter === "all") return [...quotes, ...testQuotes];
    if (filter === "drafts") return [];
    return [...quotes, ...testQuotes].filter((q) => normaliseStatus(q.status) === filter);
  }, [quotes, testQuotes, filter]);

  const showDrafts = filter === "all" || filter === "drafts";

  const tabs: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: quotes.length + drafts.length },
    { key: "drafts", label: "Drafts", count: counts.drafts },
    { key: "submitted", label: "Awaiting decision", count: counts.submitted },
    { key: "accepted", label: "Accepted", count: counts.accepted },
    { key: "declined", label: "Not selected", count: counts.declined },
  ];

  const stats = [
    { label: "Drafts in progress", value: String(counts.drafts) },
    { label: "Awaiting decision", value: `£${totalValue.toLocaleString()}` },
    { label: "Accepted value", value: `£${wonValue.toLocaleString()}` },
    { label: "Win rate", value: winRate === null ? "—" : `${winRate}%` },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-4 border border-primary/10">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="font-heading text-primary text-2xl mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {testQuotes.length > 0 && (
        <p className="font-mono text-[11px] text-muted-foreground">
          Excluded from the figures above: {testQuotes.length} test/demo{" "}
          {testQuotes.length === 1 ? "quote" : "quotes"} worth £{testValue.toLocaleString()}. They are
          tagged TEST in the list below.
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={String(t.key)}
            onClick={() => setFilter(t.key)}
            className={`font-mono text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
              filter === t.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-primary/70 border-primary/15 hover:border-primary/40"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Drafts */}
      {showDrafts && drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-primary text-xl">Started but not sent</h2>
          {drafts.map((d) => (
            <Card key={d.jobId}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h3 className="font-heading text-primary text-lg leading-tight">{d.jobTitle}</h3>
                <span className="bg-primary/10 text-primary font-mono text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <PencilLine className="w-3 h-3" /> Draft
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {d.postcode && <Pill><MapPin className="w-3 h-3" />{d.postcode}</Pill>}
                {d.amount > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
                    <PoundSterling className="w-3 h-3" />{d.amount.toLocaleString()}
                  </span>
                )}
                <Pill><Clock className="w-3 h-3" />Saved {timeAgo(d.savedAt)}</Pill>
              </div>
              <button
                onClick={() => navigate(`/jobs/${d.jobId}/quote`)}
                className="mt-4 inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-mono text-[11px] px-3 py-2 rounded-full"
              >
                Continue quote <ArrowRight className="w-3 h-3" />
              </button>
            </Card>
          ))}
        </section>
      )}

      {/* Submitted quotes */}
      <section className="space-y-3">
        {showDrafts && drafts.length > 0 && <h2 className="font-heading text-primary text-xl">Submitted</h2>}

        {visibleQuotes.length === 0 && !(showDrafts && drafts.length) ? (
          <div className="bg-card rounded-2xl p-8 border border-primary/10 text-center">
            <FileText className="w-10 h-10 text-primary/20 mx-auto mb-3" />
            <p className="font-mono text-sm text-muted-foreground">
              Nothing here yet. Browse job matches to start your first quote.
            </p>
          </div>
        ) : (
          visibleQuotes.map((quote) => {
            const key = normaliseStatus(quote.status);
            const meta = statusMeta[key];
            const Icon = meta.icon;
            const jobId = quote.job_id || quote.jobs?.id;
            return (
              <Card key={quote.id}>
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/quotes/${quote.id}`)}
                >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h3 className="font-heading text-primary text-lg leading-tight">
                    {quote.jobs?.title || quote.jobs?.job_type || "Job"}
                  </h3>
                  <span className="flex flex-wrap items-center justify-end gap-1.5 shrink min-w-0">
                    {isTestRecord(quote) && (
                      <span
                        className="shrink-0 whitespace-nowrap font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={badgeToneStyle("grey")}
                      >
                        TEST
                      </span>
                    )}
                    <span
                      className="shrink-0 whitespace-nowrap font-mono text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      style={badgeToneStyle(meta.tone)}
                    >
                      <Icon className="w-3 h-3" /> {meta.label}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {quote.jobs?.postcode && <Pill><MapPin className="w-3 h-3" />{quote.jobs.postcode}</Pill>}
                  <span className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
                    £{Number(quote.amount).toLocaleString()}
                  </span>
                  <Pill><Clock className="w-3 h-3" />Sent {timeAgo(quote.created_at)}</Pill>
                  {quote.jobs?.stage && <Pill>Job stage: {quote.jobs.stage.replace(/_/g, " ")}</Pill>}
                </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-mono text-[11px] px-3 py-2 rounded-full"
                  >
                    View quote <ArrowRight className="w-3 h-3" />
                  </button>
                  {isFeatureEnabled("quotePdf") && <GenerateQuotePdfButton quoteId={quote.id} />}
                  {jobId && key === "submitted" && (
                    <button
                      onClick={() => navigate(`/jobs/${jobId}/quote`)}
                      className="inline-flex items-center gap-1.5 border border-primary/20 text-primary font-mono text-[11px] px-3 py-2 rounded-full hover:bg-primary/5"
                    >
                      Review quote <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
};

export default QuotesDashboard;
