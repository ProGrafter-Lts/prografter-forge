import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getVerdictTheme, type AiVerdict } from "@/lib/quoteVerdict";
import VerifiedTradeBadge from "@/components/trade/VerifiedTradeBadge";
import { toast } from "sonner";

interface QuoteRow {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  ai_verdict: AiVerdict;
  ai_verdict_summary: string | null;
  trades: {
    name: string;
    company_name: string;
    verified: boolean;
    review_count: number;
    avg_rating: number | null;
    tier: string | null;
    trade_type?: string | null;
    cps_scheme?: string | null;
    cps_registration_number?: string | null;
    gas_safe_number?: string | null;
  } | null;
}

interface JobInfo {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
}

const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  unverified: "Unverified",
};

const ratingNode = (t: QuoteRow["trades"]) => {
  if (!t) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  if (!t.review_count || t.review_count === 0) {
    return (
      <div className="flex flex-col items-start gap-1">
        {t.tier && t.tier !== "unverified" && (
          <Badge variant="outline" className="text-[10px] font-mono">
            {TIER_LABELS[t.tier] ?? t.tier}
          </Badge>
        )}
        <span className="font-mono text-[10px] text-muted-foreground italic">
          Awaiting first review
        </span>
      </div>
    );
  }
  return (
    <span className="font-mono text-xs text-primary font-medium">
      {Number(t.avg_rating).toFixed(1)} ({t.review_count})
    </span>
  );
};

// Heuristic feature detection from quote message text — placeholder until AI populates structured fields.
const detectFromMessage = (q: QuoteRow) => {
  const msg = (q.message ?? "").toLowerCase();
  const has = (...needles: string[]) => needles.some((n) => msg.includes(n));
  return {
    partP: has("part p notification") || has("part-p notification") || has("building control"),
    partPClaimedSelfCert: has("self-certify") || has("self certify"),
    eic: has("eic") && !has("eicr"),
    eicr: has("eicr"),
    buildingRegs: has("building regs") || has("building control"),
    warranty: !has("no warranty") && !has("warranty: not specified") && (has("warranty") || has("guarantee")),
    timelineDays: (() => {
      const m = msg.match(/(\d+)\s*(working\s*)?day/);
      return m ? Number(m[1]) : null;
    })(),
    deposit: (() => {
      const m = msg.match(/(\d{1,2})\s*%\s*deposit|deposit[^£]*£?\s*([\d,]+)/);
      if (m && m[1]) return `${m[1]}%`;
      if (m && m[2]) return `£${m[2]}`;
      return null;
    })(),
  };
};

