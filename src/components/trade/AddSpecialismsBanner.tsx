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
    <div className="relative bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/20 rounded-2xl p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div className="bg-primary text-primary-foreground rounded-xl p-2.5 flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading text-primary text-lg leading-tight">
            Tell homeowners what you specialise in
          </h3>
          <p className="font-body text-sm text-muted-foreground mt-1 leading-relaxed">
            Add specialisms like Bathrooms, Kitchens or Loft Conversions so the right
            projects come your way. Takes about 30 seconds.
          </p>
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={onAdd}
              className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              Add specialisms
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-2"
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
