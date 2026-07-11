import { Star } from "lucide-react";
import { HubBadge } from "@/hub/components/ui";
import {
  opportunityScore,
  opportunityStars,
  scoreTone,
  type Opportunity,
} from "@/hub/data/opportunities";

/** Compact opportunity score — percentage pill + star row. */
export const OpportunityScore = ({
  opportunity,
  size = "md",
}: {
  opportunity: Opportunity;
  size?: "sm" | "md";
}) => {
  const score = opportunityScore(opportunity);
  const stars = opportunityStars(opportunity);
  const tone = scoreTone(score);
  const starPx = size === "sm" ? 13 : 16;

  return (
    <div className="hub-score">
      <div className="hub-score-stars" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i + 1 <= stars;
          const half = !filled && i + 0.5 <= stars;
          return (
            <Star
              key={i}
              size={starPx}
              className={filled ? "hub-star-on" : half ? "hub-star-half" : "hub-star-off"}
              fill={filled ? "currentColor" : "none"}
            />
          );
        })}
      </div>
      <HubBadge tone={tone === "success" ? "success" : tone === "warning" ? "warning" : "neutral"}>
        {score}%
      </HubBadge>
    </div>
  );
};

/** Detailed score breakdown used on the project page. */
export const OpportunityScoreBreakdown = ({ opportunity }: { opportunity: Opportunity }) => {
  const rows: { label: string; value: number }[] = [
    { label: "Distance", value: opportunity.factors.distance },
    { label: "Property type", value: opportunity.factors.propertyType },
    { label: "Planning stage", value: opportunity.factors.planningStage },
    { label: "Trade match", value: opportunity.factors.tradeMatch },
    { label: "Project size", value: opportunity.factors.projectSize },
    { label: "Freshness", value: opportunity.factors.freshness },
  ];
  return (
    <div className="hub-score-breakdown">
      {rows.map((r) => (
        <div key={r.label} className="hub-score-row">
          <span className="hub-score-row-label">{r.label}</span>
          <span className="hub-score-bar">
            <span className="hub-score-bar-fill" style={{ width: `${Math.round(r.value * 100)}%` }} />
          </span>
          <span className="hub-score-row-val">{Math.round(r.value * 100)}</span>
        </div>
      ))}
    </div>
  );
};
