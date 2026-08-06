import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck, LayoutDashboard, ClipboardList, CalendarClock, CreditCard, FolderArchive, Image as ImageIcon, MessageSquare } from "lucide-react";
import ControlCentreTabs, { type ControlCentreTab } from "@/components/project/ControlCentreTabs";
import EmptyModule from "@/components/project/EmptyModule";
import { toast } from "sonner";
import GreenCertificatePack from "@/components/GreenCertificatePack";
import ProjectHeader from "@/components/project/ProjectHeader";
import StageTimeline from "@/components/project/StageTimeline";
import MessagingPanel from "@/components/project/MessagingPanel";
import PaymentSchedule from "@/components/project/PaymentSchedule";
import VariationsPanel from "@/components/project/VariationsPanel";
import ContractPanel from "@/components/project/ContractPanel";
import SubTradeModal from "@/components/project/SubTradeModal";
import QuoteSubmitForm, { type QuickBuildPrefill } from "@/components/trade/QuoteSubmitForm";
import GenerateQuotePdfButton from "@/components/trade/GenerateQuotePdfButton";
import { isFeatureEnabled } from "@/lib/featureFlags";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const qbDraftId = searchParams.get("qbDraft");
  const [qbPrefill, setQbPrefill] = useState<QuickBuildPrefill | null>(null);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [updates, setUpdates] = useState<StageUpdate[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [subAssignments, setSubAssignments] = useState<SubAssignment[]>([]);
  const [viewerContextReady, setViewerContextReady] = useState(false);
  const [hoTab, setHoTab] = useState("overview");

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tradeName, setTradeName] = useState("—");
  const [tradeVerified, setTradeVerified] = useState(false);
  const [tradeRating] = useState(4.8);
  const [homeownerName, setHomeownerName] = useState("—");
  const [msgText, setMsgText] = useState("");
  const [subTradeStageId, setSubTradeStageId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setProjectError(null);
    setLoading(true);
    setJob(null);
    setStages([]);
    setUpdates([]);
    setMessages([]);
    setVariations([]);
    setQuotes([]);
    setContract(null);
    setSubAssignments([]);

    let isMounted = true;

    const handleSession = (nextUserId: string | null) => {
      if (!isMounted) return;

      setAuthUserId(nextUserId);

      if (!nextUserId) {
        setViewerContextReady(false);
        setLoading(false);
        setProjectError("We couldn't verify access to this project.");
        return;
      }

      setViewerContextReady(true);
      void Promise.all([loadViewerContext(nextUserId), loadProjectData()]);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session?.user?.id ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [id]);

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

  // Pull a QuickBuild draft into the quote form when ?qbDraft=<id> is present
  useEffect(() => {
    if (!qbDraftId) {
      setQbPrefill(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("quickbuild_generations")
        .select("id, final_output, ai_output")
        .eq("id", qbDraftId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast.error("Couldn't load that QuickBuild draft.");
        return;
      }
      const out = (data.final_output ?? data.ai_output) as {
        line_items: Array<{ description: string; quantity: number; unit: string; estimated_unit_price: number }>;
        methodology: string;
        timeline_days: number;
        variation_buffer_recommended_pence: number;
      } | null;
      if (!out) return;
      const lineTotal = out.line_items.reduce(
        (s, li) => s + (Number(li.quantity) || 0) * (Number(li.estimated_unit_price) || 0),
        0,
      );
      const buffer = (out.variation_buffer_recommended_pence || 0) / 100;
      const total = lineTotal + buffer;
      const lines = out.line_items
        .map((li) => `• ${li.description} (${li.quantity} ${li.unit} @ £${Number(li.estimated_unit_price).toFixed(2)})`)
        .join("\n");
      const message = [
        out.methodology?.trim() || "",
        "",
        "SCHEDULE OF WORKS",
        lines,
        "",
        `Timeline: ${out.timeline_days} working days`,
        buffer > 0 ? `Variation buffer included: £${buffer.toFixed(2)}` : "",
        "",
        "— Drafted with QuickBuild AI; reviewed and confirmed by the trade.",
      ]
        .filter(Boolean)
        .join("\n");
      setQbPrefill({
        generationId: data.id,
        amount: total > 0 ? Math.round(total).toString() : "",
        message,
        workingDays: out.timeline_days ?? null,
        methodology: out.methodology ?? null,
      });
      toast.success("QuickBuild draft loaded — review and submit.");
    })();
    return () => { cancelled = true; };
  }, [qbDraftId]);


  const loadProjectData = async () => {
    setProjectError(null);
    setLoading(true);
    const { data: jobData, error: jobError } = await supabase.from("jobs").select("*").eq("id", id!).maybeSingle();
    if (jobError || !jobData) {
      console.error("Failed to load project", jobError);
      setProjectError("We couldn't load this project yet.");
      setLoading(false);
      return;
    }
    setJob(jobData as Job);
    setLoading(false);

    if (jobData.homeowner_id) {
      const { data: ho2 } = await supabase.from("homeowners").select("name").eq("id", jobData.homeowner_id).maybeSingle();
      if (ho2) setHomeownerName(ho2.name);
    }

    // Fetch the matched trade via SECURITY DEFINER RPC so demo/test trades
    // (filtered out of the public directory view) are still visible to the
    // homeowner and to the matched trade themselves on the project page.
    const { data: tradeRows } = await supabase.rpc("get_trade_for_job", { _job_id: id! });
    const t2 = Array.isArray(tradeRows) && tradeRows.length > 0 ? tradeRows[0] : null;
    if (t2) {
      setTradeName(t2.company_name || t2.name);
      setTradeVerified(!!t2.verified);
    }

    const [stageRes, msgRes, varRes, quoteRes, contractRes] = await Promise.allSettled([
      supabase.from("project_stages").select("*").eq("job_id", id!).order("stage_order"),
      supabase.from("project_messages").select("*").eq("job_id", id!).order("created_at"),
      supabase.from("variations").select("*").eq("job_id", id!).order("created_at", { ascending: false }),
      supabase.from("quotes").select("*").eq("job_id", id!),
      supabase.from("contracts_compat").select("*").eq("job_id", id!).maybeSingle(),
    ]);

    const stageData = stageRes.status === "fulfilled" ? stageRes.value.data : null;
    if (stageData) setStages(stageData as Stage[]);

    if (stageData && stageData.length > 0) {
      const stageIds = stageData.map((s: any) => s.id);
      const { data: upData } = await supabase.from("stage_updates").select("*").in("stage_id", stageIds).order("created_at");
      if (upData) setUpdates(upData as StageUpdate[]);

      // Load sub-trade assignments
      const { data: subData } = await supabase.from("sub_trade_assignments").select("id, stage_id, external_sub_name, external_sub_phone, status").eq("job_id", id!);
      if (subData) setSubAssignments(subData as SubAssignment[]);
    }

    const msgData = msgRes.status === "fulfilled" ? msgRes.value.data : null;
    if (msgData) setMessages(msgData as ProjectMessage[]);

    const varData = varRes.status === "fulfilled" ? varRes.value.data : null;
    if (varData) setVariations(varData as Variation[]);

    const quoteData = quoteRes.status === "fulfilled" ? quoteRes.value.data : null;
    if (quoteData) setQuotes(quoteData as Quote[]);

    const contractData = contractRes.status === "fulfilled" ? contractRes.value.data : null;
    if (contractData) setContract(contractData as unknown as Contract);
  };

  const loadViewerContext = async (nextAuthUserId: string) => {
    setUserRole(null);
    setUserId(null);
    const { data: tradeData } = await supabase.from("trades").select("id, name, verified").eq("user_id", nextAuthUserId).maybeSingle();
    const { data: hoData } = await supabase.from("homeowners").select("id, name").eq("user_id", nextAuthUserId).maybeSingle();

    if (tradeData) {
      setUserRole("trade");
      setUserId(tradeData.id);
      setTradeName(tradeData.name);
      setTradeVerified(tradeData.verified);
      return;
    }

    if (hoData) {
      setUserRole("homeowner");
      setUserId(hoData.id);
      setHomeownerName(hoData.name);
    }
  };

  // Computed
  const totalStages = stages.length;
  const completedStages = stages.filter(
    (s) => s.status === "completed" || s.status === "complete",
  ).length;
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
  const contractValue = contract ? Number(contract.agreed_price) : stages.reduce((sum, s) => sum + Number(s.payment_amount || 0), 0);

  // Project schedule — earliest planned_start, latest planned_end across all stages.
  const projectStart = (() => {
    const dates = stages.map((s) => s.planned_start).filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.reduce((a, b) => (a < b ? a : b));
  })();
  const projectEnd = (() => {
    const dates = stages.map((s) => s.planned_end).filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.reduce((a, b) => (a > b ? a : b));
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
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) {
      toast.error("Stage not found");
      return;
    }
    // 1) Flip stage to paid
    const { error: updateErr } = await supabase
      .from("project_stages")
      .update({ payment_status: "paid" })
      .eq("id", stageId);
    if (updateErr) {
      toast.error("Failed to release payment");
      return;
    }
    toast.success("Payment released");
    void loadProjectData();

    // 2) Notify both parties (non-blocking)
    try {
      const tradeId = quotes.find((q) => q.status === "accepted")?.trade_id;
      const [ownerRowRes, tradeRowRes] = await Promise.all([
        job?.homeowner_id
          ? supabase.from("homeowners").select("email, name").eq("id", job.homeowner_id).maybeSingle()
          : Promise.resolve({ data: null }),
        tradeId
          ? supabase.from("trades").select("id, name, company_name, user_id").eq("id", tradeId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const owner = (ownerRowRes as any)?.data;
      const trade = (tradeRowRes as any)?.data;
      const projectTitle = job?.title || job?.job_type || "your project";
      const amount = `£${Number(stage.payment_amount || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
      const stageName = stage.stage_name || "a project stage";
      const reference = (job as any)?.ref || "";

      // Homeowner email
      if (owner?.email) {
        const firstName = owner.name?.split(" ")[0];
        void supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "payment-released-homeowner",
            recipientEmail: owner.email,
            idempotencyKey: `payment-released-homeowner-${stageId}`,
            templateData: {
              firstName,
              amount,
              stageName,
              projectTitle,
              tradeName: trade?.company_name || trade?.name,
              reference,
            },
          },
        });
      }
      // Trade email — look up auth email via user_id
      if (trade?.user_id) {
        const { data: tradeProfile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", trade.user_id)
          .maybeSingle();
        if (tradeProfile?.email) {
          const firstName = tradeProfile.full_name?.split(" ")[0];
          void supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "payment-released-trade",
              recipientEmail: tradeProfile.email,
              idempotencyKey: `payment-released-trade-${stageId}`,
              templateData: {
                firstName,
                amount,
                stageName,
                projectTitle,
                reference,
              },
            },
          });
        }
      }
    } catch (e) {
      console.warn("payment-released email dispatch failed (non-blocking)", e);
    }
  };

  const refreshProject = () => {
    void loadProjectData();
    if (authUserId) {
      void loadViewerContext(authUserId);
    }
  };

  if (loading || !viewerContextReady) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-mono text-sm text-secondary-text">Loading project…</p>
      </div>
    );
  }

  if (!job || projectError) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-primary/10 shadow-sm p-8 text-center">
          <h1 className="font-heading text-primary text-xl mb-2">This job isn't available</h1>
          <p className="font-mono text-sm text-secondary-text">
            {projectError ||
              "This job may have been closed, or you're not matched to it. If you reached this from an email, the listing may no longer be open."}
          </p>
          <button
            onClick={() => navigate("/dashboard/trade")}
            className="mt-6 inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Go to your dashboard
          </button>
        </div>
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
          startDate={projectStart}
          endDate={projectEnd}
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
          onRefresh={refreshProject}
        />

        {userRole === "homeowner" ? (
          (() => {
            const tabs: ControlCentreTab[] = [
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "quotes", label: "Quotes", icon: ClipboardList },
              { id: "timeline", label: "Timeline", icon: CalendarClock },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "documents", label: "Documents", icon: FolderArchive },
              { id: "photos", label: "Photos", icon: ImageIcon },
              { id: "messages", label: "Messages", icon: MessageSquare },
            ];
            return (
              <div className="space-y-6">
                <ControlCentreTabs tabs={tabs} active={hoTab} onChange={setHoTab} />

                {hoTab === "overview" && (
                  <div className="space-y-6">
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                      <h3 className="font-heading text-primary text-lg mb-2">Project summary</h3>
                      <p className="font-mono text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {job.description || "No description provided."}
                      </p>
                    </div>
                    {job.is_green_job && (
                      <GreenCertificatePack jobType={job.job_type} isComplete={job.status === "complete" || job.stage === "completed"} />
                    )}
                  </div>
                )}

                {hoTab === "quotes" && (
                  <ContractPanel
                    jobId={id!}
                    jobType={job.job_type}
                    quotes={quotes}
                    contract={contract}
                    userRole={userRole}
                    userId={userId}
                    tradeName={tradeName}
                    homeownerName={homeownerName}
                    onRefresh={refreshProject}
                  />
                )}

                {hoTab === "timeline" && (
                  stages.length > 0 ? (
                    <StageTimeline
                      stages={stages}
                      updates={updates}
                      subAssignments={subAssignments}
                      userRole={userRole}
                      userId={userId}
                      onRefresh={refreshProject}
                    />
                  ) : (
                    <EmptyModule
                      icon={CalendarClock}
                      title="Timeline"
                      message="Major project events, inspections and milestones will appear here."
                      hint="No project updates have been posted yet."
                    />
                  )
                )}

                {hoTab === "payments" && (
                  stages.length > 0 ? (
                    <PaymentSchedule
                      stages={stages}
                      contractValue={contractValue}
                      userRole={userRole}
                      onReleasePayment={releasePayment}
                    />
                  ) : (
                    <EmptyModule
                      icon={CreditCard}
                      title="Payments"
                      message="Agreed payment stages and completed payments will appear here."
                      hint="No payment stages have been agreed yet."
                    />
                  )
                )}

                {hoTab === "documents" && (
                  <EmptyModule
                    icon={FolderArchive}
                    title="Documents"
                    message="This is where quotes, contracts, certificates, drawings and warranties will be stored."
                    hint="No project documents uploaded yet."
                  />
                )}

                {hoTab === "photos" && (
                  <EmptyModule
                    icon={ImageIcon}
                    title="Photos"
                    message="Progress photographs uploaded by you or your tradesperson will appear here."
                    hint="No progress photos yet."
                  />
                )}

                {hoTab === "messages" && (
                  <MessagingPanel
                    messages={messages}
                    userId={userId}
                    msgText={msgText}
                    onMsgTextChange={setMsgText}
                    onSendMessage={sendMessage}
                  />
                )}
              </div>
            );
          })()
        ) : (
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
              onRefresh={refreshProject}
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
            {/* Trade quote submission — full-page builder */}
            {userRole === "trade" && userId && !contract && !quotes.some((q) => q.trade_id === userId) && (
              <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-3">
                <h3 className="font-heading text-primary text-lg">Submit your quote</h3>
                <p className="font-mono text-[11px] text-muted-foreground">
                  A guided 4-stage quote builder with a live homeowner preview.
                </p>
                <button
                  onClick={() =>
                    navigate(
                      `/jobs/${id}/quote?from=${encodeURIComponent(`/project/${id}`)}${
                        qbDraftId ? `&qbDraft=${qbDraftId}` : ""
                      }`,
                    )
                  }
                  className="w-full bg-secondary text-secondary-foreground font-mono text-sm py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Open quote builder
                </button>
              </div>
            )}


            {/* Trade: download branded PDF of their submitted quote */}
            {isFeatureEnabled("quotePdf") && userRole === "trade" && userId && (() => {
              const myQuote = quotes.find((q) => q.trade_id === userId);
              if (!myQuote) return null;
              return (
                <div className="bg-card rounded-2xl p-4 border border-primary/10 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-primary text-sm">Your quote PDF</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      Branded Schedule of Works
                    </p>
                  </div>
                  <GenerateQuotePdfButton quoteId={myQuote.id} />
                </div>
              );
            })()}

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
              onRefresh={refreshProject}
            />

            {/* 6 — Payment Schedule */}
            <PaymentSchedule
              stages={stages}
              contractValue={contractValue}
              userRole={userRole}
              onReleasePayment={undefined}
            />
          </div>
        </div>
        )}

      </div>

      {/* Sub-trade assignment modal */}
      {subTradeStageId && userId && (
        <SubTradeModal
          stageId={subTradeStageId}
          jobId={id!}
          mainTradeId={userId}
          onClose={() => setSubTradeStageId(null)}
          onRefresh={refreshProject}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
