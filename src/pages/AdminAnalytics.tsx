import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type Ga4Report = {
  totals: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    conversions: number;
  };
  topPages: { path: string; views: number }[];
  conversionEvents: { name: string; count: number }[];
  timeseries: { date: string; activeUsers: number }[];
};

const RANGES = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 28 days", value: "28" },
  { label: "Last 90 days", value: "90" },
];

const fmt = (n: number) => new Intl.NumberFormat("en-GB").format(n);

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-foreground">{fmt(value)}</div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState("28");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["ga4-report", days],
    queryFn: async (): Promise<Ga4Report> => {
      const { data, error } = await supabase.functions.invoke("ga4-report", {
        body: { days: Number(days) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as Ga4Report;
    },
  });

  const maxUsers = Math.max(1, ...(data?.timeseries.map((d) => d.activeUsers) ?? [0]));

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Analytics — Admin" description="Traffic and conversion analytics" noindex />
      <AdminPageHeader
        title="Analytics"
        subtitle="Traffic and conversions from Google Analytics 4."
        actions={
          <>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => refetch()}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-accent"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </>
        }
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">

        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            Loading analytics…
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-sm text-foreground">
            <p className="font-medium">Analytics backend not set up yet.</p>
            <p className="mt-1 text-muted-foreground">
              Page-view and conversion tracking is already live on the site, but
              this in-app dashboard needs a Google Cloud service account and your
              GA4 property ID before it can pull reports. Ask Lovable to finish
              the analytics setup and provide those credentials to enable it.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Details: {(error as Error)?.message ?? "ga4-report function unavailable"}
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Active users" value={data.totals.activeUsers} />
              <StatCard label="Sessions" value={data.totals.sessions} />
              <StatCard label="Page views" value={data.totals.screenPageViews} />
              <StatCard label="Conversions" value={data.totals.conversions} />
            </div>

            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Active users over time</h2>
              <div className="flex h-40 items-end gap-1">
                {data.timeseries.map((d) => (
                  <div key={d.date} className="flex-1" title={`${d.date}: ${fmt(d.activeUsers)}`}>
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${(d.activeUsers / maxUsers) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Top pages</h2>
                <ul className="space-y-2 text-sm">
                  {data.topPages.length === 0 && (
                    <li className="text-muted-foreground">No data.</li>
                  )}
                  {data.topPages.map((p) => (
                    <li key={p.path} className="flex justify-between gap-4">
                      <span className="truncate text-foreground">{p.path}</span>
                      <span className="shrink-0 text-muted-foreground">{fmt(p.views)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Conversions by event</h2>
                <ul className="space-y-2 text-sm">
                  {data.conversionEvents.length === 0 && (
                    <li className="text-muted-foreground">No conversions recorded yet.</li>
                  )}
                  {data.conversionEvents.map((c) => (
                    <li key={c.name} className="flex justify-between gap-4">
                      <span className="truncate text-foreground">{c.name}</span>
                      <span className="shrink-0 text-muted-foreground">{fmt(c.count)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        <div className="mt-8 text-sm">
          <Link to="/admin/job-briefs" className="text-primary hover:underline">
            ← Back to admin
          </Link>
        </div>
      </div>
    </div>
  );
}
