import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

/**
 * Compact, platform-wide trust signal. Drop into any page to reinforce
 * ProGrafter's credibility and link back to the full Trust Centre.
 * `tone="light"` for dark backgrounds, `tone="dark"` for light backgrounds.
 */
const TrustSignal = ({
  tone = "dark",
  className = "",
  text = "Every trade is 5-step verified. Fair, capped fees. Two-way reviews.",
}: {
  tone?: "dark" | "light";
  className?: string;
  text?: string;
}) => {
  const isLight = tone === "light";
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center ${className}`}
    >
      <ShieldCheck className={`h-4 w-4 ${isLight ? "text-teal" : "text-teal"}`} />
      <span className={`font-body text-sm ${isLight ? "text-cream/80" : "text-secondary-text"}`}>
        {text}
      </span>
      <Link
        to="/trust"
        className="font-mono text-xs text-teal underline underline-offset-2 hover:text-teal-hover transition-colors"
      >
        See our Trust Centre →
      </Link>
    </div>
  );
};

export default TrustSignal;
