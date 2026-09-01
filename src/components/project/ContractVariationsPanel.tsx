import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Check, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContractVariation {
  id: string;
  contract_id: string;
  sequence: number;
  title: string;
  description: string;
  reason: string | null;
  proposed_by: string;
  cost_change_pence: number;
  commission_pence: number | null;
  programme_impact_days: number;
  status: string;
  homeowner_signed_at: string | null;
  trade_signed_at: string | null;
  activated_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface Props {
  contractId: string | null;
  contractStatus: string | null;
  userRole: "trade" | "homeowner" | null;
}

const COMMISSION_RATE = 0.0375;

const REASON_OPTIONS = [
  "Client request",
  "Unforeseen site condition",
  "Design change",
  "Compliance requirement",
  "Other",
];

const gbp = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ContractVariationsPanel = ({ contractId, contractStatus, userRole }: Props) => {
  const [variations, setVariations] = useState<ContractVariation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [varForm, setVarForm] = useState({
    title: "", description: "", materials_cost: "", labour_cost: "",
    programme_impact_days: "", reason: "",
  });

  const load = useCallback(async () => {
    if (!contractId) { setVariations([]); return; }
    const { data } = await supabase
      .from("contract_variations")
      .select("*")
      .eq("contract_id", contractId)
      .order("sequence", { ascending: false });
    setVariations((data ?? []) as unknown as ContractVariation[]);
  }, [contractId]);

  useEffect(() => { void load(); }, [load]);

  if (!contractId) return null;

  const canRaise = userRole === "trade" && contractStatus === "active";

  // Awaiting the homeowner's signature (trade proposed, homeowner not signed yet).
  const awaitingHomeowner = variations.filter(
    (v) => v.status === "pending" && !v.homeowner_signed_at,
  );

  const submitVariation = async () => {
    if (!varForm.title.trim()) return;
    setSubmitting(true);
    const costPence = Math.round(
      ((Number(varForm.materials_cost) || 0) + (Number(varForm.labour_cost) || 0)) * 100,
    );
    const { error } = await supabase.rpc("propose_variation", {
      _contract_id: contractId,
      _title: varForm.title,
      _description: varForm.description,
      _reason: varForm.reason || null,
      _cost_change_pence: costPence,
      _programme_impact_days: Number(varForm.programme_impact_days) || 0,
    });
    if (error) toast.error(error.message || "Failed to raise variation");
    else {
      toast.success("Variation proposed — awaiting homeowner signature");
      setShowModal(false);
      setVarForm({ title: "", description: "", materials_cost: "", labour_cost: "", programme_impact_days: "", reason: "" });
      void load();
    }
    setSubmitting(false);
  };

  const signVariation = async (v: ContractVariation, accept: boolean) => {
    const hash = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.rpc("sign_variation", {
      _variation_id: v.id,
      _signature_hash: hash,
      _accept: accept,
      _rejection_reason: accept ? null : "Queried by homeowner",
    });
    if (error) toast.error(error.message || "Failed to record decision");
    else {
      toast.success(accept ? "Variation signed into the contract" : "Variation queried");
      void load();
    }
  };

  return (
    <>
      {/* Variations awaiting the homeowner's signature */}
      {awaitingHomeowner.length > 0 && userRole === "homeowner" && (
        <div className="space-y-3">
          {awaitingHomeowner.map((v) => {
            const commission = v.commission_pence ?? Math.round(Math.max(v.cost_change_pence, 0) * COMMISSION_RATE);
            return (
              <div key={v.id} className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col md:flex-row items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-heading text-navy text-lg">Variation #{v.sequence} — {v.title}</h3>
                  <p className="font-mono text-xs text-secondary-text mt-1">{v.description}</p>
                  {v.reason && <p className="font-mono text-xs text-secondary-text mt-1 italic">Reason: {v.reason}</p>}
                  <div className="flex flex-wrap gap-4 mt-2 font-mono text-xs text-secondary-text">
                    <span>Cost change: {gbp(v.cost_change_pence)}</span>
                    <span>Impact: {v.programme_impact_days} days</span>
                    <span className="text-teal">Commission (3.75%): {gbp(commission)}</span>
                  </div>
                  <p className="font-mono text-[10px] text-secondary-text mt-2">
                    Signing adds this variation to your contract terms.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => signVariation(v, true)} className="flex items-center gap-1 bg-teal text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-teal-hover transition-colors">
                      <Check className="w-3.5 h-3.5" /> Accept & Sign
                    </button>
                    <button onClick={() => signVariation(v, false)} className="flex items-center gap-1 bg-red-500 text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-red-600 transition-colors">
                      <HelpCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-navy text-2xl">Contract Variations</h2>
          {canRaise && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1 font-mono text-xs text-teal hover:text-teal-hover transition-colors">
              <Plus className="w-4 h-4" /> Raise Variation
            </button>
          )}
        </div>
        {userRole === "trade" && contractStatus !== "active" && (
          <p className="font-mono text-xs text-secondary-text mb-3">
            Variations can only be raised once the contract is active.
          </p>
        )}
        {variations.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-navy/10 text-center">
            <p className="font-mono text-sm text-secondary-text">No variations raised.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {variations.map((v) => {
              const commission = v.commission_pence ?? Math.round(Math.max(v.cost_change_pence, 0) * COMMISSION_RATE);
              return (
                <div key={v.id} className="bg-card rounded-2xl p-4 border border-navy/10 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-navy text-base">#{v.sequence} {v.title}</h3>
                    <Badge className={
                      v.status === "accepted" ? "bg-green-100 text-green-700" :
                      v.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }>
                      {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-secondary-text mt-1 line-clamp-2">{v.description}</p>
                  {v.reason && <p className="font-mono text-[10px] text-secondary-text mt-1 italic">Reason: {v.reason}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 font-mono text-[10px] text-secondary-text">
                    <span>{gbp(v.cost_change_pence)}</span>
                    <span>Commission {gbp(commission)}</span>
                    <span>{v.programme_impact_days}d impact</span>
                    <span>Proposed by {v.proposed_by}</span>
                    {v.activated_at && <span className="text-green-600">Signed into contract {new Date(v.activated_at).toLocaleDateString("en-GB")}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-navy text-2xl mb-4">Raise Variation</h2>
            <div className="space-y-3">
              <input value={varForm.title} onChange={(e) => setVarForm({ ...varForm, title: e.target.value })}
                placeholder="Variation title" className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              <textarea value={varForm.description} onChange={(e) => setVarForm({ ...varForm, description: e.target.value })}
                placeholder="Description…" className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-teal/30" />

              <div>
                <label className="font-mono text-[10px] text-secondary-text uppercase">Reason for Variation</label>
                <select
                  value={varForm.reason}
                  onChange={(e) => setVarForm({ ...varForm, reason: e.target.value })}
                  className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white"
                >
                  <option value="">Select reason…</option>
                  {REASON_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

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

              {(varForm.materials_cost || varForm.labour_cost) && (() => {
                const total = (Number(varForm.materials_cost) || 0) + (Number(varForm.labour_cost) || 0);
                return (
                  <div className="bg-cream/60 rounded-xl px-4 py-2 font-mono text-xs text-navy">
                    Total: £{total.toLocaleString()} · Commission (3.75%): £{(total * COMMISSION_RATE).toFixed(2)}
                  </div>
                );
              })()}

              <div>
                <label className="font-mono text-[10px] text-secondary-text uppercase">Programme Impact (days)</label>
                <input type="number" value={varForm.programme_impact_days} onChange={(e) => setVarForm({ ...varForm, programme_impact_days: e.target.value })}
                  className="w-full border border-navy/10 rounded-xl px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-navy/10 font-mono text-sm py-2.5 rounded-xl hover:bg-navy/5 transition-colors">Cancel</button>
                <button onClick={submitVariation} disabled={submitting || !varForm.title.trim()}
                  className="flex-1 bg-teal text-white font-mono text-sm py-2.5 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContractVariationsPanel;
