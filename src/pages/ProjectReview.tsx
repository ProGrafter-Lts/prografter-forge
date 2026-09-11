import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { loadCompletionReport, money, type CompletionReport } from "@/lib/projectCompletion";

/**
 * PROJECT REVIEW — trade-private completion record for one canonical project.
 *
 * Everything here derives from data ProGrafter already holds; only the short
 * delivery reflection asks the trade for anything new. Cost, profit and margin
 * come from `project_commercials`, which RLS restricts to the owning trade —
 * this page is never reachable with a homeowner's data access.
 */
const FIELDS: { key: string; label: string }[] = [
  { key: "went_well", label: "What went well?" },
  { key: "lost_time", label: "What caused the most lost time?" },
  { key: "cost_more", label: "What cost more than expected?" },
  { key: "price_differently", label: "What would you price differently next time?" },
  { key: "programme_differently", label: "What would you programme differently next time?" },
  { key: "supplier_lessons", label: "Any supplier / subcontractor lessons?" },
  { key: "client_payment_lessons", label: "Any client or payment process lessons?" },
  { key: "repeat_next_time", label: "What would you repeat on the next similar job?" },
];

const PAYMENT_OUTCOME: Record<string, string> = {
  worked_well: "Payment structure worked well",
  needs_review: "Payment structure needs review",
  insufficient_data: "Insufficient data",
};

const ProjectReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<CompletionReport | null>(null);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        navigate("/login");
        return;
      }
      const { data: trade } = await supabase
        .from("trades")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      setTradeId(trade?.id ?? null);

      const r = id ? await loadCompletionReport(id) : null;
      setReport(r);
      if (r?.review) {
        const seeded: Record<string, string> = {};
        FIELDS.forEach((f) => (seeded[f.key] = (r.review as any)[f.key] || ""));
        setAnswers(seeded);
      }
      setLoading(false);
    };
    void load();
  }, [id, navigate]);

  const saveReview = async () => {
    if (!id || !tradeId || !report) return;
    setSaving(true);
    const { error } = await supabase.from("project_reviews").upsert(
      {
        job_id: id,
        trade_id: tradeId,
        ...answers,
        payment_outcome: report.paymentSummary.outcome,
        programme_outcome:
          report.programmeSummary.varianceDays == null
            ? null
            : report.programmeSummary.varianceDays >= 0
              ? "ahead_or_on_programme"
              : "behind_programme",
      } as any,
      { onConflict: "job_id,trade_id" },
    );
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Couldn't save your review.");
    } else {
      toast.success("Project review saved.");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-dark min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="dashboard-dark min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  if (!tradeId) {
    return (
      <div className="dashboard-dark min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            The Project Review is private to the trade who delivered this project.
          </p>
        </div>
      </div>
    );
  }

  const c = report.commercials;
  const finalValue = report.finalValuePence ?? 0;
  const estProfit = c?.estimated_cost_pence != null ? finalValue - Number(c.estimated_cost_pence) : null;
  const actProfit = c?.actual_cost_pence != null ? finalValue - Number(c.actual_cost_pence) : null;
  const pct = (v: number | null) => (v == null || finalValue === 0 ? "—" : `${Math.round((v / finalValue) * 1000) / 10}%`);
  const prog = report.programmeSummary;

  return (
    <div className="dashboard-dark min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <button
          onClick={() => navigate(`/project/${id}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to project
        </button>

        <header>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Project Review · private to your business
          </p>
          <h1 className="font-heading text-foreground text-2xl md:text-3xl">
            {report.job.title || report.job.job_type}
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {report.job.ref ? `${report.job.ref} · ` : ""}
            {report.job.address ? `${report.job.address}, ` : ""}
            {report.job.postcode}
          </p>
        </header>

        <Section title="Commercial outcome">
          <Grid>
            <Cell label="Original contract" value={money(report.originalContractPence)} />
            <Cell label="Approved variations" value={money(report.approvedVariationsPence)} />
            <Cell label="Final project value" value={money(report.finalValuePence)} />
            <Cell label="Amount paid" value={money(report.paymentSummary.paidPence)} />
            <Cell label="Amount outstanding" value={money(report.paymentSummary.outstandingPence)} />
          </Grid>
          <p className="font-mono text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Costs, profit and margin below are never visible to the homeowner.
          </p>
          <Grid>
            <Cell label="Estimated cost" value={c?.estimated_cost_pence != null ? money(Number(c.estimated_cost_pence)) : "Not recorded"} />
            <Cell label="Actual cost" value={c?.actual_cost_pence != null ? money(Number(c.actual_cost_pence)) : "Not recorded"} />
            <Cell label="Estimated gross profit" value={estProfit != null ? money(estProfit) : "Not recorded"} />
            <Cell label="Actual gross profit" value={actProfit != null ? money(actProfit) : "Not recorded"} />
            <Cell label="Estimated margin" value={pct(estProfit)} />
            <Cell label="Actual margin" value={pct(actProfit)} />
          </Grid>
        </Section>

        <Section title="Programme performance">
          <Grid>
            <Cell label="Planned start" value={fmt(prog.plannedStart)} />
            <Cell label="Actual start" value={fmt(prog.actualStart)} />
            <Cell label="Planned completion" value={fmt(prog.plannedEnd)} />
            <Cell label="Actual completion" value={fmt(prog.actualEnd)} />
            <Cell label="Planned duration" value={prog.plannedDurationDays != null ? `${prog.plannedDurationDays} days` : "—"} />
            <Cell label="Actual duration" value={prog.actualDurationDays != null ? `${prog.actualDurationDays} days` : "—"} />
            <Cell
              label="Programme result"
              value={
                prog.varianceDays == null
                  ? "Insufficient data"
                  : prog.varianceDays >= 0
                    ? `${prog.varianceDays} days ahead / on programme`
                    : `${Math.abs(prog.varianceDays)} days behind`
              }
            />
            <Cell label="Recorded delay days" value={`${prog.recordedDelayDays}`} />
          </Grid>
          {prog.delayReasons.length > 0 && (
            <ul className="mt-3 space-y-1">
              {prog.delayReasons.map((d, i) => (
                <li key={i} className="font-mono text-[11px] text-muted-foreground">
                  <span className="text-foreground">{d.category}</span>
                  {d.days ? ` · ${d.days} day${d.days === 1 ? "" : "s"}` : ""} — {d.note}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Payment & cash flow">
          <Grid>
            <Cell label="Milestones" value={`${report.paymentSummary.milestones}`} />
            <Cell label="Milestones paid" value={`${report.paymentSummary.paidMilestones}`} />
            <Cell label="First payment" value={fmt(report.paymentSummary.firstPaymentDate)} />
            <Cell label="Last payment" value={fmt(report.paymentSummary.lastPaymentDate)} />
            <Cell
              label="Largest payment gap"
              value={report.paymentSummary.largestGapDays != null ? `${report.paymentSummary.largestGapDays} days` : "—"}
            />
            <Cell label="Completed but unpaid milestones" value={`${report.paymentSummary.latePayments}`} />
          </Grid>
          <p className="mt-3 font-mono text-xs uppercase tracking-wide text-teal-300">
            {PAYMENT_OUTCOME[report.paymentSummary.outcome]}
          </p>
        </Section>

        <Section title="Variation performance">
          <Grid>
            <Cell label="Raised" value={`${report.variationSummary.raised}`} />
            <Cell label="Approved" value={`${report.variationSummary.approved}`} />
            <Cell label="Rejected" value={`${report.variationSummary.rejected}`} />
            <Cell label="Pending at completion" value={`${report.variationSummary.pending}`} />
            <Cell label="Approved value" value={money(report.variationSummary.approvedPence)} />
            <Cell label="Programme days added" value={`${report.variationSummary.programmeDaysAdded}`} />
            <Cell
              label="Variations as % of contract"
              value={report.variationSummary.percentOfContract != null ? `${report.variationSummary.percentOfContract}%` : "—"}
            />
          </Grid>
        </Section>

        <Section title="Delivery review">
          <p className="font-mono text-[11px] text-muted-foreground mb-3">
            Short answers only — ProGrafter already knows the numbers.
          </p>
          <div className="space-y-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </label>
                <textarea
                  rows={2}
                  value={answers[f.key] || ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs text-foreground"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveReview}
            disabled={saving}
            className="mt-4 rounded-xl bg-teal-500 px-4 py-2 font-mono text-xs text-[#08172a] disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save project review"}
          </button>
        </Section>
      </div>
    </div>
  );
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border bg-card p-5">
    <h2 className="font-heading text-foreground text-lg mb-3">{title}</h2>
    {children}
  </section>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
);

const Cell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-background/40 p-3">
    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-mono text-sm text-foreground">{value}</p>
  </div>
);

export default ProjectReview;
