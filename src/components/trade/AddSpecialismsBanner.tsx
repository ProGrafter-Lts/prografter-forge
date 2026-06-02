import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddSpecialismsBannerProps {
  tradeId: string;
  /** Whether the trade has already dismissed/completed the prompt. */
  promptSeen: boolean;
  /** Notify parent so it can switch to the profile section. */
  onAdd: () => void;
}

/**
 * Dismissible banner shown to trades who have not yet flagged any specialisms.
 * Setting `specialisms_prompt_seen = true` permanently hides it.
 */
const AddSpecialismsBanner = ({ tradeId, promptSeen, onAdd }: AddSpecialismsBannerProps) => {
  const [hasSpecialisms, setHasSpecialisms] = useState<boolean | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (promptSeen) {
      setHasSpecialisms(true);
      return;
    }
    let cancelled = false;
    supabase
      .from("trade_specialisms" as any)
      .select("specialism_id", { count: "exact", head: true })
      .eq("trade_id", tradeId)
      .then(({ count }) => {
        if (!cancelled) setHasSpecialisms((count ?? 0) > 0);
      });
    return () => {
      cancelled = true;
    };
  }, [tradeId, promptSeen]);

  const dismiss = async () => {
    setHidden(true);
    await supabase
      .from("trades")
      .update({ specialisms_prompt_seen: true } as any)
      .eq("id", tradeId);
  };

  if (promptSeen || hidden || hasSpecialisms !== false) return null;

  return (
    <div
      className="relative rounded-2xl p-5"
      style={{
        backgroundColor: "rgba(13,148,136,0.10)",
        border: "1px solid rgba(13,148,136,0.35)",
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 hover:opacity-80 transition-opacity"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div
          className="rounded-xl p-2.5 flex-shrink-0"
          style={{ backgroundColor: "#14A8A1", color: "#FFFFFF" }}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading text-lg leading-tight" style={{ color: "#FFFFFF" }}>
            Tell homeowners what you specialise in
          </h3>
          <p className="font-body text-sm mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            Add specialisms like Bathrooms, Kitchens or Loft Conversions so the right
            projects come your way. Takes about 30 seconds.
          </p>
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={onAdd}
              className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#14A8A1", color: "#FFFFFF" }}
            >
              Add specialisms
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="font-mono text-xs uppercase tracking-wider hover:opacity-80 px-3 py-2"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSpecialismsBanner;
