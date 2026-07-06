import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  Loader2,
  CheckCircle2,
  Archive,
  FileText,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface StandardRow {
  id: string;
  standard_id: string;
  standard_name: string;
  trade_type: string;
  version: string;
  status: "active" | "draft" | "archived";
  effective_date: string | null;
  author: string | null;
  scope_summary: string | null;
  included_scope: string | null;
  excluded_scope: string | null;
  updated_at: string;
}

interface CheckRow {
  check_id: string;
  display_order: number;
  section_name: string | null;
  check_title: string;
  pass_condition: string | null;
  why_it_matters: string | null;
}

const STATUS_STYLES: Record<StandardRow["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-amber-50 text-amber-800 border-amber-200",
  archived: "bg-navy/5 text-secondary-text border-navy/15",
};

const StandardCard = ({
  std,
  count,
  busy,
  onActivate,
  onArchive,
  onInspect,
  expanded,
  checks,
  loadingChecks,
}: {
  std: StandardRow;
  count: number;
  busy: boolean;
  onActivate: () => void;
  onArchive: () => void;
  onInspect: () => void;
  expanded: boolean;
  checks: CheckRow[] | null;
  loadingChecks: boolean;
}) => {
  const grouped = useMemo(() => {
    const map = new Map<string, CheckRow[]>();
    (checks || []).forEach((c) => {
      const key = c.section_name || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return Array.from(map.entries());
  }, [checks]);

  return (
    <div className="rounded-2xl bg-white border border-navy/10 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading text-lg text-navy">{std.standard_name}</h3>
              <span
                className={`font-mono text-[10px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${STATUS_STYLES[std.status]}`}
              >
                {std.status}
              </span>
            </div>
            <p className="font-mono text-xs text-secondary-text mt-1">
              {std.standard_id} · v{std.version} · {count} checks
              {std.effective_date ? ` · effective ${std.effective_date}` : ""}
            </p>
            {std.scope_summary && (
              <p className="font-body text-sm text-secondary-text mt-2 max-w-2xl leading-snug">
                {std.scope_summary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {std.status !== "active" && (
              <button
                onClick={onActivate}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white font-mono text-xs px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Activate
              </button>
            )}
            {std.status !== "archived" && (
              <button
                onClick={onArchive}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 text-navy font-mono text-xs px-3 py-1.5 hover:bg-navy/5 disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onInspect}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-teal hover:opacity-80"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {expanded ? "Hide checks" : "Inspect checks"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-navy/10 bg-cream/40 p-5">
          {loadingChecks ? (
            <div className="flex items-center gap-2 font-mono text-xs text-secondary-text">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading checks…
            </div>
          ) : (
            <div className="space-y-4">
              {(std.included_scope || std.excluded_scope) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {std.included_scope && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-emerald-700 mb-1">In scope</p>
                      <p className="font-body text-xs text-navy/80 whitespace-pre-wrap">{std.included_scope}</p>
                    </div>
                  )}
                  {std.excluded_scope && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-rose-700 mb-1">Out of scope</p>
                      <p className="font-body text-xs text-navy/80 whitespace-pre-wrap">{std.excluded_scope}</p>
                    </div>
                  )}
                </div>
              )}
              {grouped.map(([section, rows]) => (
                <div key={section}>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-teal mb-2">{section}</p>
                  <div className="space-y-1.5">
                    {rows.map((c) => (
                      <div key={c.check_id} className="rounded-lg border border-navy/10 bg-white p-3">
                        <p className="font-mono text-xs text-navy">
                          <span className="text-teal">{c.check_id}</span> · {c.check_title}
                        </p>
                        {c.pass_condition && (
                          <p className="font-body text-xs text-secondary-text mt-1">
                            <span className="font-semibold text-navy/70">Pass:</span> {c.pass_condition}
                          </p>
                        )}
                        {c.why_it_matters && (
                          <p className="font-body text-xs text-secondary-text mt-0.5">
                            <span className="font-semibold text-navy/70">Why:</span> {c.why_it_matters}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AdminQuoteStandards() {
  const [standards, setStandards] = useState<StandardRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checksById, setChecksById] = useState<Record<string, CheckRow[]>>({});
  const [loadingChecks, setLoadingChecks] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: stds } = await supabase
      .from("quote_standards")
      .select("*")
      .order("trade_type", { ascending: true })
      .order("version", { ascending: false });
    const rows = (stds || []) as StandardRow[];
    setStandards(rows);
    const { data: checkRows } = await supabase
      .from("quote_standard_checks")
      .select("standard_uuid");
    const c: Record<string, number> = {};
    (checkRows || []).forEach((r: any) => {
      c[r.standard_uuid] = (c[r.standard_uuid] || 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const inspect = async (std: StandardRow) => {
    if (expandedId === std.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(std.id);
    if (checksById[std.id]) return;
    setLoadingChecks(true);
    const { data } = await supabase
      .from("quote_standard_checks")
      .select("check_id, display_order, section_name, check_title, pass_condition, why_it_matters")
      .eq("standard_uuid", std.id)
      .order("display_order", { ascending: true });
    setChecksById((prev) => ({ ...prev, [std.id]: (data || []) as CheckRow[] }));
    setLoadingChecks(false);
  };

  const activate = async (std: StandardRow) => {
    setBusyId(std.id);
    // Archive other versions of the same trade, then activate this one.
    await supabase
      .from("quote_standards")
      .update({ status: "archived" })
      .eq("trade_type", std.trade_type)
      .neq("id", std.id)
      .eq("status", "active");
    await supabase.from("quote_standards").update({ status: "active" }).eq("id", std.id);
    setBusyId(null);
    load();
  };

  const archive = async (std: StandardRow) => {
    setBusyId(std.id);
    await supabase.from("quote_standards").update({ status: "archived" }).eq("id", std.id);
    setBusyId(null);
    load();
  };

  const byTrade = useMemo(() => {
    const map = new Map<string, StandardRow[]>();
    standards.forEach((s) => {
      if (!map.has(s.trade_type)) map.set(s.trade_type, []);
      map.get(s.trade_type)!.push(s);
    });
    return Array.from(map.entries());
  }, [standards]);

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Quote Standards — Admin" description="Manage ProGrafter quote check standards" noindex />
      <AdminPageHeader
        title="Quote Check Standards"
        subtitle="Fixed, trade-specific quote check standards. Activate the version each trade should use, archive old versions, and inspect every check. Historical reports keep the version they were run against."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center gap-2 font-mono text-sm text-secondary-text">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading standards…
          </div>
        ) : standards.length === 0 ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-secondary-text mb-3" />
            <p className="font-body text-secondary-text">No standards imported yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {byTrade.map(([trade, rows]) => (
              <section key={trade}>
                <h2 className="flex items-center gap-2 font-heading text-xl text-navy mb-3 capitalize">
                  <ShieldCheck className="w-5 h-5 text-teal" /> {trade}
                </h2>
                <div className="space-y-3">
                  {rows.map((std) => (
                    <StandardCard
                      key={std.id}
                      std={std}
                      count={counts[std.id] || 0}
                      busy={busyId === std.id}
                      onActivate={() => activate(std)}
                      onArchive={() => archive(std)}
                      onInspect={() => inspect(std)}
                      expanded={expandedId === std.id}
                      checks={checksById[std.id] || null}
                      loadingChecks={loadingChecks && expandedId === std.id && !checksById[std.id]}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
