import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Image,
  MessageSquare,
  Send,
  AlertTriangle,
  Plus,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

// ---------- types ----------
interface Job {
  id: string;
  title: string | null;
  job_type: string;
  status: string;
  stage: string;
  description: string;
  postcode: string;
  budget: string | null;
  created_at: string;
  homeowner_id: string | null;
}

interface Stage {
  id: string;
  job_id: string;
  stage_name: string;
  stage_order: number;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  payment_amount: number;
  payment_status: string;
}

interface StageUpdate {
  id: string;
  stage_id: string;
  trade_id: string;
  update_text: string;
  photo_urls: string[];
  created_at: string;
}

interface ProjectMessage {
  id: string;
  job_id: string;
  sender_id: string;
  sender_type: string;
  message_text: string;
  created_at: string;
}

interface Variation {
  id: string;
  job_id: string;
  trade_id: string;
  title: string;
  description: string;
  materials_cost: number;
  labour_cost: number;
  programme_impact_days: number;
  status: string;
  created_at: string;
}

type UserRole = "trade" | "homeowner" | null;

// ---------- helpers ----------
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

const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

const STATUS_BADGE: Record<string, string> = {
  open: "bg-teal/10 text-teal",
  matched: "bg-blue-100 text-blue-700",
  active: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
};

