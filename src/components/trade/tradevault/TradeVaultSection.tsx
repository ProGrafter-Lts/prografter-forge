import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, FileText, Clock, AlertTriangle, Upload, Eye, Loader2, Lock,
} from "lucide-react";
import {
  VAULT_DOC_TYPES, VaultDocument, VaultDocTypeConfig,
  computeDisplayStatus, computeVaultSummary, STATUS_META, TONE_CLASSES,
  daysUntil, getDocLabel, computeDashboardVerification,
} from "@/lib/tradeVault";
import VaultDocumentDialog from "./VaultDocumentDialog";
import { cn } from "@/lib/utils";

const StatusBadge = ({ status, required }: { status: any; required: boolean }) => {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONE_CLASSES[meta.tone])}>
      {meta.label}
    </span>
  );
};

const SummaryCard = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) => (
  <div className={cn("rounded-xl border p-4 flex flex-col gap-1", TONE_CLASSES[tone])}>
    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide opacity-80">
      <Icon className="w-4 h-4" /> {label}
    </div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

const ComingSoon = ({ label }: { label: string }) => (
  <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center justify-between opacity-70">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Lock className="w-4 h-4" /> {label}
    </div>
    <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
  </div>
);

interface Props {
  tradeId: string;
}

const TradeVaultSection = ({ tradeId }: Props) => {
  const [docs, setDocs] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogConfig, setDialogConfig] = useState<VaultDocTypeConfig | null>(null);
  const [manualCtx, setManualCtx] = useState<{ manuallyVerified: boolean; verifiedAt: string | null }>({
    manuallyVerified: false,
    verifiedAt: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [docRes, tradeRes] = await Promise.all([
      supabase
        .from("tradevault_documents")
        .select("*")
        .eq("trade_id", tradeId)
        .order("created_at", { ascending: false }),
      supabase
        .from("trades")
        .select("verified, verification_status, verified_on_prografter_at")
        .eq("id", tradeId)
        .maybeSingle(),
    ]);
    if (docRes.error) console.error("Failed to load vault documents", docRes.error);
    setDocs((docRes.data as VaultDocument[]) ?? []);
    const t = tradeRes.data as any;
    setManualCtx({
      manuallyVerified: !!(t && (t.verified || t.verification_status === "approved" || t.verification_status === "verified")),
      verifiedAt: t?.verified_on_prografter_at ?? null,
    });
    setLoading(false);
  }, [tradeId]);

  useEffect(() => { void load(); }, [load]);

  const currentByType = new Map<string, VaultDocument>();
  docs.filter((d) => d.is_current).forEach((d) => currentByType.set(d.document_type, d));

  const summary = computeVaultSummary(docs);
  const dashVerification = computeDashboardVerification(docs, manualCtx);

  const viewFile = async (path: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage
      .from("trade-verification-documents")
      .createSignedUrl(path, 60 * 60);
    if (error) { console.error(error); return; }
    window.open(data.signedUrl, "_blank");
  };

  const verificationTone =
    dashVerification.status === "Verified" || dashVerification.status === "Verified — Manual Review" ? "green"
    : dashVerification.status === "Pending Review" ? "amber"
    : dashVerification.status === "Not Started" ? "grey"
    : dashVerification.tradeVaultStatus === "Migration Required" ? "amber"
    : "red";


  const renderDocRow = (cfg: VaultDocTypeConfig) => {
    const doc = currentByType.get(cfg.key);
    const status = computeDisplayStatus(doc, cfg.required);
    const days = daysUntil(doc?.expiry_date ?? null);
    return (
      <div key={cfg.key} className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{cfg.label}</span>
            {cfg.required && <span className="text-[10px] font-mono uppercase text-muted-foreground border border-border rounded px-1.5 py-0.5">Required</span>}
            <StatusBadge status={status} required={cfg.required} />
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-x-3">
            {doc?.provider_name && <span>{doc.provider_name}</span>}
            {doc?.expiry_date && (
              <span>
                Expires {new Date(doc.expiry_date).toLocaleDateString("en-GB")}
                {days !== null && days >= 0 && days <= 60 && ` (${days} days)`}
              </span>
            )}
            {doc?.rejection_reason && <span className="text-red-600">Rejected: {doc.rejection_reason}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {doc?.file_url && (
            <Button variant="outline" size="sm" onClick={() => viewFile(doc.file_url)}>
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
          )}
          <Button size="sm" onClick={() => setDialogConfig(cfg)}>
            <Upload className="w-4 h-4 mr-1" /> {doc?.file_url ? "Update" : "Upload"}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading TradeVault…
      </div>
    );
  }

  const requiredTypes = VAULT_DOC_TYPES.filter((d) => d.required);
  const optionalTypes = VAULT_DOC_TYPES.filter((d) => !d.required);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> TradeVault
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Keep your insurance, qualifications and trade documents in one place. ProGrafter uses these
          to verify your profile and remind you before anything expires.
        </p>
      </div>

      {/* Migration notice for legacy manually-verified trades */}
      {dashVerification.migrationRequired && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-amber-700 text-sm">Verified — TradeVault migration required</span>
            {dashVerification.inGrace && (
              <span className="font-mono text-[10px] uppercase tracking-wide bg-amber-500/15 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Grace period
              </span>
            )}
          </div>
          <p className="text-sm text-amber-700">{dashVerification.message}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={ShieldCheck} label="Verification Status" value={dashVerification.status} tone={verificationTone} />
        <SummaryCard icon={FileText} label="Required Documents" value={dashVerification.migrationRequired ? "Migration required" : `${summary.requiredUploaded} of ${summary.requiredTotal} uploaded`} tone={dashVerification.migrationRequired ? "amber" : summary.requiredUploaded === summary.requiredTotal ? "green" : "amber"} />
        <SummaryCard icon={Clock} label="Expiring Soon" value={`${summary.expiringSoon} within 30 days`} tone={summary.expiringSoon > 0 ? "amber" : "grey"} />
        <SummaryCard icon={AlertTriangle} label="Expired Documents" value={`${summary.expired} expired`} tone={summary.expired > 0 ? "red" : "grey"} />
      </div>


      {/* Reminders */}
      {(summary.expiringDocs.length > 0 || summary.expiredRequiredDocs.length > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
          <div className="font-semibold text-amber-700 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" /> Renewal reminders
          </div>
          {summary.expiredRequiredDocs.map((c) => (
            <p key={c.key} className="text-sm text-red-600">Your {c.label} has expired — upload your renewal to keep your profile verified.</p>
          ))}
          {summary.expiringDocs.map(({ config, days }) => (
            <p key={config.key} className="text-sm text-amber-700">Your {config.label} expires in {days} days. Upload your renewal certificate.</p>
          ))}
        </div>
      )}

      {/* Required documents */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Required for verification</h3>
        {requiredTypes.map(renderDocRow)}
      </div>

      {/* Optional documents */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Optional but important</h3>
        {optionalTypes.map(renderDocRow)}
      </div>

      {/* Future-proofing placeholders */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Coming soon</h3>
        <ComingSoon label="Request renewal quotes from selected trade insurance providers" />
        <ComingSoon label="Receipt storage" />
        <ComingSoon label="Accounting export" />
        <ComingSoon label="Warranty documents" />
      </div>

      {dialogConfig && (
        <VaultDocumentDialog
          open={!!dialogConfig}
          onOpenChange={(o) => !o && setDialogConfig(null)}
          tradeId={tradeId}
          config={dialogConfig}
          existing={currentByType.get(dialogConfig.key)}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default TradeVaultSection;
