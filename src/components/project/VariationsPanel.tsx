import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Check, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  reason?: string;
  signed_at?: string;
  signed_by?: string;
  created_at: string;
}

interface VariationsPanelProps {
  variations: Variation[];
  userRole: "trade" | "homeowner" | null;
  userId: string | null;
  jobId: string;
  onRefresh: () => void;
}

const COMMISSION_RATE = 0.0375;

const REASON_OPTIONS = [
  "Client request",
  "Unforeseen site condition",
  "Design change",
  "Compliance requirement",
  "Other",
];

const VariationsPanel = ({ variations, userRole, userId, jobId, onRefresh }: VariationsPanelProps) => {
  const [showModal, setShowModal] = useState(false);
  const [varForm, setVarForm] = useState({
    title: "", description: "", materials_cost: "", labour_cost: "",
    programme_impact_days: "", reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const pendingVariations = variations.filter((v) => v.status === "pending");

  const submitVariation = async () => {
    if (!varForm.title.trim() || !userId) return;
    setSubmitting(true);
    const { error } = await supabase.from("variations").insert({
      job_id: jobId,
      trade_id: userId,
      title: varForm.title,
      description: varForm.description,
      materials_cost: Number(varForm.materials_cost) || 0,
      labour_cost: Number(varForm.labour_cost) || 0,
      programme_impact_days: Number(varForm.programme_impact_days) || 0,
      reason: varForm.reason || null,
    });
    if (error) toast.error("Failed to raise variation");
    else {
      toast.success("Variation raised");
      setShowModal(false);
      setVarForm({ title: "", description: "", materials_cost: "", labour_cost: "", programme_impact_days: "", reason: "" });
      onRefresh();
    }
    setSubmitting(false);
  };

  const approveVariation = async (vId: string) => {
    const { error } = await supabase.from("variations").update({
      status: "approved",
      signed_at: new Date().toISOString(),
      signed_by: "homeowner",
    }).eq("id", vId);
    if (error) toast.error("Failed to approve");
    else { toast.success("Variation approved & signed"); onRefresh(); }
  };

  const rejectVariation = async (vId: string) => {
    const { error } = await supabase.from("variations").update({ status: "rejected" }).eq("id", vId);
    if (error) toast.error("Failed to reject");
    else { toast.success("Variation rejected"); onRefresh(); }
  };

  return (
    <>
      {/* Pending variation alerts */}
      {pendingVariations.length > 0 && userRole === "homeowner" && (
        <div className="space-y-3">
          {pendingVariations.map((v) => {
            const totalCost = Number(v.materials_cost) + Number(v.labour_cost);
            const commission = totalCost * COMMISSION_RATE;
            return (
              <div key={v.id} className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col md:flex-row items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-heading text-navy text-lg">{v.title}</h3>
                  <p className="font-mono text-xs text-secondary-text mt-1">{v.description}</p>
                  {v.reason && <p className="font-mono text-xs text-secondary-text mt-1 italic">Reason: {v.reason}</p>}
                  <div className="flex flex-wrap gap-4 mt-2 font-mono text-xs text-secondary-text">
                    <span>Materials: £{Number(v.materials_cost).toLocaleString()}</span>
                    <span>Labour: £{Number(v.labour_cost).toLocaleString()}</span>
                    <span>Total: £{totalCost.toLocaleString()}</span>
                    <span>Impact: {v.programme_impact_days} days</span>
                    <span className="text-teal">Commission (3.75%): £{commission.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approveVariation(v.id)} className="flex items-center gap-1 bg-teal text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-teal-hover transition-colors">
                      <Check className="w-3.5 h-3.5" /> Approve & Sign
                    </button>
                    <button onClick={() => rejectVariation(v.id)} className="flex items-center gap-1 bg-red-500 text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-red-600 transition-colors">
                      <HelpCircle className="w-3.5 h-3.5" /> Query
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Variations section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-navy text-2xl">Variations</h2>
          {userRole === "trade" && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1 font-mono text-xs text-teal hover:text-teal-hover transition-colors">
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
            {variations.map((v) => {
              const totalCost = Number(v.materials_cost) + Number(v.labour_cost);
              return (
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
                  {v.reason && <p className="font-mono text-[10px] text-secondary-text mt-1 italic">Reason: {v.reason}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 font-mono text-[10px] text-secondary-text">
                    <span>£{totalCost.toLocaleString()}</span>
                    <span>{v.programme_impact_days}d impact</span>
                    {v.signed_at && <span className="text-green-600">Signed {new Date(v.signed_at).toLocaleDateString("en-GB")}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Variation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-navy text-2xl mb-4">Raise Variation</h2>
            <div className="space-y-3">
              <input value={varForm.title} onChange={(e) => setVarForm({ ...varForm, title: e.target.value })}
                placeholder="Variation title" className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              <textarea value={varForm.description} onChange={(e) => setVarForm({ ...varForm, description: e.target.value })}
                placeholder="Description…" className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-teal/30" />
              
              {/* Reason dropdown */}
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
              
              {/* Auto-calculated total */}
              {(varForm.materials_cost || varForm.labour_cost) && (
                <div className="bg-cream/60 rounded-xl px-4 py-2 font-mono text-xs text-navy">
                  Total: £{((Number(varForm.materials_cost) || 0) + (Number(varForm.labour_cost) || 0)).toLocaleString()}
                </div>
              )}

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

export default VariationsPanel;
