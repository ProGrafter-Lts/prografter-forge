import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Image, Upload, X, Users, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stage {
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
  homeowner_confirmed?: boolean;
  homeowner_confirmed_at?: string | null;
}

interface StageUpdate {
  id: string;
  stage_id: string;
  trade_id: string;
  update_text: string;
  photo_urls: string[];
  created_at: string;
}

interface SubTradeAssignment {
  id: string;
  stage_id: string;
  external_sub_name: string | null;
  external_sub_phone: string | null;
  status: string;
}

interface StageTimelineProps {
  stages: Stage[];
  updates: StageUpdate[];
  subAssignments?: SubTradeAssignment[];
  userRole: "trade" | "homeowner" | null;
  userId: string | null;
  onRefresh: () => void;
  onAssignSub?: (stageId: string) => void;
}

const MIN_UPDATE_CHARS = 30;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const StageTimeline = ({ stages, updates, subAssignments = [], userRole, userId, onRefresh, onAssignSub }: StageTimelineProps) => {
  const [updateText, setUpdateText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [confirmingStage, setConfirmingStage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeStage = stages.find((s) => s.status === "active");

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 6 - photos.length;
    if (files.length > remaining) {
      toast.error(`Maximum 6 photos. You can add ${remaining} more.`);
    }
    setPhotos((prev) => [...prev, ...files.slice(0, remaining)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const submitUpdate = async () => {
    if (!updateText.trim() || updateText.trim().length < MIN_UPDATE_CHARS || !activeStage || !userId) return;
    setSubmitting(true);

    let photoUrls: string[] = [];
    if (photos.length > 0) {
      for (const file of photos) {
        const ext = file.name.split(".").pop();
        const path = `updates/${activeStage.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("job-photos").upload(path, file);
        if (!error) {
          const { data } = supabase.storage.from("job-photos").getPublicUrl(path);
          photoUrls.push(data.publicUrl);
        }
      }
    }

    const { error } = await supabase.from("stage_updates").insert({
      stage_id: activeStage.id,
      trade_id: userId,
      update_text: updateText.trim(),
      photo_urls: photoUrls,
    });

    if (error) toast.error("Failed to submit update");
    else {
      toast.success("Update submitted");
      setUpdateText("");
      setPhotos([]);
      onRefresh();
    }
    setSubmitting(false);
  };

  const markStageComplete = async () => {
    if (!activeStage) return;
    setMarkingComplete(true);
    const { error } = await supabase.from("project_stages").update({
      status: "complete",
      actual_end: new Date().toISOString().split("T")[0],
    }).eq("id", activeStage.id);
    if (error) toast.error("Failed to mark stage complete");
    else {
      toast.success("Stage marked complete — awaiting homeowner confirmation");
      onRefresh();
    }
    setMarkingComplete(false);
  };

  const confirmStageComplete = async (stageId: string) => {
    setConfirmingStage(stageId);
    const { error } = await supabase.from("project_stages").update({
      homeowner_confirmed: true,
      homeowner_confirmed_at: new Date().toISOString(),
    }).eq("id", stageId);
    if (error) toast.error("Failed to confirm stage");
    else {
      toast.success("Stage confirmed — payment unlocked");
      onRefresh();
    }
    setConfirmingStage(null);
  };

  const activeStageHasUpdates = activeStage ? updates.filter((u) => u.stage_id === activeStage.id).length > 0 : false;
  const charCount = updateText.trim().length;
  const isValidLength = charCount >= MIN_UPDATE_CHARS;

  return (
    <section>
      <h2 className="font-heading text-navy text-2xl mb-4">Stage Timeline</h2>
      {stages.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
          <p className="font-mono text-sm text-secondary-text">No stages set up for this project yet.</p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-navy/10" />
          <div className="space-y-4">
            {stages.map((stage) => {
              const stageUpdates = updates.filter((u) => u.stage_id === stage.id);
              const isActive = stage.status === "active";
              const subForStage = subAssignments.find((a) => a.stage_id === stage.id);
              const needsHomeownerConfirm = stage.status === "complete" && !stage.homeowner_confirmed && userRole === "homeowner";

              return (
                <div key={stage.id}>
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-6 top-1">
                      {stage.status === "complete" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full border-[3px] border-teal bg-white animate-pulse" />
                      ) : (
                        <Circle className="w-5 h-5 text-navy/20" />
                      )}
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-4 border border-navy/10 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-navy text-lg">{stage.stage_name}</h3>
                        <div className="flex items-center gap-2">
                          {userRole === "trade" && onAssignSub && (
                            <button
                              onClick={() => onAssignSub(stage.id)}
                              className="flex items-center gap-1 font-mono text-[10px] text-secondary-text hover:text-teal transition-colors"
                            >
                              <Users className="w-3.5 h-3.5" /> Assign Sub
                            </button>
                          )}
                          <Badge className={
                            stage.status === "complete" ? "bg-green-100 text-green-700" :
                            isActive ? "bg-teal/10 text-teal" :
                            "bg-navy/5 text-navy/40"
                          }>
                            {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1 font-mono text-[11px] text-secondary-text">
                        <span>Planned: {formatDate(stage.planned_start)} – {formatDate(stage.planned_end)}</span>
                        {stage.actual_start && <span>Actual: {formatDate(stage.actual_start)} – {formatDate(stage.actual_end)}</span>}
                      </div>

                      {/* Sub-trade name display */}
                      {subForStage && (
                        <div className="mt-1 font-mono text-[11px] text-teal">
                          Sub: {subForStage.external_sub_name || "Assigned"} {subForStage.external_sub_phone && `· ${subForStage.external_sub_phone}`}
                        </div>
                      )}

                      {/* Homeowner sign-off card */}
                      {needsHomeownerConfirm && (
                        <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-mono text-xs text-amber-800 font-semibold">
                                Trade has marked "{stage.stage_name}" as complete — please review and confirm
                              </p>
                              {stageUpdates.length > 0 && stageUpdates[stageUpdates.length - 1]?.photo_urls?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {stageUpdates[stageUpdates.length - 1].photo_urls.slice(0, 4).map((url, i) => (
                                    <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover border border-navy/10" />
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => confirmStageComplete(stage.id)}
                                disabled={confirmingStage === stage.id}
                                className="mt-2 bg-teal text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
                              >
                                {confirmingStage === stage.id ? "Confirming…" : "Confirm Complete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Homeowner confirmed badge */}
                      {stage.homeowner_confirmed && stage.homeowner_confirmed_at && (
                        <div className="mt-2 font-mono text-[10px] text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Homeowner confirmed {new Date(stage.homeowner_confirmed_at).toLocaleDateString("en-GB")}
                        </div>
                      )}

                      {/* Submit update form for trade on active stage */}
                      {userRole === "trade" && isActive && (
                        <div className="mt-3 border-t border-navy/5 pt-3">
                          <p className="font-mono text-[10px] text-teal font-semibold uppercase mb-2">Submit Today's Update</p>
                          <textarea
                            value={updateText}
                            onChange={(e) => setUpdateText(e.target.value)}
                            placeholder="Describe today's progress (minimum 30 characters)…"
                            className="w-full border border-navy/10 rounded-xl p-3 font-mono text-sm text-body-text placeholder:text-secondary-text/50 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-teal/30"
                          />
                          <div className="flex items-center justify-between mt-1">
                            <span className={`font-mono text-[10px] ${isValidLength ? "text-green-600" : "text-secondary-text"}`}>
                              {charCount}/{MIN_UPDATE_CHARS} min characters
                            </span>
                          </div>
                          {photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {photos.map((f, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-navy/10">
                                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                                  <button onClick={() => removePhoto(i)} className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div>
                              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                              <button onClick={() => fileInputRef.current?.click()} disabled={photos.length >= 6}
                                className="flex items-center gap-1 font-mono text-xs text-secondary-text hover:text-navy transition-colors disabled:opacity-40">
                                <Upload className="w-4 h-4" /> Add Photos ({photos.length}/6)
                              </button>
                            </div>
                            <button onClick={submitUpdate} disabled={submitting || !isValidLength}
                              className="bg-teal text-white font-mono text-sm px-4 py-2 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
                              Submit Update
                            </button>
                          </div>

                          {/* Mark Stage Complete — only if updates exist */}
                          {activeStageHasUpdates && (
                            <button
                              onClick={markStageComplete}
                              disabled={markingComplete}
                              className="mt-3 w-full border-2 border-teal text-teal font-mono text-sm py-2.5 rounded-xl hover:bg-teal hover:text-white transition-colors disabled:opacity-50"
                            >
                              {markingComplete ? "Marking…" : "Mark Stage Complete"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Stage updates */}
                      {stageUpdates.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-navy/5 pt-3">
                          {stageUpdates.map((u) => (
                            <div key={u.id} className="bg-cream/60 rounded-xl p-3">
                              <p className="font-mono text-xs text-body-text">{u.update_text}</p>
                              {u.photo_urls?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {u.photo_urls.map((url, i) => (
                                    <button key={i} onClick={() => setExpandedPhoto(url)}
                                      className="w-14 h-14 rounded-lg overflow-hidden border border-navy/10 hover:ring-2 hover:ring-teal/30 transition-all">
                                      <img src={url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <span className="font-mono text-[10px] text-secondary-text">{timeAgo(u.created_at)}</span>
                                {u.photo_urls?.length > 0 && (
                                  <span className="flex items-center gap-1 font-mono text-[10px] text-secondary-text">
                                    <Image className="w-3 h-3" /> {u.photo_urls.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full-size photo modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setExpandedPhoto(null)}>
          <img src={expandedPhoto} alt="" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </section>
  );
};

export default StageTimeline;
