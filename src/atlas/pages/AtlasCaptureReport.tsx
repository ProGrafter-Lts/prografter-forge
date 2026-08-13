import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Copy, Info, ShieldAlert } from "lucide-react";
import AtlasShell from "../AtlasShell";
import {
  ATLAS_CAPTURE_GROUPS,
  ATLAS_DISCLAIMER,
  ATLAS_SECTION_LABELS,
  applyRoofBranchGuard,
  deriveFlags,
  isFieldActive,
  quoteAssumptionsFromSurvey,
  quoteProvisionalSumsFromSurvey,
} from "../capture/atlas-survey-schema";
import { getFields, getPhotos, type LocalPhoto } from "../capture/offlineDb";
import { toast } from "@/hooks/use-toast";

const render = (v: any): string => {
  const val = v?.value ?? v;
  if (val == null || val === "") return "—";
  if (Array.isArray(val)) {
    return val
      .map((r, i) =>
        typeof r === "object"
          ? `${i + 1}. ${Object.values(r)
              .filter(Boolean)
              .join(" · ")}`
          : String(r),
      )
      .join("\n");
  }
  if (typeof val === "object") return Object.values(val).filter(Boolean).join(" · ");
  return String(val);
};

export default function AtlasCaptureReport() {
  const { id } = useParams<{ id: string }>();
  const surveyId = id!;
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);

  useEffect(() => {
    (async () => {
      const rows = await getFields(surveyId);
      const map: Record<string, any> = {};
      rows.forEach((r) => (map[r.fieldKey] = r.value));
      setValues(map);
      setPhotos(await getPhotos(surveyId));
    })();
  }, [surveyId]);

  const flags = deriveFlags(values);
  const roof = applyRoofBranchGuard(values);
  const assumptions = quoteAssumptionsFromSurvey(values);
  const provisional = quoteProvisionalSumsFromSurvey(values);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, description: "Paste into the quote wizard." });
  };

  return (
    <AtlasShell>
      <button
        onClick={() => navigate(`/atlas/${surveyId}/capture`)}
        className="text-sm text-white/60 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to capture
      </button>

      <h1 className="mt-4 text-2xl font-semibold text-white">Site survey report</h1>
      <p className="mt-1.5 text-sm text-white/55">
        Roof branch resolved as <span className="text-white">{roof.resolvedRoofType}</span>
        {roof.defaulted ? " (defaulted — roof type not yet answered)" : ""}.
      </p>

      {/* Persistent disclaimer, given more prominence than Quote Checker's */}
      <div className="mt-6 rounded-xl border-2 border-amber-400/40 bg-amber-400/10 p-5 flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 text-amber-300 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-100">Important — scope of this survey</p>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-50/90">{ATLAS_DISCLAIMER}</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-white">Flags</h2>
      <div className="mt-3 space-y-2">
        {flags.map((f, i) => {
          const tone =
            f.level === "hard"
              ? "border-rose-400/35 bg-rose-400/10 text-rose-100"
              : f.level === "warning"
                ? "border-orange-400/35 bg-orange-400/10 text-orange-100"
                : "border-sky-400/30 bg-sky-400/10 text-sky-100";
          const Icon = f.level === "guidance" ? Info : AlertTriangle;
          return (
            <div key={i} className={`rounded-xl border p-4 flex items-start gap-3 ${tone}`}>
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  {f.level === "hard" ? "Hard flag · " : f.level === "warning" ? "Warning · " : "Guidance · "}
                  {f.title}
                </p>
                <p className="mt-1 text-sm opacity-90">{f.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-white">Feeds into the quote</h2>
      <div className="mt-3 grid gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white">Assumptions</p>
            <button onClick={() => void copy(assumptions, "Assumptions")} className="text-xs text-teal-200 inline-flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-white/70 font-sans">{assumptions}</pre>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white">Provisional sums clearly flagged</p>
            <button onClick={() => void copy(provisional, "Provisional sums")} className="text-xs text-teal-200 inline-flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-white/70 font-sans">{provisional}</pre>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-white">Captured record</h2>
      <div className="mt-3 space-y-4">
        {ATLAS_CAPTURE_GROUPS.map((g) => (
          <div key={g.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wide text-white/40">{ATLAS_SECTION_LABELS[g.section]}</p>
            <p className="text-sm font-medium text-white mt-0.5">{g.title}</p>
            <dl className="mt-3 space-y-2">
              {g.fields.map((f) => {
                const active = isFieldActive(f, values);
                const n = photos.filter((p) => p.fieldKey === f.key).length;
                return (
                  <div key={f.key} className="grid sm:grid-cols-[1fr_1.4fr] gap-1 sm:gap-3">
                    <dt className="text-xs text-white/50">{f.label}</dt>
                    <dd className={`text-sm whitespace-pre-wrap ${active ? "text-white/85" : "text-white/30 italic"}`}>
                      {active ? render(values[f.key]) : "Not applicable"}
                      {n > 0 && <span className="ml-2 text-xs text-teal-200/80">{n} photo{n > 1 ? "s" : ""}</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </AtlasShell>
  );
}
