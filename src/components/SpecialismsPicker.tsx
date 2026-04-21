import { useEffect, useMemo, useState } from "react";
import { Specialism, fetchSpecialisms, specialismsForTrade } from "@/lib/specialisms";

interface SpecialismsPickerProps {
  /** Primary trade label, e.g. "Plumber". Used to filter relevant specialisms. */
  tradeType: string;
  /** Currently selected specialism IDs. */
  selected: string[];
  /** ID of the primary specialism, or null. */
  primaryId: string | null;
  onChange: (selected: string[], primaryId: string | null) => void;
  /** Optional max number of selectable specialisms. Default 8. */
  max?: number;
  /** Visual variant: 'dark' for cream/teal onboarding, 'light' for dashboard. */
  variant?: "dark" | "light";
}

const SpecialismsPicker = ({
  tradeType,
  selected,
  primaryId,
  onChange,
  max = 8,
  variant = "dark",
}: SpecialismsPickerProps) => {
  const [all, setAll] = useState<Specialism[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchSpecialisms()
      .then(setAll)
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const relevant = useMemo(() => specialismsForTrade(all, tradeType), [all, tradeType]);
  const visible = showAll ? all : relevant;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      const next = selected.filter((s) => s !== id);
      const nextPrimary = primaryId === id ? null : primaryId;
      onChange(next, nextPrimary);
    } else {
      if (selected.length >= max) return;
      onChange([...selected, id], primaryId);
    }
  };

  const setPrimary = (id: string) => {
    // Auto-select if not already
    const next = selected.includes(id) ? selected : [...selected, id];
    if (next.length > max) return;
    onChange(next, id);
  };

  if (loading) {
    return (
      <p
        className={
          variant === "dark"
            ? "font-mono text-xs text-cream/40"
            : "font-mono text-xs text-muted-foreground"
        }
      >
        Loading specialisms…
      </p>
    );
  }

  const isDark = variant === "dark";
  const cardBase = isDark
    ? "border-cream/10 hover:border-cream/30 bg-cream/5"
    : "border-border hover:border-primary/40 bg-card";
  const cardSelected = isDark
    ? "border-teal bg-teal/10"
    : "border-primary bg-primary/5";
  const labelText = isDark ? "text-cream" : "text-foreground";
  const subText = isDark ? "text-cream/50" : "text-muted-foreground";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className={`font-mono text-xs uppercase tracking-widest ${isDark ? "text-teal" : "text-primary"}`}>
          {selected.length} / {max} selected
        </p>
        {relevant.length < all.length && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className={`font-mono text-xs underline ${isDark ? "text-cream/60 hover:text-cream" : "text-muted-foreground hover:text-foreground"}`}
          >
            {showAll ? "Show recommended only" : "Show all specialisms"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((s) => {
          const isSelected = selected.includes(s.id);
          const isPrimary = primaryId === s.id;
          const atLimit = !isSelected && selected.length >= max;
          return (
            <div
              key={s.id}
              className={`relative rounded-xl border-2 p-4 transition-all ${
                isSelected ? cardSelected : cardBase
              } ${atLimit ? "opacity-40" : ""}`}
            >
              <label
                className={`flex items-start gap-3 ${atLimit ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={atLimit}
                  onChange={() => toggle(s.id)}
                  className={`mt-1 w-4 h-4 rounded flex-shrink-0 ${
                    isDark
                      ? "border-cream/20 bg-cream/5 accent-teal"
                      : "border-border bg-background accent-primary"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-heading text-base leading-tight ${labelText}`}>{s.name}</p>
                  <p className={`font-body text-xs mt-0.5 ${subText}`}>{s.description}</p>
                </div>
              </label>

              {isSelected && (
                <label className={`flex items-center gap-2 mt-3 pt-3 border-t cursor-pointer ${isDark ? "border-cream/10" : "border-border"}`}>
                  <input
                    type="radio"
                    name="primary-specialism"
                    checked={isPrimary}
                    onChange={() => setPrimary(s.id)}
                    className={`w-3.5 h-3.5 ${isDark ? "accent-teal" : "accent-primary"}`}
                  />
                  <span className={`font-mono text-[11px] uppercase tracking-wider ${isPrimary ? (isDark ? "text-teal" : "text-primary") : subText}`}>
                    {isPrimary ? "Primary specialism" : "Make primary"}
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className={`font-mono text-xs ${subText}`}>
          No specialisms match this trade yet. You can show all to pick anyway.
        </p>
      )}
    </div>
  );
};

export default SpecialismsPicker;
