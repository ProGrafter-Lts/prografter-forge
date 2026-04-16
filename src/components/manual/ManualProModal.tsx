import { Lock, X, Shield } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  jobId: string;
  onClose: () => void;
  onPurchased: () => void;
}

const ManualProModal = ({ jobId, onClose, onPurchased }: Props) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // For now, create purchase record directly
      // In production, this would go through Stripe checkout first
      const { error } = await supabase.from("manual_pro_purchases").insert({
        job_id: jobId,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: "Manual Pro unlocked!", description: "All sections are now available." });
      onPurchased();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" />
            <h3 className="font-heading text-primary text-lg">Upgrade to Manual Pro</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <span className="font-heading text-4xl text-primary">£49</span>
            <span className="font-mono text-xs text-muted-foreground ml-1">one-time fee</span>
          </div>

          <p className="font-mono text-xs text-muted-foreground mb-4">
            Unlock all 7 sections of your Homeowner Manual plus the Green Certificate Pack (if applicable):
          </p>

          <ul className="space-y-2 mb-6">
            {[
              "Materials & Specifications — full materials register",
              "Warranties — all warranty details and expiry tracking",
              "Photo Record — all project photos + download as .zip",
              "Maintenance Schedule — tailored to your project type",
              "Green Certificate Pack — bundled PDF for audits",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 font-mono text-xs text-foreground">
                <Lock className="w-3 h-3 text-secondary mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-secondary text-white font-mono text-sm py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Processing…" : "Unlock Manual Pro — £49"}
          </button>

          <p className="font-mono text-[10px] text-muted-foreground text-center mt-3">
            Permanent access for this project. No recurring charges.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualProModal;
