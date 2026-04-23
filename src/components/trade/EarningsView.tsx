import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PoundSterling, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface StageRow {
  payment_amount: number | null;
  payment_status: string;
  stage_name: string;
  job_id: string;
  updated_at: string;
}

interface JobRef {
  id: string;
  title: string | null;
  job_type: string;
  postcode: string;
}

const monthLabel = (d: Date) =>
  d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

const EarningsView = ({
  tradeId,
  totalReceived,
  totalQuoted,
}: {
  tradeId: string;
  totalReceived: number;
  totalQuoted: number;
}) => {
  const [stages, setStages] = useState<(StageRow & { job: JobRef | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      // Find all jobs this trade has a contract on
      const { data: contractRows } = await supabase
        .from("contracts")
        .select("job_id, jobs(id, title, job_type, postcode)")
        .eq("trade_id", tradeId);

      const jobIds = Array.from(
        new Set((contractRows || []).map((r: any) => r.job_id).filter(Boolean)),
      );
      const jobsById = new Map<string, JobRef>(
        (contractRows || [])
          .map((r: any) => r.jobs)
          .filter(Boolean)
          .map((j: any) => [j.id, j as JobRef]),
      );

      if (jobIds.length === 0) {
        if (!cancelled) {
          setStages([]);
          setLoading(false);
        }
        return;
      }

      const { data: stageRows, error } = await supabase
        .from("project_stages")
        .select("payment_amount, payment_status, stage_name, job_id, updated_at")
        .in("job_id", jobIds)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Failed to load earnings stages", error);
        if (!cancelled) {
          setStages([]);
          setLoading(false);
        }
        return;
      }

      const hydrated = (stageRows || []).map((s: any) => ({
        ...s,
        job: jobsById.get(s.job_id) ?? null,
      }));

      if (!cancelled) {
        setStages(hydrated);
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  const summary = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let upcoming = 0;
    stages.forEach((s) => {
      const amt = Number(s.payment_amount || 0);
      if (s.payment_status === "paid") paid += amt;
      else if (s.payment_status === "due" || s.payment_status === "pending") pending += amt;
      else upcoming += amt;
    });
    return { paid, pending, upcoming };
  }, [stages]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    stages
      .filter((s) => s.payment_status === "paid")
      .forEach((s) => {
        const d = new Date(s.updated_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
        map.set(key, (map.get(key) || 0) + Number(s.payment_amount || 0));
      });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 6)
      .map(([key, amount]) => {
        const [y, m] = key.split("-");
        return { label: monthLabel(new Date(Number(y), Number(m), 1)), amount };
      });
  }, [stages]);

  const recent = stages.filter((s) => s.payment_status === "paid").slice(0, 8);

  const stats = [
    { label: "Total received", value: summary.paid || totalReceived, icon: CheckCircle2, tone: "text-secondary" },
    { label: "Awaiting payment", value: summary.pending, icon: Clock, tone: "text-amber-600" },
    { label: "Upcoming stages", value: summary.upcoming, icon: TrendingUp, tone: "text-primary" },
    { label: "Total quoted", value: totalQuoted, icon: PoundSterling, tone: "text-primary" },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-primary text-2xl flex items-center gap-2">
          <PoundSterling className="w-5 h-5" /> Earnings
        </h2>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          Stage payments across all projects. Paid stages release into your account.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">
            <s.icon className={`w-5 h-5 ${s.tone}`} />
            <p className="font-heading text-2xl text-primary mt-2">
              £{Math.round(s.value).toLocaleString()}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">
        <h3 className="font-heading text-primary text-lg mb-4">Monthly receipts (last 6 months)</h3>
        {loading ? (
          <p className="font-mono text-sm text-muted-foreground">Loading…</p>
        ) : monthly.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">
            No payments received yet. Once a project stage is marked paid it will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {monthly.map((m) => {
              const max = Math.max(...monthly.map((x) => x.amount), 1);
              const pct = Math.round((m.amount / max) * 100);
              return (
                <div key={m.label}>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="text-primary font-semibold">£{m.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-primary/5 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">
        <h3 className="font-heading text-primary text-lg mb-4">Recent payments</h3>
        {loading ? (
          <p className="font-mono text-sm text-muted-foreground">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">
            No payments logged yet.
          </p>
        ) : (
          <div className="divide-y divide-primary/5">
            {recent.map((s, idx) => (
              <div key={`${s.job_id}-${idx}`} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-primary text-sm truncate">
                    {s.job?.title || s.job?.job_type || "Project"}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {s.stage_name} · {new Date(s.updated_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <p className="font-mono text-sm text-secondary font-semibold whitespace-nowrap">
                  £{Number(s.payment_amount || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EarningsView;