// ---------- component ----------
const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [updates, setUpdates] = useState<StageUpdate[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null); // homeowner or trade id
  const [tradeName, setTradeName] = useState("—");
  const [homeownerName, setHomeownerName] = useState("—");

  // form state
  const [updateText, setUpdateText] = useState("");
  const [msgText, setMsgText] = useState("");
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [varForm, setVarForm] = useState({ title: "", description: "", materials_cost: "", labour_cost: "", programme_impact_days: "" });
  const [submitting, setSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // realtime messages
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`project-messages-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages", filter: `job_id=eq.${id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ProjectMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // determine role
    const { data: tradeData } = await supabase.from("trades").select("id, name").eq("user_id", user.id).maybeSingle();
    const { data: hoData } = await supabase.from("homeowners").select("id, name").eq("user_id", user.id).maybeSingle();

    if (tradeData) { setUserRole("trade"); setUserId(tradeData.id); }
    else if (hoData) { setUserRole("homeowner"); setUserId(hoData.id); }

    // job
    const { data: jobData } = await supabase.from("jobs").select("*").eq("id", id!).single();
    if (!jobData) return;
    setJob(jobData as Job);

    // names
    if (hoData) setHomeownerName(hoData.name);
    if (jobData.homeowner_id && !hoData) {
      const { data: ho2 } = await supabase.from("homeowners").select("name").eq("id", jobData.homeowner_id).maybeSingle();
      if (ho2) setHomeownerName(ho2.name);
    }
    // get matched trade
    const { data: matchData } = await supabase.from("job_matches").select("trade_id").eq("job_id", id!).limit(1);
    if (matchData && matchData.length > 0) {
      if (tradeData) setTradeName(tradeData.name);
      else {
        const { data: t2 } = await supabase.from("trades").select("name").eq("id", matchData[0].trade_id).maybeSingle();
        if (t2) setTradeName(t2.name);
      }
    }

    // stages
    const { data: stageData } = await supabase.from("project_stages").select("*").eq("job_id", id!).order("stage_order");
    if (stageData) setStages(stageData as Stage[]);

    // updates
    if (stageData && stageData.length > 0) {
      const stageIds = stageData.map((s: any) => s.id);
      const { data: upData } = await supabase.from("stage_updates").select("*").in("stage_id", stageIds).order("created_at");
      if (upData) setUpdates(upData as StageUpdate[]);
    }

    // messages
    const { data: msgData } = await supabase.from("project_messages").select("*").eq("job_id", id!).order("created_at");
    if (msgData) setMessages(msgData as ProjectMessage[]);

    // variations
    const { data: varData } = await supabase.from("variations").select("*").eq("job_id", id!).order("created_at", { ascending: false });
    if (varData) setVariations(varData as Variation[]);
  };

  // computed
  const totalStages = stages.length;
  const completedStages = stages.filter((s) => s.status === "complete").length;
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
  const contractValue = stages.reduce((sum, s) => sum + Number(s.payment_amount || 0), 0);
  const activeStage = stages.find((s) => s.status === "active");
  const pendingVariations = variations.filter((v) => v.status === "pending");

  // actions
  const submitUpdate = async () => {
    if (!updateText.trim() || !activeStage || !userId) return;
    setSubmitting(true);
    const { error } = await supabase.from("stage_updates").insert({
      stage_id: activeStage.id,
      trade_id: userId,
      update_text: updateText.trim(),
      photo_urls: [],
    });
    if (error) toast.error("Failed to submit update");
    else {
      toast.success("Update submitted");
      setUpdateText("");
      loadAll();
    }
    setSubmitting(false);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !userId || !userRole || !id) return;
    const { error } = await supabase.from("project_messages").insert({
      job_id: id,
      sender_id: userId,
      sender_type: userRole,
      message_text: msgText.trim(),
    });
    if (error) toast.error("Failed to send message");
    else setMsgText("");
  };

  const submitVariation = async () => {
    if (!varForm.title.trim() || !userId || !id) return;
    setSubmitting(true);
    const { error } = await supabase.from("variations").insert({
      job_id: id,
      trade_id: userId,
      title: varForm.title,
      description: varForm.description,
      materials_cost: Number(varForm.materials_cost) || 0,
      labour_cost: Number(varForm.labour_cost) || 0,
      programme_impact_days: Number(varForm.programme_impact_days) || 0,
    });
    if (error) toast.error("Failed to raise variation");
    else {
      toast.success("Variation raised");
      setShowVariationModal(false);
      setVarForm({ title: "", description: "", materials_cost: "", labour_cost: "", programme_impact_days: "" });
      loadAll();
    }
    setSubmitting(false);
  };

  const approveVariation = async (vId: string) => {
    const { error } = await supabase.from("variations").update({ status: "approved" }).eq("id", vId);
    if (error) toast.error("Failed to approve");
    else { toast.success("Variation approved"); loadAll(); }
  };

  const rejectVariation = async (vId: string) => {
    const { error } = await supabase.from("variations").update({ status: "rejected" }).eq("id", vId);
    if (error) toast.error("Failed to reject");
    else { toast.success("Variation rejected"); loadAll(); }
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-mono text-sm text-secondary-text">Loading project…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto p-4 craft:p-8 space-y-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-mono text-sm text-secondary-text hover:text-navy transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* 1 — Project Header */}
        <div className="bg-white rounded-2xl p-6 border border-navy/10 shadow-sm">
          <div className="flex flex-col craft:flex-row craft:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-navy text-3xl craft:text-4xl">
                {job.title || job.job_type}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-xs text-secondary-text">
                <span>Trade: <span className="text-navy font-semibold">{tradeName}</span></span>
                <span>·</span>
                <span>Homeowner: <span className="text-navy font-semibold">{homeownerName}</span></span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Day {daysSince(job.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={STATUS_BADGE[job.status] || "bg-navy/10 text-navy"}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
              {contractValue > 0 && (
                <span className="font-heading text-teal text-2xl">£{contractValue.toLocaleString()}</span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-3 bg-navy/10" />
            <p className="font-mono text-xs text-secondary-text mt-1 text-right">{progress}% complete</p>
          </div>
        </div>

        {/* Variation alerts */}
        {pendingVariations.length > 0 && (
          <div className="space-y-3">
            {pendingVariations.map((v) => (
              <div key={v.id} className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col craft:flex-row items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-heading text-navy text-lg">{v.title}</h3>
                  <p className="font-mono text-xs text-secondary-text mt-1">{v.description}</p>
                  <div className="flex gap-4 mt-2 font-mono text-xs text-secondary-text">
                    <span>Materials: £{Number(v.materials_cost).toLocaleString()}</span>
                    <span>Labour: £{Number(v.labour_cost).toLocaleString()}</span>
                    <span>Impact: {v.programme_impact_days} days</span>
                  </div>
                  {userRole === "homeowner" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => approveVariation(v.id)} className="bg-teal text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-teal-hover transition-colors">
                        Approve
                      </button>
                      <button onClick={() => rejectVariation(v.id)} className="bg-red-500 text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-red-600 transition-colors">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 craft:grid-cols-3 gap-8">
          {/* Left column: timeline + updates */}
          <div className="craft:col-span-2 space-y-8">
            {/* 2 — Stage Timeline */}
            <section>
              <h2 className="font-heading text-navy text-2xl mb-4">Stage Timeline</h2>
              {stages.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-navy/10 text-center">
                  <p className="font-mono text-sm text-secondary-text">No stages set up for this project yet.</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  {/* vertical line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-navy/10" />
                  <div className="space-y-4">
                    {stages.map((stage) => {
                      const stageUpdates = updates.filter((u) => u.stage_id === stage.id);
                      return (
                        <div key={stage.id}>
                          <div className="relative flex items-start gap-4">
                            {/* dot */}
                            <div className="absolute -left-6 top-1">
                              {stage.status === "complete" ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : stage.status === "active" ? (
                                <div className="w-5 h-5 rounded-full border-[3px] border-teal bg-white" />
                              ) : (
                                <Circle className="w-5 h-5 text-navy/20" />
                              )}
                            </div>
                            {/* content */}
                            <div className="flex-1 bg-white rounded-2xl p-4 border border-navy/10 shadow-sm">
                              <div className="flex items-center justify-between">
                                <h3 className="font-heading text-navy text-lg">{stage.stage_name}</h3>
                                <Badge className={
                                  stage.status === "complete" ? "bg-green-100 text-green-700" :
                                  stage.status === "active" ? "bg-teal/10 text-teal" :
                                  "bg-navy/5 text-navy/40"
                                }>
                                  {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="flex gap-4 mt-1 font-mono text-[11px] text-secondary-text">
                                <span>Planned: {formatDate(stage.planned_start)} – {formatDate(stage.planned_end)}</span>
                                {stage.actual_start && <span>Actual: {formatDate(stage.actual_start)} – {formatDate(stage.actual_end)}</span>}
                              </div>

                              {/* stage updates */}
                              {stageUpdates.length > 0 && (
                                <div className="mt-3 space-y-2 border-t border-navy/5 pt-3">
                                  {stageUpdates.map((u) => (
                                    <div key={u.id} className="bg-cream/60 rounded-xl p-3">
                                      <p className="font-mono text-xs text-body-text">{u.update_text}</p>
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
            </section>

            {/* 3 — Submit Update (trade only, active stage) */}
            {userRole === "trade" && activeStage && (
              <section>
                <h2 className="font-heading text-navy text-2xl mb-4">Submit Today's Update</h2>
                <div className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm">
                  <p className="font-mono text-xs text-secondary-text mb-2">
                    Stage: <span className="text-teal font-semibold">{activeStage.stage_name}</span>
                  </p>
                  <textarea
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="Describe today's progress…"
                    className="w-full border border-navy/10 rounded-xl p-3 font-mono text-sm text-body-text placeholder:text-secondary-text/50 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <button className="flex items-center gap-2 font-mono text-xs text-secondary-text hover:text-navy transition-colors">
                      <Upload className="w-4 h-4" /> Add Photos
                    </button>
                    <button
                      onClick={submitUpdate}
                      disabled={submitting || !updateText.trim()}
                      className="bg-teal text-white font-mono text-sm px-5 py-2 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
                    >
                      Submit Update
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 5 — Messages */}
            <section>
              <h2 className="font-heading text-navy text-2xl mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Messages
              </h2>
              <div className="bg-white rounded-2xl border border-navy/10 shadow-sm flex flex-col" style={{ height: "400px" }}>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="font-mono text-sm text-secondary-text text-center mt-16">No messages yet. Start the conversation.</p>
                  )}
                  {messages.map((m) => {
                    const isMine = m.sender_id === userId;
                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-teal text-white" : "bg-cream"}`}>
                          <p className={`font-mono text-xs ${isMine ? "text-white/70" : "text-secondary-text"} mb-0.5`}>
                            {m.sender_type === "trade" ? "Trade" : "Homeowner"}
                          </p>
                          <p className={`font-body text-sm ${isMine ? "text-white" : "text-body-text"}`}>{m.message_text}</p>
                          <p className={`font-mono text-[10px] mt-1 ${isMine ? "text-white/50" : "text-secondary-text"}`}>{timeAgo(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t border-navy/10 p-3 flex gap-2">
                  <input
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type a message…"
                    className="flex-1 border border-navy/10 rounded-xl px-4 py-2 font-mono text-sm text-body-text placeholder:text-secondary-text/50 focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <button onClick={sendMessage} className="bg-teal text-white p-2.5 rounded-xl hover:bg-teal-hover transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right column: payment + variations */}
          <div className="space-y-8">
            {/* 6 — Payment Schedule */}
            <section>
              <h2 className="font-heading text-navy text-2xl mb-4">Payment Schedule</h2>
              {stages.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-navy/10 text-center">
                  <p className="font-mono text-sm text-secondary-text">No payment stages configured.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-navy/10 shadow-sm divide-y divide-navy/5">
                  {stages.map((s) => (
                    <div key={s.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-navy font-semibold">{s.stage_name}</p>
                        <p className="font-mono text-xs text-secondary-text">£{Number(s.payment_amount).toLocaleString()}</p>
                      </div>
                      <Badge className={
                        s.payment_status === "paid" ? "bg-green-100 text-green-700" :
                        s.payment_status === "due" ? "bg-amber-100 text-amber-700" :
                        "bg-navy/5 text-navy/40"
                      }>
                        {s.payment_status.charAt(0).toUpperCase() + s.payment_status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                  <div className="p-4 flex items-center justify-between bg-navy/5">
                    <p className="font-mono text-sm text-navy font-bold">Total</p>
                    <p className="font-heading text-teal text-xl">£{contractValue.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </section>

            {/* 7 — Variations */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-navy text-2xl">Variations</h2>
                {userRole === "trade" && (
                  <button
                    onClick={() => setShowVariationModal(true)}
                    className="flex items-center gap-1 font-mono text-xs text-teal hover:text-teal-hover transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Raise Variation
                  </button>
                )}
              </div>
              {variations.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-navy/10 text-center">
                  <p className="font-mono text-sm text-secondary-text">No variations raised.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variations.map((v) => (
                    <div key={v.id} className="bg-white rounded-2xl p-4 border border-navy/10 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-navy text-base">{v.title}</h3>
                        <Badge className={
                          v.status === "approved" ? "bg-green-100 text-green-700" :
                          v.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }>
                          {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="font-mono text-xs text-secondary-text mt-1 line-clamp-2">{v.description}</p>
                      <div className="flex gap-3 mt-2 font-mono text-[10px] text-secondary-text">
                        <span>£{(Number(v.materials_cost) + Number(v.labour_cost)).toLocaleString()}</span>
                        <span>{v.programme_impact_days}d impact</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Variation Modal */}
      {showVariationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowVariationModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-navy text-2xl mb-4">Raise Variation</h2>
            <div className="space-y-3">
              <input
                value={varForm.title}
                onChange={(e) => setVarForm({ ...varForm, title: e.target.value })}
                placeholder="Variation title"
                className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
              <textarea
                value={varForm.description}
                onChange={(e) => setVarForm({ ...varForm, description: e.target.value })}
                placeholder="Description…"
                className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] text-secondary-text uppercase">Materials (£)</label>
                  <input type="number" value={varForm.materials_cost} onChange={(e) => setVarForm({ ...varForm, materials_cost: e.target.value })}
                    className="w-full border border-navy/10 rounded-xl px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-secondary-text uppercase">Labour (£)</label>
                  <input type="number" value={varForm.labour_cost} onChange={(e) => setVarForm({ ...varForm, labour_cost: e.target.value })}
                    className="w-full border border-navy/10 rounded-xl px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] text-secondary-text uppercase">Programme Impact (days)</label>
                <input type="number" value={varForm.programme_impact_days} onChange={(e) => setVarForm({ ...varForm, programme_impact_days: e.target.value })}
                  className="w-full border border-navy/10 rounded-xl px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowVariationModal(false)} className="flex-1 border border-navy/10 font-mono text-sm py-2.5 rounded-xl hover:bg-navy/5 transition-colors">
                  Cancel
                </button>
                <button onClick={submitVariation} disabled={submitting || !varForm.title.trim()}
                  className="flex-1 bg-teal text-white font-mono text-sm py-2.5 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
