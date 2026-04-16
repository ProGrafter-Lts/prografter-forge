import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Lock } from "lucide-react";
import ManualOverview from "@/components/manual/ManualOverview";
import ManualMaterials from "@/components/manual/ManualMaterials";
import ManualCertificates from "@/components/manual/ManualCertificates";
import ManualWarranties from "@/components/manual/ManualWarranties";
import ManualPhotos from "@/components/manual/ManualPhotos";
import ManualMaintenance from "@/components/manual/ManualMaintenance";
import ManualContacts from "@/components/manual/ManualContacts";
import ManualGreenSections from "@/components/manual/ManualGreenSections";
import ManualProModal from "@/components/manual/ManualProModal";

interface ManualData {
  job: any;
  trade: any;
  homeowner: any;
  contract: any;
  stages: any[];
  stageUpdates: any[];
  materials: any[];
  certificates: any[];
  warranties: any[];
  greenData: any;
  isPro: boolean;
  isGreen: boolean;
}

const SECTIONS = [
  { id: "overview", label: "1. Project Overview", free: true },
  { id: "materials", label: "2. Materials & Specifications", free: false },
  { id: "certificates", label: "3. Certificates & Compliance", free: true },
  { id: "warranties", label: "4. Warranties", free: false },
  { id: "photos", label: "5. Photo Record", free: true },
  { id: "maintenance", label: "6. Maintenance Schedule", free: false },
  { id: "contacts", label: "7. Key Contacts", free: true },
];

const GREEN_SECTIONS = [
  { id: "grant", label: "G1. Grant Documentation" },
  { id: "mcs", label: "G2. MCS Installation Certificate" },
  { id: "epc", label: "G3. EPC Comparison" },
  { id: "system-specs", label: "G4. System Specifications" },
  { id: "green-maintenance", label: "G5. Green Maintenance" },
];