const Yes = () => (
  <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-xs">
    <Check className="w-3.5 h-3.5" /> Yes
  </span>
);
const No = ({ warn = false }: { warn?: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 font-mono text-xs ${warn ? "text-rose-700" : "text-muted-foreground"}`}
  >
    {warn ? <AlertTriangle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} No
  </span>
);

const CompareQuotes = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobInfo | null>(null);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!jobId) return;
      const [jobRes, quoteRes] = await Promise.all([
        supabase.from("jobs").select("id, title, job_type, postcode").eq("id", jobId).single(),
        supabase
          .from("quotes")
          .select(
            "id, amount, message, status, ai_verdict, ai_verdict_summary, trades(name, company_name, verified, review_count, avg_rating, tier)",
          )
          .eq("job_id", jobId)
          .order("amount", { ascending: true }),
      ]);
      setJob(jobRes.data as JobInfo | null);
      setQuotes((quoteRes.data ?? []) as unknown as QuoteRow[]);
      setLoading(false);
    };
    load();
  }, [jobId]);

  const handleAccept = async (quoteId: string) => {
    const { error } = await supabase
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId);
    if (error) {
      toast.error("Couldn't accept quote — please try again");
    } else {
      toast.success("Quote accepted");
      navigate(`/project/${jobId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="font-mono text-sm text-muted-foreground">Loading comparison…</p>
      </div>
    );
  }

  const features = quotes.map((q) => detectFromMessage(q));

  const ROWS: { label: string; render: (q: QuoteRow, i: number) => React.ReactNode }[] = [
    {
      label: "Tradesperson",
      render: (q) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-heading text-primary text-sm">
              {q.trades?.company_name || q.trades?.name || "—"}
            </span>
            {q.trades?.verified && <BadgeCheck className="w-4 h-4 text-secondary" />}
          </div>
          {ratingNode(q.trades)}
        </div>
      ),
    },
    {
      label: "Total price (inc VAT)",
      render: (q) => (
        <span className="font-heading text-secondary text-xl">
          £{Number(q.amount).toLocaleString()}
        </span>
      ),
    },
    {
      label: "Timeline",
      render: (_q, i) =>
        features[i].timelineDays ? (
          <span className="font-mono text-xs">{features[i].timelineDays} days</span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">Not specified</span>
        ),
    },
    {
      label: "Deposit required",
      render: (_q, i) =>
        features[i].deposit ? (
          <span className="font-mono text-xs">{features[i].deposit}</span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">Not specified</span>
        ),
    },
    {
      label: "Warranty",
      render: (_q, i) => (features[i].warranty ? <Yes /> : <No warn />),
    },
    {
      label: "Part P notification",
      render: (_q, i) => {
        const f = features[i];
        if (f.partPClaimedSelfCert)
          return (
            <span className="inline-flex items-center gap-1 text-rose-700 font-mono text-xs">
              <AlertTriangle className="w-3.5 h-3.5" /> Self-cert claimed
            </span>
          );
        return f.partP ? <Yes /> : <No warn />;
      },
    },
    {
      label: "EIC certificate",
      render: (_q, i) => (features[i].eic || features[i].eicr ? <Yes /> : <No />),
    },
    {
      label: "EICR (landlord)",
      render: (_q, i) => (features[i].eicr ? <Yes /> : <No />),
    },
    {
      label: "Building Regs",
      render: (_q, i) => (features[i].buildingRegs ? <Yes /> : <No />),
    },
    {
      label: "Insurance verified",
      render: (q) => (q.trades?.verified ? <Yes /> : <No />),
    },
    {
      label: "Tier",
      render: (q) => (
        <Badge variant="outline" className="font-mono text-[10px]">
          {TIER_LABELS[q.trades?.tier ?? "unverified"] ?? q.trades?.tier}
        </Badge>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <button
          onClick={() => navigate(`/dashboard/homeowner`)}
          className="font-mono text-xs text-secondary hover:underline inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> Back to dashboard
        </button>

        <h1 className="font-heading text-primary text-3xl md:text-4xl">Compare Quotes</h1>
        <p className="font-mono text-sm text-muted-foreground mt-1 mb-6">
          {job?.title ?? job?.job_type} · {job?.postcode}
        </p>

        {quotes.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">No quotes yet for this job.</p>
        ) : (
          <>
            {/* Verdict header strip */}
            <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `minmax(140px,180px) repeat(${quotes.length}, minmax(220px, 1fr))` }}>
              <div />
              {quotes.map((q) => {
                const theme = getVerdictTheme(q.ai_verdict);
                const Icon = theme.icon;
                return (
                  <div
                    key={q.id}
                    className={`bg-card rounded-xl p-3 border border-border ${theme.borderClass}`}
                  >
                    <Badge className={`${theme.badgeClass} font-mono text-[10px] inline-flex items-center gap-1`}>
                      <Icon className={`w-3 h-3 ${theme.iconClass}`} />
                      {theme.shortLabel}
                    </Badge>
                    <p className="font-mono text-[10px] text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                      {q.ai_verdict_summary || theme.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Mobile: stacked cards (one per quote). Desktop: comparison grid. */}
            <div className="hidden md:block bg-card border border-border rounded-2xl overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {ROWS.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={idx % 2 === 0 ? "bg-muted/20" : ""}
                    >
                      <td className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider p-3 align-top w-44">
                        {row.label}
                      </td>
                      {quotes.map((q, i) => (
                        <td key={q.id} className="p-3 align-top border-l border-border">
                          {row.render(q, i)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-3" />
                    {quotes.map((q) => (
                      <td key={q.id} className="p-3 border-l border-border">
                        <button
                          onClick={() => handleAccept(q.id)}
                          className="w-full bg-secondary text-secondary-foreground font-mono text-xs px-3 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                        >
                          Accept this quote
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile: swipeable carousel */}
            <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4">
              {quotes.map((q, i) => {
                const theme = getVerdictTheme(q.ai_verdict);
                return (
                  <div
                    key={q.id}
                    className={`bg-card rounded-2xl p-4 border border-border shadow-sm shrink-0 w-[85%] snap-center ${theme.borderClass}`}
                  >
                    <div className="space-y-3">
                      {ROWS.map((row) => (
                        <div key={row.label} className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-28">
                            {row.label}
                          </span>
                          <div className="text-right">{row.render(q, i)}</div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAccept(q.id)}
                        className="w-full bg-secondary text-secondary-foreground font-mono text-xs px-3 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                      >
                        Accept this quote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompareQuotes;
