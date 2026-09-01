import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JobPhoto from "@/components/JobPhoto";
import {
  AccentCard,
  JobFileEmpty,
  JobFilePanel,
  SectionHeading,
  TonePill,
} from "@/components/project/jobFileUi";
import PhotoDiaryUploader from "@/components/project/PhotoDiaryUploader";
import { formatStageDate, gbp, paymentTone, stagePercent, stageTone } from "@/lib/stageSchedule";

export interface WorkspaceStage {
  id: string;
  stage_name: string;
  stage_order: number;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  payment_amount: number;
  payment_status: string;
  scope_detail?: string | null;
  homeowner_confirmed?: boolean;
  homeowner_confirmed_at?: string | null;
}

export interface WorkspaceUpdate {
  id: string;
  stage_id: string;
  update_text: string;
  photo_urls: string[];
  created_at: string;
}

export interface WorkspaceMessage {
  id: string;
  sender_id: string;
  sender_type: string;
  message_text: string;
  created_at: string;
  stage_id?: string | null;
}

interface Props {
  jobId: string;
  stages: WorkspaceStage[];
  updates: WorkspaceUpdate[];
  messages: WorkspaceMessage[];
  subAssignments?: { id: string; stage_id: string; external_sub_name: string | null; external_sub_phone: string | null }[];
  userRole: "trade" | "homeowner" | null;
  userId: string | null;
  contractValue: number;
  onRefresh: () => void;
  onAssignSub?: (stageId: string) => void;
}

type SubTab = "scope" | "photos" | "messages" | "payment";

const SUB_TABS: { id: SubTab; label: string; icon: typeof ClipboardList }[] = [
  { id: "scope", label: "Scope of works", icon: ClipboardList },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "payment", label: "Payment & sign-off", icon: CreditCard },
];

/**
 * Stage workspace — the project timeline as a working surface. One stage is
 * selected at a time and opens into scope, stage photos, stage-scoped
 * messages and payment / sign-off status. Uses the platform navy job-file kit
 * (JobFilePanel / AccentCard / TonePill) so it matches the dashboards.
 */
