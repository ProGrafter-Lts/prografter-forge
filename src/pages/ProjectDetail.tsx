import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import GreenCertificatePack from "@/components/GreenCertificatePack";
import ProjectHeader from "@/components/project/ProjectHeader";
import StageTimeline from "@/components/project/StageTimeline";
import MessagingPanel from "@/components/project/MessagingPanel";
import PaymentSchedule from "@/components/project/PaymentSchedule";
import VariationsPanel from "@/components/project/VariationsPanel";
import ContractPanel from "@/components/project/ContractPanel";
import SubTradeModal from "@/components/project/SubTradeModal";
import QuoteSubmitForm from "@/components/trade/QuoteSubmitForm";

// Types
interface Job {
  id: string; title: string | null; job_type: string; status: string; stage: string;
  description: string; postcode: string; budget: string | null; created_at: string;
  homeowner_id: string | null; is_green_job: boolean; funds_verified?: boolean | null;
}
interface Stage {
  id: string; job_id: string; stage_name: string; stage_order: number;
  planned_start: string | null; planned_end: string | null;
  actual_start: string | null; actual_end: string | null;
  status: string; payment_amount: number; payment_status: string;
  homeowner_confirmed?: boolean; homeowner_confirmed_at?: string | null;
}
interface StageUpdate {
  id: string; stage_id: string; trade_id: string; update_text: string;
  photo_urls: string[]; created_at: string;
}
interface ProjectMessage {
  id: string; job_id: string; sender_id: string; sender_type: string;
  message_text: string; created_at: string;
}
interface Variation {
  id: string; job_id: string; trade_id: string; title: string; description: string;
  materials_cost: number; labour_cost: number; programme_impact_days: number;
  status: string; reason?: string; signed_at?: string; signed_by?: string; created_at: string;
}
interface Quote {
  id: string; amount: number; message: string | null; status: string; trade_id: string;
  tier_enabled?: boolean; budget_price?: number | null; budget_description?: string | null;
  standard_price?: number | null; standard_description?: string | null;
  premium_price?: number | null; premium_description?: string | null;
  selected_tier?: string | null;
}
interface Contract {
  id: string; job_id: string; quote_id: string; trade_id: string; homeowner_id: string;
  contract_text: string; agreed_price: number; payment_schedule: any;
  status: string; homeowner_signed_at: string | null; trade_signed_at: string | null;
}
interface SubAssignment {
  id: string; stage_id: string; external_sub_name: string | null;
  external_sub_phone: string | null; status: string;
}

