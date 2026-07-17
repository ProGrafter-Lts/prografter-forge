import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Printer } from "lucide-react";
import AtlasShell from "../AtlasShell";
import { CLASSIFICATIONS, RESPONSE_STATUSES, CONFIDENCE_LEVELS } from "../sections";
import { statusPill } from "../lib";

export default function AtlasSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [obs, setObs] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [s, sec, o, a] = await Promise.all([
        (supabase as any).from("atlas_surveys").select("*").eq("id", id).single(),
        (supabase as any).from("atlas_sections").select("*").eq("survey_id", id).order("sequence"),
        (supabase as any).from("atlas_observations").select("*").eq("survey_id", id).order("created_at"),
        (supabase as any).from("atlas_audit_events").select("*").eq("survey_id", id).order("created_at", { ascending: false }),
      ]);
      setSurvey(s.data);
      setSections(sec.data || []);
      setObs(o.data || []);
      setAudit(a.data || []);
    })();
  }, [id]);

  if (!survey) return <AtlasShell><div className="font-mono text-sm text-muted-foreground">Loading summary…</div></AtlasShell>;

  const bySection: Record<string, any[]> = {};
  obs.forEach((o) => { (bySection[o.section_id] ||= []).push(o); });

  return (
    <AtlasShell>
      <button onClick={() => navigate("/atlas")} className="font-mono text-xs text-muted-foreground hover:text-white flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> All surveys
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading text-primary text-3xl">Atlas survey summary</h1>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${statusPill(survey.status)}`}>{survey.status.replace(/_/g, " ")}</span>
            {survey.status === "completed" && <span className="font-mono text-xs text-emerald-300 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked · rev {survey.revision_number}</span>}
          </div>
          <p className="font-body text-sm text-muted-foreground">{survey.project_title}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1">
          <Printer className="w-3.5 h-3.5" /> Print
        </Button>
      </div>

      <Card title="Project details">
        <Kv label="Project" value={`${survey.project_title} (${survey.project_type})`} />
        <Kv label="Property" value={`${survey.property_address || "—"} ${survey.postcode || ""}`} />
        <Kv label="Customer" value={`${survey.customer_name || "—"} · ${survey.customer_email || ""} · ${survey.customer_phone || ""}`} />
        <Kv label="Start route" value={survey.start_route} />
        <Kv label="Weather" value={survey.weather_conditions || "—"} />
        <Kv label="Trades" value={survey.relevant_trades?.join(", ") || "—"} />
      </Card>

      {survey.customer_intent && (
        <Card title="Customer intent">
          <p className="font-body text-sm text-white/85 whitespace-pre-wrap">{survey.customer_intent}</p>
        </Card>
      )}

      {sections.map((sec) => {
        const rows = bySection[sec.id];
        if (!rows || !rows.length) return null;
        return (
          <Card key={sec.id} title={sec.title}>
            <ul className="space-y-3">
              {rows.map((o) => {
                const cls = CLASSIFICATIONS[o.classification] ?? CLASSIFICATIONS.unknown;
                return (
                  <li key={o.id} className="border-l-2 border-white/10 pl-3">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${cls.tone}`}>{cls.label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{CONFIDENCE_LEVELS[o.confidence_level]}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">· {RESPONSE_STATUSES[o.response_status]}</span>
                    </div>
                    <p className="font-body text-sm text-white/90">{o.title}</p>
                    {o.observation_text && <p className="font-body text-sm text-white/70 mt-0.5">{o.observation_text}</p>}
                    {o.measurement_value && <p className="font-mono text-xs text-teal-300 mt-0.5">Measurement: {o.measurement_value} {o.measurement_unit}</p>}
                    {o.skip_reason && <p className="font-mono text-xs text-amber-300 mt-0.5">Skipped — {o.skip_reason}</p>}
                    {o.recommendation && <p className="font-mono text-xs text-teal-300 mt-0.5">Recommendation — {o.recommendation}</p>}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      {survey.status === "completed" && (
        <Card title="Sign-off">
          <Kv label="Surveyor" value={survey.surveyor_name || "—"} />
          <Kv label="Company" value={survey.surveyor_company || "—"} />
          <Kv label="Completed" value={new Date(survey.completed_at).toLocaleString()} />
          {survey.final_notes && <p className="font-body text-sm text-white/85 mt-2">{survey.final_notes}</p>}
        </Card>
      )}

      {audit.length > 0 && (
        <Card title="Audit history">
          <ul className="space-y-1 font-mono text-xs text-muted-foreground">
            {audit.slice(0, 20).map((a) => (
              <li key={a.id}>
                {new Date(a.created_at).toLocaleString()} — {a.entity_type} · {a.action}
                {a.reason ? ` (${a.reason})` : ""}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AtlasShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-4">
      <h2 className="font-heading text-primary text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-1 font-body text-sm">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <span className="text-white/85">{value}</span>
    </div>
  );
}
