import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HardHat } from "lucide-react";
import {
  GENERAL_TRADE_TYPES,
  RENEWABLE_TRADE_TYPES,
  isOtherTradeType,
  tradeTypeSelectionError,
} from "@/lib/tradeTypes";

interface Props {
  tradeId: string;
  onConfirmed: (tradeType: string, tradeTypeOther: string | null) => void;
}

/**
 * One-time, non-dismissible prompt for legacy bulk-migrated accounts that were
 * defaulted to "Other" without the user ever choosing a trade. There is no
 * close button, no overlay click-out and no escape hatch — the only way past
 * it is a real selection (or "Other" plus the required free text).
 */
const ConfirmTradeTypeModal = ({ tradeId, onConfirmed }: Props) => {
  const [tradeType, setTradeType] = useState("");
  const [tradeTypeOther, setTradeTypeOther] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = tradeTypeSelectionError(tradeType, tradeTypeOther);

  const handleSave = async () => {
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    const otherValue = isOtherTradeType(tradeType) ? tradeTypeOther.trim() : null;
    const { error: dbError } = await supabase
      .from("trades")
      .update({
        trade_type: tradeType,
        trade_type_other: otherValue,
        trade_type_confirmation_required: false,
      } as never)
      .eq("id", tradeId);
    setSaving(false);
    if (dbError) {
      console.error(dbError);
      setError("Couldn't save that — please try again.");
      return;
    }
    toast.success("Thanks — your trade type is confirmed");
    onConfirmed(tradeType, otherValue);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-trade-type-title"
    >
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground rounded-xl p-3">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <h2 id="confirm-trade-type-title" className="font-heading text-primary text-2xl">
              Confirm your trade
            </h2>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              We never recorded what trade you do — please tell us before continuing
            </p>
          </div>
        </div>

        <p className="font-mono text-xs text-muted-foreground leading-relaxed">
          Your account was moved over from our old verification queue, so your trade type
          was left blank. It decides which documents and jobs you see, so we need it from
          you rather than guessing.
        </p>

        <div>
          <label className="block font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            Your trade type *
          </label>
          <select
            value={tradeType}
            onChange={(e) => {
              setTradeType(e.target.value);
              setError(null);
            }}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select your trade…</option>
            <optgroup label="General">
              {GENERAL_TRADE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
            <optgroup label="Renewable / Green">
              {RENEWABLE_TRADE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {isOtherTradeType(tradeType) && (
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
              What trade do you do? *
            </label>
            <input
              value={tradeTypeOther}
              onChange={(e) => {
                setTradeTypeOther(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Groundworker, Damp Specialist, Locksmith"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}

        {error && <p className="font-mono text-xs text-destructive">{error}</p>}

        <button
          onClick={handleSave}
          disabled={!!validationError || saving}
          className="w-full bg-primary text-primary-foreground font-mono text-sm px-5 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Confirm my trade"}
        </button>
      </div>
    </div>
  );
};

export default ConfirmTradeTypeModal;
