import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Check, X, Loader2, RefreshCw } from "lucide-react";
import {
  VaultDocument, VAULT_DOC_TYPES, getDocLabel, computeDisplayStatus,
  computeVaultSummary, STATUS_META, TONE_CLASSES, REJECTION_REASONS, daysUntil,
} from "@/lib/tradeVault";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DocRow extends VaultDocument {
  trades?: { id: string; name: string | null; company_name: string | null; trade_type: string | null } | null;
}

type Filter = "awaiting" | "missing" | "expiring" | "expired" | "verified" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "awaiting", label: "Awaiting review" },
  { key: "missing", label: "Missing required" },
  { key: "expiring", label: "Expiring ≤30 days" },
  { key: "expired", label: "Expired required" },
  { key: "verified", label: "Fully verified" },
  { key: "all", label: "All trades" },
];

const AdminTradeVault = () => {
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("awaiting");
  const [rejectDoc, setRejectDoc] = useState<DocRow | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);
  const [rejectNote, setRejectNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tradevault_documents")
      .select("*, trades(id, name, company_name, trade_type)")
      .eq("is_current", true)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setRows((data as DocRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Group by trade
  const byTrade = new Map<string, DocRow[]>();
  rows.forEach((r) => {
    const key = r.trade_id;
    if (!byTrade.has(key)) byTrade.set(key, []);
    byTrade.get(key)!.push(r);
  });

  const tradeMatchesFilter = (docs: DocRow[]): boolean => {
    const summary = computeVaultSummary(docs);
    switch (filter) {
      case "awaiting": return docs.some((d) => d.status === "pending_review" || d.status === "uploaded");
      case "missing": return summary.missingRequired.length > 0;
      case "expiring": return summary.expiringSoon > 0;
      case "expired": return summary.expiredRequiredDocs.length > 0;
      case "verified": return summary.verificationStatus === "Verified";
      case "all": return true;
    }
  };

  const viewFile = async (path: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage
      .from("trade-verification-documents").createSignedUrl(path, 60 * 60);
    if (error) { console.error(error); return; }
    window.open(data.signedUrl, "_blank");
  };

  const approve = async (doc: DocRow) => {
    setBusyId(doc.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("tradevault_documents").update({
      status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    }).eq("id", doc.id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Document approved" });
    await syncTradeStatus(doc.trade_id);
    setBusyId(null);
    void load();
  };

  const submitReject = async (requestReplacement = false) => {
    if (!rejectDoc) return;
    setBusyId(rejectDoc.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("tradevault_documents").update({
      status: "rejected", rejection_reason: rejectReason,
      admin_notes: rejectNote || null,
      reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq("id", rejectDoc.id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: requestReplacement ? "Replacement requested" : "Document rejected" });
    await syncTradeStatus(rejectDoc.trade_id);
    setBusyId(null);
    setRejectDoc(null);
    setRejectNote("");
    void load();
  };

  // Recompute and persist the trade's verification_status based on required docs.
  const syncTradeStatus = async (tradeId: string) => {
    const { data } = await supabase
      .from("tradevault_documents").select("*").eq("trade_id", tradeId).eq("is_current", true);
    const summary = computeVaultSummary((data as VaultDocument[]) ?? []);
    const map: Record<string, string> = {
      "Verified": "approved", "Verification Paused": "info_requested",
      "Action Required": "info_requested", "Pending Review": "pending_verification",
      "Not Started": "pending",
    };
    await supabase.from("trades").update({
      verification_status: map[summary.verificationStatus] ?? "pending",
      verification_last_checked_at: new Date().toISOString(),
    }).eq("id", tradeId);
  };

  const shownTrades = Array.from(byTrade.entries()).filter(([, docs]) => tradeMatchesFilter(docs));

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-heading text-3xl text-foreground">TradeVault review</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review trade insurance, qualification and accreditation documents.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => load()}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : shownTrades.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">No trades match this filter.</p>
        ) : (
          <div className="space-y-6">
            {shownTrades.map(([tradeId, docs]) => {
              const trade = docs[0]?.trades;
              const summary = computeVaultSummary(docs);
              const vTone = summary.verificationStatus === "Verified" ? "green"
                : summary.verificationStatus === "Pending Review" ? "amber"
                : summary.verificationStatus === "Not Started" ? "grey" : "red";
              return (
                <div key={tradeId} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{trade?.company_name || trade?.name || "Trade"}</p>
                      <p className="text-xs text-muted-foreground">{trade?.name} · {trade?.trade_type}</p>
                    </div>
                    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONE_CLASSES[vTone])}>
                      {summary.verificationStatus}
                    </span>
                  </div>

                  {summary.missingRequired.length > 0 && (
                    <p className="text-xs text-red-600">
                      Missing required: {summary.missingRequired.map((c) => c.label).join(", ")}
                    </p>
                  )}

                  <div className="space-y-2">
                    {docs.map((doc) => {
                      const cfg = VAULT_DOC_TYPES.find((t) => t.key === doc.document_type);
                      const status = computeDisplayStatus(doc, cfg?.required ?? false);
                      const meta = STATUS_META[status];
                      const days = daysUntil(doc.expiry_date);
                      return (
                        <div key={doc.id} className="rounded-lg border border-border bg-background p-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                          <div className="min-w-0 text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{getDocLabel(doc.document_type)}</span>
                              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", TONE_CLASSES[meta.tone])}>
                                {meta.label}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 space-x-2">
                              {doc.provider_name && <span>{doc.provider_name}</span>}
                              {doc.policy_or_membership_number && <span>#{doc.policy_or_membership_number}</span>}
                              {doc.cover_amount && <span>£{Number(doc.cover_amount).toLocaleString()}</span>}
                              {doc.expiry_date && <span>Exp {new Date(doc.expiry_date).toLocaleDateString("en-GB")}{days !== null && days < 0 ? " (expired)" : ""}</span>}
                            </div>
                            {doc.rejection_reason && <p className="text-xs text-red-600 mt-0.5">Rejected: {doc.rejection_reason}</p>}
                            {doc.trade_notes && <p className="text-xs text-muted-foreground mt-0.5">Trade note: {doc.trade_notes}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.file_url && (
                              <Button variant="outline" size="sm" onClick={() => viewFile(doc.file_url)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="text-emerald-600" disabled={busyId === doc.id} onClick={() => approve(doc)}>
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" disabled={busyId === doc.id} onClick={() => { setRejectDoc(doc); setRejectReason(REJECTION_REASONS[0]); }}>
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!rejectDoc} onOpenChange={(o) => !o && setRejectDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
            <DialogDescription>A rejection reason is required. The trade will be asked to re-upload.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Rejection reason</label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Internal admin note (optional)</label>
              <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => submitReject(true)} disabled={!!busyId}>Request replacement</Button>
            <Button variant="destructive" onClick={() => submitReject(false)} disabled={!!busyId}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTradeVault;
