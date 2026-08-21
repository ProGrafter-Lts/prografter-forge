import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Check, Clock, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Quote {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  trade_id: string;
  tier_enabled?: boolean;
  budget_price?: number | null;
  standard_price?: number | null;
  premium_price?: number | null;
  selected_tier?: string | null;
  is_offline_agreement?: boolean | null;
  pdf_path?: string | null;
  contract_pdf_path?: string | null;
  agreed_at?: string | null;
}

interface Contract {
  id: string;
  job_id: string;
  quote_id: string;
  trade_id: string;
  homeowner_id: string;
  contract_text?: string;
  agreed_price: number;
  payment_schedule?: any;
  status: string;
  homeowner_signed_at: string | null;
  trade_signed_at: string | null;
}

interface ContractPanelProps {
  jobId: string;
  jobType: string;
  quotes: Quote[];
  contract: Contract | null;
  userRole: "trade" | "homeowner" | null;
  userId: string | null;
  tradeName: string;
  homeownerName: string;
  onRefresh: () => void;
}

const statusBadge = (status: string, hSigned: boolean, tSigned: boolean) => {
  if (status === "active") return { label: "Active", cls: "bg-emerald-100 text-emerald-800" };
  if (status === "completed") return { label: "Completed", cls: "bg-emerald-100 text-emerald-800" };
  if (status === "terminated") return { label: "Terminated", cls: "bg-red-100 text-red-800" };
  if (hSigned && !tSigned) return { label: "Awaiting trade signature", cls: "bg-amber-100 text-amber-800" };
  if (!hSigned && tSigned) return { label: "Awaiting homeowner signature", cls: "bg-amber-100 text-amber-800" };
  return { label: "Awaiting signatures", cls: "bg-amber-100 text-amber-800" };
};

const ContractPanel = ({ jobId, quotes, contract, userRole, userId, onRefresh }: ContractPanelProps) => {
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState<string | null>(null);

  // Homeowner: pending quotes still awaiting acceptance (and no contract yet)
  const actionableQuotes = quotes.filter(
    (q) => q.status === "pending" || (q.status === "accepted" && !contract),
  );

  const offlineAgreements = quotes.filter((q) => q.is_offline_agreement);

  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("quote-pdfs").createSignedUrl(path, 600);
    if (error || !data?.signedUrl) {
      toast.error("Couldn't open that document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const AgreedBlock = () => (
    <section className="mb-6">
      <h2 className="font-heading text-navy text-2xl mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" /> Agreed quote &amp; contract
      </h2>
      <div className="space-y-3">
        {offlineAgreements.map((q) => (
          <div key={q.id} className="bg-card rounded-2xl p-5 border border-navy/10 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-heading text-teal text-xl">£{Number(q.amount).toLocaleString()}</p>
              <Badge className="bg-emerald-100 text-emerald-800">Agreed</Badge>
            </div>
            <p className="font-mono text-xs text-secondary-text mt-2">
              Agreed directly between homeowner and trade
              {q.agreed_at ? ` on ${new Date(q.agreed_at).toLocaleDateString("en-GB")}` : ""}, and
              filed here for the record.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {q.pdf_path && (
                <button
                  onClick={() => openDoc(q.pdf_path!)}
                  className="font-mono text-xs border border-navy/20 rounded-lg px-3 py-2 hover:bg-navy/5 inline-flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" /> Agreed quote document
                </button>
              )}
              {q.contract_pdf_path && (
                <button
                  onClick={() => openDoc(q.contract_pdf_path!)}
                  className="font-mono text-xs border border-navy/20 rounded-lg px-3 py-2 hover:bg-navy/5 inline-flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" /> Signed contract
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const acceptAndGenerate = async (quote: Quote) => {
    if (!userId) return;
    setAccepting(quote.id);

    // Auto-decline siblings on the same job
    const siblingIds = quotes
      .filter((q) => q.id !== quote.id && q.status === "pending")
      .map((q) => q.id);
    if (siblingIds.length > 0) {
      await supabase.from("quotes").update({ status: "declined" }).in("id", siblingIds);
    }

    const { data: contractId, error } = await supabase.rpc("generate_contract_for_quote", {
      _quote_id: quote.id,
    });

    setAccepting(null);

    if (error || !contractId) {
      toast.error(error?.message || "Couldn't accept quote — please try again.");
      return;
    }

    toast.success("Quote accepted. Review and sign your contract now.");
    onRefresh();
    navigate(`/project/${jobId}/contract`);
  };

  // Homeowner: quote acceptance (no contract yet)
  if (userRole === "homeowner" && !contract && actionableQuotes.length > 0) {
    return (
      <>
      {offlineAgreements.length > 0 && <AgreedBlock />}
      <section>
        <h2 className="font-heading text-navy text-2xl mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Quotes & Contract
        </h2>
        <div className="space-y-3">
          {actionableQuotes.map((q) => (
            <div key={q.id} className="bg-card rounded-2xl p-5 border border-navy/10 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-heading text-teal text-xl">£{Number(q.amount).toLocaleString()}</p>
                <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
              </div>
              {q.message && <p className="font-mono text-xs text-secondary-text mt-2">{q.message}</p>}
              <button
                onClick={() => acceptAndGenerate(q)}
                disabled={accepting === q.id}
                className="mt-3 w-full bg-teal text-white font-mono text-sm py-2.5 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {accepting === q.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating contract…
                  </>
                ) : (
                  <>Accept Quote & Review Contract</>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>
      </>
    );
  }

  // Contract exists → show status summary + link to contract page
  if (contract) {
    const hSigned = !!contract.homeowner_signed_at;
    const tSigned = !!contract.trade_signed_at;
    const badge = statusBadge(contract.status, hSigned, tSigned);
    const needsMySignature =
      (userRole === "homeowner" && !hSigned) || (userRole === "trade" && !tSigned);

    return (
      <section>
        <h2 className="font-heading text-navy text-2xl mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Digital Contract
        </h2>
        <div className="bg-card rounded-2xl p-5 border border-navy/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-teal text-xl">£{Number(contract.agreed_price).toLocaleString()}</p>
            <Badge className={badge.cls}>{badge.label}</Badge>
          </div>
          <div className="space-y-2 font-mono text-xs text-secondary-text">
            <div className="flex items-center gap-2">
              {hSigned ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clock className="w-3.5 h-3.5 text-navy/30" />}
              Homeowner: {hSigned ? `Signed ${new Date(contract.homeowner_signed_at!).toLocaleDateString("en-GB")}` : "Not signed"}
            </div>
            <div className="flex items-center gap-2">
              {tSigned ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clock className="w-3.5 h-3.5 text-navy/30" />}
              Trade: {tSigned ? `Signed ${new Date(contract.trade_signed_at!).toLocaleDateString("en-GB")}` : "Not signed"}
            </div>
          </div>

          <button
            onClick={() => navigate(`/project/${jobId}/contract`)}
            className={`mt-3 w-full inline-flex items-center justify-center gap-2 font-mono text-sm py-2.5 rounded-xl transition-colors ${
              needsMySignature
                ? "bg-teal text-white hover:bg-teal-hover"
                : "border border-navy/10 text-navy hover:bg-navy/5"
            }`}
          >
            <Eye className="w-4 h-4" />
            {needsMySignature ? "Review & Sign Contract" : "View Contract"}
          </button>
        </div>
      </section>
    );
  }

  return null;
};

export default ContractPanel;
