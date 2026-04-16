import { useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubTradeModalProps {
  stageId: string;
  jobId: string;
  mainTradeId: string;
  onClose: () => void;
  onRefresh: () => void;
}

const SubTradeModal = ({ stageId, jobId, mainTradeId, onClose, onRefresh }: SubTradeModalProps) => {
  const [tab, setTab] = useState<"search" | "external">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [extForm, setExtForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const searchTrades = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase.from("trades")
      .select("id, name, company_name, trade_type, verified")
      .ilike("company_name", `%${searchQuery}%`)
      .neq("id", mainTradeId)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const assignProGrafterSub = async (subTradeId: string) => {
    setSubmitting(true);
    const { error } = await supabase.from("sub_trade_assignments").insert({
      stage_id: stageId,
      job_id: jobId,
      main_trade_id: mainTradeId,
      sub_trade_id: subTradeId,
    });
    if (error) toast.error("Failed to assign sub-trade");
    else { toast.success("Sub-trade assigned"); onRefresh(); onClose(); }
    setSubmitting(false);
  };

  const assignExternalSub = async () => {
    if (!extForm.name.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("sub_trade_assignments").insert({
      stage_id: stageId,
      job_id: jobId,
      main_trade_id: mainTradeId,
      external_sub_name: extForm.name,
      external_sub_phone: extForm.phone || null,
      external_sub_email: extForm.email || null,
    });
    if (error) toast.error("Failed to assign sub-trade");
    else { toast.success("External sub-trade assigned"); onRefresh(); onClose(); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-navy text-2xl">Assign Sub-Trade</h2>
          <button onClick={onClose} className="text-secondary-text hover:text-navy"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("search")}
            className={`flex-1 font-mono text-xs py-2 rounded-xl transition-colors ${tab === "search" ? "bg-teal text-white" : "bg-cream text-secondary-text hover:bg-navy/5"}`}>
            <Search className="w-3.5 h-3.5 inline mr-1" /> Search ProGrafter
          </button>
          <button onClick={() => setTab("external")}
            className={`flex-1 font-mono text-xs py-2 rounded-xl transition-colors ${tab === "external" ? "bg-teal text-white" : "bg-cream text-secondary-text hover:bg-navy/5"}`}>
            <UserPlus className="w-3.5 h-3.5 inline mr-1" /> External Sub
          </button>
        </div>

        {tab === "search" ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTrades()}
                placeholder="Search by company name…"
                className="flex-1 border border-navy/10 rounded-xl px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
              <button onClick={searchTrades} disabled={searching}
                className="bg-navy text-white px-3 rounded-xl hover:bg-navy/90 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-auto">
                {searchResults.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-cream/60 rounded-xl">
                    <div>
                      <p className="font-mono text-sm text-navy font-semibold">{t.company_name}</p>
                      <p className="font-mono text-[10px] text-secondary-text">{t.name} · {t.trade_type}</p>
                    </div>
                    <button onClick={() => assignProGrafterSub(t.id)} disabled={submitting}
                      className="bg-teal text-white font-mono text-xs px-3 py-1.5 rounded-lg hover:bg-teal-hover transition-colors disabled:opacity-50">
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="font-mono text-xs text-secondary-text text-center py-4">No trades found. Try a different search or add an external sub.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input value={extForm.name} onChange={(e) => setExtForm({ ...extForm, name: e.target.value })}
              placeholder="Sub-trade name *" className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            <input value={extForm.phone} onChange={(e) => setExtForm({ ...extForm, phone: e.target.value })}
              placeholder="Phone (optional)" className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            <input value={extForm.email} onChange={(e) => setExtForm({ ...extForm, email: e.target.value })}
              placeholder="Email (optional)" className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            <button onClick={assignExternalSub} disabled={submitting || !extForm.name.trim()}
              className="w-full bg-teal text-white font-mono text-sm py-2.5 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
              Assign External Sub
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubTradeModal;
