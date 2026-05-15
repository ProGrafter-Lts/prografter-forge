import { BadgeCheck, Info, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface VerifiedTradeBadgeProps {
  tradeType?: string | null;
  cpsScheme?: string | null;
  cpsRegistrationNumber?: string | null;
  gasSafeNumber?: string | null;
  /** Compact rendering for tight spaces (e.g. quote cards) */
  compact?: boolean;
}

const isElectrician = (t?: string | null) =>
  !!t && /electric/i.test(t);
const isGasEngineer = (t?: string | null) =>
  !!t && /gas/i.test(t);

const VETTING_COPY =
  "Every trade on ProGrafter is personally vetted by our founder. We verify insurance, call references by phone, and conduct an interview. For electricians we verify Competent Person Scheme registration. For gas engineers we verify Gas Safe registration. We do not use CSCS cards — they are a commercial site requirement that does not apply to residential work.";

export const VettingInfoTooltip = ({ className }: { className?: string }) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="How we vet our trades"
          className={`inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors ${className ?? ""}`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-xs text-xs leading-relaxed font-mono"
      >
        <p className="font-semibold mb-1.5">How we vet our trades</p>
        <p>{VETTING_COPY}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const VerifiedTradeBadge = ({
  tradeType,
  cpsScheme,
  cpsRegistrationNumber,
  gasSafeNumber,
  compact = false,
}: VerifiedTradeBadgeProps) => {
  let label: React.ReactNode;

  if (isElectrician(tradeType)) {
    const scheme = cpsScheme?.trim() || "CPS Scheme";
    label = (
      <>
        CPS Registered — {scheme} · Domestic installer
      </>
    );
  } else if (isGasEngineer(tradeType)) {
    const number = gasSafeNumber?.trim();
    label = (
      <span className="inline-flex items-center gap-1">
        Gas Safe Registered{number ? ` · ${number}` : ""}
        {number && (
          <a
            href={`https://www.gassaferegister.co.uk/find-an-engineer-or-check-the-register/check-the-register/?RegistrationNumber=${encodeURIComponent(number)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center underline decoration-dotted hover:text-primary"
            onClick={(e) => e.stopPropagation()}
            aria-label="View Gas Safe register entry"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </span>
    );
  } else {
    label = <>ProGrafter Vetted · Insurance verified · References called</>;
  }

  const sizing = compact
    ? "text-[10px] px-2 py-0.5"
    : "text-xs px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-secondary/10 text-secondary rounded-full font-mono ${sizing}`}
    >
      <BadgeCheck className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span className="whitespace-normal">{label}</span>
      <VettingInfoTooltip className="ml-0.5" />
    </span>
  );
};

export default VerifiedTradeBadge;
