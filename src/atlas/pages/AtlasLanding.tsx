import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin, ArrowUpRight, Compass } from "lucide-react";
import AtlasShell from "../AtlasShell";
import { statusPill } from "../lib";
import ProgressRing from "../components/ProgressRing";

interface Row {
  id: string;
  project_title: string;
  property_address: string | null;
  postcode: string | null;
  customer_name: string | null;
  survey_type: string;
  status: string;
  completion_percentage: number;
  updated_at: string;
}

const STATUS_FILTERS = [
  { value: "all", label: "All surveys" },
  { value: "in_progress", label: "In progress" },
  { value: "paused", label: "Paused" },
  { value: "ready_for_review", label: "Ready" },
  { value: "completed", label: "Completed" },
];

export default function AtlasLanding() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("atlas_surveys")
      .select("id, project_title, property_address, postcode, customer_name, survey_type, status, completion_percentage, updated_at")
      .order("updated_at", { ascending: false });
    if (!error) setRows((data || []) as Row[]);
    setLoading(false);
  }

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (q) {
      const hay = `${r.project_title} ${r.property_address ?? ""} ${r.customer_name ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const inProgress = rows.filter((r) => r.status === "in_progress" || r.status === "paused").length;
  const completed = rows.filter((r) => r.status === "completed").length;

  return (
    <AtlasShell>
      {/* Hero */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-300">Atlas</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            Guided site surveys
          </span>
        </div>
        <h1 className="font-heading text-white text-4xl md:text-5xl leading-[1.05] mb-3">
          The property, captured
          <br />
          <span className="text-teal-300">as it actually is.</span>
        </h1>
        <p className="font-body text-[15px] text-white/70 max-w-xl leading-relaxed">
          Walk the site once. Every observation, photo and voice note is preserved with
          audit-grade provenance, then feeds directly into Estimator, Quote Builder and Compliance.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-8 pt-6 border-t border-white/[0.06]">
          <Stat value={rows.length} label="Surveys" />
          <Stat value={inProgress} label="In progress" tone="teal" />
          <Stat value={completed} label="Completed" tone="muted" />
          <div className="flex-1" />
          <Button
            onClick={() => navigate("/atlas/new")}
            className="gap-2 h-11 px-5 rounded-full shadow-lg shadow-teal-500/20"
            style={{ background: "linear-gradient(180deg,#14B8A6,#0D9488)", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            Start new survey
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search project, address or customer…"
            className="pl-11 h-11 rounded-full bg-white/[0.04] border-white/10"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`font-mono text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap transition ${
                status === f.value
                  ? "bg-white text-[#0F2238]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <EmptyState onStart={() => navigate("/atlas/new")} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <SurveyRow key={r.id} row={r} />
          ))}
        </div>
      )}
    </AtlasShell>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: "teal" | "muted" }) {
  return (
    <div>
      <div
        className={`font-mono text-3xl leading-none ${
          tone === "teal" ? "text-teal-300" : tone === "muted" ? "text-white/50" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/50 mt-2">{label}</div>
    </div>
  );
}

function SurveyRow({ row }: { row: Row }) {
  return (
    <Link
      to={`/atlas/${row.id}`}
      className="group relative flex items-center gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all p-5"
    >
      <ProgressRing value={row.completion_percentage} size={64} stroke={6} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <h3 className="font-heading text-white text-xl leading-tight truncate">{row.project_title}</h3>
          <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusPill(row.status)}`}>
            {row.status.replace(/_/g, " ")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-white/60 font-body text-[13px]">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {row.property_address || "No address"}
            {row.postcode ? ` · ${row.postcode}` : ""}
            {row.customer_name ? ` · ${row.customer_name}` : ""}
          </span>
        </div>
        <div className="font-mono text-[10px] text-white/40 mt-1">
          Updated {new Date(row.updated_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
        </div>
      </div>

      <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-teal-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
    </Link>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-teal-500/10 border border-teal-400/20">
        <Compass className="w-7 h-7 text-teal-300" />
      </div>
      <h3 className="font-heading text-white text-2xl mb-2">Your first walk-through</h3>
      <p className="font-body text-sm text-white/60 max-w-sm mx-auto mb-6">
        Atlas guides you through a property in the order you'd naturally survey it — outside first,
        then inside. Nothing is missed and everything is defensible.
      </p>
      <Button
        onClick={onStart}
        className="gap-2 rounded-full h-11 px-6"
        style={{ background: "linear-gradient(180deg,#14B8A6,#0D9488)", color: "white" }}
      >
        <Plus className="w-4 h-4" /> Start your first survey
      </Button>
    </div>
  );
}
