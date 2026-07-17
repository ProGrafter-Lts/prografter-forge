import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Printer, MapPin } from "lucide-react";
import AtlasShell from "../AtlasShell";
import { CLASSIFICATIONS, RESPONSE_STATUSES, CONFIDENCE_LEVELS } from "../sections";
import { statusPill } from "../lib";
import ProgressRing from "../components/ProgressRing";

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

  if (!survey) {
    return (
      <AtlasShell>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-white/[0.06] rounded" />
          <div className="h-32 rounded-2xl bg-white/[0.04]" />
        </div>
      </AtlasShell>
    );
  }

  const bySection: Record<string, any[]> = {};
  obs.forEach((o) => { (bySection[o.section_id] ||= []).push(o); });

  return (
    <AtlasShell>
      <button
        onClick={() => navigate("/atlas")}
        className="font-mono text-xs text-white/60 hover:text-white flex items-center gap-1.5 mb-8 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All surveys
      </button>

      {/* Hero */}
      <section
        className="rounded-3xl border border-white/[0.08] p-6 md:p-8 mb-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(27,58,92,0.55) 0%, rgba(13,148,136,0.15) 100%), rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-300">Survey summary</span>
              <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusPill(survey.status)}`}>
                {survey.status.replace(/_/g, " ")}
              </span>
              {survey.status === "completed" && (
                <span className="font-mono text-[10px] text-emerald-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked · rev {survey.revision_number}
                </span>
              )}
            </div>
            <h1 className="font-heading text-white text-3xl md:text-4xl leading-tight mb-2">{survey.project_title}</h1>
            <div className="flex items-center gap-1.5 text-white/70 font-body text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {survey.property_address || "—"}
                {survey.postcode ? ` · ${survey.postcode}` : ""}
                {survey.customer_name ? ` · ${survey.customer_name}` : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <ProgressRing value={survey.completion_percentage} size={96} stroke={8} sublabel="Complete" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 rounded-full h-9 text-white/80 hover:text-white hover:bg-white/[0.06]"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
          </div>
        </div>
      </section>

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
          <p className="font-body text-[15px] text-white/85 whitespace-pre-wrap leading-relaxed">{survey.customer_intent}</p>
        </Card>
      )}

      {sections.map((sec) => {
        const rows = bySection[sec.id];
        if (!rows || !rows.length) return null;
        return (
          <Card key={sec.id} title={sec.title}>
            <ul className="space-y-4">
              {rows.map((o) => {
                const cls = CLASSIFICATIONS[o.classification] ?? CLASSIFICATIONS.unknown;
                return (
                  <li key={o.id} className="border-l-2 border-white/10 pl-4">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls.tone}`}>{cls.label}</span>
                      <span className="font-mono text-[10px] text-white/45">{CONFIDENCE_LEVELS[o.confidence_level]} · {RESPONSE_STATUSES[o.response_status]}</span>
                    </div>
                    <p className="font-body text-[15px] text-white/95 leading-snug">{o.title}</p>
                    {o.observation_text && <p className="font-body text-sm text-white/65 mt-1 leading-relaxed">{o.observation_text}</p>}
                    {o.measurement_value && <p className="font-mono text-xs text-teal-300 mt-1">{o.measurement_value} {o.measurement_unit}</p>}
                    {o.skip_reason && <p className="font-mono text-xs text-amber-200 mt-1">Skipped — {o.skip_reason}</p>}
                    {o.recommendation && <p className="font-mono text-xs text-teal-300 mt-1">Recommendation — {o.recommendation}</p>}
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
          {survey.final_notes && <p className="font-body text-sm text-white/85 mt-3 leading-relaxed">{survey.final_notes}</p>}
        </Card>
      )}

      {audit.length > 0 && (
        <Card title="Audit history">
          <ul className="space-y-1.5 font-mono text-xs text-white/60">
            {audit.slice(0, 20).map((a) => (
              <li key={a.id}>
                <span className="text-white/40">{new Date(a.created_at).toLocaleString()}</span> — {a.entity_type} · {a.action}
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
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 md:p-7 mb-4">
      <h2 className="font-heading text-white text-xl md:text-2xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2 font-body text-sm border-b border-white/[0.05] last:border-0">
      <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-white/90">{value}</span>
    </div>
  );
}