const StageWorkspace = ({
  jobId,
  stages,
  updates,
  messages,
  subAssignments = [],
  userRole,
  userId,
  contractValue,
  onRefresh,
  onAssignSub,
}: Props) => {
  const ordered = useMemo(
    () => [...stages].sort((a, b) => a.stage_order - b.stage_order),
    [stages],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<SubTab>("scope");
  const [scopeDraft, setScopeDraft] = useState("");
  const [savingScope, setSavingScope] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [posting, setPosting] = useState(false);
  const [stageMsg, setStageMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const selected =
    ordered.find((s) => s.id === selectedId) ??
    ordered.find((s) => s.status === "active") ??
    ordered[0] ??
    null;

  useEffect(() => {
    if (selected) setScopeDraft(selected.scope_detail ?? "");
  }, [selected?.id, selected?.scope_detail]);

  if (ordered.length === 0) {
    return (
      <JobFilePanel>
        <SectionHeading icon={<CalendarClock className="w-5 h-5 text-teal-400" />} title="Stage timeline" />
        <JobFileEmpty icon={<CalendarClock className="w-8 h-8" />}>
          No stages yet — stages are created from the agreed quote's payment schedule.
        </JobFileEmpty>
      </JobFilePanel>
    );
  }

  const stageUpdates = selected ? updates.filter((u) => u.stage_id === selected.id) : [];
  const stageMessages = selected ? messages.filter((m) => m.stage_id === selected.id) : [];
  const sub = selected ? subAssignments.find((a) => a.stage_id === selected.id) : undefined;

  const saveScope = async () => {
    if (!selected) return;
    setSavingScope(true);
    const { error } = await supabase
      .from("project_stages")
      .update({ scope_detail: scopeDraft.trim() || null })
      .eq("id", selected.id);
    setSavingScope(false);
    if (error) toast.error("Could not save the scope for this stage.");
    else {
      toast.success("Stage scope saved.");
      onRefresh();
    }
  };

  const postUpdate = async () => {
    if (!selected || !userId || updateText.trim().length < 10) return;
    setPosting(true);
    const { error } = await supabase.from("stage_updates").insert({
      stage_id: selected.id,
      trade_id: userId,
      update_text: updateText.trim(),
      photo_urls: [],
    });
    setPosting(false);
    if (error) toast.error("Could not post the update.");
    else {
      setUpdateText("");
      toast.success("Update posted.");
      onRefresh();
    }
  };

  const sendStageMessage = async () => {
    if (!selected || !userId || !userRole || !stageMsg.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("project_messages").insert({
      job_id: jobId,
      sender_id: userId,
      sender_type: userRole,
      message_text: stageMsg.trim(),
      stage_id: selected.id,
    });
    setBusy(false);
    if (error) toast.error("Message failed to send.");
    else {
      setStageMsg("");
      onRefresh();
    }
  };

  const markComplete = async () => {
    if (!selected) return;
    setBusy(true);
    const { error } = await supabase
      .from("project_stages")
      .update({ status: "complete", actual_end: new Date().toISOString().split("T")[0] })
      .eq("id", selected.id);
    setBusy(false);
    if (error) toast.error("Could not mark this stage complete.");
    else {
      toast.success("Stage marked complete — awaiting homeowner confirmation.");
      onRefresh();
    }
  };

  const confirmStage = async () => {
    if (!selected) return;
    setBusy(true);
    const { error } = await supabase
      .from("project_stages")
      .update({ homeowner_confirmed: true, homeowner_confirmed_at: new Date().toISOString() })
      .eq("id", selected.id);
    setBusy(false);
    if (error) toast.error("Could not confirm this stage.");
    else {
      toast.success("Stage confirmed.");
      onRefresh();
    }
  };

  return (
    <JobFilePanel>
      <SectionHeading
        icon={<CalendarClock className="w-5 h-5 text-teal-400" />}
        title="Stage timeline"
        count={ordered.length}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        {/* Stage rail */}
        <div className="space-y-2">
          {ordered.map((s) => {
            const isSel = selected?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left transition-opacity ${isSel ? "" : "opacity-70 hover:opacity-100"}`}
              >
                <AccentCard tone={stageTone(s.status)} className={isSel ? "ring-1 ring-teal-400/40" : ""}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground">Stage {s.stage_order}</p>
                      <p className="font-heading text-base text-foreground leading-tight">{s.stage_name}</p>
                    </div>
                    <TonePill tone={stageTone(s.status)}>{s.status.replace(/_/g, " ")}</TonePill>
                  </div>
                  <div className="flex items-center justify-between mt-2 font-mono text-[11px] text-muted-foreground">
                    <span>{formatStageDate(s.planned_start)}</span>
                    <span className="text-foreground">{gbp(s.payment_amount)}</span>
                  </div>
                </AccentCard>
              </button>
            );
          })}
        </div>

        {/* Stage detail */}
        {selected && (
          <div className="space-y-4">
            <AccentCard tone={stageTone(selected.status)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-heading text-xl text-foreground">{selected.stage_name}</h4>
                  <p className="font-mono text-[11px] text-muted-foreground mt-1">
                    Planned {formatStageDate(selected.planned_start)} – {formatStageDate(selected.planned_end)}
                    {sub && ` · Sub: ${sub.external_sub_name || "Assigned"}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TonePill tone={paymentTone(selected.payment_status)}>
                    {gbp(selected.payment_amount)} · {selected.payment_status}
                  </TonePill>
                  {userRole === "trade" && onAssignSub && (
                    <button
                      type="button"
                      onClick={() => onAssignSub(selected.id)}
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-teal-300"
                    >
                      <Users className="w-3.5 h-3.5" /> Assign sub
                    </button>
                  )}
                </div>
              </div>
            </AccentCard>

            <div className="flex flex-wrap gap-2 bg-card border border-border rounded-2xl p-2">
              {SUB_TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-1.5 font-mono text-xs px-3 py-2 rounded-xl transition-colors ${
                      active
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab === "scope" && (
              <AccentCard tone="sky" className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  What happens in this stage
                </p>
                {userRole === "trade" ? (
                  <>
                    <textarea
                      value={scopeDraft}
                      onChange={(e) => setScopeDraft(e.target.value)}
                      placeholder="Describe the works covered by this stage…"
                      className="w-full h-28 rounded-xl bg-background border border-border p-3 font-mono text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                    />
                    <button
                      type="button"
                      onClick={saveScope}
                      disabled={savingScope}
                      className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl disabled:opacity-50"
                    >
                      {savingScope && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save scope
                    </button>
                  </>
                ) : (
                  <p className="font-mono text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {selected.scope_detail || "The contractor hasn't detailed this stage yet."}
                  </p>
                )}

                <div className="border-t border-border pt-3 space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    Progress updates ({stageUpdates.length})
                  </p>
                  {stageUpdates.length === 0 ? (
                    <p className="font-mono text-xs text-muted-foreground">No updates posted for this stage yet.</p>
                  ) : (
                    stageUpdates.map((u) => (
                      <div key={u.id} className="rounded-xl bg-muted/40 p-3">
                        <p className="font-mono text-xs text-foreground whitespace-pre-line">{u.update_text}</p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-1">
                          {new Date(u.created_at).toLocaleString("en-GB")}
                        </p>
                      </div>
                    ))
                  )}
                  {userRole === "trade" && (
                    <div className="space-y-2">
                      <textarea
                        value={updateText}
                        onChange={(e) => setUpdateText(e.target.value)}
                        placeholder="Post an update on this stage…"
                        className="w-full h-20 rounded-xl bg-background border border-border p-3 font-mono text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                      />
                      <button
                        type="button"
                        onClick={postUpdate}
                        disabled={posting || updateText.trim().length < 10}
                        className="inline-flex items-center gap-2 border border-teal-400/40 text-teal-300 font-mono text-xs px-4 py-2 rounded-xl disabled:opacity-40"
                      >
                        {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Post update
                      </button>
                    </div>
                  )}
                </div>
              </AccentCard>
            )}

            {tab === "photos" && (
              <div className="space-y-3">
                {userRole === "trade" && (
                  <PhotoDiaryUploader
                    jobId={jobId}
                    uploadedBy="trade"
                    onUploaded={onRefresh}
                    title={`Add photos for ${selected.stage_name}`}
                    hint="Photos appear on the project Photos tab, the site diary and the activity feed."
                  />
                )}
                <AccentCard tone="purple">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                    Photos attached to this stage's updates
                  </p>
                  {stageUpdates.flatMap((u) => u.photo_urls || []).length === 0 ? (
                    <p className="font-mono text-xs text-muted-foreground">No stage photos yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {stageUpdates.flatMap((u) => u.photo_urls || []).map((p, i) => (
                        <JobPhoto
                          key={`${p}-${i}`}
                          source={p}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover border border-border"
                        />
                      ))}
                    </div>
                  )}
                </AccentCard>
              </div>
            )}

            {tab === "messages" && (
              <AccentCard tone="indigo" className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Messages about this stage
                </p>
                {stageMessages.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    No stage messages yet — anything posted here stays attached to {selected.stage_name}.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {stageMessages.map((m) => (
                      <div key={m.id} className="rounded-xl bg-muted/40 p-3">
                        <p className="font-mono text-[10px] uppercase text-muted-foreground">{m.sender_type}</p>
                        <p className="font-mono text-xs text-foreground whitespace-pre-line">{m.message_text}</p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-1">
                          {new Date(m.created_at).toLocaleString("en-GB")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {userRole && (
                  <div className="flex gap-2">
                    <input
                      value={stageMsg}
                      onChange={(e) => setStageMsg(e.target.value)}
                      placeholder="Message about this stage…"
                      className="flex-1 rounded-xl bg-background border border-border px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                    />
                    <button
                      type="button"
                      onClick={sendStageMessage}
                      disabled={busy || !stageMsg.trim()}
                      className="bg-secondary text-secondary-foreground font-mono text-xs px-4 rounded-xl disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                )}
              </AccentCard>
            )}

            {tab === "payment" && (
              <AccentCard tone={paymentTone(selected.payment_status)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">Stage payment</p>
                    <p className="font-heading text-2xl text-foreground">{gbp(selected.payment_amount)}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {stagePercent(selected.payment_amount, contractValue)}% of contract value
                    </p>
                  </div>
                  <div className="space-y-1">
                    <TonePill tone={paymentTone(selected.payment_status)}>
                      Payment {selected.payment_status}
                    </TonePill>
                    <div>
                      <TonePill tone={stageTone(selected.status)}>Works {selected.status.replace(/_/g, " ")}</TonePill>
                    </div>
                    {selected.homeowner_confirmed && (
                      <p className="font-mono text-[10px] text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Homeowner confirmed
                      </p>
                    )}
                  </div>
                </div>

                {userRole === "trade" && selected.status === "active" && (
                  <button
                    type="button"
                    onClick={markComplete}
                    disabled={busy}
                    className="w-full border border-teal-400/40 text-teal-300 font-mono text-sm py-2.5 rounded-xl disabled:opacity-40"
                  >
                    Mark stage complete
                  </button>
                )}
                {userRole === "homeowner" &&
                  (selected.status === "complete" || selected.status === "completed") &&
                  !selected.homeowner_confirmed && (
                    <button
                      type="button"
                      onClick={confirmStage}
                      disabled={busy}
                      className="w-full bg-secondary text-secondary-foreground font-mono text-sm py-2.5 rounded-xl disabled:opacity-40"
                    >
                      Confirm stage complete
                    </button>
                  )}
              </AccentCard>
            )}
          </div>
        )}
      </div>
    </JobFilePanel>
  );
};

export default StageWorkspace;
