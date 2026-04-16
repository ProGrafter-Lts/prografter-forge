import { useState } from "react";
import { FileText, Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Quote {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  trade_id: string;
}

interface Contract {
  id: string;
  job_id: string;
  quote_id: string;
  trade_id: string;
  homeowner_id: string;
  contract_text: string;
  agreed_price: number;
  payment_schedule: any;
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

const generateContractText = (jobType: string, tradeName: string, homeownerName: string, amount: number, quoteMessage: string | null) => {
  const startPayment = (amount * 0.25).toFixed(2);
  const midPayment = (amount * 0.50).toFixed(2);
  const finalPayment = (amount * 0.25).toFixed(2);

  return `CONTRACT FOR WORKS

This contract is between:
Client: ${homeownerName}
Contractor: ${tradeName}

SCOPE OF WORK
${jobType} works as described in the accepted quotation.
${quoteMessage ? `\nAdditional details: ${quoteMessage}` : ""}

AGREED PRICE
Total contract value: £${amount.toLocaleString()}

PAYMENT SCHEDULE
1. Commencement payment (25%): £${startPayment} — due on project start
2. Practical completion (50%): £${midPayment} — due on practical completion of works
3. Final payment (25%): £${finalPayment} — due on final sign-off and snagging completion

VARIATION PROCESS
Any changes to the agreed scope must be submitted as a formal variation request through ProGrafter. Variations require homeowner approval before work proceeds. A commission of 3.75% applies to approved variations.

DEFECTS LIABILITY
The contractor shall be liable for defects in workmanship and materials for a period of 12 months from the date of practical completion. Defects reported within this period shall be rectified at no additional cost to the client.

DISPUTE RESOLUTION
Any disputes shall first be addressed through the ProGrafter platform's messaging system. If unresolved, parties agree to mediation before pursuing legal remedies.`;
};

const ContractPanel = ({ jobId, jobType, quotes, contract, userRole, userId, tradeName, homeownerName, onRefresh }: ContractPanelProps) => {
  const [showContract, setShowContract] = useState(false);
  const [signing, setSigning] = useState(false);

  const pendingQuotes = quotes.filter((q) => q.status === "pending");
  const acceptedQuote = quotes.find((q) => q.status === "accepted");

  const acceptQuote = async (quote: Quote) => {
    setShowContract(true);
  };

  const signContract = async (quote: Quote) => {
    if (!userId) return;
    setSigning(true);

    const amount = Number(quote.amount);
    const contractText = generateContractText(jobType, tradeName, homeownerName, amount, quote.message);
    const paymentSchedule = [
      { label: "Commencement (25%)", amount: amount * 0.25, status: "unpaid" },
      { label: "Practical Completion (50%)", amount: amount * 0.50, status: "unpaid" },
      { label: "Final Payment (25%)", amount: amount * 0.25, status: "unpaid" },
    ];

    if (contract) {
      // Sign existing contract
      if (userRole === "homeowner") {
        const { error } = await supabase.from("contracts").update({
          status: "homeowner_signed",
          homeowner_signed_at: new Date().toISOString(),
        }).eq("id", contract.id);
        if (error) toast.error("Failed to sign contract");
        else toast.success("Contract signed! Trade will be notified to countersign.");
      } else {
        const { error } = await supabase.from("contracts").update({
          status: "fully_signed",
          trade_signed_at: new Date().toISOString(),
        }).eq("id", contract.id);
        if (error) toast.error("Failed to countersign");
        else toast.success("Contract fully signed! Project is now active.");
      }
    } else {
      // Create contract and sign as homeowner
      // First accept the quote
      await supabase.from("quotes").update({ status: "accepted" }).eq("id", quote.id);

      const { error } = await supabase.from("contracts").insert({
        job_id: jobId,
        quote_id: quote.id,
        trade_id: quote.trade_id,
        homeowner_id: userId,
        contract_text: contractText,
        agreed_price: amount,
        payment_schedule: paymentSchedule,
        status: "homeowner_signed",
        homeowner_signed_at: new Date().toISOString(),
      });
      if (error) toast.error("Failed to create contract");
      else toast.success("Contract signed! Trade will be notified to countersign.");
    }

    setSigning(false);
    setShowContract(false);
    onRefresh();
  };

  // Show quote acceptance for homeowner (no contract yet)
  if (userRole === "homeowner" && !contract && pendingQuotes.length > 0) {
    return (
      <section>
        <h2 className="font-heading text-navy text-2xl mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Quotes & Contract
        </h2>
        <div className="space-y-3">
          {pendingQuotes.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-heading text-teal text-xl">£{Number(q.amount).toLocaleString()}</p>
                <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
              </div>
              {q.message && <p className="font-mono text-xs text-secondary-text mt-2">{q.message}</p>}
              <button onClick={() => acceptQuote(q)}
                className="mt-3 w-full bg-teal text-white font-mono text-sm py-2.5 rounded-xl hover:bg-teal-hover transition-colors">
                Accept Quote & Review Contract
              </button>

              {/* Contract review */}
              {showContract && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContract(false)}>
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                    <h2 className="font-heading text-navy text-2xl mb-4">Contract Review</h2>
                    <pre className="font-mono text-xs text-body-text whitespace-pre-wrap bg-cream/60 rounded-xl p-4 border border-navy/10 mb-4">
                      {generateContractText(jobType, tradeName, homeownerName, Number(q.amount), q.message)}
                    </pre>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <p className="font-mono text-xs text-amber-700">
                        By signing, you agree to the terms above. The trade will be notified to countersign. Both signatures are required before the project begins.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowContract(false)}
                        className="flex-1 border border-navy/10 font-mono text-sm py-2.5 rounded-xl hover:bg-navy/5 transition-colors">Cancel</button>
                      <button onClick={() => signContract(q)} disabled={signing}
                        className="flex-1 bg-teal text-white font-mono text-sm py-2.5 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Sign & Accept Contract
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Show contract status
  if (contract) {
    const needsTradeSign = contract.status === "homeowner_signed" && userRole === "trade";
    return (
      <section>
        <h2 className="font-heading text-navy text-2xl mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Digital Contract
        </h2>
        <div className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading text-teal text-xl">£{Number(contract.agreed_price).toLocaleString()}</p>
            <Badge className={
              contract.status === "fully_signed" ? "bg-green-100 text-green-700" :
              "bg-amber-100 text-amber-700"
            }>
              {contract.status === "fully_signed" ? "Fully Signed" :
               contract.status === "homeowner_signed" ? "Awaiting Trade Signature" :
               "Draft"}
            </Badge>
          </div>
          <div className="space-y-2 font-mono text-xs text-secondary-text">
            <div className="flex items-center gap-2">
              {contract.homeowner_signed_at ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clock className="w-3.5 h-3.5 text-navy/30" />}
              Homeowner: {contract.homeowner_signed_at ? `Signed ${new Date(contract.homeowner_signed_at).toLocaleDateString("en-GB")}` : "Not signed"}
            </div>
            <div className="flex items-center gap-2">
              {contract.trade_signed_at ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clock className="w-3.5 h-3.5 text-navy/30" />}
              Trade: {contract.trade_signed_at ? `Signed ${new Date(contract.trade_signed_at).toLocaleDateString("en-GB")}` : "Not signed"}
            </div>
          </div>

          {needsTradeSign && (
            <>
              <button onClick={() => setShowContract(true)}
                className="mt-3 w-full bg-teal text-white font-mono text-sm py-2.5 rounded-xl hover:bg-teal-hover transition-colors">
                Review & Countersign
              </button>
              {showContract && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContract(false)}>
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                    <h2 className="font-heading text-navy text-2xl mb-4">Countersign Contract</h2>
                    <pre className="font-mono text-xs text-body-text whitespace-pre-wrap bg-cream/60 rounded-xl p-4 border border-navy/10 mb-4">
                      {contract.contract_text}
                    </pre>
                    <div className="flex gap-3">
                      <button onClick={() => setShowContract(false)}
                        className="flex-1 border border-navy/10 font-mono text-sm py-2.5 rounded-xl hover:bg-navy/5 transition-colors">Cancel</button>
                      <button onClick={() => signContract({ id: contract.quote_id, amount: contract.agreed_price, message: null, status: "accepted", trade_id: contract.trade_id })} disabled={signing}
                        className="flex-1 bg-teal text-white font-mono text-sm py-2.5 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Countersign Contract
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    );
  }

  return null;
};

export default ContractPanel;
