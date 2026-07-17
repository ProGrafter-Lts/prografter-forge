import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pause, Play, ClipboardCheck, AlertTriangle, Check } from "lucide-react";
import AtlasShell from "../AtlasShell";
import { ensureAtlasSections, recomputeSurveyProgress, statusPill } from "../lib";
import ObservationCard, { Observation } from "../components/ObservationCard";

interface Survey {
  id: string;
  project_title: string;
  property_address: string | null;
  postcode: string | null;
  customer_name: string | null;
  project_type: string;
  status: string;
  completion_percentage: number;
  start_route: string;
  relevant_trades: string[];
  customer_intent: string | null;
}

interface Section {
  id: string;
  section_key: string;
  title: string;
  category: string;
  sequence: number;
  completion_percentage: number;
  completion_status: string;
  critical_outstanding_count: number;
}

export default function AtlasWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [obs, setObs] = useState<Observation[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const readOnly = survey?.status === "completed" || survey?.status === "superseded";

  useEffect(() => {
    if (id) void load(true);
  }, [id]);

  async function load(seed = false) {
    if (!id) return;
    setLoading(true);
    const { data: s } = await (supabase as any).from("atlas_surveys").select("*").eq("id", id).maybeSingle();
    if (!s) {
      toast.error("Survey not found");
      navigate("/atlas");
      return;
    }
    setSurvey(s as Survey);

    if (seed) {
      try { await ensureAtlasSections(id); } catch (e) { console.warn(e); }
    }

    const { data: secs } = await (supabase as any)
      .from("atlas_sections")
      .select("*")
      .eq("survey_id", id)
      .order("sequence", { ascending: true });
    const secList = (secs || []) as Section[];
    setSections(secList);
    if (secList.length && !activeSection) setActiveSection(secList[0].id);

    const { data: obsData } = await (supabase as any)
      .from("atlas_observations")
      .select("*")
      .eq("survey_id", id)
      .order("created_at", { ascending: true });
    setObs((obsData || []) as Observation[]);
    setLoading(false);
  }

  async function refresh() {
    await recomputeSurveyProgress(id!);
    await load(false);
  }

  const activeObs = useMemo(
    () => obs.filter((o) => o.section_id === activeSection),
    [obs, activeSection],
  );

  const totalCritical = sections.reduce((sum, s) => sum + s.critical_outstanding_count, 0);

  async function togglePause() {
    if (!survey) return;
    const next = survey.status === "paused" ? "in_progress" : "paused";
    await (supabase as any).from("atlas_surveys").update({
      status: next,
      paused_at: next === "paused" ? new Date().toISOString() : null,
    }).eq("id", survey.id);
    await load(false);
  }

  async function addBlankObservation() {
    if (!activeSection || !survey) return;
    const { data: sess } = await supabase.auth.getSession();
    const { data, error } = await (supabase as any)
      .from("atlas_observations")
      .insert({
        survey_id: survey.id,
        section_id: activeSection,
        title: "New observation",
        classification: "known_fact",
        response_status: "answered",
        observed_by: sess.session?.user.id,
      })
      .select("*")
      .single();
    if (error) return toast.error(error.message);
    setObs((prev) => [...prev, data as Observation]);
  }

  if (loading || !survey) {
    return (
      <AtlasShell>
        <div className="font-mono text-sm text-muted-foreground">Loading survey…</div>
      </AtlasShell>
    );
  }

  return (
    <AtlasShell>
      <button onClick={() => navigate("/atlas")} className="font-mono text-xs text-muted-foreground hover:text-white flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> All surveys
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-heading text-primary text-2xl md:text-3xl">{survey.project_title}</h1>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${statusPill(survey.status)}`}>
                {survey.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {survey.property_address || "No address"} {survey.postcode ? `· ${survey.postcode}` : ""}
              {survey.customer_name ? ` · ${survey.customer_name}` : ""}
              {` · ${survey.project_type}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={togglePause} className="gap-1">
                {survey.status === "paused" ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(`/atlas/${survey.id}/review`)} className="gap-1" style={{ background: "#0D9488", color: "white" }}>
              <ClipboardCheck className="w-3.5 h-3.5" /> Review & complete
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground mb-1">
              <span>Completion</span>
              <span>{survey.completion_percentage}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-teal-400 transition-all" style={{ width: `${survey.completion_percentage}%` }} />
            </div>
          </div>
          {totalCritical > 0 && (
            <div className="flex items-center gap-1 font-mono text-xs text-rose-300 border border-rose-500/30 bg-rose-500/10 rounded-full px-3 py-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {totalCritical} critical outstanding
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Section nav */}
        <nav className="space-y-1 md:sticky md:top-4 self-start">
          <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2">
            {survey.start_route === "outside" ? "Outside first" : "Inside first"}
          </p>
          {sections.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left rounded-lg px-3 py-2 border transition ${
                  active ? "bg-teal-500/10 border-teal-400/40 text-teal-100" : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body text-sm truncate">{s.title}</span>
                  {s.completion_status === "completed" && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {s.critical_outstanding_count > 0 && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 rounded-full px-1.5">{s.critical_outstanding_count}</span>
                  )}
                </div>
                <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-teal-400" style={{ width: `${s.completion_percentage}%` }} />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Observation list */}
        <section className="space-y-3">
          {activeObs.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
              <p className="font-mono text-xs text-muted-foreground">No observations in this section yet.</p>
            </div>
          )}
          {activeObs.map((o) => (
            <ObservationCard key={o.id} obs={o} onChange={refresh} readOnly={readOnly} />
          ))}
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addBlankObservation} className="w-full gap-1">
              <Plus className="w-4 h-4" /> Add observation
            </Button>
          )}
        </section>
      </div>
    </AtlasShell>
  );
}
