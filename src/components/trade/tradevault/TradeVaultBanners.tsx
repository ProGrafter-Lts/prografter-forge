import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, ShieldOff } from "lucide-react";
import { VaultDocument, computeVaultSummary, daysUntil } from "@/lib/tradeVault";

interface Props {
  tradeId: string;
  onOpenVault: () => void;
}

/** Warning banners shown on the trade dashboard home when documents need attention. */
const TradeVaultBanners = ({ tradeId, onOpenVault }: Props) => {
  const [docs, setDocs] = useState<VaultDocument[] | null>(null);
  const [legacyVerified, setLegacyVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [docRes, tradeRes] = await Promise.all([
        supabase
          .from("tradevault_documents")
          .select("*")
          .eq("trade_id", tradeId)
          .eq("is_current", true),
        supabase
          .from("trades")
          .select("verified, verification_status")
          .eq("id", tradeId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setDocs((docRes.data as VaultDocument[]) ?? []);
      const t = tradeRes.data as any;
      setLegacyVerified(!!(t && (t.verified || t.verification_status === "approved")));
    })();
    return () => { cancelled = true; };
  }, [tradeId]);

  if (!docs) return null;
  const summary = computeVaultSummary(docs);

  const banners: { key: string; tone: "red" | "amber"; icon: any; text: string; button: string }[] = [];

  if (summary.expiredRequiredDocs.length > 0) {
    const c = summary.expiredRequiredDocs[0];
    banners.push({
      key: "expired",
      tone: "red",
      icon: ShieldOff,
      text: `Verification paused: Your ${c.label} has expired. Your profile may not be shown to homeowners until this is updated.`,
      button: "Upload Renewal",
    });
  } else if (summary.expiringDocs.length > 0) {
    const { config, days } = summary.expiringDocs[0];
    banners.push({
      key: "expiring",
      tone: "amber",
      icon: Clock,
      text: `Action required: Your ${config.label} expires in ${days} days. Upload your renewal to keep your profile verified.`,
      button: "Update Document",
    });
  } else if (summary.missingRequired.length > 0) {
    banners.push({
      key: "missing",
      tone: "amber",
      icon: AlertTriangle,
      text: legacyVerified
        ? "You're verified — but some documents were approved before TradeVault existed. Please upload copies so your record stays complete and renewal reminders can work."
        : "Action required: Upload your required documents so ProGrafter can verify your profile.",
      button: "Open TradeVault",
    });
  }


  if (banners.length === 0) return null;

  return (
    <div className="space-y-3">
      {banners.map((b) => (
        <div
          key={b.key}
          className="p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap"
          style={
            b.tone === "red"
              ? { backgroundColor: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)", color: "#FCA5A5" }
              : { backgroundColor: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", color: "#FDE68A" }
          }
        >
          <div className="flex items-start gap-2 text-sm">
            <b.icon className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{b.text}</span>
          </div>
          <Button size="sm" onClick={onOpenVault} className="shrink-0">{b.button}</Button>
        </div>
      ))}
    </div>
  );
};

export default TradeVaultBanners;