const HomeownerManual = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ManualData | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    if (projectId) loadManualData();
  }, [projectId]);

  const loadManualData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const [jobRes, contractRes, stagesRes, materialsRes, certsRes, warrantiesRes, proRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", projectId!).single(),
      supabase.from("contracts").select("*").eq("job_id", projectId!).maybeSingle(),
      supabase.from("project_stages").select("*").eq("job_id", projectId!).order("stage_order"),
      supabase.from("materials_log").select("*").eq("job_id", projectId!).order("created_at"),
      supabase.from("project_certificates").select("*").eq("job_id", projectId!).order("created_at"),
      supabase.from("project_warranties").select("*").eq("job_id", projectId!).order("created_at"),
      supabase.from("manual_pro_purchases").select("*").eq("job_id", projectId!).eq("user_id", user.id).maybeSingle(),
    ]);

    if (!jobRes.data) { setLoading(false); return; }

    const job = jobRes.data;

    // Fetch trade and homeowner
    let trade = null, homeowner = null;
    if (contractRes.data) {
      const [tradeRes, hoRes] = await Promise.all([
        supabase.from("trades").select("*").eq("id", contractRes.data.trade_id).single(),
        supabase.from("homeowners").select("*").eq("id", contractRes.data.homeowner_id).single(),
      ]);
      trade = tradeRes.data;
      homeowner = hoRes.data;
    }

    // Fetch stage updates for photos
    const stageIds = stagesRes.data?.map(s => s.id) || [];
    let stageUpdates: any[] = [];
    if (stageIds.length > 0) {
      const { data: updates } = await supabase
        .from("stage_updates")
        .select("*")
        .in("stage_id", stageIds)
        .order("created_at");
      stageUpdates = updates || [];
    }

    // Green data
    let greenData = null;
    if (job.is_green_job) {
      const { data: gd } = await supabase
        .from("green_project_data")
        .select("*")
        .eq("job_id", projectId!)
        .maybeSingle();
      greenData = gd;
    }

    setData({
      job,
      trade,
      homeowner,
      contract: contractRes.data,
      stages: stagesRes.data || [],
      stageUpdates,
      materials: materialsRes.data || [],
      certificates: certsRes.data || [],
      warranties: warrantiesRes.data || [],
      greenData,
      isPro: !!proRes.data,
      isGreen: job.is_green_job,
    });
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleProPurchased = () => {
    setData(prev => prev ? { ...prev, isPro: true } : prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const allSections = [...SECTIONS, ...(data.isGreen ? GREEN_SECTIONS : [])];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8 print:py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-primary-foreground/60 mb-1">
                Homeowner Manual
              </p>
              <h1 className="font-heading text-3xl md:text-4xl">
                <span className="text-primary-foreground">Pro</span>
                <span className="text-secondary">grafter</span>
              </h1>
            </div>
            <button
              onClick={handlePrint}
              className="print:hidden flex items-center gap-2 bg-secondary text-white font-mono text-xs px-4 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download as PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Table of Contents */}
        <nav className="bg-card rounded-2xl border border-border p-6 mb-8 print:mb-4 print:border-0">
          <h2 className="font-heading text-primary text-lg mb-4">Table of Contents</h2>
          <ul className="space-y-2">
            {allSections.map(s => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2 font-mono text-xs text-foreground hover:text-secondary transition-colors"
                >
                  {"free" in s && !s.free && !data.isPro && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Section 1 — Overview */}
        <ManualOverview
          job={data.job}
          trade={data.trade}
          homeowner={data.homeowner}
          contract={data.contract}
          stages={data.stages}
        />

        {/* Section 2 — Materials */}
        <LockedSection
          id="materials"
          title="2. Materials & Specifications"
          isPro={data.isPro}
          onUpgrade={() => setShowProModal(true)}
        >
          <ManualMaterials materials={data.materials} jobId={projectId!} />
        </LockedSection>

        {/* Section 3 — Certificates */}
        <ManualCertificates certificates={data.certificates} jobId={projectId!} />

        {/* Section 4 — Warranties */}
        <LockedSection
          id="warranties"
          title="4. Warranties"
          isPro={data.isPro}
          onUpgrade={() => setShowProModal(true)}
        >
          <ManualWarranties warranties={data.warranties} jobId={projectId!} />
        </LockedSection>

        {/* Section 5 — Photos */}
        <ManualPhotos
          stages={data.stages}
          stageUpdates={data.stageUpdates}
          isPro={data.isPro}
          onUpgrade={() => setShowProModal(true)}
        />

        {/* Section 6 — Maintenance */}
        <LockedSection
          id="maintenance"
          title="6. Maintenance Schedule"
          isPro={data.isPro}
          onUpgrade={() => setShowProModal(true)}
        >
          <ManualMaintenance jobType={data.job.job_type} />
        </LockedSection>

        {/* Section 7 — Key Contacts */}
        <ManualContacts trade={data.trade} warranties={data.warranties} />

        {/* Green Sections */}
        {data.isGreen && (
          <ManualGreenSections greenData={data.greenData} jobId={projectId!} />
        )}

        {/* Bottom download */}
        <div className="text-center mt-12 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-secondary text-white font-mono text-sm px-8 py-3 rounded-xl hover:bg-secondary/90 transition-colors mx-auto"
          >
            <Download className="w-4 h-4" />
            Download as PDF
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground/60 py-6 mt-12 print:mt-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-mono text-[10px]">
            Generated by ProGrafter · prografter.co.uk · hello@prografter.co.uk
          </p>
        </div>
      </footer>

      {showProModal && (
        <ManualProModal
          jobId={projectId!}
          onClose={() => setShowProModal(false)}
          onPurchased={handleProPurchased}
        />
      )}
    </div>
  );
};

// Locked section wrapper
const LockedSection = ({
  id,
  title,
  isPro,
  onUpgrade,
  children,
}: {
  id: string;
  title: string;
  isPro: boolean;
  onUpgrade: () => void;
  children: React.ReactNode;
}) => {
  if (isPro) {
    return <div id={id}>{children}</div>;
  }

  return (
    <section id={id} className="bg-card rounded-2xl border border-border p-6 mb-6 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-heading text-primary text-xl">{title}</h2>
      </div>
      <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
        <Lock className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="font-heading text-primary text-lg mb-1">Manual Pro</p>
        <p className="font-mono text-xs text-muted-foreground mb-4">Unlock all sections for £49</p>
        <button
          onClick={onUpgrade}
          className="bg-secondary text-white font-mono text-xs px-6 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors"
        >
          Upgrade to Manual Pro
        </button>
      </div>
      <div className="opacity-20 pointer-events-none">{children}</div>
    </section>
  );
};

export default HomeownerManual;