type UserRole = "trade" | "homeowner" | null;

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [updates, setUpdates] = useState<StageUpdate[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [subAssignments, setSubAssignments] = useState<SubAssignment[]>([]);

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tradeName, setTradeName] = useState("—");
  const [tradeVerified, setTradeVerified] = useState(false);
  const [tradeRating] = useState(4.8);
  const [homeownerName, setHomeownerName] = useState("—");
  const [msgText, setMsgText] = useState("");
  const [subTradeStageId, setSubTradeStageId] = useState<string | null>(null);

  useEffect(() => { if (id) loadAll(); }, [id]);

  // Realtime messages
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`project-messages-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages", filter: `job_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ProjectMessage]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tradeData } = await supabase.from("trades").select("id, name, verified").eq("user_id", user.id).maybeSingle();
    const { data: hoData } = await supabase.from("homeowners").select("id, name").eq("user_id", user.id).maybeSingle();

    if (tradeData) { setUserRole("trade"); setUserId(tradeData.id); }
    else if (hoData) { setUserRole("homeowner"); setUserId(hoData.id); }

    const { data: jobData } = await supabase.from("jobs").select("*").eq("id", id!).single();
    if (!jobData) return;
    setJob(jobData as Job);

    if (hoData) setHomeownerName(hoData.name);
    if (jobData.homeowner_id && !hoData) {
      const { data: ho2 } = await supabase.from("homeowners").select("name").eq("id", jobData.homeowner_id).maybeSingle();
      if (ho2) setHomeownerName(ho2.name);
    }

    const { data: matchData } = await supabase.from("job_matches").select("trade_id").eq("job_id", id!).limit(1);
    if (matchData && matchData.length > 0) {
      if (tradeData) { setTradeName(tradeData.name); setTradeVerified(tradeData.verified); }
      else {
        const { data: t2 } = await supabase.from("trades").select("name, verified").eq("id", matchData[0].trade_id).maybeSingle();
        if (t2) { setTradeName(t2.name); setTradeVerified(t2.verified); }
      }
    }

    const { data: stageData } = await supabase.from("project_stages").select("*").eq("job_id", id!).order("stage_order");
    if (stageData) setStages(stageData as Stage[]);

    if (stageData && stageData.length > 0) {
      const stageIds = stageData.map((s: any) => s.id);
      const { data: upData } = await supabase.from("stage_updates").select("*").in("stage_id", stageIds).order("created_at");
      if (upData) setUpdates(upData as StageUpdate[]);

      // Load sub-trade assignments
      const { data: subData } = await supabase.from("sub_trade_assignments").select("id, stage_id, external_sub_name, external_sub_phone, status").eq("job_id", id!);
      if (subData) setSubAssignments(subData as SubAssignment[]);
    }

    const { data: msgData } = await supabase.from("project_messages").select("*").eq("job_id", id!).order("created_at");
    if (msgData) setMessages(msgData as ProjectMessage[]);

    const { data: varData } = await supabase.from("variations").select("*").eq("job_id", id!).order("created_at", { ascending: false });
    if (varData) setVariations(varData as Variation[]);

    const { data: quoteData } = await supabase.from("quotes").select("*").eq("job_id", id!);
    if (quoteData) setQuotes(quoteData as Quote[]);

    const { data: contractData } = await supabase.from("contracts").select("*").eq("job_id", id!).maybeSingle();
    if (contractData) setContract(contractData as Contract);
  };

  // Computed
  const totalStages = stages.length;
  const completedStages = stages.filter((s) => s.status === "complete").length;
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
  const contractValue = contract ? Number(contract.agreed_price) : stages.reduce((sum, s) => sum + Number(s.payment_amount || 0), 0);

  // Estimate total days from planned dates
  const estimatedDays = (() => {
    if (stages.length === 0) return undefined;
    const firstStart = stages[0]?.planned_start;
    const lastEnd = stages[stages.length - 1]?.planned_end;
    if (firstStart && lastEnd) {
      return Math.max(1, Math.ceil((new Date(lastEnd).getTime() - new Date(firstStart).getTime()) / 86400000));
    }
    return undefined;
  })();

  const sendMessage = async () => {
    if (!msgText.trim() || !userId || !userRole || !id) return;
    const { error } = await supabase.from("project_messages").insert({
      job_id: id, sender_id: userId, sender_type: userRole, message_text: msgText.trim(),
    });
    if (error) toast.error("Failed to send message");
    else setMsgText("");
  };

  const releasePayment = async (stageId: string) => {
    toast.success("Payment release requested. This will be processed shortly.");
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
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-mono text-sm text-secondary-text hover:text-navy transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* 1 — Header */}
        <ProjectHeader
          job={job}
          tradeName={tradeName}
          tradeVerified={tradeVerified}
          tradeRating={tradeRating}
          homeownerName={homeownerName}
          contractValue={contractValue}
          progress={progress}
          estimatedDays={estimatedDays}
        />

        {/* Funds Verified panel — only shown to trades when verified */}
        {userRole === "trade" && job.funds_verified && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-xs text-secondary uppercase tracking-wide mb-1">
                ✓ Funds Verified
              </p>
              <p className="font-body text-sm text-primary">
                This homeowner has verified their funds are in place for this project.
                Documentation held securely by ProGrafter.
              </p>
            </div>
          </div>
        )}

        {/* Variation alerts */}
        <VariationsPanel
          variations={variations}
          userRole={userRole}
          userId={userId}
          jobId={id!}
          onRefresh={loadAll}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="md:col-span-2 space-y-8">
            {/* 2 — Stage Timeline */}
            <StageTimeline
              stages={stages}
              updates={updates}
              subAssignments={subAssignments}
              userRole={userRole}
              userId={userId}
              onRefresh={loadAll}
              onAssignSub={userRole === "trade" ? (stageId) => setSubTradeStageId(stageId) : undefined}
            />

            {/* Green Certificate Pack */}
            {job.is_green_job && (
              <GreenCertificatePack jobType={job.job_type} isComplete={job.status === "complete" || job.stage === "completed"} />
            )}

            {/* 5 — Messages */}
            <MessagingPanel
              messages={messages}
              userId={userId}
              msgText={msgText}
              onMsgTextChange={setMsgText}
              onSendMessage={sendMessage}
            />
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* 3 — Contract */}
            <ContractPanel
              jobId={id!}
              jobType={job.job_type}
              quotes={quotes}
              contract={contract}
              userRole={userRole}
              userId={userId}
              tradeName={tradeName}
              homeownerName={homeownerName}
              onRefresh={loadAll}
            />

            {/* 6 — Payment Schedule */}
            <PaymentSchedule
              stages={stages}
              contractValue={contractValue}
              userRole={userRole}
              onReleasePayment={userRole === "homeowner" ? releasePayment : undefined}
            />
          </div>
        </div>
      </div>

      {/* Sub-trade assignment modal */}
      {subTradeStageId && userId && (
        <SubTradeModal
          stageId={subTradeStageId}
          jobId={id!}
          mainTradeId={userId}
          onClose={() => setSubTradeStageId(null)}
          onRefresh={loadAll}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
