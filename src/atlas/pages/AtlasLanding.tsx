import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Map, ChevronRight } from "lucide-react";
import AtlasShell from "../AtlasShell";
import { statusPill } from "../lib";

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
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In progress" },
  { value: "paused", label: "Paused" },
  { value: "ready_for_review", label: "Ready for review" },
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

  return (
    <AtlasShell>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1B3A5C,#0D9488)" }}>
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-primary text-3xl md:text-4xl">Atlas</h1>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Guided site surveys</p>
          </div>
        </div>
        <p className="font-body text-sm text-muted-foreground max-w-2xl">
          Capture the property as it actually is — before drawings, assumptions or estimating. Every observation feeds
          Construction Intelligence, Estimator, Quote Builder and Compliance downstream.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          onClick={() => navigate("/atlas/new")}
          className="gap-2"
          style={{ background: "#0D9488", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Start new Atlas survey
        </Button>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by project, address, customer…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition ${
              status === f.value
                ? "bg-white/10 border-white/25 text-white"
                : "bg-transparent border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="font-mono text-sm text-muted-foreground">Loading surveys…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-12 text-center border border-white/10 bg-white/[0.03]">
          <p className="font-mono text-sm text-muted-foreground mb-4">
            No Atlas surveys yet. Start your first one to record a property.
          </p>
          <Button onClick={() => navigate("/atlas/new")} style={{ background: "#0D9488", color: "white" }}>
            <Plus className="w-4 h-4 mr-2" /> Start new survey
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              to={`/atlas/${r.id}`}
              className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading text-primary text-lg truncate">{r.project_title}</h3>
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${statusPill(r.status)}`}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground truncate">
                  {r.property_address || "No address"} {r.postcode ? `· ${r.postcode}` : ""}
                  {r.customer_name ? ` · ${r.customer_name}` : ""}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end min-w-[120px]">
                <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-teal-400" style={{ width: `${r.completion_percentage}%` }} />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground mt-1">
                  {r.completion_percentage}% · updated {new Date(r.updated_at).toLocaleDateString()}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white" />
            </Link>
          ))}
        </div>
      )}
    </AtlasShell>
  );
}
