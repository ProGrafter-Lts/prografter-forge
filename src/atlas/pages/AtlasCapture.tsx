import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, CloudOff, RefreshCw, ShieldAlert, Cloud } from "lucide-react";
import AtlasShell from "../AtlasShell";
import FieldRenderer from "../capture/FieldRenderer";
import {
  ATLAS_CAPTURE_GROUPS,
  ATLAS_DISCLAIMER,
  ATLAS_SECTION_LABELS,
  applyRoofBranchGuard,
  isFieldActive,
  isFieldAnswered,
  isFieldRequired,
} from "../capture/atlas-survey-schema";
import { getFields, putField } from "../capture/offlineDb";
import { hydrateFromServer, startSyncLoop, subscribeSync, syncNow, type SyncState } from "../capture/sync";

export default function AtlasCapture() {
  const { id } = useParams<{ id: string }>();
  const surveyId = id!;
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, any>>({});
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      await hydrateFromServer(surveyId).catch(() => {});
      const rows = await getFields(surveyId);
      if (!alive) return;
      const map: Record<string, any> = {};
      rows.forEach((r) => (map[r.fieldKey] = r.value));
      setValues(map);
      setReady(true);
    })();
    const off = subscribeSync(setSync);
    const stop = startSyncLoop(surveyId);
    return () => {
      alive = false;
      off();
      stop();
    };
  }, [surveyId]);

  const groups = ATLAS_CAPTURE_GROUPS;
  const group = groups[Math.min(step, groups.length - 1)];
  const isReview = step >= groups.length;

  const update = (key: string, next: any) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    void putField(surveyId, key, next); // local first — never awaits the network
  };

  const activeFields = useMemo(
    () => (group ? group.fields.filter((f) => isFieldActive(f, values)) : []),
    [group, values],
  );
  const naFields = useMemo(
    () => (group ? group.fields.filter((f) => !isFieldActive(f, values)) : []),
    [group, values],
  );

  const outstanding = activeFields.filter((f) => isFieldRequired(f, values) && !isFieldAnswered(f, values));
  const roof = applyRoofBranchGuard(values);

  const progress = useMemo(() => {
    const all = groups.flatMap((g) => g.fields).filter((f) => isFieldActive(f, values));
    const done = all.filter((f) => isFieldAnswered(f, values)).length;
    return Math.round((done / Math.max(all.length, 1)) * 100);
  }, [groups, values]);

  if (!ready) {
    return (
      <AtlasShell>
        <p className="text-white/60 text-sm">Loading survey…</p>
      </AtlasShell>
    );
  }

  return (
    <AtlasShell>
      {/* Sync status — offline is a normal state, not an error */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <button onClick={() => navigate(`/atlas/${surveyId}`)} className="text-sm text-white/60 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Survey
        </button>
        <div className="flex items-center gap-2 text-xs">
          {sync?.online ? (
            <span className="inline-flex items-center gap-1.5 text-teal-200">
              <Cloud className="w-3.5 h-3.5" /> Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-200">
              <CloudOff className="w-3.5 h-3.5" /> Offline — saved on device
            </span>
          )}
          {!!(sync && (sync.pendingFields || sync.pendingPhotos)) && (
            <span className="text-white/50">
              {sync.pendingFields} fields · {sync.pendingPhotos} photos queued
            </span>
          )}
          <button
            onClick={() => void syncNow(surveyId)}
            className="inline-flex items-center gap-1 text-white/60 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sync?.syncing ? "animate-spin" : ""}`} /> Sync
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-white/50 mb-2">
          <span>
            {isReview ? "Review" : ATLAS_SECTION_LABELS[group.section]} · Step {Math.min(step + 1, groups.length + 1)} of{" "}
            {groups.length + 1}
          </span>
          <span>{progress}% captured</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-teal-400/70" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {!isReview ? (
        <>
          <h1 className="text-2xl font-semibold text-white">{group.title}</h1>
          {group.blurb && <p className="mt-1.5 text-sm text-white/55">{group.blurb}</p>}

          <div className="mt-6 space-y-4">
            {activeFields.map((f) => (
              <FieldRenderer
                key={f.key}
                surveyId={surveyId}
                field={f}
                value={values[f.key]}
                onChange={(next) => update(f.key, next)}
              />
            ))}

            {naFields.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
                <p className="text-xs text-white/40">
                  Not applicable for a {roof.resolvedRoofType.toLowerCase()} roof
                  {roof.defaulted ? " (defaulted to pitched until roof type is answered)" : ""}:
                </p>
                <ul className="mt-2 space-y-1">
                  {naFields.map((f) => (
                    <li key={f.key} className="text-xs text-white/35">
                      {f.label} — not applicable
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        <ReviewStep surveyId={surveyId} values={values} onJump={setStep} />
      )}

      <div className="mt-8 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-amber-100">{ATLAS_DISCLAIMER}</p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="px-4 py-2.5 rounded-lg border border-white/10 text-sm text-white/70 disabled:opacity-30"
        >
          Back
        </button>
        {!isReview ? (
          <div className="flex items-center gap-3">
            {outstanding.length > 0 && (
              <span className="text-xs text-amber-300/80">{outstanding.length} required outstanding</span>
            )}
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2.5 rounded-lg bg-teal-400/90 text-[#06202b] font-medium text-sm inline-flex items-center gap-1.5"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/atlas/${surveyId}/capture-report`)}
            className="px-5 py-2.5 rounded-lg bg-teal-400/90 text-[#06202b] font-medium text-sm inline-flex items-center gap-1.5"
          >
            View survey report <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </AtlasShell>
  );
}

function ReviewStep({
  surveyId,
  values,
  onJump,
}: {
  surveyId: string;
  values: Record<string, any>;
  onJump: (n: number) => void;
}) {
  void surveyId;
  return (
    <>
      <h1 className="text-2xl font-semibold text-white">Review</h1>
      <p className="mt-1.5 text-sm text-white/55">Outstanding required fields by group.</p>
      <div className="mt-6 space-y-3">
        {ATLAS_CAPTURE_GROUPS.map((g, i) => {
          const active = g.fields.filter((f) => isFieldActive(f, values));
          const missing = active.filter((f) => isFieldRequired(f, values) && !isFieldAnswered(f, values));
          return (
            <button
              key={g.key}
              onClick={() => onJump(i)}
              className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-white">{g.title}</p>
                <p className="text-xs text-white/45">{ATLAS_SECTION_LABELS[g.section]}</p>
              </div>
              {missing.length === 0 ? (
                <span className="text-xs text-teal-200 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Complete
                </span>
              ) : (
                <span className="text-xs text-amber-300">{missing.length} outstanding</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
